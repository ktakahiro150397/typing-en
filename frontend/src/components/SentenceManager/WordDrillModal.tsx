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
    <div className="app-modal-backdrop">
      <div className="app-modal-panel max-w-lg p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="app-chip app-chip-info">Word drill</div>
            <h3 className="text-xl font-bold text-slate-900">ワードドリル</h3>
            <p className="text-sm text-slate-500">同じ単語を繰り返し打って、苦手な運指を正確さ優先で固めます。</p>
          </div>

          <div className="app-card-soft px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">対象ワード</p>
            <p className="mt-2 font-mono text-2xl text-slate-900">{word.word}</p>
            {word.note && (
              <p className="mt-3 text-sm text-amber-700">{word.note}</p>
            )}
          </div>

          <div className="app-banner app-banner-info">
            速さより指の動きを意識。ゆっくり正確に打ち、慣れたら少しずつ速度を上げます。
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">繰り返し回数</p>
            <div className="flex flex-wrap gap-2">
              {DRILL_COUNTS.map((option) => (
                <button
                  key={option}
                  onClick={() => setCount(option)}
                  className={`app-button min-h-0 px-4 py-2 text-sm ${
                    count === option ? 'app-button-primary' : 'app-button-subtle'
                  }`}
                >
                  {option}回
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onStart(word.word, count)}
              className="app-button app-button-primary flex-1"
            >
              ドリル開始
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
    </div>
  )
}
