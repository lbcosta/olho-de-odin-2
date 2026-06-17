// tests/renderer/skeleton.spec.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard } from '@renderer/components/ui/Skeleton'

afterEach(cleanup)

describe('Skeleton (T017)', () => {
  it('expõe role status (acessível)', () => {
    render(<Skeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('SkeletonCard renderiza múltiplos placeholders', () => {
    render(<SkeletonCard />)
    expect(screen.getAllByRole('status').length).toBeGreaterThan(1)
  })
})
