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
      <tr className="border-b border-[#d6e3ed] bg-[#f8fbff]">
        <td colSpan={3} className="px-4 py-3">
          <div className="space-y-3">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="app-input font-mono text-sm"
              autoFocus
            />
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="攻略メモ..."
              rows={2}
              className="app-input resize-none text-sm"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!editText.trim() || saving}
                className="app-button app-button-primary min-h-0 px-3 py-1.5 text-xs"
              >
                保存
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(sentence.text); setEditNote(sentence.note ?? '') }}
                className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
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
    <tr className="border-b border-[#d6e3ed] transition-colors hover:bg-[#f8fbff]">
      <td className="max-w-0 w-1/2 px-4 py-4 font-mono text-sm text-slate-900">
        <span className="block truncate" title={sentence.text}>
          {sentence.text}
        </span>
      </td>
      <td className="max-w-0 w-2/5 px-4 py-4 text-sm text-slate-500">
        <span className="block truncate" title={sentence.note ?? ''}>
          {sentence.note ?? <span className="text-slate-300">—</span>}
        </span>
      </td>
      <td className="px-4 py-4 text-right whitespace-nowrap">
        {confirmDelete ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="text-slate-500">削除しますか?</span>
            <button
              onClick={handleDelete}
              className="app-button app-button-danger min-h-0 px-2.5 py-1 text-xs"
            >
              削除
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="app-button app-button-subtle min-h-0 px-2.5 py-1 text-xs"
            >
              戻す
            </button>
          </span>
        ) : (
          <span className="inline-flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="app-button app-button-secondary min-h-0 px-3 py-1.5 text-xs"
            >
              編集
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="app-button app-button-danger min-h-0 px-3 py-1.5 text-xs"
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
      <div className="app-card-soft px-6 py-12 text-center text-sm text-slate-500">
        文章がまだありません。追加するか CSV をインポートして練習のベースを作ってください。
      </div>
    )
  }

  return (
    <div className="app-table overflow-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="app-table-head border-b border-[#d6e3ed]">
            <th className="w-1/2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
              Text
            </th>
            <th className="w-2/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
              攻略メモ
            </th>
            <th className="px-4 py-3 w-24" />
          </tr>
        </thead>
        <tbody className="bg-white">
          {sentences.map((s) => (
            <SentenceRow key={s.id} sentence={s} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
