# Olho de Odin 2 - Especificação Arquitetural Central

Este documento é a fonte suprema da verdade para o desenvolvimento do **Olho de Odin 2**, aglutinando todas as lógicas extraídas, refinadas e blindadas nos módulos da pasta `/specs`.

---

## 1. Stack e Plataforma Base
- **Plataforma**: Desktop nativo via **Electron**.
- **Linguagem**: JavaScript/TypeScript.
- **Banco de Dados**: Arquivo local unificado **SQLite** (`olhodeodin.db`).
- **Sistema Operacional Alvo**: Windows (Entrega via instalador `.exe` "zero-setup").

---

## 2. GnJoy Client e RSC Parser
A API do Ragnarok LATAM não é REST. Ela retorna fluxos *React Server Components (RSC)*.
- **Extração Segura (Anti-Regex)**: O parser deve encontrar as linhas prefixadas (ex: `10:` para listas, `1:` para POST), **remover o prefixo**, e executar um `JSON.parse()` nativo no resto da string. Regex é estritamente proibido para extração de valores, pois nomes de itens e lojas contêm aspas, parênteses e vírgulas.
- **Sessão Dinâmica (`Next-Action`)**: As rotas de detalhamento e histórico exigem o Hash/ID numérico de um Server Action. Esse valor (ex: `153b6f0e...`) deve ser extraído via GET inicial no HTML/RSC e injetado no header `Next-Action` de todos os requests POST subsequentes da mesma sessão.

---

## 3. Gerenciamento de Fila e Rate Limit
A GnJoy bane IPs que ultrapassam o limite rígido de conexões temporárias.
- **Limite Intransponível**: O aplicativo deve realizar, no máximo, **1 requisição a cada 3 segundos (3000ms)**.
- **Fila Global (`RequestQueueManager`)**: Este Singleton deve rodar exclusivamente no **Main Process do Electron**. Toda tentativa de acesso à rede passa por ele.
- **Prioridade de Fila**:
  1. **Prioridade Máxima**: Monitoramento "Minha Loja" (para alertar Vendas ou DC instantaneamente) e Comandos do Usuário (Busca manual ou requisição Lazy Load de `/navi`).
  2. **Prioridade Normal**: Atualizações cíclicas em background da Watchlist.
  3. **Prioridade Baixa**: Importação em Massa de itens (`.txt`).

---

## 4. Métricas Financeiras e Fórmulas Puras
Os cálculos usam uma janela móvel (Timeframe) padrão dos **últimos 7 dias** (Endpoint 6) para evitar viés de manutenções antigas, cruzando-os com as listagens ao vivo (Endpoint 1).

1. **Média Ponderada Real (Preço Justo)**:
   $$ P_{avg} = \frac{\Sigma^{7}_{i = 1} (avgItemPrice_{i} \times itemCnt_{i})}{\Sigma^{7}_{i = 1} itemCnt_{i}} $$
2. **Pressão da Concorrência (Saturação)**:
   $$ CP = \frac{\text{Estoque Ativo Total (End 1)}}{\text{Média Diária Vendida (7 Dias)}} $$

### Status de Mercado (Tags Visuais)
- **🔥 Alta Demanda (Hot Item)**: Estoque Ativo Total < Média Diária (7 dias). O mercado está faminto.
- **⚠️ Saturado**: Pressão da Concorrência (CP) > 1.5 (150%).
- **📈 Volátil**: Diferença entre Mínima e Máxima do mesmo dia supera **30%**.
- **🚨 Quedas Bruscas (Crash Alert)**: O último dia fechado teve queda > **30%** no preço e > **50%** no volume comparado à média dos 3 dias imediatamente anteriores. Indício de despejo de estoque.

### Algoritmos de Precificação Ativa
- **Undercutting Rápido**: O sistema busca o menor preço atual **ignorando lojas com estoque irrisório (< 5% da média diária)** e sugere preço -1 Zeny.
- **Posicionamento Premium**: Se o menor preço for de um "troll" ou estoque minúsculo (< 5%), ignora e empata o preço com o 2º ou 3º vendedor mais barato.
- **Proteção Flipping**: Se o mínimo ativo atual estiver **> 30% menor** que a Média Ponderada Real dos últimos 3 dias, sugere **Compra (Flipping)** ao invés de Venda.

---

## 5. Motor da Watchlist e Estado Assíncrono
- **Mecânica de Espaçamento ($T_{min}$)**: A Watchlist jamais dispara em bloco. O tempo total do ciclo $T$ precisa respeitar $T_{min} = N \text{ (itens)} \times 3 \text{ segundos}$. O espaçamento entre consultas na fila global será sempre igual ou superior a 3s ($S = T / N$).
- **Ciclo de Vida**: O Polling opera enquanto o aplicativo estiver aberto. Quando minimizado, alertas críticos usam **Notificações Nativas do OS** (API Electron `Notification`).
- **Importação em Massa**: Aceita upload de `.txt` puro com 1 nome de item por linha. Enfileira pesquisas no background para resgatar IDs (`itemId`).

---

## 6. Tracker da "Minha Loja" e Desconexão
Usuários cadastram o nome do Personagem no banco SQLite (`character_name`). Ao invés de telas avulsas, o sistema ativa uma flag booleana `isInMyStore: true` num item da Watchlist.
- O App enfileira varreduras com **Prioridade Máxima**.
- Se a loja do usuário perder volume, dispara: *"Você vendeu X unidades!"*.
- Se a loja **sumir do mapa** repentinamente, como a API não distingue, emite alerta Híbrido: *"Alerta ⚠️: Sua loja sumiu do mercado. Você pode ter esgotado o estoque ou tomado Disconnect (DC)."*

---

## 7. Componentes de UX e Diagnóstico
- **Barra de Log Global**: Componente de rodapé atrelado ao `RequestQueueManager`.
  - *Colapsada*: Exibe Ações Humanas e Fila (Ex: "Buscando Detalhes... 4 pendentes") + Spinner. Não assusta o usuário comum.
  - *Expandida*: Developer View (Method, Path longo, e cores semânticas: Verde=OK, Vermelho=Rate Limit/Erro, Amarelo=Na Fila).
- **Lista de Lojas e Lazy Loading (`/navi`)**: 
  - Carrega as lojas ativas instantaneamente sem dados inúteis.
  - Ao expandir uma loja específica (sob demanda via `ssi`), injeta o header `Next-Action` e puxa as coordenadas X/Y.
  - Formata como `/navi {mapName} {x/y}`, copia pro Clipboard do usuário e **cacheia no SQLite atrelado ao ssi**, impedindo requisições repetidas se o usuário clicar várias vezes na mesma loja ativa.
