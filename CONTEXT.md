# Olho de Odin 2

Aplicação local-first auxiliar para o mercado de Ragnarok Online que consome APIs externas e sugere estratégias de vendas.

## Language

**Lojas Ativas**:
Lojas no jogo que estão ativamente vendendo um Item no exato momento da busca. Exclui lojas inativas ou histórico de transações passadas.
_Avoid_: Lista de lojas, lojas, mercado

**Item**:
Representação de um item do jogo Ragnarok Online cadastrado no banco de dados local da aplicação, identificado pelo seu `itemId`.
_Avoid_: Artigo, mercadoria

**Profile**:
Conjunto de dados local que representa o perfil de um usuário, contendo sua Watchlist, configurações gerais e histórico de importações. Pode ser exportado ou importado como arquivo JSON.
_Avoid_: Conta, usuário, login

**Watchlist**:
Lista de itens selecionados pelo usuário para monitoramento ativo e atualizações periódicas automatizadas.
_Avoid_: Itens observados, favoritos, lista de desejos

### Métricas de Mercado

**Média Ponderada Real**:
Cálculo que pondera o preço médio diário das transações históricas pelo volume de itens vendidos no dia. É calculada como a soma de (preço médio * quantidade) dividida pela soma das quantidades de todos os dias analisados.
_Avoid_: Média aritmética simples

**Spread Atual**:
Diferença entre o preço máximo e o preço mínimo do item entre as lojas ativas no momento atual.
_Avoid_: Margem de lucro bruta

**Pressão da Concorrência**:
Razão entre a quantidade total de itens à venda hoje nas lojas ativas e a quantidade média diária vendida histórica (últimos 7 dias). Valores acima de 1 indicam saturação.
_Avoid_: Índice de saturação

### Estratégias de Venda

**Undercutting**:
Estratégia de venda rápida em que o sistema sugere o preço do item 1 Zeny abaixo do menor concorrente ativo relevante (desconsiderando concorrentes com apenas 1 unidade).
_Avoid_: Leilão invertido

**Posicionamento Premium**:
Estratégia sugerida quando o concorrente mais barato possui baixo estoque comparado à demanda média. O preço sugerido acompanha o valor do segundo ou terceiro concorrente mais barato, antecipando que o estoque do primeiro se esgotará rapidamente.
_Avoid_: Precificação dinâmica arbitrária

**Flipping**:
Sugestão de compra do estoque do próprio concorrente quando o preço mínimo atual está anormalmente baixo (mais de 30% abaixo da média recente de 3 dias), visando revenda futura a valor de mercado.
_Avoid_: Arbitragem complexa, revenda simples

