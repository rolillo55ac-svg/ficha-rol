-- 054 (tarea 64.3, TK-7CZU): descanso largo del máster.
-- Crea la función long_rest: el máster (o admin) manda la lista de personajes que descansan, con la vida y el
-- maná máximos que calcula la web y los buffos que se quitan (los marcados "Se resetea al descansar largo").
-- A cada uno: vida y maná a ese valor, escudo a 0 y fuera esos buffos; los demás buffos y campos no se tocan.
-- Todo en una transacción. Antes de cambiar cada ficha guarda su copia entera en long_rest_log (solo la lee el máster),
-- y deja una línea en el historial de tiradas.
-- No cambia ni borra datos existentes. Se puede ejecutar dos veces.
-- Restaurar una ficha desde la copia (el último descanso):
--   UPDATE public.characters c SET data = l.data_before, updated_at = now()
--     FROM (SELECT DISTINCT ON (character_id) character_id, data_before FROM public.long_rest_log ORDER BY character_id, id DESC) l
--    WHERE c.id = l.character_id AND c.id = '<id de la ficha>';
-- Deshacer:
--   DROP FUNCTION IF EXISTS public.long_rest(jsonb);
--   DROP TABLE IF EXISTS public.long_rest_log;   -- (borra las copias; copiarlas antes)
BEGIN;
CREATE TABLE IF NOT EXISTS public.long_rest_log (
  id bigserial PRIMARY KEY,
  rest_id uuid NOT NULL,
  character_id uuid NOT NULL,
  campaign_id text,
  data_before jsonb,
  removed_buffs jsonb,
  actor_id uuid,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS long_rest_log_char_idx ON public.long_rest_log (character_id, id DESC);
ALTER TABLE public.long_rest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "descanso: lee el máster" ON public.long_rest_log;
CREATE POLICY "descanso: lee el máster" ON public.long_rest_log
  FOR SELECT TO authenticated
  USING (public.is_gm());

REVOKE ALL ON public.long_rest_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.long_rest_log FROM authenticated;
GRANT SELECT ON public.long_rest_log TO authenticated;

CREATE OR REPLACE FUNCTION public.long_rest(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_rest uuid := gen_random_uuid();
  v_item jsonb;
  v_row public.characters;
  v_id uuid;
  v_pv integer;
  v_mana integer;
  v_remove jsonb;
  v_buffs jsonb;
  v_kept jsonb;
  v_removed jsonb;
  v_combat jsonb;
  v_name text;
  v_names text[] := ARRAY[]::text[];
  v_out jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Hay que iniciar sesión'; END IF;
  IF NOT public.is_gm() THEN RAISE EXCEPTION 'Solo el máster puede mandar un descanso largo'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No hay personajes para descansar';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN RAISE EXCEPTION 'Demasiados personajes'; END IF;

  SELECT coalesce(nullif(p.display_name, ''), p.email) INTO v_name FROM public.profiles p WHERE p.id = v_uid;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_id := (v_item->>'id')::uuid;
    v_pv := greatest(0, least(100000, coalesce((v_item->>'pv')::numeric, 0)::integer));
    v_mana := greatest(0, least(100000, coalesce((v_item->>'mana')::numeric, 0)::integer));
    v_remove := CASE WHEN jsonb_typeof(v_item->'remove') = 'array' THEN v_item->'remove' ELSE '[]'::jsonb END;

    SELECT * INTO v_row FROM public.characters WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN CONTINUE; END IF;

    v_buffs := CASE WHEN jsonb_typeof(v_row.data->'activeBuffs') = 'array' THEN v_row.data->'activeBuffs' ELSE '[]'::jsonb END;
    SELECT coalesce(jsonb_agg(b ORDER BY o), '[]'::jsonb) INTO v_kept
      FROM jsonb_array_elements(v_buffs) WITH ORDINALITY AS t(b, o)
     WHERE NOT (v_remove ? coalesce(b->>'id', ''));
    SELECT coalesce(jsonb_agg(b->>'name' ORDER BY o), '[]'::jsonb) INTO v_removed
      FROM jsonb_array_elements(v_buffs) WITH ORDINALITY AS t(b, o)
     WHERE v_remove ? coalesce(b->>'id', '');

    INSERT INTO public.long_rest_log (rest_id, character_id, campaign_id, data_before, removed_buffs, actor_id, actor_name)
    VALUES (v_rest, v_id, v_row.campaign_id, v_row.data, v_removed, v_uid, v_name);

    v_combat := CASE WHEN jsonb_typeof(v_row.data->'combat') = 'object' THEN v_row.data->'combat' ELSE '{}'::jsonb END;
    v_combat := v_combat || jsonb_build_object('pvActual', v_pv, 'manaActual', v_mana, 'escudoActual', 0);

    UPDATE public.characters
       SET data = coalesce(data, '{}'::jsonb) || jsonb_build_object('combat', v_combat, 'activeBuffs', v_kept),
           updated_at = now()
     WHERE id = v_id;

    v_names := v_names || coalesce(nullif(v_row.name, ''), nullif(v_row.data->>'name', ''), 'Personaje');
    v_out := v_out || jsonb_build_array(jsonb_build_object('id', v_id, 'combat', v_combat, 'activeBuffs', v_kept, 'removed', v_removed));
  END LOOP;

  IF jsonb_array_length(v_out) > 0 AND to_regclass('public.dice_rolls') IS NOT NULL THEN
    INSERT INTO public.dice_rolls (user_id, char_name, label, kind, formula_text)
    VALUES (v_uid, 'Máster', '🌙 Descanso largo', 'long_rest', 'Descansan: ' || array_to_string(v_names, ', '));
  END IF;

  RETURN jsonb_build_object('rest_id', v_rest, 'items', v_out);
END;
$function$;

REVOKE ALL ON FUNCTION public.long_rest(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.long_rest(jsonb) TO authenticated;
COMMIT;
