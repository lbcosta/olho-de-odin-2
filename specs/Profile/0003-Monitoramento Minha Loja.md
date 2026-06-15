# 0003 - Monitoramento "Minha Loja" (Vendas e DC)

## Escopo
Este documento detalha a mecânica avançada de tracking pessoal de vendas de itens de um perfil.

## A Flag `isInMyStore`
Qualquer item presente na Watchlist de um Perfil pode ser marcado pelo usuário com a flag booleana `isInMyStore: true`.
Ao ativar esta opção, o sistema cruza as informações do mercado ativo desse item com o **Nome do Personagem** cadastrado no Perfil do usuário para deduzir o status da sua própria lojinha.

## Serviço de Monitoramento de Fundo
O tracking da "Minha Loja" exige atenção arquitetural rigorosa:
- **Integração Global**: Para evitar o temido IP Ban temporário da GnJoy (Erro HTTP 429), este serviço especial **não roda em paralelo à rede**. Ele se subordina ao `RequestQueueManager` global.
- **Prioridade de Fila**: As checagens dos itens marcados com `isInMyStore: true` recebem **Prioridade Máxima**, passando na frente dos itens comuns da Watchlist para garantir que a notificação de venda saia o mais rápido possível (respeitando o limite de 3 segundos por req).

## Regras de Detecção e Notificações
O algoritmo varre a array de lojistas do item ativo procurando por `sellerName === charName`:
- **Detecção de Venda**: Se o estoque da loja do usuário (`itemCnt`) diminuir em relação ao último ciclo analisado, o sistema calcula a diferença e emite uma notificação do SO: *"Você vendeu X unidades do item Y!"*.
- **Desaparecimento Repentino (DC vs Sold Out)**: Se a loja sumir completamente do payload da API, o sistema emite uma notificação híbrida preventiva: *"Alerta ⚠️: Sua loja sumiu do mercado. Você pode ter esgotado o estoque ou tomado Disconnect (DC)."*
