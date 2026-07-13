# SmartFood — Documento Estratégico de Produto

**Missão 0001**
**Status:** Rascunho para validação
**Escopo:** Estratégia de produto (sem código, sem arquitetura técnica)

---

## 1. Visão Geral do Produto

O SmartFood é uma plataforma SaaS multiempresa (multi-tenant) de gestão comercial voltada para negócios de alimentação e varejo de proximidade — restaurantes, lanchonetes, pizzarias, hamburguerias, marmitarias, açaiterias, cafeterias, adegas, conveniências, mercados de bairro, hortifrútis, padarias e docerias.

O produto não é um "cardápio digital". É o sistema operacional comercial do estabelecimento: o lugar onde o comerciante cadastra produtos, recebe pedidos (site próprio, app, QR Code, balcão, mesa, comanda), gerencia clientes, acompanha vendas e, com o tempo, controla operação, financeiro e fidelização — tudo sob um domínio, uma marca e um painel que pertencem ao comerciante, não à plataforma.

A analogia estrutural é o Shopify: uma infraestrutura compartilhada e robusta por trás, e uma vitrine e experiência 100% dedicadas a cada cliente na frente. Cada empresa dentro do SmartFood é um "tenant" isolado — próprio subdomínio (e futuramente domínio próprio), próprios dados, próprios clientes, próprio catálogo, própria identidade visual — competindo e operando como se tivesse seu próprio sistema exclusivo, mesmo compartilhando a mesma base tecnológica.

O modelo de receita é assinatura mensal (SaaS puro), não comissão sobre vendas. Isso alinha o incentivo do SmartFood ao sucesso do lojista: quanto mais ele vende, melhor para os dois lados, sem que o SmartFood "torça" para cobrar mais por transação.

---

## 2. Missão

**Dar a qualquer comerciante de alimentação e varejo de proximidade — independentemente do tamanho ou da equipe técnica que ele tem — as mesmas ferramentas de venda, gestão e fidelização que hoje só grandes redes conseguem pagar para construir sob medida.**

O problema central que resolvemos: o pequeno e médio comerciante do setor de food service hoje opera com um Frankenstein de ferramentas desconectadas — grupo de WhatsApp para pedido, marketplace de delivery que cobra comissão alta e não entrega dados do cliente, cardápio digital avulso, caderno ou planilha para controle, e talvez uma maquininha de cartão isolada de tudo isso. Nenhuma dessas peças conversa entre si. O comerciante não é dono da relação com seu próprio cliente, não tem dados para decidir nada, e paga comissão sobre cada venda que faz — inclusive nas vendas presenciais, em muitos apps.

O SmartFood resolve isso unificando canal de venda, gestão operacional e relacionamento com o cliente em um único sistema, e devolvendo ao comerciante a posse dos seus dados, sua marca e sua margem.

---

## 3. Visão (Horizonte de 5 Anos)

Em cinco anos, o SmartFood deve ser reconhecido como a plataforma de referência para comércio de alimentação e varejo de proximidade no Brasil (e preparado para expansão latino-americana), com:

- **Milhares de estabelecimentos ativos**, de food trucks a redes regionais de 20+ unidades, todos operando sob a mesma base tecnológica, cada um com sua identidade preservada.
- **Um ecossistema, não apenas um produto**: marketplace de integrações (maquininhas, ERPs contábeis, plataformas de delivery terceiras, ferramentas de marketing), API pública, e um app único do consumidor que permite redescobrir estabelecimentos SmartFood próximos — sem se tornar um marketplace concorrente dos próprios clientes, e sim uma vitrine adicional opcional.
- **Inteligência de dados como diferencial competitivo real**: recomendações de precificação, previsão de demanda, sugestões de combos e campanhas de retenção geradas automaticamente a partir do histórico de vendas de cada loja — algo que hoje só grandes redes têm.
- **Presença de mercado que obriga concorrentes a reagir**, ocupando o espaço que hoje é fragmentado entre "cardápio digital" (ex: Cardápio Web, Anota AI), "POS" (ex: Saipos, Consumer) e "marketplace com comissão" (ex: iFood, Rappi) — sendo simultaneamente melhor que os três em integração.
- **Um produto que o comerciante recomenda organicamente**, porque perceptivelmente aumentou o faturamento dele e reduziu o tempo que ele gasta administrando o negócio.
- **Modelo financeiro saudável**: SaaS previsível, com upsell natural de planos conforme o negócio do cliente cresce, e churn baixo por causa do lock-in positivo (o comerciante não quer perder seu histórico de clientes e vendas).

