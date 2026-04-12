import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../Layout/DashboardLayout'
import {
  listWeakBigrams,
  type BigramStatEntry,
} from '../../lib/bigramStats'

interface Props {
  onStartFingeringSession: () => Promise<void>
  onStartRandomSession: () => void
  isMockMode: boolean
  onLogout: () => void
  userName: string
}

export function FingeringManager({
  onStartFingeringSession,
  onStartRandomSession,
  isMockMode,
  onLogout,
  userName,
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

  return (
    <DashboardLayout
      title="苦手運指"
      subtitle={!isMockMode ? `${bigramCount}件のパターンを検出` : 'モック認証では利用できません'}
      userName={userName}
      onLogout={onLogout}
      onStartRandomSession={onStartRandomSession}
      actions={!isMockMode ? (
        <>
          <button
            onClick={() => void handleStartSession()}
            disabled={startingSession || bigramCount === 0}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            {startingSession && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            練習する
          </button>
          <button
            onClick={() => void loadBigrams()}
            disabled={loadingBigrams}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm rounded-lg transition-colors"
          >
            再読込
          </button>
        </>
      ) : undefined}
    >
      {practiceError && (
        <div className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {practiceError}
        </div>
      )}

      {isMockMode ? (
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-6 text-sm text-gray-400">
          モック認証では苦手運指機能は無効です。
        </div>
      ) : loadingBigrams ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-sky-400 rounded-full animate-spin" />
        </div>
      ) : bigramError ? (
        <div className="rounded-xl border border-red-700 bg-red-900/30 px-4 py-4 text-sm text-red-300">
          <div className="flex items-center justify-between gap-3">
            <span>{bigramError}</span>
            <button
              onClick={() => void loadBigrams()}
              className="shrink-0 rounded-lg bg-red-800 px-3 py-1 text-xs font-semibold text-red-100 hover:bg-red-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      ) : bigrams.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          まだデータがありません。通常練習を行うとデータが蓄積されます。
        </div>
      ) : (
        <BigramTable bigrams={bigrams} />
      )}
    </DashboardLayout>
  )
}

interface BigramTableProps {
  bigrams: BigramStatEntry[]
}

function BigramTable({ bigrams }: BigramTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50">
      <div className="grid grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] border-b border-gray-700 bg-gray-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
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

function BigramRow({ bigram }: { bigram: BigramStatEntry }) {
  // スペース文字を □ に変換して表示する
  // □→X: 単語先頭への遷移 / X→□: 単語末尾からの遷移 / XY: 通常のキー遷移
  const displayBigram = bigram.bigram[0] === ' ' && bigram.bigram[1] === ' '
    ? '□→□'
    : bigram.bigram[0] === ' '
      ? `□→${bigram.bigram[1]}`
      : bigram.bigram[1] === ' '
        ? `${bigram.bigram[0]}→□`
        : `${bigram.bigram[0]}→${bigram.bigram[1]}`

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] items-center gap-0 border-b border-gray-700 px-4 py-3 hover:bg-gray-750">
      <div className="font-mono text-sm text-white">{displayBigram}</div>
      <div className="text-right text-sm text-rose-300">{Math.round(bigram.missRate * 100)}%</div>
      <div className="text-right text-sm text-sky-300">{bigram.misses}</div>
      <div className="text-right text-sm text-gray-400">{bigram.attempts}</div>
    </div>
  )
}
