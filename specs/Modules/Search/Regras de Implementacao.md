# Regras de Implementação: Interface de Busca e Importação

## 1. Stack Tecnológico
- **UI & Reatividade**: Componentes Funcionais do React.
- **Componentes Base**: TailwindCSS. Construção de Inputs limpos seguindo identidade comum.
- **Debounce**: Implementação rígida de *Debounce* local ou hook (`useDebounce`) para controlar os gatilhos do usuário.

## 2. Requisitos Não Funcionais (NFRs)
- **Defesa Contra Spamming (Double-Click)**: A barra de busca e o envio dos arquivos `.txt` (Bulk Import) terão bloqueadores reativos ativos com timer (delay `300ms-500ms`), congelando via `disabled` os inputs assim que a tecla de submissão descer, para evitar disparo não-intencional múltiplo à camada Node IPC.
- **Feedback Humanizado de Rede**: O tratamento de retorno para caso do jogador digitar erroneamente o nome de um item não pode "vazar" código técnico ou erros 404 em strings. Deverá subir *Toasts* contendo UX limpa: *"Item não encontrado na GnJoy"*.

## 3. Regras Críticas de Código
- **Controle de Memória no Upload (`.txt`)**: A feature de *Importação em Massa* lê o input de arquivo via Web API de FileReader padrão no React. Após o parse (`\n`), o código obrigatoriamente aplica uma rotina de higienização de string (`trim()`) eliminando quebras falsas, linhas brancas ou items corrompidos, antes de empacotar o payload seguro para enviar em *batch* à Fila de Rede principal através de IPC.
- **Rastreio de Hash e Cache**: Esta feature age como ponta-de-lança da camada Arquitetural. Todo submit primário que retornar o histórico do item dispara instantaneamente o comando que manda o Singleton *Node* gravar os dados no SQLite e separar o hash do `Next-Action` para acesso reativo dos módulos secundários.
