import { useEffect, useState } from 'react'
import type { WeakWord } from '../../lib/weakWords'

interface Props {
  weakWords: WeakWord[]
  onUpdateNote: (id: string, note: string) => Promise<void>
  onToggleSolved: (id: string, isSolved: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function formatMissRate(missRate: number): string {
  return `${Math.round(missRate * 100)}%`
}

function WeakWordRow({ weakWord, onUpdateNote, onToggleSolved, onDelete }: {
  weakWord: WeakWord
  onUpdateNote: (id: string, note: string) => Promise<void>
  onToggleSolved: (id: string, isSolved: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
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
      <tr className="border-b border-gray-700">
        <td className="px-4 py-3 font-mono text-sm text-white align-top">{weakWord.word}</td>
        <td className="px-4 py-3 text-sm text-amber-400 align-top">{formatMissRate(weakWord.missRate)}</td>
        <td className="px-4 py-3 align-top">
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={weakWord.isSolved}
              disabled={saving}
              onChange={(e) => void handleToggleSolved(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
            />
            攻略済み
          </label>
        </td>
        <td className="px-4 py-3" colSpan={2}>
          <div className="space-y-2">
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
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-750 group">
      <td className="px-4 py-3 font-mono text-sm text-white max-w-0 w-1/3">
        <span className="block truncate" title={weakWord.word}>
          {weakWord.word}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-amber-400 whitespace-nowrap">
        {formatMissRate(weakWord.missRate)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={weakWord.isSolved}
            disabled={saving}
            onChange={(e) => void handleToggleSolved(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span>{weakWord.isSolved ? '済' : '未'}</span>
        </label>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 max-w-0 w-1/2">
        <span className="block truncate" title={weakWord.note ?? ''}>
          {weakWord.note ?? <span className="text-gray-600">—</span>}
        </span>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap w-28">
        {confirmDelete ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="text-gray-400">削除しますか?</span>
            <button
              onClick={() => void handleDelete()}
              disabled={saving}
              className="text-red-400 hover:text-red-300 disabled:opacity-40 font-semibold"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              No
            </button>
          </span>
        ) : (
          <span className="inline-flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              メモ編集
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-500 hover:text-red-400"
            >
              削除
            </button>
          </span>
        )}
      </td>
    </tr>
  )
}

export function WeakWordList({ weakWords, onUpdateNote, onToggleSolved, onDelete }: Props) {
  if (weakWords.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        苦手ワードはまだありません。通常のセッションを完了すると追加されます。
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-xl border border-gray-700">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800">
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
              Word
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
              ミス率
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
              攻略済み
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">
              攻略メモ
            </th>
            <th className="px-4 py-3 w-28" />
          </tr>
        </thead>
        <tbody className="bg-gray-800/50">
          {weakWords.map((weakWord) => (
            <WeakWordRow
              key={weakWord.id}
              weakWord={weakWord}
              onUpdateNote={onUpdateNote}
              onToggleSolved={onToggleSolved}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
