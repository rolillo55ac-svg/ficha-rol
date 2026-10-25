-- 057 (dinero de Ink): el dinero (oro, plata, gremio) solo cambia por funciones de la base.
-- 1. mover_dinero(ficha, oro, plata, gremio, motivo, ref, clave): suma o resta en una sola transacción,
--    bloquea la fila, no deja bajar de 0, apunta en money_log y no repite un envío con la misma clave
--    (si el móvil reintenta por mala conexión). La usa el dueño de la ficha, el máster o el admin.
-- 2. transferir(origen, destino, oro, plata, gremio, objetos, motivo, clave): mueve dinero y objetos del
--    inventario de una ficha a otra de la misma partida; o se mueve todo o nada. La usa el dueño del
--    origen, el máster o el admin. (Preparada para Comercio.)
-- 3. change_character_money (053 y 055) pasa a llamar a mover_dinero, para los móviles con la versión vieja.
-- 4. Candado: un guardado de ficha (update_character_data o actualización directa) que traiga otro dinero
--    se queda con el dinero que ya había, en silencio, también para el máster (mismo método que la 051).
-- 5. Los valores guardados con punto de miles ("1.567", Ink) se leen como 1567 en el siguiente movimiento.
-- No cambia ni borra datos existentes. Se puede ejecutar dos veces.
-- Deshacer:
--   DROP TRIGGER IF EXISTS characters_guard_money ON public.characters;
--   DROP FUNCTION IF EXISTS public.guard_money();
--   DROP FUNCTION IF EXISTS public.transferir(uuid, uuid, integer, integer, integer, jsonb, text, text);
--   DROP FUNCTION IF EXISTS public.mover_dinero(uuid, integer, integer, integer, text, text, text);
--   DROP FUNCTION IF EXISTS public.money_int(jsonb);
--   (y volver a crear change_character_money con el texto de 053 y 055)
--   DROP INDEX IF EXISTS public.money_log_clave_idx;
--   ALTER TABLE public.money_log DROP COLUMN IF EXISTS motivo, DROP COLUMN IF EXISTS ref, DROP COLUMN IF EXISTS clave;   -- (copiar money_log antes)
BEGIN;
ALTER TABLE public.money_log ADD COLUMN IF NOT EXISTS delta_gremio integer NOT NULL DEFAULT 0;
ALTER TABLE public.money_log ADD COLUMN IF NOT EXISTS gremio_after integer NOT NULL DEFAULT 0;
ALTER TABLE public.money_log ADD COLUMN IF NOT EXISTS motivo text;
ALTER TABLE public.money_log ADD COLUMN IF NOT EXISTS ref text;
ALTER TABLE public.money_log ADD COLUMN IF NOT EXISTS clave text;
CREATE UNIQUE INDEX IF NOT EXISTS money_log_clave_idx ON public.money_log (character_id, clave) WHERE clave IS NOT NULL;

