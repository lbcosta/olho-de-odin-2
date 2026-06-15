# Plano de Testes: Barra de Request Log Global

> **Nota**: Este módulo deve ser desenvolvido utilizando TDD obrigatório (Red-Green-Refactor) focando no comportamento através de interfaces públicas. Slices Verticais.

## 1. Testes Unitários

### 1.1 Dicionário de Tradução de UX
- **Input**: Strings de caminhos técnicos (`/shop-search/trading?itemId=123`).
- **Processo**: Função de mapeamento do React.
- **Output**: String humanizada: "Verificando concorrência...".
- **Verificação**: O dicionário cobre perfeitamente as rotas técnicas e substitui sem falhas.

### 1.2 Código de Cores Condicional
- **Input**: Objetos com status Code `200`, `429`, e `pendente`.
- **Processo**: Componente do React aplica Tailwind classes baseado nos props.
- **Output**: A classe gerada será respectivamente `bg-green-500`, `bg-red-500` e `bg-gray-400`.
- **Verificação**: Garantir a formatação CSS condicional nos elementos do DOM via test-renderer.

## 2. Testes de Integração UI (Componentes)

### 2.1 OOM Prevention Limit (`slice(-50)`)
- **Input**: O IPC emite repetidamente 55 eventos de log numa rajada.
- **Processo**: O State do React é atualizado somando os antigos com os novos.
- **Output**: O tamanho máximo da Array armazenada será estritamente `50`.
- **Verificação**: Ao fim dos 55 dispatches, o length da UI é 50 e o DOM não poluiu para além da marca, impedindo Leak de memória.

### 2.2 Suspensão de DOM (Inibidor de Spin)
- **Input**: Sinal IPC de minimização do Aplicativo (Tray).
- **Processo**: Componente React detecta minimizado e encerra animações CSS.
- **Output**: Elementos HTML suspendem animações.
- **Verificação**: `isAnimating` deve dar falso, preservando a renderização na placa de vídeo do SO.
