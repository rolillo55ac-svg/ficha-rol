-- 056 (tarea 65): modo mantenimiento. Mientras está activo, nadie salvo el admin puede escribir
-- en las tablas de juego (ni directamente ni a través de las RPC, porque el freno es un trigger
-- en cada tabla). Las sesiones sin usuario (tareas internas, alta de cuentas) no se frenan.
-- Tabla public.mantenimiento (una sola fila, id = 1): la leen todos los conectados y solo el admin
-- la cambia, con set_mantenimiento(activo, mensaje). No cambia ni borra datos existentes.
-- Se puede ejecutar dos veces.
-- Deshacer (no pierde datos de juego):
--   DO $$ DECLARE t text; BEGIN FOR t IN SELECT tgrelid::regclass::text FROM pg_trigger WHERE tgname = 'zz_mantenimiento' LOOP
--     EXECUTE format('DROP TRIGGER IF EXISTS zz_mantenimiento ON %s', t); END LOOP; END $$;
--   DROP FUNCTION IF EXISTS public.set_mantenimiento(boolean, text);
--   DROP FUNCTION IF EXISTS public.guard_mantenimiento();
--   DROP TABLE IF EXISTS public.mantenimiento;
BEGIN;
CREATE TABLE IF NOT EXISTS public.mantenimiento (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  activo boolean NOT NULL DEFAULT false,
  mensaje text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.mantenimiento (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.mantenimiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mantenimiento_select ON public.mantenimiento;
CREATE POLICY mantenimiento_select ON public.mantenimiento FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.mantenimiento FROM anon;
GRANT SELECT ON public.mantenimiento TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_mantenimiento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.mantenimiento WHERE id = 1 AND activo) AND NOT public.es_admin() THEN
    RAISE EXCEPTION 'MANTENIMIENTO: la web está en mantenimiento, no se guardan cambios' USING ERRCODE = 'P0001';
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_mantenimiento(p_activo boolean, p_mensaje text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_row public.mantenimiento;
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'Solo el admin puede cambiar el mantenimiento'; END IF;
  UPDATE public.mantenimiento
     SET activo = coalesce(p_activo, false),
         mensaje = left(coalesce(p_mensaje, ''), 500),
         updated_at = now()
   WHERE id = 1
  RETURNING * INTO v_row;
  RETURN to_jsonb(v_row);
END;
$function$;
REVOKE ALL ON FUNCTION public.set_mantenimiento(boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_mantenimiento(boolean, text) TO authenticated;

-- Freno en todas las tablas de juego que existan en esta base.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['characters','character_story','money_log','long_rest_log','dice_rolls',
    'roll_requests','roll_request_secrets','alchemy_secrets','campaigns','campaign_members','campaign_invites',
    'campaign_map','campaign_lore','campaign_bestiary','gallery','game_clock',
    'house','house_rooms','house_items','house_upgrades','house_events','house_perks','house_secrets',
    'maps','map_markers','weapons_catalog','bestiary','buff_catalog'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('CREATE OR REPLACE TRIGGER zz_mantenimiento BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.guard_mantenimiento()', t);
    END IF;
  END LOOP;
END $$;

-- Para que la pantalla de mantenimiento salte en directo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mantenimiento') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mantenimiento;
  END IF;
END $$;
COMMIT;
