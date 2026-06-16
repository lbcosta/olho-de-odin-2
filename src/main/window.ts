// src/main/window.ts
// Criação e configuração da janela principal (BrowserWindow).
// Segurança: contextIsolation ON, nodeIntegration OFF. O renderer só conversa
// com o Main pela ponte do preload.

import { join } from 'node:path'
import { BrowserWindow, shell } from 'electron'

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    show: false,
    backgroundColor: '#0f1115',
    autoHideMenuBar: true,
    title: 'Olho de Odin 2',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Evita flash de tela branca: só exibe quando o conteúdo estiver pronto.
  window.on('ready-to-show', () => window.show())

  // Links externos abrem no navegador padrão, nunca dentro do app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Em dev, electron-vite expõe a URL do servidor com HMR; em produção,
  // carrega o HTML compilado.
  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
