# SmartFood — Experiência do Usuário (UX) e Jornadas

**Missão 0003**
**Status:** ✅ CONGELADA — versão oficial (aprovada em revisão externa, confirmada em 2026-07-11)
**Referências obrigatórias:** [Smart Platform](../../../Smart%20Platform/INDEX.md) (em especial [Design System](../../../Smart%20Platform/SMART_DESIGN_SYSTEM_v1.0.md) e [Security Guide](../../../Smart%20Platform/SMART_SECURITY_GUIDE_v1.0.md)) · [Missão 0001](missao-0001-visao-estrategica.md) · [Missão 0002 — congelada](missao-0002-arquitetura-funcional.md) · [Missão 0002 Review Notes](../../engineering/review-notes/missao-0002-review-notes.md)
**Histórico de decisões:** [missao-0003-review-notes.md](../../engineering/review-notes/missao-0003-review-notes.md)
**Escopo:** Experiência pura — perfis, jornadas, navegação, estrutura de tela conceitual, feedback, acessibilidade, linguagem, heurísticas. **Nenhum wireframe, mockup, HTML, componente de framework, banco de dados ou tecnologia é definido aqui.**

---

## 1. Princípios de UX

| Princípio                                | O que significa na prática para o SmartFood                                                                                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Simples**                              | Cada tela resolve uma tarefa. Nenhuma tela pede ao comerciante para entender o sistema antes de conseguir usá-lo.                                                             |
| **Rápido**                               | Nenhum fluxo essencial (checkout, aceitar pedido, marcar pronto) deve ter etapa que não seja estritamente necessária.                                                         |
| **Intuitivo**                            | Se um comerciante ou cliente precisar de explicação para completar a ação principal de uma tela, a tela está errada, não o usuário.                                           |
| **Poucos cliques**                       | Ações de alta frequência (mudar status de pedido, adicionar ao carrinho) nunca passam por mais de 1-2 toques.                                                                 |
| **Zero treinamento sempre que possível** | O sistema é operável por alguém que nunca usou um SaaS antes — referência direta às personas da Missão 0001 (Marcos, Renata, Sônia).                                          |
| **Interface limpa**                      | Densidade de informação proporcional à urgência: tela de cozinha/caixa é mais limpa ainda que o dashboard administrativo.                                                     |
| **Mobile First**                         | Toda tela nasce pensada para celular; desktop é a expansão, não o contrário — coerente com o [Smart Design System](../../../Smart%20Platform/SMART_DESIGN_SYSTEM_v1.0.md).    |
| **Desktop extremamente produtivo**       | Onde o uso é predominantemente desktop (gestão, catálogo grande, relatórios), a tela aproveita o espaço extra com densidade e atalhos — não é só "a versão grande do mobile". |
| **Consistência absoluta entre módulos**  | O mesmo padrão de tela, ação e feedback se repete em todo domínio — ver Estrutura das Telas (Seção 6) e Smart Design System.                                                  |
| **Confiança e velocidade transmitidas**  | Todo estado do sistema (carregando, salvo, erro, pedido em andamento) é visível e inequívoco — nunca deixa o usuário sem saber se algo funcionou.                             |

---

## 2. Perfis de Usuário

### 2.1 Administrador

- **Objetivos:** ter visão completa do negócio, tomar decisão rápida, garantir que a operação não pare.
- **Necessidades:** dashboard consolidado, controle de permissões e configuração da loja acessíveis, alertas do que precisa de atenção agora.
- **Dores:** pouco tempo — frequentemente acumula outros papéis (persona Marcos/Renata, Missão 0001); medo de "quebrar" algo ao configurar; dificuldade de saber o que está indo bem sem abrir vários relatórios.
- **Frequência de uso:** várias vezes ao dia, sessões curtas e frequentes (não uma sessão longa), picos na abertura e no fechamento do dia.
- **Fluxos principais:** onboarding, Configuração da Loja, Catálogo, gestão de equipe, leitura de Dashboard, Financeiro.

### 2.2 Gerente

- **Objetivos:** garantir que a operação do dia rode bem, sem responsabilidade sobre configuração estrutural da conta.
- **Necessidades:** visão operacional em tempo real, relatórios de vendas, capacidade de intervir em um pedido problemático sem precisar do Administrador.
- **Dores:** falta de autonomia se toda ação exigir aprovação do Administrador; sobrecarga em pico se a tela não priorizar o que é urgente.
- **Frequência de uso:** uso intenso durante o expediente, picos de atenção nos horários de pico de pedido.
- **Fluxos principais:** Painel de Pedidos, Relatórios de Vendas, escala de equipe operacional.

### 2.3 Operador (termo guarda-chuva — Caixa, Cozinha e Motoboy são especializações, ver Missão 0002 Seção 14)

- **Objetivos:** executar rápido, sem erro, sem precisar pensar sobre o sistema em si.
- **Necessidades:** tela extremamente simples, poucos elementos por vez, alvo de toque grande, zero curva de aprendizado.
- **Dores:** telas complexas demais para o ritmo de trabalho (mãos ocupadas, pouco tempo, ambiente barulhento/corrido).
- **Frequência de uso:** contínua durante o turno — tela fica aberta o tempo todo, não é "sessão" no sentido tradicional.
- **Fluxos principais:** detalhados por especialização nas Seções 2.5-2.7.

### 2.4 Cliente Final

- **Objetivos:** comprar rápido, sem fricção, com confiança de que o pedido vai chegar como esperado.
- **Necessidades:** navegação clara, checkout curto, status do pedido sempre visível, comunicação confiável.
- **Dores:** cardápio confuso, checkout longo, incerteza sobre status, desconfiança de pagamento em site de loja pequena/pouco conhecida.
- **Frequência de uso:** esporádica por loja individual (poucas vezes por semana/mês), mas cumulativamente alta considerando toda a plataforma.
- **Fluxos principais:** navegação, carrinho, checkout, acompanhamento, avaliação, recompra.

