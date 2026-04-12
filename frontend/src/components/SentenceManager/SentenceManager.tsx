import { useEffect, useState } from 'react'
import { useSentenceStore } from '../../stores/sentenceStore'
import { SentenceList } from './SentenceList'
import { SentenceForm } from './SentenceForm'
import { CsvImport } from './CsvImport'
import { StartSessionModal } from './StartSessionModal'
import type { Sentence } from '../../lib/sentences'
import { DashboardLayout } from '../Layout/DashboardLayout'

interface Props {
  onStartSession: (sentences: Sentence[]) => void
  onStartRandomSession: () => void
  onLogout: () => void
  userName: string
}

export function SentenceManager({
  onStartSession,
  onStartRandomSession,
  onLogout,
  userName,
}: Props) {
  const { sentences, total, loading, error, fetchSentences } = useSentenceStore()
  const [showForm, setShowForm] = useState(false)
  const [showCsv, setShowCsv] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    void fetchSentences()
  }, [fetchSentences])

  return (
    <DashboardLayout
      title="文章管理"
      subtitle={`${total}件の登録文章を管理`}
      userName={userName}
      onLogout={onLogout}
      onStartRandomSession={onStartRandomSession}
      actions={(
        <>
          <button
            onClick={() => { setShowForm((v) => !v); setShowCsv(false) }}
            className="app-button app-button-subtle"
          >
            {showForm ? '追加フォームを閉じる' : '文章を追加'}
          </button>
          <button
            onClick={() => { setShowCsv((v) => !v); setShowForm(false) }}
            className="app-button app-button-subtle"
          >
            {showCsv ? 'インポートを閉じる' : 'CSV インポート'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={sentences.length === 0}
            className="app-button app-button-primary"
          >
            練習開始
          </button>
        </>
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="app-card-soft px-5 py-5">
          <p className="text-sm font-semibold text-slate-900">文章ライブラリを整える</p>
          <p className="mt-2 text-sm text-slate-500">
            練習で使う文章と攻略メモをここで管理します。追加した文章はセッション開始時にランダム選択されます。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">登録数</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{total}</p>
              <p className="text-sm text-slate-500">文章ごとにメモを残して反復できます。</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">おすすめの流れ</p>
              <p className="mt-2 text-sm text-slate-900">追加 → 練習開始 → 結果から苦手分析</p>
              <p className="text-sm text-slate-500">文章数が増えるほど出題の偏りが減ります。</p>
            </div>
          </div>
        </div>
        <div className="app-card-soft px-5 py-5">
          <p className="text-sm font-semibold text-slate-900">入力方法</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            <li>1件ずつ追加して短文を細かく整える</li>
            <li>CSV でまとめてインポートする</li>
            <li>問題数を決めて、そのままセッション開始</li>
          </ul>
        </div>
      </div>

      {(showForm || showCsv) && (
        <div className={`grid gap-4 ${showForm && showCsv ? 'lg:grid-cols-2' : ''}`}>
          {showForm && <SentenceForm onClose={() => setShowForm(false)} />}
          {showCsv && <CsvImport onClose={() => setShowCsv(false)} />}
        </div>
      )}

      {loading ? (
        <div className="app-card-soft flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d6e3ed] border-t-[#3ea8ff]" />
        </div>
      ) : error ? (
        <div className="app-banner app-banner-danger">{error}</div>
      ) : (
        <>
          {sentences.length < total && (
            <p className="app-banner app-banner-warning text-xs">
              ※ 最新200件のみ表示されています（全{total}件）
            </p>
          )}
          <SentenceList sentences={sentences} />
        </>
      )}

      {showModal && (
        <StartSessionModal
          sentences={sentences}
          onStart={(selectedSentences) => { setShowModal(false); onStartSession(selectedSentences) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </DashboardLayout>
  )
}
