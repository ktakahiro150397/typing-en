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

export interface SessionPoint {
  sessionNumber: number
  date: string
  wpm: number
  mode: string
}

export interface SessionStatsResponse {
  sessions: SessionPoint[]
}

export function fetchLifetimeStats(): Promise<LifetimeStats> {
  return apiFetch<LifetimeStats>('/api/stats/lifetime')
}

export function fetchSessionStats(): Promise<SessionStatsResponse> {
  return apiFetch<SessionStatsResponse>('/api/stats/sessions')
}
