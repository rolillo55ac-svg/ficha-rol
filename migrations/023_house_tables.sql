-- 023: Tablas de La Casa en Supabase (hasta ahora solo existía en el localStorage de cada dispositivo).
-- Sustituye a las migraciones 012-016 y 018, que nunca se aplicaron en la base real.
--  1. Tablas house, house_rooms, house_items, house_upgrades y house_events.
--     Los ids son text (no uuid) para poder importar la Casa local tal cual ("h0000000-…", "r_stairs_p1"…).
--  2. house_items: los objetos de los baúles van en su propia tabla (por estancia y mueble), así
--     mover o cambiar muebles no pisa los objetos. No tiene clave foránea a house_rooms a propósito:
--     si se borra una estancia, sus objetos se quedan (solo los ve y recupera el máster).
--  3. Permisos (RLS, solo usuarios con sesión):
--     - Leer: cualquier usuario con sesión.
--     - house, house_upgrades, house_events: solo escribe el máster.
--     - house_rooms: el máster todo; un jugador solo actualiza su propia habitación y solo si el
--       máster ha activado house.players_can_edit. Un disparador impide que un jugador cambie
--       id, house_id, dueño o nivel.
--     - house_items: el máster todos; en estancias sin dueño, cualquier jugador; en habitaciones
--       con dueño, solo el dueño de esa ficha.
--  4. RPC add_house_progress y toggle_house_upgrade (misma lógica que la 013: el nivel general
--     sube el máximo +50 por nivel; las estadísticas +5). INVOKER, search_path fijo y solo máster.
--  5. Las cinco tablas se añaden a la publicación supabase_realtime.
-- Se puede ejecutar dos veces sin problema (no borra ni cambia datos existentes).
--
-- DESHACER (solo si las tablas están vacías o ya hay copia en el esquema backup):
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.house, public.house_rooms, public.house_items,
--     public.house_upgrades, public.house_events;
--   DROP FUNCTION IF EXISTS public.add_house_progress(text, integer, text, uuid);
--   DROP FUNCTION IF EXISTS public.toggle_house_upgrade(text, boolean, uuid);
--   DROP TABLE IF EXISTS public.house_items, public.house_events, public.house_upgrades, public.house_rooms, public.house;
--   DROP FUNCTION IF EXISTS public.house_rooms_guard();
--   DROP FUNCTION IF EXISTS public.house_can_use_room(text);
--   DROP FUNCTION IF EXISTS public.house_owns_room(text);

-- 1. TABLAS

