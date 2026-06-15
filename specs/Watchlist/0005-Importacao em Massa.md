# 0005 - Importação em Massa (Bulk Import)

## Escopo
Este documento define o formato de arquivo para adição de múltiplos itens à Watchlist de uma vez.

## Formato do Arquivo
A funcionalidade de importação em massa (Bulk Import) aceita um arquivo de texto simples (`.txt`) contendo uma lista de nomes exatos de itens (uma string por linha). O sistema deliberadamente não exige planilhas complexas ou arquivos CSV multi-colunas para facilitar o uso por parte dos jogadores.

## Fluxo de Processamento
Para cada linha legível do arquivo texto, a aplicação enfileira silenciosamente uma tarefa na Fila Global (`RequestQueueManager`), pesquisa o item na API da GnJoy, descobre o seu `itemId` numérico atrelado no banco de dados deles, e cadastra o item completamente na Watchlist do Perfil Ativo.
