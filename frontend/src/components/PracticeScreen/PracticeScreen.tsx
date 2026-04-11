import { useEffect, useMemo, useRef, useState } from 'react'
import { CommandHistory } from '../CommandHistory/CommandHistory'
import { TypingArea } from '../TypingArea/TypingArea'
import { useTypingSession, type SessionResult } from '../../hooks/useTypingSession'
import { getLiveTypingFeedback } from '../../lib/typingAnalysis'

interface SessionText {
  text: string
  sentenceId: string | null
}

interface Props {
  sessionItems: SessionText[]
  onComplete: (result: SessionResult) => void
  onAbort: () => void
  onLogout: () => void
  returnPath: string
}

function getReturnLabel(returnPath: string): string {
  return returnPath === '/weak-words' ? '苦手ワードへ戻る' : '文章管理へ戻る'
}

export function PracticeScreen({
  sessionItems,
  onComplete,
  onAbort,
  onLogout,
  returnPath,
}: Props) {
  const texts = sessionItems.map((item) => item.text)
  const { engineState, handleKey, phase, currentIndex, totalCount, result, sessionMisses } = useTypingSession(texts)
  const [lockRemaining, setLockRemaining] = useState(0)
  const completedRef = useRef(false)
  const liveFeedback = useMemo(
    () => getLiveTypingFeedback({
      text: engineState.text,
      keyHistory: engineState.keyHistory,
      startedAt: engineState.startedAt,
      cursor: engineState.cursor,
    }),
    [engineState.cursor, engineState.keyHistory, engineState.startedAt, engineState.text],
  )

  useEffect(() => {
    if (!engineState.lockedUntil) {
      setLockRemaining(0)
      return
    }

    const tick = () => setLockRemaining(Math.max(0, engineState.lockedUntil! - Date.now()))
    tick()
    const id = setInterval(tick, 50)
    return () => clearInterval(id)
  }, [engineState.lockedUntil])

  useEffect(() => {
    if (phase !== 'results' || !result || completedRef.current) return
    completedRef.current = true
    onComplete(result)
  }, [onComplete, phase, result])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onAbort()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onAbort])

  const prevText = currentIndex > 0 ? texts[currentIndex - 1] : null
  const nextText = currentIndex < texts.length - 1 ? texts[currentIndex + 1] : null
  const isLast = currentIndex === totalCount - 1

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-wide">typing-en</h1>
          <button
            onClick={onAbort}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {getReturnLabel(returnPath)}
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{currentIndex + 1} / {totalCount}</span>
          <span className="text-red-400 font-mono">
            misses: <strong>{sessionMisses}</strong>
          </span>
          <span className="text-gray-500">Esc: 中断</span>
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-3 max-w-3xl mx-auto w-full">
        <div className="w-full h-8 overflow-hidden flex items-center">
          {prevText && (
            <div className="font-mono text-sm text-gray-600 line-through truncate">{prevText}</div>
          )}
        </div>

        <div className={`w-full bg-gray-800 rounded-xl p-8 shadow-lg ring-2 transition-colors ${lockRemaining > 0 ? 'ring-red-600' : 'ring-gray-600'}`}>
          <TypingArea state={engineState} onKey={handleKey} lockRemaining={lockRemaining} />
        </div>

        <div className="w-full h-8">
          {liveFeedback && (
            <div
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors ${
                liveFeedback.reason === 'stall'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-sky-500/40 bg-sky-500/10 text-sky-300'
              }`}
            >
              {liveFeedback.message}
            </div>
          )}
        </div>

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

        <div className="w-full bg-gray-800 rounded-xl px-4 h-12 flex items-center overflow-hidden">
          <CommandHistory history={engineState.keyHistory} />
        </div>
      </main>
    </div>
  )
}
