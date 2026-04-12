import { apiFetch } from './api'

export interface BigramStatEntry {
  bigram: string
  attempts: number
  misses: number
  missRate: number
}

/** ミス率の高いバイグラム一覧を取得する */
export function listWeakBigrams(): Promise<{ bigrams: BigramStatEntry[] }> {
  return apiFetch<{ bigrams: BigramStatEntry[] }>('/api/bigram-stats')
}

/**
 * 指定バイグラムを含む練習用単語をユーザーの文章コーパスから取得する。
 * スペースを含むバイグラム（単語境界）も正しく扱われる。
 *   □→X: X で始まる単語 / X→□: X で終わる単語 / XY: XY を含む単語
 */
export function fetchWordsForBigrams(bigrams: string[]): Promise<{ words: string[] }> {
  // encodeURIComponent でスペースを %20 にエンコードして送る
  const param = encodeURIComponent(bigrams.join(','))
  return apiFetch<{ words: string[] }>(`/api/bigram-stats/words?bigrams=${param}`)
}
