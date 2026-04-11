import { useState } from 'react'
import type { Sentence } from '../../lib/sentences'

interface Props {
  sentences: Sentence[]
  onStart: (sentences: Sentence[]) => void
  onClose: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function StartSessionModal({ sentences, onStart, onClose }: Props) {
  const defaultCount = Math.min(10, sentences.length)
  const [count, setCount] = useState(defaultCount)

  const handleStart = () => {
    const selected = shuffle(sentences).slice(0, count)
    onStart(selected)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-gray-700 space-y-6">
        <h3 className="text-lg font-bold text-gray-100">セッション開始</h3>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">問題数（登録文章からランダム選択）</label>
          <input
            type="number"
            min={1}
            max={sentences.length}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(sentences.length, Number(e.target.value))))}
            className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2 text-center text-xl font-mono outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 text-center">
            登録文章: {sentences.length}件
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
          >
            スタート
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
