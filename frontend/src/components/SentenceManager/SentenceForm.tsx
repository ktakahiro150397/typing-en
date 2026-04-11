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
      className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-3"
    >
      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a sentence..."
          className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          autoFocus
        />
      </div>
      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="攻略メモ (optional)..."
          rows={2}
          className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 resize-none"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
