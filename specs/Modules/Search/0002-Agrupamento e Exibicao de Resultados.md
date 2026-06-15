# Agrupamento e Exibição de Resultados

## Descrição
Define como os resultados da busca são organizados, exibidos e formatados na interface de sugestões, além do tratamento de falhas.

## Agrupamento por Item
1. O resultado retornado pela API de comércio atual (lista de lojas/anúncios) é agrupado pelo identificador do item (`itemId`).
2. A tela de sugestões exibe uma lista de itens únicos (não uma lista de lojas).
3. Cada linha da sugestão de resultado deve exibir:
   - O nome do item.
   - O ícone correspondente do item (obtido do campo `databaseImgPath` retornado pela API).
4. O sistema deve carregar uma imagem/ícone default de fallback caso a imagem do item não seja encontrada no servidor ou falhe ao carregar.

## Tratamento de Erros
5. Caso ocorra uma falha de rede, timeout ou erro no servidor da API externa, uma mensagem de erro clara explicando o ocorrido (ex: "Erro de conexão com a API externa. Tente novamente.") é exibida diretamente na tela de sugestões de resultado.
