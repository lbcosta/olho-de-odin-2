# Plano de Testes: Watchlist e Dashboard

> **Nota**: Este módulo deve ser desenvolvido utilizando TDD obrigatório (Red-Green-Refactor) focando no comportamento através de interfaces públicas. Slices Verticais.

## 1. Testes de Integração e UI

### 1.1 Temporizador Assíncrono da Fila
- **Input**: 4 Itens ativos na Watchlist do usuário. Atualização engatada na UI.
- **Processo**: React calcula $T_{min} = 4 \times 3000ms = 12000ms$. Tempo por item = `3000ms`.
- **Output**: IPCs são emitidos no relógio exato nos segundos: `0, 3, 6, 9`.
- **Verificação**: O timing de loop garante que a UI não jogue todo o peso ao Node no exato momento, distribuindo o delay.

### 1.2 Performance Renderização (Não-Bloqueante)
- **Input**: Operação matemática complexa de métricas operando nos dados enquanto a Watchlist renderiza os elementos do Dashboard.
- **Processo**: A camada do Chromium Renderiza a interface e a thread.
- **Output**: O React finaliza a transição das mudanças em tempo inferior aos frames permitidos.
- **Verificação**: Nenhum "Jank" (Stuttering de frame) ocorre porque os eventos síncronos da métrica vieram pré-prontos do Node, o React apenas aplica DOM updates simples.

### 1.3 Notificação Híbrida (Janela Suspensa)
- **Input**: Alerta estratégico é acionado (Venda ou Undercut), mas o estado da aplicação indica que ela está fora de foco / minimizada na bandeja (`document.hidden`).
- **Processo**: Função UI desvia da renderização de Toasts visuais In-DOM e dispara IPC chamando API nativa do S.O.
- **Output**: Notificação do Windows aparece na bandeja de sistema nativo.
- **Verificação**: Verifica que o evento de DOM local foi pulado intencionalmente e o Dispatch via ipcMain em direção ao Notification Module do Electron foi invocado.
