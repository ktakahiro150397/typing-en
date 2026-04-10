import { useEffect } from 'react'
import type { TypingState } from '../../hooks/useTypingEngine'

interface Props {
  state: TypingState
  onKey: (key: string) => void
  lockRemaining: number
}

export function TypingArea({ state, onKey, lockRemaining }: Props) {
  // ブラウザフォーカスで入力受付
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault()
      onKey(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKey])

  return (
    <div className="select-none">
      <TextDisplay state={state} />
      {/* ロックタイマー表示 */}
      <div className="h-6 mt-2 flex items-center justify-end">
        {lockRemaining > 0 && (
          <span className="font-mono text-sm text-red-400 animate-pulse">
            ⛔ {(lockRemaining / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  )
}

function TextDisplay({ state }: { state: TypingState }) {
  const { text, cursor, currentMiss, isComplete } = state

  return (
    <div className="font-mono text-2xl leading-relaxed tracking-wider whitespace-pre-wrap break-all">
      {text.split('').map((char, i) => {
        const isSpace = char === ' '
        const display = isSpace ? '·' : char

        let className: string

        if (isComplete) {
          className = isSpace ? 'text-green-600' : 'text-green-400'
        } else if (i < cursor) {
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
