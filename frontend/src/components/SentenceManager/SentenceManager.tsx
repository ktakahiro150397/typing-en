import { useCallback, useEffect, useState } from 'react'
import { useSentenceStore } from '../../stores/sentenceStore'
import { SentenceList } from './SentenceList'
import { SentenceForm } from './SentenceForm'
import { CsvImport } from './CsvImport'
import { StartSessionModal } from './StartSessionModal'
import type { Sentence } from '../../lib/sentences'
import { WeakWordList } from './WeakWordList'
import {
  deleteWeakWord as deleteWeakWordRequest,
  listWeakWords,
  updateWeakWord,
  type WeakWord,
} from '../../lib/weakWords'

interface Props {
  onStartSession: (sentences: Sentence[]) => void
  onStartWeakWordSession: () => Promise<void>
  isMockMode: boolean
  onLogout: () => void
  userName: string
}

export function SentenceManager({
  onStartSession,
  onStartWeakWordSession,
  isMockMode,
  onLogout,
  userName,
}: Props) {
  const { sentences, total, loading, error, fetchSentences } = useSentenceStore()
  const [showForm, setShowForm] = useState(false)
  const [showCsv, setShowCsv] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [weakWords, setWeakWords] = useState<WeakWord[]>([])
  const [loadingWeakWords, setLoadingWeakWords] = useState(false)
  const [weakWordError, setWeakWordError] = useState<string | null>(null)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const [startingWeakWordSession, setStartingWeakWordSession] = useState(false)

  const loadWeakWords = useCallback(async () => {
    if (isMockMode) {
      setWeakWords([])
      setWeakWordError(null)
      setLoadingWeakWords(false)
      return
    }

    setLoadingWeakWords(true)
    setWeakWordError(null)
    try {
      const data = await listWeakWords()
      setWeakWords(data.words)
    } catch (err) {
      setWeakWordError(err instanceof Error ? err.message : '苦手ワードの取得に失敗しました')
    } finally {
      setLoadingWeakWords(false)
    }
  }, [isMockMode])

  useEffect(() => {
    void fetchSentences()
    void loadWeakWords()
  }, [fetchSentences, loadWeakWords])

  const handleWeakWordClick = useCallback(async () => {
    setStartingWeakWordSession(true)
    setPracticeError(null)
    try {
      await onStartWeakWordSession()
    } catch (err) {
      setPracticeError(err instanceof Error ? err.message : '苦手ワード練習を開始できませんでした')
      setStartingWeakWordSession(false)
    }
  }, [onStartWeakWordSession])

  const handleUpdateWeakWord = useCallback(async (id: string, note: string) => {
    const updated = await updateWeakWord(id, { note })
    setWeakWords((current) => current.map((word) => (word.id === id ? updated : word)))
  }, [])

  const handleDeleteWeakWord = useCallback(async (id: string) => {
    await deleteWeakWordRequest(id)
    setWeakWords((current) => current.filter((word) => word.id !== id))
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-wide">typing-en</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{userName}</span>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">文章管理</h2>
            <span className="text-sm text-gray-500">{total}件</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleWeakWordClick()}
              disabled={isMockMode || startingWeakWordSession}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              {startingWeakWordSession && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              苦手ワード練習
            </button>
            <button
              onClick={() => { setShowForm((v) => !v); setShowCsv(false) }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg transition-colors"
            >
              + 追加
            </button>
            <button
              onClick={() => { setShowCsv((v) => !v); setShowForm(false) }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg transition-colors"
            >
              CSV インポート
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={sentences.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              練習開始
            </button>
          </div>
        </div>

        {practiceError && (
          <div className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {practiceError}
          </div>
        )}

        {/* Add form */}
        {showForm && <SentenceForm onClose={() => setShowForm(false)} />}

        {/* CSV import */}
        {showCsv && <CsvImport onClose={() => setShowCsv(false)} />}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 text-sm">{error}</div>
        ) : (
          <>
            {sentences.length < total && (
              <p className="text-xs text-yellow-500">
                ※ 最新200件のみ表示されています（全{total}件）
              </p>
            )}
            <SentenceList sentences={sentences} />
          </>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">苦手ワード</h2>
              {!isMockMode && <span className="text-sm text-gray-500">{weakWords.length}件</span>}
            </div>
            {!isMockMode && (
              <button
                onClick={() => void loadWeakWords()}
                disabled={loadingWeakWords}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm rounded-lg transition-colors"
              >
                再読込
              </button>
            )}
          </div>

          {isMockMode ? (
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-6 text-sm text-gray-400">
              モック認証では苦手ワード機能は無効です。
            </div>
          ) : loadingWeakWords ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-600 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : weakWordError ? (
            <div className="rounded-xl border border-red-700 bg-red-900/30 px-4 py-4 text-sm text-red-300">
              <div className="flex items-center justify-between gap-3">
                <span>{weakWordError}</span>
                <button
                  onClick={() => void loadWeakWords()}
                  className="shrink-0 rounded-lg bg-red-800 px-3 py-1 text-xs font-semibold text-red-100 hover:bg-red-700 transition-colors"
                >
                  再試行
                </button>
              </div>
            </div>
          ) : (
            <WeakWordList
              weakWords={weakWords}
              onUpdateNote={handleUpdateWeakWord}
              onDelete={handleDeleteWeakWord}
            />
          )}
        </section>
      </main>

      {/* Start session modal */}
      {showModal && (
        <StartSessionModal
          sentences={sentences}
          onStart={(selectedSentences) => { setShowModal(false); onStartSession(selectedSentences) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