### 2.5 Caixa (especialização de Operador)

- **Objetivos:** confirmar pagamento rápido e sem erro; fechar caixa sem dor de cabeça no fim do turno.
- **Necessidades:** status de pagamento claro por pedido, resumo simples de fechamento, poucos cliques para confirmar dinheiro/cartão.
- **Dores:** divergência entre valor físico e valor do sistema; correr contra o pico de pedidos enquanto processa pagamento.
- **Frequência de uso:** constante durante o expediente, pico de atenção na abertura/fechamento de turno.
- **Fluxos principais:** confirmar pagamento, consultar status de cobrança, abrir caixa, fechar caixa.

### 2.6 Equipe de Cozinha (especialização de Operador)

- **Objetivos:** saber o que preparar, em que ordem, sem confusão.
- **Necessidades:** fila visual clara (padrão Kanban), prioridade óbvia, tela pensada para ficar fixa e visível (ex: tablet montado na parede), zero necessidade de digitar.
- **Dores:** pedido fora de ordem, item já cancelado ainda aparecendo na fila, dificuldade de enxergar tudo de uma vez em horário de pico.
- **Frequência de uso:** contínua durante o expediente — tela sempre visível, nunca "fechada".
- **Fluxos principais:** visualizar fila, marcar item em preparo, marcar pronto, ver alerta de cancelamento.

### 2.7 Motoboy (especialização de Operador)

- **Objetivos:** saber exatamente o que pegar, para onde ir, e confirmar entrega rápido.
- **Necessidades:** tela mínima e objetiva, endereço em destaque, botão de ação grande (aceitar/retirar/entregar), utilizável com uma mão, em movimento, sob sol.
- **Dores:** informação demais na tela, necessidade de digitar algo, endereço ambíguo, etapas desnecessárias entre "peguei o pedido" e "entreguei".
- **Frequência de uso:** contínua durante o turno, interações rápidas e repetitivas.
- **Fluxos principais:** receber atribuição, aceitar, retirar, navegar até o destino, entregar, finalizar.

---

## 3. Jornadas Completas

### 3.1 Comerciante (Administrador/Gerente) — da conta à primeira venda

1. Cria a conta → **momento de UX:** formulário mínimo (nome, e-mail, telefone, nome da loja); nada de pedir CNPJ ou dado fiscal completo neste primeiro passo, para não gerar abandono antes mesmo de ver o produto.
2. Recebe um checklist de configuração inicial (Configuração da Loja) com progresso visível (ex: "3 de 6 concluídos") — cria senso de progresso sem obrigar ordem rígida.
3. Configura identidade visual → **momento de UX:** preview em tempo real de como a vitrine fica, para reforçar percepção de "loja própria" desde o primeiro minuto.
4. Cadastra o primeiro produto → **momento de UX:** fluxo simplificado para o primeiro produto (menos campos visíveis, avançados escondidos atrás de "mais opções"), depois os próximos produtos usam o fluxo completo.
5. Convida a equipe (opcional neste momento — pode pular).
6. Vê a vitrine publicada → **momento de UX:** call-to-action claro de "copiar link" e "gerar QR Code", porque divulgação é a ação seguinte natural.
7. Recebe o primeiro pedido → **momento de UX:** notificação inequívoca (som + visual), diferente de qualquer outra notificação do sistema — é o momento mais importante da jornada de ativação.
8. Processa o primeiro pedido pelo Painel de Pedidos → **momento de UX:** microcopy de incentivo/orientação na primeira vez ("Marque como 'Pronto' quando o pedido estiver pronto para saída"), que desaparece depois do primeiro uso.
9. Consulta o Dashboard e vê o primeiro resultado registrado.

### 3.2 Cliente Final — de entrar na loja até avaliar o pedido

1. Chega à vitrine (link, QR Code, busca) → **momento de UX:** carregamento rápido é crítico aqui — é a primeira impressão e o ponto de maior risco de abandono.
2. Navega pelo catálogo → **momento de UX:** busca e filtro sempre visíveis, nunca escondidos atrás de mais de um toque.
3. Adiciona itens ao carrinho → **momento de UX:** microinteração de confirmação (Seção 12), carrinho sempre acessível (indicador fixo, nunca precisa "lembrar" o que já colocou).
4. Vai para o checkout → **momento de UX:** ponto de maior risco de abandono do fluxo inteiro (Seção 15) — pedir só o essencial, oferecer login/cadastro como conveniência, não como bloqueio.
5. Escolhe endereço (ou cadastra um novo) e forma de pagamento → **momento de UX:** taxa de entrega e prazo visíveis antes da confirmação final, nunca como surpresa na última tela.
6. Confirma o pedido → **momento de UX:** confirmação inequívoca (Seção 12), nunca deixa dúvida se o pedido foi realmente enviado.
7. Acompanha o status → **momento de UX:** tela de acompanhamento é a mais revisitada de toda a jornada do cliente; precisa ser a mais tranquilizadora (Seção 8).
8. Recebe o pedido.
9. É convidado a avaliar → **momento de UX:** convite leve, não bloqueante, que não interrompe nada — pode ser adiado ou ignorado sem penalidade.
10. Volta para recomprar → **momento de UX:** "repetir pedido" acessível em no máximo dois toques a partir do histórico.

### 3.3 Operador — receber, atualizar, cancelar, reembolsar, consultar histórico

1. Recebe alerta de novo pedido (visual + sonoro).
2. Aceita o pedido (ou o sistema aceita automaticamente, conforme Configuração da Loja).
3. Atualiza o status conforme a operação avança → **momento de UX:** mudança de status é uma ação de um toque, nunca um formulário.
4. Se necessário, cancela o pedido → **momento de UX:** sempre com confirmação (nunca ação de um toque só, diferente da mudança de status normal — ver Regra de Negócio Global 1 da Missão 0002).
5. Se o pedido já foi pago, aciona reembolso → **momento de UX:** fluxo levemente mais burocrático de propósito (mais um passo de confirmação), porque envolve dinheiro real voltando ao cliente.
6. Consulta o histórico de pedidos do dia/período quando precisa retomar contexto.

