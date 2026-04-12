import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface Props {
  title: string
  subtitle?: string
  userName: string
  onLogout: () => void
  onStartRandomSession: () => void
  actions?: ReactNode
  children: ReactNode
}

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-[#eff6ff] text-[#1d4ed8]'
      : 'text-slate-500 hover:bg-white hover:text-slate-900',
  ].join(' ')
}

export function DashboardLayout({
  title,
  subtitle,
  userName,
  onLogout,
  onStartRandomSession,
  actions,
  children,
}: Props) {
  return (
    <div className="app-page flex flex-col">
      <header className="border-b border-[#d6e3ed]/80 bg-white/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3ea8ff]">typing-en</p>
                <h1 className="text-lg font-bold text-slate-900">English typing refinement</h1>
              </div>
              <nav className="flex flex-wrap items-center gap-2">
                <NavLink to="/sentences" className={navLinkClassName}>
                  文章管理
                </NavLink>
                <NavLink to="/weak-words" className={navLinkClassName}>
                  苦手ワード
                </NavLink>
                <NavLink to="/fingering" className={navLinkClassName}>
                  苦手運指
                </NavLink>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onStartRandomSession}
                className="app-button app-button-secondary"
              >
                ランダムワード練習
              </button>
              <div className="rounded-full border border-[#d6e3ed] bg-[#f8fbff] px-3 py-2 text-sm text-slate-600">
                {userName}
              </div>
              <button
                onClick={onLogout}
                className="app-button app-button-subtle"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 lg:px-8">
        <section className="app-card flex flex-col gap-5 px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="app-chip app-chip-info">Dashboard</div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold leading-[1.5] text-slate-900">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
          </div>

          {children}
        </section>
      </main>
    </div>
  )
}
