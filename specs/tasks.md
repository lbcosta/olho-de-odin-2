# Tarefas de Implementação: Olho de Odin 2 (Por Especialidade)

> **Contexto:** Este documento detalha a esteira de execução do projeto, categorizando estritamente as tarefas por Agente Especialista (Arquiteto de Software, DevOps, Back-end, Front-end e QA). As dependências entre tarefas são lineares dentro das Fases, permitindo execução paralela segura (`[P]`) quando as fundações estiverem estabelecidas.

## Estratégia de Execução

1. **Fase 1 (Fundação)**: DevOps e Arquiteto preparam o terreno, pipelines e o boilerpate de comunicação IPC/DB.
2. **Fase 2 (Back-end e Lógica)**: Back-end sobe o motor SQLite e os singletons de rede e matemática.
3. **Fase 3 (Front-end e UI)**: Front-end consome as portas do IPC, desenhando os módulos em React e Tailwind.
4. **Fase 4 (Qualidade)**: QA varre a aplicação com os planos de TDD traçados anteriormente.

---

## Fase 1: Fundação e Estrutura (Arquiteto & DevOps)

### Arquiteto de Software
- [ ] T001 Inicializar o boilerplate de Electron + React (Vite) isolando *Main Process* e *Renderer Process* em `package.json`.
- [ ] T002 Estabelecer a tipagem de contratos IPC em `src/shared/types/ipc.ts` para comunicação segura de Rede e DB.
- [ ] T003 Inicializar e expor a instância estrita e síncrona do `better-sqlite3` no *Main Process* em `src/main/database/index.ts`.
- [ ] T004 Configurar a estrutura base de TailwindCSS e HeadlessUI garantindo o "Design Familiar" em `src/renderer/index.css` e `tailwind.config.js`.

### Engenheiro DevOps
- [ ] T005 [P] Escrever o arquivo `electron-builder.yml` garantindo o output limpo em `.exe` portátil para Windows (sem instaladores complexos).
- [ ] T006 [P] Configurar a *Pipeline CI/CD* criando o arquivo `.github/workflows/release.yml` para disparar compilação de `.exe` em cada nova Tag.
- [ ] T007 [P] Configurar ambiente de testes automatizados com Jest/Vitest em `vitest.config.ts`.

---

## Fase 2: Core e Motores (Engenheiro Back-end)

### Módulo: GnJoy Client & Rede
- [ ] T008 Implementar classe `RequestQueueManager` (Singleton) com trava de `3000ms` em `src/main/services/gnjoy/RequestQueueManager.ts`.
- [ ] T009 Implementar a função *Anti-Regex* de `JSON.parse` para os retornos do servidor RSC em `src/main/services/gnjoy/parser.ts`.

### Módulo: Perfil e Persistência DB
- [ ] T010 [P] Escrever os *Migrations* e o esquema SQL inicial forçando `PRAGMA foreign_keys = ON;` em `src/main/database/schema.sql`.
- [ ] T011 [P] Implementar rotinas CRUD ACID-Compliant (`db.transaction()`) para o Profile e serialização JSON I/O em `src/main/services/profile/ProfileService.ts`.

### Módulo: Métricas e Busca
- [ ] T012 [P] Implementar o motor puramente matemático de Média Ponderada e gatilhos (Undercut, Flipping) com divisor seguro em `src/main/services/metrics/SalesMetrics.ts`.
- [ ] T013 [P] Implementar tratativa de I/O em Batch do arquivo `.txt` via FS/IPC com higienização de string em `src/main/services/search/BulkImport.ts`.

---

## Fase 3: Interface e UX (Engenheiro Front-end)

### Módulos Base e Layout
- [ ] T014 [P] Criar o Componente `RootLayout` e Container Global de Navbar e Bandeja em `src/renderer/components/layout/RootLayout.tsx`.

### Módulo: Request Log Global
- [ ] T015 Implementar Componente *Log Viewer* colapsável no rodapé consumindo via IPC usando classes de semântica de cor em `src/renderer/components/RequestLog/LogViewer.tsx`.
- [ ] T016 [P] Implementar Dicionário Tradutor de rotas GnJoy para Strings Humanizadas no frontend em `src/renderer/utils/LogTranslator.ts`.

### Módulos: Dashboard & Item
- [ ] T017 Implementar Esqueletos de Loading (*Skeleton UI*) com TailwindCSS em `src/renderer/components/ui/Skeleton.tsx`.
- [ ] T018 Implementar o Painel de Detalhes do Item usando `navigator.clipboard` com resposta sub-10ms em `src/renderer/components/Item/ItemDashboard.tsx`.

### Módulos: Busca & Watchlist
- [ ] T019 Implementar barra de busca defensiva (Debounce de `300ms`) e disparo visual de Toasts humanizados em `src/renderer/components/Search/SearchBar.tsx`.
- [ ] T020 Implementar Card da Watchlist consumindo cálculo assíncrono temporizado do IPC para evitar quebras de Frame em `src/renderer/components/Watchlist/WatchlistGrid.tsx`.

---

## Fase 4: Validação Estrita (Controle de Qualidade / QA)

*Atenção: Os testes devem rodar sob TDD (Red-Green-Refactor) baseados nos Planos de Teste oficiais gerados.*

### Testes Back-end & Integração
- [ ] T021 [P] Executar testes do parser *Anti-Regex* e concorrência da Queue no GnJoy Client em `tests/main/gnjoy.spec.ts`.
- [ ] T022 [P] Executar testes de Transações ACID e Foreign Keys do SQLite em `tests/main/profile.spec.ts`.
- [ ] T023 [P] Executar testes limiares (Thresholds) de divisores em `SalesMetrics.ts` em `tests/main/metrics.spec.ts`.

### Testes Front-end & UI
- [ ] T024 [P] Executar testes do limitador array `slice(-50)` de Memory Leak na Fila UI do Request Log em `tests/renderer/requestLog.spec.ts`.
- [ ] T025 [P] Executar testes de Double-click (Spamming) e UI Skeletons em `tests/renderer/uiComponents.spec.ts`.
