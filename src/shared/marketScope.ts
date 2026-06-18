// src/shared/marketScope.ts
// Escopo de mercado da aplicação.
//
// ATENÇÃO à semântica (contraintuitiva) do `storeType` na GnJoy:
//  - BUY  = lojas VENDENDO itens (vendedores expondo mercadoria) -> NOSSO ESCOPO.
//  - SELL = lojas COMPRANDO itens (querem comprar de você)       -> fora de escopo.
//
// O Olho de Odin analisa SEMPRE a concorrência de venda ativa, logo usa BUY.
// (Confirmação: o exemplo oficial em specs/Docs/gnjoylatam.api.md usa
//  storeType=BUY e retorna lojas com `itemSellerCharName`/`itemPrice`.)

import type { StoreType } from './types/domain'

/** Tipo de loja observado por toda a aplicação (venda ativa de itens). */
export const MARKET_STORE_TYPE: StoreType = 'BUY'
