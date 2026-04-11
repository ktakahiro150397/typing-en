export const SLOW_WORD_MS_PER_CHAR_THRESHOLD = 450
export const STALL_THRESHOLD_MS = 700
const STALL_SCORE_BONUS = 200

export type WeaknessReason = 'mistype' | 'slow' | 'stall'

interface WordWeaknessMetrics {
  word: string
  misses: number
  activeDurationMs: number
  stallCount: number
  stallDurationMs: number
}

export interface SavedWeakWordMetrics {
  missRate: number
  msPerChar: number
  weaknessScore: number
  primaryReason: WeaknessReason | null
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function getReasonComponents(metrics: {
  misses: number
  missRate: number
  msPerChar: number
  stallCount: number
  stallDurationMs: number
}): Record<WeaknessReason, number> {
  return {
    mistype: metrics.misses > 0 ? metrics.missRate * 1000 : 0,
    slow: metrics.msPerChar >= SLOW_WORD_MS_PER_CHAR_THRESHOLD ? metrics.msPerChar : 0,
    stall: metrics.stallCount > 0 || metrics.stallDurationMs >= STALL_THRESHOLD_MS
      ? metrics.stallDurationMs + metrics.stallCount * STALL_SCORE_BONUS
      : 0,
  }
}

export function calculateWeakWordMetrics(word: WordWeaknessMetrics): SavedWeakWordMetrics {
  const missRate = word.word.length > 0 ? word.misses / word.word.length : 0
  const msPerChar = word.word.length > 0 ? word.activeDurationMs / word.word.length : 0
  const reasonComponents = getReasonComponents({
    misses: word.misses,
    missRate,
    msPerChar,
    stallCount: word.stallCount,
    stallDurationMs: word.stallDurationMs,
  })

  const sortedReasons = (Object.entries(reasonComponents) as Array<[WeaknessReason, number]>)
    .filter(([, value]) => value > 0)
    .sort(([, left], [, right]) => right - left)

  return {
    missRate: round(missRate),
    msPerChar: round(msPerChar),
    weaknessScore: round(sortedReasons.reduce((sum, [, value]) => sum + value, 0)),
    primaryReason: sortedReasons[0]?.[0] ?? null,
  }
}
