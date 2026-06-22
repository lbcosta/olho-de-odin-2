// tests/renderer/itemDashboard.spec.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ItemDashboard } from '@renderer/components/Item/ItemDashboard'
import { ToastProvider } from '@renderer/contexts/ToastContext'
import type { ActiveStoreListing, StoreItemDetail } from '@shared/types/domain'
import type { ItemDetails, OlhoDeOdinApi } from '@shared/types/ipc'

function listing(): ActiveStoreListing {
  return {
    svrId: 303,
    itemId: 1201,
    mapId: 835,
    ssi: '765',
    itemName: 'Espada',
    databaseImgPath: '',
    databaseType: 'weapon',
    storeName: 'Loja X',
    itemPrice: 5000,
    itemCnt: 3,
    slotMaxCount: '',
    storeTypeName: 'BUY',
    itemSellerCharName: 'Vendedor',
  }
}

function details(): ItemDetails {
  return {
    item: { itemId: 1201, name: 'Espada', type: 'weapon', imgPath: '', updatedAt: '' },
    listings: [listing()],
    analysis: null,
    updatedAt: '',
  }
}

function itemDetail(): StoreItemDetail {
  return {
    svrId: 303,
    itemId: 1201,
    itemName: 'Espada',
    itemPrice: 5000,
    mapId: 835,
    ssi: '765',
    itemType: 'weapon',
    itemOptionProperty: null,
    randomOpt1: 'ATK + 10',
    randomOpt2: null,
    randomOpt3: null,
    randomOpt4: null,
    slot1: 'Carta Poring',
    slot2: null,
    slot3: null,
    slot4: null,
    hasDatabaseItem: true,
    databaseImgPath: '',
    databaseType: 'weapon',
  }
}

function setupApi(): ReturnType<typeof vi.fn> {
  const invoke = vi.fn(async (channel: string) => {
    if (channel === 'item:get-details') return details()
    if (channel === 'watchlist:list') return []
    if (channel === 'item:expand-detail') return itemDetail()
    return undefined
  })
  window.api = {
    invoke,
    on: () => () => {},
    system: { ping: vi.fn(), getAppInfo: vi.fn() },
  } as unknown as OlhoDeOdinApi
  return invoke
}

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'api')
})

describe('ItemDashboard — Lazy Load de slots/encantamentos (F6)', () => {
  it('busca e exibe cartas/encantamentos ao expandir a loja', async () => {
    const invoke = setupApi()
    render(
      <ToastProvider>
        <ItemDashboard itemId={1201} />
      </ToastProvider>,
    )

    const expandBtn = await screen.findByTitle('Ver slots e encantamentos')
    await act(async () => {
      fireEvent.click(expandBtn)
      await Promise.resolve()
    })

    expect(invoke).toHaveBeenCalledWith('item:expand-detail', {
      svrId: 303,
      mapId: 835,
      ssi: '765',
    })
    expect(await screen.findByText('Carta Poring')).toBeTruthy()
    expect(screen.getByText('ATK + 10')).toBeTruthy()
  })
})
