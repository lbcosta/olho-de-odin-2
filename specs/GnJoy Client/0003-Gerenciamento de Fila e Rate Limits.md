# 0003 - Gerenciamento de Fila e Rate Limits

## Restrição de Consumo (Rate Limit)
A GNJOY possui restrições severas. Para evitar banimentos ou bloqueios, **o Client deve SEMPRE fazer no máximo 1 requisição a cada 3 segundos (3000ms) por padrão**. 
Todos os fluxos do Olho de Odin 2 usarão uma fila de controle global (`RequestQueueManager`), hospedada exclusivamente no **Main Process do Electron**, que garante esse comportamento estrito para todo e qualquer tráfego HTTP da aplicação.

## Regras de Fila
- Requisições (sejam buscas principais, lazy-loading de itens/lojas, ou extrações automáticas) entram obrigatoriamente nesta fila de processamento síncrono.
- A fila não permite paralelismo HTTP direcionado aos servidores da GNJOY. Requisições concorrentes disparadas pela interface de usuário deverão aguardar seu turno na fila respeitando rigorosamente o timeout global de repouso (3000ms).
