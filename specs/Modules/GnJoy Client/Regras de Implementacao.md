# Regras de Implementação: GnJoy Client

## 1. Stack Tecnológico
- **Protocolo Base**: `fetch` nativa do Node.js.
- **Hospedagem do Módulo**: *Main Process* do Electron (Isolado de UI para blindar limites).
- **Tipagem**: TypeScript estrito para domar os mapeamentos confusos dos arrays do RSC.

## 2. Requisitos Não Funcionais (NFRs)
- **Resiliência Extrema**: O sistema jamais pode "congelar" a fila global de requisições se os servidores da GnJoy derem "Timeout" (cenário altamente comum no Ragnarok). O *Timeout handler* de rede tem a obrigação de liberar a fila, repassar o erro pro Logger e continuar para a próxima tarefa de forma graciosa.
- **Overhead Limite**: O *Parser* das strings gigantescas do RSC não deve consumir mais que `50ms` de *Event Loop* do Node.js.

## 3. Regras Críticas de Código
- **Singleton Pattern Absoluto**: A classe `RequestQueueManager` é um autêntico *Singleton*. Se houver uma falha de engenharia que resulte na inicialização de duas instâncias da fila simultaneamente, receberemos IP Ban em minutos.
- **JSON Parsing Anti-Regex**: O método para capturar dados deve procurar a linha que inicia com prefixos como `1:` ou `10:`, cortá-la no primeiro dois-pontos `substring(indexOf(':'))` e invocar a API nativa de alta velocidade `JSON.parse()`. Nenhuma RegEx de valor pode ser adotada.
- **Persistência Volátil de Header**: Em todas as ações de extração passivas (Lazy Loading) do cliente, o sistema é forçado a extrair o identificador criptografado na string `Next-Action` que a desenvolvedora manda na primeira página (GET) e anexar essa string exata como Header na requisição subsequente (POST).
