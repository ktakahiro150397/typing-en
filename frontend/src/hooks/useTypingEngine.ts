import { useState, useCallback, useRef } from 'react'
import type { PenaltyResume } from '../lib/settings'

export interface KeyEvent {
  key: string
  correct: boolean
  timestamp: number
  /** そのとき入力しようとしていたテキスト上の位置 */
  position: number
}

export interface TypingState {
  text: string
  /** 正しく入力済みの文字列。length === cursor */
  typed: string
  cursor: number
  misses: number
  currentMiss: boolean
  /** 入力ロック解除時刻 (ms)。null = ロックなし */
  lockedUntil: number | null
  keyHistory: KeyEvent[]
  isComplete: boolean
  startedAt: number | null
}

export interface TypingEngine {
  state: TypingState
  handleKey: (key: string) => void
  reset: (text: string) => void
}

export const DEFAULT_MISS_LOCK_MS = 1000
export const MISS_LOCK_MS = DEFAULT_MISS_LOCK_MS

export function rewindToWordStart(text: string, cursor: number): number {
  let wordStart = cursor
  while (wordStart > 0 && text[wordStart - 1] !== ' ') {
    wordStart -= 1
  }
  return wordStart
}

export function useTypingEngine(
  initialText: string,
  missLockMs = DEFAULT_MISS_LOCK_MS,
  penaltyResume: PenaltyResume = 'current',
): TypingEngine {
  const [state, setState] = useState<TypingState>(() => makeInitialState(initialText))
  // ロック判定を setState の外で行うためのref
  const lockedUntilRef = useRef<number>(0)

  const handleKey = useCallback((key: string) => {
    // ロック中は文字入力を無視（Backspaceは許可）
    if (key !== 'Backspace' && key.length === 1 && Date.now() < lockedUntilRef.current) return

    setState((prev) => {
      if (prev.isComplete) return prev

      const startedAt = prev.startedAt ?? Date.now()

      if (key === 'Backspace') {
        if (prev.cursor === 0) return { ...prev, currentMiss: false }
        return {
          ...prev,
          typed: prev.typed.slice(0, -1),
          cursor: prev.cursor - 1,
          currentMiss: false,
          lockedUntil: null,
          startedAt,
        }
      }

      if (key.length !== 1) return prev

      const expected = prev.text[prev.cursor]
      const correct = key === expected

      const event: KeyEvent = { key, correct, timestamp: Date.now(), position: prev.cursor }
      const newHistory = [...prev.keyHistory, event]

      if (!correct) {
        const lockEnd = missLockMs > 0 ? Date.now() + missLockMs : null
        lockedUntilRef.current = lockEnd ?? 0

        if (penaltyResume === 'word') {
          const cursor = rewindToWordStart(prev.text, prev.cursor)
          return {
            ...prev,
            typed: prev.text.slice(0, cursor),
            cursor,
            misses: prev.misses + 1,
            currentMiss: true,
            lockedUntil: lockEnd,
            keyHistory: newHistory,
            startedAt,
          }
        }

        return {
          ...prev,
          misses: prev.misses + 1,
          currentMiss: true,
          lockedUntil: lockEnd,
          keyHistory: newHistory,
          startedAt,
        }
      }

      // 正解: ロック解除 + カーソル前進
      lockedUntilRef.current = 0
      const newTyped = prev.typed + key
      const newCursor = prev.cursor + 1
      const isComplete = newCursor >= prev.text.length

      return {
        ...prev,
        typed: newTyped,
        cursor: newCursor,
        currentMiss: false,
        lockedUntil: null,
        keyHistory: newHistory,
        isComplete,
        startedAt,
      }
    })
  }, [missLockMs, penaltyResume])

  const reset = useCallback((text: string) => {
    lockedUntilRef.current = 0
    setState(makeInitialState(text))
  }, [])

  return { state, handleKey, reset }
}

function makeInitialState(text: string): TypingState {
  return {
    text,
    typed: '',
    cursor: 0,
    misses: 0,
    currentMiss: false,
    lockedUntil: null,
    keyHistory: [],
    isComplete: false,
    startedAt: null,
  }
}
