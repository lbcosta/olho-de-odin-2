# 📖 Manual de Instruções — Olho de Odin 2

> Guia rápido para o jogador. Este arquivo é empacotado junto ao executável
> dentro do `.zip` de cada Release.

## 1. Instalação (Zero-Setup)

1. Baixe o arquivo `.zip` mais recente na aba **Releases** do projeto.
2. Extraia o conteúdo para uma pasta de sua preferência.
3. Dê **duplo-clique** no executável `Olho de Odin 2 ... portable.exe`.

Não há instalador, drivers ou dependências externas. O aplicativo cria seu
próprio banco de dados local (`olhodeodin.db`) na primeira execução.

## 2. Primeiros Passos

1. **Crie um Perfil**: o Perfil guarda sua Watchlist e (opcionalmente) o nome
   do seu Personagem para o monitoramento da "Minha Loja".
2. **Busque um item**: use a barra de busca e pressione **Enter**.
3. **Adicione à Watchlist**: itens monitorados são atualizados automaticamente
   em segundo plano (respeitando o limite da API do jogo).

## 3. Conceitos Importantes

- **Local-First / Offline**: todos os dados são cacheados localmente. Se a
  internet ou a API oficial cair, o app continua navegável com os últimos
  dados sincronizados. Toda tela exibe a data da última sincronização
  (`updated_at`).
- **Limite de Requisições**: por segurança contra banimento de IP, o app faz
  no máximo **1 requisição a cada 3 segundos**. Por isso a Watchlist atualiza
  os itens "um a um", de forma orgânica.

## 4. Métricas de Mercado

- **Média Ponderada Real**: o preço justo que o mercado realmente paga.
- **Spread Atual**: diferença entre o maior e o menor preço ativo.
- **Pressão da Concorrência**: o quanto o mercado está saturado hoje.

## 5. Estratégias de Venda

- **Undercutting** ⬇️: vender 1 Zeny abaixo do menor concorrente relevante.
- **Posicionamento Premium** ⭐: empatar com o 2º/3º mais barato quando o 1º
  tem estoque irrisório.
- **Flipping** 🔄: comprar em vez de vender quando o preço despencou de forma
  anormal.

## 6. Suporte

Em caso de erro de comunicação, verifique a **Barra de Log** no rodapé do
aplicativo. Ela mostra o estado das requisições à API oficial.
