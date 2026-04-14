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
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: '#d6e3ed',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            }}
          />
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
