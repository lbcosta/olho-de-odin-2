// src/renderer/components/ui/Skeleton.tsx
// Esqueletos de carregamento (T017) — feedback não-bloqueante com Tailwind.

export function Skeleton({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={`animate-pulse rounded bg-surface-overlay ${className}`}
    />
  )
}

export function SkeletonCard(): React.JSX.Element {
  return (
    <div className="oo-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
