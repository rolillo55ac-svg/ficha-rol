-- Partida 2: esquema completo para un proyecto de Supabase NUEVO y vacío (ficha-rol-partida2, ref teyxwlezzpongijlslty).
-- Copia de la estructura de Krysalis a 14/10/2026 (migraciones 001-033), SIN datos de Krysalis y SIN la 034 (partidas).
-- Se pega entero en el SQL Editor del proyecto nuevo. Se puede ejecutar dos veces sin romper nada.
-- NO ejecutar en el proyecto de Krysalis (nwjbdevshaucnjrwebtb).
--
-- Después de aplicarlo:
--   1. Registrarse en la web eligiendo "Partida 2" en el login.
--   2. Hacerse máster (cambiar el correo):
--        update public.profiles set role = 'gm' where id = (select id from auth.users where email = 'CORREO');
--   3. En el panel del proyecto: Realtime > Settings > desactivar "Allow public access".
--
-- Deshacer: es un proyecto aparte; si sale mal, se puede borrar el proyecto entero desde el panel de Supabase
-- (solo mientras no haya datos de jugadores) y volver a crearlo.

-- ============================================================
-- 1. Tablas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('gm', 'player')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.characters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_map (
  id text NOT NULL PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  markers jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_lore (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('pista', 'npc', 'objeto', 'otro')),
  title text NOT NULL,
  body text,
  revealed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_bestiary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_feedback (
  id text NOT NULL PRIMARY KEY,
  ticket_code text,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  contact text,
  character_name text,
  system_metadata jsonb,
  ai_triage jsonb,
  status text DEFAULT 'pending',
  admin_reply text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  user_id uuid DEFAULT auth.uid()
);

CREATE TABLE IF NOT EXISTS public.game_clock (
  campaign_id text NOT NULL PRIMARY KEY,
  total_hours integer NOT NULL DEFAULT 8 CHECK (total_hours >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT auth.uid(),
  distill_hours jsonb,
  CONSTRAINT game_clock_distill_hours_obj CHECK (distill_hours IS NULL OR jsonb_typeof(distill_hours) = 'object')
);

CREATE TABLE IF NOT EXISTS public.alchemy_secrets (
  substance_id text NOT NULL PRIMARY KEY,
  efecto_enemigo text NOT NULL DEFAULT '',
  efecto_cherk text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.house (
  id text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
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
  id text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.house_items (
  id text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.house_upgrades (
  id text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.house_events (
  id text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  house_id text NOT NULL REFERENCES public.house(id),
  actor_user_id uuid,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.house_perks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  house_id text NOT NULL REFERENCES public.house(id),
  icon text NOT NULL DEFAULT '✨',
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.house_secrets (
  id text NOT NULL PRIMARY KEY,
  house_id text NOT NULL REFERENCES public.house(id),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS house_events_house_created_idx ON public.house_events (house_id, created_at DESC);
CREATE INDEX IF NOT EXISTS house_items_room_idx ON public.house_items (room_id, furniture_id);
CREATE INDEX IF NOT EXISTS house_perks_house_idx ON public.house_perks (house_id, sort_order);
CREATE INDEX IF NOT EXISTS house_rooms_house_id_idx ON public.house_rooms (house_id);
CREATE INDEX IF NOT EXISTS house_upgrades_house_id_idx ON public.house_upgrades (house_id);

-- ============================================================
-- 2. Funciones
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_gm()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce((select role = 'gm' from public.profiles where id = auth.uid()), false);
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.jsonb_deep_merge(target jsonb, patch jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(
    jsonb_object_agg(
      coalesce(t.key, p.key),
      case
        when t.value is null then p.value
        when p.value is null then t.value
        when jsonb_typeof(t.value) = 'object' and jsonb_typeof(p.value) = 'object'
          then public.jsonb_deep_merge(t.value, p.value)
        else p.value
      end
    ),
    '{}'::jsonb
  )
  from jsonb_each(coalesce(target, '{}'::jsonb)) t
  full outer join jsonb_each(coalesce(patch, '{}'::jsonb)) p on t.key = p.key;
$function$;

CREATE OR REPLACE FUNCTION public.update_character_data(char_id uuid, patch jsonb)
 RETURNS public.characters
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  updated_row public.characters;
begin
  update public.characters
  set data = public.jsonb_deep_merge(coalesce(data, '{}'::jsonb), patch),
      name = coalesce(patch->>'name', name),
      updated_at = now()
  where id = char_id
  returning * into updated_row;

  if not found then
    raise exception 'Personaje no encontrado o sin permiso';
  end if;

  return updated_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_campaign_map(map_id text, patch jsonb)
 RETURNS public.campaign_map
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  updated_row public.campaign_map;
begin
  update public.campaign_map
  set data = case
        when jsonb_typeof(patch) = 'array' then patch
        else coalesce(data, '{}'::jsonb) || patch
      end,
      updated_at = now()
  where id = map_id
  returning * into updated_row;

  if not found then
    raise exception 'Mapa no encontrado o sin permiso';
  end if;

  return updated_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.guard_stone_verdict()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF public.is_gm() THEN RETURN NEW; END IF;
  IF NEW.data IS NOT DISTINCT FROM OLD.data THEN RETURN NEW; END IF;
  IF jsonb_typeof(NEW.data->'stones') IS DISTINCT FROM 'array' THEN RETURN NEW; END IF;

  v_old := CASE WHEN jsonb_typeof(OLD.data->'stones') = 'array' THEN OLD.data->'stones' ELSE '[]'::jsonb END;

  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN jsonb_typeof(n.st) IS DISTINCT FROM 'object' THEN n.st
      WHEN o.st IS NOT NULL AND o.st->>'veredictoMaster' IS NOT NULL THEN
        n.st
        || jsonb_build_object('veredictoMaster', o.st->'veredictoMaster', 'pendienteMaster', false)
        || CASE WHEN o.st ? 'resueltoEn' THEN jsonb_build_object('resueltoEn', o.st->'resueltoEn') ELSE '{}'::jsonb END
        || CASE WHEN o.st->>'veredictoMaster' = 'rota' THEN '{"calidad":"arruinada"}'::jsonb ELSE '{}'::jsonb END
      ELSE
        (n.st - 'veredictoMaster' - 'resueltoEn')
        || CASE
             WHEN o.st->'pendienteMaster' = 'true'::jsonb
              AND n.st->'pendienteMaster' IS DISTINCT FROM 'true'::jsonb
              AND n.st->>'calidad' IS DISTINCT FROM 'arruinada'
             THEN '{"pendienteMaster":true}'::jsonb
             ELSE '{}'::jsonb
           END
    END
    ORDER BY n.ord), '[]'::jsonb)
  INTO v_new
  FROM jsonb_array_elements(NEW.data->'stones') WITH ORDINALITY AS n(st, ord)
  LEFT JOIN LATERAL (
    SELECT x AS st FROM jsonb_array_elements(v_old) x
    WHERE jsonb_typeof(n.st) = 'object' AND n.st->>'id' IS NOT NULL AND x->>'id' = n.st->>'id'
    LIMIT 1
  ) o ON true;

  IF v_new IS DISTINCT FROM NEW.data->'stones' THEN
    NEW.data := jsonb_set(NEW.data, '{stones}', v_new);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_map_marker(p_map_id text, p_marker jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  uid uuid := auth.uid();
  gm boolean;
  v_maps jsonb;
  m_idx int;
  k_idx int;
  v_markers jsonb;
  old_marker jsonb;
  new_marker jsonb;
begin
  if uid is null then raise exception 'Sin sesión'; end if;
  if p_marker is null or coalesce(p_marker->>'id', '') = '' then raise exception 'Marcador sin id'; end if;
  gm := exists(select 1 from profiles p where p.id = uid and p.role in ('gm', 'master'));

  select data into v_maps from campaign_map where id = 'main_map' for update;
  if v_maps is null or jsonb_typeof(v_maps) <> 'array' then raise exception 'Mapa no encontrado'; end if;

  select i - 1 into m_idx from jsonb_array_elements(v_maps) with ordinality e(v, i) where v->>'id' = p_map_id limit 1;
  if m_idx is null then raise exception 'Mapa no encontrado'; end if;

  v_markers := coalesce(v_maps->m_idx->'markers', '[]'::jsonb);
  select i - 1, v into k_idx, old_marker from jsonb_array_elements(v_markers) with ordinality e(v, i) where v->>'id' = p_marker->>'id' limit 1;

  if k_idx is null then
    new_marker := p_marker || jsonb_build_object('created_by', uid::text);
    v_markers := v_markers || jsonb_build_array(new_marker);
  else
    if not gm and coalesce(old_marker->>'created_by', '') <> uid::text then
      raise exception 'Sin permiso para editar este marcador';
    end if;
    new_marker := p_marker || jsonb_build_object('created_by', old_marker->'created_by');
    v_markers := jsonb_set(v_markers, array[k_idx::text], new_marker);
  end if;

  update campaign_map
  set data = jsonb_set(v_maps, array[m_idx::text, 'markers'], v_markers), updated_at = now()
  where id = 'main_map';
  return new_marker;
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_map_marker(p_map_id text, p_marker_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  uid uuid := auth.uid();
  gm boolean;
  v_maps jsonb;
  m_idx int;
  v_markers jsonb;
  old_marker jsonb;
begin
  if uid is null then raise exception 'Sin sesión'; end if;
  gm := exists(select 1 from profiles p where p.id = uid and p.role in ('gm', 'master'));

  select data into v_maps from campaign_map where id = 'main_map' for update;
  if v_maps is null or jsonb_typeof(v_maps) <> 'array' then raise exception 'Mapa no encontrado'; end if;

  select i - 1 into m_idx from jsonb_array_elements(v_maps) with ordinality e(v, i) where v->>'id' = p_map_id limit 1;
  if m_idx is null then raise exception 'Mapa no encontrado'; end if;

  v_markers := coalesce(v_maps->m_idx->'markers', '[]'::jsonb);
  select v into old_marker from jsonb_array_elements(v_markers) v where v->>'id' = p_marker_id limit 1;
  if old_marker is null then return false; end if;
  if not gm and coalesce(old_marker->>'created_by', '') <> uid::text then
    raise exception 'Sin permiso para quitar este marcador';
  end if;

  select coalesce(jsonb_agg(v order by i), '[]'::jsonb) into v_markers from jsonb_array_elements(v_markers) with ordinality e(v, i) where v->>'id' is distinct from p_marker_id;
  update campaign_map
  set data = jsonb_set(v_maps, array[m_idx::text, 'markers'], v_markers), updated_at = now()
  where id = 'main_map';
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.game_clock_add(p_campaign_id text, p_hours integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total integer;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede cambiar el reloj' USING ERRCODE = '42501';
  END IF;
  IF p_hours IS NULL OR abs(p_hours) > 24 * 1000 THEN
    RAISE EXCEPTION 'Horas no válidas' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.game_clock AS g (campaign_id, total_hours, updated_at, updated_by)
  VALUES (p_campaign_id, greatest(0, 8 + p_hours), now(), auth.uid())
  ON CONFLICT (campaign_id) DO UPDATE
    SET total_hours = greatest(0, g.total_hours + p_hours), updated_at = now(), updated_by = auth.uid()
  RETURNING g.total_hours INTO v_total;
  RETURN v_total;
END;
$function$;

CREATE OR REPLACE FUNCTION public.game_clock_set(p_campaign_id text, p_total integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total integer;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede cambiar el reloj' USING ERRCODE = '42501';
  END IF;
  IF p_total IS NULL OR p_total < 0 OR p_total > 24 * 100000 THEN
    RAISE EXCEPTION 'Hora no válida' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.game_clock AS g (campaign_id, total_hours, updated_at, updated_by)
  VALUES (p_campaign_id, p_total, now(), auth.uid())
  ON CONFLICT (campaign_id) DO UPDATE
    SET total_hours = EXCLUDED.total_hours, updated_at = now(), updated_by = auth.uid()
  RETURNING g.total_hours INTO v_total;
  RETURN v_total;
END;
$function$;

CREATE OR REPLACE FUNCTION public.house_owns_room(p_room_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.house_rooms r
    JOIN public.characters c ON c.id::text = r.owner_character_id
    WHERE r.id = p_room_id AND c.owner_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.house_can_use_room(p_room_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT public.is_gm()
    OR EXISTS (SELECT 1 FROM public.house_rooms r WHERE r.id = p_room_id AND r.owner_character_id IS NULL)
    OR public.house_owns_room(p_room_id);
$function$;

CREATE OR REPLACE FUNCTION public.house_rooms_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.add_house_progress(p_house_id text, p_amount integer, p_stat_name text DEFAULT NULL::text, p_actor_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.toggle_house_upgrade(p_upgrade_id text, p_unlocked boolean, p_actor_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.import_house(p_data jsonb, p_campaign_id text DEFAULT 'c0000000-0000-0000-0000-000000000001'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  h jsonb := COALESCE(p_data->'house', '{}'::jsonb);
  v_house_id text;
  v_room_id text;
  r jsonb; f jsonb; it jsonb; u jsonb; e jsonb;
  i bigint; k bigint;
  v_qty integer;
  v_rooms integer := 0; v_items integer := 0; v_upg integer := 0; v_ev integer := 0;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede subir La Casa';
  END IF;
  IF jsonb_typeof(h) <> 'object' OR jsonb_typeof(p_data->'rooms') <> 'array' THEN
    RAISE EXCEPTION 'Datos de La Casa no válidos';
  END IF;
  IF EXISTS (SELECT 1 FROM public.house WHERE campaign_id = p_campaign_id) THEN
    RAISE EXCEPTION 'La nube ya tiene una Casa en esta campaña: no se sobrescribe';
  END IF;

  v_house_id := COALESCE(NULLIF(h->>'id', ''), gen_random_uuid()::text);
  INSERT INTO public.house
  SELECT * FROM jsonb_populate_record(NULL::public.house,
    '{"name":"La Casa Andante","description":"","level":1,"progress_current":0,"progress_max":100,
      "confort":1,"confort_progress":0,"confort_max":10,"arcana":1,"arcana_progress":0,"arcana_max":10,
      "provisiones":1,"provisiones_progress":0,"provisiones_max":10,"custodia":1,"custodia_progress":0,"custodia_max":10,
      "vinculo":1,"vinculo_progress":0,"vinculo_max":10,"players_can_edit":false,"floors":[]}'::jsonb
    || COALESCE((SELECT jsonb_object_agg(key, value) FROM jsonb_each(h) WHERE value <> 'null'::jsonb), '{}'::jsonb)
    || jsonb_build_object('id', v_house_id, 'campaign_id', p_campaign_id, 'created_at', now(), 'updated_at', now()));

  FOR r, i IN SELECT value, ordinality FROM jsonb_array_elements(p_data->'rooms') WITH ORDINALITY LOOP
    CONTINUE WHEN jsonb_typeof(r) <> 'object';
    v_room_id := COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text);
    INSERT INTO public.house_rooms
    SELECT * FROM jsonb_populate_record(NULL::public.house_rooms,
      '{"room_type":"otro","name":"","level":1,"description":"","pos_x":0,"pos_y":0,"width":2,"height":2,
        "floor":1,"furniture":[],"decor":[]}'::jsonb
      || COALESCE((SELECT jsonb_object_agg(key, value) FROM jsonb_each(r) WHERE value <> 'null'::jsonb), '{}'::jsonb)
      || jsonb_build_object('id', v_room_id, 'house_id', v_house_id,
                            'created_at', now() + i * interval '1 millisecond', 'updated_at', now()));
    v_rooms := v_rooms + 1;

    FOR f IN SELECT value FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(r->'furniture') = 'array' THEN r->'furniture' ELSE '[]'::jsonb END) LOOP
      CONTINUE WHEN jsonb_typeof(f) <> 'object' OR NULLIF(f->>'id', '') IS NULL;
      FOR it, k IN SELECT value, ordinality FROM jsonb_array_elements(
                     CASE WHEN jsonb_typeof(f->'items') = 'array' THEN f->'items' ELSE '[]'::jsonb END) WITH ORDINALITY LOOP
        CONTINUE WHEN jsonb_typeof(it) <> 'object';
        v_qty := CASE WHEN COALESCE(it->>'qty', '') ~ '^\s*\d{1,6}(\.\d+)?\s*$'
                      THEN GREATEST(1, round((it->>'qty')::numeric)::integer) ELSE 1 END;
        INSERT INTO public.house_items (room_id, furniture_id, name, qty, notes, sort)
        VALUES (v_room_id, f->>'id', COALESCE(it->>'name', ''), v_qty, COALESCE(it->>'notes', ''), k - 1);
        v_items := v_items + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  FOR u IN SELECT value FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(p_data->'upgrades') = 'array' THEN p_data->'upgrades' ELSE '[]'::jsonb END) LOOP
    CONTINUE WHEN jsonb_typeof(u) <> 'object';
    INSERT INTO public.house_upgrades
    SELECT * FROM jsonb_populate_record(NULL::public.house_upgrades,
      '{"name":"","description":"","unlocked":false,"level":1,"effect_type":"narrativo","required_house_level":1}'::jsonb
      || COALESCE((SELECT jsonb_object_agg(key, value) FROM jsonb_each(u) WHERE value <> 'null'::jsonb), '{}'::jsonb)
      || jsonb_build_object('id', COALESCE(NULLIF(u->>'id', ''), gen_random_uuid()::text), 'house_id', v_house_id,
                            'created_at', now(), 'updated_at', now()));
    v_upg := v_upg + 1;
  END LOOP;

  FOR e IN SELECT value FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(p_data->'events') = 'array' THEN p_data->'events' ELSE '[]'::jsonb END) LOOP
    CONTINUE WHEN jsonb_typeof(e) <> 'object' OR NULLIF(e->>'event_type', '') IS NULL;
    BEGIN
      INSERT INTO public.house_events (id, house_id, actor_user_id, event_type, payload, created_at)
      VALUES (
        COALESCE(NULLIF(e->>'id', ''), gen_random_uuid()::text),
        v_house_id,
        CASE WHEN e->>'actor_user_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             THEN (e->>'actor_user_id')::uuid END,
        e->>'event_type',
        CASE WHEN jsonb_typeof(e->'payload') = 'object' THEN e->'payload' ELSE '{}'::jsonb END,
        COALESCE((e->>'created_at')::timestamptz, now())
      );
      v_ev := v_ev + 1;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'house_id', v_house_id,
    'rooms', v_rooms, 'items', v_items, 'upgrades', v_upg, 'events', v_ev);
END;
$function$;

-- ============================================================
-- 3. Disparadores
-- ============================================================

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER characters_guard_stone_verdict
  BEFORE UPDATE OF data ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.guard_stone_verdict();

CREATE OR REPLACE TRIGGER house_rooms_guard
  BEFORE UPDATE ON public.house_rooms
  FOR EACH ROW EXECUTE FUNCTION public.house_rooms_guard();

-- ============================================================
-- 4. Permisos (iguales que en Krysalis)
-- ============================================================

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

REVOKE ALL ON public.game_clock FROM anon;
REVOKE ALL ON public.alchemy_secrets FROM anon;
REVOKE ALL ON public.house_perks FROM anon;
REVOKE ALL ON public.house_secrets FROM anon;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_stone_verdict() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_house_progress(text, integer, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_house_upgrade(text, boolean, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.import_house(jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.game_clock_set(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.game_clock_add(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_map_marker(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_map_marker(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_house_progress(text, integer, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_house_upgrade(text, boolean, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_house(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.game_clock_set(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.game_clock_add(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_map_marker(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_map_marker(text, text) TO authenticated;

-- ============================================================
-- 5. RLS y políticas (las mismas que Krysalis, todas TO authenticated)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_lore ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_bestiary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alchemy_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_secrets ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "ver mi propio perfil" ON public.profiles;
CREATE POLICY "ver mi propio perfil" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "el máster ve todos los perfiles" ON public.profiles;
CREATE POLICY "el máster ve todos los perfiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_gm());
DROP POLICY IF EXISTS "editar mi propio perfil" ON public.profiles;
CREATE POLICY "editar mi propio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- characters
DROP POLICY IF EXISTS "cualquier jugador autenticado ve todas las fichas" ON public.characters;
CREATE POLICY "cualquier jugador autenticado ve todas las fichas" ON public.characters FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "el dueño o el máster crean fichas" ON public.characters;
CREATE POLICY "el dueño o el máster crean fichas" ON public.characters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.is_gm());
DROP POLICY IF EXISTS "el dueño o el máster editan una ficha" ON public.characters;
CREATE POLICY "el dueño o el máster editan una ficha" ON public.characters FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.is_gm());
DROP POLICY IF EXISTS "solo el máster borra fichas" ON public.characters;
CREATE POLICY "solo el máster borra fichas" ON public.characters FOR DELETE TO authenticated USING (public.is_gm());

-- campaign_map (las copias backup_* solo las lee el máster)
DROP POLICY IF EXISTS campaign_map_select ON public.campaign_map;
CREATE POLICY campaign_map_select ON public.campaign_map FOR SELECT TO authenticated
  USING (id NOT LIKE 'backup\_%' OR public.is_gm());
DROP POLICY IF EXISTS campaign_map_insert ON public.campaign_map;
CREATE POLICY campaign_map_insert ON public.campaign_map FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS campaign_map_update ON public.campaign_map;
CREATE POLICY campaign_map_update ON public.campaign_map FOR UPDATE TO authenticated USING (public.is_gm());

-- campaign_lore y campaign_bestiary
DROP POLICY IF EXISTS "jugadores ven lo revelado, el máster lo ve todo" ON public.campaign_lore;
CREATE POLICY "jugadores ven lo revelado, el máster lo ve todo" ON public.campaign_lore FOR SELECT TO authenticated
  USING (revealed = true OR public.is_gm());
DROP POLICY IF EXISTS "solo el máster gestiona el lore" ON public.campaign_lore;
CREATE POLICY "solo el máster gestiona el lore" ON public.campaign_lore FOR ALL TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "solo el máster accede al bestiario" ON public.campaign_bestiary;
CREATE POLICY "solo el máster accede al bestiario" ON public.campaign_bestiary FOR ALL TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

-- app_feedback (tickets)
DROP POLICY IF EXISTS "tickets: cada usuario envía los suyos" ON public.app_feedback;
CREATE POLICY "tickets: cada usuario envía los suyos" ON public.app_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND COALESCE(status, 'pending') = 'pending' AND admin_reply IS NULL AND resolved_at IS NULL);
DROP POLICY IF EXISTS "tickets: cada usuario ve los suyos y el máster todos" ON public.app_feedback;
CREATE POLICY "tickets: cada usuario ve los suyos y el máster todos" ON public.app_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_gm());
DROP POLICY IF EXISTS "tickets: solo el máster responde" ON public.app_feedback;
CREATE POLICY "tickets: solo el máster responde" ON public.app_feedback FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "tickets: solo el máster borra" ON public.app_feedback;
CREATE POLICY "tickets: solo el máster borra" ON public.app_feedback FOR DELETE TO authenticated USING (public.is_gm());

-- game_clock
DROP POLICY IF EXISTS "reloj: todos lo leen" ON public.game_clock;
CREATE POLICY "reloj: todos lo leen" ON public.game_clock FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "reloj: solo el máster lo crea" ON public.game_clock;
CREATE POLICY "reloj: solo el máster lo crea" ON public.game_clock FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "reloj: solo el máster lo cambia" ON public.game_clock;
CREATE POLICY "reloj: solo el máster lo cambia" ON public.game_clock FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

-- alchemy_secrets
DROP POLICY IF EXISTS "alquimia secreta: solo el máster la lee" ON public.alchemy_secrets;
CREATE POLICY "alquimia secreta: solo el máster la lee" ON public.alchemy_secrets FOR SELECT TO authenticated USING (public.is_gm());
DROP POLICY IF EXISTS "alquimia secreta: solo el máster la crea" ON public.alchemy_secrets;
CREATE POLICY "alquimia secreta: solo el máster la crea" ON public.alchemy_secrets FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "alquimia secreta: solo el máster la cambia" ON public.alchemy_secrets;
CREATE POLICY "alquimia secreta: solo el máster la cambia" ON public.alchemy_secrets FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

-- house
DROP POLICY IF EXISTS "casa: leer con sesión" ON public.house;
CREATE POLICY "casa: leer con sesión" ON public.house FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "casa: el máster crea" ON public.house;
CREATE POLICY "casa: el máster crea" ON public.house FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "casa: el máster edita" ON public.house;
CREATE POLICY "casa: el máster edita" ON public.house FOR UPDATE TO authenticated USING (public.is_gm()) WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "casa: el máster borra casas de prueba" ON public.house;
CREATE POLICY "casa: el máster borra casas de prueba" ON public.house FOR DELETE TO authenticated
  USING (public.is_gm() AND campaign_id LIKE 'prueba-%');

-- house_rooms
DROP POLICY IF EXISTS "estancias: leer con sesión" ON public.house_rooms;
CREATE POLICY "estancias: leer con sesión" ON public.house_rooms FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "estancias: el máster crea" ON public.house_rooms;
CREATE POLICY "estancias: el máster crea" ON public.house_rooms FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "estancias: el máster borra" ON public.house_rooms;
CREATE POLICY "estancias: el máster borra" ON public.house_rooms FOR DELETE TO authenticated USING (public.is_gm());
DROP POLICY IF EXISTS "estancias: máster o dueño con permiso editan" ON public.house_rooms;
CREATE POLICY "estancias: máster o dueño con permiso editan" ON public.house_rooms FOR UPDATE TO authenticated
  USING (public.is_gm() OR (public.house_owns_room(id) AND EXISTS (
    SELECT 1 FROM public.house h WHERE h.id = house_rooms.house_id AND h.players_can_edit)))
  WITH CHECK (public.is_gm() OR (public.house_owns_room(id) AND EXISTS (
    SELECT 1 FROM public.house h WHERE h.id = house_rooms.house_id AND h.players_can_edit)));

-- house_items (baúles)
DROP POLICY IF EXISTS "baúl: leer con sesión" ON public.house_items;
CREATE POLICY "baúl: leer con sesión" ON public.house_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
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
CREATE POLICY "mejoras: leer con sesión" ON public.house_upgrades FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "mejoras: el máster crea" ON public.house_upgrades;
CREATE POLICY "mejoras: el máster crea" ON public.house_upgrades FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "mejoras: el máster edita" ON public.house_upgrades;
CREATE POLICY "mejoras: el máster edita" ON public.house_upgrades FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "mejoras: el máster borra" ON public.house_upgrades;
CREATE POLICY "mejoras: el máster borra" ON public.house_upgrades FOR DELETE TO authenticated USING (public.is_gm());

-- house_events
DROP POLICY IF EXISTS "sucesos: leer con sesión" ON public.house_events;
CREATE POLICY "sucesos: leer con sesión" ON public.house_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "sucesos: el máster registra" ON public.house_events;
CREATE POLICY "sucesos: el máster registra" ON public.house_events FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "sucesos: el máster borra los de casas de prueba" ON public.house_events;
CREATE POLICY "sucesos: el máster borra los de casas de prueba" ON public.house_events FOR DELETE TO authenticated
  USING (public.is_gm() AND EXISTS (
    SELECT 1 FROM public.house h WHERE h.id = house_events.house_id AND h.campaign_id LIKE 'prueba-%'));

-- house_perks y house_secrets
DROP POLICY IF EXISTS "mejoras casa: leer con sesión" ON public.house_perks;
CREATE POLICY "mejoras casa: leer con sesión" ON public.house_perks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "mejoras casa: el máster crea" ON public.house_perks;
CREATE POLICY "mejoras casa: el máster crea" ON public.house_perks FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "mejoras casa: el máster cambia" ON public.house_perks;
CREATE POLICY "mejoras casa: el máster cambia" ON public.house_perks FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "secretos casa: solo el máster lee" ON public.house_secrets;
CREATE POLICY "secretos casa: solo el máster lee" ON public.house_secrets FOR SELECT TO authenticated USING (public.is_gm());
DROP POLICY IF EXISTS "secretos casa: solo el máster crea" ON public.house_secrets;
CREATE POLICY "secretos casa: solo el máster crea" ON public.house_secrets FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "secretos casa: solo el máster cambia" ON public.house_secrets;
CREATE POLICY "secretos casa: solo el máster cambia" ON public.house_secrets FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

-- ============================================================
-- 6. Tiempo real
-- ============================================================

ALTER TABLE public.characters REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_map REPLICA IDENTITY FULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['characters', 'campaign_lore', 'campaign_bestiary', 'house', 'house_rooms',
                           'house_items', 'house_upgrades', 'house_events', 'game_clock'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- Canales privados: solo con sesión (además hay que desactivar "Allow public access" en el panel)
DROP POLICY IF EXISTS "tiempo real: con sesión escucha" ON realtime.messages;
CREATE POLICY "tiempo real: con sesión escucha" ON realtime.messages FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND (realtime.topic() LIKE 'realtime\_%' OR realtime.topic() LIKE 'character\_%'));
DROP POLICY IF EXISTS "tiempo real: con sesión emite" ON realtime.messages;
CREATE POLICY "tiempo real: con sesión emite" ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (realtime.topic() LIKE 'realtime\_%' OR realtime.topic() LIKE 'character\_%'));

-- ============================================================
-- 7. Imágenes (bucket público "images"; solo suben quienes tienen sesión)
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Permitir lectura publica imagenes" ON storage.objects;
CREATE POLICY "Permitir lectura publica imagenes" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');
DROP POLICY IF EXISTS "Permitir subida de imagenes" ON storage.objects;
CREATE POLICY "Permitir subida de imagenes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
DROP POLICY IF EXISTS "Permitir actualizar imagenes" ON storage.objects;
CREATE POLICY "Permitir actualizar imagenes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images');

-- ============================================================
-- 8. Filas mínimas para arrancar (vacías)
-- ============================================================

-- Perfiles de quien se registró antes de aplicar este archivo (aún no existía el disparador)
INSERT INTO public.profiles (id, email) SELECT id, email FROM auth.users ON CONFLICT (id) DO NOTHING;

INSERT INTO public.campaign_map (id, data) VALUES ('main_map', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.campaign_map (id, data) VALUES ('world_compendium', '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
-- Reloj en Día 1, 08:00 (mismo id de campaña que usa js/clock.js)
INSERT INTO public.game_clock (campaign_id, total_hours) VALUES ('c0000000-0000-0000-0000-000000000001', 8)
ON CONFLICT (campaign_id) DO NOTHING;
