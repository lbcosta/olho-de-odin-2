# 0002 - Status de Mercado e Estratégias

Este documento define os limites lógicos (Thresholds) para acionar avisos de comportamento de mercado e sugerir estratégias de precificação.

## 1. Status de Mercado (Tags)
Estes alertas são gerados automaticamente baseados no cruzamento das Métricas Puras.

- **Alta Demanda (Hot Item)**:
  - **Condição**: Soma total de unidades ativas (End 1) **<** (Média diária de `itemCnt` dos últimos 7 dias).
  - **Interpretação**: O mercado absorve mais do que a oferta atual consegue repor. Momento ideal para vendas de margem alta.
- **Concorrência Alta (Saturated Market)**:
  - **Condição**: Soma total de unidades ativas (End 1) **> 150%** da média diária dos últimos 7 dias.
  - **Interpretação**: Mercado inundado. O usuário deve aguardar antes de vender ou se preparar para subcotar (undercut).
- **Volatilidade (Unstable Market)**:
  - **Condição**: A diferença entre o `minItemPrice` e `maxItemPrice` do histórico no mesmo dia supera **30%**.
  - **Interpretação**: Preços caóticos. Risco alto de encalhar estoques a preços equivocados.
- **Quedas Bruscas (Crash Alert)**:
  - **Condição**: O sistema verifica o histórico recente. Se o preço médio do último dia disponível caiu mais de **30%** e o volume de vendas caiu mais de **50%** (ambos em relação à média dos três dias imediatamente anteriores).
  - **Interpretação**: Alerta vermelho de despejo de inventário repentino (Dump) ou manipulação predatória.

## 2. Estratégias Sugeridas (Precificação Ativa)
Se o usuário deseja vender um item, o sistema recomendará uma das ações abaixo:

- **Undercutting (Giro Rápido)**:
  - **Limiar de Consideração**: O sistema ignora concorrentes que possuem um estoque menor que **5%** do volume médio diário.
  - **Ação**: Identifica o concorrente de menor preço válido e sugere precificar a **1 Zeny a menos**.
- **Posicionamento Premium (Maior Margem)**:
  - **Condição**: O lojista mais barato possui um estoque insignificante (< 5% da média diária).
  - **Ação**: O sistema ignora o preço mais barato e sugere precificar alinhado com o 2º ou 3º lojista mais barato. O concorrente minúsculo esgotará rápido, não afetando o teto do preço.
- **Flipping (Segurança contra "Trolls")**:
  - **Condição**: O preço mínimo ativo (End 1) está mais de **30% abaixo** da média ponderada real dos últimos 3 dias.
  - **Ação**: O sistema emite um alerta de "Não Vender" e sugere **Comprar** o estoque do concorrente para revenda com lucro imediato.
