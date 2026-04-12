import { apiFetch } from './api'

export interface SaveSessionRequest {
  mode: 'sentence' | 'random' | 'weak_word' | 'word_drill'
  totalKeys: number
  missKeys: number
  durationMs: number
  sentenceIds: string[]
  words: Array<{
    word: string
    totalChars: number
    misses: number
    activeDurationMs: number
    stallCount: number
    stallDurationMs: number
  }>
  bigrams: Array<{
    bigram: string
    attempts: number
    misses: number
  }>
}

export function saveSession(data: SaveSessionRequest): Promise<{ sessionId: string }> {
  return apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
