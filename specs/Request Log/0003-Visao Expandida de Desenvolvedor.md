# 0003 - Visão Expandida de Desenvolvedor

## Escopo
Define o comportamento da Barra de Log quando maximizada pelo usuário para inspeção detalhada do tráfego de rede da aplicação.

## Interação e Developer View
Ao clicar sobre a barra colapsada, ela deve sofrer uma transição fluída deslizando para cima, revelando a mini-tela de console ("Developer View"). Ao clicar novamente, ela retrai para o rodapé.

## Formatação do Histórico
Dentro do painel expandido, o sistema exibirá uma lista cronológica das últimas requisições executadas e a lista ordenada dos itens ainda pendentes na fila. O foco aqui é estritamente técnico e diagnóstico:
- **Detalhes Técnicos**: Deve expor o `METHOD` (GET, POST), o `PATH` completo acionado na GnJoy, e o Status Final do processo.
- **Codificação Semântica por Cor**:
  - 🟢 **Verde**: Status OK (Requisição completada com sucesso).
  - 🔴 **Vermelho**: ERRO (Falhas de parse, Timeout de rede, Hash Expirado ou *Rate Limit 429*).
  - 🟡 / ⚪ **Amarelo/Cinza**: PENDENTE (Itens congelados na fila aguardando o cooldown restritivo de 3 segundos).
