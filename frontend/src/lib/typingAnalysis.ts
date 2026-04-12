import { MISS_LOCK_MS, type KeyEvent } from '../hooks/useTypingEngine'

export const SLOW_WORD_MS_PER_CHAR_THRESHOLD = 450
export const STALL_THRESHOLD_MS = 700
const STALL_SCORE_BONUS = 200

export type WeaknessReason = 'mistype' | 'slow' | 'stall'

export interface ProblemRecord {
  text: string
  keyHistory: KeyEvent[]
  startedAt: number
  endedAt: number
}

export interface WordStat {
  word: string
  totalChars: number
  misses: number
  missRate: number
  activeDurationMs: number
  msPerChar: number
  stallCount: number
  stallDurationMs: number
  weaknessReasons: WeaknessReason[]
  weaknessScore: number
  primaryReason: WeaknessReason | null
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
  accuracy: number
  durationMs: number
  wpm: number
  totalKeys: number
  totalMisses: number
}

export interface LiveTypingFeedback {
  word: string
  reason: 'slow' | 'stall'
  message: string
}

interface WordRange {
  word: string
  start: number
  end: number
}

interface WordAggregate {
  word: string
  totalChars: number
  misses: number
  activeDurationMs: number
  stallCount: number
  stallDurationMs: number
}