### 3.4 Cozinha — fila, priorização, preparo, finalização

1. Visualiza a fila de pedidos em formato de colunas (Kanban) — Seção 4 detalha o mapa de navegação desta tela.
2. Prioriza visualmente pelo tempo de espera (o pedido mais antigo se destaca automaticamente, sem exigir leitura de hora exata).
3. Marca item como "em preparo" → **momento de UX:** ação por toque no próprio card, sem abrir tela nova.
4. Marca item como "pronto" → o card se move automaticamente para a coluna seguinte, com feedback visual claro (Seção 12).
5. Recebe alerta se um item da fila for cancelado enquanto em preparo → **momento de UX:** alerta visualmente diferente de "pronto", para nunca ser confundido.

### 3.5 Caixa — pagamento, fechamento

1. Vê o status de pagamento de cada pedido (pago/pendente/dinheiro na entrega).
2. Confirma recebimento manual quando aplicável (ex: dinheiro).
3. Ao fim do turno, abre o resumo de Fechamento de Caixa.
4. Confere valor físico contra o total do sistema → **momento de UX:** sistema já destaca a diferença, se houver, em vez de exigir cálculo manual (ponto de inovação 30 da Missão 0002).
5. Confirma o fechamento.

### 3.6 Motoboy — receber, aceitar, retirar, entregar, finalizar

1. Recebe a atribuição de entrega (alerta simples, um card por entrega).
2. Aceita → **momento de UX:** um toque, sem tela intermediária.
3. Marca "retirado" ao pegar o pedido na loja.
4. Segue até o endereço (endereço em destaque, ação de abrir navegação externa em um toque).
5. Marca "entregue" → **momento de UX:** ação final de um toque, fecha o ciclo daquela entrega e já mostra a próxima, se houver.

---

## 4. Mapa de Navegação

Três experiências de navegação distintas — não faz sentido usar a mesma estrutura para quem administra, quem opera e quem compra.

### 4.1 Painel de Gestão (Administrador · Gerente · Financeiro · Supervisor)

```
Dashboard
 ├── Pedidos (Painel de Pedidos) → Pedido individual → Pagamento → Reembolso (se aplicável)
 ├── Catálogo → Produto individual → Variações
 ├── Comandas/Mesas
 ├── Clientes (Experiência do Cliente, visão do comerciante) → Cliente individual → Histórico
 ├── Financeiro → Fechamento de Caixa / Fluxo de Caixa / (DRE, fases futuras)
 ├── Marketing → Cupons/Promoções
 ├── Relatórios → Dashboard detalhado / Comparativo (multiloja, fases futuras)
 ├── Configuração da Loja → Identidade / Horário / Entrega / Pagamento aceito / Dados fiscais
 ├── Administração → Usuários e Papéis / Preferências do Painel
 └── (fases futuras) Configuração Inteligente · Ecossistema
```

### 4.2 Painel Operacional (Operador · Caixa · Cozinha · Motoboy)

Navegação propositalmente rasa — cada especialização vê essencialmente **uma tela principal**, não um menu para explorar:

```
Cozinha:    Fila de Pedidos (tela única, sem submenu)
Caixa:      Pedidos com Pagamento Pendente ↔ Fechamento de Caixa (duas telas, alternância simples)
Motoboy:    Minhas Entregas (tela única, lista de cards)
Operador
(genérico): Painel de Pedidos → Pedido individual
```

### 4.3 Vitrine / Experiência do Cliente Final

```
Vitrine (Catálogo)
 ├── Produto → Carrinho
 └── Carrinho → Checkout → Endereço → Pagamento → Confirmação
      ↓
 Acompanhamento do Pedido
      ↓
 Avaliação (opcional)

Menu do Cliente (acessível a qualquer momento):
 Perfil · Endereços · Métodos de Pagamento Salvos · Favoritos · Histórico de Pedidos · Fidelidade
```

---

## 5. Estrutura dos Menus

| Menu                       | Onde aparece                                                                                                         | Conteúdo                                                                                               | Justificativa                                                                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Menu Lateral (Sidebar)** | Painel de Gestão, desktop/tablet                                                                                     | Domínios principais (Dashboard, Pedidos, Catálogo, Financeiro, Configuração da Loja, Administração...) | Segue o padrão obrigatório do [Smart Design System](../../../Smart%20Platform/SMART_DESIGN_SYSTEM_v1.0.md) — recolhível, agrupada por domínio, para não competir por espaço com o conteúdo em telas densas (relatório, catálogo grande). |
| **Menu Superior (Header)** | Todas as interfaces logadas                                                                                          | Empresa/loja ativa (contexto multiloja quando aplicável), notificações, avatar/usuário, busca global   | Contexto que precisa estar sempre visível, independente de qual módulo o usuário está — nunca deve exigir navegação para saber "em qual loja estou".                                                                                     |
| **Menu do Usuário**        | Dentro do Header, ao clicar no avatar                                                                                | Perfil, Preferências do Painel (tema), Sair                                                            | Ações pessoais de baixa frequência não competem por espaço no menu principal.                                                                                                                                                            |
| **Menu Rápido**            | Painel de Gestão, atalho flutuante ou botão de destaque                                                              | Ação mais frequente do contexto atual (ex: "Novo Produto" no Catálogo, "Novo Cupom" no Marketing)      | Reduz cliques para a ação que o usuário mais repete naquela tela — coerente com o princípio "poucos cliques".                                                                                                                            |
| **Menu Mobile**            | Painel de Gestão em celular                                                                                          | Colapsa a Sidebar em navegação inferior (bottom bar) com os 4-5 itens mais usados + "Mais"             | Sidebar completa não cabe em tela pequena; bottom bar mantém navegação com o polegar, sem esconder tudo atrás de um único ícone de hambúrguer.                                                                                           |
| **Menu Contextual**        | Sobre um item específico (produto, pedido, cliente) — normalmente acionado por toque longo ou ícone de "mais opções" | Ações secundárias daquele item específico (duplicar produto, excluir, ver histórico)                   | Mantém a lista/tela principal limpa, sem botão de ação secundária poluindo cada linha visível.                                                                                                                                           |

