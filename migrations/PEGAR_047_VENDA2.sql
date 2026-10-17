-- PARA VENDA2 (proyecto teyxwlezzpongijlslty): pegar tal cual en su SQL Editor y pulsar Run.
-- Incluye la 046 (borrar registros de Actividad) y la 047 (La Casa: permiso por jugador).
-- No mueve ni borra datos de juego: hace copia de La Casa en backup antes. Se puede ejecutar dos veces.

BEGIN;
CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.house_rooms_antes_047 AS SELECT * FROM public.house_rooms;
CREATE TABLE IF NOT EXISTS backup.house_antes_047 AS SELECT * FROM public.house;

-- ===== 046 =====
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

-- ===== 047 =====
ALTER TABLE public.house ADD COLUMN IF NOT EXISTS room_editors text[] NOT NULL DEFAULT '{}';

DROP POLICY IF EXISTS "estancias: máster o dueño con permiso editan" ON public.house_rooms;
CREATE POLICY "estancias: máster o dueño con permiso editan" ON public.house_rooms FOR UPDATE TO authenticated
  USING (public.is_gm() OR (public.house_owns_room(id) AND EXISTS (
    SELECT 1 FROM public.house h WHERE h.id = house_rooms.house_id AND house_rooms.owner_character_id = ANY (h.room_editors))))
  WITH CHECK (public.is_gm() OR (public.house_owns_room(id) AND EXISTS (
    SELECT 1 FROM public.house h WHERE h.id = house_rooms.house_id AND house_rooms.owner_character_id = ANY (h.room_editors))));

CREATE OR REPLACE FUNCTION public.house_rooms_solo_geometria()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF public.is_gm() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.id := OLD.id;
  NEW.house_id := OLD.house_id;
  NEW.room_type := OLD.room_type;
  NEW.name := OLD.name;
  NEW.owner_character_id := OLD.owner_character_id;
  NEW.level := OLD.level;
  NEW.description := OLD.description;
  NEW.floor := OLD.floor;
  NEW.furniture := OLD.furniture;
  NEW.decor := OLD.decor;
  NEW.color := OLD.color;
  NEW.texture := OLD.texture;
  NEW.icon := OLD.icon;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.house_rooms_solo_geometria() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS house_rooms_solo_geometria ON public.house_rooms;
CREATE TRIGGER house_rooms_solo_geometria BEFORE UPDATE ON public.house_rooms
  FOR EACH ROW EXECUTE FUNCTION public.house_rooms_solo_geometria();

COMMIT;

-- Comprobación: debe salir ya047 = true y el mismo número de estancias que antes.
SELECT exists(SELECT 1 FROM information_schema.columns WHERE table_name='house' AND column_name='room_editors') AS ya047,
       (SELECT count(*) FROM public.house_rooms) AS estancias, (SELECT count(*) FROM backup.house_rooms_antes_047) AS estancias_copia;
