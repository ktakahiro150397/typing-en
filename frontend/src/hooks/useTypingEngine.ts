import { useState, useCallback } from 'react'

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
  keyHistory: KeyEvent[]
  isComplete: boolean
  startedAt: number | null
}

export interface TypingEngine {
  state: TypingState
  handleKey: (key: string) => void
  reset: (text: string) => void
}

export function useTypingEngine(initialText: string): TypingEngine {
  const [state, setState] = useState<TypingState>(() => makeInitialState(initialText))

  const handleKey = useCallback((key: string) => {
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
          startedAt,
        }
      }

      if (key.length !== 1) return prev

      const expected = prev.text[prev.cursor]
      const correct = key === expected

      const event: KeyEvent = {
        key,
        correct,
        timestamp: Date.now(),
        position: prev.cursor,
      }
      // 最新100件を保持（分析用に多めに）
      const newHistory = [...prev.keyHistory, event].slice(-100)

      if (!correct) {
        return {
          ...prev,
          misses: prev.misses + 1,
          currentMiss: true,
          keyHistory: newHistory,
          startedAt,
        }
      }

      const newTyped = prev.typed + key
      const newCursor = prev.cursor + 1
      const isComplete = newCursor >= prev.text.length

      return {
        ...prev,
        typed: newTyped,
        cursor: newCursor,
        currentMiss: false,
        keyHistory: newHistory,
        isComplete,
        startedAt,
      }
    })
  }, [])

  const reset = useCallback((text: string) => {
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
    keyHistory: [],
    isComplete: false,
    startedAt: null,
  }
}
