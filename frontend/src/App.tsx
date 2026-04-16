import { useState, useCallback, useEffect, useRef } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { LoginScreen } from './components/LoginScreen/LoginScreen'
import { SentenceManager } from './components/SentenceManager/SentenceManager'
import { PracticeScreen } from './components/PracticeScreen/PracticeScreen'
import { HomeScreen } from './components/HomeScreen/HomeScreen'
import { AnalysisScreen } from './components/AnalysisScreen/AnalysisScreen'
import { StatsScreen } from './components/StatsScreen/StatsScreen'
import { SettingsScreen } from './components/SettingsScreen/SettingsScreen'
import type { SessionResult } from './hooks/useTypingSession'
import { useAuthStore } from './stores/authStore'
import { apiFetch } from './lib/api'
import { normalizeSessionText, buildWeakWordPracticeTexts } from './lib/sessionText'
import { saveSession } from './lib/sessions'
import type { Sentence } from './lib/sentences'
import { listWeakWords } from './lib/weakWords'
import { listWeakBigrams, fetchWordsForBigrams } from './lib/bigramStats'
import { fetchPublicPracticeSentences } from './lib/publicSentences'
import { pickSessionSentences } from './lib/sentenceCategories'

type SessionMode = 'sentence' | 'random' | 'weak_word' | 'word_drill'

interface SessionText {
  text: string
  sentenceId: string | null
  translation: string | null
}

interface SessionConfig {
  mode: SessionMode
  items: SessionText[]
  returnPath: string
  isFingering?: boolean
  sourceSentences?: Sentence[]
  sessionCount?: number
  sessionCategories?: string[]
}

interface ResultsState {
  mode: SessionMode
  result: SessionResult
  totalCount: number
  returnPath: string
}

function normalizeText(text: string): string {
  return normalizeSessionText(text)
}

const DEFAULT_PUBLIC_SESSION_COUNT = 5
const MAX_WEAK_WORD_QUESTIONS = 10

