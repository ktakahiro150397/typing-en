import type { Sentence } from './sentences'

const CATEGORY_SPLIT_PATTERN = /[\n,、]+/

export function normalizeSentenceCategories(categories: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of categories) {
    const category = value.trim()
    if (!category || seen.has(category)) {
      continue
    }
    seen.add(category)
    normalized.push(category)
  }

  return normalized
}

export function parseCategoryInput(input: string): string[] {
  return normalizeSentenceCategories(input.split(CATEGORY_SPLIT_PATTERN))
}

export function formatCategoryInput(categories: string[]): string {
  return categories.join(', ')
}

export function listSentenceCategories(sentences: Sentence[]): string[] {
  return [...new Set(sentences.flatMap((sentence) => sentence.categories))]
    .sort((left, right) => left.localeCompare(right))
}

export function filterSentencesByCategories(
  sentences: Sentence[],
  selectedCategories: string[],
): Sentence[] {
  const normalizedCategories = normalizeSentenceCategories(selectedCategories)
  if (normalizedCategories.length === 0) {
    return sentences
  }

  const selectedSet = new Set(normalizedCategories)
  return sentences.filter((sentence) => sentence.categories.some((category) => selectedSet.has(category)))
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function pickSessionSentences(
  sentences: Sentence[],
  count: number,
  selectedCategories: string[],
): { selectedSentences: Sentence[]; assignedCategory: string | null } {
  const normalizedCount = Math.max(1, Math.min(count, sentences.length))
  const normalizedCategories = normalizeSentenceCategories(selectedCategories)

  if (normalizedCategories.length > 0) {
    const filtered = filterSentencesByCategories(sentences, normalizedCategories)
    return {
      selectedSentences: shuffle(filtered).slice(0, Math.min(normalizedCount, filtered.length)),
      assignedCategory: null,
    }
  }

  const availableCategories = listSentenceCategories(sentences)
  if (availableCategories.length === 0) {
    return {
      selectedSentences: shuffle(sentences).slice(0, normalizedCount),
      assignedCategory: null,
    }
  }

  const assignedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)]
  const filtered = sentences.filter((sentence) => sentence.categories.includes(assignedCategory))
  return {
    selectedSentences: shuffle(filtered).slice(0, Math.min(normalizedCount, filtered.length)),
    assignedCategory,
  }
}
