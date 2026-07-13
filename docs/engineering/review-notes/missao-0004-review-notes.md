# SmartFood — Review Notes — Missão 0004 (Modelagem do Domínio)

## Rodada 1 (Draft)

**Data:** 2026-07-11
**Resultado:** Documento entregue com 13 domínios classificados (Core/Supporting/Generic), 28 entidades, 11 value objects, 11 agregados, 16 eventos de domínio, regras por criticidade/volatilidade, ciclo de vida de 6 entidades, mapa de dependência e glossário estendido.

## Rodada 2 (CTO Review)

**Data:** 2026-07-11
**Revisor:** Usuário (papel de CTO/Product Owner)
**Veredito:** Aprovado o conceito, com 10 refinamentos pontuais para elevar a robustez do modelo antes de congelar. Nenhuma alteração na arquitetura já aprovada na Rodada 1 — apenas complementos.

**Refinamentos incorporados, com o porquê:**

1. **Nota Empresa vs. Tenant.**
   Por quê: os dois termos eram usados como sinônimos sem nunca ter sido dito explicitamente que são o mesmo conceito hoje — e sem alertar que a Smart Platform pode, no futuro, separá-los (ex: um Tenant guarda-chuva com várias Empresas). Registrado como equivalência **local ao SmartFood**, não regra universal.

2. **Configuração Global da Empresa.**
   Por quê: parâmetros como timezone, idioma, moeda, feature flags, integrações habilitadas e plano contratado não tinham lugar formal no modelo — viviam implícitos em Configuração da Loja/Administração (Missão 0002). Modelado como parte do agregado Empresa, sem criar domínio ou tela nova (mantendo o escopo contido, como pedido).

3. **Pedido como snapshot completo, não só de preço.**
   Por quê: a Rodada 1 já tinha a ideia (preço congelado no Item do Pedido), mas não deixava explícito que nome, descrição, imagem e categoria também são congelados. Elevado de "regra implícita" para regra explícita e, adicionalmente, para Invariante (Seção 11) — dado o custo alto de um bug aqui (pedido histórico "mudando sozinho").

4. **Canal de Venda como conceito de domínio.**
   Por quê: o Motor de Pedidos já unifica canais desde a Missão 0002, mas nenhum documento anterior formalizava "canal" como um conceito nomeado. Modelado como Value Object simples, embutido no Pedido.

5. **Reclassificação de IA em três estágios.**
   Por quê: a Rodada 1 já apontava a evolução de Generic para Supporting, mas o usuário quis deixar explícito um terceiro estágio (potencialmente Core), condicionado a dado proprietário suficiente — evita subestimar o potencial de diferenciação de longo prazo da IA.

6. **Regra explícita: Pagamento pertence a um Pedido, mas Pedido pode existir sem Pagamento confirmado.**
   Por quê: já era verdade implícita no ciclo de vida do Pedido (estado "Aguardando Pagamento") e na separação dos agregados Pedido/Pagamento, mas nunca tinha sido escrita como regra/invariante independente — reduz risco de alguém, numa implementação futura, assumir erroneamente que todo Pedido só existe depois do Pagamento confirmado.

7. **Eventos negativos de domínio.**
   Por quê: os 16 eventos da Rodada 1 cobriam só o caminho feliz. Eventos como `PAGAMENTO_EXPIRADO`, `ESTOQUE_INSUFICIENTE`, `LOJA_PAUSADA`, `ENTREGA_ATRASADA` e `PEDIDO_EXPIRADO` são a base para observabilidade e automação futuras — sem eles, o sistema só "sabe" reagir ao que deu certo.

8. **Seção "Invariantes do Domínio".**
   Por quê: havia uma lacuna hierárquica entre "Regras de Negócio" (Seção 6, que inclui regras que podem virar configuráveis) e o que de fato nunca pode ser violado. Criar uma seção separada evita que uma regra estrutural (ex: "Pedido pertence a uma única Empresa") seja tratada, no futuro, como candidata a exceção configurável.

9. **Seção "Entidades Futuras".**
   Por quê: durante a modelagem, conceitos como Gift Card, Combo, Receita/Ficha Técnica, Fornecedor, Campanha e Clube de Assinatura apareceram naturalmente mas estavam fora do escopo do MVP. Registrar como roadmap evita tanto (a) esquecer a ideia, quanto (b) modelá-la prematuramente sem necessidade real.

10. **Fechamento do processo:** criação deste arquivo, atualização do status do documento principal para CONGELADA, e atualização do índice (`docs/README.md`).

**Decisão de posicionamento estrutural:** as duas seções novas (Invariantes, Entidades Futuras) foram inseridas como Seções 11 e 12, **antes** do Resumo Executivo (que passou de Seção 11 para Seção 13) — não entre as seções já aprovadas (que ficariam de 7 a 10) — para não forçar renumeração de conteúdo já revisado e aprovado na Rodada 1, minimizando risco de referência cruzada quebrada.

**Status ao final da Rodada 2:** ✅ CONGELADA — versão oficial.

---

## Como usar este documento

Ver [missao-0002-review-notes.md](missao-0002-review-notes.md) para o modelo completo de registro (decisão + porquê + trade-off).
