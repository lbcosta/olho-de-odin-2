# Implementation Tasks: Market Monitor (TDD Approach)

## Dependencies Graph
- Phase 1 (Setup) blocks Phase 2
- Phase 2 (Foundational DB & API) blocks all User Stories
- Phase 3 (US1) blocks Phase 4 (US2)
- Phase 4 (US2) blocks Phase 5 (US3)
- Phase 5 (US3) is independent of US4

## Phase 1: Setup & Testing Framework
- [ ] T001 Initialize Node.js project and add Electron, `better-sqlite3`, Vitest (Unit Tests), and Playwright (Integration Tests).
- [ ] T002 Create base Electron `src/main.js` and `src/preload.js` with basic test harness.
- [ ] T003 Create base UI structure in `src/ui/index.html` and `src/ui/style.css`.

## Phase 2: Foundational Layer (Database & API) - Vertical Slices
- [ ] T004 **[RED]** Write unit tests for DB Initialization and DAO operations.
- [ ] T005 **[GREEN]** Implement `src/db/index.js`, `schema.sql`, and `dao.js` to pass DB tests.
- [ ] T006 **[RED]** Write unit tests for safe RSC Parsing logic.
- [ ] T007 **[GREEN]** Implement `src/api/RscParser.js` to pass parsing tests.
- [ ] T008 **[RED]** Write unit tests for RequestQueueManager (3-second interval enforcement).
- [ ] T009 **[GREEN]** Implement `src/api/RequestQueueManager.js` to pass queue tests.
- [ ] T010 **[RED]** Write unit test for GnjoyClient fetching logic.
- [ ] T011 **[GREEN]** Implement `src/api/GnjoyClient.js`.

## Phase 3: User Story 1 - Configuração Inicial
**Goal:** User can create a profile and add items to a watchlist.
- [ ] T012 **[RED]** [US1] Write integration test (Playwright): "User opens app, creates profile, adds item to watchlist".
- [ ] T013 **[GREEN]** [US1] Implement Profile IPC handlers (`src/main.js`) and UI components (`src/ui/app.js`).
- [ ] T014 **[GREEN]** [US1] Implement item search via IPC and Watchlist UI.
- [ ] T015 **[REFACTOR]** [US1] Refactor UI and IPC separation.

## Phase 4: User Story 2 - Análise de Estratégia de Venda
**Goal:** User can see the market metrics and recommended strategies.
- [ ] T016 **[RED]** [US2] Write unit tests for MarketStrategies engine ($P_{avg}$, Spread, $CP$).
- [ ] T017 **[GREEN]** [US2] Implement `src/engine/MarketStrategies.js`.
- [ ] T018 **[RED]** [US2] Write integration test (Playwright): "User views dashboard, sees item metrics and strategy".
- [ ] T019 **[GREEN]** [US2] Create IPC endpoints for metrics and update UI dashboard.

## Phase 5: User Story 3 - Monitoramento da Própria Loja
**Goal:** Background engine monitors items and notifies user of sales or disconnects.
- [ ] T020 **[RED]** [US3] Write unit test for WatchlistEngine background loop (calculating dynamic interval).
- [ ] T021 **[GREEN]** [US3] Implement `src/engine/WatchlistEngine.js`.
- [ ] T022 **[RED]** [US3] Write integration test: "Engine detects sale, triggers OS Notification".
- [ ] T023 **[GREEN]** [US3] Integrate Electron Native Notifications and add UI toggle for "is_own_shop".

## Phase 6: User Story 4 - Localização de Loja
**Goal:** User can quickly copy the /navi coordinate for flipping.
- [ ] T024 **[RED]** [US4] Write integration test (Playwright): "User clicks 'Copiar /navi', coordinate is copied".
- [ ] T025 **[GREEN]** [US4] Implement coordinate retrieval in `GnjoyClient` and IPC endpoint to copy to clipboard.
- [ ] T026 **[GREEN]** [US4] Add "Copiar /navi" button in the UI.
