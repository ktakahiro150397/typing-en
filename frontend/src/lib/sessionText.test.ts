import { describe, expect, it } from 'vitest'
import { buildWeakWordPracticeTexts, normalizeSessionText } from './sessionText'

describe('normalizeSessionText', () => {
  it('adds a trailing space when the text does not end with a period', () => {
    expect(normalizeSessionText('alpha beta')).toBe('alpha beta ')
  })

  it('preserves trailing periods for sentence-mode completion', () => {
    expect(normalizeSessionText('alpha beta.')).toBe('alpha beta.')
  })
})

describe('buildWeakWordPracticeTexts', () => {
  it('chunks weak words into practice texts', () => {
    expect(buildWeakWordPracticeTexts(['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'], 5)).toEqual([
      'alpha beta gamma delta epsilon ',
      'zeta ',
    ])
  })

  it('ignores blank weak words', () => {
    expect(buildWeakWordPracticeTexts(['alpha', '  ', 'beta'], 2)).toEqual(['alpha beta '])
  })

  it('rejects invalid chunk sizes', () => {
    expect(() => buildWeakWordPracticeTexts(['alpha'], 0)).toThrow('chunkSize must be a positive integer')
  })
})
