export function getRecentWindowLabel(recentSessionCount: number): string {
  return recentSessionCount >= 50 ? '直近50セッション' : `直近${recentSessionCount}セッション`
}

export function getRecentStatsDescription(recentSessionCount: number): string {
  return `${getRecentWindowLabel(recentSessionCount)}で集計`
}

export function getRecentChartTitle(recentSessionCount: number): string {
  return `${getRecentWindowLabel(recentSessionCount)}の WPM 推移`
}
