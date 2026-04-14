import { useEffect, useState } from 'react'
import type { SessionResult } from '../../hooks/useTypingSession'
import { formatWeaknessReason } from '../../lib/typingAnalysis'
import { WpmDisplay } from '../ui/WpmDisplay'

interface Props {
  mode: 'sentence' | 'random' | 'weak_word' | 'word_drill'
  result: SessionResult
  totalCount: number
  onRestart: () => void
  onGoBack: () => void
  onStartWeakWordSession: () => Promise<void>
  canStartWeakWordSession: boolean
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
  canStartWeakWordSession,
  isMockMode,
  returnLabel,
}: Props) {
  const { accuracy, wpm, durationMs, totalKeys, totalMisses, wordStats, bigramStats } = result
  const seconds = (durationMs / 1000).toFixed(1)
  const [startingWeakWordSession, setStartingWeakWordSession] = useState(false)
  const [weakWordError, setWeakWordError] = useState<string | null>(null)

  const title = mode === 'weak_word'
    ? '苦手ワード練習結果'
    : mode === 'word_drill'
      ? 'ワードドリル結果'
    : mode === 'random'
      ? 'ランダムワード練習結果'
      : 'セッション結果'
  const completedLabel = mode === 'word_drill' ? '回完了' : '問完了'

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
    if (!canStartWeakWordSession) {
      return
    }

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
    <div className="app-page px-5 py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="app-card px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="app-chip app-chip-info">Results</div>
              <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500">{totalCount} {completedLabel} / R でリスタート</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="精度" value={`${accuracy}%`} color="text-emerald-600" />
              <div className="app-card-soft min-w-[120px] p-4 text-center">
                <div className="text-3xl font-bold">
                  <WpmDisplay wpm={wpm} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">WPM</div>
              </div>
              <Metric label="タイム" value={`${seconds}s`} color="text-amber-600" />
              <Metric
                label="ミス / 打鍵"
                value={`${totalMisses} / ${totalKeys}`}
                color="text-rose-500"
              />
            </div>
          </div>
        </section>

        <section className="app-card px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row">
            <button
              onClick={onRestart}
              className="app-button app-button-primary flex-1"
            >
              新しいセッション
            </button>
            <button
              onClick={() => void handleWeakWordClick()}
              disabled={!canStartWeakWordSession || isMockMode || startingWeakWordSession}
              className="app-button app-button-secondary flex-1"
            >
              {startingWeakWordSession && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3ea8ff]/40 border-t-[#3ea8ff]" />
              )}
              {canStartWeakWordSession ? '苦手ワード練習' : 'ログインで苦手ワード練習'}
            </button>
            <button
              onClick={onGoBack}
              className="app-button app-button-subtle flex-1"
            >
              {returnLabel}
            </button>
          </div>
          {weakWordError && (
            <p className="mt-4 text-sm text-rose-600">{weakWordError}</p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="app-card px-6 py-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              苦手ワード
            </h3>
            <p className="mb-4 mt-2 text-sm text-slate-500">
              優先度は「ミス率・遅さ・停止」をまとめた並び順用の総合スコアです。
            </p>
            {wordStats.length === 0 ? (
              <p className="app-card-soft px-4 py-6 text-sm text-slate-500">目立った苦手ワードなし</p>
            ) : (
              <ul className="space-y-3">
                {wordStats.map((w) => (
                  <li key={w.word} className="app-card-soft px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="font-mono text-slate-900">{w.word}</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {w.weaknessReasons.map((reason) => (
                            <span
                              key={reason}
                              className="app-chip app-chip-warning"
                            >
                              {formatWeaknessReason(reason)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-sm text-slate-500">
                        優先度 {Math.round(w.weaknessScore)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="app-chip app-chip-danger">
                        ミス率 {Math.round(w.missRate * 100)}%
                      </span>
                      <span className="app-chip app-chip-info">
                        {Math.round(w.msPerChar)} ms/char
                      </span>
                      <span className="app-chip app-chip-warning">
                        停止 {w.stallCount}回
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="app-card px-6 py-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              キー入力ミスの多い運指
            </h3>
            <p className="mb-4 mt-2 text-sm text-slate-500">
              ミス率が高いキー遷移を見つけ、次の運指練習の候補にします。
            </p>
            {bigramStats.length === 0 ? (
              <p className="app-card-soft px-4 py-6 text-sm text-slate-500">苦手なし</p>
            ) : (
              <ul className="space-y-2">
                {bigramStats.map((b) => (
                  <li key={b.bigram} className="app-card-soft flex items-center justify-between px-4 py-3">
                    <span className="font-mono tracking-widest text-slate-900">
                      {b.bigram[0] === ' '
                        ? b.bigram[1]
                        : `${b.bigram[0]}→${b.bigram[1]}`}
                    </span>
                    <span className="ml-4 text-sm text-rose-500">
                      {b.misses}/{b.attempts}
                      <span className="ml-1 text-slate-500">
                        ({Math.round(b.missRate * 100)}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="app-card-soft min-w-[120px] p-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
    </div>
  )
}
