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
  }, [settings])

  const parsedMissLockMs = Number(missLockMs)
  const isMissLockMsValid = missLockMs.trim() !== ''
    && Number.isInteger(parsedMissLockMs)
    && parsedMissLockMs >= 0
    && parsedMissLockMs <= 5000
  const hasChanges = useMemo(() => {
    if (!settings) {
      return false
    }

    return settings.missLockMs !== parsedMissLockMs || settings.penaltyResume !== penaltyResume
  }, [parsedMissLockMs, penaltyResume, settings])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccessMessage(null)

    if (!isMissLockMsValid) {
      setError('ペナルティ時間は 0〜5000ms の整数で入力してください')
      return
    }

    setError(null)
    try {
      await updateSettings({
        missLockMs: parsedMissLockMs,
        penaltyResume,
      })
      setSuccessMessage('設定を保存しました')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '設定の保存に失敗しました')
    }
  }

  return (
    <DashboardLayout
      title="設定"
      subtitle="ミス時の待機時間と再開位置を調整できます。"
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
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="app-card space-y-5 px-6 py-6">
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
                  <p className="text-sm text-slate-500">従来どおり、ミスした位置から打ち直します。</p>
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

            {error && <div className="app-banner app-banner-danger">{error}</div>}
            {successMessage && <div className="app-banner app-banner-success">{successMessage}</div>}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!isMissLockMsValid || !hasChanges || loading}
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
