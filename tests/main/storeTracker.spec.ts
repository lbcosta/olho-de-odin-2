// tests/main/storeTracker.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { detectStoreChange, StoreTracker } from '@main/services/store/StoreTracker'
import type { ActiveStoreListing } from '@shared/types/domain'
import type { ProfileService } from '@main/services/profile/ProfileService'

function listing(seller: string, cnt: number): ActiveStoreListing {
  return {
    svrId: 1,
    itemId: 1,
    mapId: 1,
    ssi: `ssi-${cnt}`,
    itemName: 'X',
    databaseImgPath: '',
    databaseType: '',
    storeName: 'Loja',
    itemPrice: 100,
    itemCnt: cnt,
    slotMaxCount: '',
    storeTypeName: 'SELL',
    itemSellerCharName: seller,
  }
}

describe('detectStoreChange', () => {
  it('classifica cada transição de estoque da própria loja', () => {
    expect(
      detectStoreChange({
        characterName: 'Odin',
        listings: [listing('Odin', 100)],
        previousStock: null,
      }),
    ).toEqual({ kind: 'first-seen', stock: 100 })
    expect(
      detectStoreChange({
        characterName: 'Odin',
        listings: [listing('Odin', 60)],
        previousStock: 100,
      }),
    ).toEqual({ kind: 'sale', soldUnits: 40, stock: 60 })
    expect(
      detectStoreChange({
        characterName: 'Odin',
        listings: [listing('Odin', 120)],
        previousStock: 100,
      }),
    ).toEqual({ kind: 'restock', stock: 120 })
    expect(
      detectStoreChange({
        characterName: 'Odin',
        listings: [listing('Odin', 100)],
        previousStock: 100,
      }),
    ).toEqual({ kind: 'unchanged', stock: 100 })
    expect(
      detectStoreChange({
        characterName: 'Odin',
        listings: [listing('Outro', 50)],
        previousStock: 100,
      }),
    ).toEqual({ kind: 'disappeared' })
    expect(detectStoreChange({ characterName: 'Odin', listings: [], previousStock: null })).toEqual(
      { kind: 'absent' },
    )
  })
})

function profilesStub(characterName: string | null): ProfileService {
  return {
    getActive: () => ({ id: 1, name: 'P', characterName, createdAt: '', updatedAt: '' }),
  } as unknown as ProfileService
}

describe('StoreTracker.track (alimentado pelo ciclo unificado da Watchlist — Bug #2b)', () => {
  it('notifica VENDA quando o estoque diminui entre chamadas', () => {
    const notify = vi.fn()
    const tracker = new StoreTracker(profilesStub('Odin'), notify)

    tracker.track(1, [listing('Odin', 100)]) // first-seen (sem alerta)
    expect(notify).not.toHaveBeenCalled()
    tracker.track(1, [listing('Odin', 60)]) // venda

    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify.mock.calls[0][0].body).toContain('40')
  })

  it('notifica DESAPARECIMENTO (DC ou Sold Out)', () => {
    const notify = vi.fn()
    const tracker = new StoreTracker(profilesStub('Odin'), notify)

    tracker.track(1, [listing('Odin', 100)])
    tracker.track(1, [])

    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify.mock.calls[0][0].title).toMatch(/sumiu/i)
  })

  it('não processa (nem dispara notificação) sem Char configurado', () => {
    const notify = vi.fn()
    const tracker = new StoreTracker(profilesStub(null), notify)

    tracker.track(1, [listing('Odin', 100)])
    tracker.track(1, [])

    expect(notify).not.toHaveBeenCalled()
  })
})
