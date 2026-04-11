import { useEffect, useState } from 'react'
import { useSentenceStore } from '../../stores/sentenceStore'
import { SentenceList } from './SentenceList'
import { SentenceForm } from './SentenceForm'
import { CsvImport } from './CsvImport'
import { StartSessionModal } from './StartSessionModal'
import type { Sentence } from '../../lib/sentences'

interface Props {
  onStartSession: (sentences: Sentence[]) => void
  onLogout: () => void
  userName: string
}

export function SentenceManager({ onStartSession, onLogout, userName }: Props) {
  const { sentences, total, loading, error, fetchSentences } = useSentenceStore()
  const [showForm, setShowForm] = useState(false)
  const [showCsv, setShowCsv] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchSentences()
  }, [fetchSentences])

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
