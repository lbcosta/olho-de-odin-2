// src/renderer/App.tsx
// Shell mínimo da Fase 1: valida React + Tailwind + HeadlessUI + ponte IPC.
// O layout definitivo (RootLayout, LogViewer, Dashboard) chega na Fase 3.

import { useEffect, useState } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import type { AppInfo } from '@shared/types/ipc'

function App(): React.JSX.Element {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    // `window.api` só existe sob Electron; o app degrada graciosamente fora dele.
    window.api?.system
      .getAppInfo()
      .then(setAppInfo)
      .catch(() => setAppInfo(null))
  }, [])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-surface-border px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            👁️
          </span>
          <h1 className="text-lg font-semibold tracking-tight">
            Olho de Odin <span className="text-odin-400">2</span>
          </h1>
        </div>

        <Menu as="div" className="relative">
          <MenuButton className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-1.5 text-sm hover:border-odin-500">
            Perfil
          </MenuButton>
          <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-surface-border bg-surface-overlay p-1 shadow-xl focus:outline-none">
            <MenuItem>
              <button className="w-full rounded-md px-3 py-2 text-left text-sm data-[focus]:bg-surface-raised">
                Gerenciar Perfis
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <section className="oo-card max-w-md text-center">
          <h2 className="mb-2 text-base font-medium text-odin-300">Fundação estabelecida</h2>
          <p className="mb-4 text-sm text-gray-400">
            Boilerplate Electron + React + Tailwind operante. Ponte IPC pronta para os módulos das
            próximas fases.
          </p>
          <dl className="space-y-1 text-left text-xs text-gray-400">
            <Info label="App" value={appInfo ? `${appInfo.name} v${appInfo.version}` : '—'} />
            <Info label="Electron" value={appInfo?.electron ?? '—'} />
            <Info label="Plataforma" value={appInfo?.platform ?? '—'} />
          </dl>
        </section>
      </main>

      {/* Placeholder do Request Log (componente vivo na Fase 3). */}
      <footer className="flex items-center gap-2 border-t border-surface-border bg-surface-raised px-6 py-2 text-xs text-gray-400">
        <span className="oo-log-dot oo-log-dot--pending" aria-hidden="true" />
        <span>Request Log — ocioso</span>
      </footer>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-mono text-gray-300">{value}</dd>
    </div>
  )
}

export default App
