# 0002 - Métricas e Estrutura do Card do Item

## Escopo
Este documento detalha a exibição de dados e métricas em cada card presente na lista central da Watchlist.

## Informações Exibidas
Cada card de item monitorado deverá conter de forma clara (Glanceable):
- **Informações Básicas**:
  - Imagem do item (ícone)
  - Nome do item
- **Métricas de Preço (Valores Absolutos)**:
  - Menor Preço Ativo (mercado atual)
  - Média Ponderada Real (histórico recente)
- **Métricas Analíticas do Domínio**:
  - Spread Atual
  - Pressão da Concorrência
- **Indicadores Visuais Qualitativos**:
  - **Liquidez**: Exibida visualmente via Tags Coloridas (Ex: "Alta Liquidez" em verde).
  - **Volatilidade**: Exibida visualmente via Tags Coloridas (Ex: "Volátil" em vermelho).
- **Indicadores de Ação Estratégica**:
  - Ícones indicando a presença de Estratégias Sugeridas baseadas no `CONTEXT.md` (Undercutting, Posicionamento Premium, Flipping).
