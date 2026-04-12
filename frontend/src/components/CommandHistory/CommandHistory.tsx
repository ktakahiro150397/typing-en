import type { KeyEvent } from '../../hooks/useTypingEngine'

interface Props {
  history: KeyEvent[]
}

// 格ゲーのコマンド履歴風に打鍵履歴を表示する
export function CommandHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="text-right font-mono text-sm text-slate-300">
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
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-600'

  return (
    <span
      className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 font-mono text-sm font-bold ${colorClass}`}
      style={{ opacity: Math.max(opacity, 0.15) }}
    >
      {label}
    </span>
  )
}
