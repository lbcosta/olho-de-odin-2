# Regras de Implementação: Perfis e Persistência

## 1. Stack Tecnológico
- **Banco de Dados**: `better-sqlite3`. (Driver síncrono nativo para Node.js, ultra-rápido). Sem ORMs gigantes (Prisma) para não quebrar a empacotação binária do instalador final do Electron e reduzir a pegada de RAM do aplicativo. Consultas feitas em SQL puro ou micro *Query Builders*.
- **Manipulação de Arquivos**: APIs padrão do Node.js (`fs`, `path`) para Importar e Exportar Backups.

## 2. Requisitos Não Funcionais (NFRs)
- **ACID Compliant**: Rotinas massivas de exclusão de Perfil ou importação de Backup completo devem usar transações (`db.transaction()`). O arquivo `olhodeodin.db` jamais pode corromper se o computador do usuário acabar a bateria no exato momento da importação de um Profile.
- **Offline Tolerant (Performance)**: As consultas de UI do Profile, leitura inicial de Watchlist e métricas velhas ocorrem sub-20ms porque não esperam qualquer validação externa, batendo direto no `.db`.

## 3. Regras Críticas de Código
- **Foreign Keys Estruturais**: Toda e qualquer tabela gerada que não seja global precisa conter a coluna `profile_id`. É necessário forçar a integridade referencial via `PRAGMA foreign_keys = ON;` no momento de conexão do banco e declarar restrições em cascata `ON DELETE CASCADE` no SQLite.
- **Override de Rate Limit para Lojinha**: Quando a flag `isInMyStore: true` estiver detectada nas arrays sendo puxadas do Profile, o agendador *não* joga essas requisições no meio do bolo da Watchlist normal. Ele envoca um comando de `unshift` ou `High Priority Queue` na fila do Singleton.
- **I/O Serializado Simplificado**: A função de gerar arquivo `.json` de um Perfil não requer loops complexos. O app busca as linhas brutas das tabelas pelo `profile_id`, invoca `JSON.stringify` na árvore e envia a string ao sistema de arquivos do usuário.
