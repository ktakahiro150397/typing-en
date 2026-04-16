import { describe, expect, it } from 'vitest'
import { getRecentChartTitle, getRecentStatsDescription, getRecentWindowLabel } from './statsSummary'

describe('statsSummary helpers', () => {
  it('uses the last-50 label when at least 50 sessions exist', () => {
    expect(getRecentWindowLabel(50)).toBe('直近50セッション')
    expect(getRecentStatsDescription(80)).toBe('直近50セッションで集計')
    expect(getRecentChartTitle(120)).toBe('直近50セッションの WPM 推移')
  })

  it('falls back to the actual recent session count when fewer than 50 sessions exist', () => {
    expect(getRecentWindowLabel(12)).toBe('直近12セッション')
    expect(getRecentStatsDescription(12)).toBe('直近12セッションで集計')
    expect(getRecentChartTitle(12)).toBe('直近12セッションの WPM 推移')
  })
})
