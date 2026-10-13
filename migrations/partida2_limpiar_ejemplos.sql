-- SOLO en Partida 2 (teyxwlezzpongijlslty), NUNCA en Krysalis.
-- Quita los datos de ejemplo que la web subió al abrir la Partida 2:
--   1) la misión de ejemplo "La Infiltración en Trysar" y la pista/mapa de ejemplo de misiones
--   2) la casa de ejemplo (id h0000000-...-001) con sus estancias, baúles y registros
-- Se puede ejecutar dos veces sin romper nada. No toca fichas, bestiario, armas, buffos ni lore.
-- Deshacer: no hace falta; la web ya no vuelve a generar estos ejemplos en la Partida 2.

BEGIN;

-- 1) Misiones y pistas de ejemplo dentro del documento world_compendium
UPDATE public.campaign_map
SET data = jsonb_set(
      jsonb_set(data, '{quests}',
        COALESCE((SELECT jsonb_agg(q) FROM jsonb_array_elements(COALESCE(data->'quests','[]'::jsonb)) q
                  WHERE q->>'id' <> 'quest_trysar_infil'), '[]'::jsonb)),
      '{questClues}',
        COALESCE((SELECT jsonb_agg(c) FROM jsonb_array_elements(COALESCE(data->'questClues','[]'::jsonb)) c
                  WHERE c->>'id' <> 'clue_sello_purpura'), '[]'::jsonb))
WHERE id = 'world_compendium';

-- 2) Casa de ejemplo (hijos primero)
DELETE FROM public.house_items WHERE room_id IN
  (SELECT id FROM public.house_rooms WHERE house_id = 'h0000000-0000-0000-0000-000000000001');
DELETE FROM public.house_upgrades WHERE house_id = 'h0000000-0000-0000-0000-000000000001';
DELETE FROM public.house_events   WHERE house_id = 'h0000000-0000-0000-0000-000000000001';
DELETE FROM public.house_perks    WHERE house_id = 'h0000000-0000-0000-0000-000000000001';
DELETE FROM public.house_secrets  WHERE house_id = 'h0000000-0000-0000-0000-000000000001';
DELETE FROM public.house_rooms    WHERE house_id = 'h0000000-0000-0000-0000-000000000001';
DELETE FROM public.house          WHERE id       = 'h0000000-0000-0000-0000-000000000001';

-- Comprobación: todo debe salir a 0
SELECT
  (SELECT count(*) FROM public.campaign_map m, jsonb_array_elements(COALESCE(m.data->'quests','[]'::jsonb)) q
     WHERE m.id='world_compendium' AND q->>'id'='quest_trysar_infil') AS misiones_ejemplo,
  (SELECT count(*) FROM public.house_rooms WHERE house_id='h0000000-0000-0000-0000-000000000001') AS estancias_ejemplo,
  (SELECT count(*) FROM public.house WHERE id='h0000000-0000-0000-0000-000000000001') AS casa_ejemplo;

COMMIT;
