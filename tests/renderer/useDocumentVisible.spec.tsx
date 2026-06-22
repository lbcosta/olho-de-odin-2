// tests/renderer/useDocumentVisible.spec.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useDocumentVisible } from '@renderer/hooks/useDocumentVisible'

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: hidden ? 'hidden' : 'visible',
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

function Probe(): React.JSX.Element {
  return <span data-testid="v">{String(useDocumentVisible())}</span>
}

afterEach(() => {
  cleanup()
  setHidden(false)
})

describe('useDocumentVisible (F5)', () => {
  it('reflete document.hidden e reage a visibilitychange', () => {
    setHidden(false)
    const { getByTestId } = render(<Probe />)
    expect(getByTestId('v').textContent).toBe('true')

    act(() => setHidden(true))
    expect(getByTestId('v').textContent).toBe('false')

    act(() => setHidden(false))
    expect(getByTestId('v').textContent).toBe('true')
  })
})
