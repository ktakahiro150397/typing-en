import { useState, useCallback } from 'react'
import { TypingArea } from './components/TypingArea/TypingArea'
import { CommandHistory } from './components/CommandHistory/CommandHistory'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { useTypingSession } from './hooks/useTypingSession'
import { generateWordSequence } from './utils/textGenerator'

// 末尾が '.' → ピリオドで完了 / それ以外 → 末尾スペースでスペースキー完了
function normalizeText(text: string): string {
  const t = text.trim()
  return t.endsWith('.') ? t : t + ' '
}

function generateSessionTexts(count: number): string[] {
  return Array.from({ length: count }, () => normalizeText(generateWordSequence(5)))
}

const DEFAULT_COUNT = 10

export default function App() {
  const [texts, setTexts] = useState<string[]>(() => generateSessionTexts(DEFAULT_COUNT))

  const { engineState, handleKey, phase, currentIndex, totalCount, result, restartSession } =
    useTypingSession(texts)

  const handleRestart = useCallback(() => {
    const next = generateSessionTexts(DEFAULT_COUNT)
    setTexts(next)
    restartSession(next)
  }, [restartSession])

  if (phase === 'results' && result) {
    return (
      <ResultsScreen result={result} totalCount={totalCount} onRestart={handleRestart} />
    )
  }

  const prevText = currentIndex > 0 ? texts[currentIndex - 1] : null
  const nextText = currentIndex < texts.length - 1 ? texts[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-wide">typing-en</h1>
        <div className="text-sm text-gray-400">
          {currentIndex + 1} / {totalCount}
          &nbsp;|&nbsp;misses: {engineState.misses}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-3 max-w-3xl mx-auto w-full">

        {/* 前の問題 */}
        <div className="w-full min-h-[2rem]">
          {prevText ? (
            <div className="font-mono text-sm text-gray-600 line-through px-1 truncate">
              {prevText}
            </div>
          ) : (
            <div className="h-[2rem]" />
          )}
        </div>

        {/* 現在の問題 */}
        <div className="w-full bg-gray-800 rounded-xl p-8 shadow-lg ring-1 ring-gray-600">
          <TypingArea state={engineState} onKey={handleKey} />
        </div>

        {/* 次の問題 */}
        <div className="w-full min-h-[3.5rem]">
          {nextText ? (
            <div className="bg-gray-800/40 rounded-lg px-4 py-2.5 border border-dashed border-gray-600">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-3">
                NEXT
              </span>
              <span className="font-mono text-sm text-gray-400">{nextText}</span>
            </div>
          ) : currentIndex === totalCount - 1 ? (
            <div className="bg-gray-800/40 rounded-lg px-4 py-2.5 border border-dashed border-indigo-800">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mr-3">
                LAST
              </span>
              <span className="text-sm text-gray-500">これが最後の問題です</span>
            </div>
          ) : (
            <div className="h-[3.5rem]" />
          )}
        </div>

        {/* コマンド履歴 */}
        <div className="w-full bg-gray-800 rounded-xl px-4 py-3 min-h-[3rem]">
          <CommandHistory history={engineState.keyHistory} />
        </div>
      </main>
    </div>
  )
}
