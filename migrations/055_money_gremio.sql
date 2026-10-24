-- 055 (tarea 64.2, añadido de Chemo): tercera moneda, la moneda de gremio.
-- Añade a money_log las columnas delta_gremio y gremio_after (valor 0 en las filas que ya existen)
-- y una versión de change_character_money con un cuarto parámetro p_delta_gremio. Igual que oro y
-- plata: solo toca data->money, la usa el dueño de la ficha o el máster y no deja bajar de 0.
-- La versión de 3 parámetros (053) se queda tal cual para los móviles que aún no se han actualizado;
-- conserva money.gremio porque mezcla el objeto money en vez de sustituirlo.
-- No cambia ni borra datos existentes. Se puede ejecutar dos veces.
-- Deshacer:
--   DROP FUNCTION IF EXISTS public.change_character_money(uuid, integer, integer, integer);
--   ALTER TABLE public.money_log DROP COLUMN IF EXISTS delta_gremio, DROP COLUMN IF EXISTS gremio_after;   -- (copiar money_log antes)
BEGIN;
ALTER TABLE public.money_log ADD COLUMN IF NOT EXISTS delta_gremio integer NOT NULL DEFAULT 0;
ALTER TABLE public.money_log ADD COLUMN IF NOT EXISTS gremio_after integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.change_character_money(p_char_id uuid, p_delta_oro integer, p_delta_plata integer, p_delta_gremio integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.characters;
  v_money jsonb;
  v_oro integer;
  v_plata integer;
  v_gremio integer;
  v_new_oro integer;
  v_new_plata integer;
  v_new_gremio integer;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Hay que iniciar sesión'; END IF;
  p_delta_oro := coalesce(p_delta_oro, 0);
  p_delta_plata := coalesce(p_delta_plata, 0);
  p_delta_gremio := coalesce(p_delta_gremio, 0);
  IF abs(p_delta_oro) > 1000000 OR abs(p_delta_plata) > 1000000 OR abs(p_delta_gremio) > 1000000 THEN RAISE EXCEPTION 'Cantidad demasiado grande'; END IF;

  SELECT * INTO v_row FROM public.characters WHERE id = p_char_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personaje no encontrado'; END IF;
  IF v_row.owner_id IS DISTINCT FROM v_uid AND NOT public.is_gm() THEN
    RAISE EXCEPTION 'Sin permiso para cambiar el dinero de esta ficha';
  END IF;

  v_money := CASE WHEN jsonb_typeof(v_row.data->'money') = 'object' THEN v_row.data->'money' ELSE '{}'::jsonb END;
  v_oro := CASE WHEN (v_money->>'oro') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN floor((v_money->>'oro')::numeric)::integer ELSE 0 END;
  v_plata := CASE WHEN (v_money->>'plata') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN floor((v_money->>'plata')::numeric)::integer ELSE 0 END;
  v_gremio := CASE WHEN (v_money->>'gremio') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN floor((v_money->>'gremio')::numeric)::integer ELSE 0 END;
  v_new_oro := greatest(0, v_oro + p_delta_oro);
  v_new_plata := greatest(0, v_plata + p_delta_plata);
  v_new_gremio := greatest(0, v_gremio + p_delta_gremio);

  IF v_new_oro <> v_oro OR v_new_plata <> v_plata OR v_new_gremio <> v_gremio
     OR jsonb_typeof(v_money->'oro') IS DISTINCT FROM 'number' OR jsonb_typeof(v_money->'gremio') IS DISTINCT FROM 'number' THEN
    UPDATE public.characters
       SET data = jsonb_set(coalesce(data, '{}'::jsonb), '{money}', v_money || jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata, 'gremio', v_new_gremio)),
           updated_at = now()
     WHERE id = p_char_id;
  END IF;

  IF v_new_oro <> v_oro OR v_new_plata <> v_plata OR v_new_gremio <> v_gremio THEN
    SELECT coalesce(nullif(p.display_name, ''), p.email) INTO v_name FROM public.profiles p WHERE p.id = v_uid;
    INSERT INTO public.money_log (character_id, campaign_id, delta_oro, delta_plata, delta_gremio, oro_after, plata_after, gremio_after, actor_id, actor_name)
    VALUES (p_char_id, v_row.campaign_id, v_new_oro - v_oro, v_new_plata - v_plata, v_new_gremio - v_gremio, v_new_oro, v_new_plata, v_new_gremio, v_uid, v_name);
  END IF;

  RETURN jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata, 'gremio', v_new_gremio);
END;
$function$;

REVOKE ALL ON FUNCTION public.change_character_money(uuid, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_character_money(uuid, integer, integer, integer) TO authenticated;
COMMIT;
