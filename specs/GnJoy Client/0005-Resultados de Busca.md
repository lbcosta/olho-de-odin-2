# 0001 - Resultados de Busca (API GnJoy)

## 1. Visão Geral
Este documento detalha os resultados da análise dos endpoints listados na documentação oficial (`docs/com.gnjoylatam.ro.md`) após testes utilizando chamadas diretas com Node.js e emulação no navegador via Playwright simulando o Chrome DevTools.

A principal observação técnica é que **os endpoints não formam uma API REST/JSON tradicional**. Eles foram construídos em **Next.js utilizando React Server Components (RSC) e Server Actions**. Isso significa que as requisições dependem do estado do framework no front-end (headers como `RSC: 1` e `Next-Router-State-Tree`) para retornar o JSON puro em vez de HTML.

## 2. Análise dos Endpoints

### 2.1. Busca de Item (Trading - GET)
- **URL**: `https://ro.gnjoylatam.com/pt/intro/shop-search/trading?storeType=BUY&serverType=NIDHOGG&searchWord=elixir+vermelho`
- **Método**: `GET`
- **Formato Real**: O endpoint retorna **HTML completo** com o estado inicial da busca (em formato RSC) embutido em tags `<script>`. No entanto, como demonstrado em nossos testes diretos, caso a requisição GET possua o header HTTP especial `RSC: 1` (simulando um carregamento assíncrono do Next.js), o servidor devolve **exatamente a string de dados puros RSC**, sem o HTML em volta.
- **Observações**: O formato do conteúdo bate perfeitamente com a documentação do projeto (`1:"$Sreact.fragment"`, etc). O parser deverá focar na linha de retorno onde os resultados residem (geralmente linhas iniciando com índices maiores, por exemplo, linha 10).

### 2.2. Informações da Loja e Informações do Item (Trading - POST)
- **URL**: `https://ro.gnjoylatam.com/pt/intro/shop-search/trading`
- **Método**: `POST`
- **Formato Real**: Estes endpoints são **Server Actions** do Next.js. O envio do payload documentado `[{"type":"store","params":...}]` só funciona se o client enviar o identificador exato da ação através do header `Next-Action` (que costuma ser um hash numérico ou ID curto, e que pode mudar a cada deploy da distribuidora).
- **Conteúdo**: O retorno é formatado em múltiplas linhas JSON RSC.
- **Observações**: A documentação fornecida em `docs/com.gnjoylatam.ro.md` é **totalmente precisa** a respeito do conteúdo, mas falta salientar a exigência do header `Next-Action`. Sem esse cabeçalho, requisições POST diretas a essas URLs retornam ignoradas com um arquivo HTML.

### 2.3. Busca no Histórico (Market-Price - GET)
- **URL**: `https://ro.gnjoylatam.com/pt/intro/shop-search/market-price?serverType=NIDHOGG&period=ALL&searchWord=elixir+vermelho`
- **Método**: `GET`
- **Formato Real**: Funciona de forma idêntica ao Trading GET. Retorna HTML, mas sob o header `RSC: 1` devolve o JSON RSC puro com os dados pré-carregados.
- **Conteúdo**: Traz uma única lista com os dados agregados (`totalItemCnt`, `minItemPrice`, `maxItemPrice`, `avgItemPrice`).
- **Observações**: O conteúdo analisado condiz totalmente com os exemplos na documentação.

### 2.4. Histórico de Preço do Item em Loja (Market-Price - POST)
- **URL**: `https://ro.gnjoylatam.com/pt/intro/shop-search/market-price`
- **Método**: `POST`
- **Formato Real**: Uma Server Action chamada quando o usuário deseja visualizar os gráficos de preço detalhados (`priceDetailChartList` e `priceDetailDayList`). 
- **Observações**: O formato RSC multi-linha de retorno é rigorosamente aquele documentado pelo projeto.

## 3. Conclusão e Viabilidade
A documentação atual `docs/com.gnjoylatam.ro.md` relata fielmente o conteúdo de requisição e resposta de todos os fluxos. A arquitetura de extração de dados linha a linha (já prevista no Olho de Odin 2) é extremamente adequada.

**Ponto de Atenção para a Implementação do Client:**
Para as requisições GET (buscas primárias), basta enviar os requests HTTP contendo os headers adequados (como `RSC: 1`) para evitar download de marcação HTML inútil. Já para as chamadas POST (que são Server Actions), o cliente *talvez* precise fazer o scrapping da página principal para pegar dinamicamente o Hash da Ação ou emular o fetch nativo, visto que esse identificador tende a ser rotativo (gerado a cada build do front-end da publisher).