-- Valor entero de una moneda guardada: "1.567" (punto de miles) es 1567; otros decimales se truncan
CREATE OR REPLACE FUNCTION public.money_int(v jsonb)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE
    WHEN v IS NULL OR jsonb_typeof(v) NOT IN ('number', 'string') THEN 0
    WHEN (v #>> '{}') ~ '^[0-9]{1,3}\.[0-9]{3}$' THEN round((v #>> '{}')::numeric * 1000)::integer
    WHEN (v #>> '{}') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN greatest(0, floor((v #>> '{}')::numeric))::integer
    ELSE 0
  END;
$function$;

CREATE OR REPLACE FUNCTION public.mover_dinero(p_char_id uuid, p_oro integer DEFAULT 0, p_plata integer DEFAULT 0, p_gremio integer DEFAULT 0,
  p_motivo text DEFAULT NULL, p_ref text DEFAULT NULL, p_clave text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.characters;
  v_money jsonb;
  v_oro integer; v_plata integer; v_gremio integer;
  v_new_oro integer; v_new_plata integer; v_new_gremio integer;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Hay que iniciar sesión'; END IF;
  p_oro := coalesce(p_oro, 0); p_plata := coalesce(p_plata, 0); p_gremio := coalesce(p_gremio, 0);
  IF abs(p_oro) > 1000000 OR abs(p_plata) > 1000000 OR abs(p_gremio) > 1000000 THEN RAISE EXCEPTION 'Cantidad demasiado grande'; END IF;
  p_clave := nullif(left(coalesce(p_clave, ''), 80), '');

  SELECT * INTO v_row FROM public.characters WHERE id = p_char_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personaje no encontrado'; END IF;
  IF v_row.owner_id IS DISTINCT FROM v_uid AND NOT public.is_gm() THEN
    RAISE EXCEPTION 'Sin permiso para cambiar el dinero de esta ficha';
  END IF;

  v_money := CASE WHEN jsonb_typeof(v_row.data->'money') = 'object' THEN v_row.data->'money' ELSE '{}'::jsonb END;
  v_oro := public.money_int(v_money->'oro');
  v_plata := public.money_int(v_money->'plata');
  v_gremio := public.money_int(v_money->'gremio');

  -- Reintento del mismo envío: ya está sumado, se devuelve el saldo sin tocar nada
  IF p_clave IS NOT NULL AND EXISTS (SELECT 1 FROM public.money_log WHERE character_id = p_char_id AND clave = p_clave) THEN
    RETURN jsonb_build_object('oro', v_oro, 'plata', v_plata, 'gremio', v_gremio, 'repetido', true);
  END IF;

  v_new_oro := greatest(0, v_oro + p_oro);
  v_new_plata := greatest(0, v_plata + p_plata);
  v_new_gremio := greatest(0, v_gremio + p_gremio);

  IF v_new_oro <> v_oro OR v_new_plata <> v_plata OR v_new_gremio <> v_gremio
     OR v_money->'oro' IS DISTINCT FROM to_jsonb(v_oro) OR v_money->'plata' IS DISTINCT FROM to_jsonb(v_plata) THEN
    PERFORM set_config('krysalis.dinero', '1', true);
    UPDATE public.characters
       SET data = jsonb_set(coalesce(data, '{}'::jsonb), '{money}', v_money || jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata, 'gremio', v_new_gremio)),
           updated_at = now()
     WHERE id = p_char_id;
    PERFORM set_config('krysalis.dinero', '', true);
  END IF;

  IF v_new_oro <> v_oro OR v_new_plata <> v_plata OR v_new_gremio <> v_gremio THEN
    SELECT coalesce(nullif(p.display_name, ''), p.email) INTO v_name FROM public.profiles p WHERE p.id = v_uid;
    INSERT INTO public.money_log (character_id, campaign_id, delta_oro, delta_plata, delta_gremio, oro_after, plata_after, gremio_after, actor_id, actor_name, motivo, ref, clave)
    VALUES (p_char_id, v_row.campaign_id, v_new_oro - v_oro, v_new_plata - v_plata, v_new_gremio - v_gremio, v_new_oro, v_new_plata, v_new_gremio, v_uid, v_name,
            nullif(left(coalesce(p_motivo, ''), 200), ''), nullif(left(coalesce(p_ref, ''), 200), ''), p_clave);
  END IF;

  RETURN jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata, 'gremio', v_new_gremio);
END;
$function$;
REVOKE ALL ON FUNCTION public.mover_dinero(uuid, integer, integer, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mover_dinero(uuid, integer, integer, integer, text, text, text) TO authenticated;

-- Las de antes, para los móviles que aún no se han actualizado
CREATE OR REPLACE FUNCTION public.change_character_money(p_char_id uuid, p_delta_oro integer, p_delta_plata integer)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$ SELECT public.mover_dinero(p_char_id, p_delta_oro, p_delta_plata, 0, NULL, NULL, NULL); $function$;
CREATE OR REPLACE FUNCTION public.change_character_money(p_char_id uuid, p_delta_oro integer, p_delta_plata integer, p_delta_gremio integer)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$ SELECT public.mover_dinero(p_char_id, p_delta_oro, p_delta_plata, p_delta_gremio, NULL, NULL, NULL); $function$;
REVOKE ALL ON FUNCTION public.change_character_money(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.change_character_money(uuid, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_character_money(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_character_money(uuid, integer, integer, integer) TO authenticated;

-- p_objetos: [{"id": "<id del objeto en el inventario>", "qty": n}] (sin qty, se mueve todo el montón)
CREATE OR REPLACE FUNCTION public.transferir(p_origen uuid, p_destino uuid, p_oro integer DEFAULT 0, p_plata integer DEFAULT 0, p_gremio integer DEFAULT 0,
  p_objetos jsonb DEFAULT '[]'::jsonb, p_motivo text DEFAULT NULL, p_clave text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_o public.characters;
  v_d public.characters;
  v_om jsonb; v_dm jsonb;
  v_o_oro integer; v_o_plata integer; v_o_gremio integer;
  v_d_oro integer; v_d_plata integer; v_d_gremio integer;
  v_o_inv jsonb; v_d_inv jsonb;
  v_req jsonb; v_item jsonb; v_idx integer; v_have integer; v_qty integer;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Hay que iniciar sesión'; END IF;
  IF p_origen IS NULL OR p_destino IS NULL OR p_origen = p_destino THEN RAISE EXCEPTION 'Origen y destino deben ser fichas distintas'; END IF;
  p_oro := coalesce(p_oro, 0); p_plata := coalesce(p_plata, 0); p_gremio := coalesce(p_gremio, 0);
  IF p_oro < 0 OR p_plata < 0 OR p_gremio < 0 THEN RAISE EXCEPTION 'Las cantidades no pueden ser negativas'; END IF;
  IF p_oro > 1000000 OR p_plata > 1000000 OR p_gremio > 1000000 THEN RAISE EXCEPTION 'Cantidad demasiado grande'; END IF;
  IF p_objetos IS NULL OR jsonb_typeof(p_objetos) <> 'array' THEN p_objetos := '[]'::jsonb; END IF;
  p_clave := nullif(left(coalesce(p_clave, ''), 80), '');

  -- Siempre en el mismo orden, para que dos transferencias cruzadas no se bloqueen entre sí
  PERFORM 1 FROM public.characters WHERE id IN (p_origen, p_destino) ORDER BY id FOR UPDATE;
  SELECT * INTO v_o FROM public.characters WHERE id = p_origen;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ficha de origen no encontrada'; END IF;
  SELECT * INTO v_d FROM public.characters WHERE id = p_destino;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ficha de destino no encontrada'; END IF;
  IF v_o.owner_id IS DISTINCT FROM v_uid AND NOT public.is_gm() THEN RAISE EXCEPTION 'Sin permiso para dar desde esta ficha'; END IF;
  IF v_o.campaign_id IS DISTINCT FROM v_d.campaign_id THEN RAISE EXCEPTION 'Las fichas son de partidas distintas'; END IF;

  IF p_clave IS NOT NULL AND EXISTS (SELECT 1 FROM public.money_log WHERE character_id = p_origen AND clave = p_clave) THEN
    RETURN jsonb_build_object('repetido', true);
  END IF;

  v_om := CASE WHEN jsonb_typeof(v_o.data->'money') = 'object' THEN v_o.data->'money' ELSE '{}'::jsonb END;
  v_dm := CASE WHEN jsonb_typeof(v_d.data->'money') = 'object' THEN v_d.data->'money' ELSE '{}'::jsonb END;
  v_o_oro := public.money_int(v_om->'oro'); v_o_plata := public.money_int(v_om->'plata'); v_o_gremio := public.money_int(v_om->'gremio');
  v_d_oro := public.money_int(v_dm->'oro'); v_d_plata := public.money_int(v_dm->'plata'); v_d_gremio := public.money_int(v_dm->'gremio');
  IF v_o_oro < p_oro OR v_o_plata < p_plata OR v_o_gremio < p_gremio THEN RAISE EXCEPTION 'No hay suficiente dinero'; END IF;

  v_o_inv := CASE WHEN jsonb_typeof(v_o.data->'inventory') = 'array' THEN v_o.data->'inventory' ELSE '[]'::jsonb END;
  v_d_inv := CASE WHEN jsonb_typeof(v_d.data->'inventory') = 'array' THEN v_d.data->'inventory' ELSE '[]'::jsonb END;
  FOR v_req IN SELECT * FROM jsonb_array_elements(p_objetos) LOOP
    SELECT (e.ord - 1)::integer, e.it INTO v_idx, v_item
      FROM jsonb_array_elements(v_o_inv) WITH ORDINALITY AS e(it, ord)
     WHERE e.it->>'id' = v_req->>'id' LIMIT 1;
    IF v_item IS NULL THEN RAISE EXCEPTION 'Objeto no encontrado en el inventario'; END IF;
    v_have := greatest(1, public.money_int(v_item->'qty'));
    v_qty := CASE WHEN v_req ? 'qty' THEN public.money_int(v_req->'qty') ELSE v_have END;
    IF v_qty < 1 OR v_qty > v_have THEN RAISE EXCEPTION 'Cantidad de objeto no válida'; END IF;
    IF v_qty = v_have THEN
      v_o_inv := v_o_inv - v_idx;
      v_d_inv := v_d_inv || jsonb_build_array(v_item || jsonb_build_object('id', (v_item->>'id') || '-t' || substr(md5(random()::text), 1, 6)));
    ELSE
      v_o_inv := jsonb_set(v_o_inv, ARRAY[v_idx::text, 'qty'], to_jsonb(v_have - v_qty));
      v_d_inv := v_d_inv || jsonb_build_array(v_item || jsonb_build_object('id', (v_item->>'id') || '-t' || substr(md5(random()::text), 1, 6), 'qty', v_qty));
    END IF;
    v_item := NULL;
  END LOOP;

  PERFORM set_config('krysalis.dinero', '1', true);
  UPDATE public.characters
     SET data = jsonb_set(jsonb_set(coalesce(data, '{}'::jsonb), '{money}', v_om || jsonb_build_object('oro', v_o_oro - p_oro, 'plata', v_o_plata - p_plata, 'gremio', v_o_gremio - p_gremio)), '{inventory}', v_o_inv),
         updated_at = now()
   WHERE id = p_origen;
  UPDATE public.characters
     SET data = jsonb_set(jsonb_set(coalesce(data, '{}'::jsonb), '{money}', v_dm || jsonb_build_object('oro', v_d_oro + p_oro, 'plata', v_d_plata + p_plata, 'gremio', v_d_gremio + p_gremio)), '{inventory}', v_d_inv),
         updated_at = now()
   WHERE id = p_destino;
  PERFORM set_config('krysalis.dinero', '', true);

  SELECT coalesce(nullif(p.display_name, ''), p.email) INTO v_name FROM public.profiles p WHERE p.id = v_uid;
  p_motivo := coalesce(nullif(left(coalesce(p_motivo, ''), 200), ''), 'transferencia');
  INSERT INTO public.money_log (character_id, campaign_id, delta_oro, delta_plata, delta_gremio, oro_after, plata_after, gremio_after, actor_id, actor_name, motivo, ref, clave)
  VALUES (p_origen, v_o.campaign_id, -p_oro, -p_plata, -p_gremio, v_o_oro - p_oro, v_o_plata - p_plata, v_o_gremio - p_gremio, v_uid, v_name, p_motivo, p_destino::text, p_clave),
         (p_destino, v_d.campaign_id, p_oro, p_plata, p_gremio, v_d_oro + p_oro, v_d_plata + p_plata, v_d_gremio + p_gremio, v_uid, v_name, p_motivo, p_origen::text, p_clave);

  RETURN jsonb_build_object('origen', jsonb_build_object('oro', v_o_oro - p_oro, 'plata', v_o_plata - p_plata, 'gremio', v_o_gremio - p_gremio),
                            'destino', jsonb_build_object('oro', v_d_oro + p_oro, 'plata', v_d_plata + p_plata, 'gremio', v_d_gremio + p_gremio));
END;
$function$;
REVOKE ALL ON FUNCTION public.transferir(uuid, uuid, integer, integer, integer, jsonb, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transferir(uuid, uuid, integer, integer, integer, jsonb, text, text) TO authenticated;

-- Candado: el guardado de la ficha nunca cambia el dinero (solo mover_dinero y transferir)
CREATE OR REPLACE FUNCTION public.guard_money()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF coalesce(current_setting('krysalis.dinero', true), '') = '1' THEN RETURN NEW; END IF;
  IF NEW.data IS NOT DISTINCT FROM OLD.data THEN RETURN NEW; END IF;
  IF (NEW.data->'money') IS DISTINCT FROM (OLD.data->'money') THEN
    NEW.data := CASE WHEN OLD.data ? 'money' THEN jsonb_set(NEW.data, '{money}', OLD.data->'money') ELSE NEW.data - 'money' END;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS characters_guard_money ON public.characters;
CREATE TRIGGER characters_guard_money
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.guard_money();
COMMIT;
