import { describe, expect, it } from 'vitest'
import { analyzeProblems, getLiveTypingFeedback } from './typingAnalysis'

describe('analyzeProblems', () => {
  it('detects slow words even when there are no mistypes', () => {
    const result = analyzeProblems([
      {
        text: 'alpha ',
        startedAt: 0,
        endedAt: 2400,
        keyHistory: [
          { key: 'a', correct: true, timestamp: 0, position: 0 },
          { key: 'l', correct: true, timestamp: 600, position: 1 },
          { key: 'p', correct: true, timestamp: 1200, position: 2 },
          { key: 'h', correct: true, timestamp: 1800, position: 3 },
          { key: 'a', correct: true, timestamp: 2400, position: 4 },
        ],
      },
    ])

    expect(result.wordStats).toHaveLength(1)
    expect(result.wordStats[0]).toMatchObject({
      word: 'alpha',
      misses: 0,
      stallCount: 0,
    })
    expect(result.wordStats[0].weaknessReasons).toEqual(['slow'])
    expect(result.wordStats[0].msPerChar).toBe(480)
  })

  it('does not count miss lock time as a stall', () => {
    const result = analyzeProblems([
      {
        text: 'cat ',
        startedAt: 0,
        endedAt: 1400,
        keyHistory: [
          { key: 'c', correct: true, timestamp: 0, position: 0 },
          { key: 'x', correct: false, timestamp: 100, position: 1 },
          { key: 'a', correct: true, timestamp: 1300, position: 1 },
          { key: 't', correct: true, timestamp: 1400, position: 2 },
        ],
      },
    ])

    expect(result.wordStats).toHaveLength(1)
    expect(result.wordStats[0]).toMatchObject({
      word: 'cat',
      misses: 1,
      stallCount: 0,
      stallDurationMs: 0,
      activeDurationMs: 400,
    })
    expect(result.wordStats[0].weaknessReasons).toEqual(['mistype'])
  })

  it('attributes a long pause inside a word to stall detection', () => {
    const result = analyzeProblems([
      {
        text: 'beta ',
        startedAt: 0,
        endedAt: 1100,
        keyHistory: [
          { key: 'b', correct: true, timestamp: 0, position: 0 },
          { key: 'e', correct: true, timestamp: 100, position: 1 },
          { key: 't', correct: true, timestamp: 1000, position: 2 },
          { key: 'a', correct: true, timestamp: 1100, position: 3 },
        ],
      },
    ])

    expect(result.wordStats).toHaveLength(1)
    expect(result.wordStats[0]).toMatchObject({
      word: 'beta',
      stallCount: 1,
      stallDurationMs: 900,
    })
    expect(result.wordStats[0].weaknessReasons).toEqual(['stall'])
  })

  it('averages metrics across repeated occurrences of the same word', () => {
    const result = analyzeProblems([
      {
        text: 'cat ',
        startedAt: 0,
        endedAt: 200,
        keyHistory: [
          { key: 'c', correct: true, timestamp: 0, position: 0 },
          { key: 'a', correct: true, timestamp: 100, position: 1 },
          { key: 't', correct: true, timestamp: 200, position: 2 },
        ],
      },
      {
        text: 'cat ',
        startedAt: 0,
        endedAt: 150,
        keyHistory: [
          { key: 'c', correct: true, timestamp: 0, position: 0 },
          { key: 'x', correct: false, timestamp: 50, position: 1 },
          { key: 'a', correct: true, timestamp: 100, position: 1 },
          { key: 't', correct: true, timestamp: 150, position: 2 },
        ],
      },
    ])

    expect(result.wordStats).toHaveLength(1)
    expect(result.wordStats[0]).toMatchObject({
      word: 'cat',
      totalChars: 6,
      misses: 1,
      activeDurationMs: 300,
      missRate: 0.17,
      msPerChar: 50,
    })
    expect(result.wordStats[0].weaknessReasons).toEqual(['mistype'])
  })
})

describe('getLiveTypingFeedback', () => {
  it('returns slow feedback for the current word', () => {
    expect(getLiveTypingFeedback({
      text: 'alpha beta ',
      startedAt: 0,
      cursor: 5,
      keyHistory: [
        { key: 'a', correct: true, timestamp: 0, position: 0 },
        { key: 'l', correct: true, timestamp: 600, position: 1 },
        { key: 'p', correct: true, timestamp: 1200, position: 2 },
        { key: 'h', correct: true, timestamp: 1800, position: 3 },
        { key: 'a', correct: true, timestamp: 2400, position: 4 },
      ],
    })).toMatchObject({
      word: 'alpha',
      reason: 'slow',
    })
  })

  it('returns stall feedback after a long pause in the current word', () => {
    expect(getLiveTypingFeedback({
      text: 'beta ',
      startedAt: 0,
      cursor: 3,
      keyHistory: [
        { key: 'b', correct: true, timestamp: 0, position: 0 },
        { key: 'e', correct: true, timestamp: 100, position: 1 },
        { key: 't', correct: true, timestamp: 1000, position: 2 },
      ],
    })).toMatchObject({
      word: 'beta',
      reason: 'stall',
    })
  })
})
