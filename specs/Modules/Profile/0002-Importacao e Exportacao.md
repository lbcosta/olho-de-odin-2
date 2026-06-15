# 0002 - Importação e Exportação (Backup)

## Escopo
Este documento detalha o sistema de portabilidade dos Perfis.

## Funcionalidade de Portabilidade
Como o Olho de Odin 2 é um sistema local (sem servidor em nuvem), a razão principal para o encapsulamento em "Perfis" é garantir a capacidade do usuário de realizar **backups, compartilhamentos e migrações**.

- **Exportação (Backup)**: O usuário pode exportar um Perfil completo. O sistema fará a varredura no banco SQLite, filtrará todos os registros contendo a Foreign Key do perfil (`profile_id`), e serializará esses dados brutos em um arquivo `.json` único, incluindo o Nome, o Char e a Watchlist inteira.
- **Importação**: O sistema aceita o carregamento desse exato formato `.json` para restaurar instantaneamente um Perfil e sua Watchlist no banco local.
- As duas funcionalidades (Importar e Exportar) são mutuamente dependentes e compõem o mesmo épico de desenvolvimento.
