-- 058 (tarea 64.5): registro de errores de los móviles.
-- Tabla public.client_errors: la web apunta aquí los errores de JavaScript que ven los jugadores.
-- Solo se escribe con registrar_error() (como mucho 20 por usuario y hora, textos recortados) y
-- solo el admin la lee y marca como revisado (marcar_errores_revisados). Nadie edita ni borra a mano.
-- Los errores de más de 30 días se borran solos al registrar uno nuevo (son registros, no datos de juego),
-- si existe limpiar_errores_viejos() (al final; en Krysalis va en PEGAR_TODO_KRYSALIS.sql porque la
-- herramienta de la base pide confirmación para un DELETE). Sin ella, la pantalla solo enseña 30 días.
-- No cambia ni borra datos existentes. Se puede ejecutar dos veces.
-- Deshacer:
--   DROP FUNCTION IF EXISTS public.limpiar_errores_viejos();
--   DROP FUNCTION IF EXISTS public.marcar_errores_revisados(text);
--   DROP FUNCTION IF EXISTS public.registrar_error(text, text, integer, text, text, text);
--   DROP TABLE IF EXISTS public.client_errors;
BEGIN;
CREATE TABLE IF NOT EXISTS public.client_errors (
  id bigserial PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  usuario text NOT NULL DEFAULT '',
  mensaje text NOT NULL,
  archivo text NOT NULL DEFAULT '',
  linea integer,
  version text NOT NULL DEFAULT '',
  pestana text NOT NULL DEFAULT '',
  dispositivo text NOT NULL DEFAULT '',
  revisado boolean NOT NULL DEFAULT false,
  creado timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_errors_user_creado ON public.client_errors (user_id, creado);
CREATE INDEX IF NOT EXISTS client_errors_creado ON public.client_errors (creado);
ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_errors_select_admin ON public.client_errors;
CREATE POLICY client_errors_select_admin ON public.client_errors FOR SELECT TO authenticated USING (public.es_admin());
REVOKE ALL ON public.client_errors FROM anon, authenticated;
GRANT SELECT ON public.client_errors TO authenticated;

CREATE OR REPLACE FUNCTION public.registrar_error(p_mensaje text, p_archivo text, p_linea integer, p_version text, p_pestana text, p_dispositivo text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR coalesce(btrim(p_mensaje), '') = '' THEN RETURN false; END IF;
  IF (SELECT count(*) FROM public.client_errors WHERE user_id = v_uid AND creado > now() - interval '1 hour') >= 20 THEN
    RETURN false;
  END IF;
  INSERT INTO public.client_errors (user_id, usuario, mensaje, archivo, linea, version, pestana, dispositivo)
  VALUES (v_uid,
    coalesce((SELECT coalesce(nullif(display_name, ''), email) FROM public.profiles WHERE id = v_uid), ''),
    left(p_mensaje, 500), left(coalesce(p_archivo, ''), 200), p_linea,
    left(coalesce(p_version, ''), 30), left(coalesce(p_pestana, ''), 40), left(coalesce(p_dispositivo, ''), 200));
  IF to_regprocedure('public.limpiar_errores_viejos()') IS NOT NULL THEN
    EXECUTE 'SELECT public.limpiar_errores_viejos()';
  END IF;
  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.registrar_error(text, text, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_error(text, text, integer, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.marcar_errores_revisados(p_mensaje text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_n integer;
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'Solo el admin puede revisar los errores'; END IF;
  UPDATE public.client_errors SET revisado = true WHERE mensaje = p_mensaje AND NOT revisado;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$function$;
REVOKE ALL ON FUNCTION public.marcar_errores_revisados(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_errores_revisados(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.limpiar_errores_viejos()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  DELETE FROM public.client_errors WHERE creado < now() - interval '30 days';
$function$;
REVOKE ALL ON FUNCTION public.limpiar_errores_viejos() FROM PUBLIC, anon, authenticated;
COMMIT;
