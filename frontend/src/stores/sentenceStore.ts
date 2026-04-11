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
  importCsv: (files: File[]) => Promise<ImportResult & { failedFiles: File[] }>
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

  importCsv: async (files) => {
    let totalCreated = 0
    let totalSkipped = 0
    const allErrors: string[] = []
    const failedFiles: File[] = []
    const multipleFiles = files.length > 1
    let successfulApiCalls = 0
    for (const file of files) {
      const prefix = multipleFiles ? `[${file.name}] ` : ''
      try {
        const result = await importSentencesCsv(file)
        successfulApiCalls++
        totalCreated += result.created
        totalSkipped += result.skipped
        allErrors.push(...result.errors.map((e) => `${prefix}${e}`))
      } catch (err) {
        failedFiles.push(file)
        allErrors.push(`${prefix}${err instanceof Error ? err.message : String(err)}`)
      }
    }
    // すべてのファイルがリクエストレベルで失敗した場合は再スローして
    // コンポーネント側で赤字エラー表示とファイル選択の保持ができるようにする
    if (successfulApiCalls === 0) {
      throw new Error(allErrors.join('\n'))
    }
    if (totalCreated > 0) {
      try {
        const data = await listSentences()
        set({ sentences: data.sentences, total: data.total })
      } catch (e) {
        allErrors.push(`一覧の更新に失敗しました: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    return { created: totalCreated, skipped: totalSkipped, errors: allErrors, failedFiles }
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
