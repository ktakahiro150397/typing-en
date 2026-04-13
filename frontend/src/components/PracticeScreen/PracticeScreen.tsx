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
  mode: 'sentence' | 'random' | 'weak_word' | 'word_drill'
  sessionItems: SessionText[]
  onComplete: (result: SessionResult) => void
  onAbort: () => void
  onLogout: () => void
  returnPath: string
}

function getReturnLabel(returnPath: string): string {
  if (returnPath === '/analysis') return '分析へ戻る'
  if (returnPath === '/library') return 'ライブラリへ戻る'
  return 'ホームへ戻る'
}

function getModeLabel(mode: Props['mode']) {
  if (mode === 'weak_word') return 'Weak words'
  if (mode === 'word_drill') return 'Word drill'
  if (mode === 'random') return 'Random'
  return 'Sentence'
}

export function PracticeScreen({
  mode,
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
    () => (mode === 'word_drill'
      ? null
      : getLiveTypingFeedback({
          text: engineState.text,
          keyHistory: engineState.keyHistory,
          startedAt: engineState.startedAt,
          cursor: engineState.cursor,
        })),
    [engineState.cursor, engineState.keyHistory, engineState.startedAt, engineState.text, mode],
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
    <div className="app-page flex flex-col">
      <header className="border-b border-[#d6e3ed]/80 bg-white/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3ea8ff]">typing-en</p>
            <div className="app-chip app-chip-info">{getModeLabel(mode)}</div>
            <button
              onClick={onAbort}
              className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
            >
              {getReturnLabel(returnPath)}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="app-chip app-chip-info">{currentIndex + 1} / {totalCount}</div>
            <div className="app-chip app-chip-danger">misses {sessionMisses}</div>
            <div className="app-chip app-chip-warning">Esc で中断</div>
            <button
              onClick={onLogout}
              className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4 px-5 py-8 lg:px-8">
        <div className="app-card-soft flex min-h-[64px] items-center px-5 py-4">
          {prevText && (
            <div className="truncate font-mono text-sm text-slate-400 line-through">{prevText}</div>
          )}
        </div>

        <div className={`app-card w-full p-6 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ring-2 transition-colors sm:p-8 ${lockRemaining > 0 ? 'ring-rose-300' : 'ring-[#d6e3ed]'}`}>
          <TypingArea state={engineState} onKey={handleKey} lockRemaining={lockRemaining} />
        </div>

        {mode !== 'word_drill' && (
          <div className="min-h-[32px]">
            {liveFeedback && (
              <div
                className={`app-chip ${
                  liveFeedback.reason === 'stall'
                    ? 'app-chip-warning'
                    : 'app-chip-info'
                }`}
              >
                {liveFeedback.message}
              </div>
            )}
          </div>
        )}

        <div className="min-h-[72px]">
          {nextText ? (
            <div className="app-card-soft flex h-full items-center border-dashed px-4 py-4">
              <span className="mr-3 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                NEXT
              </span>
              <span className="truncate font-mono text-sm text-slate-500">{nextText}</span>
            </div>
          ) : isLast ? (
            <div className="app-card-soft flex h-full items-center border-dashed px-4 py-4">
              <span className="mr-3 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                LAST
              </span>
              <span className="text-sm text-slate-500">これが最後の問題です</span>
            </div>
          ) : null}
        </div>

        <div className="app-card flex min-h-[80px] flex-col gap-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Command history</p>
            <p className="text-xs text-slate-400">入力の流れを右から確認できます</p>
          </div>
          <div className="overflow-hidden">
            <CommandHistory history={engineState.keyHistory} />
          </div>
        </div>
      </main>
    </div>
  )
}