_Nota: Cozinha, Caixa e Motoboy **não têm** menu lateral nem menu do usuário visível por padrão — por design, essas interfaces priorizam uma única tarefa (Seção 4.2). Acesso a "Sair"/configuração pessoal existe, mas fica deliberadamente fora do fluxo principal._

---

## 6. Estrutura das Telas

Convenção geral (não repetida linha a linha abaixo, para evitar redundância): **Paginação** segue o mesmo padrão em toda listagem (carregamento incremental em mobile, paginação numerada em desktop quando a lista for muito longa); **Atalhos de teclado** existem nas telas de uso desktop intenso (Catálogo, Painel de Pedidos, Relatórios) e seguem um padrão único documentado futuramente no Smart Design System quando amadurecer; **Mensagens e Feedbacks** seguem os padrões das Seções 9 (Sistema de Feedback) e 11 (UX Writing) — não redefinidos por tela.

### 6.1 Painel de Gestão

| Tela                     | Objetivo                      | Informações Exibidas                                                   | Ações Principais                             | Ações Secundárias                  | Filtros / Busca                                                     | Estado Vazio                                                                      |
| ------------------------ | ----------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Dashboard**            | Leitura rápida do dia         | Pedidos do dia, ticket médio, produto mais vendido, alertas pendentes  | Ir para Pedidos, ir para Relatório completo  | Exportar período                   | Filtro de período                                                   | "Sua loja ainda não teve pedidos — assim que o primeiro chegar, ele aparece aqui" |
| **Painel de Pedidos**    | Operação em tempo real        | Lista/kanban de pedidos por status, cliente, itens, valor              | Avançar status, cancelar                     | Ver detalhe, reembolsar, imprimir  | Filtro por status/canal (delivery/retirada/mesa), busca por cliente | "Nenhum pedido em andamento agora"                                                |
| **Catálogo**             | Gerenciar produtos            | Lista de produtos por categoria, preço, disponibilidade                | Criar produto, editar, marcar indisponível   | Duplicar, excluir (via Lixeira)    | Busca por nome, filtro por categoria                                | "Comece adicionando seu primeiro produto" (com CTA de destaque)                   |
| **Comandas/Mesas**       | Gerenciar salão               | Mapa/lista de mesas, status (livre/ocupada), valor da comanda          | Abrir comanda, fechar comanda, dividir conta | Transferir item entre comandas     | Filtro por status da mesa                                           | "Nenhuma mesa configurada ainda"                                                  |
| **Clientes**             | Ver base de clientes          | Lista de clientes, última compra, total gasto                          | Ver perfil/histórico do cliente              | Exportar lista                     | Busca por nome/telefone                                             | "Seus clientes aparecem aqui após o primeiro pedido"                              |
| **Financeiro**           | Visão consolidada de dinheiro | Fechamentos de caixa, fluxo de caixa (fases futuras)                   | Abrir/fechar caixa                           | Exportar relatório financeiro      | Filtro por período                                                  | "Feche seu primeiro caixa para ver o histórico aqui"                              |
| **Marketing**            | Gerenciar promoções           | Lista de cupons ativos/expirados                                       | Criar cupom                                  | Duplicar, desativar                | Filtro por status                                                   | "Nenhum cupom criado ainda"                                                       |
| **Relatórios**           | Análise de período            | Gráficos de venda, comparativo de período                              | Exportar, mudar período                      | Comparar lojas (multiloja, futuro) | Filtro de período, filtro de produto                                | "Dados insuficientes para gerar relatório ainda"                                  |
| **Configuração da Loja** | Identidade e regras da loja   | Formulário por seção (identidade, horário, entrega, pagamento, fiscal) | Salvar alteração                             | Pré-visualizar vitrine             | —                                                                   | Não aplicável (sempre populada com defaults)                                      |
| **Administração**        | Gestão de equipe              | Lista de usuários e papéis                                             | Convidar usuário, alterar papel              | Remover acesso                     | Busca por nome                                                      | "Convide seu primeiro membro de equipe"                                           |

### 6.2 Vitrine / Experiência do Cliente Final

| Tela                                       | Objetivo                 | Informações Exibidas                                                   | Ações Principais                   | Ações Secundárias                       | Filtros / Busca             | Estado Vazio                                                       |
| ------------------------------------------ | ------------------------ | ---------------------------------------------------------------------- | ---------------------------------- | --------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| **Vitrine (Catálogo Público)**             | Navegar e escolher       | Categorias, produtos, preço, disponibilidade, identidade da loja       | Adicionar ao carrinho              | Favoritar                               | Busca, filtro por categoria | "Nenhum produto disponível no momento" (loja fechada/sem catálogo) |
| **Carrinho**                               | Revisar antes de comprar | Itens, quantidade, subtotal                                            | Ir para checkout                   | Editar quantidade, remover item         | —                           | "Seu carrinho está vazio" (com CTA de voltar à vitrine)            |
| **Checkout**                               | Confirmar compra         | Resumo do pedido, endereço, forma de pagamento, taxa de entrega, total | Confirmar pedido                   | Trocar endereço/pagamento               | —                           | Não aplicável                                                      |
| **Acompanhamento do Pedido**               | Saber onde está o pedido | Status atual, tempo estimado, itens do pedido                          | — (tela primariamente informativa) | Falar com a loja (Suporte, fase futura) | —                           | Não aplicável                                                      |
| **Perfil / Endereços / Pagamentos Salvos** | Gerenciar dados pessoais | Dados cadastrais, lista de endereços, métodos salvos                   | Editar, adicionar novo             | Excluir (via Lixeira)                   | —                           | "Nenhum endereço salvo ainda"                                      |
| **Histórico de Pedidos**                   | Consultar e recomprar    | Lista de pedidos anteriores com status                                 | Repetir pedido                     | Avaliar (se ainda não avaliado)         | Filtro por período/loja     | "Você ainda não fez nenhum pedido"                                 |

