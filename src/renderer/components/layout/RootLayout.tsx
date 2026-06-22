// src/renderer/components/layout/RootLayout.tsx
// Layout raiz persistente (T014): Navbar (título + busca + perfil), área central
// roteada (Watchlist <-> Item) e o Request Log fixo no rodapé.

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useNavigation } from '../../contexts/NavigationContext'
import { useStoreAlerts } from '../../hooks/useStoreAlerts'
import { SearchBar } from '../Search/SearchBar'
import { LogViewer } from '../RequestLog/LogViewer'
import { ToastContainer } from '../ui/Toast'
import { WatchlistGrid } from '../Watchlist/WatchlistGrid'
import { ItemDashboard } from '../Item/ItemDashboard'
import { ProfileManager } from '../Profile/ProfileManager'

export function RootLayout(): React.JSX.Element {
  const { view, navigate } = useNavigation()
  useStoreAlerts() // toasts in-app de Venda/DC da "Minha Loja" (quando em foco)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-surface-border px-6 py-3">
        <button
          onClick={() => navigate({ name: 'watchlist' })}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="text-xl" aria-hidden="true">
            👁️
          </span>
          <h1 className="text-base font-semibold tracking-tight">
            Olho de Odin <span className="text-odin-400">2</span>
          </h1>
        </button>

        {view.name === 'item' && (
          <button
            onClick={() => navigate({ name: 'watchlist' })}
            className="rounded-md border border-surface-border px-2 py-1 text-xs text-gray-300 hover:border-odin-500"
          >
            ← Voltar
          </button>
        )}

        <div className="flex flex-1 justify-center">
          <SearchBar />
        </div>

        <Menu as="div" className="relative shrink-0">
          <MenuButton className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-1.5 text-sm hover:border-odin-500">
            Perfil
          </MenuButton>
          <MenuItems className="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-lg border border-surface-border bg-surface-overlay p-1 shadow-xl focus:outline-none">
            <MenuItem>
              <button
                onClick={() => navigate({ name: 'profiles' })}
                className="w-full rounded-md px-3 py-2 text-left text-sm data-[focus]:bg-surface-raised"
              >
                Gerenciar Perfis
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </header>

      <main className="flex-1 overflow-y-auto">
        {view.name === 'watchlist' && <WatchlistGrid />}
        {view.name === 'item' && <ItemDashboard itemId={view.itemId} />}
        {view.name === 'profiles' && <ProfileManager />}
      </main>

      <LogViewer />
      <ToastContainer />
    </div>
  )
}
