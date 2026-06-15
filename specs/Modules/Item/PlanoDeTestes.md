# Plano de Testes: Tela e Detalhes do Item

> **Nota**: Este módulo deve ser desenvolvido utilizando TDD obrigatório (Red-Green-Refactor) focando no comportamento através de interfaces públicas. Slices Verticais.

## 1. Testes de Unidade / UI (Componentes)

### 1.1 Lazy-Loading e Cache Miss (Skeleton)
- **Input**: Propriedade de item ID sem dados em cache (`Cache Miss`).
- **Processo**: Renderização inicial do Dashboard de Item.
- **Output**: Renderiza imediatamente o esqueleto (Skeleton UI) de `Loading`.
- **Verificação**: O DOM exibe os skeletons, e o botão principal adquire estado `disabled={true}` para inibir clicks paralelos.

### 1.2 Fidelity e Atualidade (`updated_at`)
- **Input**: Objeto de cache mockado com `updated_at` definido no passado e relógio do sistema no presente.
- **Processo**: Renderizar cabeçalho do item.
- **Output**: UI exibe o tempo atrelado única e exclusivamente ao `updated_at`.
- **Verificação**: Garantir que a `Date.now()` não interfira no visor da UI.

## 2. Testes de Integração

### 2.1 Resgate Instantâneo e Clipboard
- **Input**: Dados de loja ativamente cacheados no SQLite (`Cache Hit`). Comando de Clique do Usuário para copiar coordenadas `/navi`.
- **Processo**: O App consulta o cache e escreve na área de transferência.
- **Output**: Sistema escreve na Clipboard do OS.
- **Verificação**: O tempo de disparo do evento ao IPC de Clipboard e escrita ser estritamente inferior a `< 10ms`.

### 2.2 Inibidor de Fila (Prevenção de Gasto)
- **Input**: Item sendo buscado já existe na fila global de requisições pendentes.
- **Processo**: O usuário clica para atualizar.
- **Output**: Ação interceptada. O componente visual inibe cliques repetitivos.
- **Verificação**: O Singleton Node não recebe IPCs repetidos para o mesmo request se ele já consta no pool ativo de pendências.
