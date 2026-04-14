import { describe, expect, it } from 'vitest'
import { rewindToWordStart } from './useTypingEngine'

describe('rewindToWordStart', () => {
  it('returns the current cursor when already at a word start', () => {
    expect(rewindToWordStart('alpha beta ', 6)).toBe(6)
    expect(rewindToWordStart('alpha ', 0)).toBe(0)
  })

  it('rewinds to the beginning of the current word', () => {
    expect(rewindToWordStart('alpha beta gamma ', 8)).toBe(6)
    expect(rewindToWordStart('alpha beta gamma ', 14)).toBe(11)
  })
})
