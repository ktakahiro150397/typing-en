import type { KeyEvent } from '../../hooks/useTypingEngine'

interface Props {
  history: KeyEvent[]
}

// 格ゲーのコマンド履歴風に打鍵履歴を表示する
export function CommandHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="text-gray-600 text-sm font-mono text-right">
        — no input —
      </div>
    )
  }

  return (
    <div className="flex flex-row-reverse gap-1 items-center overflow-hidden">
      {[...history].reverse().map((event, i) => (
        <KeyBadge key={i} event={event} opacity={1 - i * 0.04} />
      ))}
    </div>
  )
}

function KeyBadge({ event, opacity }: { event: KeyEvent; opacity: number }) {
  const label = event.key === ' ' ? '␣' : event.key
  const colorClass = event.correct
    ? 'bg-green-800 text-green-200 border-green-600'
    : 'bg-red-900 text-red-200 border-red-600'

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded border font-mono text-sm font-bold ${colorClass}`}
      style={{ opacity: Math.max(opacity, 0.15) }}
    >
      {label}
    </span>
  )
}
