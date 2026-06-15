# 0001 - Layout Geral e Componentes da Watchlist

## Escopo
Este documento detalha o esqueleto e os componentes macro da tela de Dashboard da Watchlist.

## Estrutura da Tela
Ao entrar na tela de Dashboard, o usuário visualizará as seguintes regiões principais:

1. **Cabeçalho (Top Bar)**:
   - **Lado Superior Direito**: Exibição do Perfil ativo no momento. Ao clicar no Profile, o usuário será redirecionado para a tela de gerenciamento de Profile.
   - **Controle Global**: Um botão *Master Switch* para ligar ou desligar o ciclo de monitoramento em background de *toda* a Watchlist simultaneamente.

2. **Área Central**:
   - Uma lista de cards correspondentes aos itens que estão sendo observados no momento pelo usuário.
   - Ao clicar na área central de um card (excluindo os botões de ação), o usuário é redirecionado para a [Tela de Item] com os detalhes daquele item específico.

3. **Rodapé (Bottom Bar)**:
   - Um componente colapsado do **Log de Requisições** do sistema.
