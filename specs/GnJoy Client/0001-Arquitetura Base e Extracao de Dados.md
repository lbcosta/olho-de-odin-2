# 0001 - Arquitetura Base e Extração de Dados (GnJoy)

## Visão Geral da Arquitetura
A API oficial (`ro.gnjoylatam.com`) é baseada no framework **Next.js usando React Server Components (RSC) e Server Actions**.
A extração de dados dispensa o uso de emuladores pesados (Headless Browsers como Puppeteer) e foca em **requisições HTTP puras** configuradas estrategicamente.

## Padrões de Requisição

### Cabeçalhos (Headers) de Emulação
Para receber o JSON embutido na árvore RSC (ao invés de pesados arquivos HTML em branco):
- **Nas chamadas GET**, o Client deve enviar invariavelmente: `RSC: 1`
- **Nas chamadas POST** (Server Actions), o Client deve enviar obrigatoriamente: 
  - `Content-Type: application/json`
  - `Next-Action: <hash_da_acao>`

### A Extração Dinâmica do `Next-Action`
O hash necessário para as requisições POST é um identificador que muda a cada atualização do site da desenvolvedora. 
Para resolver esse problema:
1. O Client realiza o **GET inicial** de busca.
2. No corpo da resposta RSC, ele busca e extrai os identificadores de Server Action presentes (Hashes alfanuméricos ou IDs curtos associados aos callbacks de UI).
3. O Client persiste essa chave temporariamente na sessão e a injeta como o valor do header `Next-Action` nas consultas subsequentes de detalhamento (Lazy Loading).
