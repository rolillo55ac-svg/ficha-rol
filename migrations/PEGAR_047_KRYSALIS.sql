-- PARA KRYSALIS (proyecto nwjbdevshaucnjrwebtb): pegar tal cual en su SQL Editor y pulsar Run.
-- 047: La Casa, el máster decide qué jugador puede mover y cambiar el tamaño de SU habitación.
-- Los jugadores sin permiso solo usan el baúl. No mueve ni borra nada: hace copia en backup antes.
-- Se puede ejecutar dos veces. Para deshacer: ver migrations/047_casa_permiso_por_jugador.sql.

BEGIN;
CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.house_rooms_antes_047 AS SELECT * FROM public.house_rooms;
CREATE TABLE IF NOT EXISTS backup.house_antes_047 AS SELECT * FROM public.house;

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
