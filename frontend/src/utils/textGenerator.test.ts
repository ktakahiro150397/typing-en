import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateRandomText } from './textGenerator'

describe('generateRandomText', () => {
  it('creates a full-mode string with the requested length and allowed characters', () => {
    const text = generateRandomText(30, 'full')

    expect(text).toHaveLength(30)
    expect(text).toMatch(/^[a-z0-9!@#$%^&*()\-_=\+\[\]{}|;:,.<>?]+$/)
  })

  it('limits alpha mode to lowercase letters', () => {
    const text = generateRandomText(20, 'alpha')

    expect(text).toHaveLength(20)
    expect(text).toMatch(/^[a-z]+$/)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps digits and symbols behind the 2 percent gate in full mode', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.01)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0)

    expect(generateRandomText(2, 'full')).toBe('0a')
  })
})
