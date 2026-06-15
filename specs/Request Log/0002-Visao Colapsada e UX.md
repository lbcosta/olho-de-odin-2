# 0002 - Visão Colapsada e Status da Fila (UX)

## Escopo
Define o comportamento padrão (encolhido) da Barra de Log e como ela traduz as operações técnicas pesadas para o usuário final.

## UX da Fila de Requisições
Devido ao estrito limite da API (1 requisição a cada 3 segundos), as requisições se acumularão naturalmente na fila. Para não sobrecarregar o usuário com strings técnicas, a visão colapsada focará exclusivamente na **Experiência do Usuário (UX)** e na **Previsibilidade**:

- **Ação Amigável**: Em vez de rotas HTTP cruas, exibe uma tradução humana da tarefa atual (ex: *"Buscando Detalhes da Loja..."*, *"Atualizando Histórico de Preços..."*).
- **Indicador de Fila**: Exibe em tempo real o volume de tarefas agendadas aguardando processamento (ex: *"4 itens pendentes"*).
- **Feedback de Atividade**: Sempre que o `RequestQueueManager` estiver ativamente consumindo a fila, a barra deverá apresentar um **spinner de loading** contínuo ao lado do nome da ação.
