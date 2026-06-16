# 🛠️ Guia de Desenvolvimento — Olho de Odin 2

## Pré-requisitos

- Node.js >= 20 (testado em Node 22)
- npm >= 10

## Instalação

```bash
npm install
```

## Scripts

| Script               | Descrição                                                   |
| -------------------- | ----------------------------------------------------------- |
| `npm run dev`        | Sobe o app em modo desenvolvimento (HMR no renderer).       |
| `npm run build`      | Typecheck + bundle de `main`/`preload`/`renderer` (`out/`). |
| `npm run build:win`  | Build + empacota o `.exe` portátil via electron-builder.    |
| `npm run typecheck`  | Verifica os tipos (configs `node` e `web` separadas).       |
| `npm run test`       | Roda a suíte Vitest (TDD).                                  |
| `npm run test:watch` | Vitest em modo watch.                                       |
| `npm run lint`       | ESLint (flat config).                                       |
| `npm run format`     | Prettier.                                                   |
| `npm run rebuild`    | Reconstrói deps nativas para o ABI do Electron (uso local). |

## Arquitetura de Processos

```
src/
├── main/        # Main Process (Node): janela, DB, IPC handlers, serviços
├── preload/     # Ponte contextBridge — única superfície exposta ao renderer
├── renderer/    # React + Tailwind (UI). NUNCA acessa Node/DB diretamente.
└── shared/      # Tipos e contratos compartilhados (IPC, domínio)
```

A comunicação UI ↔ backend acontece **exclusivamente** via IPC tipado,
definido em `src/shared/types/ipc.ts`. O renderer chama `window.api.invoke(...)`,
o preload encaminha via `ipcRenderer.invoke`, e o Main responde via handlers
registrados em `src/main/ipc/registerHandlers.ts`.

## Nota sobre o módulo nativo `better-sqlite3` (ABI)

`better-sqlite3` é um módulo nativo e precisa casar com o ABI do runtime:

- **Testes (Vitest) e este repositório**: rodam sob **Node**, então o
  `npm install` padrão já compila o binário correto.
- **Runtime do Electron (`npm run dev`)**: requer o binário compilado para o
  ABI do **Electron**. Rode uma vez `npm run rebuild` após instalar.
- **Empacotamento (`build:win` / CI)**: o `electron-builder` reconstrói as
  dependências nativas automaticamente (`npmRebuild: true`).

> Por isso o `postinstall` **não** força o rebuild para Electron — manteria os
> testes Node quebrados. O rebuild é explícito/local ou feito pelo packaging.

## CI/CD

`.github/workflows/release.yml` dispara apenas em tags `v*`, builda no Windows,
empacota `.exe` + `docs/MANUAL.md` num `.zip` e anexa à Release.
