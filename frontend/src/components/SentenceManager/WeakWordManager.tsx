import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../Layout/DashboardLayout'
import { WeakWordList } from './WeakWordList'
import {
  deleteWeakWord as deleteWeakWordRequest,
  listWeakWords,
  updateWeakWord,
  type WeakWord,
} from '../../lib/weakWords'

interface Props {
  onStartWeakWordSession: () => Promise<void>
  onStartRandomSession: () => void
  isMockMode: boolean
  onLogout: () => void
  userName: string
}

export function WeakWordManager({
  onStartWeakWordSession,
  onStartRandomSession,
  isMockMode,
  onLogout,
  userName,
}: Props) {
  const [weakWords, setWeakWords] = useState<WeakWord[]>([])
  const [loadingWeakWords, setLoadingWeakWords] = useState(false)
  const [weakWordError, setWeakWordError] = useState<string | null>(null)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const [startingWeakWordSession, setStartingWeakWordSession] = useState(false)
  const [hideSolved, setHideSolved] = useState(true)

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
    void loadWeakWords()
  }, [loadWeakWords])

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

  const handleUpdateWeakWord = useCallback(async (id: string, patch: { note?: string; isSolved?: boolean }) => {
    const updated = await updateWeakWord(id, patch)
    setWeakWords((current) => current.map((word) => (word.id === id ? updated : word)))
  }, [])

  const handleDeleteWeakWord = useCallback(async (id: string) => {
    await deleteWeakWordRequest(id)
    setWeakWords((current) => current.filter((word) => word.id !== id))
  }, [])

  const activeCount = useMemo(() => weakWords.filter((word) => !word.isSolved).length, [weakWords])
  const visibleWeakWords = useMemo(
    () => (hideSolved ? weakWords.filter((word) => !word.isSolved) : weakWords),
    [hideSolved, weakWords],
  )

  return (
    <DashboardLayout
      title="苦手ワード"
      subtitle={!isMockMode ? `未攻略 ${activeCount}件 / 全${weakWords.length}件` : 'モック認証では利用できません'}
      userName={userName}
      onLogout={onLogout}
      onStartRandomSession={onStartRandomSession}
      actions={!isMockMode ? (
        <>
          <label className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={hideSolved}
              onChange={(e) => setHideSolved(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
            />
            攻略済みを隠す
          </label>
          <button
            onClick={() => void handleWeakWordClick()}
            disabled={startingWeakWordSession}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            {startingWeakWordSession && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            苦手ワード練習
          </button>
          <button
            onClick={() => void loadWeakWords()}
            disabled={loadingWeakWords}
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
          weakWords={visibleWeakWords}
          onUpdateNote={(id, note) => handleUpdateWeakWord(id, { note })}
          onToggleSolved={(id, isSolved) => handleUpdateWeakWord(id, { isSolved })}
          onDelete={handleDeleteWeakWord}
        />
      )}
    </DashboardLayout>
  )
}
