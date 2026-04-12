import { useEffect, useState } from 'react'
import type { WeakWord } from '../../lib/weakWords'
import { formatWeaknessReason, getWeaknessReasons } from '../../lib/typingAnalysis'

interface Props {
  weakWords: WeakWord[]
  onUpdateNote: (id: string, note: string) => Promise<void>
  onToggleSolved: (id: string, isSolved: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDrill: (word: WeakWord) => void
}

const GRID_COLUMNS = 'grid-cols-[minmax(0,1fr)_9rem_13rem_6.5rem_minmax(0,1fr)_11rem]'

function getWeakWordReasons(weakWord: WeakWord) {
  return getWeaknessReasons({
    misses: weakWord.missRate > 0 ? 1 : 0,
    missRate: weakWord.missRate,
    msPerChar: weakWord.msPerChar,
    stallCount: weakWord.stallCount,
    stallDurationMs: weakWord.stallDurationMs,
  })
}

function WeakWordReasonBadges({ weakWord }: { weakWord: WeakWord }) {
  const reasons = getWeakWordReasons(weakWord)

  if (reasons.length === 0) {
    return <span className="text-gray-600">—</span>
  }

  return (
    <div className="truncate text-xs font-semibold text-amber-300 whitespace-nowrap">
      {reasons.map((reason) => formatWeaknessReason(reason)).join(' / ')}
    </div>
  )
}

function WeakWordMetrics({ weakWord }: { weakWord: WeakWord }) {
  return (
    <div className="overflow-hidden truncate text-xs text-gray-400 whitespace-nowrap">
      <span className="text-rose-300">{Math.round(weakWord.missRate * 100)}%</span>
      <span className="mx-2 text-gray-600">/</span>
      <span className="text-sky-300">{Math.round(weakWord.msPerChar)} ms/char</span>
      <span className="mx-2 text-gray-600">/</span>
      <span className="text-amber-300">停止 {weakWord.stallCount}回</span>
    </div>
  )
}

function WeakWordRow({ weakWord, onUpdateNote, onToggleSolved, onDelete, onDrill }: {
  weakWord: WeakWord
  onUpdateNote: (id: string, note: string) => Promise<void>
  onToggleSolved: (id: string, isSolved: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDrill: (word: WeakWord) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editNote, setEditNote] = useState(weakWord.note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEditNote(weakWord.note ?? '')
  }, [weakWord.note])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onUpdateNote(weakWord.id, editNote)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    setError(null)
    try {
      await onDelete(weakWord.id)
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  const handleToggleSolved = async (isSolved: boolean) => {
    setSaving(true)
    setError(null)
    try {
      await onToggleSolved(weakWord.id, isSolved)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className={`grid ${GRID_COLUMNS} items-start gap-0 border-b border-gray-700 px-4 py-2.5`}>
        <div className="truncate font-mono text-sm text-white" title={weakWord.word}>{weakWord.word}</div>
        <div><WeakWordReasonBadges weakWord={weakWord} /></div>
        <div><WeakWordMetrics weakWord={weakWord} /></div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-300 whitespace-nowrap">
          <input
            type="checkbox"
            checked={weakWord.isSolved}
            disabled={saving}
            onChange={(e) => void handleToggleSolved(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
          />
          攻略済み
        </label>
        <div className="col-span-2 space-y-2">
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="攻略メモ..."
            rows={2}
            className="w-full bg-gray-700 text-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder-gray-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              保存
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setEditNote(weakWord.note ?? '')
                setError(null)
              }}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs rounded-lg transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid ${GRID_COLUMNS} items-center gap-0 border-b border-gray-700 px-4 py-2.5 hover:bg-gray-750`}>
      <div className="truncate font-mono text-sm text-white" title={weakWord.word}>{weakWord.word}</div>
      <div className="whitespace-nowrap"><WeakWordReasonBadges weakWord={weakWord} /></div>
      <div className="whitespace-nowrap"><WeakWordMetrics weakWord={weakWord} /></div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-300 whitespace-nowrap">
        <input
          type="checkbox"
          checked={weakWord.isSolved}
          disabled={saving}
          onChange={(e) => void handleToggleSolved(e.target.checked)}
          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
        />
        <span>{weakWord.isSolved ? '済' : '未'}</span>
      </label>
      <div className="min-w-0 text-sm text-gray-400">
        <span className="block truncate" title={weakWord.note ?? ''}>
          {weakWord.note ?? <span className="text-gray-600">—</span>}
        </span>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        {confirmDelete ? (
          <>
            <button
              onClick={() => void handleDelete()}
              disabled={saving}
              className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onDrill(weakWord)}
              className="rounded-md border border-sky-500/40 px-2 py-1 text-xs text-sky-300 hover:bg-sky-500/10"
            >
              ドリル
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-amber-500/40 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10"
            >
              メモ
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
            >
              削除
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function WeakWordList({ weakWords, onUpdateNote, onToggleSolved, onDelete, onDrill }: Props) {
  if (weakWords.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        表示対象の苦手ワードはありません。
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50">
      <div className={`grid ${GRID_COLUMNS} border-b border-gray-700 bg-gray-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500`}>
        <div>Word</div>
        <div className="whitespace-nowrap">理由</div>
        <div className="whitespace-nowrap">指標</div>
        <div className="whitespace-nowrap">攻略済み</div>
        <div>攻略メモ</div>
        <div />
      </div>
      {weakWords.map((weakWord) => (
        <WeakWordRow
          key={weakWord.id}
          weakWord={weakWord}
          onUpdateNote={onUpdateNote}
          onToggleSolved={onToggleSolved}
          onDelete={onDelete}
          onDrill={onDrill}
        />
      ))}
    </div>
  )
}
