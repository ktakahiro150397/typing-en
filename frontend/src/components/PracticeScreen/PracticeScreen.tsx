import { useEffect, useMemo, useRef, useState } from 'react'
import { CommandHistory } from '../CommandHistory/CommandHistory'
import { TypingArea } from '../TypingArea/TypingArea'
import { useTypingSession, type SessionResult } from '../../hooks/useTypingSession'
import { DEFAULT_MISS_LOCK_MS } from '../../hooks/useTypingEngine'
import { getLiveTypingFeedback } from '../../lib/typingAnalysis'
import { useSettingsStore } from '../../stores/settingsStore'
import { DEFAULT_USER_SETTINGS } from '../../lib/settings'

interface SessionText {
  text: string
  sentenceId: string | null
  translation: string | null
}

interface Props {
  mode: 'sentence' | 'random' | 'weak_word' | 'word_drill'
  sessionItems: SessionText[]
  onComplete: (result: SessionResult) => void
  onAbort: () => void
  onLogout?: () => void
  canUseSavedSettings: boolean
  returnPath: string
}

function getReturnLabel(returnPath: string): string {
  if (returnPath === '/analysis') return '分析へ戻る'
  if (returnPath === '/library') return 'ライブラリへ戻る'
  return 'ホームへ戻る'
}

function getModeLabel(mode: Props['mode']) {
  if (mode === 'weak_word') return 'Weak words'
  if (mode === 'word_drill') return 'Word drill'
  if (mode === 'random') return 'Random'
  return 'Sentence'
}

