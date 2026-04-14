import { apiFetch } from './api'

export interface LifetimeStats {
  totalKeys: number
  totalMissKeys: number
  totalDurationMs: number
  totalSessions: number
  averageWpm: number
  bestWpm: number
  uniqueWordCount: number
  weakWordTotal: number
  weakWordSolved: number
}

export function fetchLifetimeStats(): Promise<LifetimeStats> {
  return apiFetch<LifetimeStats>('/api/stats/lifetime')
}
