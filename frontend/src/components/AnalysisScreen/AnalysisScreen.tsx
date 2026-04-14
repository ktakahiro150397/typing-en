import { useState } from 'react'
import { WeakWordManager } from '../SentenceManager/WeakWordManager'
import { FingeringManager } from '../FingeringManager/FingeringManager'

type Tab = 'words' | 'fingering'

interface Props {
  onStartWeakWordSession: () => Promise<void>
  onStartWordDrill: (word: string, count: number) => void
  onStartFingeringSession: () => Promise<void>
  isMockMode: boolean
  onLogout: () => void
  userName: string
}

function tabButtonClass(active: boolean) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    active
      ? 'bg-[#eff6ff] text-[#1d4ed8]'
      : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-[#d6e3ed]',
  ].join(' ')
}

export function AnalysisScreen({
  onStartWeakWordSession,
  onStartWordDrill,
  onStartFingeringSession,
  isMockMode,
  onLogout,
  userName,
}: Props) {
  const [tab, setTab] = useState<Tab>('words')

  const tabSwitcher = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTab('words')}
        className={tabButtonClass(tab === 'words')}
      >
        苦手ワード
      </button>
      <button
        onClick={() => setTab('fingering')}
        className={tabButtonClass(tab === 'fingering')}
      >
        苦手運指
      </button>
    </div>
  )

  if (tab === 'fingering') {
    return (
      <FingeringManager
        onStartFingeringSession={onStartFingeringSession}
        isMockMode={isMockMode}
        onLogout={onLogout}
        userName={userName}
        tabSwitcher={tabSwitcher}
      />
    )
  }

  return (
    <WeakWordManager
      onStartWeakWordSession={onStartWeakWordSession}
      onStartWordDrill={onStartWordDrill}
      isMockMode={isMockMode}
      onLogout={onLogout}
      userName={userName}
      tabSwitcher={tabSwitcher}
    />
  )
}
