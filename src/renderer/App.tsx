// src/renderer/App.tsx
// Composição raiz: provedores (Toast, Navegação) + layout principal.

import { NavigationProvider } from './contexts/NavigationContext'
import { ToastProvider } from './contexts/ToastContext'
import { RootLayout } from './components/layout/RootLayout'

function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <NavigationProvider>
        <RootLayout />
      </NavigationProvider>
    </ToastProvider>
  )
}

export default App