---

## 4. Proposta de Valor

**Por que um comerciante escolheria o SmartFood em vez de continuar com WhatsApp + iFood + planilha, ou trocar para um concorrente direto?**

1. **Dono do próprio negócio digital.** Site e domínio próprios, base de clientes própria, dados que não pertencem a um marketplace terceiro que pode mudar as regras do jogo a qualquer momento.
2. **Sem comissão por venda.** Mensalidade previsível. Vender mais não custa mais — o que muda completamente a decisão de investir em marketing e promoções.
3. **Um único painel para tudo.** Site, QR Code de mesa, pedido de balcão, delivery, retirada — sem precisar logar em cinco sistemas diferentes ou reconciliar pedidos manualmente entre canais.
4. **Setup rápido, sem equipe técnica.** Um comerciante sozinho, no celular, consegue colocar a loja no ar em menos de um dia — sem precisar contratar agência, programador ou "sobrinho que entende de internet".
5. **Experiência do cliente final tão boa quanto a de grandes redes.** Pedido rápido, rastreável, com histórico e recompra fácil — o que hoje só cardápios de rede corporativa oferecem.
6. **Cresce junto com o negócio.** Começa simples (cardápio + pedido online) e evolui para gestão completa (estoque, comandas, fidelidade, múltiplas unidades) sem trocar de sistema.

---

## 5. Personas

### 5.1 Marcos — Dono de Pizzaria de Bairro

- **Perfil:** 42 anos, pizzaria própria há 8 anos, 1 loja, atende delivery e salão.
- **Equipe:** esposa cuida do caixa, 2 entregadores, 1 pizzaiolo.
- **Tecnologia:** usa WhatsApp Business + iFood. Já testou um cardápio digital básico e abandonou por ser "mais uma coisa pra atualizar".
- **Dor principal:** sexta e sábado à noite o WhatsApp trava de mensagem, pedidos se perdem, e a comissão do iFood "come" boa parte da margem da pizza.
- **O que precisa do SmartFood:** um cardápio online com pedido direto (sem comissão), que funcione bem no fluxo de pico de sexta/sábado, e que ele consiga atualizar sozinho pelo celular (preço, sabor esgotado, promoção do dia).
- **Critério de sucesso:** reduzir dependência do iFood sem perder volume de pedido.

### 5.2 Renata — Dona de Marmitaria

- **Perfil:** 35 anos, marmitaria com venda por assinatura semanal e avulsa, atende empresas da região e clientes de bairro.
- **Equipe:** ela e mais uma funcionária na cozinha; entrega terceirizada (motoboy avulso).
- **Tecnologia:** controla pedidos e assinaturas em planilha do Excel e agenda de papel; recebe pedido por WhatsApp e Instagram.
- **Dor principal:** erra pedidos recorrentes (esquece de quem pediu semanal), não tem visão clara de quantas marmitas precisa produzir no dia seguinte, e cobra manualmente cada cliente.
- **O que precisa do SmartFood:** cardápio semanal com pedido antecipado, gestão de assinatura/recorrência, e um resumo diário de "quanto produzir amanhã" baseado nos pedidos já confirmados.
- **Critério de sucesso:** parar de errar pedido e ganhar previsibilidade de produção.

### 5.3 Diego — Hamburgueria Artesanal (delivery + salão)

- **Perfil:** 29 anos, hamburgueria "de autor", forte em Instagram, público jovem, ticket médio alto.
- **Equipe:** 4 pessoas, cozinha aberta, salão pequeno com algumas mesas.
- **Tecnologia:** já usa cardápio digital e QR Code na mesa, mas de sistemas diferentes e desconectados do delivery. Investe em tráfego pago para Instagram, mas não sabe medir retorno.
- **Dor principal:** a experiência de marca que ele cultiva no Instagram se perde no momento do pedido (cardápio genérico, sem a cara da marca); não consegue rastrear se o cliente que viu o anúncio virou pedido.
- **O que precisa do SmartFood:** personalização visual forte da vitrine (cores, fotos, identidade), QR Code de mesa integrado ao mesmo sistema do delivery, e dados básicos de origem do pedido para justificar investimento em marketing.
- **Critério de sucesso:** vitrine com a cara da marca e visibilidade de que canal de aquisição funciona.

