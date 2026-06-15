# 0003 - Ações do Card e Estado Assíncrono

## Escopo
Este documento detalha as interações do usuário com os cards individuais e a representação visual do gerenciamento da fila de requisições.

## Ações do Usuário (Botões no Card)
Cada card possui dois botões de controle independentes do Master Switch global:
1. **Botão de Excluir da Watchlist**: Remove o item completamente do banco de dados/perfil atual.
2. **Botão de Pausar Monitoramento Automático (Ícone de Olhinho)**: Cessa imediatamente as requisições automáticas em background para este item em específico, mas o mantém inativo e visível na tela para reativação futura.

## Estado Visual Assíncrono (Tratamento de Rate Limit)
Para respeitar o restrito Rate Limit da API oficial (1 requisição a cada 3 segundos) de forma elegante e não bloquear a interface:
- **Processamento Orgânico**: Os cards atualizam de forma assíncrona, um a um.
- **Feedback Visual**: O card deve indicar explicitamente o seu estado na fila de processamento da aplicação, exibindo "Na Fila" ou "Atualizando..." temporariamente em sua UI. Isso reflete a lentidão natural induzida pelas restrições de rede.
