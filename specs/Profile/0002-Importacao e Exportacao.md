# 0002 - Importação e Exportação (Backup)

## Escopo
Este documento detalha o sistema de portabilidade dos Perfis.

## Funcionalidade de Portabilidade
Como o Olho de Odin 2 é um sistema local (sem servidor em nuvem), a razão principal para o encapsulamento em "Perfis" é garantir a capacidade do usuário de realizar **backups, compartilhamentos e migrações**.

- **Exportação (Backup)**: O usuário pode exportar um Perfil completo. O sistema gerará um arquivo `.json` único contendo o Nome, o Char e a array completa da Watchlist (incluindo todos os seus itens e flags ativas, como a `isInMyStore`).
- **Importação**: O sistema aceita o carregamento desse exato formato `.json` para restaurar instantaneamente um Perfil e sua Watchlist no banco local.
- As duas funcionalidades (Importar e Exportar) são mutuamente dependentes e compõem o mesmo épico de desenvolvimento.
