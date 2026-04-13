import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DashboardLayout } from '../Layout/DashboardLayout'
import {
  listWeakBigrams,
  type BigramStatEntry,
} from '../../lib/bigramStats'

interface Props {
  onStartFingeringSession: () => Promise<void>
  isMockMode: boolean
  onLogout: () => void
  userName: string
  tabSwitcher?: ReactNode
}

export function FingeringManager({
  onStartFingeringSession,
  isMockMode,
  onLogout,
  userName,
  tabSwitcher,
}: Props) {
  const [bigrams, setBigrams] = useState<BigramStatEntry[]>([])
  const [loadingBigrams, setLoadingBigrams] = useState(false)
  const [bigramError, setBigramError] = useState<string | null>(null)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const [startingSession, setStartingSession] = useState(false)

  const loadBigrams = useCallback(async () => {
    if (isMockMode) {
      setBigrams([])
      setBigramError(null)
      setLoadingBigrams(false)
      return
    }

    setLoadingBigrams(true)
    setBigramError(null)
    try {
      const data = await listWeakBigrams()
      setBigrams(data.bigrams)
    } catch (err) {
      setBigramError(err instanceof Error ? err.message : '運指データの取得に失敗しました')
    } finally {
      setLoadingBigrams(false)
    }
  }, [isMockMode])

  useEffect(() => {
    void loadBigrams()
  }, [loadBigrams])

  const handleStartSession = useCallback(async () => {
    setStartingSession(true)
    setPracticeError(null)
    try {
      await onStartFingeringSession()
    } catch (err) {
      setPracticeError(err instanceof Error ? err.message : '苦手運指練習を開始できませんでした')
      setStartingSession(false)
    }
  }, [onStartFingeringSession])

  const bigramCount = useMemo(() => bigrams.length, [bigrams])
  const topBigram = bigrams[0] ?? null

  return (
    <DashboardLayout
      title="苦手運指"
      subtitle={!isMockMode ? `${bigramCount}件のパターンを検出` : 'モック認証では利用できません'}
      userName={userName}
      onLogout={onLogout}
      actions={!isMockMode ? (
        <>
          {tabSwitcher}
          <button
            onClick={() => void handleStartSession()}
            disabled={startingSession || bigramCount === 0}
            className="app-button app-button-primary"
          >
            {startingSession && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            練習する
          </button>
          <button
            onClick={() => void loadBigrams()}
            disabled={loadingBigrams}
            className="app-button app-button-subtle"
          >
            再読込
          </button>
        </>
      ) : undefined}
    >
      {practiceError && (
        <div className="app-banner app-banner-danger">
          {practiceError}
        </div>
      )}

      {isMockMode ? (
        <div className="app-card-soft px-4 py-6 text-sm text-slate-500">
          モック認証では苦手運指機能は無効です。
        </div>
      ) : loadingBigrams ? (
        <div className="app-card-soft flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d6e3ed] border-t-[#3ea8ff]" />
        </div>
      ) : bigramError ? (
        <div className="app-banner app-banner-danger flex items-center justify-between gap-3">
          <span>{bigramError}</span>
          <button
            onClick={() => void loadBigrams()}
            className="app-button app-button-danger min-h-0 px-3 py-1.5 text-xs"
          >
            再試行
          </button>
        </div>
      ) : bigrams.length === 0 ? (
        <div className="app-card-soft px-6 py-12 text-center text-sm text-slate-500">
          まだデータがありません。通常練習を行うとデータが蓄積されます。
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="app-card-soft px-5 py-5">
              <p className="text-sm font-semibold text-slate-900">苦手なキー遷移を優先して練習</p>
              <p className="mt-2 text-sm text-slate-500">
                bigram ごとのミス率を見て、同じ手癖で崩れやすい運指パターンを抽出します。数値が高いものほど優先的に潰したい候補です。
              </p>
            </div>
            <div className="app-card-soft px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">最優先パターン</p>
              {topBigram ? (
                <>
                  <p className="mt-2 font-mono text-3xl font-bold text-slate-900">{displayBigram(topBigram.bigram)}</p>
                  <p className="text-sm text-slate-500">
                    ミス率 {Math.round(topBigram.missRate * 100)}% / {topBigram.misses} miss / {topBigram.attempts} attempts
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">まだ十分なデータがありません。</p>
              )}
            </div>
          </div>

          <BigramTable bigrams={bigrams} />
        </div>
      )}
    </DashboardLayout>
  )
}

interface BigramTableProps {
  bigrams: BigramStatEntry[]
}

function BigramTable({ bigrams }: BigramTableProps) {
  return (
    <div className="app-table overflow-x-auto">
      <div className="app-table-head grid min-w-[640px] grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] border-b border-[#d6e3ed] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
        <div>運指パターン</div>
        <div className="text-right">ミス率</div>
        <div className="text-right">ミス数</div>
        <div className="text-right">試行数</div>
      </div>
      {bigrams.map((bigram) => (
        <BigramRow key={bigram.bigram} bigram={bigram} />
      ))}
    </div>
  )
}

function displayBigram(bigram: string) {
  return bigram[0] === ' ' && bigram[1] === ' '
    ? '□→□'
    : bigram[0] === ' '
      ? `□→${bigram[1]}`
      : bigram[1] === ' '
        ? `${bigram[0]}→□`
        : `${bigram[0]}→${bigram[1]}`
}

function BigramRow({ bigram }: { bigram: BigramStatEntry }) {
  return (
    <div className="grid min-w-[640px] grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] items-center gap-0 border-b border-[#d6e3ed] px-4 py-3 transition-colors hover:bg-[#f8fbff]">
      <div className="font-mono text-sm text-slate-900">{displayBigram(bigram.bigram)}</div>
      <div className="text-right text-sm text-rose-500">{Math.round(bigram.missRate * 100)}%</div>
      <div className="text-right text-sm text-sky-600">{bigram.misses}</div>
      <div className="text-right text-sm text-slate-500">{bigram.attempts}</div>
    </div>
  )
}