### 6.3 Telas Operacionais (Cozinha · Caixa · Motoboy)

| Tela                             | Objetivo                            | Informações Exibidas                                 | Ações Principais                          | Estado Vazio                                        |
| -------------------------------- | ----------------------------------- | ---------------------------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| **Fila da Cozinha (Kanban)**     | Saber o que preparar e em que ordem | Cards por pedido/item, tempo de espera destacado     | Marcar em preparo, marcar pronto          | "Nenhum pedido na fila — tudo em dia"               |
| **Pagamentos Pendentes (Caixa)** | Confirmar recebimento               | Lista de pedidos aguardando confirmação de pagamento | Confirmar pagamento                       | "Nenhum pagamento pendente"                         |
| **Fechamento de Caixa**          | Encerrar o turno                    | Totais por forma de pagamento, diferença sugerida    | Confirmar fechamento                      | Não aplicável (sempre populada com o período atual) |
| **Minhas Entregas (Motoboy)**    | Saber o que entregar                | Cards por entrega: endereço, cliente, status         | Aceitar, marcar retirado, marcar entregue | "Nenhuma entrega atribuída no momento"              |

---

## 7. Experiência Mobile

| Dimensão                      | Desktop                                                                            | Tablet                                                                                                      | Celular                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Uso predominante**          | Administrador em trabalho de gestão prolongado (catálogo, relatório, configuração) | Cozinha (tela fixa na parede/bancada), Caixa                                                                | Operador em movimento, Motoboy, Cliente Final, Administrador em consulta rápida                               |
| **Navegação**                 | Sidebar completa expandida                                                         | Sidebar recolhida por padrão (ícones), ou tela única fixa (Cozinha)                                         | Bottom bar / navegação inferior                                                                               |
| **Densidade de informação**   | Alta — tabelas completas, múltiplas colunas, atalhos de teclado                    | Média — cards grandes, poucos elementos por vez, otimizado para toque à distância de braço                  | Baixa — um card/ação por vez, texto grande, alvo de toque grande                                              |
| **Interações**                | Mouse + teclado, hover states, atalhos                                             | Toque, sem hover                                                                                            | Toque, gestos simples (swipe para ação rápida em listas)                                                      |
| **Funcionalidades completas** | Todas                                                                              | Todas as operacionais; configuração estrutural (Configuração da Loja avançada) é possível mas não otimizada | Ações essenciais priorizadas; configuração estrutural complexa é desencorajada (mas não bloqueada) no celular |

**O que muda funcionalmente, não só visualmente:** relatórios comparativos e configuração fiscal completa (Fase 3/Enterprise) são desenhados assumindo uso em desktop — não porque o celular não suporte, mas porque a tarefa em si (analisar dado denso, preencher formulário longo) é mais bem resolvida com tela grande. O sistema nunca impede o uso em celular, mas prioriza a experiência ideal de cada tarefa no dispositivo mais adequado a ela.

---

## 8. Experiência de Pedidos

| Estado                                                         | O que o Cliente vê                                                                  | O que o Operador/Cozinha vê                                                                   | Notificação disparada                                                                                     | Tempo estimado                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Novo (recebido)**                                            | "Pedido recebido! Aguardando confirmação da loja."                                  | Alerta sonoro + visual, card novo no Painel/Kanban                                            | Confirmação de recebimento (Central de Comunicação)                                                       | Não exibido ainda                                                                     |
| **Preparando**                                                 | "Seu pedido está sendo preparado." + tempo estimado                                 | Card na coluna "Em Preparo"                                                                   | Atualização de status                                                                                     | Tempo estimado exibido, recalculado dinamicamente (Ponto de Inovação 31, Missão 0002) |
| **Pronto** (retirada/mesa) ou **Saiu para entrega** (delivery) | "Seu pedido está pronto para retirada" / "Seu pedido saiu para entrega"             | Card avança para coluna final / atribuído a Motoboy                                           | Atualização de status                                                                                     | Tempo estimado de chegada (se delivery)                                               |
| **Entregue / Concluído**                                       | "Pedido entregue! Bom apetite." + convite a avaliar                                 | Card sai da fila ativa, vai para histórico                                                    | Confirmação de entrega                                                                                    | —                                                                                     |
| **Cancelado**                                                  | "Seu pedido foi cancelado." + motivo, se houver                                     | Card marcado como cancelado, removido da fila ativa com destaque visual diferente de "pronto" | Notificação de cancelamento                                                                               | —                                                                                     |
| **Falha de pagamento**                                         | "Não conseguimos confirmar seu pagamento — tente novamente ou escolha outra forma." | Pedido não aparece no Painel operacional (Regra de Negócio Global 3, Missão 0002)             | Alerta imediato ao cliente, sem alarmar a equipe operacional por um evento que ainda não é um pedido real | —                                                                                     |
| **Reembolso em andamento / concluído**                         | "Seu reembolso está sendo processado." → "Reembolso concluído."                     | Refletido no Financeiro/Pagamentos, não na fila operacional                                   | Notificação em cada mudança de etapa                                                                      | Prazo estimado do meio de pagamento, quando disponível                                |

**Princípio geral:** o cliente nunca fica sem saber o que está acontecendo com o dinheiro dele ou com a comida dele — todo estado tem uma frase correspondente em UX Writing (Seção 11), nunca um status técnico cru.

---

## 9. Sistema de Feedback

