-- PARA VENDA2 (proyecto teyxwlezzpongijlslty): pegar tal cual en su SQL Editor, después de la partida2_044. Igual que la 046 de Krysalis.
-- 046: el admin puede borrar registros de accesos desde Ajustes › Admin › Actividad (tarea 58).
-- admin_borrar_actividad(dias): borra de access_log lo de hace más de "dias" días (0 o NULL = todo).
--   Solo es_admin(); solo toca access_log (nunca datos de juego). Devuelve cuántas filas ha borrado.
-- espacio_base(): tamaño de la base y filas de access_log y gallery, para Ajustes › Almacenamiento.
-- Solo añade dos funciones. Se puede ejecutar dos veces.
-- Para deshacer:
--   DROP FUNCTION IF EXISTS public.admin_borrar_actividad(integer);
--   DROP FUNCTION IF EXISTS public.espacio_base();

CREATE OR REPLACE FUNCTION public.admin_borrar_actividad(p_dias integer DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  n integer;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo el admin' USING ERRCODE = '42501';
  END IF;
  IF coalesce(p_dias, 0) <= 0 THEN
    DELETE FROM public.access_log WHERE true;
  ELSE
    DELETE FROM public.access_log WHERE at < now() - make_interval(days => least(p_dias, 3650));
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_borrar_actividad(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_borrar_actividad(integer) TO authenticated;

-- espacio_base(): tamaño de la base de datos y filas del registro de accesos y de la galería, para
--   Ajustes › Almacenamiento (el navegador no puede medirlo solo). Solo lectura, para cualquiera con sesión.
CREATE OR REPLACE FUNCTION public.espacio_base()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  n_log bigint := NULL;
  n_gal bigint := NULL;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sin sesión' USING ERRCODE = '42501';
  END IF;
  IF to_regclass('public.access_log') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.access_log' INTO n_log;
  END IF;
  IF to_regclass('public.gallery') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.gallery' INTO n_gal;
  END IF;
  RETURN json_build_object('db_bytes', pg_database_size(current_database()), 'access_log', n_log, 'gallery', n_gal);
END;
$$;
REVOKE ALL ON FUNCTION public.espacio_base() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.espacio_base() TO authenticated;
