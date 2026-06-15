# 0003 - Design Qualitativo e Feedback Visual

Este documento define como a pesada matemática das Métricas e Estratégias (arquivos 0001 e 0002) será exposta de forma intuitiva e sem sobrecarga cognitiva para o usuário na interface da Watchlist e da Tela do Item.

## 1. Tradução de Status em Tags Coloridas
Ao invés de obrigar o usuário a ler porcentagens complexas de mercado (ex: "+150% de saturação"), o sistema usará um catálogo visual de **Tags** coloridas:

- **Alta Demanda**: Tag `[🔥 Hot Item]` com fundo de destaque em Laranja/Amarelo.
- **Concorrência Alta**: Tag `[⚠️ Saturado]` com texto em Vermelho/Vinho.
- **Volatilidade**: Tag `[📈 Volátil]` com fundo de advertência Amarelo/Dourado.
- **Estável**: Tag `[⚖️ Dinheiro Certo]` com fundo Verde suave (quando as variações de spread e volatilidade forem menores que 10%).

## 2. Ícones de Estratégias (Ações Práticas)
As sugestões de precificação não serão blocos massivos de texto, mas sim ícones de instrução rápida anexados ao formulário de cadastro ou no card:

- **Undercutting**: Ícone de uma tesoura ou seta dupla para baixo (`⬇️`).
- **Posicionamento Premium**: Ícone de uma coroa de Ouro ou estrela (`⭐`).
- **Flipping**: Ícone de giro de moedas ou duas setas de reciclagem financeiras (`🔄`).

## 3. Tooltips de Educação (Onboarding Contínuo)
Apesar do design enxuto, todos os valores brutos ou tags coloridas devem possuir *Tooltips* textuais (ativados ao passar o mouse). O tooltip deve explicar, de forma breve, qual é a matemática agindo nos bastidores.
*Exemplo: (Ao passar o mouse na tag Saturado) "A oferta atual das lojas é 150% superior ao que o mercado consome por dia."*
