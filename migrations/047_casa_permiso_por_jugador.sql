-- 047: La Casa, permisos por jugador (tarea 58). Solo añade y restringe; no mueve ni borra datos.
-- * house.room_editors: ids de las fichas cuyo jugador puede mover y cambiar el tamaño de SU habitación
--   (lo decide el máster en el Panel secreto). Sustituye al interruptor general players_can_edit, que se queda
--   en la tabla sin usarse.
-- * Política de actualizar estancias: el máster/admin, todo; el dueño, solo si su ficha está en room_editors.
-- * house_rooms_solo_geometria: si quien actualiza no es máster/admin, todo lo que no sea posición y tamaño
--   se queda como estaba (nombre, muebles, decoración, color, dueño, planta...). El baúl va aparte, en
--   house_items, y sigue igual: lo usa siempre el dueño de la estancia (o cualquiera si no tiene dueño).
-- Se puede ejecutar dos veces.
-- Para deshacer:
--   DROP TRIGGER IF EXISTS house_rooms_solo_geometria ON public.house_rooms;
--   DROP FUNCTION IF EXISTS public.house_rooms_solo_geometria();
--   DROP POLICY IF EXISTS "estancias: máster o dueño con permiso editan" ON public.house_rooms;
--   CREATE POLICY "estancias: máster o dueño con permiso editan" ON public.house_rooms FOR UPDATE TO authenticated
--     USING (is_gm() OR (house_owns_room(id) AND EXISTS (SELECT 1 FROM house h WHERE h.id = house_rooms.house_id AND h.players_can_edit)))
--     WITH CHECK (is_gm() OR (house_owns_room(id) AND EXISTS (SELECT 1 FROM house h WHERE h.id = house_rooms.house_id AND h.players_can_edit)));
--   ALTER TABLE public.house DROP COLUMN IF EXISTS room_editors;   -- (solo si de verdad hace falta)

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