### 5.4 Sônia — Mercado de Bairro / Conveniência

- **Perfil:** 55 anos, mercado de bairro com forte relação de proximidade e fiado informal com clientes antigos, filho de 24 anos ajuda com tecnologia.
- **Equipe:** ela, o filho, e 2 balconistas.
- **Tecnologia:** PDV físico de mercado (para o caixa), sem presença digital nenhuma; recebe pedido de entrega por telefone.
- **Dor principal:** catálogo com centenas de itens (mercearia, hortifrúti, limpeza), o que torna qualquer sistema de cardápio "de restaurante" inadequado; precisa de categorização robusta e busca rápida, não apenas uma lista de 15 pratos.
- **O que precisa do SmartFood:** catálogo com categorias e subcategorias, busca por produto, controle simples de estoque (sinalizar "em falta"), e pedido para entrega em bairro com raio de cobertura definido.
- **Critério de sucesso:** conseguir vender online sem contratar ninguém novo para tocar isso.

### 5.5 Camila — Cafeteria de Especialidade

- **Perfil:** 31 anos, cafeteria de bairro nobre, forte em experiência de loja, público fiel que vai 3x por semana.
- **Equipe:** 3 baristas, sem delivery próprio (usa apenas parcerias pontuais).
- **Tecnologia:** usa um app de fidelidade genérico (cartão de carimbo digital) desconectado de tudo, e caderno de comandas físico no balcão.
- **Dor principal:** não tem como identificar e recompensar o cliente recorrente de forma integrada à venda; comanda física gera fila e erro de pedido em horário de pico matinal.
- **O que precisa do SmartFood:** pedido antecipado para retirada (evitar fila da manhã), programa de fidelidade nativo (pontos/recompensas ligados à conta do cliente), e comanda digital rápida no balcão.
- **Critério de sucesso:** reduzir fila da manhã e aumentar frequência de clientes recorrentes.

### 5.6 (Persona adicional) Roberto — Rede Regional de Açaiteria (multi-loja)

- **Perfil:** 38 anos, dono de 6 unidades de açaiteria em uma mesma cidade, cresceu de 1 para 6 lojas em 3 anos.
- **Equipe:** um gerente por loja, mais uma pessoa de "escritório" cuidando de compras e financeiro central.
- **Tecnologia:** cada loja opera de forma isolada, com cardápios e preços divergentes entre unidades — dor de cabeça para manter padrão de marca.
- **Dor principal:** falta de visão consolidada: não sabe qual loja vende mais de qual produto, não consegue atualizar um preço em todas as lojas de uma vez.
- **O que precisa do SmartFood:** gestão multi-loja dentro da mesma conta, catálogo mestre com possibilidade de variação por unidade, e relatório consolidado por loja.
- **Critério de sucesso:** administrar as 6 lojas com o esforço que hoje gasta administrando 2.
- _(Esta persona sinaliza o caminho natural de upsell para planos Enterprise — ver Roadmap.)_

---

## 6. Dores do Mercado

**Operacionais**

- Pedidos recebidos por múltiplos canais (WhatsApp, telefone, Instagram, marketplace) sem centralização — retrabalho e erro de digitação.
- Falta de visão de estoque em tempo real; item "esgotado" continua sendo vendido.
- Ausência de previsão de demanda — comerciante compra insumo "no olho".
- Fila e erro de pedido em horário de pico por dependência de processo manual (papel, caderno, comanda física).
- Falta de padronização entre unidades em negócios com mais de uma loja.

**Comerciais / Financeiras**

- Comissão alta de marketplaces de delivery (historicamente entre 12% e 30%) corroendo a margem, inclusive em pedidos que o próprio comerciante já teria conquistado organicamente.
- Marketplaces retêm os dados do cliente final — o comerciante não sabe quem comprou, não pode remarketing, não constrói base própria.
- Dificuldade de precificar corretamente considerando insumo, embalagem, taxa de entrega e comissão simultaneamente.
- Sazonalidade e picos (fim de semana, datas comemorativas) sem ferramenta de planejamento.

**Tecnológicas**

- Sistemas de cardápio digital "engessados": pouca personalização visual, sensação de "mais um site igual a todos os outros".
- Ferramentas desconectadas entre si — cardápio, PDV, fidelidade e delivery em sistemas diferentes que não trocam dados.
- Curva de aprendizado alta em sistemas de POS tradicionais voltados a redes grandes, inadequados para o dono de uma loja só.
- Dependência de suporte técnico terceiro (agência, freelancer) para qualquer alteração simples no site.

