import { useEffect, useState } from 'react'
import type { SessionResult } from '../../hooks/useTypingSession'

interface Props {
  mode: 'sentence' | 'random' | 'weak_word'
  result: SessionResult
  totalCount: number
  onRestart: () => void
  onGoBack: () => void
  onStartWeakWordSession: () => Promise<void>
  isMockMode: boolean
  returnLabel: string
}

export function ResultsScreen({
  mode,
  result,
  totalCount,
  onRestart,
  onGoBack,
  onStartWeakWordSession,
  isMockMode,
  returnLabel,
}: Props) {
  const { accuracy, wpm, durationMs, totalKeys, totalMisses, wordStats, bigramStats } = result
  const seconds = (durationMs / 1000).toFixed(1)
  const [startingWeakWordSession, setStartingWeakWordSession] = useState(false)
  const [weakWordError, setWeakWordError] = useState<string | null>(null)

  const title = mode === 'weak_word'
    ? '苦手ワード練習結果'
    : mode === 'random'
      ? 'ランダムワード練習結果'
      : 'セッション結果'

  useEffect(() => {
    function handleRestartKey(event: KeyboardEvent) {
      if (event.key !== 'r' && event.key !== 'R') return
      event.preventDefault()
      onRestart()
    }

    window.addEventListener('keydown', handleRestartKey)
    return () => window.removeEventListener('keydown', handleRestartKey)
  }, [onRestart])

  const handleWeakWordClick = async () => {
    setStartingWeakWordSession(true)
    setWeakWordError(null)
    try {
      await onStartWeakWordSession()
    } catch (err) {
      setWeakWordError(err instanceof Error ? err.message : '苦手ワード練習を開始できませんでした')
      setStartingWeakWordSession(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-start py-12 px-6">
      <h2 className="text-3xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-8">{totalCount} 問完了 / R でリスタート</p>

      {/* サマリー指標 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mb-10">
        <Metric label="精度" value={`${accuracy}%`} color="text-green-400" />
        <Metric label="WPM" value={String(wpm)} color="text-blue-400" />
        <Metric label="タイム" value={`${seconds}s`} color="text-yellow-400" />
        <Metric
          label="ミス / 打鍵"
          value={`${totalMisses} / ${totalKeys}`}
          color="text-red-400"
        />
      </div>

      <div className="w-full max-w-2xl grid sm:grid-cols-2 gap-6 mb-10">
        {/* ミスの多いワード */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            ミスの多いワード
          </h3>
          {wordStats.length === 0 ? (
            <p className="text-gray-600 text-sm">ミスなし</p>
          ) : (
            <ul className="space-y-2">
              {wordStats.map((w) => (
                <li key={w.word} className="flex items-center justify-between">
                  <span className="font-mono text-white">{w.word}</span>
                  <span className="text-sm text-red-400 ml-4">
                    {w.misses} ミス
                    <span className="text-gray-500 ml-1">
                      ({Math.round(w.missRate * 100)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 苦手な運指（Bigram） */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            キー入力ミスの多い運指
          </h3>
          {bigramStats.length === 0 ? (
            <p className="text-gray-600 text-sm">苦手なし</p>
          ) : (
            <ul className="space-y-2">
              {bigramStats.map((b) => (
                <li key={b.bigram} className="flex items-center justify-between">
                  <span className="font-mono text-white tracking-widest">
                    {b.bigram[0] === ' '
                      ? b.bigram[1]
                      : `${b.bigram[0]}→${b.bigram[1]}`}
                  </span>
                  <span className="text-sm text-red-400 ml-4">
                    {b.misses}/{b.attempts}
                    <span className="text-gray-500 ml-1">
                      ({Math.round(b.missRate * 100)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg transition-colors"
        >
          新しいセッション
        </button>
        <button
          onClick={() => void handleWeakWordClick()}
          disabled={isMockMode || startingWeakWordSession}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-xl font-semibold text-lg transition-colors inline-flex items-center justify-center gap-2"
        >
          {startingWeakWordSession && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          苦手ワード練習
        </button>
        <button
          onClick={onGoBack}
          className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-lg transition-colors"
        >
          {returnLabel}
        </button>
      </div>

      {weakWordError && (
        <p className="mt-4 text-sm text-red-300">{weakWordError}</p>
      )}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{label}</div>
    </div>
  )
}