| Tipo                       | Quando usar                                                                                                   | Comportamento                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Toast**                  | Confirmação de ação rápida e não crítica (produto salvo, cupom criado)                                        | Não bloqueante, desaparece sozinho, canto da tela                                                                      |
| **Alerta (banner)**        | Informação persistente que exige atenção mas não bloqueia o uso (ex: "Estoque baixo em 3 produtos")           | Fica visível até ser dispensado ou a condição ser resolvida                                                            |
| **Confirmação (modal)**    | Ação destrutiva ou irreversível de fato (cancelamento de pedido, reembolso, exclusão que vai além da Lixeira) | Bloqueante, exige decisão explícita, nunca ação padrão perigosa pré-selecionada                                        |
| **Erro**                   | Falha de validação ou de sistema                                                                              | Específico ao campo/ação, nunca genérico ("algo deu errado") — ver UX Writing                                          |
| **Sucesso**                | Conclusão de uma tarefa importante (pedido confirmado, pagamento aprovado)                                    | Visualmente inequívoco, muitas vezes maior/mais celebrativo que um toast comum quando é um marco (ex: primeiro pedido) |
| **Aviso**                  | Situação que não impede a ação mas merece atenção (ex: "Este produto está quase sem estoque")                 | Visualmente distinto de erro — não deve assustar                                                                       |
| **Estado de carregamento** | Qualquer operação que leve mais que um instante perceptível                                                   | Skeleton loading (abaixo) para carregamento de conteúdo; spinner apenas para ações pontuais (ex: enviando pagamento)   |
| **Estado vazio**           | Lista/tela sem dado ainda                                                                                     | Nunca uma tela em branco — sempre uma frase orientando o próximo passo (ver exemplos na Seção 6)                       |
| **Skeleton Loading**       | Carregamento de tela com estrutura conhecida (lista, card, dashboard)                                         | Estrutura "fantasma" da tela final, evita o "pulo" de layout quando o conteúdo chega                                   |
| **Mensagens amigáveis**    | Sempre — princípio transversal                                                                                | Nunca jargão técnico, nunca código de erro cru exposto ao usuário final (ver UX Writing)                               |

---

## 10. Acessibilidade

Diretrizes mínimas obrigatórias em toda tela do SmartFood:

- **Contraste:** mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande) em qualquer combinação de tema (claro/escuro/vitrine customizada pelo lojista) — inclusive quando o lojista escolhe cor de marca própria, o sistema deve alertar se o contraste ficar abaixo do mínimo.
- **Teclado:** toda ação executável por mouse/toque também é executável por teclado, com ordem de tabulação lógica e foco sempre visível.
- **Leitores de tela:** toda imagem de produto tem texto alternativo (mínimo: nome do produto); todo ícone usado como ação tem rótulo acessível, mesmo quando visualmente é só o ícone.
- **Responsividade:** nenhuma informação ou ação essencial fica disponível só em um tamanho de tela — o que muda é a densidade/organização, nunca a capacidade.
- **Fontes:** tamanho mínimo legível sem zoom (16px equivalente como base), escalável pela configuração do sistema operacional/navegador do usuário.
- **Ícones:** nunca a única forma de comunicar uma ação crítica (cancelar, excluir, confirmar) — sempre acompanhados de texto ou tooltip.
- **Cores:** nunca o único indicador de status (ex: pedido "atrasado" não é só vermelho — também tem ícone e texto), para não excluir usuários com daltonismo.

---

## 11. UX Writing

**Tom oficial do SmartFood:** direto, caloroso sem ser informal demais, nunca técnico, nunca infantilizado. Fala como um parceiro competente, não como um manual de sistema nem como uma marca "descolada" forçando intimidade.

| Contexto                | Como falar                                                                                                        | Exemplo                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Com o comerciante**   | Tom consultivo, de parceiro de negócio — reconhece que é o negócio dele, não "o sistema mandando"                 | "Seu produto foi salvo. Ele já está visível na sua vitrine."                                                                                          |
| **Com o cliente final** | Tom leve, rápido, tranquilizador — foco em reduzir ansiedade sobre o pedido                                       | "Pedido confirmado! Você vai receber uma notificação a cada atualização."                                                                             |
| **Erros**               | Específico, sem culpar o usuário, sempre com o próximo passo claro                                                | "Não conseguimos processar seu pagamento. Verifique os dados do cartão ou tente outra forma de pagamento." (nunca "Erro 402" ou "Falha na transação") |
| **Sucesso**             | Confirma o que aconteceu, sem exagero desnecessário — exceto em marcos genuínos (primeiro pedido, primeira venda) | "Pronto! Seu cupom está ativo."                                                                                                                       |
| **Cancelamento**        | Neutro, sem tom de reprovação, sempre explica o próximo passo (estorno, etc.)                                     | "Pedido cancelado. Se o pagamento já tinha sido feito, o reembolso será processado em até [prazo]."                                                   |
| **Pagamento**           | Transparente, nunca ambíguo sobre se o dinheiro foi de fato cobrado ou não                                        | "Pagamento aprovado." / "Pagamento recusado — nenhum valor foi cobrado."                                                                              |

**Regra geral:** nunca expor termo técnico interno (status de banco de dados, nome de campo, stack trace) em nenhuma mensagem voltada ao usuário — todo erro tem uma tradução humana antes de chegar à tela, mesmo quando a causa raiz é técnica.

---

## 12. Microinterações

| Ação                               | Feedback esperado                                                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adicionar ao carrinho**          | Indicador do carrinho atualiza instantaneamente (contagem), pequena animação de confirmação no próprio botão                                             |
| **Favoritar**                      | Ícone de coração/estrela preenche instantaneamente, sem recarregar a tela                                                                                |
| **Atualizar status do pedido**     | Transição visual suave entre estados/colunas (Kanban), nunca um "salto" abrupto                                                                          |
| **Salvar (configuração, produto)** | Indicador sutil de "salvo" — para ações simples, não interrompe com modal de confirmação                                                                 |
| **Excluir**                        | Sempre confirmação prévia; item vai para a Lixeira com feedback claro de que é reversível ("Movido para a lixeira — pode ser restaurado em até 30 dias") |
| **Pagamento aprovado**             | Feedback de sucesso imediato e inequívoco — em mobile, reforçado por vibração/som quando o dispositivo permitir                                          |
| **Pedido pronto (Cozinha)**        | Alerta sonoro distinto para quem está no Caixa/Painel, card muda de coluna visivelmente                                                                  |
| **Pedido entregue**                | Fecha visualmente o ciclo daquele pedido; no cliente, abre espaço (não bloqueante) para avaliação                                                        |

