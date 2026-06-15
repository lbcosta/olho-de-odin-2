# 0001 - Layout Global e Integração (Barra de Log)

## Escopo
Este documento define o posicionamento e a fonte de dados do componente de Log da aplicação.

## Layout Base
A Barra de Log deve ser discreta e implementada como um **Componente Global e Persistente** no rodapé principal da aplicação. 
Diferente de componentes atrelados a rotas específicas, ela estará visível para o usuário independentemente da tela que ele esteja navegando (Busca, Detalhes de Item ou Watchlist).

## Fonte de Dados
A barra atua como a "janela visual" central do módulo `RequestQueueManager`. 
Toda e qualquer requisição HTTP agendada ou disparada pelo *GnJoy Client* deve ser interceptada e registrada por este componente, criando um histórico contínuo da comunicação com os servidores do Ragnarok LATAM.
