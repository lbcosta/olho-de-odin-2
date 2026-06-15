# 0001 - Gerenciamento de Perfis

## Escopo
Este documento define as regras de negócio para a criação e manutenção de múltiplos perfis de usuários locais.

## Dados do Perfil
O Olho de Odin 2 opera exclusivamente através de um sistema de Perfis persistidos em um banco de dados local. 
A troca de perfis permite que jogadores com múltiplas contas gerenciem diferentes nichos de mercado de forma isolada.

O esquema básico de um Perfil contém:
- **ID Interno**
- **Nome do Perfil** (Obrigatório)
- **Nome do Personagem / Char** (Opcional): Usado exclusivamente como chave de busca para o recurso "Minha Loja".
- **Watchlist Exclusiva**: Uma lista isolada de itens em monitoramento atrelada especificamente a este perfil.
