import { useEffect, useRef } from 'react'
import type { TypingState } from '../../hooks/useTypingEngine'

interface Props {
  state: TypingState
  onKey: (key: string) => void
}

export function TypingArea({ state, onKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // フォーカスを当ててキーイベントを受け取る
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    // ブラウザデフォルト動作（スクロールなど）を抑制
    if (e.key === ' ') e.preventDefault()
    onKey(e.key)
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none select-none"
      aria-label="タイピングエリア"
    >
      {state.isComplete ? (
        <CompleteBanner misses={state.misses} text={state.text} startedAt={state.startedAt} />
      ) : (
        <TextDisplay state={state} />
      )}
    </div>
  )
}

function TextDisplay({ state }: { state: TypingState }) {
  const { text, typed, cursor } = state

  return (
    <div className="font-mono text-2xl leading-relaxed tracking-wider whitespace-pre-wrap break-all">
      {text.split('').map((char, i) => {
        let className = 'text-gray-500' // 未入力
        if (i < typed.length) {
          // 入力済み: typed[i] と text[i] を比較
          className = typed[i] === char ? 'text-green-400' : 'text-red-400 underline'
        } else if (i === cursor) {
          className = 'text-white bg-gray-600 rounded'
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
