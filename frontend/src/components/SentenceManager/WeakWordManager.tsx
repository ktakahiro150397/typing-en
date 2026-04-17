import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DashboardLayout } from '../Layout/DashboardLayout'
import { WeakWordList } from './WeakWordList'
import { WordDrillModal } from './WordDrillModal'
import {
  createWeakWord,
  deleteWeakWord as deleteWeakWordRequest,
  listWeakWords,
  updateWeakWord,
  type WeakWord,
} from '../../lib/weakWords'

interface Props {
  onStartWeakWordSession: () => Promise<void>
  onStartWordDrill: (word: string, count: number) => void
  isMockMode: boolean
  onLogout: () => void
  userName: string
  tabSwitcher?: ReactNode
}

export function WeakWordManager({
  onStartWeakWordSession,
  onStartWordDrill,
  isMockMode,
  onLogout,
  userName,
  tabSwitcher,
}: Props) {
  const [weakWords, setWeakWords] = useState<WeakWord[]>([])
  const [loadingWeakWords, setLoadingWeakWords] = useState(false)
  const [weakWordError, setWeakWordError] = useState<string | null>(null)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const [startingWeakWordSession, setStartingWeakWordSession] = useState(false)
  const [hideSolved, setHideSolved] = useState(true)
  const [addWordInput, setAddWordInput] = useState('')
  const [addWordLoading, setAddWordLoading] = useState(false)
  const [addWordFeedback, setAddWordFeedback] = useState<{ kind: 'error' | 'info'; message: string } | null>(null)
  const [drillTarget, setDrillTarget] = useState<WeakWord | null>(null)

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

  const handleAddWord = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const word = addWordInput.trim()
    if (!word) {
      setAddWordFeedback({ kind: 'error', message: '追加するワードを入力してください。' })
      return
    }
    if (/\s/.test(word)) {
      setAddWordFeedback({ kind: 'error', message: 'ワードは1語ずつ追加してください。' })
      return
    }

    setAddWordLoading(true)
    setAddWordFeedback(null)
    try {
      const result = await createWeakWord(word)
      setWeakWords((current) => [
        result.word,
        ...current.filter((item) => item.id !== result.word.id),
      ])
      setAddWordInput('')
      setAddWordFeedback({
        kind: 'info',
        message: result.created
          ? `「${result.word.word}」を追加しました。`
          : `「${result.word.word}」はすでに登録されています。`,
      })
    } catch (err) {
      setAddWordFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'ワードの追加に失敗しました',
      })
    } finally {
      setAddWordLoading(false)
    }
  }, [addWordInput])

  const handleStartDrill = useCallback((word: string, count: number) => {
    setDrillTarget(null)
    setPracticeError(null)
    onStartWordDrill(word, count)
  }, [onStartWordDrill])

  const activeCount = useMemo(() => weakWords.filter((word) => !word.isSolved).length, [weakWords])
  const solvedCount = useMemo(() => weakWords.filter((word) => word.isSolved).length, [weakWords])
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
      actions={!isMockMode ? (
        <>
          <button
            onClick={() => void handleWeakWordClick()}
            disabled={startingWeakWordSession}
            className="app-button app-button-primary"
          >
            {startingWeakWordSession && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            練習開始
          </button>
          <label className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#d6e3ed] bg-white px-4 py-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={hideSolved}
              onChange={(e) => setHideSolved(e.target.checked)}
              className="h-4 w-4 rounded border-[#d6e3ed] bg-white text-emerald-500 focus:ring-emerald-500"
            />
            攻略済みを隠す
          </label>
        </>
      ) : undefined}
    >
      {practiceError && (
        <div className="app-banner app-banner-danger">
          {practiceError}
        </div>
      )}

      {tabSwitcher && <div className="mb-2">{tabSwitcher}</div>}

      {isMockMode ? (
        <div className="app-card-soft px-4 py-6 text-sm text-slate-500">
          モック認証では苦手ワード機能は無効です。
        </div>
      ) : loadingWeakWords ? (
        <div className="app-card-soft flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d6e3ed] border-t-[#3ea8ff]" />
        </div>
      ) : weakWordError ? (
        <div className="app-banner app-banner-danger flex items-center justify-between gap-3">
          <span>{weakWordError}</span>
          <button
            onClick={() => void loadWeakWords()}
            className="app-button app-button-danger min-h-0 px-3 py-1.5 text-xs"
          >
            再試行
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="app-card-soft px-5 py-5">
              <p className="text-sm font-semibold text-slate-900">優先して潰したいワードを管理</p>
              <p className="mt-2 text-sm text-slate-500">
                セッション結果から自動追加されたワードを中心に、手動追加や攻略メモ更新、ドリル起動までをここで行います。
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">未攻略</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{activeCount}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">攻略済み</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{solvedCount}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">表示中</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{visibleWeakWords.length}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddWord} className="app-card-soft p-5">
              <div className="flex h-full flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">ワードを手動追加</h3>
                  <p className="text-sm text-slate-500">通常練習前に集中的に打ちたい単語を直接登録できます。</p>
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={addWordInput}
                    onChange={(e) => setAddWordInput(e.target.value)}
                    placeholder="例: acquisition"
                    className="app-input font-mono"
                  />
                  {addWordFeedback && (
                    <p className={`mt-2 text-sm ${addWordFeedback.kind === 'error' ? 'text-rose-600' : 'text-[#1d4ed8]'}`}>
                      {addWordFeedback.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={addWordLoading || !addWordInput.trim()}
                  className="app-button app-button-secondary w-full"
                >
                  {addWordLoading ? '追加中...' : 'ワードを追加'}
                </button>
              </div>
            </form>
          </div>

          <WeakWordList
            weakWords={visibleWeakWords}
            onUpdateNote={(id, note) => handleUpdateWeakWord(id, { note })}
            onToggleSolved={(id, isSolved) => handleUpdateWeakWord(id, { isSolved })}
            onDelete={handleDeleteWeakWord}
            onDrill={(word) => setDrillTarget(word)}
          />
        </div>
      )}

      {drillTarget && (
        <WordDrillModal
          word={drillTarget}
          onStart={handleStartDrill}
          onClose={() => setDrillTarget(null)}
        />
      )}
    </DashboardLayout>
  )
}
