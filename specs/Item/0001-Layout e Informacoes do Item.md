# 0001 - Layout e Informações do Item

## Escopo
Este documento detalha o layout base da Tela de Detalhes do Item e os elementos presentes no cabeçalho principal.

## Elementos Principais
O usuário deve visualizar a tela de detalhes do Item com as seguintes divisões primárias:
- **Canto Superior Esquerdo**: Informações básicas do Item.
- **Canto Superior Direito**: Bloco dedicado às Métricas de Mercado.
- **Área Central**: Lista de Lojas Ativas.

## Informações do Item (Canto Superior Esquerdo)
- **Imagem**: O ícone oficial do item (buscado via `databaseImgPath`).
- **Nome do Item**: O nome oficial conforme retornado pela busca.
- **Código de Item**: O ID oficial do item (padrão de 5 dígitos).
- **Ação Rápida**: Um botão interativo de "Adicionar/Remover da Watchlist" para facilitar o monitoramento ativo.
