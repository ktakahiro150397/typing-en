import { useState, useEffect, useCallback } from 'react'
import { TypingArea } from './components/TypingArea/TypingArea'
import { CommandHistory } from './components/CommandHistory/CommandHistory'
import { useTypingEngine } from './hooks/useTypingEngine'
import { generateWordSequence } from './utils/textGenerator'

// 文章はピリオド終わり → ピリオドで完了
// 単語はスペースなし → 末尾にスペースを付与してスペースで完了
function normalizeText(text: string): string {
  const t = text.trim()
  if (t.endsWith('.')) return t
  return t + ' '
}

const SAMPLE_TEXTS = [
  'the quick brown fox jumps over the lazy dog.',
  'practice makes perfect.',
  'type without looking at the keyboard.',
  'speed comes after accuracy.',
  'algorithm',
  'efficiency',
  'keyboard',
]

export default function App() {
  const [queue, setQueue] = useState<string[]>(() =>
    SAMPLE_TEXTS.map(normalizeText),
  )
  const [index, setIndex] = useState(0)

  const currentText = queue[index] ?? ''
  const { state, handleKey, reset } = useTypingEngine(currentText)

  // 完了時に自動で次の問題へ
  useEffect(() => {
    if (!state.isComplete) return
    const timer = setTimeout(() => {
      setIndex((i) => Math.min(i + 1, queue.length - 1))
    }, 1200)
    return () => clearTimeout(timer)
  }, [state.isComplete, queue.length])

  // indexが変わったらエンジンをリセット
  useEffect(() => {
    reset(queue[index] ?? '')
  }, [index, queue, reset])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, queue.length - 1))
  }, [queue.length])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  function addRandom() {
    const text = normalizeText(generateWordSequence(5))
    setQueue((q) => [...q, text])
  }

  const prevText = index > 0 ? queue[index - 1] : null
  const nextText = index < queue.length - 1 ? queue[index + 1] : null

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-wide">typing-en</h1>
        <div className="text-sm text-gray-400">
          {index + 1} / {queue.length} &nbsp;|&nbsp;
          cursor: {state.cursor} / {state.text.length} &nbsp;|&nbsp;
          misses: {state.misses}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-3 max-w-3xl mx-auto w-full">

        {/* 前の問題 */}
        <div className="w-full min-h-[2.5rem]">
          {prevText ? (
            <div className="font-mono text-base text-gray-600 line-through px-2">
              {prevText}
            </div>
          ) : (
            <div className="h-[2.5rem]" />
          )}
        </div>

        {/* 現在の問題 */}
        <div className="w-full bg-gray-800 rounded-xl p-8 shadow-lg ring-1 ring-gray-600">
          <TypingArea state={state} onKey={handleKey} />
        </div>

        {/* 次の問題 */}
        <div className="w-full min-h-[4rem]">
          {nextText ? (
            <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-dashed border-gray-600">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-3">
                NEXT
              </span>
              <span className="font-mono text-base text-gray-400">{nextText}</span>
            </div>
          ) : (
            <div className="h-[4rem]" />
          )}
        </div>

        {/* コマンド履歴 */}
        <div className="w-full bg-gray-800 rounded-xl px-4 py-3 min-h-[3rem]">
          <CommandHistory history={state.keyHistory} />
        </div>

        {/* コントロール */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            ← 前へ
          </button>
          <button
            onClick={() => reset(currentText)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            リセット
          </button>
          <button
            onClick={goNext}
            disabled={index === queue.length - 1}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            次へ →
          </button>
          <button
            onClick={addRandom}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm transition-colors"
          >
            ランダム追加
          </button>
        </div>
      </main>
    </div>
  )
}
