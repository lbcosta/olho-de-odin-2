# Interface e Gatilho da Busca

## Descrição
Define como a interface de busca se comporta ao receber interações do usuário e como o gatilho da pesquisa na API externa é controlado para respeitar os limites de rate limit.

## Fluxo da Interface
1. Ao clicar na [Barra de Pesquisa], uma tela de sugestões/resultados vazia é exibida.
2. A [Barra de Pesquisa] deve conter um indicador visual (placeholder ou texto auxiliar) instruindo o usuário a pressionar Enter para realizar a busca.
3. Na [Barra de Pesquisa], o usuário digita o termo desejado para pesquisar.

## Gatilho de Pesquisa (Rate Limit)
4. A pesquisa na API externa ([Busca no Comércio Atual/Busca de Item]) é disparada apenas quando o usuário pressiona Enter ou clica no botão de busca (ícone de lupa).
5. Enquanto carrega, um spinner de carregamento aparece no lado direito da barra de pesquisa e a barra fica temporariamente desabilitada para evitar cliques repetidos rápidos que violariam o limite de tempo da fila (`RequestQueueManager`).