interface WordWeaknessMetrics {
  misses: number
  missRate: number
  msPerChar: number
  stallCount: number
  stallDurationMs: number
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function splitIntoWords(text: string): WordRange[] {
  const result: WordRange[] = []
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

function buildWordPositionMap(text: string, words: WordRange[]): Array<number | null> {
  const positionMap = Array<number | null>(text.length).fill(null)

  words.forEach((word, index) => {
    for (let position = word.start; position < word.end; position += 1) {
      positionMap[position] = index
    }

    if (word.end < text.length && text[word.end] === ' ') {
      positionMap[word.end] = index
    }
  })

  return positionMap
}

function createWordAggregate(word: WordRange): WordAggregate {
  return {
    word: word.word,
    totalChars: word.word.length,
    misses: 0,
    activeDurationMs: 0,
    stallCount: 0,
    stallDurationMs: 0,
  }
}

function getWordIndexAtPosition(positionMap: Array<number | null>, position: number): number | null {
  if (positionMap.length === 0) return null
  const safePosition = Math.min(Math.max(position, 0), positionMap.length - 1)
  return positionMap[safePosition]
}

function applyEventToWordAggregate(
  aggregate: WordAggregate,
  event: KeyEvent,
  adjustedGap: number,
) {
  aggregate.activeDurationMs += adjustedGap
  if (adjustedGap >= STALL_THRESHOLD_MS) {
    aggregate.stallCount += 1
    aggregate.stallDurationMs += adjustedGap
  }
  if (!event.correct) {
    aggregate.misses += 1
  }
}

function getReasonComponents(metrics: WordWeaknessMetrics): Record<WeaknessReason, number> {
  return {
    mistype: metrics.misses > 0 ? metrics.missRate * 1000 : 0,
    slow: metrics.msPerChar >= SLOW_WORD_MS_PER_CHAR_THRESHOLD ? metrics.msPerChar : 0,
    stall: metrics.stallCount > 0 || metrics.stallDurationMs >= STALL_THRESHOLD_MS
      ? metrics.stallDurationMs + metrics.stallCount * STALL_SCORE_BONUS
      : 0,
  }
}

export function getWeaknessReasons(metrics: WordWeaknessMetrics): WeaknessReason[] {
  const components = getReasonComponents(metrics)
  return (Object.entries(components) as Array<[WeaknessReason, number]>)
    .filter(([, value]) => value > 0)
    .sort(([, left], [, right]) => right - left)
    .map(([reason]) => reason)
}

export function getPrimaryWeaknessReason(metrics: WordWeaknessMetrics): WeaknessReason | null {
  const reasons = getWeaknessReasons(metrics)
  return reasons[0] ?? null
}

export function calculateWeaknessScore(metrics: WordWeaknessMetrics): number {
  const components = getReasonComponents(metrics)
  return round(components.mistype + components.slow + components.stall)
}

export function formatWeaknessReason(reason: WeaknessReason): string {
  switch (reason) {
    case 'mistype':
      return 'ミス'
    case 'slow':
      return '遅い'
    case 'stall':
      return '停止'
  }
}

function finalizeWordStat(aggregate: WordAggregate): WordStat {
  const missRate = aggregate.totalChars > 0 ? aggregate.misses / aggregate.totalChars : 0
  const msPerChar = aggregate.totalChars > 0 ? aggregate.activeDurationMs / aggregate.totalChars : 0
  const metrics = {
    misses: aggregate.misses,
    missRate,
    msPerChar,
    stallCount: aggregate.stallCount,
    stallDurationMs: aggregate.stallDurationMs,
  }

  return {
    word: aggregate.word,
    totalChars: aggregate.totalChars,
    misses: aggregate.misses,
    missRate: round(missRate),
    activeDurationMs: aggregate.activeDurationMs,
    msPerChar: round(msPerChar),
    stallCount: aggregate.stallCount,
    stallDurationMs: aggregate.stallDurationMs,
    weaknessReasons: getWeaknessReasons(metrics),
    weaknessScore: calculateWeaknessScore(metrics),
    primaryReason: getPrimaryWeaknessReason(metrics),
  }
}

function compareWordStats(left: WordStat, right: WordStat): number {
  return right.weaknessScore - left.weaknessScore
    || right.misses - left.misses
    || right.stallDurationMs - left.stallDurationMs
    || right.activeDurationMs - left.activeDurationMs
    || left.word.localeCompare(right.word)
}

export function analyzeProblems(records: ProblemRecord[]): SessionResult {
  let totalKeys = 0
  let totalMisses = 0
  let durationMs = 0

  const wordMap = new Map<string, WordAggregate>()
  const bigramMap = new Map<string, { attempts: number; misses: number }>()

  for (const record of records) {
    durationMs += record.endedAt - record.startedAt
    totalKeys += record.keyHistory.length
    totalMisses += record.keyHistory.filter((event) => !event.correct).length

    const words = splitIntoWords(record.text)
    const wordPositionMap = buildWordPositionMap(record.text, words)

    for (const word of words) {
      const existing = wordMap.get(word.word)
      if (existing) {
        existing.totalChars += word.word.length
      } else {
        wordMap.set(word.word, createWordAggregate(word))
      }
    }

    let previousTimestamp = record.startedAt
    let previousWasMiss = false

    for (const event of record.keyHistory) {
      if (event.position > 0) {
        const bigram = record.text[event.position - 1] + record.text[event.position]
        const current = bigramMap.get(bigram) ?? { attempts: 0, misses: 0 }
        current.attempts += 1
        if (!event.correct) current.misses += 1
        bigramMap.set(bigram, current)
      }

      const rawGap = Math.max(0, event.timestamp - previousTimestamp)
      const adjustedGap = previousWasMiss ? Math.max(0, rawGap - MISS_LOCK_MS) : rawGap
      const wordIndex = getWordIndexAtPosition(wordPositionMap, event.position)
      if (wordIndex !== null && wordIndex !== undefined) {
        const word = words[wordIndex]
        const aggregate = wordMap.get(word.word)
        if (!aggregate) {
          continue
        }
        applyEventToWordAggregate(aggregate, event, adjustedGap)
      }

      previousTimestamp = event.timestamp
      previousWasMiss = !event.correct
    }
  }

  const accuracy = totalKeys > 0 ? Math.round(((totalKeys - totalMisses) / totalKeys) * 100) : 100
  const totalCorrectChars = records.reduce((sum, record) => sum + record.text.replace(/ $/, '').length, 0)
  const minutes = durationMs / 60000
  const wpm = minutes > 0 ? Math.round(totalCorrectChars / 5 / minutes) : 0

  const allWordStats = [...wordMap.values()]
    .map(finalizeWordStat)
    .sort(compareWordStats)

  const wordStats = allWordStats
    .filter((word) => word.weaknessReasons.length > 0)
    .slice(0, 10)

  const allWordMisses = allWordStats.filter((word) => word.misses > 0)

  const allBigramStats: BigramStat[] = [...bigramMap.entries()]
    .map(([bigram, value]) => ({
      bigram,
      attempts: value.attempts,
      misses: value.misses,
      missRate: value.attempts > 0 ? round(value.misses / value.attempts) : 0,
    }))
    .sort((left, right) => right.misses - left.misses || right.attempts - left.attempts)

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

export function getLiveTypingFeedback(params: {
  text: string
  keyHistory: KeyEvent[]
  startedAt: number | null
  cursor: number
}): LiveTypingFeedback | null {
  const { text, keyHistory, startedAt, cursor } = params
  if (startedAt === null || keyHistory.length === 0 || text.length === 0) {
    return null
  }

  const words = splitIntoWords(text)
  if (words.length === 0) {
    return null
  }

  const wordPositionMap = buildWordPositionMap(text, words)
  const currentWordIndex = getWordIndexAtPosition(wordPositionMap, cursor)
  if (currentWordIndex === null) {
    return null
  }

  const currentWord = words[currentWordIndex]
  const aggregate = createWordAggregate(currentWord)
  let previousTimestamp = startedAt
  let previousWasMiss = false

  for (const event of keyHistory) {
    const rawGap = Math.max(0, event.timestamp - previousTimestamp)
    const adjustedGap = previousWasMiss ? Math.max(0, rawGap - MISS_LOCK_MS) : rawGap

    if (getWordIndexAtPosition(wordPositionMap, event.position) === currentWordIndex) {
      applyEventToWordAggregate(aggregate, event, adjustedGap)
    }

    previousTimestamp = event.timestamp
    previousWasMiss = !event.correct
  }

  const wordStat = finalizeWordStat(aggregate)
  if (wordStat.stallCount > 0) {
    return {
      word: wordStat.word,
      reason: 'stall',
      message: `「${wordStat.word}」で少し止まりました`,
    }
  }
  if (wordStat.msPerChar >= SLOW_WORD_MS_PER_CHAR_THRESHOLD) {
    return {
      word: wordStat.word,
      reason: 'slow',
      message: `「${wordStat.word}」は少しゆっくりです`,
    }
  }

  return null
}
