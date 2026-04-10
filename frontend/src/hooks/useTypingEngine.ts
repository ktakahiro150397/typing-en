import { useState, useCallback, useRef } from 'react'

export interface KeyEvent {
  key: string
  correct: boolean
  timestamp: number
}

export interface TypingState {
  text: string
  typed: string
  cursor: number
  misses: number
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
  const textRef = useRef(initialText)

  const handleKey = useCallback((key: string) => {
    setState((prev) => {
      if (prev.isComplete) return prev

      const startedAt = prev.startedAt ?? Date.now()

      // Backspace: 直前の文字を削除
      if (key === 'Backspace') {
        if (prev.cursor === 0) return prev
        const newTyped = prev.typed.slice(0, -1)
        return {
          ...prev,
          typed: newTyped,
          cursor: prev.cursor - 1,
          startedAt,
        }
      }

      // 1文字以外は無視
      if (key.length !== 1) return prev

      const expected = prev.text[prev.cursor]
      const correct = key === expected
      const newTyped = prev.typed + key
      const newCursor = prev.cursor + 1
      const newMisses = correct ? prev.misses : prev.misses + 1

      const event: KeyEvent = {
        key,
        correct,
        timestamp: Date.now(),
      }

      // 最新20件の打鍵履歴を保持
      const newHistory = [...prev.keyHistory, event].slice(-20)

      const isComplete = newCursor >= prev.text.length && correct

      return {
        ...prev,
        typed: newTyped,
        cursor: newCursor,
        misses: newMisses,
        keyHistory: newHistory,
        isComplete,
        startedAt,
      }
    })
  }, [])

  const reset = useCallback((text: string) => {
    textRef.current = text
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
    keyHistory: [],
    isComplete: false,
    startedAt: null,
  }
}
