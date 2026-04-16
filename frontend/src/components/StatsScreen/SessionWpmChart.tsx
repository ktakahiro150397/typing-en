import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SessionPoint } from '../../lib/stats'

interface SessionWpmTooltipContentProps {
  active?: boolean
  payload?: Array<{ value?: number | string | null }>
}

export function SessionWpmTooltipContent({ active, payload }: SessionWpmTooltipContentProps) {
  const wpmValue = payload?.[0]?.value

  if (!active || wpmValue == null) {
    return null
  }

  return (
    <div
      className="rounded-xl border border-[#d6e3ed] bg-white px-3 py-2 text-sm font-semibold text-slate-700"
      style={{ boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}
    >
      {wpmValue}
    </div>
  )
}

export default function SessionWpmChart({ sessions }: { sessions: SessionPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sessions} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#d6e3ed" strokeDasharray="4 4" />
          <XAxis
            dataKey="sessionNumber"
            tickLine={false}
            axisLine={{ stroke: '#d6e3ed' }}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: '#d6e3ed' }}
            tick={{ fill: '#64748b', fontSize: 12 }}
            allowDecimals
          />
          <Tooltip content={<SessionWpmTooltipContent />} />
          <Line
            type="monotone"
            dataKey="wpm"
            name="WPM"
            stroke="#3ea8ff"
            strokeWidth={3}
            dot={{ r: 3, fill: '#3ea8ff' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
