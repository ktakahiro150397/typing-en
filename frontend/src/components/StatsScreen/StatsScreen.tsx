import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { DashboardLayout } from '../Layout/DashboardLayout'
import { WpmDisplay } from '../ui/WpmDisplay'
import { fetchLifetimeStats } from '../../lib/stats'
import type { LifetimeStats } from '../../lib/stats'

interface Props {
  onLogout: () => void
  userName: string
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

interface StatCardProps {
  label: string
  children: ReactNode
  description?: string
}

function StatCard({ label, children, description }: StatCardProps) {
  return (
    <div className="app-card-soft px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <div className="mt-2">{children}</div>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  )
}

export function StatsScreen({ onLogout, userName }: Props) {
  const [stats, setStats] = useState<LifetimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLifetimeStats()
      .then(setStats)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : '統計の取得に失敗しました'),
      )
      .finally(() => setLoading(false))
  }, [])

  const accuracy = stats && stats.totalKeys > 0
    ? Math.round(((stats.totalKeys - stats.totalMissKeys) / stats.totalKeys) * 100)
    : 0

  return (
    <DashboardLayout
      title="生涯成績"
      subtitle="これまでの全セッションの累計データです。"
      userName={userName}
      onLogout={onLogout}
    >
      {loading && (
        <div className="flex items-center gap-3 py-6 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d6e3ed] border-t-[#3ea8ff]" />
          読み込み中...
        </div>
      )}

      {error && (
        <div className="app-banner app-banner-danger">{error}</div>
      )}

      {!loading && !error && stats && stats.totalSessions === 0 && (
        <div className="app-card-soft px-5 py-8 text-center text-sm text-slate-500">
          まだセッションがありません。練習を始めると生涯成績が記録されます。
        </div>
      )}

      {!loading && !error && stats && stats.totalSessions > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 上段: 主要指標 */}
          <StatCard label="総打鍵数">
            <p className="text-3xl font-bold text-slate-900">{formatNumber(stats.totalKeys)}</p>
          </StatCard>

          <StatCard label="WPM 平均">
            <WpmDisplay wpm={stats.averageWpm} intSize="text-3xl" decSize="text-xl" />
          </StatCard>

          <StatCard label="最高 WPM">
            <WpmDisplay wpm={stats.bestWpm} intSize="text-3xl" decSize="text-xl" />
          </StatCard>

          <StatCard label="総正確率">
            <p className="text-3xl font-bold text-emerald-600">{accuracy}%</p>
          </StatCard>

          {/* 下段: サブ指標 */}
          <StatCard label="総セッション数">
            <p className="text-3xl font-bold text-slate-900">
              {formatNumber(stats.totalSessions)}
              <span className="ml-1 text-lg font-semibold text-slate-400">回</span>
            </p>
          </StatCard>

          <StatCard label="総練習時間">
            <p className="text-3xl font-bold text-amber-600">{formatDuration(stats.totalDurationMs)}</p>
          </StatCard>

          <StatCard label="練習ユニーク単語数">
            <p className="text-3xl font-bold text-slate-900">
              {formatNumber(stats.uniqueWordCount)}
              <span className="ml-1 text-lg font-semibold text-slate-400">語</span>
            </p>
          </StatCard>

          <StatCard label="解決済み苦手ワード" description={`全 ${stats.weakWordTotal} 件中`}>
            <p className="text-3xl font-bold text-rose-500">
              {stats.weakWordSolved}
              <span className="ml-1 text-lg font-semibold text-slate-400">/ {stats.weakWordTotal}</span>
            </p>
          </StatCard>
        </div>
      )}
    </DashboardLayout>
  )
}
