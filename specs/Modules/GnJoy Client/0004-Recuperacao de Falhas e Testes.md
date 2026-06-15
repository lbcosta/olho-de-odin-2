# 0004 - Recuperação de Falhas e Testes de Resiliência

## Recuperação de Sessão e Hash Expirado (Fallback)
Se uma chamada **POST** falhar com código HTML ou for interceptada de forma mal-sucedida, assume-se que o Hash `Next-Action` mudou na publicadora do jogo.
- **Auto-renew**: O Client interrompe silenciosamente a fila, invoca novamente o **GET** da tela inicial de busca em background, atualiza as suas chaves com o novo `Next-Action` gerado, e tenta repetir o último POST.
- **Ruptura Visual**: Se essa rotina de renovação falhar, uma exceção é propagada e a UI do item reflete um erro de comunicação, exigindo intervenção manual (como aguardar, verificar logs de conexão, ou buscar novamente).

## Testes de Resiliência
Dada a natureza volátil de consumir uma API acoplada ao front-end da plataforma oficial, **o Client deve obrigatoriamente ter múltiplos testes de resiliência**. 
Este conjunto de testes (Unitários e de Integração) deve validar rigorosamente:
- O respeito absoluto ao Rate Limit global de 3 segundos sob forte concorrência.
- A capacidade de recuperar e renovar automaticamente (fallback) o hash `Next-Action` durante o ciclo de vida da aplicação.
- O parsing robusto de strings e dicionários embutidos no RSC (mesmo se as chaves Next.js mudarem de ordem).
- O comportamento e os backoffs aplicados ao se deparar com erros de conectividade ou *429 Too Many Requests*.
