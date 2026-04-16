import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SessionWpmTooltipContent } from './SessionWpmChart'

describe('SessionWpmTooltipContent', () => {
  it('renders only the hovered WPM value', () => {
    const html = renderToStaticMarkup(
      <SessionWpmTooltipContent
        active
        payload={[{ value: 72.35 }]}
      />,
    )

    expect(html).toContain('72.35')
    expect(html).not.toContain('WPM')
    expect(html).not.toContain('session')
  })

  it('renders nothing when inactive', () => {
    const html = renderToStaticMarkup(<SessionWpmTooltipContent />)

    expect(html).toBe('')
  })
})
