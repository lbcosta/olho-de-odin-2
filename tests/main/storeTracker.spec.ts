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
    listWatchlist: () => [
      { profileId: 1, itemId: 1, isMonitoring: true, isInMyStore: true, createdAt: '' },
    ],
  } as unknown as ProfileService
}

describe('StoreTracker.runCycle', () => {
  it('notifica VENDA quando o estoque diminui entre ciclos', async () => {
    const stocks = [100, 60]
    let call = 0
    const refresh = vi.fn(async () => [listing('Odin', stocks[call++])])
    const notify = vi.fn()
    const tracker = new StoreTracker(profilesStub('Odin'), refresh, notify)

    await tracker.runCycle() // first-seen (sem alerta)
    expect(notify).not.toHaveBeenCalled()
    await tracker.runCycle() // venda

    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify.mock.calls[0][0].body).toContain('40')
  })

  it('notifica DESAPARECIMENTO (DC ou Sold Out)', async () => {
    const responses: ActiveStoreListing[][] = [[listing('Odin', 100)], []]
    let call = 0
    const refresh = vi.fn(async () => responses[call++])
    const notify = vi.fn()
    const tracker = new StoreTracker(profilesStub('Odin'), refresh, notify)

    await tracker.runCycle()
    await tracker.runCycle()

    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify.mock.calls[0][0].title).toMatch(/sumiu/i)
  })

  it('não faz chamadas de rede sem Char configurado', async () => {
    const refresh = vi.fn()
    const tracker = new StoreTracker(profilesStub(null), refresh, vi.fn())
    await tracker.runCycle()
    expect(refresh).not.toHaveBeenCalled()
  })
})
