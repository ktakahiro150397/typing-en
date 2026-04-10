import { useEffect } from 'react'
import type { TypingState } from '../../hooks/useTypingEngine'

interface Props {
  state: TypingState
  onKey: (key: string) => void
}

export function TypingArea({ state, onKey }: Props) {
  // ブラウザにフォーカスがあれば入力を受け付ける（要素フォーカス不要）
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ブラウザデフォルト動作（スクロール・検索など）を抑制
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
        let className: string

        if (i < cursor) {
          // 正しく入力済み
          className = 'text-green-400'
        } else if (i === cursor) {
          // 現在のカーソル位置
          className = currentMiss
            ? 'text-white bg-red-600 rounded animate-pulse'
            : 'text-white bg-gray-600 rounded'
        } else {
          // 未入力
          className = 'text-gray-500'
        }

        return (
          <span key={i} className={className}>
            {char}
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
    <div className="text-center py-8">
      <p className="text-3xl font-bold text-green-400 mb-4">Complete!</p>
      <div className="flex gap-8 justify-center text-lg text-gray-300">
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
    </div>
  )
}
