import { useState } from 'react'
import { useSentenceStore } from '../../stores/sentenceStore'

export function SentenceForm({ onClose }: { onClose: () => void }) {
  const addSentence = useSentenceStore((s) => s.addSentence)
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await addSentence(text.trim(), note.trim() || undefined)
      setText('')
      setNote('')
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="app-card-soft space-y-5 p-5"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900">文章を追加</h3>
        <p className="text-sm text-slate-500">練習に使う文章と、必要なら攻略メモを登録します。</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">文章</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例: The quick brown fox jumps over the lazy dog."
          className="app-input font-mono text-sm"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">攻略メモ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="運指のコツや注意点を残せます。"
          rows={3}
          className="app-input resize-none text-sm"
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="app-button app-button-primary"
        >
          {submitting ? '追加中...' : '追加する'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="app-button app-button-subtle"
        >
          閉じる
        </button>
      </div>
    </form>
  )
}
