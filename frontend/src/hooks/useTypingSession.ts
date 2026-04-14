import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_MISS_LOCK_MS, useTypingEngine } from './useTypingEngine'
import { analyzeProblems, type ProblemRecord, type SessionResult } from '../lib/typingAnalysis'
import type { PenaltyResume } from '../lib/settings'

export type {
  BigramStat,
  ProblemRecord,
  SessionResult,
  WeaknessReason,
  WordStat,
} from '../lib/typingAnalysis'

// ---- セッション状態 ----

export type SessionPhase = 'typing' | 'results'

// ---- セッションフック ----

export function useTypingSession(
  texts: string[],
  missLockMs = DEFAULT_MISS_LOCK_MS,
  penaltyResume: PenaltyResume = 'current',
) {
  const [phase, setPhase] = useState<SessionPhase>('typing')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [completedMisses, setCompletedMisses] = useState(0)
  const recordsRef = useRef<ProblemRecord[]>([])
  const handledRef = useRef(false)

  const { state: engineState, handleKey, reset } = useTypingEngine(
    texts[0] ?? '',
    missLockMs,
    penaltyResume,
  )

  // 問題完了を検知して次へ進む
  useEffect(() => {
    if (!engineState.isComplete) {
      handledRef.current = false
      return
    }
    if (handledRef.current) return
    handledRef.current = true

    const record: ProblemRecord = {
      text: engineState.text,
      keyHistory: engineState.keyHistory,
      startedAt: engineState.startedAt ?? Date.now(),
      endedAt: Date.now(),
    }
    recordsRef.current = [...recordsRef.current, record]
    const problemMisses = record.keyHistory.filter((e) => !e.correct).length
    setCompletedMisses((n) => n + problemMisses)

    const nextIndex = currentIndex + 1

    // 即時遷移（遅延なし）
    if (nextIndex >= texts.length) {
      setResult(analyzeProblems(recordsRef.current, missLockMs))
      setPhase('results')
    } else {
      setCurrentIndex(nextIndex)
      reset(texts[nextIndex])
    }
  }, [currentIndex, engineState, missLockMs, reset, texts])

  const restartSession = useCallback(
    (newTexts: string[]) => {
      recordsRef.current = []
      handledRef.current = false
      setPhase('typing')
      setCurrentIndex(0)
      setResult(null)
      setCompletedMisses(0)
      reset(newTexts[0] ?? '')
    },
    [reset],
  )

  return {
    engineState,
    handleKey,
    phase,
    currentIndex,
    totalCount: texts.length,
    result,
    restartSession,
    /** セッション全体の累計ミス数（完了済み問題 + 現在問題） */
    sessionMisses: completedMisses + engineState.misses,
  }
}
