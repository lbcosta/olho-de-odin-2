// src/main/tray.ts
// Ícone de Bandeja (T014): acesso rápido para mostrar a janela / sair.
// Usa um ícone mínimo embutido (substituível por um asset real depois).

import { app, Menu, Tray, nativeImage, type BrowserWindow } from 'electron'

// PNG 1x1 transparente (placeholder válido — evita asset binário no repo).
const PLACEHOLDER_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

let tray: Tray | null = null

export function createTray(getWindow: () => BrowserWindow | null): Tray {
  const icon = nativeImage.createFromDataURL(PLACEHOLDER_ICON)
  tray = new Tray(icon)
  tray.setToolTip('Olho de Odin 2')

  const show = (): void => {
    const win = getWindow()
    if (win) {
      win.show()
      win.focus()
    }
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir Olho de Odin', click: show },
      { type: 'separator' },
      { label: 'Sair', click: () => app.quit() },
    ]),
  )
  tray.on('click', show)
  return tray
}
