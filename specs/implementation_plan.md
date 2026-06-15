# Market Monitor Implementation Plan (TDD Version)

This plan details the technical implementation of the Market Monitor feature for Olho de Odin 2, strictly following the `ai_development_spec.md`, the `CONTEXT.md`, and the revised `constitution.md`. 
**Crucial update:** We are adopting a rigorous Test-Driven Development (TDD) approach using vertical slices (Red -> Green -> Refactor).

## User Review Required

- **Frontend Tech Stack**: To ensure maximum performance and simplicity without compilation overhead, I plan to use **Vanilla JS (ES6 Modules)** and **Vanilla CSS** for the UI, communicating with the Main Process via standard Electron IPC.
- **SQLite Driver**: I will use `better-sqlite3` because it is synchronous, extremely fast, and highly recommended for local Electron applications.
- **TDD Toolchain**: I will use **Vitest** for fast unit tests (logic, API queueing, math) and **Playwright** for Electron UI integration tests (end-to-end browser automation).

## Open Questions

> [!WARNING]
> **API Endpoints**: The exact URLs or routes for these endpoints on `ro.gnjoylatam.com` have been mapped out from `com.gnjoylatam.ro.md`.

## Proposed Changes

### Core Electron Setup & Test Harness
#### [NEW] package.json
Dependencies for Electron, `better-sqlite3`, `vitest`, and `@playwright/test`.
#### [NEW] vitest.config.js & playwright.config.js
#### [NEW] src/main.js & src/preload.js

### Database Layer
#### [NEW] src/db/schema.sql
#### [NEW] src/db/index.js & src/db/dao.js

### API & Request Management
#### [NEW] src/api/RequestQueueManager.js
#### [NEW] src/api/RscParser.js
#### [NEW] src/api/GnjoyClient.js

### Monitoring Engine & Strategies
#### [NEW] src/engine/MarketStrategies.js
#### [NEW] src/engine/WatchlistEngine.js

### Frontend (UI)
#### [NEW] src/ui/index.html & src/ui/style.css
#### [NEW] src/ui/app.js

## Verification Plan: TDD (Red-Green-Refactor)

The execution will follow strict vertical slices. For every component, we will write a test describing its behavior before writing the code.

### 1. Unit Tests (Vitest)
- **Database & DAO:** Tests asserting that `db.js` creates the file, executes `schema.sql`, and `dao.js` properly inserts/retrieves items without crashing.
- **RSC Parser (`RscParser.js`):** Tests asserting that given a simulated dirty React Server Component string (with commas and backticks), the parser safely extracts and returns the JSON payload.
- **Request Queue (`RequestQueueManager.js`):** Tests asserting that 3 concurrent fetch requests to the manager will result in exactly 3-second delays between executions.
- **Market Strategies (`MarketStrategies.js`):** Tests verifying math correctness for $P_{avg}$, Spread, and $CP$ calculations, ensuring the right strategy string is returned based on mock inputs.

### 2. Integration Tests (Playwright)
We will use Playwright to spin up the actual Electron app (Browser) and simulate user interaction.
- **US1 Flow:** "User opens app, inputs profile name, and clicks 'Add to Watchlist'". The test verifies the IPC communication and the UI update.
- **US2 Flow:** "User navigates to Dashboard". The test mocks the API response and asserts that the UI correctly displays the Market Metrics and Strategy.
- **US3 Flow:** "Background Engine detects sale". Test simulates the state change in the DB and asserts that an OS Notification mock is triggered.
- **US4 Flow:** "User clicks /navi". Test asserts that the clipboard API receives the correct `map_name` and coordinates.
