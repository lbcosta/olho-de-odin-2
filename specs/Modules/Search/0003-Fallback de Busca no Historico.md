# Fallback de Busca no Histórico

## Descrição
Define a estratégia de fallback automático quando o item pesquisado não possuir nenhuma oferta ativa no comércio atual.

## Comportamento de Fallback
1. Caso a pesquisa inicial no comércio atual retorne vazia (nenhuma loja vendendo o item no momento), o sistema realiza automaticamente uma nova requisição usando o endpoint de histórico de vendas ([Busca no Histórico]).
2. Se o item for encontrado no histórico:
   - O item é exibido na lista de sugestões com a observação "(Sem lojas ativas no momento)" ao lado do nome.
   - Ao ser selecionado, abre-se a [Tela de Item] com o histórico de preços e o aviso destacado de falta de ofertas ativas no momento.
3. Caso o item também não seja encontrado no histórico de vendas, a tela de sugestões exibe a mensagem "Item não encontrado".
