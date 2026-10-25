-- 059 (tarea 66.2): cuentas exentas del modo mantenimiento (las de prueba), marcadas en la base.
-- Tabla public.mantenimiento_exentos: cada uno solo ve si él mismo está; nadie escribe en ella salvo
-- el admin con set_mantenimiento_exento(usuario, exento). guard_mantenimiento deja pasar al admin
-- y a los exentos. No cambia ni borra datos existentes. Se puede ejecutar dos veces.
-- Deshacer:
--   (volver a crear guard_mantenimiento como en 056, sin la línea de mantenimiento_exentos)
--   DROP FUNCTION IF EXISTS public.set_mantenimiento_exento(uuid, boolean);
--   DROP FUNCTION IF EXISTS public.es_exento_mantenimiento();
--   DROP TABLE IF EXISTS public.mantenimiento_exentos;

CREATE TABLE IF NOT EXISTS public.mantenimiento_exentos (
  user_id uuid PRIMARY KEY,
  exento boolean NOT NULL DEFAULT true,
  motivo text NOT NULL DEFAULT '',
  creado timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mantenimiento_exentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mantenimiento_exentos_select ON public.mantenimiento_exentos;
CREATE POLICY mantenimiento_exentos_select ON public.mantenimiento_exentos FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.es_admin());
REVOKE ALL ON public.mantenimiento_exentos FROM anon;
GRANT SELECT ON public.mantenimiento_exentos TO authenticated;

CREATE OR REPLACE FUNCTION public.es_exento_mantenimiento()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (select 1 from public.mantenimiento_exentos where user_id = auth.uid() and exento);
$function$;
REVOKE ALL ON FUNCTION public.es_exento_mantenimiento() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_exento_mantenimiento() TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_mantenimiento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.mantenimiento WHERE id = 1 AND activo) AND NOT public.es_admin()
     AND NOT public.es_exento_mantenimiento() THEN
    RAISE EXCEPTION 'MANTENIMIENTO: la web está en mantenimiento, no se guardan cambios' USING ERRCODE = 'P0001';
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_mantenimiento_exento(p_user uuid, p_exento boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'Solo el admin puede cambiar las cuentas exentas'; END IF;
  INSERT INTO public.mantenimiento_exentos (user_id, exento, motivo) VALUES (p_user, p_exento, 'cuenta de prueba')
    ON CONFLICT (user_id) DO UPDATE SET exento = EXCLUDED.exento;
  RETURN p_exento;
END;
$function$;
REVOKE ALL ON FUNCTION public.set_mantenimiento_exento(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_mantenimiento_exento(uuid, boolean) TO authenticated;

-- Las cuentas de prueba (máster, jugador y admin de PRUEBA), por correo para que valga en cualquier base
INSERT INTO public.mantenimiento_exentos (user_id, motivo)
  SELECT id, 'cuenta de prueba' FROM public.profiles
  WHERE email IN ('prueba-master@example.com', 'prueba-jugador@example.com', 'prueba-admin@example.com')
ON CONFLICT (user_id) DO NOTHING;
