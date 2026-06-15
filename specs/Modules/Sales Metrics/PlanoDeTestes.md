# Plano de Testes: Sales Metrics e Estratégias

> **Nota**: Este módulo deve ser desenvolvido utilizando TDD obrigatório (Red-Green-Refactor) focando no comportamento através de interfaces públicas. Slices Verticais. Este módulo é livre de dependências, puramente matemático.

## 1. Testes Unitários (Cálculo Puro)

### 1.1 Resiliência Divisor e NaN
- **Input**: Payload JSON limpo da GnJoy mas com o parâmetro `itemCnt = 0` (Ninguém vendendo nem vendou).
- **Processo**: Tentativa de calcular a Média Ponderada Real.
- **Output**: Deve retornar fallback numérico `0` (Zero).
- **Verificação**: Sob hipótese nenhuma a função pode retornar `NaN` ou `Infinity`. Se divisor `0`, o fallback deve agir.

### 1.2 Desempenho Algorítmico do Reduce
- **Input**: Um mock pesado contendo 2.000 itens diários de log da GnJoy.
- **Processo**: Reduce Array + Média Ponderada.
- **Output**: O cálculo e a devolutiva de estratégias de mercado.
- **Verificação**: O tempo total da função síncrona não pode ultrapassar `< 10ms`.

## 2. Testes de Limiares (Thresholds) e Estratégia

### 2.1 Undercutting Trigger
- **Input**: Item de mercado com preço atual estando `6%` mais barato que a Média Diária (Threshold > 5%).
- **Processo**: Módulo de IA da estratégia é invocado sobre o payload.
- **Output**: Retorno da flag de Trigger Positiva para *Undercutting Alert*.
- **Verificação**: A condição respeitou isolamento, buscando a constante `5%` do arquivo apartada e devolvendo o objeto formatado.

### 2.2 Flipping (Flip Market) Trigger
- **Input**: Item custando `35%` a menos que a média histórica.
- **Processo**: Módulo checa as condições do threshold local (`30%`).
- **Output**: A flag Positiva de Flipping sobe para disparar alerta.
- **Verificação**: O teste prova que grandes diferenças emitem estratégias distintas.
