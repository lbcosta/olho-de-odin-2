// src/renderer/components/ui/RelativeTime.tsx
// Exibe um timestamp como tempo relativo vivo ("há 3 min") e mantém a data
// absoluta no tooltip (title) para quem precisar do horário exato.

import { useRelativeTime } from '../../hooks/useRelativeTime'
import { formatTimestamp } from '../../utils/marketDisplay'

export function RelativeTime({
  iso,
  className,
}: {
  iso: string
  className?: string
}): React.JSX.Element {
  const relative = useRelativeTime(iso)
  return (
    <span className={className} title={formatTimestamp(iso)}>
      {relative}
    </span>
  )
}
