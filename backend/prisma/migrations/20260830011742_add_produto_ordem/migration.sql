-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

-- Backfill: sem isso, todo produto já existente nasceria com ordem=0 —
-- empatados, a ordem de exibição ficaria a mercê da ordem física do Postgres
-- (não garantida por SQL, pode variar entre execuções/replanejamentos de
-- query). Atribui ordem sequencial e determinística por categoria, mais
-- antigo primeiro (criado_em), com o id como desempate pra casos de
-- timestamps idênticos. É só um UPDATE de uma coluna nova — nenhum dado
-- existente é lido, apagado ou substituído.
WITH ranking AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY categoria_id ORDER BY criado_em ASC, id ASC) - 1 AS nova_ordem
  FROM "produtos"
)
UPDATE "produtos"
SET ordem = ranking.nova_ordem
FROM ranking
WHERE "produtos".id = ranking.id;
