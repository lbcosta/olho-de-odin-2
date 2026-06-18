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
O hash necessário para as requisições POST é um identificador que muda a cada
atualização (deploy) do site da desenvolvedora.

**Correção (confirmada por captura ao vivo da API — Rodada 3 de bugfix):** a
suposição original de que o hash viria embutido no corpo RSC do GET (como um
hex de 40 caracteres) estava **errada** — o corpo do GET não contém o hash em
nenhum formato. O mecanismo real:
1. O Client realiza o **GET inicial** de busca. No corpo da resposta RSC, ele
   localiza (sem Regex — só `indexOf`) os caminhos de chunk JS referenciados
   pela página (`static/chunks/*.js`).
2. O Client busca cada chunk até encontrar a chamada
   `createServerReference("<id>", ...)` — o ID embutido ali é o hash real. Seu
   comprimento **não é fixo** (varia por build/ação; não assumir 40 chars).
3. Há **uma única Server Action compartilhada** entre as ações de Lazy Load
   (loja/item/histórico de preço) — o despacho interno é feito pelo campo
   `type` do payload, não por rota/página. O mesmo hash funciona em qualquer
   página que referencie o chunk.
4. O Client cacheia o hash (estável até o próximo deploy) e o injeta no header
   `Next-Action` de toda requisição POST subsequente.
