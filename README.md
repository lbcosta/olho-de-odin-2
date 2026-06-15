<div align="center">
  <h1>👁️ Olho de Odin 2</h1>
  <p><strong>A Inteligência de Mercado Absoluta para o Ragnarok Online LATAM</strong></p>
</div>

---

## 📖 Sobre o Projeto

**Olho de Odin 2** é um aplicativo de desktop focado em dominar a economia de Rune-Midgard. Construído sob uma arquitetura **Local-First**, ele se conecta diretamente à infraestrutura da *GnJoy LATAM* para extrair, compilar e matematizar dados do mercado do jogo. 

Longe de ser apenas um buscador de lojas, o sistema atua como um conselheiro financeiro: ele avisa o jogador sobre a melhor hora para vender seus itens, quando segurá-los para fugir de saturações de mercado, e até alerta se a lojinha in-game dele caiu (Disconnect) ou vendeu o estoque. Tudo isso envelopado em uma UX rápida, limpa e familiar, enquanto protege o jogador contra o banimento de IP nativo dos servidores da publicadora.

## ✨ Features Principais

- 🛡️ **Arquitetura Local-First (Offline Tolerant)**: Cada busca e detalhe extraído é cacheado num banco SQLite ultrarrápido com o selo de sincronização (`updated_at`). Se o servidor oficial cair, o Olho de Odin continua navegável através de dados históricos.
- 📊 **Matemática Pura de Mercado**: Cálculos de Média Ponderada Real usando histórico limpo de 7 dias. Detecção automática de **Alta Demanda (Hot Item)**, **Mercado Saturado** e Alertas Críticos de **Quedas Bruscas (Crash/Dump)**.
- ⚔️ **Estratégias de Precificação Ativa**: Algoritmos que sugerem o melhor preço de venda:
  - **Undercutting Rápido**: Ignora "trolls" com apenas 1 unidade de estoque e corta o preço do competidor real.
  - **Posicionamento Premium**: Otimiza a margem de lucro empatando com lojistas caros se a concorrência for pífia.
  - **Flipping**: Avisa para não vender (ou comprar e revender) se o mercado sofrer queda de 30% no preço base.
- 🏪 **Tracker da "Minha Loja"**: Monitoramento de fundo que observa estoques e dispara **Notificações Nativas do Windows** se o usuário realizou uma venda ou se a loja sumiu subitamente do mercado (DC).
- 📍 **Lazy Loading & Área de Transferência (`/navi`)**: As coordenadas vitais das lojinhas carregam sob-demanda e são despachadas pro Clipboard prontas para serem coladas no chat do jogo.
- 🚀 **CD Automático (Zero-Setup)**: Pipeline de *GitHub Actions* que compila e empacota o app automaticamente em um executável `.exe` dentro de um `.zip` acompanhado do **Manual de Instruções**, entregando diretamente na mão do usuário final a cada nova *Release*.

## 🛠️ Stack Tecnológico

Um projeto pensado do zero para contornar *Rate Limits* pesados (3000ms), *Payloads* obscuros de *React Server Components (RSC)* e limitações de UI.

- **Plataforma**: Electron (Main Process isolado para a Fila Global).
- **Interface**: React.js + TailwindCSS (Foco em UI não-bloqueante e identidade visual Desktop moderna).
- **Banco de Dados**: `better-sqlite3` (Performance ACID massiva, tolerância a falhas, zero dependências complexas de build e facilitador de Backup JSON via Perfis).
- **Core de Rede**: `RequestQueueManager` (Singleton) e Extratores puros baseados em `JSON.parse()` blindados contra Regex.

## 📁 Árvore de Especificações (Specs)

A documentação do Olho de Odin 2 é estritamente modular. Qualquer engenheiro ou Inteligência Artificial que for atuar no projeto deve consultar os Manuais de Engenharia na pasta `specs/`.

- `/specs/Architecture`: Regras Base de Banco, Electron e Estratégia de Caching Local.
- `/specs/GnJoy Client`: A Fila de 3 segundos e as regras anti-regex de captura de tokens de Sessão.
- `/specs/Sales Metrics`: As fórmulas puras em TypeScript para cálculo financeiro do Mercado.
- `/specs/Profile`: As políticas de exclusão em Cascata do SQLite e Importação/Exportação JSON.
- `/specs/Watchlist`: A interface gráfica de Dashboard e as regras de *Polling* assíncrono.
- `/specs/Item & Search`: Como transacionar entre a lista bruta e a coordenada individual.
- `/specs/Request Log`: A janela semântica limitadora de *Memory Leak*.

---

<div align="center">
  <p>Feito para ajudar mercadores a dominar Prontera. 🛒</p>
</div>