export function PracticeScreen({
  mode,
  sessionItems,
  onComplete,
  onAbort,
  onLogout,
  canUseSavedSettings,
  returnPath,
}: Props) {
  const texts = sessionItems.map((item) => item.text)
  const settings = useSettingsStore((state) => state.settings)
  const settingsLoading = useSettingsStore((state) => state.loading)
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const activeSettings = canUseSavedSettings ? (settings ?? DEFAULT_USER_SETTINGS) : DEFAULT_USER_SETTINGS
  const { engineState, handleKey, phase, currentIndex, totalCount, result, sessionMisses } = useTypingSession(
    texts,
    activeSettings.missLockMs ?? DEFAULT_MISS_LOCK_MS,
    activeSettings.penaltyResume,
  )
  const [lockRemaining, setLockRemaining] = useState(0)
  const completedRef = useRef(false)
  const liveFeedback = useMemo(
    () => (mode === 'word_drill'
      ? null
      : getLiveTypingFeedback({
          text: engineState.text,
          keyHistory: engineState.keyHistory,
          startedAt: engineState.startedAt,
          cursor: engineState.cursor,
          missLockMs: activeSettings.missLockMs,
        })),
    [activeSettings.missLockMs, engineState.cursor, engineState.keyHistory, engineState.startedAt, engineState.text, mode],
  )

  useEffect(() => {
    if (!canUseSavedSettings) {
      setSettingsError(null)
      return () => undefined
    }

    let cancelled = false
    setSettingsError(null)

    fetchSettings().catch((error: unknown) => {
      if (!cancelled) {
        setSettingsError(error instanceof Error ? error.message : '設定の取得に失敗しました')
      }
    })

    return () => {
      cancelled = true
    }
  }, [canUseSavedSettings, fetchSettings])

  useEffect(() => {
    if (!engineState.lockedUntil) {
      setLockRemaining(0)
      return
    }

    const lockedUntil = engineState.lockedUntil
    const tick = () => setLockRemaining(Math.max(0, lockedUntil - Date.now()))
    tick()
    const id = setInterval(tick, 50)
    return () => clearInterval(id)
  }, [engineState.lockedUntil])

  useEffect(() => {
    if (phase !== 'results' || !result || completedRef.current) return
    completedRef.current = true
    onComplete(result)
  }, [onComplete, phase, result])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onAbort()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onAbort])

  const prevText = currentIndex > 0 ? texts[currentIndex - 1] : null
  const nextText = currentIndex < texts.length - 1 ? texts[currentIndex + 1] : null
  const currentTranslation = mode === 'sentence'
    ? sessionItems[currentIndex]?.translation?.trim() || null
    : null
  const isLast = currentIndex === totalCount - 1
  const settingsReady = !canUseSavedSettings || settings !== null

  if (canUseSavedSettings && !settingsReady && settingsLoading) {
    return (
      <div className="app-page flex flex-col">
        <header className="border-b border-[#d6e3ed]/80 bg-white/88 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3ea8ff]">typing-en</p>
              <div className="app-chip app-chip-info">{getModeLabel(mode)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={onAbort}
                className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
              >
                {getReturnLabel(returnPath)}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
                >
                  ログアウト
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4 px-5 py-8 lg:px-8">
          <div className="app-card flex items-center gap-4 px-6 py-5">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d6e3ed] border-t-[#3ea8ff]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">設定を読み込んでいます</p>
              <p className="text-sm text-slate-500">セッション開始前に反映します。</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (canUseSavedSettings && !settingsReady && settingsError) {
    return (
      <div className="app-page flex flex-col">
        <header className="border-b border-[#d6e3ed]/80 bg-white/88 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3ea8ff]">typing-en</p>
              <div className="app-chip app-chip-info">{getModeLabel(mode)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={onAbort}
                className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
              >
                {getReturnLabel(returnPath)}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
                >
                  ログアウト
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4 px-5 py-8 lg:px-8">
          <div className="app-card space-y-4 px-6 py-6">
            <div className="app-banner app-banner-danger">{settingsError}</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setSettingsError(null)
                  void fetchSettings().catch((error: unknown) => {
                    setSettingsError(error instanceof Error ? error.message : '設定の取得に失敗しました')
                  })
                }}
                className="app-button app-button-primary"
              >
                再試行
              </button>
              <button
                onClick={onAbort}
                className="app-button app-button-subtle"
              >
                {getReturnLabel(returnPath)}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-page flex flex-col">
      <header className="border-b border-[#d6e3ed]/80 bg-white/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3ea8ff]">typing-en</p>
            <div className="app-chip app-chip-info">{getModeLabel(mode)}</div>
            <button
              onClick={onAbort}
              className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
            >
              {getReturnLabel(returnPath)}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="app-chip app-chip-info">{currentIndex + 1} / {totalCount}</div>
            <div className="app-chip app-chip-danger">misses {sessionMisses}</div>
            <div className="app-chip app-chip-info">
              penalty {activeSettings.missLockMs}ms / {activeSettings.penaltyResume === 'word' ? 'word' : 'current'}
            </div>
            <div className="app-chip app-chip-warning">Esc で中断</div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="app-button app-button-subtle min-h-0 px-3 py-1.5 text-xs"
              >
                ログアウト
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4 px-5 py-8 lg:px-8">
        <div className="app-card-soft flex min-h-[64px] items-center px-5 py-4">
          {prevText && (
            <div className="truncate font-mono text-sm text-slate-400 line-through">{prevText}</div>
          )}
        </div>

        <div className={`app-card w-full p-6 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ring-2 transition-colors sm:p-8 ${lockRemaining > 0 ? 'ring-rose-300' : 'ring-[#d6e3ed]'}`}>
          <TypingArea state={engineState} onKey={handleKey} lockRemaining={lockRemaining} />
        </div>

        {currentTranslation && (
          <div className="rounded-3xl border border-[#c7d2fe] bg-[#eef2ff] px-5 py-4 shadow-[0_8px_24px_rgba(99,102,241,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f46e5]">日本語訳</p>
            <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-900">{currentTranslation}</p>
          </div>
        )}

        {mode !== 'word_drill' && (
          <div className="min-h-[32px]">
            {liveFeedback && (
              <div
                className={`app-chip ${
                  liveFeedback.reason === 'stall'
                    ? 'app-chip-warning'
                    : 'app-chip-info'
                }`}
              >
                {liveFeedback.message}
              </div>
            )}
          </div>
        )}

        <div className="min-h-[72px]">
          {nextText ? (
            <div className="app-card-soft flex h-full items-center border-dashed px-4 py-4">
              <span className="mr-3 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                NEXT
              </span>
              <span className="truncate font-mono text-sm text-slate-500">{nextText}</span>
            </div>
          ) : isLast ? (
            <div className="app-card-soft flex h-full items-center border-dashed px-4 py-4">
              <span className="mr-3 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                LAST
              </span>
              <span className="text-sm text-slate-500">これが最後の問題です</span>
            </div>
          ) : null}
        </div>

        <div className="app-card flex min-h-[80px] flex-col gap-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Command history</p>
            <p className="text-xs text-slate-400">入力の流れを右から確認できます</p>
          </div>
          <div className="overflow-hidden">
            <CommandHistory history={engineState.keyHistory} />
          </div>
        </div>
      </main>
    </div>
  )
}
