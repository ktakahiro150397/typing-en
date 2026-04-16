import { apiFetch } from './api'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface Sentence {
  id: string
  text: string
  translation: string | null
  note: string | null
  createdAt: string
  categories: string[]
}

export interface SentenceList {
  sentences: Sentence[]
  total: number
}

export interface ImportResult {
  created: number
  updated: number
  errors: string[]
}

export interface BulkDeleteSentencesResult {
  deletedCount: number
}

export function listSentences(): Promise<SentenceList> {
  return apiFetch<SentenceList>('/api/sentences')
}

export function createSentence(
  text: string,
  translation?: string,
  note?: string,
  categories: string[] = [],
): Promise<Sentence> {
  return apiFetch<Sentence>('/api/sentences', {
    method: 'POST',
    body: JSON.stringify({ text, translation, note, categories }),
  })
}

export async function importSentencesCsv(file: File): Promise<ImportResult> {
  const token = localStorage.getItem('token')
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/api/sentences/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((error as { message: string }).message)
  }
  return res.json() as Promise<ImportResult>
}

export function updateSentence(
  id: string,
  patch: { text?: string; translation?: string; note?: string; categories?: string[] },
): Promise<Sentence> {
  return apiFetch<Sentence>(`/api/sentences/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteSentence(id: string): Promise<void> {
  await apiFetch<void>(`/api/sentences/${id}`, { method: 'DELETE' })
}

export function deleteSentencesByCategories(
  categories: string[],
): Promise<BulkDeleteSentencesResult> {
  return apiFetch<BulkDeleteSentencesResult>('/api/sentences', {
    method: 'DELETE',
    body: JSON.stringify({ categories }),
  })
}
