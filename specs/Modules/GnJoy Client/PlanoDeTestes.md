# Plano de Testes: GnJoy Client

> **Nota**: Este módulo deve ser desenvolvido utilizando TDD obrigatório (Red-Green-Refactor) focando no comportamento através de interfaces públicas. Slices Verticais.

## 1. Testes Unitários

### 1.1 JSON Parsing Anti-Regex
- **Input**: String bruta vinda do RSC contendo a linha iniciada em `1:` ou `10:`.
- **Processo**: A função deve buscar a substring a partir do primeiro `:` e aplicar o `JSON.parse()`.
- **Output**: Retorno do objeto JSON serializado limpo.
- **Verificação**: Garantir que o parser executa em menos de 5ms e não levanta exceção com formatação não padronizada antes dos `:`.

## 2. Testes de Integração

### 2.1 Singleton Queue Rate Limit
- **Input**: 5 chamadas simultâneas de fetch ao endpoint da GnJoy.
- **Processo**: O `RequestQueueManager` deve interceptar e aplicar a regra de 3000ms.
- **Output**: As resoluções (`Promises`) devem ser concluídas nos tempos: `0s`, `3s`, `6s`, `9s`, `12s`.
- **Verificação**: Nenhuma requisição concorrente no servidor externo e integridade absoluta do intervalo.

### 2.2 Timeout Handling e Resiliência
- **Input**: Endpoint GnJoy configurado em um mock para dar timeout (exceder 5000ms).
- **Processo**: Fetch emite erro de rede/timeout. O *Timeout handler* age.
- **Output**: A Fila libera o próximo item graciosamente, reporta o erro ao Logger via IPC.
- **Verificação**: A Queue não "congela" e itens subsequentes continuam a ser processados.

### 2.3 Headless Persistence (Next-Action Header)
- **Input**: Primeira requisição GET devolve header mockado com chave e valor específicos.
- **Processo**: O cliente deve guardar isso de forma volátil e anexá-lo automaticamente na requisição POST subsequente.
- **Output**: A segunda requisição carrega explicitamente o Header idêntico.
- **Verificação**: O request gerado contém exatamente a string extraída.
