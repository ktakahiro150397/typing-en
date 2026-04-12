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
      <div className="mt-3 flex h-6 items-center justify-end">
        {lockRemaining > 0 && (
          <span className="animate-pulse font-mono text-sm text-rose-600">
            ⛔ {(lockRemaining / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  )
}

function TextDisplay({ state }: { state: TypingState }) {
  const { text, cursor, currentMiss, isComplete } = state

  const groups: Array<
    | { type: 'word'; chars: Array<{ char: string; i: number }> }
    | { type: 'space'; i: number }
  > = []

  let wordBuf: Array<{ char: string; i: number }> = []
  text.split('').forEach((char, i) => {
    if (char === ' ') {
      if (wordBuf.length) {
        groups.push({ type: 'word', chars: wordBuf })
        wordBuf = []
      }
      groups.push({ type: 'space', i })
    } else {
      wordBuf.push({ char, i })
    }
  })
  if (wordBuf.length) groups.push({ type: 'word', chars: wordBuf })

  const getCharClass = (i: number, isSpace: boolean) => {
    if (isComplete || i < cursor)
      return isSpace ? 'text-emerald-500' : 'text-emerald-600'
    if (i === cursor)
      return currentMiss
        ? 'rounded bg-rose-500 px-0.5 text-white animate-pulse'
        : isSpace
          ? 'rounded bg-amber-100 px-0.5 text-amber-700'
          : 'rounded bg-[#e0f2fe] px-0.5 text-[#0369a1]'
    return isSpace ? 'text-amber-500/70' : 'text-slate-300'
  }

  return (
    <div className="whitespace-pre-wrap font-mono text-[2rem] leading-[1.7] tracking-[0.02em] text-slate-900 sm:text-[2.25rem]">
      {groups.map((group) =>
        group.type === 'space' ? (
          <span key={group.i} className={getCharClass(group.i, true)}>
            ·
          </span>
        ) : (
          <span key={group.chars[0].i} className="inline-block">
            {group.chars.map(({ char, i }) => (
              <span key={i} className={getCharClass(i, false)}>
                {char}
              </span>
            ))}
          </span>
        )
      )}
    </div>
  )
}
