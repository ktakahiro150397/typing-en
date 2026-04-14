import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../Layout/DashboardLayout'
import { StartSessionModal } from '../SentenceManager/StartSessionModal'
import { useSentenceStore } from '../../stores/sentenceStore'
import { listWeakWords } from '../../lib/weakWords'
import { listWeakBigrams } from '../../lib/bigramStats'
import type { Sentence } from '../../lib/sentences'

interface Props {
  onStartRandomSession: () => void
  onStartSentenceSession: (sentences: Sentence[]) => void
  onStartWeakWordSession: () => Promise<void>
  onStartFingeringSession: () => Promise<void>
  isMockMode: boolean
  onLogout: () => void
  userName: string
}

export function HomeScreen({
  onStartRandomSession,
  onStartSentenceSession,
  onStartWeakWordSession,
  onStartFingeringSession,
  isMockMode,
  onLogout,
  userName,
}: Props) {
  const { sentences, total, fetchSentences } = useSentenceStore()
  const [weakWordCount, setWeakWordCount] = useState<number | null>(null)
  const [bigramCount, setBigramCount] = useState<number | null>(null)
  const [showSentenceModal, setShowSentenceModal] = useState(false)
  const [weakWordError, setWeakWordError] = useState<string | null>(null)
  const [fingeringError, setFingeringError] = useState<string | null>(null)
  const [startingWeak, setStartingWeak] = useState(false)
  const [startingFingering, setStartingFingering] = useState(false)

  useEffect(() => {
    void fetchSentences()
  }, [fetchSentences])

  useEffect(() => {
    if (isMockMode) return
    listWeakWords()
      .then(({ words }) => {
        setWeakWordCount(words.filter((w) => !w.isSolved).length)
      })
      .catch(() => { /* count stays null */ })
    listWeakBigrams()
      .then(({ bigrams }) => {
        setBigramCount(bigrams.length)
      })
      .catch(() => { /* count stays null */ })
  }, [isMockMode])

  const handleWeakWordClick = async () => {
    setStartingWeak(true)
    setWeakWordError(null)
    try {
      await onStartWeakWordSession()
    } catch (err) {
      setWeakWordError(err instanceof Error ? err.message : '苦手ワード練習を開始できませんでした')
      setStartingWeak(false)
    }
  }

  const handleFingeringClick = async () => {
    setStartingFingering(true)
    setFingeringError(null)
    try {
      await onStartFingeringSession()
    } catch (err) {
      setFingeringError(err instanceof Error ? err.message : '苦手運指練習を開始できませんでした')
      setStartingFingering(false)
    }
  }

  return (
    <DashboardLayout
      title="今すぐ練習する"
      subtitle="モードを選んでスタート"
      userName={userName}
      onLogout={onLogout}
    >
      <div className="space-y-4">
        {/* Hero CTA: Random */}
        <div className="rounded-2xl border border-[#3ea8ff]/30 bg-[#eff6ff] px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1d4ed8]">登録不要 · 今すぐスタート</p>
              <p className="mt-1 text-xl font-bold text-slate-900">ランダムワード練習</p>
              <p className="mt-1 text-sm text-slate-500">30語をランダム生成して即スタート。セットアップ不要。</p>
            </div>
            <button
              onClick={onStartRandomSession}
              className="app-button app-button-primary min-h-[52px] shrink-0 px-8 text-base"
            >
              今すぐ開始
            </button>
          </div>
        </div>

        {/* Secondary modes grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Sentence library */}
          <div className="app-card-soft flex flex-col gap-4 px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">文章ライブラリ練習</p>
              <p className="mt-1 text-sm text-slate-500">登録した文章からランダム出題します。</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {total}
                <span className="ml-1 text-sm font-normal text-slate-400">件登録済み</span>
              </p>
            </div>
            <div className="mt-auto space-y-2">
              <button
                onClick={() => setShowSentenceModal(true)}
                disabled={sentences.length === 0}
                className="app-button app-button-secondary w-full"
                title={sentences.length === 0 ? 'まずライブラリに文章を追加してください' : undefined}
              >
                練習開始
              </button>
              <Link
                to="/library"
                className="block text-center text-xs text-[#3ea8ff] hover:text-[#0f83fd]"
              >
                ライブラリを管理 →
              </Link>
            </div>
          </div>

          {/* Weak words */}
          <div className="app-card-soft flex flex-col gap-4 px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">苦手ワード練習</p>
              <p className="mt-1 text-sm text-slate-500">ミスの多い単語を集中的に練習します。</p>
              {!isMockMode && weakWordCount !== null && (
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {weakWordCount}
                  <span className="ml-1 text-sm font-normal text-slate-400">件 未攻略</span>
                </p>
              )}
            </div>
            {weakWordError && (
              <p className="text-xs text-rose-600">{weakWordError}</p>
            )}
            <div className="mt-auto space-y-2">
              <button
                onClick={() => void handleWeakWordClick()}
                disabled={isMockMode || startingWeak}
                className="app-button app-button-secondary w-full"
                title={isMockMode ? 'モック認証では利用できません' : undefined}
              >
                {startingWeak && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3ea8ff]/40 border-t-[#3ea8ff]" />
                )}
                練習開始
              </button>
              <Link
                to="/analysis"
                className="block text-center text-xs text-[#3ea8ff] hover:text-[#0f83fd]"
              >
                苦手ワードを見る →
              </Link>
            </div>
          </div>

          {/* Fingering */}
          <div className="app-card-soft flex flex-col gap-4 px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">苦手運指練習</p>
              <p className="mt-1 text-sm text-slate-500">ミス率の高いキー遷移パターンを練習します。</p>
              {!isMockMode && bigramCount !== null && (
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {bigramCount}
                  <span className="ml-1 text-sm font-normal text-slate-400">パターン検出済み</span>
                </p>
              )}
            </div>
            {fingeringError && (
              <p className="text-xs text-rose-600">{fingeringError}</p>
            )}
            <div className="mt-auto space-y-2">
              <button
                onClick={() => void handleFingeringClick()}
                disabled={isMockMode || startingFingering}
                className="app-button app-button-secondary w-full"
                title={isMockMode ? 'モック認証では利用できません' : undefined}
              >
                {startingFingering && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3ea8ff]/40 border-t-[#3ea8ff]" />
                )}
                練習開始
              </button>
              <Link
                to="/analysis"
                className="block text-center text-xs text-[#3ea8ff] hover:text-[#0f83fd]"
              >
                運指データを見る →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showSentenceModal && (
        <StartSessionModal
          sentences={sentences}
          onStart={(selected) => { setShowSentenceModal(false); onStartSentenceSession(selected) }}
          onClose={() => setShowSentenceModal(false)}
        />
      )}
    </DashboardLayout>
  )
}
