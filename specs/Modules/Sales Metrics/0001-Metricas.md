# 0001 - Fórmulas e Métricas de Mercado

Este documento define a base matemática pura sobre a qual o sistema tomará decisões.

## 1. Janela de Tempo Padrão (Timeframe)
Todas as médias históricas (Endpoint 6) deverão utilizar os **últimos 7 dias** como janela móvel padrão. Esse período engloba o ciclo natural dos jogadores (incluindo picos de final de semana) e suaviza as distorções sem se tornar obsoleto.

## 2. Fórmulas de Domínio

### 2.1 Média Ponderada Real (Preço Justo)
Revela o preço real que o mercado aceita pagar, ignorando distorções de itens listados a preços surreais (Trolls) que distorcem médias aritméticas simples.

$$ P_{avg} = \frac{\Sigma^{7}_{i = 1} (avgItemPrice_{i} \times itemCnt_{i})}{\Sigma^{7}_{i = 1} itemCnt_{i}} $$

*Onde $i$ representa cada dia dos últimos 7 dias na lista `priceDetailDayList`.*

### 2.2 Spread Atual (Oportunidade)
Indica a margem de arbitragem no momento atual nas lojas abertas (Endpoint 1). Spreads grandes indicam que é possível comprar do mais barato e vender no mesmo preço do mais caro.
- **Cálculo**: Maior `itemPrice` (End 1) - Menor `itemPrice` (End 1).

### 2.3 Pressão da Concorrência (Saturação)
Mede a força da oferta atual contra a capacidade de absorção do mercado.
- **Cálculo**: Total de unidades ativas nas lojas (`itemCnt` End 1) / Média de unidades vendidas por dia nos últimos 7 dias (End 3/6).
- Se o resultado for maior que 1, o mercado local está com sobreoferta.
