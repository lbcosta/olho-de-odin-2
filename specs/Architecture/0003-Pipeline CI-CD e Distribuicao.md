# 0003 - Pipeline de CI/CD e Distribuição

## Escopo
Este documento detalha o fluxo de entrega contínua e distribuição do instalador final do Olho de Odin 2 aos jogadores, utilizando as ferramentas nativas de Actions.

## Fluxo do GitHub Actions
O Olho de Odin 2 não é um projeto que exige complicação local do jogador. A entrega é "zero-setup". Para garantir que você (desenvolvedor) não perca tempo gerando binários na sua máquina, adotamos o seguinte pipeline no **GitHub Actions**:

1. **Gatilho (Trigger)**: O fluxo de build não ocorre a cada commit ou pull request. Ele é disparado exclusivamente mediante a criação de uma nova **Release/Tag** (ex: `v1.0.0`) no repositório oficial do GitHub.
2. **Build Server**: Uma máquina virtual Windows sobe no Actions, instala as dependências do Node.js, e aciona a compilação de produção (via *Electron Builder* ou *Electron Forge*), empacotando o Frontend e o Main Process em um executável sólido (`.exe`).
3. **Empacotamento Seguro (Packaging)**: O fluxo pega o `.exe` gerado e o compacta dentro de um arquivo `.zip`. Juntamente com o `.exe`, o pipeline embute um **Manual de Instruções** (um `.pdf` ou `.md` pré-existente na base de código ensinando a configurar a aplicação e usar a Watchlist).
4. **Entrega Direta (Deploy)**: O `.zip` finalizado é publicado automaticamente como um artefato atachado à página oficial de "Releases" do seu GitHub.

## Vantagem Estratégica
O jogador comum acessará apenas a aba "Releases", baixará o `.zip`, extrairá o conteúdo e terá em mãos o Manual e o executável "Double-Click". Sem dependências obscuras e sem atrito.
