import type { SentenceList } from './sentences'
import { apiFetch } from './api'

export function fetchPublicPracticeSentences(count = 5): Promise<SentenceList> {
  return apiFetch<SentenceList>(`/api/public/sentences?count=${count}`)
}
