// src/renderer/hooks/useDocumentVisible.ts
// Acompanha a visibilidade da janela. No Electron, minimizar/ocultar dispara
// `visibilitychange` no Renderer (Chromium), então `document.hidden` é um sinal
// confiável para suspender animações/render custosos quando o app está oculto
// (Low-Footprint ocioso — NFR Request Log/Watchlist).

import { useEffect, useState } from 'react'

export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const onChange = (): void => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}
