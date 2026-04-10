import { useState, useCallback } from 'react'
import { TypingArea } from './components/TypingArea/TypingArea'
import { CommandHistory } from './components/CommandHistory/CommandHistory'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { useTypingSession } from './hooks/useTypingSession'
import { generateWordSequence } from './utils/textGenerator'

function normalizeText(text: string): string {
  const t = text.trim()
  return t.endsWith('.') ? t : t + ' '
}

function generateSessionTexts(count: number): string[] {
  return Array.from({ length: count }, () => normalizeText(generateWordSequence(5)))
}

const DEFAULT_COUNT = 3

export default function App() {
  const [texts, setTexts] = useState<string[]>(() => generateSessionTexts(DEFAULT_COUNT))

  const { engineState, handleKey, phase, currentIndex, totalCount, result, restartSession, sessionMisses } =
    useTypingSession(texts)

  const handleRestart = useCallback(() => {
    const next = generateSessionTexts(DEFAULT_COUNT)
    setTexts(next)
    restartSession(next)
  }, [restartSession])

  if (phase === 'results' && result) {
    return <ResultsScreen result={result} totalCount={totalCount} onRestart={handleRestart} />
  }

  const prevText = currentIndex > 0 ? texts[currentIndex - 1] : null
  const nextText = currentIndex < texts.length - 1 ? texts[currentIndex + 1] : null
  const isLast = currentIndex === totalCount - 1

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-wide">typing-en</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{currentIndex + 1} / {totalCount}</span>
          <span className="text-red-400 font-mono">
            misses: <strong>{sessionMisses}</strong>
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-3 max-w-3xl mx-auto w-full">

        {/* 前の問題 — 固定高さ */}
        <div className="w-full h-8 overflow-hidden flex items-center">
          {prevText && (
            <div className="font-mono text-sm text-gray-600 line-through truncate">{prevText}</div>
          )}
        </div>

        {/* 現在の問題 */}
        <div className="w-full bg-gray-800 rounded-xl p-8 shadow-lg ring-1 ring-gray-600">
          <TypingArea state={engineState} onKey={handleKey} />
        </div>

        {/* 次の問題 — 固定高さ */}
        <div className="w-full h-14 overflow-hidden">
          {nextText ? (
            <div className="h-full flex items-center bg-gray-800/40 rounded-lg px-4 border border-dashed border-gray-600">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-3 shrink-0">
                NEXT
              </span>
              <span className="font-mono text-sm text-gray-400 truncate">{nextText}</span>
            </div>
          ) : isLast ? (
            <div className="h-full flex items-center bg-gray-800/40 rounded-lg px-4 border border-dashed border-indigo-800">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mr-3 shrink-0">
                LAST
              </span>
              <span className="text-sm text-gray-500">これが最後の問題です</span>
            </div>
          ) : null}
        </div>

        {/* コマンド履歴 — 固定高さ・折り返しなし */}
        <div className="w-full bg-gray-800 rounded-xl px-4 h-12 flex items-center overflow-hidden">
          <CommandHistory history={engineState.keyHistory} />
        </div>
      </main>
    </div>
  )
}
