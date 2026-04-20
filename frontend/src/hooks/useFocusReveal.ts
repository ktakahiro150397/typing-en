import { useEffect, useState } from 'react'
import type { KeyEvent } from './useTypingEngine'

interface Options {
  enabled: boolean
  currentMiss: boolean
  keyHistory: KeyEvent[]
  startedAt: number | null
  focusRevealMs: number
}

/**
 * フォーカスモードのブラー解除状態を管理するフック。
 * タイプミス時、または最後のキー入力から focusRevealMs ms 経過時に true を返す。
 */
export function useFocusReveal({
  enabled,
  currentMiss,
  keyHistory,
  startedAt,
  focusRevealMs,
}: Options): boolean {
  const [isTimedOut, setIsTimedOut] = useState(false)

  const lastKeyTimestamp = keyHistory.length > 0 ? keyHistory[keyHistory.length - 1].timestamp : null

  useEffect(() => {
    if (!enabled || !startedAt || lastKeyTimestamp === null) {
      setIsTimedOut(false)
      return
    }

    const elapsed = Date.now() - lastKeyTimestamp
    if (elapsed >= focusRevealMs) {
      setIsTimedOut(true)
      return
    }

    setIsTimedOut(false)
    const id = setTimeout(() => setIsTimedOut(true), focusRevealMs - elapsed)
    return () => clearTimeout(id)
  }, [enabled, startedAt, lastKeyTimestamp, focusRevealMs])

  if (!enabled || !startedAt) return false

  return currentMiss || isTimedOut
}
