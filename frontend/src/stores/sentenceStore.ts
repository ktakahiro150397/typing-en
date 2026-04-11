import { create } from 'zustand'
import type { Sentence, ImportResult } from '../lib/sentences'
import {
  listSentences,
  createSentence,
  importSentencesCsv,
  updateSentence,
  deleteSentence,
} from '../lib/sentences'

interface SentenceState {
  sentences: Sentence[]
  total: number
  loading: boolean
  error: string | null
  fetchSentences: () => Promise<void>
  addSentence: (text: string, note?: string) => Promise<void>
  importCsv: (file: File) => Promise<ImportResult>
  patchSentence: (id: string, patch: { text?: string; note?: string }) => Promise<void>
  removeSentence: (id: string) => Promise<void>
}

export const useSentenceStore = create<SentenceState>((set, get) => ({
  sentences: [],
  total: 0,
  loading: false,
  error: null,

  fetchSentences: async () => {
    set({ loading: true, error: null })
    try {
      const data = await listSentences()
      set({ sentences: data.sentences, total: data.total, loading: false })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  addSentence: async (text, note) => {
    const sentence = await createSentence(text, note)
    set((s) => ({ sentences: [sentence, ...s.sentences], total: s.total + 1 }))
  },

  importCsv: async (file) => {
    const result = await importSentencesCsv(file)
    if (result.created > 0) {
      await get().fetchSentences()
    }
    return result
  },

  patchSentence: async (id, patch) => {
    const updated = await updateSentence(id, patch)
    set((s) => ({
      sentences: s.sentences.map((sen) => (sen.id === id ? updated : sen)),
    }))
  },

  removeSentence: async (id) => {
    set((s) => ({
      sentences: s.sentences.filter((sen) => sen.id !== id),
      total: s.total - 1,
    }))
    try {
      await deleteSentence(id)
    } catch (e) {
      await get().fetchSentences()
      throw e
    }
  },
}))
