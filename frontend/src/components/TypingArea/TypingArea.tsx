import { useEffect } from 'react'
import type { TypingState } from '../../hooks/useTypingEngine'

interface Props {
  state: TypingState
  onKey: (key: string) => void
}

export function TypingArea({ state, onKey }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault()
      }
      onKey(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKey])

  return (
    <div className="select-none">
      {state.isComplete ? (
        <CompleteBanner misses={state.misses} text={state.text} startedAt={state.startedAt} />
      ) : (
        <TextDisplay state={state} />
      )}
    </div>
  )
}

function TextDisplay({ state }: { state: TypingState }) {
  const { text, cursor, currentMiss } = state

  return (
    <div className="font-mono text-2xl leading-relaxed tracking-wider whitespace-pre-wrap break-all">
      {text.split('').map((char, i) => {
        const isSpace = char === ' '
        const display = isSpace ? '·' : char

        let className: string
        if (i < cursor) {
          className = isSpace ? 'text-green-600' : 'text-green-400'
        } else if (i === cursor) {
          className = currentMiss
            ? 'text-white bg-red-600 rounded animate-pulse'
            : isSpace
              ? 'text-amber-300 bg-gray-600 rounded'
              : 'text-white bg-gray-600 rounded'
        } else {
          className = isSpace ? 'text-amber-500/60' : 'text-gray-500'
        }

        return (
          <span key={i} className={className}>
            {display}
          </span>
        )
      })}
    </div>
  )
}

function CompleteBanner({
  misses,
  text,
  startedAt,
}: {
  misses: number
  text: string
  startedAt: number | null
}) {
  const seconds = startedAt ? (Date.now() - startedAt) / 1000 : 0
  const accuracy = Math.round(((text.length - misses) / text.length) * 100)

  return (
    <div className="text-center py-6">
      <p className="text-2xl font-bold text-green-400 mb-3">Complete!</p>
      <div className="flex gap-8 justify-center text-base text-gray-300">
        <span>
          精度 <strong className="text-white">{accuracy}%</strong>
        </span>
        <span>
          ミス <strong className="text-red-400">{misses}</strong>
        </span>
        <span>
          時間 <strong className="text-white">{seconds.toFixed(1)}s</strong>
        </span>
      </div>
      <p className="text-gray-500 text-sm mt-3 animate-pulse">次の問題へ移動中...</p>
    </div>
  )
}
