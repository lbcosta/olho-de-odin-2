# 0003 - Lista de Lojas Ativas e Comportamento de Carregamento

## Escopo
Define a área central da Tela de Detalhes do Item, onde são listadas as lojas vendendo o item no momento atual da consulta.

## Exibição da Lista
- **Lojas Ativas**: A lista exibirá *exclusivamente* Lojas Ativas, não se misturando com o histórico de vendas passado.
- **Ordenação**: O usuário terá a opção de ordenação da lista, priorizando Menor Preço ou Maior Preço.

## Design dos Cards (Lazy Loading)
Para contornar os limites estritos de requisição da API GnJoy (Rate Limit de 1 requisição a cada 3s) de forma elegante e evitar congelamentos:

1. **Visão Primária (Carregamento Imediato)**:
   Os cards de Lojas Ativas exibirão de imediato apenas os dados já presentes na resposta da busca inicial:
   - Nome da loja
   - Nome do vendedor
   - Preço do item
   - Quantidade disponível

2. **Visão Expandida (Sob Demanda)**:
   Informações detalhadas obtidas apenas via requisições secundárias (usando o `ssi`) devem ser **carregadas sob demanda** unicamente quando o usuário clicar ou expandir o card de uma loja específica. São elas:
   - Slots
   - Refinos
   - Localização Exata
   - Ação de cópia: Botão "click to copy" (que formata a localização e a copia para a área de transferência do usuário no formato prático `/navi map_name x/y`).
