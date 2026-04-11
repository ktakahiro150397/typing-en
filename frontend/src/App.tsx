import { useState, useCallback, useEffect, useRef } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { LoginScreen } from './components/LoginScreen/LoginScreen'
import { SentenceManager } from './components/SentenceManager/SentenceManager'
import { PracticeScreen } from './components/PracticeScreen/PracticeScreen'
import { WeakWordManager } from './components/SentenceManager/WeakWordManager'
import type { SessionResult } from './hooks/useTypingSession'
import { generateRandomText } from './utils/textGenerator'
import { useAuthStore } from './stores/authStore'
import { apiFetch } from './lib/api'
import { normalizeSessionText, buildWeakWordPracticeTexts } from './lib/sessionText'
import { saveSession } from './lib/sessions'
import type { Sentence } from './lib/sentences'
import { listWeakWords } from './lib/weakWords'

type SessionMode = 'sentence' | 'random' | 'weak_word'

interface SessionText {
  text: string
  sentenceId: string | null
}

interface SessionConfig {
  mode: SessionMode
  items: SessionText[]
  returnPath: string
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

const RANDOM_TEXT_LENGTH = 30
const MAX_WEAK_WORD_QUESTIONS = 10

function generateRandomSessionItems(): SessionText[] {
  return [{
    text: generateRandomText(RANDOM_TEXT_LENGTH, 'full'),
    sentenceId: null,
  }]
}

function mapSentencesToSessionItems(sentences: Sentence[]): SessionText[] {
  return sentences.map((sentence) => ({
    text: normalizeText(sentence.text),
    sentenceId: sentence.id,
  }))
}

interface AuthMe {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function App() {
  const { user, token, setAuth, clearAuth } = useAuthStore()
  const isMockMode = import.meta.env.VITE_AUTH_MOCK === 'true'
  const [authLoaded, setAuthLoaded] = useState(false)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    if (isMockMode) {
      setAuth({ id: 'mock-user', name: 'Mock User', email: 'mock@example.com' }, 'mock-token')
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

    // Store the callback token before fetching /auth/me
    if (callbackToken) {
      localStorage.setItem('token', callbackToken)
    }

    apiFetch<AuthMe>('/auth/me')
      .then((me) => {
        setAuthError(false)
        setAuth({ id: me.id, name: me.name, email: me.email }, activeToken)
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
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
  user: { id: string; name: string; email: string } | null
  token: string | null
  authError: boolean
  isMockMode: boolean
  onLogout: () => void
}

function AppRouter({ user, token, authError, isMockMode, onLogout }: AppRouterProps) {
  const navigate = useNavigate()
  const location = useLocation()
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

  const handleStartSentenceSession = useCallback((sentences: Sentence[]) => {
    beginSession({
      mode: 'sentence',
      items: mapSentencesToSessionItems(sentences),
      returnPath: '/sentences',
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
    const activeWords = words.filter((word) => !word.isSolved)
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
      items: nextTexts.map((text) => ({ text, sentenceId: null })),
      returnPath: '/weak-words',
    })
  }, [beginSession, isMockMode, token])

  const handleStartRandomSession = useCallback(() => {
    const returnPath = location.pathname === '/weak-words' ? '/weak-words' : '/sentences'
    beginSession({
      mode: 'random',
      items: generateRandomSessionItems(),
      returnPath,
    })
  }, [beginSession, location.pathname])

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
            misses: word.misses,
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
    const returnPath = activeSession?.returnPath ?? '/sentences'
    setActiveSession(null)
    navigate(returnPath)
  }, [activeSession, navigate])

  const handleRestartSession = useCallback(() => {
    if (!lastSessionConfig) return

    if (lastSessionConfig.mode === 'weak_word') {
      void handleStartWeakWordSession()
      return
    }

    const nextConfig = lastSessionConfig.mode === 'random'
      ? {
          ...lastSessionConfig,
          items: generateRandomSessionItems(),
        }
      : lastSessionConfig

    setActiveSession(nextConfig)
    setLastSessionConfig(nextConfig)
    setResultsState(null)
    navigate('/practice')
  }, [handleStartWeakWordSession, lastSessionConfig, navigate])

  const handleGoBackFromResults = useCallback(() => {
    setActiveSession(null)
    navigate(resultsState?.returnPath ?? '/sentences')
  }, [navigate, resultsState?.returnPath])

  const handleLogout = useCallback(() => {
    setActiveSession(null)
    setResultsState(null)
    onLogout()
    navigate('/login', { replace: true })
  }, [navigate, onLogout])

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen error={authError} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sentences" replace />} />
      <Route path="/login" element={<Navigate to="/sentences" replace />} />
      <Route
        path="/sentences"
        element={(
          <SentenceManager
            onStartSession={handleStartSentenceSession}
            onStartRandomSession={handleStartRandomSession}
            onLogout={handleLogout}
            userName={user.name}
          />
        )}
      />
      <Route
        path="/weak-words"
        element={(
          <WeakWordManager
            onStartWeakWordSession={handleStartWeakWordSession}
            onStartRandomSession={handleStartRandomSession}
            isMockMode={isMockMode}
            onLogout={handleLogout}
            userName={user.name}
          />
        )}
      />
      <Route
        path="/practice"
        element={activeSession ? (
          <PracticeScreen
            sessionItems={activeSession.items}
            onComplete={handleSessionComplete}
            onAbort={handleAbortSession}
            onLogout={handleLogout}
            returnPath={activeSession.returnPath}
          />
        ) : resultsState ? (
          <Navigate to="/results" replace />
        ) : (
          <Navigate to="/sentences" replace />
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
            isMockMode={isMockMode}
            onGoBack={handleGoBackFromResults}
            returnLabel={resultsState.returnPath === '/weak-words' ? '苦手ワードへ戻る' : '文章管理へ戻る'}
          />
        ) : activeSession ? (
          <Navigate to="/practice" replace />
        ) : (
          <Navigate to="/sentences" replace />
        )}
      />
      <Route path="*" element={<Navigate to="/sentences" replace />} />
    </Routes>
  )
}
