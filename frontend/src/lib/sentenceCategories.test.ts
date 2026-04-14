import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  filterSentencesByCategories,
  formatCategoryInput,
  listSentenceCategories,
  parseCategoryInput,
  pickSessionSentences,
} from './sentenceCategories'
import type { Sentence } from './sentences'

const sentences: Sentence[] = [
  {
    id: '1',
    text: 'alpha',
    note: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    categories: ['daily-conversation'],
  },
  {
    id: '2',
    text: 'beta',
    note: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    categories: ['internet', 'daily-conversation'],
  },
  {
    id: '3',
    text: 'gamma',
    note: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    categories: [],
  },
]

describe('sentenceCategories', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses comma and newline separated category input', () => {
    expect(parseCategoryInput('daily-conversation, internet\n daily-conversation')).toEqual([
      'daily-conversation',
      'internet',
    ])
    expect(formatCategoryInput(['daily-conversation', 'internet'])).toBe('daily-conversation, internet')
  })

  it('lists available categories in sorted order', () => {
    expect(listSentenceCategories(sentences)).toEqual(['daily-conversation', 'internet'])
  })

  it('filters sentences with OR semantics across selected categories', () => {
    expect(filterSentencesByCategories(sentences, ['internet', 'missing']).map((sentence) => sentence.id)).toEqual([
      '2',
    ])
    expect(filterSentencesByCategories(sentences, ['daily-conversation']).map((sentence) => sentence.id)).toEqual([
      '1',
      '2',
    ])
  })

  it('filters by explicitly selected categories', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = pickSessionSentences(sentences, 5, ['internet'])

    expect(result.assignedCategory).toBeNull()
    expect(result.selectedSentences.map((sentence) => sentence.id)).toEqual(['2'])
  })

  it('assigns a random category when none is selected', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)
      .mockReturnValue(0)

    const result = pickSessionSentences(sentences, 5, [])

    expect(result.assignedCategory).toBe('internet')
    expect(result.selectedSentences.map((sentence) => sentence.id)).toEqual(['2'])
  })

  it('falls back to all sentences when no categories exist', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = pickSessionSentences(
      sentences.map((sentence) => ({ ...sentence, categories: [] })),
      2,
      [],
    )

    expect(result.assignedCategory).toBeNull()
    expect(result.selectedSentences).toHaveLength(2)
  })
})
