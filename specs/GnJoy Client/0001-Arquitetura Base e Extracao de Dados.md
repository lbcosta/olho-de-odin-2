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
2. No corpo da resposta RSC, ele isola as linhas pelo seu prefixo numérico (ex: `10:` para resultados). O parser **deleta o prefixo** (tudo até o primeiro dois-pontos) e executa um `JSON.parse` nativo no restante da linha. **É expressamente proibido usar Regex** para extrair chaves, pois caracteres de lojas (vírgulas, aspas) quebram a lógica.
3. O Client persiste a chave de Server Action `Next-Action` extraída do JSON e a injeta nas consultas subsequentes de detalhamento (Lazy Loading).
