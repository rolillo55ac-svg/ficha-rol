-- 024: Subir a la nube la Casa guardada en un dispositivo (localStorage), de una sola vez.
--  1. RPC import_house(p_data, p_campaign_id): solo el máster y solo si esa campaña aún no tiene
--     Casa (nunca sobrescribe). Todo en una transacción: o se sube entera o no se sube nada.
--     p_data = { house, rooms, upgrades, events } tal como los guarda la web en local.
--     Los objetos de los baúles van a house_items y además se quedan dentro de cada mueble como copia.
--     Los sucesos con datos raros se saltan (no son importantes); lo demás, si falla, cancela todo.
--  2. Para las pruebas automáticas: el máster puede borrar casas (y sus sucesos) SOLO de campañas
--     cuyo id empieza por "prueba-". La Casa real (c0000000-…) no se puede borrar.
-- Se puede ejecutar dos veces sin problema.
--
-- DESHACER:
--   DROP FUNCTION IF EXISTS public.import_house(jsonb, text);
--   DROP POLICY IF EXISTS "casa: el máster borra casas de prueba" ON public.house;
--   DROP POLICY IF EXISTS "sucesos: el máster borra los de casas de prueba" ON public.house_events;

CREATE OR REPLACE FUNCTION public.import_house(
  p_data jsonb,
  p_campaign_id text DEFAULT 'c0000000-0000-0000-0000-000000000001'
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  h jsonb := COALESCE(p_data->'house', '{}'::jsonb);
  v_house_id text;
  v_room_id text;
  r jsonb; f jsonb; it jsonb; u jsonb; e jsonb;
  i bigint; k bigint;
  v_qty integer;
  v_rooms integer := 0; v_items integer := 0; v_upg integer := 0; v_ev integer := 0;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede subir La Casa';
  END IF;
  IF jsonb_typeof(h) <> 'object' OR jsonb_typeof(p_data->'rooms') <> 'array' THEN
    RAISE EXCEPTION 'Datos de La Casa no válidos';
  END IF;
  IF EXISTS (SELECT 1 FROM public.house WHERE campaign_id = p_campaign_id) THEN
    RAISE EXCEPTION 'La nube ya tiene una Casa en esta campaña: no se sobrescribe';
  END IF;

  -- Casa: valores por defecto + lo que venga (sin nulos) + id, campaña y fechas fijados aquí
  v_house_id := COALESCE(NULLIF(h->>'id', ''), gen_random_uuid()::text);
  INSERT INTO public.house
  SELECT * FROM jsonb_populate_record(NULL::public.house,
    '{"name":"La Casa Andante","description":"","level":1,"progress_current":0,"progress_max":100,
      "confort":1,"confort_progress":0,"confort_max":10,"arcana":1,"arcana_progress":0,"arcana_max":10,
      "provisiones":1,"provisiones_progress":0,"provisiones_max":10,"custodia":1,"custodia_progress":0,"custodia_max":10,
      "vinculo":1,"vinculo_progress":0,"vinculo_max":10,"players_can_edit":false,"floors":[]}'::jsonb
    || COALESCE((SELECT jsonb_object_agg(key, value) FROM jsonb_each(h) WHERE value <> 'null'::jsonb), '{}'::jsonb)
    || jsonb_build_object('id', v_house_id, 'campaign_id', p_campaign_id, 'created_at', now(), 'updated_at', now()));

  -- Estancias (en el mismo orden) y objetos de sus baúles
  FOR r, i IN SELECT value, ordinality FROM jsonb_array_elements(p_data->'rooms') WITH ORDINALITY LOOP
    CONTINUE WHEN jsonb_typeof(r) <> 'object';
    v_room_id := COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text);
    INSERT INTO public.house_rooms
    SELECT * FROM jsonb_populate_record(NULL::public.house_rooms,
      '{"room_type":"otro","name":"","level":1,"description":"","pos_x":0,"pos_y":0,"width":2,"height":2,
        "floor":1,"furniture":[],"decor":[]}'::jsonb
      || COALESCE((SELECT jsonb_object_agg(key, value) FROM jsonb_each(r) WHERE value <> 'null'::jsonb), '{}'::jsonb)
      || jsonb_build_object('id', v_room_id, 'house_id', v_house_id,
                            'created_at', now() + i * interval '1 millisecond', 'updated_at', now()));
    v_rooms := v_rooms + 1;

    FOR f IN SELECT value FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(r->'furniture') = 'array' THEN r->'furniture' ELSE '[]'::jsonb END) LOOP
      CONTINUE WHEN jsonb_typeof(f) <> 'object' OR NULLIF(f->>'id', '') IS NULL;
      FOR it, k IN SELECT value, ordinality FROM jsonb_array_elements(
                     CASE WHEN jsonb_typeof(f->'items') = 'array' THEN f->'items' ELSE '[]'::jsonb END) WITH ORDINALITY LOOP
        CONTINUE WHEN jsonb_typeof(it) <> 'object';
        v_qty := CASE WHEN COALESCE(it->>'qty', '') ~ '^\s*\d{1,6}(\.\d+)?\s*$'
                      THEN GREATEST(1, round((it->>'qty')::numeric)::integer) ELSE 1 END;
        INSERT INTO public.house_items (room_id, furniture_id, name, qty, notes, sort)
        VALUES (v_room_id, f->>'id', COALESCE(it->>'name', ''), v_qty, COALESCE(it->>'notes', ''), k - 1);
        v_items := v_items + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  -- Mejoras
  FOR u IN SELECT value FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(p_data->'upgrades') = 'array' THEN p_data->'upgrades' ELSE '[]'::jsonb END) LOOP
    CONTINUE WHEN jsonb_typeof(u) <> 'object';
    INSERT INTO public.house_upgrades
    SELECT * FROM jsonb_populate_record(NULL::public.house_upgrades,
      '{"name":"","description":"","unlocked":false,"level":1,"effect_type":"narrativo","required_house_level":1}'::jsonb
      || COALESCE((SELECT jsonb_object_agg(key, value) FROM jsonb_each(u) WHERE value <> 'null'::jsonb), '{}'::jsonb)
      || jsonb_build_object('id', COALESCE(NULLIF(u->>'id', ''), gen_random_uuid()::text), 'house_id', v_house_id,
                            'created_at', now(), 'updated_at', now()));
    v_upg := v_upg + 1;
  END LOOP;

  -- Sucesos (si alguno tiene datos raros, se salta)
  FOR e IN SELECT value FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(p_data->'events') = 'array' THEN p_data->'events' ELSE '[]'::jsonb END) LOOP
    CONTINUE WHEN jsonb_typeof(e) <> 'object' OR NULLIF(e->>'event_type', '') IS NULL;
    BEGIN
      INSERT INTO public.house_events (id, house_id, actor_user_id, event_type, payload, created_at)
      VALUES (
        COALESCE(NULLIF(e->>'id', ''), gen_random_uuid()::text),
        v_house_id,
        CASE WHEN e->>'actor_user_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             THEN (e->>'actor_user_id')::uuid END,
        e->>'event_type',
        CASE WHEN jsonb_typeof(e->'payload') = 'object' THEN e->'payload' ELSE '{}'::jsonb END,
        COALESCE((e->>'created_at')::timestamptz, now())
      );
      v_ev := v_ev + 1;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'house_id', v_house_id,
    'rooms', v_rooms, 'items', v_items, 'upgrades', v_upg, 'events', v_ev);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.import_house(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_house(jsonb, text) TO authenticated;

DROP POLICY IF EXISTS "casa: el máster borra casas de prueba" ON public.house;
CREATE POLICY "casa: el máster borra casas de prueba" ON public.house FOR DELETE TO authenticated
  USING (public.is_gm() AND campaign_id LIKE 'prueba-%');

DROP POLICY IF EXISTS "sucesos: el máster borra los de casas de prueba" ON public.house_events;
CREATE POLICY "sucesos: el máster borra los de casas de prueba" ON public.house_events FOR DELETE TO authenticated
  USING (public.is_gm() AND EXISTS (
    SELECT 1 FROM public.house h WHERE h.id = house_id AND h.campaign_id LIKE 'prueba-%'));
