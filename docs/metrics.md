# Métricas

## Liquidez

O sistema deve comparar o itemCnt diário do Endpoint 3 (Histórico) com a soma total do itemCnt do Endpoint 1 (Lojas Atuais). Se o histórico mostra 2.000 itens listados por dia, mas hoje só há 200 nas lojas atuais, o mercado está faminto. É o momento de vender.

## Volatilidade

Itens onde o minItemPrice e o maxItemPrice do Endpoint 3 variam drasticamente no mesmo dia indicam um mercado instável. Itens com pouca variação entre mínima e máxima são "dinheiro certo", ideais para compor o fluxo de caixa constante.

## Oferta

Olhando o JSON que você enviou, no dia 04/06 havia 2.777 morangos no mercado, com preço médio alto. No dia 09/06, o estoque caiu para 47 e o preço desabou para 300. Isso é um alerta vermelho de despejo de estoque ou manipulação. O dashboard deve sinalizar quedas bruscas de preço acompanhadas de queda de volume.

| Métrica | Cálculo | O que indica |
| ------- | ------- | ------------ |
| Média Ponderada Real | Calcula-se dando peso ao volume. | Revela o preço real que o mercado aceita pagar, ignorando distorções de preços extremos. |
| Spread Atual | Maior itemPrice (End 1) - Menor itemPrice (End 1). | Margem de oportunidade. Spreads grandes indicam que é possível comprar barato e vender caro. |
| Pressão da Concorrência | Total itemCnt (End 1) / Média itemCnt dos últimos 7 dias (End 3). | Se o resultado for maior que 1, o mercado está saturado hoje (melhor segurar o item). |

Sendo a Média Ponderada Real:

$$ P_{avg} = \frac{\Sigma^{n}_{i = 1} (avgItemPrice_{i} \times itemCnt_{i})}{\Sigma^{n}_{i = 1} itemCnt_{i}} $$

Onde $i$ representa cada dia retornado na lista priceDetailDayList.

# Estratégias

## Undercutting

Se o objetivo é vender em minutos, o sistema deve olhar o Endpoint 1, encontrar o menor itemPrice entre as lojas com um estoque considerável (ignorar quem tem apenas 1 unidade a preço de banana), e sugerir o preço 1 Zeny mais barato.

## Posicionamento Premium (Maior Margem)

Se o Endpoint 1 mostra que o concorrente mais barato tem apenas 50 unidades (baixo itemCnt), e a média diária de vendas (Endpoint 3) costuma ser de 1.000 unidades, o seu sobrinho não precisa cobrir o preço dele. Ele pode precificar no valor do segundo ou terceiro concorrente mais barato. O concorrente esgotará rápido, e a loja do seu sobrinho será a próxima da fila.

## Segurança contra "Trolls" de Mercado

Se o preço mínimo atual (Endpoint 1) estiver mais de 30% abaixo do avgItemPrice dos últimos 3 dias (Endpoint 3), o dashboard deve recomendar não vender agora ou, melhor ainda, comprar o estoque desse concorrente para revender mais caro (Flipping).