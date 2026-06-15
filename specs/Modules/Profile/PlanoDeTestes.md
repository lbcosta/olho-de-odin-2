# Plano de Testes: Perfis e Persistência

> **Nota**: Este módulo deve ser desenvolvido utilizando TDD obrigatório (Red-Green-Refactor) focando no comportamento através de interfaces públicas. Slices Verticais.

## 1. Testes de Integração DB

### 1.1 Transação ACID de Importação Completa
- **Input**: Um JSON válido de Backup com Profile, Watchlist e Configurações; mas no meio do JSON inserimos uma estrutura propositalmente corrompida na tabela filho.
- **Processo**: O DB Inicia a importação massiva (utilizando transação `better-sqlite3`).
- **Output**: O sistema detecta o erro e aplica o Rollback.
- **Verificação**: O DB deve retornar ao estado exato pré-importação. Nenhum dado parcial deve persistir.

### 1.2 Cascata e Integridade (Foreign Keys)
- **Input**: Excluir (`DELETE`) um registro central de `Profile`.
- **Processo**: DB executa exclusão on cascade via Foreign Key `profile_id`.
- **Output**: Todos os registros satélites (Settings, Watchlist itens atrelados a ele) desaparecem.
- **Verificação**: O count da tabela Watchlist deve ser zero para aquele ID de profile.

## 2. Testes Unitários (Regras de Negócio)

### 2.1 Serialização e I/O
- **Input**: ID de Profile na tabela perfeitamente preenchida. Comando de exportação.
- **Processo**: O Módulo invoca I/O simples, chama `JSON.stringify` nas rows do db.
- **Output**: Criação do arquivo físico no FS mockado em `.json`.
- **Verificação**: O arquivo criado é um JSON perfeitamente válido sem loops desnecessários.

### 2.2 Fila Prioritária (My Store)
- **Input**: Array contendo um item com `isInMyStore: true` entra no request.
- **Processo**: O profile agenda esse array no Singleton.
- **Output**: O método `unshift` é chamado internamente na queue.
- **Verificação**: Esse item será consumido na próxima chamada de execução imediatamente (posição index 0 da Queue), bypassando itens não-prioritários.
