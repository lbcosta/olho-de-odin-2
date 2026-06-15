# Regras de Implementação: Tela e Detalhes do Item

## 1. Stack Tecnológico
- **UI Visual**: React via TailwindCSS para o Dashboard isolado de Item.
- **Integração de SO**: `navigator.clipboard` ou Electron Clipboard IPC nativa.
- **Lazy Data Loading**: Interceptação assíncrona local (SQLite `ssi` table).

## 2. Requisitos Não Funcionais (NFRs)
- **Fluidez do Lazy-Loading (`/navi`)**: Ao clicar sobre as Coordenadas Exatas ocultas da Loja ativa, o App deve transitar fluidamente para o esqueleto de renderização *Loading Placeholder (Skeleton UI)* se o SQLite responder que houve *"Cache Miss"* nas chaves da loja e que bateremos no limite durão de 3s da API para puxar a informação do zero.
- **Resgate Físico Padrão**: Caso ocorra *Cache Hit* local (a loja `ssi` já foi puxada), o Electron e React cospem a cópia do Copy-Paste Clipboard pro Windows num tempo total absoluto `< 10ms`.

## 3. Regras Críticas de Código
- **Fidelidade Cronológica Imposta (`updated_at`)**: Nenhuma View que compõe essa tela pode basear-se no relógio de execução atual (`Date.now()`). O valor de `updated_at` exibido no topo (marcando a idade dos valores e do cálculo matemático renderizado abaixo) obrigatoriamente precisa estar acoplado e populado diretamente pelos metadados extraídos do Cache SQLite de última leitura da aplicação.
- **Inibidor Condicional de Fila**: O clique de pedir o Detalhamento completo da Loja para cópia passa o Botão da UI para um estado `disabled={true}` duro. É terminantemente proibido que a tela permita envio repetido enquanto a string de `/navi` ainda está parada sob prioridade no Singleton Node sendo enfileirada, ou duplicaremos gasto de Rate Limit.
