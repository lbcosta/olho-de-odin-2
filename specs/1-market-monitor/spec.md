# Specification: Market Monitor (Olho de Odin 2)

## 1. Overview
O Olho de Odin 2 é um assistente de mercado "local-first" para jogadores de Ragnarok Online. Ele monitora de forma passiva os itens de interesse do usuário no mercado do jogo (Watchlist) e fornece indicadores matemáticos e estratégias de venda recomendadas para maximizar os lucros, além de alertar sobre vendas ou desconexões da própria loja do jogador.

## 2. Problem Statement (Why are we building this?)
A economia do Ragnarok Online é altamente dinâmica e movida por jogadores. Atualmente, para precificar um item, os jogadores precisam analisar manualmente as lojas ativas, sem acesso fácil ao volume histórico e à volatilidade dos preços. 
Isso gera três problemas principais:
1. **Prejuízos e Vendas Estagnadas:** Vender barato demais resulta em perda de dinheiro; vender caro demais resulta em itens parados no inventário.
2. **Manipulação de Mercado (Trolls):** Alguns jogadores derrubam artificialmente o preço mínimo de um item com pouco estoque para forçar outros a venderem barato (e então eles compram para revender).
3. **Falta de Alertas em Tempo Real:** Jogadores deixam suas lojas abertas e não sabem quando o item foi vendido ou se o jogo os desconectou, perdendo tempo valioso de venda.

## 3. Target Audience
- Jogadores de Ragnarok Online (servidor oficial coberto pela API) que atuam como mercadores e buscam maximizar o lucro de seus farms e revendas.

## 4. User Scenarios
1. **Configuração Inicial:** O usuário abre o aplicativo, cria um "Profile" (informando o nome de seu personagem) e adiciona os itens que deseja acompanhar em sua Watchlist (um a um ou via importação em massa).
2. **Análise de Estratégia de Venda:** O usuário visualiza o painel do item na Watchlist. Ele vê se o mercado está "Saturado" ou com "Alta Demanda", e confere a estratégia sugerida pelo app (ex: "Undercutting" para vender rápido, ou "Posicionamento Premium" se o concorrente mais barato tiver pouco estoque).
3. **Monitoramento da Própria Loja:** O usuário marca um item na Watchlist como "Está na minha loja agora". O aplicativo monitora silenciosamente em segundo plano e exibe uma notificação no sistema operacional caso as unidades vendam ou caso a loja suma repentinamente (indicando venda total ou desconexão).
4. **Localização de Loja:** O usuário decide comprar um item de um concorrente (estratégia de "Flipping") e clica no botão "Copiar /navi". O aplicativo copia a coordenada exata para a área de transferência para que ele encontre o vendedor instantaneamente dentro do jogo.

## 5. Functional Requirements
1. **Profile Management:** O sistema deve permitir a criação de Profiles (com nome e nome do personagem) e a importação/exportação desses dados para garantir a posse local da informação.
2. **Watchlist Engine:** O sistema deve monitorar uma lista de itens em segundo plano, respeitando um limite de taxa (rate limit) de não mais que uma requisição a cada 3 segundos, distribuindo as atualizações ao longo do tempo.
3. **Métricas de Mercado:** O sistema deve calcular indicadores matemáticos reais, incluindo "Média Ponderada Real", "Spread Atual" e "Pressão da Concorrência", além de classificar o status do item (Alta Demanda, Volátil, Saturado, Queda Brusca).
4. **Estratégias de Venda Reativas:** O sistema deve sugerir automaticamente uma estratégia de preço com base na análise do estoque do concorrente mais barato versus a média histórica de volume.
5. **Notificações do Sistema:** O sistema deve disparar alertas nativos do sistema operacional quando um critério de estratégia for alcançado ou quando o estoque da loja do próprio usuário (venda parcial/venda total/DC) mudar.

## 6. Non-Functional Requirements & Constraints
- **Local-First:** Todo o armazenamento deve ser mantido na máquina do usuário (banco de dados em arquivo local) e o monitoramento só deve acontecer enquanto a aplicação estiver aberta.
- **Respeito à API:** Nenhuma rotina deve realizar scraping abusivo. O tráfego de dados para a fonte externa deve ser coordenado por uma fila de prioridade para evitar banimentos de IP.
- **Tolerância a Dados Malformados:** A aplicação deve lidar com caracteres especiais de forma robusta e nunca travar ao tentar ler dados irregulares da API.

## 7. Success Criteria
- **Desempenho da Watchlist:** O aplicativo é capaz de monitorar ativamente 50 itens sem violar o limite de tempo estrito (1 requisição a cada 3 segundos).
- **Usabilidade:** O jogador é notificado da venda de um item de sua loja ou de uma desconexão num intervalo de tempo não superior ao tempo do ciclo completo de atualização da Watchlist.
- **Independência:** O aplicativo é capaz de ser totalmente reinstalado e recuperar todas as configurações perfeitamente a partir de um arquivo JSON exportado previamente.
