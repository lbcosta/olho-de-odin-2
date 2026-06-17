// src/renderer/components/Profile/ProfileManager.tsx
// Gerenciamento de Perfis (T029/T030): CRUD, perfil ativo, Char (Minha Loja) e
// Import/Export via diálogos nativos, consumindo os handlers IPC da Fase 2.

import { useCallback, useEffect, useState } from 'react'
import type { Profile } from '@shared/types/domain'
import { getApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'

export function ProfileManager(): React.JSX.Element {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [characterName, setCharacterName] = useState('')
  const { addToast } = useToast()

  const reload = useCallback(async () => {
    const api = getApi()
    if (!api) return
    const [list, active] = await Promise.all([
      api.invoke('profile:list'),
      api.invoke('profile:get-active'),
    ])
    setProfiles(list)
    setActiveId(active?.id ?? null)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function create(): Promise<void> {
    const api = getApi()
    if (!api || name.trim().length === 0) return
    try {
      await api.invoke('profile:create', {
        name: name.trim(),
        characterName: characterName.trim() || null,
      })
      setName('')
      setCharacterName('')
      await reload()
      addToast('Perfil criado.', 'success')
    } catch {
      addToast('Não foi possível criar o perfil.', 'error')
    }
  }

  async function activate(id: number): Promise<void> {
    const api = getApi()
    if (!api) return
    await api.invoke('profile:set-active', { profileId: id })
    await reload()
  }

  async function remove(id: number): Promise<void> {
    const api = getApi()
    if (!api) return
    await api.invoke('profile:delete', { id })
    await reload()
    addToast('Perfil excluído.', 'info')
  }

  async function exportProfile(id: number): Promise<void> {
    const api = getApi()
    if (!api) return
    const { filePath } = await api.invoke('dialog:pick-save', { defaultName: 'perfil.json' })
    if (!filePath) return
    await api.invoke('profile:export', { profileId: id, filePath })
    addToast('Perfil exportado.', 'success')
  }

  async function importProfile(): Promise<void> {
    const api = getApi()
    if (!api) return
    const { filePath } = await api.invoke('dialog:pick-open')
    if (!filePath) return
    try {
      await api.invoke('profile:import', { filePath })
      await reload()
      addToast('Perfil importado.', 'success')
    } catch {
      addToast('Arquivo de Backup inválido.', 'error')
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Perfis</h2>
        <button
          onClick={() => void importProfile()}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-odin-500"
        >
          ⬆️ Importar Backup
        </button>
      </div>

      <section className="oo-card space-y-3">
        <h3 className="text-sm font-medium text-odin-300">Novo Perfil</h3>
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do perfil"
            aria-label="Nome do perfil"
            className="flex-1 rounded-lg border border-surface-border bg-surface-overlay px-3 py-1.5 text-sm outline-none focus:border-odin-500"
          />
          <input
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Nome do personagem (Minha Loja)"
            aria-label="Nome do personagem"
            className="flex-1 rounded-lg border border-surface-border bg-surface-overlay px-3 py-1.5 text-sm outline-none focus:border-odin-500"
          />
          <button
            onClick={() => void create()}
            className="rounded-lg bg-odin-500 px-4 py-1.5 text-sm font-medium text-surface hover:bg-odin-400"
          >
            Criar
          </button>
        </div>
      </section>

      {profiles.length === 0 ? (
        <p className="text-gray-400">Nenhum perfil cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {profile.name}
                  {profile.id === activeId && (
                    <span className="rounded-full bg-odin-500/20 px-2 py-0.5 text-xs text-odin-300">
                      ativo
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">Personagem: {profile.characterName ?? '—'}</p>
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                {profile.id !== activeId && (
                  <button
                    onClick={() => void activate(profile.id)}
                    className="rounded-md border border-surface-border px-2 py-1 hover:border-odin-500"
                  >
                    Ativar
                  </button>
                )}
                <button
                  onClick={() => void exportProfile(profile.id)}
                  className="rounded-md border border-surface-border px-2 py-1 hover:border-odin-500"
                  title="Exportar Backup"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => void remove(profile.id)}
                  className="rounded-md border border-surface-border px-2 py-1 hover:bg-log-error/20"
                  title="Excluir perfil"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