---

## 13. Componentes de UX (lista oficial, sem desenho de interface)

Cruzado com a biblioteca `Smart UI` já definida no [Smart Design System v1.0](../../../Smart%20Platform/SMART_DESIGN_SYSTEM_v1.0.md):

**Já previstos no Smart Design System:** Cards, Botões, Modal, Badges, Avatar, Calendário, Tabelas (base do DataTable).

**Novos, identificados nesta missão** (candidatos a entrar no catálogo `Smart UI` quando um segundo produto Smart precisar deles — ver regra de graduação do Design System): Drawer, Stepper, Tabs, Breadcrumb, Timeline, Kanban, Chat, Upload, Indicadores/Status Pills, Central de Notificações.

Lista completa de componentes necessários ao SmartFood:

```
Cards · Tabelas / DataTable · Botões · Modal · Drawer · Stepper · Tabs ·
Breadcrumb · Timeline · Kanban · Calendário · Chat · Notificações
(Toast + Central) · Upload · Avatar · Badges · Indicadores de Status
```

_Nota registrada para a Seção 17 (itens para Review Notes): Kanban (Fila da Cozinha), Timeline (Acompanhamento de Pedido) e Chat (Suporte) são específicos do domínio de food service e provavelmente começam como componente local do SmartFood, não do `Smart UI` compartilhado — a regra de graduação (2+ produtos) ainda não se aplica a eles._

---

## 14. Heurísticas de Nielsen Aplicadas ao SmartFood

| #   | Heurística                                                   | Aplicação no SmartFood                                                                                                                                                               |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Visibilidade do status do sistema                            | Status de pedido sempre visível em tempo real, tanto para cliente quanto para operação (Seção 8); loading states nunca deixam o usuário "no escuro" (Seção 9).                       |
| 2   | Correspondência entre o sistema e o mundo real               | Vocabulário segue a Linguagem Ubíqua definida na Missão 0002 (Seção 15) — termos do dia a dia do comerciante de food service, não jargão de software.                                |
| 3   | Controle e liberdade do usuário                              | Lixeira permite desfazer exclusão; cancelamento sempre confirmado, nunca definitivo sem aviso.                                                                                       |
| 4   | Consistência e padrões                                       | Mesmo componente para o mesmo propósito em todo o sistema, governado pelo Smart Design System — nunca dois padrões visuais para a mesma ação.                                        |
| 5   | Prevenção de erros                                           | Confirmação obrigatória em toda ação destrutiva/irreversível (Regras de Negócio Globais, Missão 0002); validação de formulário antes de submeter, não depois.                        |
| 6   | Reconhecimento em vez de memorização                         | Navegação sempre visível (Seção 4/5); breadcrumb em fluxos profundos; nenhuma ação depende de o usuário lembrar um comando ou caminho.                                               |
| 7   | Flexibilidade e eficiência de uso                            | Atalhos de teclado nas telas de uso desktop intenso; Menu Rápido para ação mais frequente do contexto (Seção 5).                                                                     |
| 8   | Estética e design minimalista                                | Cada tela mostra só o necessário para a tarefa daquele perfil — a densidade é proporcional à urgência do papel (comparar Dashboard vs. tela da Cozinha).                             |
| 9   | Ajudar o usuário a reconhecer, diagnosticar e corrigir erros | Mensagens de erro específicas e acionáveis (Seção 11), nunca um código de erro cru.                                                                                                  |
| 10  | Ajuda e documentação                                         | Checklist de onboarding e microcopy orientativo na primeira vez que uma tela é usada (Seção 3.1), sem exigir manual externo — ajuda embutida no fluxo, não em um documento separado. |

---

## 15. Riscos de UX

| Risco                                                | Onde ocorre                                     | Consequência potencial                                                                        | Solução proposta                                                                                                                                                                                                               |
| ---------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Checkout longo demais**                            | Carrinho → Checkout (Cliente Final)             | Abandono de carrinho, especialmente em cliente novo sem cadastro                              | Permitir checkout como convidado; pedir cadastro completo só depois da confirmação do pedido, como conveniência para a próxima compra, nunca como bloqueio                                                                     |
| **Confusão entre "Tema da Loja" e "Tema do Painel"** | Configuração da Loja vs. Preferências do Painel | Comerciante configura o lugar errado, achando que está mudando a vitrine                      | Nomenclatura já resolvida na Linguagem Ubíqua (Missão 0002, Seção 15) — reforçar com posição física distante entre as duas configurações na navegação (Seção 4.1)                                                              |
| **QR Code de Mesa complexo demais para o MVP**       | Comanda/Mesa, Motor de Pedidos unificado        | Atraso ou bug no lançamento por escopo maior que delivery simples                             | Já registrado como item pendente de decisão na Missão 0002 (Seção 16, item 1) — esta missão reforça o risco do ponto de vista de UX: se mantido no MVP, a tela de mesa precisa ser radicalmente mais simples que a de delivery |
| **Cozinha perde pedido em pico visual**              | Fila da Cozinha (Kanban)                        | Pedido atrasa ou é esquecido em dia de alto volume                                            | Priorização automática por tempo de espera (destaque visual), não dependente de o operador rolar a tela inteira para notar                                                                                                     |
| **Motoboy com app não otimizado o suficiente**       | Minhas Entregas                                 | Erro de entrega, atraso, frustração de quem está em movimento e com pressa                    | Tela única, sem navegação, sem necessidade de digitação — qualquer desvio disso é tratado como falha de design, não funcionalidade faltando                                                                                    |
| **Catálogo genérico confunde o perfil "mercado"**    | Catálogo (persona Sônia, Missão 0001)           | Estrutura pensada para "cardápio" fica ruim para centenas de SKUs                             | Já registrado na Missão 0002 (Seção 16) como decisão pendente — aqui reforçado: se o perfil "mercado" for adiado, a busca e o filtro do Catálogo precisam, no mínimo, já suportar volume alto sem retrabalho de tela           |
| **Excesso de notificação**                           | Central de Comunicação                          | Cliente ou equipe passam a ignorar notificações por excesso, perdendo a que realmente importa | Cada canal (Seção 2.7 da Missão 0002) tem propósito único; nenhuma notificação duplicada no mesmo canal para o mesmo evento                                                                                                    |
| **Ambiguidade em "Pronto" vs "Saiu para Entrega"**   | Experiência de Pedidos (Seção 8)                | Cliente de delivery não entende por que o status "pronto" não apareceu para ele               | Estados exibidos ao cliente já diferenciados por tipo de recebimento (Seção 8) — "pronto" só aparece como tal para retirada/mesa, delivery pula direto para "saiu para entrega"                                                |

