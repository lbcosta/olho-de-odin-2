# Registro de Itens
1. Bulk Import: 
    - Recebe itens de um CSV
    - Consulta na API de Mercado (rate limit: 1 req a cada 3s)
    - Se encontrar, registra no banco
    - ideia é usar isso muito raramente, como o primeiro uso do app
2. One Import:
    - mesma coisa pra 1 item
    - ideia é usar isso no dia a dia

# Consultas
1. Item Info Update:
    - Todo item no banco tem um botão de update
    - Isso faz uma nova consulta na API
    - Atualiza a analise sobre o item

2. Item Analysis:
    - Mostra as metricas principais
    - Indica uma estrategia de venda

# WatchList
1. Add/Remove:
    - Adiciona/Remove um item na watchlist
2. Observe:
    - Todos os itens da watchlist serão atualizados (Item Info Update) a cada X minutos
    - Se um critério da estratégia de venda for atingido, o usuário é notificado
3. Status:
    - Alta Demanda (Hot Item): O sistema deve comparar o itemCnt diário do Endpoint 3 (Histórico) com a soma total do itemCnt do Endpoint 1 (Lojas Atuais). Se o histórico mostra 2.000 itens listados por dia, mas hoje só há 200 nas lojas atuais, o mercado está faminto. É o momento de vender.
    - Volatilidade (Unstable Market): Itens onde o minItemPrice e o maxItemPrice do Endpoint 3 variam drasticamente no mesmo dia indicam um mercado instável. Itens com pouca variação entre mínima e máxima são "dinheiro certo", ideais para compor o fluxo de caixa constante.
    - Concorrência Alta (Saturated Market): O sistema deve calcular a soma total do itemCnt do Endpoint 1 (Lojas Atuais). Se esse valor for maior que a média diária do itemCnt do Endpoint 3 (Histórico), o mercado está saturado. É melhor esperar ou buscar uma estratégia diferente.
    - Quedas Brucas: Olhando o JSON que você enviou, no dia 04/06 havia 2.777 morangos no mercado, com preço médio alto. No dia 09/06, o estoque caiu para 47 e o preço desabou para 300. Isso é um alerta vermelho de despejo de estoque ou manipulação. O dashboard deve sinalizar quedas bruscas de preço acompanhadas de queda de volume.
4. Estratégias Indicadas:
    - Undercutting: Se o objetivo é vender em minutos, o sistema deve olhar o Endpoint 1, encontrar o menor itemPrice entre as lojas com um estoque considerável (ignorar quem tem apenas 1 unidade a preço de banana), e sugerir o preço 1 Zeny mais barato.
    - Posicionamento Premium (Maior Margem): Se o Endpoint 1 mostra que o concorrente mais barato tem apenas 50 unidades (baixo itemCnt), e a média diária de vendas (Endpoint 3) costuma ser de 1.000 unidades, você não precisa cobrir o preço dele. Você pode precificar no valor do segundo ou terceiro concorrente mais barato. O concorrente esgotará rápido, e a sua loja será a próxima da fila.
    - Segurança contra "Trolls" de Mercado: Se o preço mínimo atual (Endpoint 1) estiver mais de 30% abaixo do avgItemPrice dos últimos 3 dias (Endpoint 3), o dashboard deve recomendar não vender agora ou, melhor ainda, comprar o estoque desse concorrente para revender mais caro (Flipping).
5. Métricas observadas:
| Métrica | Cálculo | O que indica |
| ------- | ------- | ------------ |
| Média Ponderada Real | Calcula-se dando peso ao volume. | Revela o preço real que o mercado aceita pagar, ignorando distorções de preços extremos. |
| Spread Atual | Maior itemPrice (End 1) - Menor itemPrice (End 1). | Margem de oportunidade. Spreads grandes indicam que é possível comprar barato e vender caro. |
| Pressão da Concorrência | Total itemCnt (End 1) / Média itemCnt dos últimos 7 dias (End 3). | Se o resultado for maior que 1, o mercado está saturado hoje (melhor segurar o item). |
| Piso de Lucratividade | Compara o itemPrice sugerido com o custo de farm/compra. | Garante que o jogador não tome prejuízo ao entrar em guerras de preços. |

Sendo a Média Ponderada Real:

$$ P_{avg} = \frac{\Sigma^{n}_{i = 1} (avgItemPrice_{i} \times itemCnt_{i})}{\Sigma^{n}_{i = 1} itemCnt_{i}} $$

Onde $i$ representa cada dia retornado na lista priceDetailDayList.

# Outras features (e seus dados necessários)

- databaseImgPath -> mostrar quando possivel a imagem do item no dashboard
- databaseType -> mostrar o tipo do item
- mapName + posX e posY -> ter um botão para copiar o "/navi {map} x/y" fácil

# Outras features satelitais, mas importantes

- O sistema deve rodar totalmente local: Os inputs devem ser escritos ou importados via CSV;
- Sistema de Profile: Quando entrar, você cria um Profile. Esse profile vai ter todos dados registrados e será possivel fazer um dump/export desses dados para um arquivo JSON que pode ser importado em outra máquina, ou restaurado em caso de perda dos dados. Isso faz parte da estrategia de "local first"
- Toda consulta à API deve gerar um "cache" que ficará intacto até que haja outra consulta. Isso serve para não ficar batendo na api sem necessidade e respeitar o rate limit, além de permitir o funcionamento off-line (local first). Por isso todos os itens deve ter um status de "updated at" e "created at" no banco de dados, para informar o usuário sobre quando os dados foram atualizados pela última vez.
- O sistema deve usar um banco de dados local para armazenar os dados, por exemplo: SQLIte;

