import { useEffect, useMemo, useState } from 'react'
import type { Sentence } from '../../lib/sentences'
import {
  filterSentencesByCategories,
  listSentenceCategories,
  pickSessionSentences,
} from '../../lib/sentenceCategories'

export function StartSessionModal({ sentences, onStart, onClose }: Props) {
  const defaultCount = Math.min(10, sentences.length)
  const [count, setCount] = useState(defaultCount)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const availableCategories = useMemo(() => listSentenceCategories(sentences), [sentences])
  const matchingSentences = useMemo(
    () => filterSentencesByCategories(sentences, selectedCategories),
    [selectedCategories, sentences],
  )
  const matchingCount = matchingSentences.length
  const countMax = selectedCategories.length > 0 ? Math.max(matchingCount, 1) : sentences.length

  useEffect(() => {
    setCount((current) => Math.max(1, Math.min(Math.max(matchingCount, 1), current)))
  }, [matchingCount])

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => (
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    ))
  }

  const handleStart = () => {
    const { selectedSentences } = pickSessionSentences(sentences, count, selectedCategories)
    if (selectedSentences.length === 0) return
    onStart(selectedSentences, sentences, count, selectedCategories)
  }

  return (
    <div className="app-modal-backdrop">
      <div className="app-modal-panel max-w-2xl space-y-6 p-8">
        <div className="space-y-2">
          <div className="app-chip app-chip-info">Session setup</div>
          <h3 className="text-xl font-bold text-slate-900">セッション開始</h3>
          <p className="text-sm text-slate-500">
            カテゴリを選ぶとその範囲から出題します。未選択ならおまかせで1カテゴリを選んで出題します。
          </p>
        </div>

        <div className="app-card-soft space-y-2 px-4 py-4">
          <label className="block text-sm font-semibold text-slate-700">問題数</label>
          <input
            type="number"
            min={1}
            max={countMax}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(countMax, Number(e.target.value))))}
            className="app-input text-center font-mono text-2xl"
          />
          <p className="text-center text-sm text-slate-500">
            {selectedCategories.length > 0
              ? `${matchingCount}件が候補です`
              : availableCategories.length > 0
                ? 'カテゴリ未選択時は開始時に1カテゴリをランダム選択します'
                : `登録文章 ${sentences.length}件の中から出題します`}
          </p>
        </div>

        {availableCategories.length > 0 && (
          <div className="app-card-soft space-y-3 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">カテゴリ</p>
              <p className="text-xs text-slate-500">複数選択可。未選択ならおまかせです。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => {
                const checked = selectedCategories.includes(category)
                return (
                  <label
                    key={category}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? 'border-[#3ea8ff] bg-[#eff6ff] text-[#1d4ed8]'
                        : 'border-[#d6e3ed] bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category)}
                      className="h-4 w-4 rounded border-[#d6e3ed] bg-white text-[#3ea8ff] focus:ring-[#3ea8ff]"
                    />
                    {category}
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleStart}
            disabled={selectedCategories.length > 0 && matchingCount === 0}
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

interface Props {
  sentences: Sentence[]
  onStart: (
    selectedSentences: Sentence[],
    sourceSentences: Sentence[],
    count: number,
    selectedCategories: string[],
  ) => void
  onClose: () => void
}
