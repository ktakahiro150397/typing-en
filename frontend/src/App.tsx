import { useState } from 'react'
import { TypingArea } from './components/TypingArea/TypingArea'
import { CommandHistory } from './components/CommandHistory/CommandHistory'
import { useTypingEngine } from './hooks/useTypingEngine'
import { generateWordSequence } from './utils/textGenerator'

const SAMPLE_SENTENCES = [
  'the quick brown fox jumps over the lazy dog',
  'practice makes perfect',
  'type without looking at the keyboard',
  'speed comes after accuracy',
]

export default function App() {
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const currentText = SAMPLE_SENTENCES[sentenceIndex]

  const { state, handleKey, reset } = useTypingEngine(currentText)

  function nextSentence() {
    const next = (sentenceIndex + 1) % SAMPLE_SENTENCES.length
    setSentenceIndex(next)
    reset(SAMPLE_SENTENCES[next])
  }

  function randomText() {
    const text = generateWordSequence(6)
    reset(text)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">typing-en</h1>
        <div className="text-sm text-gray-400">
          cursor: {state.cursor} / {state.text.length} &nbsp;|&nbsp; misses: {state.misses}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8 max-w-3xl mx-auto w-full">
        {/* タイピングエリア */}
        <div className="w-full bg-gray-800 rounded-xl p-8 shadow-lg">
          <TypingArea state={state} onKey={handleKey} />
        </div>

        {/* コマンド履歴 */}
        <div className="w-full bg-gray-800 rounded-xl p-4 shadow-lg min-h-[3rem]">
          <CommandHistory history={state.keyHistory} />
        </div>

        {/* コントロール */}
        <div className="flex gap-4">
          <button
            onClick={() => reset(currentText)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            リセット
          </button>
          <button
            onClick={nextSentence}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            次の文章
          </button>
          <button
            onClick={randomText}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm transition-colors"
          >
            ランダム
          </button>
        </div>
      </main>
    </div>
  )
}
