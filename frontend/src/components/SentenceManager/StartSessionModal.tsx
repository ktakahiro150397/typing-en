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
    <div className="app-modal-backdrop">
      <div className="app-modal-panel max-w-md space-y-6 p-8">
        <div className="space-y-2">
          <div className="app-chip app-chip-info">Session setup</div>
          <h3 className="text-xl font-bold text-slate-900">セッション開始</h3>
          <p className="text-sm text-slate-500">
            登録文章からランダムに出題します。最初は少なめに設定して、正確性を優先して進めるのがおすすめです。
          </p>
        </div>

        <div className="app-card-soft space-y-2 px-4 py-4">
          <label className="block text-sm font-semibold text-slate-700">問題数</label>
          <input
            type="number"
            min={1}
            max={sentences.length}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(sentences.length, Number(e.target.value))))}
            className="app-input text-center font-mono text-2xl"
          />
          <p className="text-center text-sm text-slate-500">
            登録文章 {sentences.length}件の中から出題します
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleStart}
            className="app-button app-button-primary flex-1"
          >
            スタート
          </button>
          <button
            onClick={onClose}
            className="app-button app-button-subtle flex-1"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
