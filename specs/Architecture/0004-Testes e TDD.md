# Regras Globais: Test-Driven Development (TDD) e Qualidade

## 1. TDD Obrigatório
É uma diretriz inegociável que **todo desenvolvedor e agente de IA** deve seguir rigorosamente o padrão **Test-Driven Development (TDD)** na hora de implementar qualquer módulo ou funcionalidade neste projeto.
O ciclo **Red-Green-Refactor** deve ser a fundação do fluxo de trabalho:
- **RED**: Escreva um teste falho que valide um comportamento do sistema.
- **GREEN**: Escreva o mínimo de código necessário para fazer o teste passar.
- **REFACTOR**: Melhore e refatore o código, garantindo que o teste continua verde.

## 2. Testando Comportamento, não Implementação
Testes devem verificar o **comportamento através de interfaces públicas**, não detalhes internos de implementação (evitando criar testes "frágeis" que quebram com qualquer refatoração interna).
- Bons testes documentam *o que* o sistema faz.
- Testes ruins tentam amarrar o *como* o sistema faz.

## 3. Slices Verticais (Tracer Bullets)
**Jamais utilize "Slices Horizontais"** (escrever todos os testes do módulo de uma vez e depois tentar implementar tudo de uma vez).
- A abordagem correta é o **Slice Vertical**: Escreva 1 (um) teste → Implemente o código daquele teste → Escreva o próximo teste → Implemente o código. O ciclo é unitário e sequencial.

## 4. Modern Web Guidance
A criação de testes de UI e Frontend deve ser alinhada às melhores práticas da web moderna, garantindo resiliência, acessibilidade e performance (Core Web Vitals). Componentes devem ser testados focando na renderização fluida e comportamento acessível (ARIA e roles adequadas).