**Relacionamento com o Cliente Final**

- Sem programa de fidelidade nativo integrado à venda — recompensa manual ("no papel") ou inexistente.
- Sem histórico de pedido acessível ao cliente para recompra rápida.
- Comunicação de status de pedido (confirmado, em preparo, saiu para entrega) inconsistente ou inexistente fora de marketplaces grandes.

**Gestão do Negócio como um Todo**

- Falta de indicadores simples (ticket médio, produto mais vendido, horário de pico) acessíveis sem precisar "garimpar" planilha.
- Dificuldade de abrir uma segunda unidade porque tudo foi montado de forma artesanal e não replicável.

---

## 7. Oportunidades

- **Unificação real de canais** (site, app, QR Code, balcão, mesa, comanda, delivery) em uma única fonte de verdade de pedidos e estoque — a maior dor não resolvida por nenhum concorrente de forma completa.
- **Modelo sem comissão** como diferenciador direto contra marketplaces, atraindo comerciantes cansados de perder margem.
- **Dados como produto**: transformar histórico de vendas em recomendações acionáveis (o que promover, quando, para quem) — hoje inacessível para o pequeno comerciante.
- **Onboarding radicalmente simples**, competindo com a percepção de que "sistema de gestão é complicado" — permitindo autosserviço completo sem suporte humano para os planos iniciais.
- **Fidelização nativa e barata**, algo que hoje exige contratar uma ferramenta à parte (e integrá-la manualmente).
- **Personalização visual de vitrine** como resposta direta à dor de marcas fortes (hamburguerias artesanais, cafeterias de especialidade) que hoje se sentem "genéricas" em cardápios digitais padronizados.
- **Multiloja nativo desde o desenho do produto**, capturando o comerciante no momento exato em que ele cresce de 1 para 2+ unidades — o ponto em que ferramentas artesanais (planilha, grupo de WhatsApp) quebram.
- **Catálogo flexível o suficiente para variar de "15 pratos" (restaurante) a "800 SKUs" (mercado)**, um requisito que sistemas focados só em "cardápio de restaurante" não atendem bem.
- **Integração com meios de pagamento e maquininhas** como ponto de conveniência que reduz a fricção de trocar de sistema.
- **Posicionamento de marca como parceiro do comerciante**, não como intermediário que compete pela atenção do cliente final (diferente de marketplaces que também vendem publicidade para concorrentes do mesmo comerciante).

---

## 8. Diferenciais Competitivos

1. Sem comissão sobre vendas — modelo 100% assinatura.
2. Site e domínio próprios para cada estabelecimento (identidade real, não uma página dentro de um marketplace).
3. Um único painel para todos os canais de venda (site, app, QR Code, balcão, mesa, delivery, retirada).
4. Onboarding autosserviço — loja no ar sem depender de suporte técnico ou agência.
5. Personalização visual real da vitrine (cores, fotos, banners, identidade de marca).
6. Catálogo flexível: de cardápio pequeno (restaurante) a catálogo extenso com categorias profundas (mercado, conveniência).
7. Gestão de comandas e mesas nativa, sem sistema terceiro plugado.
8. QR Code de mesa integrado ao mesmo pedido/estoque do delivery (fonte única de verdade).
9. Programa de fidelidade nativo, sem precisar contratar ferramenta à parte.
10. Histórico de pedidos acessível ao cliente final, com recompra em um clique.
11. Notificação de status do pedido (confirmado / em preparo / saiu para entrega / entregue) nativa.
12. Multiloja nativo desde o MVP avançado — catálogo mestre com variação por unidade.
13. Relatórios consolidados entre lojas para redes pequenas e médias.
14. Painel com indicadores simples e acionáveis (ticket médio, produto mais vendido, horário de pico) sem precisar de planilha.
15. Alertas de estoque (produto esgotado marcado automaticamente como indisponível na vitrine).
16. Precificação assistida considerando insumo, embalagem e taxa de entrega.
17. Recomendações automáticas de combos e promoções baseadas em histórico de vendas.
18. Previsão simples de demanda para apoiar compra de insumo (ex: "amanhã, com base no padrão, espere X pedidos").
19. Suporte a assinatura/recorrência de pedidos (marmitarias, clubes de assinatura).
20. Gestão de horário de funcionamento e pausa automática de vendas (ex: loja fecha e cardápio pausa automaticamente).
21. Configuração de área de entrega por raio ou bairro, com taxa dinâmica.
22. Múltiplos métodos de pagamento integrados (Pix, cartão, dinheiro na entrega) sem sistemas apartados.
23. App único do consumidor para redescoberta de lojas SmartFood próximas (opcional, sem competir com a vitrine própria do lojista).
24. API pública e integrações abertas (contabilidade, maquininha, marketing) — não uma ilha fechada.
25. Planos que crescem com o negócio, sem necessidade de trocar de sistema ao expandir.
26. Suporte e materiais em português, pensados para o perfil de comerciante brasileiro de pequeno/médio porte.
27. Interface pensada para ser operada no celular, não apenas no computador (o comerciante real gerencia a loja do bolso).
28. Segurança e isolamento de dados por tenant (dados de um cliente jamais visíveis a outro).
29. Deploy e disponibilidade como plataforma sempre atualizada — o comerciante nunca precisa "instalar versão nova".
30. Time de produto que estuda o setor de food service especificamente, não um sistema de gestão genérico adaptado.
31. Comunicação de marca e experiência do cliente final tão cuidadas quanto a do próprio comerciante — o SmartFood não "carimba" a experiência com uma marca concorrente por cima.
32. Modelo de precificação transparente e previsível, sem taxas escondidas por transação.

