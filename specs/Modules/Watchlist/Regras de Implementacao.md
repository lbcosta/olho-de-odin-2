# Regras de Implementação: Watchlist e Dashboard

## 1. Stack Tecnológico
- **UI & Reatividade**: React rodando no *Renderer Process* do Electron.
- **Estilização**: TailwindCSS associado com componentes headless/radix. Objetivo: Formatar controles de form, modais e layouts de modo idêntico aos padrões de *Desktop* moderno. Identidade limpa, familiar e sem floreios exóticos de layout.
- **Ponte de Comunicação**: IPC do Electron (`ipcRenderer.invoke` e `ipcMain.handle`) servindo como a veia de rede local entre o UI e o SQLite/GnJoy Client.
- **Notificações Críticas**: API estendida nativa de notificação do Windows/OS chamada pelo próprio Electron.

## 2. Requisitos Não Funcionais (NFRs)
- **Renderização Não-Bloqueante**: Mesmo com o background realizando operações de matemática pura nos arrays de mercado (Média Ponderada Real de 7 dias cruzada com os novos itens ativos), a *Main Thread* gráfica da interface (Scroll, Clique) precisa girar cravada em 60fps.
- **Low-Footprint Ocioso**: Quando minimizado para a Bandeja do Sistema (Tray), a Watchlist suspende a atualização do DOM e atualiza apenas os dados no SQLite no Main Process, consumindo CPU ínfima (< 5%).

## 3. Regras Críticas de Código
- **Algoritmo de Temporização Assíncrona**: O controle de requisição via React NÃO envia blocos maciços para o IPC. O sistema descobre a contagem de cards ($N$) e calcula a janela total ($T_{min} = N \times 3000ms$). A Watchlist despacha a intenção de atualização num intervalo individual contínuo de $T_{min} / N$ segundos por item.
- **Condicionamento Híbrido In-App vs Nativo**: Se o app não estiver em "foco" visual pelo usuário e as regras de estratégia da Watchlist dispararem uma venda ou Undercut, a rotina não tenta subir Toasts em DOM morto, acionando diretamente o envio da notificação nativa do Windows.
