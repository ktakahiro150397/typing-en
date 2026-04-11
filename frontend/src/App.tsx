import { useState, useCallback, useEffect } from 'react'
import { TypingArea } from './components/TypingArea/TypingArea'
import { CommandHistory } from './components/CommandHistory/CommandHistory'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { LoginScreen } from './components/LoginScreen/LoginScreen'
import { SentenceManager } from './components/SentenceManager/SentenceManager'
import { useTypingSession } from './hooks/useTypingSession'
import { generateWordSequence } from './utils/textGenerator'
import { useAuthStore } from './stores/authStore'
import { apiFetch } from './lib/api'

type Screen = 'manager' | 'game'

function normalizeText(text: string): string {
  const t = text.trim()
  return t.endsWith('.') ? t : t + ' '
}

function generateSessionTexts(count: number): string[] {
  return Array.from({ length: count }, () => normalizeText(generateWordSequence(5)))
}

const DEFAULT_COUNT = 3

interface AuthMe {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function App() {
  const { user, token, setAuth, clearAuth } = useAuthStore()
  const [authLoaded, setAuthLoaded] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [screen, setScreen] = useState<Screen>('manager')

  // Handle OAuth callback token and session restore on mount
  useEffect(() => {
    // Debug: bypass Google OAuth with a dummy account
    if (import.meta.env.VITE_AUTH_MOCK === 'true') {
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
      window.history.replaceState(null, '', '/')
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
        setAuth({ id: me.id, name: me.name, email: me.email }, activeToken)
        if (callbackToken) {
          window.history.replaceState(null, '', '/')
        }
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => setAuthLoaded(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [texts, setTexts] = useState<string[]>(() => generateSessionTexts(DEFAULT_COUNT))

  const { engineState, handleKey, phase, currentIndex, totalCount, result, restartSession, sessionMisses } =
    useTypingSession(texts)

  // ロック残り時間（App側で持ち、枠色制御と TypingArea 表示に使う）
  const [lockRemaining, setLockRemaining] = useState(0)
  useEffect(() => {
    if (!engineState.lockedUntil) { setLockRemaining(0); return }
    const tick = () => setLockRemaining(Math.max(0, engineState.lockedUntil! - Date.now()))
    tick()
    const id = setInterval(tick, 50)
    return () => clearInterval(id)
  }, [engineState.lockedUntil])

  const handleRestart = useCallback(() => {
    const next = generateSessionTexts(DEFAULT_COUNT)
    setTexts(next)
    restartSession(next)
  }, [restartSession])

  const handleStartSession = useCallback((sessionTexts: string[]) => {
    setTexts(sessionTexts)
    restartSession(sessionTexts)
    setScreen('game')
  }, [restartSession])

  const handleLogout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginScreen error={authError} />
  }

  if (screen === 'manager') {
    return (
      <SentenceManager
        onStartSession={handleStartSession}
        onLogout={handleLogout}
        userName={user.name}
      />
    )
  }

  if (phase === 'results' && result) {
    return (
      <ResultsScreen
        result={result}
        totalCount={totalCount}
        onRestart={handleRestart}
        onGoToManager={() => setScreen('manager')}
      />
    )
  }

  const prevText = currentIndex > 0 ? texts[currentIndex - 1] : null
  const nextText = currentIndex < texts.length - 1 ? texts[currentIndex + 1] : null
  const isLast = currentIndex === totalCount - 1

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-wide">typing-en</h1>
          <button
            onClick={() => setScreen('manager')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            文章管理
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{currentIndex + 1} / {totalCount}</span>
          <span className="text-red-400 font-mono">
            misses: <strong>{sessionMisses}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-3 max-w-3xl mx-auto w-full">

        {/* 前の問題 — 固定高さ */}
        <div className="w-full h-8 overflow-hidden flex items-center">
          {prevText && (
            <div className="font-mono text-sm text-gray-600 line-through truncate">{prevText}</div>
          )}
        </div>

        {/* 現在の問題 */}
        <div className={`w-full bg-gray-800 rounded-xl p-8 shadow-lg ring-2 transition-colors ${lockRemaining > 0 ? 'ring-red-600' : 'ring-gray-600'}`}>
          <TypingArea state={engineState} onKey={handleKey} lockRemaining={lockRemaining} />
        </div>

        {/* 次の問題 — 固定高さ */}
        <div className="w-full h-14 overflow-hidden">
          {nextText ? (
            <div className="h-full flex items-center bg-gray-800/40 rounded-lg px-4 border border-dashed border-gray-600">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-3 shrink-0">
                NEXT
              </span>
              <span className="font-mono text-sm text-gray-400 truncate">{nextText}</span>
            </div>
          ) : isLast ? (
            <div className="h-full flex items-center bg-gray-800/40 rounded-lg px-4 border border-dashed border-indigo-800">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mr-3 shrink-0">
                LAST
              </span>
              <span className="text-sm text-gray-500">これが最後の問題です</span>
            </div>
          ) : null}
        </div>

        {/* コマンド履歴 — 固定高さ・折り返しなし */}
        <div className="w-full bg-gray-800 rounded-xl px-4 h-12 flex items-center overflow-hidden">
          <CommandHistory history={engineState.keyHistory} />
        </div>
      </main>
    </div>
  )
}