---

## 9. Benchmark Competitivo

| Concorrente                                         | Pontos Fortes                                                                                            | Pontos Fracos                                                                                                                                      | Oportunidade para o SmartFood                                                                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iFood / Rappi (marketplaces)**                    | Alcance de novos clientes, confiança do consumidor final, logística própria de entrega em muitas cidades | Comissão alta corrói margem; comerciante não é dono da relação com o cliente; concorrência direta dentro do próprio app (anúncios de concorrentes) | Ser o canal "próprio" complementar sem comissão — o comerciante usa marketplace para aquisição pontual, mas migra a relação recorrente para o canal SmartFood |
| **Saipos**                                          | Forte em POS/gestão para redes maiores, funcionalidades operacionais robustas                            | Curva de aprendizado alta, percepção de sistema "pesado" para negócio pequeno, pouca ênfase em vitrine/marca própria                               | Ser tão robusto operacionalmente quanto, mas com onboarding e UX pensados para quem opera sozinho ou com equipe enxuta                                        |
| **Cardápio Web / Anota AI**                         | Simplicidade, foco em cardápio digital + pedido via WhatsApp, adoção fácil                               | Limitado a "cardápio", pouca profundidade em gestão, comandas e multiloja; personalização visual restrita                                          | Entregar a mesma simplicidade de entrada, mas com profundidade de gestão que cresce junto com o negócio                                                       |
| **Consumer**                                        | Bom em fidelidade e CRM para redes                                                                       | Foco mais corporativo/enterprise, menos acessível para o pequeno comerciante autônomo                                                              | Trazer fidelidade nativa "de fábrica" mesmo nos planos iniciais, sem precisar ser uma rede grande para acessar                                                |
| **Shopify**                                         | Referência em multi-tenant, domínio próprio, ecossistema de apps, altíssima confiabilidade técnica       | Não é vertical para food service (sem comanda, mesa, cozinha, delivery nativo) — exige apps de terceiros para suprir                               | Ser o "Shopify vertical" de food service: a mesma filosofia de posse da loja, mas com tudo que o setor de alimentação precisa nativamente                     |
| **Toast POS / Square (referências internacionais)** | Ecossistema completo (hardware + software), forte em EUA, integração POS-delivery-fidelidade madura      | Pouco adaptado à realidade de pagamento e operação do pequeno comerciante brasileiro (Pix, maquininhas locais, informalidade de parte do setor)    | Trazer o nível de integração desses produtos, mas desenhado para a realidade de pagamento, tributação e operação brasileira                                   |
| **Lightspeed Restaurant**                           | Forte em gestão de estoque e relatórios para restaurantes de médio/grande porte                          | Custo e complexidade desproporcionais para o pequeno comerciante; pouco foco em delivery/vitrine própria                                           | Entregar profundidade de estoque/relatório de forma proporcional ao tamanho do negócio, sem sobrecarregar o pequeno comerciante                               |
| **GloriaFood**                                      | Cardápio digital gratuito de entrada, fácil adoção inicial                                               | Modelo "freemium" limitado empurra para upsell rápido; poucas funcionalidades de gestão além do pedido                                             | Oferecer um caminho de crescimento real (não apenas cardápio) dentro do mesmo produto, sem o comerciante sentir que "estourou o teto" logo no início          |

