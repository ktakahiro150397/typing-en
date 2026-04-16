import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSentenceStore } from './sentenceStore'
import {
  deleteSentencesByCategories,
  listSentences,
} from '../lib/sentences'

vi.mock('../lib/sentences', () => ({
  listSentences: vi.fn(),
  createSentence: vi.fn(),
  importSentencesCsv: vi.fn(),
  updateSentence: vi.fn(),
  deleteSentence: vi.fn(),
  deleteSentencesByCategories: vi.fn(),
}))

const mockedListSentences = vi.mocked(listSentences)
const mockedDeleteSentencesByCategories = vi.mocked(deleteSentencesByCategories)

describe('sentenceStore bulkRemoveSentencesByCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSentenceStore.setState({
      sentences: [
        {
          id: 'sentence-1',
          text: 'alpha',
          translation: null,
          note: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          categories: ['daily'],
        },
        {
          id: 'sentence-2',
          text: 'beta',
          translation: null,
          note: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          categories: ['travel'],
        },
      ],
      total: 2,
      loading: false,
      error: null,
    })
  })

  it('deletes matching categories and refreshes the sentence list', async () => {
    mockedDeleteSentencesByCategories.mockResolvedValue({ deletedCount: 1 })
    mockedListSentences.mockResolvedValue({
      sentences: [
        {
          id: 'sentence-2',
          text: 'beta',
          translation: null,
          note: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          categories: ['travel'],
        },
      ],
      total: 1,
    })

    const deletedCount = await useSentenceStore.getState().bulkRemoveSentencesByCategories(['daily'])

    expect(mockedDeleteSentencesByCategories).toHaveBeenCalledWith(['daily'])
    expect(mockedListSentences).toHaveBeenCalledTimes(1)
    expect(deletedCount).toBe(1)
    expect(useSentenceStore.getState().sentences).toEqual([
      {
        id: 'sentence-2',
        text: 'beta',
        translation: null,
        note: null,
        createdAt: '2026-01-02T00:00:00.000Z',
        categories: ['travel'],
      },
    ])
    expect(useSentenceStore.getState().total).toBe(1)
  })
})
