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
- **Tipo do Item**: Categoria técnica oficial (buscada via `databaseType`, ex: Consumível, Carta, Equipamento).
- **Código de Item**: O ID oficial do item numérico.
- **Última Sincronização (`updated_at`)**: Exibe o horário exato da última extração de dados bem-sucedida, deixando explícito o status de estase se o App estiver em modo Offline.
- **Ações Rápidas**: 
  - Um botão interativo de "Adicionar/Remover da Watchlist".
  - Um botão de "Sincronizar Agora" para forçar uma chamada ao `RequestQueueManager` e atualizar os caches locais do item.