CREATE TABLE IF NOT EXISTS public.house (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id text NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000001' UNIQUE,
  name text NOT NULL DEFAULT 'La Casa Andante',
  description text NOT NULL DEFAULT '',
  level integer NOT NULL DEFAULT 1,
  progress_current integer NOT NULL DEFAULT 0,
  progress_max integer NOT NULL DEFAULT 100,
  confort integer NOT NULL DEFAULT 1,
  confort_progress integer NOT NULL DEFAULT 0,
  confort_max integer NOT NULL DEFAULT 10,
  arcana integer NOT NULL DEFAULT 1,
  arcana_progress integer NOT NULL DEFAULT 0,
  arcana_max integer NOT NULL DEFAULT 10,
  provisiones integer NOT NULL DEFAULT 1,
  provisiones_progress integer NOT NULL DEFAULT 0,
  provisiones_max integer NOT NULL DEFAULT 10,
  custodia integer NOT NULL DEFAULT 1,
  custodia_progress integer NOT NULL DEFAULT 0,
  custodia_max integer NOT NULL DEFAULT 10,
  vinculo integer NOT NULL DEFAULT 1,
  vinculo_progress integer NOT NULL DEFAULT 0,
  vinculo_max integer NOT NULL DEFAULT 10,
  players_can_edit boolean NOT NULL DEFAULT false,
  floors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.house_rooms (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id text NOT NULL REFERENCES public.house(id),
  room_type text NOT NULL DEFAULT 'otro',
  name text NOT NULL DEFAULT '',
  owner_character_id text,
  level integer NOT NULL DEFAULT 1,
  description text NOT NULL DEFAULT '',
  pos_x double precision NOT NULL DEFAULT 0,
  pos_y double precision NOT NULL DEFAULT 0,
  width double precision NOT NULL DEFAULT 2,
  height double precision NOT NULL DEFAULT 2,
  floor integer NOT NULL DEFAULT 1,
  furniture jsonb NOT NULL DEFAULT '[]'::jsonb,
  decor jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text,
  texture text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS house_rooms_house_id_idx ON public.house_rooms (house_id);

CREATE TABLE IF NOT EXISTS public.house_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  room_id text NOT NULL,
  furniture_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 1,
  notes text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0,
  updated_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS house_items_room_idx ON public.house_items (room_id, furniture_id);

CREATE TABLE IF NOT EXISTS public.house_upgrades (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id text NOT NULL REFERENCES public.house(id),
  room_id text,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unlocked boolean NOT NULL DEFAULT false,
  level integer NOT NULL DEFAULT 1,
  bonus_value text,
  effect_type text NOT NULL DEFAULT 'narrativo',
  buff_id text,
  required_house_level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS house_upgrades_house_id_idx ON public.house_upgrades (house_id);

CREATE TABLE IF NOT EXISTS public.house_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id text NOT NULL REFERENCES public.house(id),
  actor_user_id uuid,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS house_events_house_created_idx ON public.house_events (house_id, created_at DESC);

-- 2. FUNCIONES DE PERMISOS

-- ¿La estancia es una habitación cuyo dueño (ficha) es del usuario actual?
CREATE OR REPLACE FUNCTION public.house_owns_room(p_room_id text)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_rooms r
    JOIN public.characters c ON c.id::text = r.owner_character_id
    WHERE r.id = p_room_id AND c.owner_id = auth.uid()
  );
$$;

-- ¿Puede el usuario actual usar el baúl de esta estancia?
CREATE OR REPLACE FUNCTION public.house_can_use_room(p_room_id text)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  SELECT public.is_gm()
    OR EXISTS (SELECT 1 FROM public.house_rooms r WHERE r.id = p_room_id AND r.owner_character_id IS NULL)
    OR public.house_owns_room(p_room_id);
$$;

-- Un jugador no puede cambiar id, casa, dueño ni nivel de una estancia.
CREATE OR REPLACE FUNCTION public.house_rooms_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_gm() AND (
       NEW.id IS DISTINCT FROM OLD.id
    OR NEW.house_id IS DISTINCT FROM OLD.house_id
    OR NEW.owner_character_id IS DISTINCT FROM OLD.owner_character_id
    OR NEW.level IS DISTINCT FROM OLD.level
  ) THEN
    RAISE EXCEPTION 'Solo el máster puede cambiar el dueño o el nivel de una estancia';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS house_rooms_guard ON public.house_rooms;
CREATE TRIGGER house_rooms_guard BEFORE UPDATE ON public.house_rooms
  FOR EACH ROW EXECUTE FUNCTION public.house_rooms_guard();

-- 3. RLS

ALTER TABLE public.house ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_events ENABLE ROW LEVEL SECURITY;

-- house
DROP POLICY IF EXISTS "casa: leer con sesión" ON public.house;
CREATE POLICY "casa: leer con sesión" ON public.house FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "casa: el máster crea" ON public.house;
CREATE POLICY "casa: el máster crea" ON public.house FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "casa: el máster edita" ON public.house;
CREATE POLICY "casa: el máster edita" ON public.house FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

-- house_rooms
DROP POLICY IF EXISTS "estancias: leer con sesión" ON public.house_rooms;
CREATE POLICY "estancias: leer con sesión" ON public.house_rooms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "estancias: el máster crea" ON public.house_rooms;
CREATE POLICY "estancias: el máster crea" ON public.house_rooms FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "estancias: el máster borra" ON public.house_rooms;
CREATE POLICY "estancias: el máster borra" ON public.house_rooms FOR DELETE TO authenticated USING (public.is_gm());
DROP POLICY IF EXISTS "estancias: máster o dueño con permiso editan" ON public.house_rooms;
CREATE POLICY "estancias: máster o dueño con permiso editan" ON public.house_rooms FOR UPDATE TO authenticated
  USING (
    public.is_gm()
    OR (public.house_owns_room(id)
        AND EXISTS (SELECT 1 FROM public.house h WHERE h.id = house_id AND h.players_can_edit))
  )
  WITH CHECK (
    public.is_gm()
    OR (public.house_owns_room(id)
        AND EXISTS (SELECT 1 FROM public.house h WHERE h.id = house_id AND h.players_can_edit))
  );

-- house_items
DROP POLICY IF EXISTS "baúl: leer con sesión" ON public.house_items;
CREATE POLICY "baúl: leer con sesión" ON public.house_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "baúl: añadir quien puede usarlo" ON public.house_items;
CREATE POLICY "baúl: añadir quien puede usarlo" ON public.house_items FOR INSERT TO authenticated
  WITH CHECK (public.house_can_use_room(room_id));
DROP POLICY IF EXISTS "baúl: cambiar quien puede usarlo" ON public.house_items;
CREATE POLICY "baúl: cambiar quien puede usarlo" ON public.house_items FOR UPDATE TO authenticated
  USING (public.house_can_use_room(room_id)) WITH CHECK (public.house_can_use_room(room_id));
DROP POLICY IF EXISTS "baúl: quitar quien puede usarlo" ON public.house_items;
CREATE POLICY "baúl: quitar quien puede usarlo" ON public.house_items FOR DELETE TO authenticated
  USING (public.house_can_use_room(room_id));

-- house_upgrades
DROP POLICY IF EXISTS "mejoras: leer con sesión" ON public.house_upgrades;
CREATE POLICY "mejoras: leer con sesión" ON public.house_upgrades FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mejoras: el máster crea" ON public.house_upgrades;
CREATE POLICY "mejoras: el máster crea" ON public.house_upgrades FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "mejoras: el máster edita" ON public.house_upgrades;
CREATE POLICY "mejoras: el máster edita" ON public.house_upgrades FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "mejoras: el máster borra" ON public.house_upgrades;
CREATE POLICY "mejoras: el máster borra" ON public.house_upgrades FOR DELETE TO authenticated USING (public.is_gm());

-- house_events
DROP POLICY IF EXISTS "sucesos: leer con sesión" ON public.house_events;
CREATE POLICY "sucesos: leer con sesión" ON public.house_events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "sucesos: el máster registra" ON public.house_events;
CREATE POLICY "sucesos: el máster registra" ON public.house_events FOR INSERT TO authenticated WITH CHECK (public.is_gm());

-- 4. RPC

CREATE OR REPLACE FUNCTION public.add_house_progress(
  p_house_id text,
  p_amount integer,
  p_stat_name text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_house public.house%ROWTYPE;
  v_stat text := COALESCE(NULLIF(p_stat_name, ''), 'general');
  v_level integer;
  v_prog integer;
  v_max integer;
  v_up boolean := false;
  v_msg text;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede dar progreso a la casa';
  END IF;

  SELECT * INTO v_house FROM public.house WHERE id = p_house_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Casa con ID % no encontrada', p_house_id;
  END IF;

  IF v_stat = 'general' THEN
    v_level := v_house.level;
    v_prog := GREATEST(0, v_house.progress_current + p_amount);
    v_max := GREATEST(10, v_house.progress_max);
    WHILE v_prog >= v_max LOOP
      v_level := v_level + 1;
      v_prog := v_prog - v_max;
      v_max := v_max + 50;
      v_up := true;
      INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
      VALUES (p_house_id, p_actor_id, 'level_up', jsonb_build_object(
        'message', '¡La Casa Andante ha alcanzado el Nivel ' || v_level || '!',
        'level', v_level, 'amount', p_amount));
    END LOOP;

    IF NOT v_up AND p_amount <> 0 THEN
      INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
      VALUES (p_house_id, p_actor_id, 'progress_gain', jsonb_build_object(
        'message', 'Progreso general de la casa aumentado en ' || p_amount || ' puntos.',
        'amount', p_amount, 'current', v_prog, 'max', v_max));
    END IF;

    UPDATE public.house SET level = v_level, progress_current = v_prog, progress_max = v_max, updated_at = now()
    WHERE id = p_house_id RETURNING * INTO v_house;

  ELSIF v_stat IN ('confort', 'arcana', 'provisiones', 'custodia', 'vinculo') THEN
    EXECUTE format('SELECT %I, %I, %I FROM public.house WHERE id = $1', v_stat, v_stat || '_progress', v_stat || '_max')
      INTO v_level, v_prog, v_max USING p_house_id;
    v_prog := GREATEST(0, v_prog + p_amount);
    v_max := GREATEST(5, v_max);
    WHILE v_prog >= v_max LOOP
      v_level := v_level + 1;
      v_prog := v_prog - v_max;
      v_max := v_max + 5;
      v_up := true;
    END LOOP;

    EXECUTE format('UPDATE public.house SET %I = $1, %I = $2, %I = $3, updated_at = now() WHERE id = $4',
                   v_stat, v_stat || '_progress', v_stat || '_max')
      USING v_level, v_prog, v_max, p_house_id;
    SELECT * INTO v_house FROM public.house WHERE id = p_house_id;

    v_msg := CASE
      WHEN v_up THEN CASE v_stat
        WHEN 'confort' THEN '¡El Confort de la casa subió a Nv. '
        WHEN 'arcana' THEN '¡El poder de Arcana del Libro subió a Nv. '
        WHEN 'provisiones' THEN '¡Las Provisiones de la cocina subieron a Nv. '
        WHEN 'custodia' THEN '¡La Custodia y camuflaje subió a Nv. '
        ELSE '¡El Vínculo con los moradores subió a Nv. ' END || v_level || '!'
      ELSE CASE v_stat
        WHEN 'confort' THEN 'Confort incrementado en '
        WHEN 'arcana' THEN 'Arcana incrementada en '
        WHEN 'provisiones' THEN 'Provisiones incrementadas en '
        WHEN 'custodia' THEN 'Custodia incrementada en '
        ELSE 'Vínculo incrementado en ' END || p_amount || ' pts.'
    END;

    INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
    VALUES (p_house_id, p_actor_id, 'stat_gain', jsonb_build_object(
      'stat', v_stat, 'message', v_msg, 'val', v_level, 'prog', v_prog));
  ELSE
    RAISE EXCEPTION 'Estadística desconocida: %', v_stat;
  END IF;

  RETURN jsonb_build_object('success', true, 'house', to_jsonb(v_house), 'stat_name', v_stat, 'amount', p_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_house_upgrade(
  p_upgrade_id text,
  p_unlocked boolean,
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_upg public.house_upgrades%ROWTYPE;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede desbloquear mejoras';
  END IF;

  UPDATE public.house_upgrades SET unlocked = p_unlocked, updated_at = now()
  WHERE id = p_upgrade_id RETURNING * INTO v_upg;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mejora con ID % no encontrada', p_upgrade_id;
  END IF;

  INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
  VALUES (v_upg.house_id, p_actor_id, 'unlock_upgrade', jsonb_build_object(
    'upgrade_id', p_upgrade_id, 'name', v_upg.name, 'unlocked', p_unlocked,
    'message', CASE WHEN p_unlocked THEN 'Mejora desbloqueada: ' || v_upg.name ELSE 'Mejora bloqueada: ' || v_upg.name END));

  RETURN jsonb_build_object('success', true, 'upgrade', to_jsonb(v_upg));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_house_progress(text, integer, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.toggle_house_upgrade(text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_house_progress(text, integer, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_house_upgrade(text, boolean, uuid) TO authenticated;

-- 5. TIEMPO REAL

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['house', 'house_rooms', 'house_items', 'house_upgrades', 'house_events'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
