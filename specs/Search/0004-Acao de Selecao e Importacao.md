# Ação de Seleção e Importação

## Descrição
Define as ações que ocorrem quando o usuário seleciona um item da lista de sugestões, incluindo o cadastro automático no banco de dados SQLite local e o comportamento da Watchlist.

## Cadastro Automático (One Import)
1. Ao clicar em um item da lista de sugestões, se o item correspondente ao `itemId` selecionado ainda não estiver cadastrado no banco de dados local (`olhodeodin.db` -> tabela `items`), o sistema deve realizar o cadastro automático do item no SQLite antes de abrir a tela de detalhes.
2. O sistema deve inicializar o cache de dados do item (`api_cache`) com a resposta da API obtida na pesquisa.

## Comportamento da Watchlist
3. A abertura da [Tela de Item] ou a importação automática do item **não** adiciona o item à [Watchlist].
4. A inclusão do item na [Watchlist] (para monitoramento periódico em segundo plano) deve ser ativada manualmente pelo usuário por meio de um controle dedicado (botão ou toggle) na própria [Tela de Item].
