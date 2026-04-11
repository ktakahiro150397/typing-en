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
    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="border-b border-gray-700 px-6 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-lg font-bold tracking-wide">typing-en</h1>
          <nav className="flex items-center gap-2">
            <NavLink to="/sentences" className={navLinkClassName}>
              文章管理
            </NavLink>
            <NavLink to="/weak-words" className={navLinkClassName}>
              苦手ワード
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onStartRandomSession}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            ランダムワード練習
          </button>
          <span className="text-sm text-gray-400">{userName}</span>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>

        {children}
      </main>
    </div>
  )
}
