import { useEffect, useState } from 'react'
import type { WeakWord } from '../../lib/weakWords'

interface Props {
  word: WeakWord
  onStart: (word: string, count: number) => void
  onClose: () => void
}

const DRILL_COUNTS = [5, 10, 20, 30, 50] as const

export function WordDrillModal({ word, onStart, onClose }: Props) {
  const [count, setCount] = useState<number>(10)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-800 p-8 shadow-2xl">
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-gray-100">ワードドリル</h3>
            <p className="mt-2 text-sm text-gray-400">同じ単語を繰り返し打って苦手な運指を固めます。</p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-gray-500">対象ワード</p>
            <p className="mt-2 font-mono text-2xl text-white">{word.word}</p>
            {word.note && (
              <p className="mt-3 text-sm text-amber-300">{word.note}</p>
            )}
          </div>

          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
            速さより指の動きを意識。ゆっくり正確に打ち、慣れたら少しずつ速度を上げます。
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">繰り返し回数</p>
            <div className="flex flex-wrap gap-2">
              {DRILL_COUNTS.map((option) => (
                <button
                  key={option}
                  onClick={() => setCount(option)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    count === option
                      ? 'bg-sky-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option}回
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onStart(word.word, count)}
              className="flex-1 rounded-xl bg-amber-600 py-3 font-semibold text-white transition-colors hover:bg-amber-500"
            >
              ドリル開始
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-700 py-3 text-gray-300 transition-colors hover:bg-gray-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
