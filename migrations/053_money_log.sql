-- 053 (tarea 64.2, TK-4YTG): botones de dinero con registro de movimientos.
-- Crea la tabla money_log (quién cambió el oro/plata de qué ficha y cuándo) y la función
-- change_character_money, la única vía para escribir en ella. La función solo toca data->money
-- (nunca otros campos de la ficha), la puede usar el dueño de la ficha o el máster, y no deja bajar de 0.
-- Lee el registro el dueño de la ficha y el máster. Nadie escribe directamente en la tabla.
-- No cambia ni borra datos existentes. Se puede ejecutar dos veces.
-- Aplicada en Krysalis el 24/10 (sin los REVOKE, que la herramienta no deja lanzar: no hacen falta, porque
-- RLS no tiene políticas de escritura y la función exige sesión; quedan como refuerzo opcional).
-- Deshacer:
--   DROP FUNCTION IF EXISTS public.change_character_money(uuid, integer, integer);
--   DROP TABLE IF EXISTS public.money_log;   -- (borra el registro de movimientos; copiarlo antes)
BEGIN;
CREATE TABLE IF NOT EXISTS public.money_log (
  id bigserial PRIMARY KEY,
  character_id uuid NOT NULL,
  campaign_id text,
  delta_oro integer NOT NULL DEFAULT 0,
  delta_plata integer NOT NULL DEFAULT 0,
  oro_after integer NOT NULL DEFAULT 0,
  plata_after integer NOT NULL DEFAULT 0,
  actor_id uuid,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Si se borra una ficha (solo el máster puede), se va con ella su registro de dinero
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'money_log_character_fk') THEN
    ALTER TABLE public.money_log ADD CONSTRAINT money_log_character_fk FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS money_log_char_idx ON public.money_log (character_id, created_at DESC);
ALTER TABLE public.money_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dinero: lee el dueño o el máster" ON public.money_log;
CREATE POLICY "dinero: lee el dueño o el máster" ON public.money_log
  FOR SELECT TO authenticated
  USING (
    public.is_gm()
    OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = money_log.character_id AND c.owner_id = (SELECT auth.uid()))
  );

REVOKE ALL ON public.money_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.money_log FROM authenticated;
GRANT SELECT ON public.money_log TO authenticated;

CREATE OR REPLACE FUNCTION public.change_character_money(p_char_id uuid, p_delta_oro integer, p_delta_plata integer)
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
  v_new_oro integer;
  v_new_plata integer;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Hay que iniciar sesión'; END IF;
  p_delta_oro := coalesce(p_delta_oro, 0);
  p_delta_plata := coalesce(p_delta_plata, 0);
  IF abs(p_delta_oro) > 1000000 OR abs(p_delta_plata) > 1000000 THEN RAISE EXCEPTION 'Cantidad demasiado grande'; END IF;

  SELECT * INTO v_row FROM public.characters WHERE id = p_char_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personaje no encontrado'; END IF;
  IF v_row.owner_id IS DISTINCT FROM v_uid AND NOT public.is_gm() THEN
    RAISE EXCEPTION 'Sin permiso para cambiar el dinero de esta ficha';
  END IF;

  v_money := CASE WHEN jsonb_typeof(v_row.data->'money') = 'object' THEN v_row.data->'money' ELSE '{}'::jsonb END;
  v_oro := CASE WHEN (v_money->>'oro') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN floor((v_money->>'oro')::numeric)::integer ELSE 0 END;
  v_plata := CASE WHEN (v_money->>'plata') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN floor((v_money->>'plata')::numeric)::integer ELSE 0 END;
  v_new_oro := greatest(0, v_oro + p_delta_oro);
  v_new_plata := greatest(0, v_plata + p_delta_plata);

  IF v_new_oro <> v_oro OR v_new_plata <> v_plata OR jsonb_typeof(v_money->'oro') IS DISTINCT FROM 'number' THEN
    UPDATE public.characters
       SET data = jsonb_set(coalesce(data, '{}'::jsonb), '{money}', v_money || jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata)),
           updated_at = now()
     WHERE id = p_char_id;
  END IF;

  IF v_new_oro <> v_oro OR v_new_plata <> v_plata THEN
    SELECT coalesce(nullif(p.display_name, ''), p.email) INTO v_name FROM public.profiles p WHERE p.id = v_uid;
    INSERT INTO public.money_log (character_id, campaign_id, delta_oro, delta_plata, oro_after, plata_after, actor_id, actor_name)
    VALUES (p_char_id, v_row.campaign_id, v_new_oro - v_oro, v_new_plata - v_plata, v_new_oro, v_new_plata, v_uid, v_name);
  END IF;

  RETURN jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata);
END;
$function$;

REVOKE ALL ON FUNCTION public.change_character_money(uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_character_money(uuid, integer, integer) TO authenticated;
COMMIT;
