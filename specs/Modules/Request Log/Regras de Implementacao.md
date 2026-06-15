# Regras de Implementação: Barra de Request Log Global

## 1. Stack Tecnológico
- **UI Base**: Componente afixado perenemente no `RootLayout` do React (*Portals* ou container-irmão inferior).
- **Streaming State via IPC**: Recebimento de *Event Emitters* (via canais de Electron IPC) disparados pelo Singleton `RequestQueueManager` em direção aos hooks de escuta do React (`useEffect`).
- **Estilização**: TailwindCSS para transições fluídas (CSS Transitions de Slide-Up) entre as visualizações Colapsada e Expandida do painel inferior.

## 2. Requisitos Não Funcionais (NFRs)
- **Limite Protetivo Absoluto de Memória (OOM Prevention)**: O usuário típico do Ragnarok deixa aplicações auxiliares rodando minimizadas em modo passivo por mais de 72 horas diretas. A lista da View Expandida (Developer Console) possui limitação agressiva e obrigatória: O estado do array de histórico deve manter **exclusivamente os últimos 50 registros** (`slice(-50)`). Arrays infinitos causam um Memory Leak devastador no *Renderer Process* da engine do Chromium embarcada.
- **Inibidor de Bloqueio Oculto**: A micro-animação do *Spinner de Loading* (CSS Spin) da Watchlist e da Fila precisa estancar a renderização do React imediatamente se o aplicativo constatar que o Electron foi minimizado na bandeja, cortando sobrecarga inútil em processamento de placa de vídeo do usuário em segundo plano.

## 3. Regras Críticas de Código
- **Dicionário Tradutor de UX**: O log colapsado voltado ao usuário comum nunca deve desenhar Strings de rede reais do Endpoint cru da GnJoy (ex: `/shop-search/trading?itemId=X`). O React adota um `Map Object` fixo para mascarar dinamicamente paths técnicos em Strings amigáveis (Ex: *Path X vira "Verificando concorrência..."*, *Path Y vira "Atualizando economia geral..."*).
- **Código de Cores Obrigatório**: As tags indicativas da lista de desenvolvimento (`status`) usam semântica mapeada de cor: Código `200` (Tailwind `bg-green-500`), Código `429/Error` (Tailwind `bg-red-500`), Item `Pendente na Fila` (`bg-gray-400`).
