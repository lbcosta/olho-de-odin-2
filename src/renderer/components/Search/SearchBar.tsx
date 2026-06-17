// src/renderer/components/Search/SearchBar.tsx
// Barra de busca defensiva (T019): dispara na tecla Enter / clique na lupa,
// com debounce de 300ms e desabilitada durante o carregamento para não violar
// o Rate Limit. Resultados agrupados por item; erro vira Toast humanizado.

import { useEffect, useRef, useState } from 'react'
import type { SearchResultGroup } from '@shared/types/ipc'
import { getApi } from '../../hooks/useApi'
import { useNavigation } from '../../contexts/NavigationContext'
import { useToast } from '../../contexts/ToastContext'

const DEBOUNCE_MS = 300

export function SearchBar(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { navigate } = useNavigation()
  const { addToast } = useToast()

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  async function runSearch(): Promise<void> {
    const term = query.trim()
    if (term.length === 0 || loading) return
    const api = getApi()
    if (!api) {
      addToast('Ponte de comunicação indisponível.', 'error')
      return
    }
    setLoading(true)
    setOpen(true)
    try {
      const groups = await api.invoke('search:items', {
        searchWord: term,
        serverType: 'NIDHOGG',
        storeType: 'SELL',
      })
      setResults(groups)
      if (groups.length === 0) addToast('Item não encontrado.', 'info')
    } catch {
      addToast('Erro de conexão com a API externa. Tente novamente.', 'error')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce defensivo: coalesce Enters/cliques repetidos em 300ms.
  function triggerSearch(): void {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(), DEBOUNCE_MS)
  }

  function selectItem(group: SearchResultGroup): void {
    setOpen(false)
    navigate({ name: 'item', itemId: group.itemId, itemName: group.itemName })
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-overlay px-3 py-1.5 focus-within:border-odin-500">
        <input
          type="text"
          value={query}
          disabled={loading}
          placeholder="Buscar item — pressione Enter"
          aria-label="Buscar item"
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500 disabled:opacity-60"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') triggerSearch()
          }}
        />
        {loading ? (
          <span
            aria-label="Carregando"
            className="h-4 w-4 animate-spin rounded-full border-2 border-odin-400 border-t-transparent"
          />
        ) : (
          <button
            type="button"
            aria-label="Buscar"
            onClick={triggerSearch}
            className="text-gray-400 hover:text-odin-400"
          >
            🔍
          </button>
        )}
      </div>

      {open && !loading && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-surface-border bg-surface-overlay p-1 shadow-xl">
          {results.map((group) => (
            <li key={group.itemId}>
              <button
                type="button"
                onClick={() => selectItem(group)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-raised"
              >
                <img
                  src={group.databaseImgPath}
                  alt=""
                  className="h-8 w-8 rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.visibility = 'hidden'
                  }}
                />
                <span className="flex-1 text-sm">{group.itemName}</span>
                {group.hasActiveStores ? (
                  <span className="text-xs text-gray-400">{group.storeCount} loja(s)</span>
                ) : (
                  <span className="text-xs text-gray-500">(Sem lojas ativas)</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
