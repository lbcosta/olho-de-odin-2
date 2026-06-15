# 0004 - Log de Requisições do Sistema

## Escopo
Detalha o comportamento do rodapé expansível presente na tela de Dashboard da Watchlist.

## Comportamento do Componente
O componente de Log reside na parte inferior da tela e informa ao usuário o status da máquina de estados do aplicativo (especialmente útil durante o processamento invisível da fila de background).

- **Estado Colapsado (Padrão)**: Fica reduzido no rodapé exibindo possivelmente o status da última ação executada. Ao clicar na barra colapsada, ela fará uma animação para "subir" e se expandir em uma tela maior.
- **Estado Expandido**: O usuário verá uma lista exata das requisições (requests) que estão sendo despachadas ou enfileiradas pelo sistema para a API do Ragnarok.
- **Formatação**: O Log deve ser codificado por cor e status (ex: OK em verde, FAIL/Rate Limit em vermelho, Pending em amarelo/cinza) para um fácil diagnóstico visual sem precisar abrir o console de desenvolvedor.
- **Retorno**: Ao clicar novamente na barra de log quando expandida, ela deverá deslizar para baixo e voltar ao seu estado colapsado inicial.