function createWordDrillItems(word: string, count: number): SessionText[] {
  const text = normalizeText(word)
  return Array.from({ length: count }, () => ({
    text,
    sentenceId: null,
    translation: null,
  }))
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function mapSentencesToSessionItems(sentences: Sentence[]): SessionText[] {
  return sentences.map((sentence) => ({
    text: normalizeText(sentence.text),
    sentenceId: sentence.id,
    translation: sentence.translation,
  }))
}

interface AuthMe {
  id: string
  name: string
  email: string
  createdAt: string
  isAdmin: boolean
}

export default function App() {
  const { user, token, setAuth, clearAuth } = useAuthStore()
  const isMockMode = import.meta.env.VITE_AUTH_MOCK === 'true'
  const [authLoaded, setAuthLoaded] = useState(false)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    if (isMockMode) {
      setAuth({ id: 'mock-user', name: 'Mock User', email: 'mock@example.com', isAdmin: true }, 'mock-token')
      setAuthLoaded(true)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const callbackToken = params.get('token')
    const errorParam = params.get('error')

    if (errorParam) {
      clearAuth()
      setAuthError(true)
      setAuthLoaded(true)
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    const activeToken = callbackToken ?? token
    if (!activeToken) {
      setAuthLoaded(true)
      return
    }

    if (callbackToken) {
      localStorage.setItem('token', callbackToken)
    }

    apiFetch<AuthMe>('/auth/me')
      .then((me) => {
        setAuthError(false)
        setAuth({ id: me.id, name: me.name, email: me.email, isAdmin: me.isAdmin }, activeToken)
        if (callbackToken) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => setAuthLoaded(true))
  }, [])

  if (!authLoaded) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="app-card flex items-center gap-4 px-6 py-5">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d6e3ed] border-t-[#3ea8ff]" />
          <div>
            <p className="text-sm font-semibold text-slate-900">認証状態を確認しています</p>
            <p className="text-sm text-slate-500">少しお待ちください。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppRouter
        user={user}
        token={token}
        authError={authError}
        isMockMode={isMockMode}
        onLogout={clearAuth}
      />
    </BrowserRouter>
  )
}

interface AppRouterProps {
  user: { id: string; name: string; email: string; isAdmin: boolean } | null
  token: string | null
  authError: boolean
  isMockMode: boolean
  onLogout: () => void
}

function AppRouter({ user, token, authError, isMockMode, onLogout }: AppRouterProps) {
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState<SessionConfig | null>(null)
  const [lastSessionConfig, setLastSessionConfig] = useState<SessionConfig | null>(null)
  const [resultsState, setResultsState] = useState<ResultsState | null>(null)
  const pendingSaveRef = useRef<Promise<void> | null>(null)

  const beginSession = useCallback((config: SessionConfig) => {
    setActiveSession(config)
    setLastSessionConfig(config)
    setResultsState(null)
    navigate('/practice')
  }, [navigate])

  const handleStartSentenceSession = useCallback((
    selectedSentences: Sentence[],
    sourceSentences: Sentence[],
    count: number,
    categories: string[],
  ) => {
    beginSession({
      mode: 'sentence',
      items: mapSentencesToSessionItems(selectedSentences),
      returnPath: '/library',
      sourceSentences,
      sessionCount: count,
      sessionCategories: categories,
    })
  }, [beginSession])

  const handleStartPublicPracticeSession = useCallback(async () => {
    await pendingSaveRef.current

    const { sentences } = await fetchPublicPracticeSentences(DEFAULT_PUBLIC_SESSION_COUNT)
    if (sentences.length === 0) {
      throw new Error('公開練習に使える文章がまだありません')
    }

    beginSession({
      mode: 'sentence',
      items: mapSentencesToSessionItems(sentences),
      returnPath: '/',
      sourceSentences: sentences,
      sessionCount: sentences.length,
      sessionCategories: [],
    })
  }, [beginSession])

  const handleStartWeakWordSession = useCallback(async () => {
    await pendingSaveRef.current

    if (isMockMode) {
      throw new Error('モック認証では苦手ワード機能を利用できません')
    }
    if (!token) {
      throw new Error('認証情報がありません。再ログインしてください。')
    }

    const { words } = await listWeakWords()
    const activeWords = words.filter((word) => !word.isSolved && word.weaknessScore > 0)
    if (activeWords.length === 0) {
      throw new Error('未攻略の苦手ワードがありません。通常練習で追加するか、攻略済みを外してください。')
    }

    const nextTexts = buildWeakWordPracticeTexts(activeWords.map((word) => word.word))
      .slice(0, MAX_WEAK_WORD_QUESTIONS)
    if (nextTexts.length === 0) {
      throw new Error('練習対象の苦手ワードが見つかりませんでした。')
    }

    beginSession({
      mode: 'weak_word',
      items: nextTexts.map((text) => ({ text, sentenceId: null, translation: null })),
      returnPath: '/analysis',
    })
  }, [beginSession, isMockMode, token])

  const handleStartFingeringSession = useCallback(async () => {
    await pendingSaveRef.current

    if (isMockMode) {
      throw new Error('モック認証では苦手運指機能を利用できません')
    }
    if (!token) {
      throw new Error('認証情報がありません。再ログインしてください。')
    }

    const { bigrams } = await listWeakBigrams()
    const topBigrams = bigrams.slice(0, 10)
    if (topBigrams.length === 0) {
      throw new Error('まだ十分な運指データがありません。通常練習を行うとデータが蓄積されます。')
    }

    const { words } = await fetchWordsForBigrams(topBigrams.map((bigram) => bigram.bigram))
    if (words.length < 3) {
      throw new Error(`対象の運指パターンを含む単語が少なすぎます（${words.length}件）。共有問題を増やしてからお試しください。`)
    }

    const shuffled = shuffleArray(words).slice(0, MAX_WEAK_WORD_QUESTIONS * 5)
    const texts = buildWeakWordPracticeTexts(shuffled).slice(0, MAX_WEAK_WORD_QUESTIONS)

    beginSession({
      mode: 'weak_word',
      items: texts.map((text) => ({ text, sentenceId: null, translation: null })),
      returnPath: '/analysis',
      isFingering: true,
    })
  }, [beginSession, isMockMode, token])

  const handleStartWordDrill = useCallback((word: string, count: number) => {
    beginSession({
      mode: 'word_drill',
      items: createWordDrillItems(word, count),
      returnPath: '/analysis',
    })
  }, [beginSession])

  const handleSessionComplete = useCallback((result: SessionResult) => {
    if (!activeSession) return

    const completedSession = activeSession
    setActiveSession(null)
    setResultsState({
      mode: completedSession.mode,
      result,
      totalCount: completedSession.items.length,
      returnPath: completedSession.returnPath,
    })

    navigate('/results')

    if (isMockMode || !token) {
      return
    }

    const savePromise = saveSession({
      mode: completedSession.mode,
      totalKeys: result.totalKeys,
      missKeys: result.totalMisses,
      durationMs: result.durationMs,
      sentenceIds: completedSession.items.flatMap((item) => (item.sentenceId ? [item.sentenceId] : [])),
      words: completedSession.mode === 'random'
        ? []
        : result.allWordStats.map((word) => ({
            word: word.word,
            totalChars: word.totalChars,
            misses: word.misses,
            activeDurationMs: word.activeDurationMs,
            stallCount: word.stallCount,
            stallDurationMs: word.stallDurationMs,
          })),
      bigrams: result.allBigramStats.map((bigram) => ({
        bigram: bigram.bigram,
        attempts: bigram.attempts,
        misses: bigram.misses,
      })),
    }).then(() => undefined).catch((error) => {
      console.error('Failed to save session', error)
    })

    pendingSaveRef.current = savePromise.finally(() => {
      pendingSaveRef.current = null
    })
  }, [activeSession, isMockMode, navigate, token])

  const handleAbortSession = useCallback(() => {
    const returnPath = activeSession?.returnPath ?? '/'
    setActiveSession(null)
    navigate(returnPath)
  }, [activeSession, navigate])

  const handleRestartSession = useCallback(() => {
    if (!lastSessionConfig) return

    if (lastSessionConfig.mode === 'weak_word') {
      if (lastSessionConfig.isFingering) {
        void handleStartFingeringSession()
      } else {
        void handleStartWeakWordSession()
      }
      return
    }

    if (lastSessionConfig.mode === 'sentence' && lastSessionConfig.sourceSentences) {
      const { selectedSentences } = pickSessionSentences(
        lastSessionConfig.sourceSentences,
        lastSessionConfig.sessionCount ?? lastSessionConfig.items.length,
        lastSessionConfig.sessionCategories ?? [],
      )
      const nextConfig = {
        ...lastSessionConfig,
        items: mapSentencesToSessionItems(selectedSentences),
      }
      setActiveSession(nextConfig)
      setLastSessionConfig(nextConfig)
      setResultsState(null)
      navigate('/practice')
      return
    }

    setActiveSession(lastSessionConfig)
    setLastSessionConfig(lastSessionConfig)
    setResultsState(null)
    navigate('/practice')
  }, [handleStartFingeringSession, handleStartWeakWordSession, lastSessionConfig, navigate])

  const handleGoBackFromResults = useCallback(() => {
    setActiveSession(null)
    navigate(resultsState?.returnPath ?? '/')
  }, [navigate, resultsState?.returnPath])

  const handleLogout = useCallback(() => {
    setActiveSession(null)
    setResultsState(null)
    onLogout()
    navigate('/login', { replace: true })
  }, [navigate, onLogout])

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <HomeScreen
            onStartPracticeSession={handleStartPublicPracticeSession}
            onStartWeakWordSession={handleStartWeakWordSession}
            onStartFingeringSession={handleStartFingeringSession}
            isMockMode={isMockMode}
            isAuthenticated={Boolean(user)}
            isAdmin={Boolean(user?.isAdmin)}
            onLogout={user ? handleLogout : undefined}
            userName={user?.name}
          />
        )}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginScreen error={authError} />}
      />
      <Route
        path="/library"
        element={user?.isAdmin ? (
          <SentenceManager
            onStartSession={handleStartSentenceSession}
            onLogout={handleLogout}
            userName={user.name}
          />
        ) : (
          <Navigate to={user ? '/' : '/login'} replace />
        )}
      />
      <Route
        path="/analysis"
        element={user ? (
          <AnalysisScreen
            onStartWeakWordSession={handleStartWeakWordSession}
            onStartWordDrill={handleStartWordDrill}
            onStartFingeringSession={handleStartFingeringSession}
            isMockMode={isMockMode}
            onLogout={handleLogout}
            userName={user.name}
          />
        ) : (
          <Navigate to="/login" replace />
        )}
      />
      <Route
        path="/stats"
        element={user ? (
          <StatsScreen
            onLogout={handleLogout}
            userName={user.name}
          />
        ) : (
          <Navigate to="/login" replace />
        )}
      />
      <Route
        path="/settings"
        element={user ? (
          <SettingsScreen
            onLogout={handleLogout}
            userName={user.name}
          />
        ) : (
          <Navigate to="/login" replace />
        )}
      />
      <Route path="/sentences" element={<Navigate to="/library" replace />} />
      <Route path="/weak-words" element={<Navigate to="/analysis" replace />} />
      <Route path="/fingering" element={<Navigate to="/analysis" replace />} />
      <Route
        path="/practice"
        element={activeSession ? (
          <PracticeScreen
            mode={activeSession.mode}
            sessionItems={activeSession.items}
            onComplete={handleSessionComplete}
            onAbort={handleAbortSession}
            onLogout={user ? handleLogout : undefined}
            canUseSavedSettings={Boolean(user && token)}
            returnPath={activeSession.returnPath}
          />
        ) : resultsState ? (
          <Navigate to="/results" replace />
        ) : (
          <Navigate to="/" replace />
        )}
      />
      <Route
        path="/results"
        element={resultsState ? (
          <ResultsScreen
            mode={resultsState.mode}
            result={resultsState.result}
            totalCount={resultsState.totalCount}
            onRestart={handleRestartSession}
            onStartWeakWordSession={handleStartWeakWordSession}
            canStartWeakWordSession={Boolean(user)}
            isMockMode={isMockMode}
            onGoBack={handleGoBackFromResults}
            returnLabel={
              resultsState.returnPath === '/analysis'
                ? '分析へ戻る'
                : resultsState.returnPath === '/library'
                  ? 'ライブラリへ戻る'
                  : 'ホームへ戻る'
            }
          />
        ) : activeSession ? (
          <Navigate to="/practice" replace />
        ) : (
          <Navigate to="/" replace />
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
