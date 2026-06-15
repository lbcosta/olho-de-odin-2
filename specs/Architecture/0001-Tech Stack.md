# 0001 - Tech Stack e Arquitetura Base

## Plataforma e Distribuição
O aplicativo é um software Desktop construído nativamente utilizando **Electron**. 
Isso permite a entrega de um executável simples de "clique duplo" no Windows, garantindo o "zero-setup" para os jogadores. 

Todo o ecossistema (Main Process e Renderer) é desenvolvido em **JavaScript/TypeScript**, permitindo reaproveitamento de regras de negócio entre UI e controle de fila (Queue Management).