**Leitura estratégica do benchmark:** o mercado está fragmentado em três arquétipos — marketplace (traz cliente, cobra comissão, não dá dados), cardápio digital (simples, mas raso) e POS/gestão (robusto, mas complexo e caro). Nenhum concorrente direto une os três com a filosofia de "loja própria" do Shopify aplicada a food service. Esse é o espaço em branco que o SmartFood ocupa.

---

## 10. MVP (Versão Comercial Inicial)

O critério de corte do MVP é: **resolver completamente a dor #1 (canais de pedido fragmentados) e a dor #2 (comerciante não é dono da própria vitrine/dados)**, sem tentar resolver tudo de uma vez. Cada item abaixo é justificado pelo impacto direto nessas duas dores, validado pelas personas descritas na Seção 5.

### Incluído no MVP

1. **Cadastro e onboarding autosserviço da loja** (nome, categoria, identidade visual básica, horário de funcionamento).
   _Justificativa:_ sem isso não existe produto; é a porta de entrada e precisa ser tão simples quanto o Marcos (persona 5.1) conseguir fazer sozinho no celular em uma noite.

2. **Site/vitrine próprio com subdomínio** (ex: `pizzariadomarcos.smartfood.com`).
   _Justificativa:_ entrega a promessa central de "loja própria" desde o dia um, mesmo antes de domínio próprio existir como opção paga.

3. **Catálogo de produtos com categorias, variações (tamanho/sabor) e controle simples de disponibilidade** (marcar como esgotado).
   _Justificativa:_ atende tanto o cardápio pequeno (pizzaria, hamburgueria) quanto sinaliza o caminho para catálogos maiores (mercado) nas versões seguintes.

4. **Pedido online direto pelo site** (delivery e retirada), com carrinho, taxa de entrega por área e checkout com Pix/cartão.
   _Justificativa:_ é o núcleo da proposta de valor "sem comissão" — sem pedido funcional, não há motivo para o comerciante migrar.

5. **QR Code de mesa** com pedido vinculado à mesma base de catálogo/estoque do delivery.
   _Justificativa:_ resolve a dor imediata de Diego (persona 5.3) e Camila (persona 5.5), com esforço de desenvolvimento baixo por reutilizar o motor de pedido já construído para o delivery.

6. **Painel de pedidos em tempo real** (recebido → em preparo → pronto/saiu para entrega → concluído).
   _Justificativa:_ substitui diretamente o caos de WhatsApp/comanda de papel — é a dor operacional mais citada em todas as personas.

7. **Cadastro automático de cliente final a partir do pedido** (nome, telefone, endereço, histórico).
   _Justificativa:_ é o que devolve ao comerciante a posse dos dados do cliente — diferencial direto contra marketplaces.

8. **Indicadores básicos no painel** (pedidos do dia, ticket médio, produto mais vendido).
   _Justificativa:_ entrega valor percebido imediato sem exigir construção de um módulo de BI completo.

9. **Notificação de status do pedido para o cliente** (WhatsApp/SMS/e-mail simples).
   _Justificativa:_ eleva a experiência do cliente final ao nível de marketplaces grandes, com custo de desenvolvimento relativamente baixo.

10. **Um único plano pago simples de assinatura mensal, sem comissão.**
    _Justificativa:_ o modelo de negócio precisa estar provado desde o MVP; múltiplos planos só fazem sentido depois que houver funcionalidades suficientes para diferenciá-los (ver Roadmap).

### Explicitamente fora do MVP (e por quê)

