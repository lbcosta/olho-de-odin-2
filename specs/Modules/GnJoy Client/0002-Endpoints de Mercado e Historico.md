# 0002 - Endpoints de Mercado e Histórico

Este documento lista as rotas consumidas diretamente pela integração Client-API.

## Busca de Item (Mercado Ativo)
- **URL**: `GET /pt/intro/shop-search/trading`
- **Queries**: `?storeType={BUY|SELL}&serverType={NIDHOGG|FREYA}&searchWord={item}`
- **Formato**: RSC String puro contendo o payload em JSON.
- **O que extrair**: Dados primários para listagem inicial (Preço, Vendedor, Imagem e o token `ssi` para requisições posteriores).

## Detalhes de Loja e Localização (Lazy Load)
- **URL**: `POST /pt/intro/shop-search/trading`
- **Payload Base**: `[{"type":"store","params":{"svrId":<id>,"mapId":<id>,"ssi":"<ssi>"}}]`
- **O que extrair**: Coordenadas exatas `xpos` e `ypos`, nome do mapa `mapName`. Disparado apenas sob demanda do usuário no card da loja.

## Detalhes do Item e Slots (Lazy Load)
- **URL**: `POST /pt/intro/shop-search/trading`
- **Payload Base**: `[{"type":"item","params":{"svrId":<id>,"mapId":<id>,"ssi":"<ssi>","multiLan":"en-US"}}]`
- **O que extrair**: Todos os atributos, slots, e encantamentos randômicos. Disparado sob demanda.

## Agregação Histórica (Histórico)
- **URL**: `GET /pt/intro/shop-search/market-price`
- **Queries**: `?serverType={NIDHOGG}&period={ALL}&searchWord={item}`
- **O que extrair**: Valores agregados totais (`totalItemCnt`, `avgItemPrice`, mínimo e máximo). Útil para o preenchimento das Métricas de Mercado na UI.

## Histórico Detalhado em Gráficos (após Busca de Item)
- **URL**: `POST /pt/intro/shop-search/trading` (CORREÇÃO — confirmado por captura ao vivo da API; não é `/market-price`. A Server Action é compartilhada com os endpoints de Loja/Item acima — mesmo `Next-Action`, despacho por `type`.)
- **Payload Base**: `[{"type":"price","params":{"itemId":<id>,"svrId":<id>,"page":1,"limit":10,"period":"$undefined"}}]`
- **O que extrair**: Dados diários que geram os gráficos de oscilação do mercado (`priceDetailDayList`) — base da Média Ponderada Real.
