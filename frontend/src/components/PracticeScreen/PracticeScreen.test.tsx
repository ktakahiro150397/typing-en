import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticeScreen } from './PracticeScreen'

vi.mock('../../hooks/useTypingSession', () => ({
  useTypingSession: () => ({
    engineState: {
      text: 'git status',
      typed: '',
      cursor: 0,
      misses: 0,
      currentMiss: false,
      lockedUntil: null,
      keyHistory: [],
      isComplete: false,
      startedAt: null,
    },
    handleKey: vi.fn(),
    phase: 'typing',
    currentIndex: 0,
    totalCount: 1,
    result: null,
    sessionMisses: 0,
  }),
}))

vi.mock('../../lib/typingAnalysis', () => ({
  getLiveTypingFeedback: () => null,
}))

describe('PracticeScreen translation display', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the current translation for sentence sessions', () => {
    const markup = renderToStaticMarkup(
      <PracticeScreen
        mode="sentence"
        sessionItems={[{
          text: 'git status',
          sentenceId: 'sentence-1',
          translation: 'Git の現在状態を確認するコマンド',
        }]}
        onComplete={() => undefined}
        onAbort={() => undefined}
        canUseSavedSettings={false}
        returnPath="/library"
      />,
    )

    expect(markup).toContain('日本語訳')
    expect(markup).toContain('Git の現在状態を確認するコマンド')
  })

  it('does not show translations for word drill sessions', () => {
    const markup = renderToStaticMarkup(
      <PracticeScreen
        mode="word_drill"
        sessionItems={[{
          text: 'status',
          sentenceId: null,
          translation: '状態',
        }]}
        onComplete={() => undefined}
        onAbort={() => undefined}
        canUseSavedSettings={false}
        returnPath="/analysis"
      />,
    )

    expect(markup).not.toContain('日本語訳')
    expect(markup).not.toContain('状態')
  })
})