- **Multiloja / gestão consolidada de redes** — importante (persona Roberto, 5.6), mas é um requisito de comerciante que já está maduro; não é o que faz o MVP validar o produto com o comerciante de loja única, que é a maioria do mercado endereçável inicial.
- **Programa de fidelidade nativo** — alto valor percebido, mas depende de volume de pedidos recorrentes acumulado para fazer sentido; melhor entregue na v2 já com dados reais de uso.
- **Controle de estoque de insumo (ficha técnica, baixa automática de ingrediente)** — complexidade alta, risco de atrasar o lançamento; a "disponibilidade" simples (item esgotado sim/não) do MVP já resolve 80% da dor com 20% do esforço.
- **App mobile nativo do consumidor** — o site responsivo cobre a mesma necessidade no MVP; app nativo exige investimento de manutenção (duas plataformas) que só se justifica com base de usuários maior.
- **Recomendações automáticas / IA de precificação e demanda** — depende de massa de dados histórica que só existirá depois de meses de uso real da base de comerciantes.
- **Integrações com marketplaces terceiros (importar pedido do iFood, por exemplo)** — alto valor, mas depende de parcerias/APIs externas fora do controle direto do roadmap inicial.

---

## 11. Roadmap

### MVP (Lançamento Comercial)

Ver Seção 10 na íntegra. Foco: **provar que um comerciante consegue substituir WhatsApp + planilha por um único canal próprio de pedido, sem comissão, em autosserviço.**

### Versão 2.0 — Fidelização e Profundidade Operacional

- Programa de fidelidade nativo (pontos, cupons, recompensas por recorrência).
- Comandas completas para salão (múltiplas mesas, divisão de conta, comanda por garçom).
- Suporte a pedidos por assinatura/recorrência (marmitarias, clubes).
- Controle de estoque com alerta de nível mínimo e ficha técnica simples.
- Relatórios avançados (curva de vendas por período, comparação semana a semana, produtos parados).
- Domínio próprio configurável pelo comerciante (`.com.br` próprio, não mais só subdomínio).
- Segundo nível de plano pago, diferenciando por funcionalidade (ex: plano básico = pedido + vitrine; plano avançado = + fidelidade + comanda + relatórios).

_Justificativa da sequência:_ a v2.0 ataca a segunda camada de dores — recorrência de cliente e operação de salão — que só faz sentido resolver depois que o comerciante já confia no canal de pedido do MVP.

### Versão 3.0 — Multiloja e Inteligência de Dados

- Gestão multiloja nativa (catálogo mestre + variação por unidade, painel consolidado).
- Relatórios comparativos entre lojas de uma mesma rede.
- Recomendações automáticas de combos, promoções e precificação baseadas em histórico (primeira camada de IA aplicada a dados reais acumulados desde o MVP).
- Previsão simples de demanda para apoiar compra de insumo.
- Integrações abertas via API pública (contabilidade, maquininhas de cartão, ferramentas de marketing).
- App único do consumidor para redescoberta de lojas SmartFood próximas (opcional para o lojista, sem substituir a vitrine própria).

_Justificativa da sequência:_ multiloja e inteligência de dados exigem, respectivamente, um comerciante que já cresceu (validando o produto desde o MVP) e uma base histórica de dados que só existe depois de tempo de operação real — não faz sentido antecipar.

### Versão Enterprise — Redes e Operações Complexas

- Planos sob medida para redes de dezenas de unidades (franquias, redes regionais).
- Gestão de permissões granular por papel (gerente de loja, financeiro central, operador de caixa).
- SLA de suporte dedicado e onboarding assistido (fora do autosserviço padrão).
- Integrações profundas com ERPs corporativos e sistemas fiscais de maior porte.
- Customizações de marca/white-label para redes que exigem experiência 100% proprietária.
- Central de compras/negociação consolidada entre unidades da mesma rede (funcionalidade exclusiva do porte Enterprise).

_Justificativa da sequência:_ Enterprise é o topo natural da pirâmide de upsell — só se sustenta depois que existir uma base relevante de contas médias (v3.0) migrando organicamente para redes maiores, como sinalizado pela persona Roberto (5.6).

---

## Observação sobre Infraestrutura de Deploy (não técnica)

Ainda que esta missão seja estritamente estratégica e não entre em arquitetura, fica registrado como premissa de produto — a ser detalhada tecnicamente em missão futura — que o SmartFood deve ser projetado desde o início para **deploy automatizado em ambientes cloud modernos** (Vercel, Railway, Render, Coolify ou equivalentes), sem dependência de execução local. Toda configuração de ambiente deve ser documentada, garantindo que qualquer novo membro de equipe ou ambiente de homologação suba a aplicação sem conhecimento tácito não escrito. Este requisito não gera decisões de produto nesta missão, mas condiciona todas as futuras.

---

_Fim do documento — Missão 0001._
