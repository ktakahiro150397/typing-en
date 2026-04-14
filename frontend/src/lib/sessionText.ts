export function normalizeSessionText(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  // Sessions always advance on a trailing separator, even after punctuation.
  return `${trimmed} `
}

export function buildWeakWordPracticeTexts(words: string[], chunkSize = 5): string[] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new Error('chunkSize must be a positive integer')
  }

  const filteredWords = words
    .map((word) => word.trim())
    .filter((word) => word.length > 0)

  const chunks: string[] = []
  for (let i = 0; i < filteredWords.length; i += chunkSize) {
    chunks.push(normalizeSessionText(filteredWords.slice(i, i + chunkSize).join(' ')))
  }

  return chunks
}
