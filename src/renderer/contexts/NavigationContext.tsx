// src/renderer/contexts/NavigationContext.tsx
// Navegação leve entre telas (Watchlist <-> Item) sem dependência de router.

import { createContext, useContext, useState, type ReactNode } from 'react'

export type View =
  | { name: 'watchlist' }
  | { name: 'item'; itemId: number; itemName?: string }
  | { name: 'profiles' }

interface NavigationContextValue {
  view: View
  navigate: (view: View) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [view, setView] = useState<View>({ name: 'watchlist' })
  return (
    <NavigationContext.Provider value={{ view, navigate: setView }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation deve ser usado dentro de NavigationProvider')
  return ctx
}
