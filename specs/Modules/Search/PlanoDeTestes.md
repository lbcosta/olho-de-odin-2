# Plano de Testes: Interface de Busca e Importação

> **Nota**: Este módulo deve ser desenvolvido utilizando TDD obrigatório (Red-Green-Refactor) focando no comportamento através de interfaces públicas. Slices Verticais.

## 1. Testes Unitários de Dados Locais

### 1.1 Controle de Memória da String (Upload)
- **Input**: Um arquivo `.txt` contendo linhas duplas em branco, espaçamentos falsos e IDs corrompidos (`"\n 123 \n\n 456"`).
- **Processo**: A função de tratamento e sanitarização lê as strings.
- **Output**: Um array polido e exato (`[123, 456]`).
- **Verificação**: Confirmação visual de que o código higieniza lixo do FS e aplica `trim()`, impedindo que strings zumbis entrem na fila de Rede.

## 2. Testes de Integração UI (Componentes)

### 2.1 Debounce Defensivo
- **Input**: Simulação de 10 teclas "Enter" / Cliques sendo batidas pela biblioteca de User Event Test em menos de `300ms`.
- **Processo**: O formulário é processado, barrando submissões pela flag de timer e `disabled`.
- **Output**: Exatamente 1 (UMA) única chamada IPC rumo ao singleton Node é expedida.
- **Verificação**: Testes falham se houver mais de uma emissão (Double-click / Spamming combatido com sucesso).

### 2.2 Feedback em Falhas Humanizado (Toasts)
- **Input**: Resposta negada/Item 404 sendo recebido via IPC (Falha GnJoy).
- **Processo**: Componente interpreta a reposta de erro.
- **Output**: Evoca o Toast "Item não encontrado na GnJoy".
- **Verificação**: Confirma que nenhuma string JSON complexa vazou no DOM e o UX de erro ocorreu de forma nativa e limpa.

### 2.3 Rastreio Reativo Base de Arquitetura
- **Input**: Retorno primário OK após buscar novo item.
- **Processo**: Retorno ao Renderer causa o Dispatch à engine de cache.
- **Output**: Objeto é injetado no DB Local `better-sqlite3`.
- **Verificação**: O State da tela recarrega imediatamente com base nos novos dados do DB disparados no retorno do hash.
