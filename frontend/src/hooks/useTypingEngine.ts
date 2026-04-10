import { useState, useCallback } from 'react'

export interface KeyEvent {
  key: string
  correct: boolean
  timestamp: number
}

export interface TypingState {
  text: string
  /** 正しく入力済みの文字列。length === cursor */
  typed: string
  cursor: number
  misses: number
  /** 直前のキー入力がミスだったか（カーソル位置の赤表示用） */
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

      // Backspace: 1文字戻る
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

      // 1文字以外は無視
      if (key.length !== 1) return prev

      const expected = prev.text[prev.cursor]
      const correct = key === expected

      const event: KeyEvent = { key, correct, timestamp: Date.now() }
      const newHistory = [...prev.keyHistory, event].slice(-20)

      if (!correct) {
        // ミス: カーソルを進めない
        return {
          ...prev,
          misses: prev.misses + 1,
          currentMiss: true,
          keyHistory: newHistory,
          startedAt,
        }
      }

      // 正解: カーソルを進める
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
