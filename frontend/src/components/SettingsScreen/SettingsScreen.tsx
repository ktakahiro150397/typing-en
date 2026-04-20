import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../Layout/DashboardLayout'
import {
  DEFAULT_USER_SETTINGS,
  type PenaltyResume,
} from '../../lib/settings'
import { useSettingsStore } from '../../stores/settingsStore'

interface Props {
  onLogout: () => void
  userName: string
}

export function SettingsScreen({ onLogout, userName }: Props) {
  const settings = useSettingsStore((state) => state.settings)
  const loading = useSettingsStore((state) => state.loading)
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const [missLockMs, setMissLockMs] = useState(String(DEFAULT_USER_SETTINGS.missLockMs))
  const [penaltyResume, setPenaltyResume] = useState<PenaltyResume>(DEFAULT_USER_SETTINGS.penaltyResume)
  const [focusMode, setFocusMode] = useState(DEFAULT_USER_SETTINGS.focusMode)
  const [focusStart, setFocusStart] = useState(String(DEFAULT_USER_SETTINGS.focusStart))
  const [focusEnd, setFocusEnd] = useState(String(DEFAULT_USER_SETTINGS.focusEnd))
  const [focusRevealMs, setFocusRevealMs] = useState(String(DEFAULT_USER_SETTINGS.focusRevealMs))
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)

    fetchSettings().catch((fetchError: unknown) => {
      if (!cancelled) {
        setError(fetchError instanceof Error ? fetchError.message : '設定の取得に失敗しました')
      }
    })

    return () => {
      cancelled = true
    }
  }, [fetchSettings])

  useEffect(() => {
    if (!settings) {
      return
    }

    setMissLockMs(String(settings.missLockMs))
    setPenaltyResume(settings.penaltyResume)
    setFocusMode(settings.focusMode)
    setFocusStart(String(settings.focusStart))
    setFocusEnd(String(settings.focusEnd))
    setFocusRevealMs(String(settings.focusRevealMs))
  }, [settings])

  const parsedMissLockMs = Number(missLockMs)
  const isMissLockMsValid = missLockMs.trim() !== ''
    && Number.isInteger(parsedMissLockMs)
    && parsedMissLockMs >= 0
    && parsedMissLockMs <= 5000

  const parsedFocusStart = Number(focusStart)
  const parsedFocusEnd = Number(focusEnd)
  const parsedFocusRevealMs = Number(focusRevealMs)

  const isFocusStartValid = focusStart.trim() !== ''
    && Number.isInteger(parsedFocusStart)
    && parsedFocusStart >= 0
    && parsedFocusStart <= 100

  const isFocusEndValid = focusEnd.trim() !== ''
    && Number.isInteger(parsedFocusEnd)
    && parsedFocusEnd >= 1
    && parsedFocusEnd <= 200
    && parsedFocusEnd > parsedFocusStart

  const isFocusRevealMsValid = focusRevealMs.trim() !== ''
    && Number.isInteger(parsedFocusRevealMs)
    && parsedFocusRevealMs >= 0
    && parsedFocusRevealMs <= 10000

  const isFormValid = isMissLockMsValid && isFocusStartValid && isFocusEndValid && isFocusRevealMsValid

  const hasChanges = useMemo(() => {
    if (!settings) {
      return false
    }

    return settings.missLockMs !== parsedMissLockMs
      || settings.penaltyResume !== penaltyResume
      || settings.focusMode !== focusMode
      || settings.focusStart !== parsedFocusStart
      || settings.focusEnd !== parsedFocusEnd
      || settings.focusRevealMs !== parsedFocusRevealMs
  }, [parsedMissLockMs, penaltyResume, focusMode, parsedFocusStart, parsedFocusEnd, parsedFocusRevealMs, settings])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccessMessage(null)

    if (!isMissLockMsValid) {
      setError('ペナルティ時間は 0〜5000ms の整数で入力してください')
      return
    }

    if (!isFocusStartValid) {
      setError('フォーカス開始位置は 0〜100 の整数で入力してください')
      return
    }

    if (!isFocusEndValid) {
      setError('フォーカス終了位置は 1〜200 の整数で、開始位置より大きい値を入力してください')
      return
    }

    if (!isFocusRevealMsValid) {
      setError('ブラー解除時間は 0〜10000ms の整数で入力してください')
      return
    }

    setError(null)
    try {
      await updateSettings({
        missLockMs: parsedMissLockMs,
        penaltyResume,
        focusMode,
        focusStart: parsedFocusStart,
        focusEnd: parsedFocusEnd,
        focusRevealMs: parsedFocusRevealMs,
      })
      setSuccessMessage('設定を保存しました')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '設定の保存に失敗しました')
    }
  }

  return (
    <DashboardLayout
      title="設定"
      subtitle="ミス時の待機時間、再開位置、フォーカスモードを調整できます。"
      userName={userName}
      onLogout={onLogout}
    >
      {loading && !settings && (
        <div className="flex items-center gap-3 py-6 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d6e3ed] border-t-[#3ea8ff]" />
          読み込み中...
        </div>
      )}

      {error && !settings && (
        <div className="space-y-4">
          <div className="app-banner app-banner-danger">{error}</div>
          <button
            onClick={() => {
              setError(null)
              void fetchSettings().catch((fetchError: unknown) => {
                setError(fetchError instanceof Error ? fetchError.message : '設定の取得に失敗しました')
              })
            }}
            className="app-button app-button-primary"
          >
            再試行
          </button>
        </div>
      )}

      {settings && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="app-card-soft px-5 py-5">
              <p className="text-sm font-semibold text-slate-900">現在の適用値</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="app-chip app-chip-info">待機 {settings.missLockMs}ms</span>
                <span className="app-chip app-chip-warning">
                  再開位置 {settings.penaltyResume === 'word' ? 'ワード先頭' : 'ミス文字'}
                </span>
                {settings.focusMode && (
                  <span className="app-chip app-chip-success">
                    フォーカス +{settings.focusStart}〜+{settings.focusEnd}文字
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-500">
                0ms にするとミス後の入力ロックを無効化できます。
              </p>
            </div>

            <div className="app-card-soft px-5 py-5">
              <p className="text-sm font-semibold text-slate-900">設定のポイント</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                <li>待機時間を短くするとテンポ重視で練習できます。</li>
                <li>ワード先頭再開は、単語全体を正確に打ち直したいときに向いています。</li>
                <li>フォーカスモードは、先読みしながら打つ練習に効果的です。</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="app-card space-y-6 px-6 py-6">
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">ペナルティ設定</h3>
                <p className="text-sm text-slate-500">練習中のミス後挙動をここで調整します。</p>
              </div>

              <div>
                <label htmlFor="miss-lock-ms" className="mb-2 block text-sm font-semibold text-slate-700">
                  ペナルティ待機時間 (ms)
                </label>
                <input
                  id="miss-lock-ms"
                  type="number"
                  min={0}
                  max={5000}
                  step={100}
                  value={missLockMs}
                  onChange={(event) => {
                    setMissLockMs(event.target.value)
                    setSuccessMessage(null)
                  }}
                  className="app-input max-w-xs"
                />
                <p className="mt-1 text-xs text-slate-500">0〜5000 の整数。100ms 単位の調整を推奨します。</p>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">ミス後の再開位置</legend>
                <label className="app-card-soft flex cursor-pointer items-start gap-3 px-4 py-4">
                  <input
                    type="radio"
                    name="penalty-resume"
                    value="current"
                    checked={penaltyResume === 'current'}
                    onChange={() => {
                      setPenaltyResume('current')
                      setSuccessMessage(null)
                    }}
                    className="mt-1 h-4 w-4 border-[#d6e3ed] text-[#3ea8ff] focus:ring-[#3ea8ff]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">ミス文字から再開</p>
                    <p className="text-sm text-slate-500">ミスした文字の位置に戻って、その場から打ち直します。</p>
                  </div>
                </label>
                <label className="app-card-soft flex cursor-pointer items-start gap-3 px-4 py-4">
                  <input
                    type="radio"
                    name="penalty-resume"
                    value="word"
                    checked={penaltyResume === 'word'}
                    onChange={() => {
                      setPenaltyResume('word')
                      setSuccessMessage(null)
                    }}
                    className="mt-1 h-4 w-4 border-[#d6e3ed] text-[#3ea8ff] focus:ring-[#3ea8ff]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">ワードの先頭から再開</p>
                    <p className="text-sm text-slate-500">単語の先頭に戻して、単語単位で打ち直します。</p>
                  </div>
                </label>
              </fieldset>
            </div>

            <hr className="border-[#d6e3ed]" />

            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">フォーカスモード</h3>
                <p className="text-sm text-slate-500">
                  打っているワードの少し先を見ながら打つ練習ができます。カーソルより先の指定範囲外のワードにブラーをかけます。
                </p>
              </div>

              <label className="app-card-soft flex cursor-pointer items-start gap-3 px-4 py-4">
                <input
                  type="checkbox"
                  id="focus-mode"
                  checked={focusMode}
                  onChange={(event) => {
                    setFocusMode(event.target.checked)
                    setSuccessMessage(null)
                  }}
                  className="mt-1 h-4 w-4 rounded border-[#d6e3ed] text-[#3ea8ff] focus:ring-[#3ea8ff]"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">フォーカスモードを有効にする</p>
                  <p className="text-sm text-slate-500">タイピング中、フォーカス範囲外のワードにブラーをかけます。</p>
                </div>
              </label>

              <div className={`space-y-4 ${!focusMode ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-[140px] flex-1">
                    <label htmlFor="focus-start" className="mb-2 block text-sm font-semibold text-slate-700">
                      フォーカス開始 (文字数)
                    </label>
                    <input
                      id="focus-start"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={focusStart}
                      onChange={(event) => {
                        setFocusStart(event.target.value)
                        setSuccessMessage(null)
                      }}
                      className="app-input"
                    />
                    <p className="mt-1 text-xs text-slate-500">カーソルから何文字先からフォーカスを開始するか (0〜100)</p>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <label htmlFor="focus-end" className="mb-2 block text-sm font-semibold text-slate-700">
                      フォーカス終了 (文字数)
                    </label>
                    <input
                      id="focus-end"
                      type="number"
                      min={1}
                      max={200}
                      step={1}
                      value={focusEnd}
                      onChange={(event) => {
                        setFocusEnd(event.target.value)
                        setSuccessMessage(null)
                      }}
                      className="app-input"
                    />
                    <p className="mt-1 text-xs text-slate-500">カーソルから何文字先までブラーなしにするか (1〜200、開始より大きい値)</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="focus-reveal-ms" className="mb-2 block text-sm font-semibold text-slate-700">
                    ブラー自動解除時間 (ms)
                  </label>
                  <input
                    id="focus-reveal-ms"
                    type="number"
                    min={0}
                    max={10000}
                    step={100}
                    value={focusRevealMs}
                    onChange={(event) => {
                      setFocusRevealMs(event.target.value)
                      setSuccessMessage(null)
                    }}
                    className="app-input max-w-xs"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    最後のキー入力から何ms後にブラーを自動解除するか (0〜10000)。0 で自動解除なし。
                  </p>
                </div>
              </div>
            </div>

            {error && <div className="app-banner app-banner-danger">{error}</div>}
            {successMessage && <div className="app-banner app-banner-success">{successMessage}</div>}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!isFormValid || !hasChanges || loading}
                className="app-button app-button-primary"
              >
                {loading ? '保存中...' : '保存する'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  )
}
