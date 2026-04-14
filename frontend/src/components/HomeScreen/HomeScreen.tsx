import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../Layout/DashboardLayout'
import { listWeakWords } from '../../lib/weakWords'
import { listWeakBigrams } from '../../lib/bigramStats'

interface Props {
  onStartPracticeSession: () => Promise<void>
  onStartWeakWordSession: () => Promise<void>
  onStartFingeringSession: () => Promise<void>
  isMockMode: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  onLogout?: () => void
  userName?: string
}

export function HomeScreen({
  onStartPracticeSession,
  onStartWeakWordSession,
  onStartFingeringSession,
  isMockMode,
  isAuthenticated,
  isAdmin,
  onLogout,
  userName,
}: Props) {
  const [weakWordCount, setWeakWordCount] = useState<number | null>(null)
  const [bigramCount, setBigramCount] = useState<number | null>(null)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const [weakWordError, setWeakWordError] = useState<string | null>(null)
  const [fingeringError, setFingeringError] = useState<string | null>(null)
  const [startingPractice, setStartingPractice] = useState(false)
  const [startingWeak, setStartingWeak] = useState(false)
  const [startingFingering, setStartingFingering] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || isMockMode) {
      setWeakWordCount(null)
      setBigramCount(null)
      return
    }

    listWeakWords()
      .then(({ words }) => {
        setWeakWordCount(words.filter((word) => !word.isSolved).length)
      })
      .catch(() => {
        setWeakWordCount(null)
      })

    listWeakBigrams()
      .then(({ bigrams }) => {
        setBigramCount(bigrams.length)
      })
      .catch(() => {
        setBigramCount(null)
      })
  }, [isAuthenticated, isMockMode])

  const handlePracticeClick = async () => {
    setStartingPractice(true)
    setPracticeError(null)
    try {
      await onStartPracticeSession()
    } catch (err) {
      setPracticeError(err instanceof Error ? err.message : '通常練習を開始できませんでした')
      setStartingPractice(false)
    }
  }

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
      subtitle={isAuthenticated ? '共有の練習問題からすぐに始められます。' : 'ログインなしで通常練習 5 問を始められます。'}
      userName={userName}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      onLogout={onLogout}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#3ea8ff]/30 bg-[#eff6ff] px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1d4ed8]">登録不要 · 今すぐスタート</p>
              <p className="mt-1 text-xl font-bold text-slate-900">通常練習 5 問</p>
              <p className="mt-1 text-sm text-slate-500">
                共有の練習問題から 5 問を出題します。{isAuthenticated ? 'ログイン中なら結果も保存できます。' : 'まずはログインなしで試せます。'}
              </p>
            </div>
            <button
              onClick={() => void handlePracticeClick()}
              disabled={startingPractice}
              className="app-button app-button-primary min-h-[52px] shrink-0 px-8 text-base"
            >
              {startingPractice ? '準備中...' : '今すぐ開始'}
            </button>
          </div>
          {practiceError && (
            <p className="mt-3 text-sm text-rose-600">{practiceError}</p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="app-card-soft flex flex-col gap-4 px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">苦手ワード練習</p>
              <p className="mt-1 text-sm text-slate-500">ミスの多い単語を集中的に練習します。</p>
              {isAuthenticated && !isMockMode && weakWordCount !== null && (
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
                disabled={!isAuthenticated || isMockMode || startingWeak}
                className="app-button app-button-secondary w-full"
                title={!isAuthenticated ? 'ログインすると利用できます' : isMockMode ? 'モック認証では利用できません' : undefined}
              >
                {startingWeak && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3ea8ff]/40 border-t-[#3ea8ff]" />
                )}
                練習開始
              </button>
              {isAuthenticated ? (
                <Link
                  to="/analysis"
                  className="block text-center text-xs text-[#3ea8ff] hover:text-[#0f83fd]"
                >
                  苦手ワードを見る →
                </Link>
              ) : (
                <p className="text-center text-xs text-slate-500">ログイン後に使えます</p>
              )}
            </div>
          </div>

          <div className="app-card-soft flex flex-col gap-4 px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">苦手運指練習</p>
              <p className="mt-1 text-sm text-slate-500">ミス率の高いキー遷移パターンを練習します。</p>
              {isAuthenticated && !isMockMode && bigramCount !== null && (
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
                disabled={!isAuthenticated || isMockMode || startingFingering}
                className="app-button app-button-secondary w-full"
                title={!isAuthenticated ? 'ログインすると利用できます' : isMockMode ? 'モック認証では利用できません' : undefined}
              >
                {startingFingering && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3ea8ff]/40 border-t-[#3ea8ff]" />
                )}
                練習開始
              </button>
              {isAuthenticated ? (
                <Link
                  to="/analysis"
                  className="block text-center text-xs text-[#3ea8ff] hover:text-[#0f83fd]"
                >
                  運指データを見る →
                </Link>
              ) : (
                <p className="text-center text-xs text-slate-500">ログイン後に使えます</p>
              )}
            </div>
          </div>

          <div className="app-card-soft flex flex-col gap-4 px-5 py-5">
            {isAuthenticated ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{isAdmin ? '共有問題の管理' : 'ログイン中の機能'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isAdmin
                      ? '共有の練習問題を追加・整理できます。'
                      : '分析・統計・設定は上のメニューから利用できます。'}
                  </p>
                </div>
                <div className="mt-auto space-y-2">
                  {isAdmin ? (
                    <Link to="/library" className="app-button app-button-secondary w-full justify-center">
                      ライブラリを開く
                    </Link>
                  ) : (
                    <Link to="/stats" className="app-button app-button-secondary w-full justify-center">
                      統計を見る
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-900">ログインするとできること</p>
                  <p className="mt-1 text-sm text-slate-500">
                    苦手ワード、運指分析、設定保存などの個人機能が使えるようになります。
                  </p>
                </div>
                <div className="mt-auto space-y-2">
                  <Link to="/login" className="app-button app-button-secondary w-full justify-center">
                    Google でログイン
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
