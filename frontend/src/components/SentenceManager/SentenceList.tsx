import { useState } from 'react'
import { useSentenceStore } from '../../stores/sentenceStore'
import type { Sentence } from '../../lib/sentences'

function SentenceRow({ sentence }: { sentence: Sentence }) {
  const patchSentence = useSentenceStore((s) => s.patchSentence)
  const removeSentence = useSentenceStore((s) => s.removeSentence)

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(sentence.text)
  const [editNote, setEditNote] = useState(sentence.note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!editText.trim()) return
    setSaving(true)
    setError(null)
    try {
      await patchSentence(sentence.id, {
        text: editText.trim(),
        note: editNote.trim(),
      })
      setEditing(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await removeSentence(sentence.id)
    } catch {
      // store will re-fetch on error
    }
  }

  if (editing) {
    return (
      <tr className="border-b border-gray-700">
        <td colSpan={3} className="px-4 py-3">
          <div className="space-y-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 rounded-lg px-3 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="攻略メモ..."
              rows={2}
              className="w-full bg-gray-700 text-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-gray-500"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!editText.trim() || saving}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(sentence.text); setEditNote(sentence.note ?? '') }}
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
      <td className="px-4 py-3 font-mono text-sm text-gray-200 max-w-0 w-1/2">
        <span className="block truncate" title={sentence.text}>
          {sentence.text}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 max-w-0 w-2/5">
        <span className="block truncate" title={sentence.note ?? ''}>
          {sentence.note ?? <span className="text-gray-600">—</span>}
        </span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {confirmDelete ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="text-gray-400">削除しますか?</span>
            <button
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 font-semibold"
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
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              編集
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

export function SentenceList({ sentences }: { sentences: Sentence[] }) {
  if (sentences.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        文章がまだありません。追加するか CSV をインポートしてください。
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-xl border border-gray-700">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800">
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">
              Text
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">
              攻略メモ
            </th>
            <th className="px-4 py-3 w-24" />
          </tr>
        </thead>
        <tbody className="bg-gray-800/50">
          {sentences.map((s) => (
            <SentenceRow key={s.id} sentence={s} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
