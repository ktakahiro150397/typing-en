import { useState, useEffect, useRef, useCallback } from 'react'
import { useTypingEngine } from './useTypingEngine'
import type { KeyEvent } from './useTypingEngine'

// ---- 分析用型定義 ----

interface ProblemRecord {
  text: string
  keyHistory: KeyEvent[]
  startedAt: number
  endedAt: number
}

export interface WordStat {
  word: string
  misses: number
  missRate: number
}

export interface BigramStat {
  bigram: string
  attempts: number
  misses: number
  missRate: number
}

export interface SessionResult {
  wordStats: WordStat[]
  allWordStats: WordStat[]
  bigramStats: BigramStat[]
  allWordMisses: WordStat[]
  allBigramStats: BigramStat[]
  accuracy: number       // %
  durationMs: number
  wpm: number
  totalKeys: number
  totalMisses: number
}

// ---- セッション状態 ----

export type SessionPhase = 'typing' | 'results'

// ---- 分析ロジック ----

function splitIntoWords(text: string): { word: string; start: number; end: number }[] {
  const result: { word: string; start: number; end: number }[] = []
  let start = 0
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === ' ') {
      if (i > start) {
        result.push({ word: text.slice(start, i), start, end: i })
      }
      start = i + 1
    }
  }
  return result
}

function analyzeProblems(records: ProblemRecord[]): SessionResult {
  let totalKeys = 0
  let totalMisses = 0
  let durationMs = 0

  const wordMissMap: Record<string, { misses: number; length: number }> = {}
  const bigramMap: Record<string, { attempts: number; misses: number }> = {}

  for (const record of records) {
    durationMs += record.endedAt - record.startedAt
    totalKeys += record.keyHistory.length
    totalMisses += record.keyHistory.filter((e) => !e.correct).length

    // Bigram 集計
    for (const event of record.keyHistory) {
      if (event.position > 0) {
        const bigram = record.text[event.position - 1] + record.text[event.position]
        if (!bigramMap[bigram]) bigramMap[bigram] = { attempts: 0, misses: 0 }
        bigramMap[bigram].attempts++
        if (!event.correct) bigramMap[bigram].misses++
      }
    }

    // ワード別ミス集計
    for (const { word, start, end } of splitIntoWords(record.text)) {
      const misses = record.keyHistory.filter(
        (e) => e.position >= start && e.position < end && !e.correct,
      ).length
      if (!wordMissMap[word]) wordMissMap[word] = { misses: 0, length: word.length }
      wordMissMap[word].misses += misses
    }
  }

  const accuracy = totalKeys > 0 ? Math.round(((totalKeys - totalMisses) / totalKeys) * 100) : 100

  // WPM: (正解文字数 / 5) / 経過分
  const totalCorrectChars = records.reduce((sum, r) => sum + r.text.replace(/ $/, '').length, 0)
  const minutes = durationMs / 60000
  const wpm = minutes > 0 ? Math.round(totalCorrectChars / 5 / minutes) : 0

  const allWordStats: WordStat[] = Object.entries(wordMissMap)
    .map(([word, v]) => ({
      word,
      misses: v.misses,
      missRate: v.misses / v.length,
    }))
    .sort((a, b) => b.misses - a.misses)

  const allWordMisses = allWordStats.filter((word) => word.misses > 0)
  const wordStats = allWordMisses.slice(0, 10)

  const allBigramStats: BigramStat[] = Object.entries(bigramMap)
    .map(([bigram, v]) => ({
      bigram,
      attempts: v.attempts,
      misses: v.misses,
      missRate: v.attempts > 0 ? v.misses / v.attempts : 0,
    }))
    .sort((a, b) => b.misses - a.misses)

  const bigramStats = allBigramStats.filter((bigram) => bigram.misses > 0).slice(0, 10)

  return {
    wordStats,
    allWordStats,
    bigramStats,
    allWordMisses,
    allBigramStats,
    accuracy,
    durationMs,
    wpm,
    totalKeys,
    totalMisses,
  }
}

// ---- セッションフック ----

export function useTypingSession(texts: string[]) {
  const [phase, setPhase] = useState<SessionPhase>('typing')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [completedMisses, setCompletedMisses] = useState(0)
  const recordsRef = useRef<ProblemRecord[]>([])
  const handledRef = useRef(false)

  const { state: engineState, handleKey, reset } = useTypingEngine(texts[0] ?? '')

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
      setResult(analyzeProblems(recordsRef.current))
      setPhase('results')
    } else {
      setCurrentIndex(nextIndex)
      reset(texts[nextIndex])
    }
  }, [engineState.isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

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
