# 0002 - Estratégia Local-First e Cache Offline

## Escopo
Define a mecânica de sobrevivência do aplicativo em modo offline e a estratégia estrita de proteção do Rate Limit através do banco de dados.

## Caching Obrigatório (API Cache)
Para evitar requisições redundantes nos servidores da GnJoy e estourar o limite de 3 segundos sem necessidade, **toda e qualquer consulta bem-sucedida** deverá ter seu payload JSON persistido cru em uma tabela de cache no banco SQLite (ex: `api_cache`). 

O aplicativo deve sempre renderizar a UI puxando dados primariamente dessa tabela local. Consultas ativas à internet só devem ocorrer quando:
- O usuário clicar ativamente em um botão "Atualizar".
- A Watchlist atingir o tempo de ativação cíclico no background.

## Experiência Offline e Timestamps
Como subproduto deste cache, o Olho de Odin 2 é um aplicativo "Local First" tolerante a falhas. Se a internet do jogador cair, a API ficar offline ou ele tomar um IP Ban temporário, o aplicativo continuará navegável, permitindo análise do mercado passado.

Para dar clareza a esse estado de estase temporal:
- **Todos os itens no dashboard e nas telas de detalhe devem obrigatoriamente exibir a data/hora da última sincronização (`updated_at`)**. Isso informa visualmente ao usuário a "idade" real da informação que ele está consultando e do cálculo da Estratégia de Venda.
