# SmartFood — Review Notes

Histórico de revisões e decisões de cada missão. Complementa o documento principal de cada missão — quando surgir a dúvida "por que decidimos X", a resposta está aqui, não precisa ser re-discutida do zero.

---

## Missão 0002 — Arquitetura Funcional

### Rodada 1 (rascunho inicial)

**Data:** 2026-07-11
**Autor do rascunho:** Claude
**Resultado:** Documento entregue com 10 domínios, jornadas, fluxos operacionais, mapa de dependência, 4 fases, MVP funcional, 19 funcionalidades futuras, 32 pontos de inovação e análise crítica com 6 itens pendentes.

### Rodada 2 (CTO Review)

**Data:** 2026-07-11
**Revisor:** Usuário (papel de CTO/Product Owner)
**Veredito:** Aprovado como conceito, não congelado — pedida segunda rodada de refinamento.

**Decisões tomadas nesta rodada, com o porquê:**

1. **Separar Pagamentos de Financeiro.**
   Por quê: a v1 misturava "processar a cobrança de um pedido" (evento a evento, tempo real) com "entender o resultado financeiro da empresa" (consolidação periódica). São responsáveis e ritmos diferentes.
   Trade-off aceito: cria necessidade de reconciliação entre os dois domínios — risco explicitamente registrado na Análise Crítica (v2, Seção 16) para ser tratado com cuidado na Missão 0004.

2. **Criar domínio Experiência do Cliente.**
   Por quê: Cadastro, Login, Perfil, Favoritos, Histórico, Avaliação e Fidelidade pertenciam à mesma pessoa mas estavam espalhados entre Atendimento, Comercial e Configurações na v1. Centralizar facilita raciocinar sobre dado pessoal (LGPD) como um domínio único no futuro.

3. **Criar módulo dedicado de Endereços, desenhado para reuso.**
   Por quê: em vez de o endereço viver só dentro do Checkout, virou peça reutilizável — usada também por Área de Entrega (cálculo de cobertura) e por funcionalidades futuras como "Modo Presente" (entrega a terceiro).

4. **Criar domínio Central de Comunicação, consolidando 3 pontos dispersos.**
   Por quê: Notificação de Status (estava em Atendimento), Canais de Notificação (estava em Configurações) e Notificação Externa (estava em Integrações) faziam, na prática, a mesma coisa em três lugares diferentes. Consolidado também porque será o canal de saída natural para Agentes de IA no futuro (Smart AI Guide).

5. **Criar domínio Configuração da Loja.**
   Por quê: identidade visual (estava em Marketing), horário e área de entrega (estavam em Operacional) e domínio próprio (estava em Administração) respondiam à mesma pergunta de negócio — "quem essa empresa é e como ela opera" — fragmentada em 3 domínios diferentes.

6. **Renomear Integrações para Ecossistema.**
   Por quê: "Integrações" sugeria só conexão técnica ponto a ponto. "Ecossistema" comunica a ambição real (parceiros, marketplace de apps, webhooks), que é maior que uma lista de integrações.

7. **Tratar Arquivos, Auditoria e Lixeira como módulos transversais, não domínios.**
   Por quê: não respondem à pergunta de um público específico do negócio — são infraestrutura chamada por qualquer domínio. Vira domínio próprio infla a lista sem necessidade real; vira serviço compartilhado evita duplicação (o mesmo problema que a criação da Central de Comunicação já resolveu para mensagens).
   Risco registrado: só funciona se a Missão 0005 (Arquitetura da Solução) de fato implementar como serviço compartilhado — risco de um desenvolvedor reimplementar localmente, dentro de um domínio, foi registrado explicitamente na Análise Crítica. _[Nota pós-congelamento, 2026-07-11: referência de nome de missão futura atualizada para refletir o roadmap oficial — não é revisão de decisão.]_

8. **"Marketplace" passou a ter dois sentidos — resolvido com nomes diferentes.**
   Por quê: o pedido do usuário usava "Marketplace" tanto para o conceito de loja de plugins/apps quanto (implicitamente, herdado da v1) para sincronização de pedido com iFood/Rappi. Resolvido nomeando explicitamente "Marketplace de Aplicativos" (Ecossistema) vs. "Sincronização com Marketplaces de Pedido" (também Ecossistema, mas conceito diferente) para nunca serem confundidos em documentação futura.

9. **RBAC de tela (Caixa/Cozinha/Motoboy) como especialização de Operador, não papel novo.**
   Por quê: mantém os 7 papéis base do Smart Security Guide intactos (consistência com a Smart Platform) enquanto ainda permite que a tela do SmartFood use nomes que o comerciante de food service reconhece naturalmente.

10. **Adição de Eventos do Sistema, Regras de Negócio Globais, Matriz de Permissões e Linguagem Ubíqua como seções novas.**
    Por quê: pedido explícito do usuário para aumentar a consistência arquitetural do documento como referência definitiva para as próximas missões — não são funcionalidades novas, são especificação mais precisa do que já existia.

**Status ao final da Rodada 2:** documento pronto para congelamento, aguardando confirmação final do usuário antes de a Missão 0003 começar.

### Congelamento

**Data:** 2026-07-11
**Confirmado por:** usuário, ao abrir a Missão 0003 referenciando explicitamente "Missão 0002 (Arquitetura Funcional - versão congelada)".
**Status final:** ✅ CONGELADA — versão oficial. Nenhuma alteração retroativa sem nova rodada de revisão explícita.

---

## Como usar este documento

Cada missão ganha sua própria seção acima, na ordem em que acontece. Registrar sempre: data, o que mudou, o porquê (não só o quê), e qualquer trade-off ou risco aceito conscientemente. Se uma decisão for revertida em uma missão futura, registrar aqui também — o valor deste documento é preservar a evolução do pensamento, inclusive quando ele muda de direção.
