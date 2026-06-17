// tests/renderer/app.spec.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from '@renderer/App'

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'api')
})

describe('<App />', () => {
  it('renderiza o shell (título + busca) mesmo sem a ponte IPC', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Olho de Odin/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/pressione Enter/i)).toBeInTheDocument()
  })
})