---

## 16. Resumo Executivo

Esta missão traduziu a arquitetura funcional da Missão 0002 em experiência concreta para sete perfis de usuário, seis jornadas completas, três estruturas de navegação distintas (gestão, operação, cliente final) e um conjunto de padrões (feedback, acessibilidade, linguagem, microinterações) que qualquer Designer UI pode usar como referência direta para desenhar telas — sem que nenhuma decisão de experiência relevante tenha ficado em aberto por falta de definição.

A decisão mais importante desta missão é estrutural: **as interfaces operacionais (Cozinha, Caixa, Motoboy) são deliberadamente mais rasas e simples que o Painel de Gestão** — não é a mesma interface adaptada, é uma filosofia de navegação diferente para cada tipo de uso (Seção 4). Essa divisão é o que permite ao SmartFood cumprir a promessa de "zero treinamento" para quem executa, mantendo profundidade para quem administra.

### Decisões tomadas

- Interfaces de gestão, operação e cliente final navegam de formas fundamentalmente diferentes (Seção 4), não uma adaptação responsiva da mesma tela.
- Checkout do cliente permite fluxo como convidado — cadastro nunca é bloqueio à primeira compra.
- Toda exclusão passa por confirmação e Lixeira — nenhuma ação destrutiva é de um clique só (reforça Regra de Negócio Global 1, Missão 0002).
- Kanban, Timeline e Chat são componentes novos, específicos do food service, e nascem locais ao SmartFood (não entram ainda no `Smart UI` compartilhado).
- Tom de UX Writing diferenciado por público (comerciante vs. cliente final), mas com o mesmo princípio de nunca expor jargão técnico.

### Dúvidas restantes

1. O checklist de onboarding (Seção 3.1) deve ser dispensável/pulável em qualquer etapa, ou existem passos obrigatórios antes de publicar a vitrine?
2. Confirmação de reembolso (Seção 3.3) — quantos passos exatos? Esta missão definiu "mais burocrático de propósito", mas o número de etapas é decisão de tela (Missão futura de wireframe).
3. A Central de Notificações (ícone de sino no Header) precisa de tela própria de histórico completo já no MVP, ou um dropdown simples resolve?
4. Motoboy: o app dele é a mesma superfície do Painel Operacional (só com nav mais rasa) ou uma superfície tecnicamente separada? Esta é decisão técnica, mas a resposta de UX é clara: precisa **parecer** e **se comportar** como uma experiência dedicada, independente da resposta técnica.

### Impacto na futura Modelagem do Banco de Dados (Missão 0006)

_Nota pós-congelamento, 2026-07-11: esta subseção chamava a próxima missão de "Missão 0004" quando este documento foi escrito. Com a inserção da Missão 0004 (Modelagem do Domínio) e a renomeação da Missão 0005 (Arquitetura da Solução), a Modelagem do Banco de Dados passou a ser a Missão 0006. Título atualizado; nenhum dos pontos abaixo mudou de conteúdo — e a maior parte já foi de fato incorporada e formalizada na Missão 0004 (ver [missao-0004-modelagem-dominio.md](missao-0004-modelagem-dominio.md), Seções 2-4 e 10)._

- **Lixeira exige campo de exclusão reversível com timestamp** em todo registro crítico (produto, cupom, usuário, endereço) — não é exclusão física, é um estado.
- **Histórico de status do pedido precisa ser consultável como linha do tempo**, não só o status atual — a tela de Acompanhamento do Pedido (Timeline) e o Kanban da Cozinha dependem de histórico ordenado, não de um único campo mutável.
- **Métodos de Pagamento Salvos armazenam token, nunca dado sensível bruto** — decisão de UX (permitir salvar cartão) tem implicação direta de segurança no modelo de dados.
- **Endereços com rótulo (Casa/Trabalho/Empresa/Condomínio/Outro) e endereço padrão marcável** — já estrutural desde a Missão 0002, reforçado aqui pela tela de Perfil.
- **Notificações precisam de registro de leitura/não-leitura** por usuário, para a Central de Notificações funcionar sem reprocessar tudo a cada acesso.

### Itens que deverão ser registrados nas Review Notes

- Decisão de navegação rasa para papéis operacionais vs. navegação completa para gestão (Seção 4) — decisão estrutural com impacto direto em qualquer telas futuras.
- Kanban/Timeline/Chat como componentes locais ao SmartFood, não `Smart UI` compartilhado, por ora.
- Checkout como convidado (sem bloqueio de cadastro) — decisão de conversão com trade-off de dado de cliente coletado mais tarde.
- As quatro dúvidas restantes acima, para não se perderem antes da próxima rodada de revisão.

---

_Fim do documento — Missão 0003, Rodada 1. Rascunho aguardando revisão de PO/CTO antes de consolidação._
