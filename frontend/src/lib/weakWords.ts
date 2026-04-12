import { apiFetch } from './api'
import type { WeaknessReason } from './typingAnalysis'

export interface WeakWord {
  id: string
  word: string
  missRate: number
  activeDurationMs: number
  msPerChar: number
  stallCount: number
  stallDurationMs: number
  weaknessScore: number
  primaryReason: WeaknessReason | null
  isSolved: boolean
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateWeakWordResponse {
  word: WeakWord
  created: boolean
}

export function listWeakWords(): Promise<{ words: WeakWord[] }> {
  return apiFetch<{ words: WeakWord[] }>('/api/weak-words')
}

export function createWeakWord(word: string, note?: string): Promise<CreateWeakWordResponse> {
  return apiFetch<CreateWeakWordResponse>('/api/weak-words', {
    method: 'POST',
    body: JSON.stringify({
      word,
      ...(note !== undefined ? { note } : {}),
    }),
  })
}

export function updateWeakWord(
  id: string,
  patch: { note?: string; isSolved?: boolean },
): Promise<WeakWord> {
  return apiFetch<WeakWord>(`/api/weak-words/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteWeakWord(id: string): Promise<void> {
  await apiFetch<void>(`/api/weak-words/${id}`, { method: 'DELETE' })
}
