# ADR-0002 — Multi-tenant por Empresa (Empresa = Tenant, escopo SmartFood)

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0004 — Modelagem do Domínio](../../product/missao-0004-modelagem-dominio.md), Seção 2 (nota Empresa vs. Tenant) e Seção 9 (Glossário)

## Contexto

O SmartFood é, desde a Missão 0001, uma plataforma multiempresa (multi-tenant) — cada comerciante opera isolado dos demais. A modelagem de domínio (Missão 0004) precisava decidir se "Empresa" (o termo de negócio usado em toda a documentação de produto) e "Tenant" (o termo de infraestrutura da Smart Platform Architecture) seriam tratados como o mesmo conceito ou como conceitos separados desde já.

## Decisão

No escopo do SmartFood, **Empresa e Tenant são o mesmo conceito** — uma Empresa é a unidade de isolamento de dado. Toda Loja, Usuário, Cliente (no sentido de histórico transacional), Produto e Pedido pertence a exatamente uma Empresa.

## Alternativas consideradas

- **Separar Empresa e Tenant desde já** (ex: um Tenant guarda-chuva contendo várias Empresas, útil para grupo econômico com CNPJs diferentes): rejeitado por ora — não há caso de uso real hoje que justifique a complexidade extra, e a Missão 0002 já registrou Multiloja (uma Empresa, várias Lojas) como o caminho de crescimento suportado, não múltiplas Empresas sob um mesmo dono.

## Consequências

- **Facilita:** modelo de isolamento simples e direto — uma linha de corte (Empresa) resolve segurança, RBAC (Smart Security Guide) e faturamento ao mesmo tempo.
- **Custa:** se, no futuro, a Smart Platform decidir separar os dois conceitos formalmente (relevante se outro produto Smart precisar de um Tenant com múltiplas Empresas), o SmartFood terá uma migração de conceito a fazer — risco assumido conscientemente e registrado como dúvida aberta na Missão 0004.
- **Impede:** um único Cliente logado acessar dados de duas Empresas diferentes sob a mesma sessão sem re-autenticação — cada contexto de Empresa é isolado por completo (RBAC é sempre por tenant, Missão 0002, Regra de Negócio Global 9 / Missão 0004, Invariante 4).
