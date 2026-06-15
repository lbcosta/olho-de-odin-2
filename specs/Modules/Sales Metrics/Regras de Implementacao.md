# Regras de Implementação: Sales Metrics e Estratégias

## 1. Stack Tecnológico
- **Hospedagem**: Funções agnósticas em TypeScript puro (`.ts`), exportáveis tanto para o Processo Node quanto para o React.
- **Sem Dependências**: Módulo puramente matemático, não requer bibliotecas matemáticas pesadas do Node, apenas tipagem estrita de TypeScript para os arrays provenientes do RSC/SQLite.

## 2. Requisitos Não Funcionais (NFRs)
- **Desempenho Algorítmico**: As iterações para cálculo de Média Ponderada Real do histórico de 7 dias e redução (*Reduce*) dos inventários de loja local precisam executar em tempo constante microscópico (`< 10ms`).
- **Resiliência Numérica Absoluta**: O sistema não pode retornar quebras visuais (`NaN` ou `Infinity`) mesmo se a API devolver `itemCnt = 0` ou histórico vazio. Lógicas de divisor seguro (`if divisor === 0`) são obrigatórias na Média Ponderada.

## 3. Regras Críticas de Código
- **Isolamento de Constantes Críticas (Thresholds)**: As regras matemáticas cravadas na Arquitetura — como o gatilho de Undercutting (Ignorar lojas com `< 5%` da Média Diária), Gatilho de Flipping (`-30%`), Gatilho de Despejo de Estoque (`Volume cai 50%`) — devem obrigatoriamente residir em um arquivo de constantes de domínio apartado (ex: `constants/marketThresholds.ts`), impedindo *Magic Numbers* polutivos dentro das lógicas puras.
- **Injeção de Dependência Total**: Os métodos geradores de Estratégias recebem o payload limpo e pre-mastigado em JSON como único argumento e devolvem os objetos de alerta. É bloqueada qualquer inserção de chamada à Rede/I/O no interior das funções matemáticas.
