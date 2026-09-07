-- ============================================================================
-- MIGRACIÓN 001: CREAR TABLAS DE CAMPAÑAS Y MIEMBROS (MODELO RELACIONAL)
-- Fecha: 2026-09-06
-- ============================================================================

-- 1. Crear tabla de Campañas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Krysalis Principal',
  description TEXT DEFAULT 'Campaña principal del reino de Krysalis',
  gm_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de Miembros de Campaña
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID, -- Referencia opcional a characters(id)
  role TEXT NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('GM', 'PLAYER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id, character_id)
);

-- 3. Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON public.campaign_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON public.campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_char ON public.campaign_members(character_id);

-- 4. Añadir columna campaign_id a characters si no existe (aditiva y segura)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'characters' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE public.characters ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Insertar la Campaña Oficial por defecto con ID fijo predecible
INSERT INTO public.campaigns (id, name, description, gm_id)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'Krysalis Principal',
  'Partida oficial en curso de Krysalis',
  'eaa97e7a-408d-476f-9774-55ec911833d8'::uuid -- rolillo55ac@gmail.com
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  gm_id = EXCLUDED.gm_id,
  updated_at = NOW();

-- 6. Asignar los personajes existentes a la campaña oficial
UPDATE public.characters 
SET campaign_id = 'c0000000-0000-0000-0000-000000000001'::uuid
WHERE campaign_id IS NULL;

-- 7. Poblar campaign_members con los perfiles existentes y sus personajes asignados
-- GM (rolillo55ac)
INSERT INTO public.campaign_members (campaign_id, user_id, character_id, role)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'eaa97e7a-408d-476f-9774-55ec911833d8'::uuid,
  NULL,
  'GM'
)
ON CONFLICT DO NOTHING;

-- Cherk -> lolorey92
INSERT INTO public.campaign_members (campaign_id, user_id, character_id, role)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'a8039428-8ee7-4e31-baba-c6a1d8b6d8f3'::uuid,
  'a8039428-8ee7-4e31-baba-c6a1d8b6d8f3'::uuid,
  'PLAYER'
)
ON CONFLICT DO NOTHING;

-- Ink -> martu
INSERT INTO public.campaign_members (campaign_id, user_id, character_id, role)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'ece1cdb6-f8c6-4010-b3e8-045887dc92a3'::uuid,
  'ece1cdb6-f8c6-4010-b3e8-045887dc92a3'::uuid,
  'PLAYER'
)
ON CONFLICT DO NOTHING;

-- Bucky -> piki
INSERT INTO public.campaign_members (campaign_id, user_id, character_id, role)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'bcfb51f6-4916-4650-b842-0eaf7f8335f4'::uuid,
  '4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e'::uuid,
  'PLAYER'
)
ON CONFLICT DO NOTHING;

-- Scarleth -> saray
INSERT INTO public.campaign_members (campaign_id, user_id, character_id, role)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  '5e9c545e-176a-4e99-a3e7-299f89fa0779'::uuid,
  '5e9c545e-176a-4e99-a3e7-299f89fa0779'::uuid,
  'PLAYER'
)
ON CONFLICT DO NOTHING;

-- Derek -> saray
INSERT INTO public.campaign_members (campaign_id, user_id, character_id, role)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  '5e9c545e-176a-4e99-a3e7-299f89fa0779'::uuid,
  'd9dee50e-051d-4058-b4a5-d46c809fbb25'::uuid,
  'PLAYER'
)
ON CONFLICT DO NOTHING;
-- ============================================================================
-- MIGRACIÓN 002: MAPAS Y MARCADORES GRANULARES COLABORATIVOS
-- Fecha: 2026-09-06
-- ============================================================================

-- 1. Crear tabla de Mapas
CREATE TABLE IF NOT EXISTS public.maps (
  id TEXT PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de Marcadores Granulares
CREATE TABLE IF NOT EXISTS public.map_markers (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'Punto de Interés' CHECK (kind IN ('Ciudad', 'Capital', 'Punto de Interés', 'Peligro')),
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para acelerar búsquedas
CREATE INDEX IF NOT EXISTS idx_maps_campaign ON public.maps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_map_markers_map ON public.map_markers(map_id);
CREATE INDEX IF NOT EXISTS idx_map_markers_campaign ON public.map_markers(campaign_id);

-- 4. Migrar mapas existentes desde campaign_map (fila 'main_map') si no se han migrado aún
DO $$
DECLARE
  v_map_json JSONB;
  v_map RECORD;
  v_marker RECORD;
BEGIN
  SELECT data INTO v_map_json FROM public.campaign_map WHERE id = 'main_map';
  
  IF v_map_json IS NOT NULL AND jsonb_typeof(v_map_json) = 'array' THEN
    FOR v_map IN SELECT * FROM jsonb_to_recordset(v_map_json) AS x(id text, name text, image text, markers jsonb)
    LOOP
      -- Insertar o actualizar cada mapa individual
      INSERT INTO public.maps (id, campaign_id, name, image_url, updated_at)
      VALUES (
        COALESCE(v_map.id, 'world_main'),
        'c0000000-0000-0000-0000-000000000001'::uuid,
        COALESCE(v_map.name, 'Mapa de Campaña'),
        v_map.image,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        image_url = EXCLUDED.image_url,
        updated_at = NOW();

      -- Migrar marcadores existentes de ese mapa si tuviera
      IF v_map.markers IS NOT NULL AND jsonb_typeof(v_map.markers) = 'array' THEN
        FOR v_marker IN SELECT * FROM jsonb_to_recordset(v_map.markers) AS y(id text, x numeric, y numeric, name text, kind text, notes text)
        LOOP
          INSERT INTO public.map_markers (id, map_id, campaign_id, x, y, name, kind, notes, updated_at)
          VALUES (
            COALESCE(v_marker.id, 'pin_' || substr(md5(random()::text), 1, 8)),
            COALESCE(v_map.id, 'world_main'),
            'c0000000-0000-0000-0000-000000000001'::uuid,
            COALESCE(v_marker.x, 50),
            COALESCE(v_marker.y, 50),
            COALESCE(v_marker.name, 'Punto de Interés'),
            CASE 
              WHEN v_marker.kind IN ('Ciudad', 'Capital', 'Punto de Interés', 'Peligro') THEN v_marker.kind 
              ELSE 'Punto de Interés' 
            END,
            COALESCE(v_marker.notes, ''),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            x = EXCLUDED.x,
            y = EXCLUDED.y,
            name = EXCLUDED.name,
            kind = EXCLUDED.kind,
            notes = EXCLUDED.notes,
            updated_at = NOW();
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END $$;
-- ============================================================================
-- MIGRACIÓN 003: SEPARACIÓN DE CATÁLOGO COMPARTIDO Y BESTIARIO
-- Fecha: 2026-09-06
-- ============================================================================

-- 1. Catálogo de Armas
CREATE TABLE IF NOT EXISTS public.weapons_catalog (
  id TEXT PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dano TEXT DEFAULT '',
  alcance TEXT DEFAULT '',
  critico TEXT DEFAULT '',
  "desc" TEXT DEFAULT '',
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bestiario
CREATE TABLE IF NOT EXISTS public.bestiary (
  id TEXT PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'Animal',
  continente TEXT DEFAULT 'Todos',
  rareza TEXT DEFAULT 'Común',
  montable BOOLEAN DEFAULT false,
  absorcion TEXT DEFAULT '0',
  defensa TEXT DEFAULT '10',
  movilidad TEXT DEFAULT '6',
  notas TEXT DEFAULT '',
  habilidades TEXT DEFAULT '',
  stats JSONB DEFAULT '{}'::jsonb,
  visible BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Catálogo de Buffs
CREATE TABLE IF NOT EXISTS public.buff_catalog (
  id TEXT PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tipo TEXT DEFAULT 'buff',
  "desc" TEXT DEFAULT '',
  attr TEXT DEFAULT 'todo',
  bonus TEXT DEFAULT '1',
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_weapons_campaign ON public.weapons_catalog(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bestiary_campaign ON public.bestiary(campaign_id);
CREATE INDEX IF NOT EXISTS idx_buffs_campaign ON public.buff_catalog(campaign_id);

-- 5. Migrar datos existentes desde campaign_map ('world_compendium')
DO $$
DECLARE
  v_comp_json JSONB;
  v_item RECORD;
BEGIN
  SELECT data INTO v_comp_json FROM public.campaign_map WHERE id = 'world_compendium';
  
  IF v_comp_json IS NOT NULL THEN
    -- A) Migrar weaponsCatalog
    IF v_comp_json->'weaponsCatalog' IS NOT NULL AND jsonb_typeof(v_comp_json->'weaponsCatalog') = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_comp_json->'weaponsCatalog') AS x(id text, name text, dano text, alcance text, critico text, "desc" text, visible boolean)
      LOOP
        INSERT INTO public.weapons_catalog (id, campaign_id, name, dano, alcance, critico, "desc", visible, updated_at)
        VALUES (
          COALESCE(v_item.id, 'wp_' || substr(md5(random()::text), 1, 8)),
          'c0000000-0000-0000-0000-000000000001'::uuid,
          COALESCE(v_item.name, 'Arma'),
          COALESCE(v_item.dano, ''),
          COALESCE(v_item.alcance, ''),
          COALESCE(v_item.critico, ''),
          COALESCE(v_item."desc", ''),
          COALESCE(v_item.visible, true),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          dano = EXCLUDED.dano,
          alcance = EXCLUDED.alcance,
          critico = EXCLUDED.critico,
          "desc" = EXCLUDED."desc",
          visible = EXCLUDED.visible,
          updated_at = NOW();
      END LOOP;
    END IF;

    -- B) Migrar bestiary
    IF v_comp_json->'bestiary' IS NOT NULL AND jsonb_typeof(v_comp_json->'bestiary') = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_comp_json->'bestiary') AS y(id text, nombre text, name text, tipo text, continente text, rarity text, rareza text, montable boolean, absorcion text, defensa text, movilidad text, notas text, habilidades text, visible boolean, image text)
      LOOP
        INSERT INTO public.bestiary (id, campaign_id, nombre, tipo, continente, rareza, montable, absorcion, defensa, movilidad, notas, habilidades, visible, image_url, updated_at)
        VALUES (
          COALESCE(v_item.id, 'bst_' || substr(md5(random()::text), 1, 8)),
          'c0000000-0000-0000-0000-000000000001'::uuid,
          COALESCE(v_item.nombre, v_item.name, 'Criatura'),
          COALESCE(v_item.tipo, 'Animal'),
          COALESCE(v_item.continente, 'Todos'),
          COALESCE(v_item.rareza, v_item.rarity, 'Común'),
          COALESCE(v_item.montable, false),
          COALESCE(v_item.absorcion, '0'),
          COALESCE(v_item.defensa, '10'),
          COALESCE(v_item.movilidad, '6'),
          COALESCE(v_item.notas, ''),
          COALESCE(v_item.habilidades, ''),
          COALESCE(v_item.visible, true),
          v_item.image,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          tipo = EXCLUDED.tipo,
          continente = EXCLUDED.continente,
          rareza = EXCLUDED.rareza,
          montable = EXCLUDED.montable,
          absorcion = EXCLUDED.absorcion,
          defensa = EXCLUDED.defensa,
          movilidad = EXCLUDED.movilidad,
          notas = EXCLUDED.notas,
          habilidades = EXCLUDED.habilidades,
          visible = EXCLUDED.visible,
          image_url = EXCLUDED.image_url,
          updated_at = NOW();
      END LOOP;
    END IF;

    -- C) Migrar buffCatalog
    IF v_comp_json->'buffCatalog' IS NOT NULL AND jsonb_typeof(v_comp_json->'buffCatalog') = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_comp_json->'buffCatalog') AS z(id text, name text, nombre text, tipo text, "desc" text, attr text, bonus text, visible boolean)
      LOOP
        INSERT INTO public.buff_catalog (id, campaign_id, name, tipo, "desc", attr, bonus, visible, updated_at)
        VALUES (
          COALESCE(v_item.id, 'buf_' || substr(md5(random()::text), 1, 8)),
          'c0000000-0000-0000-0000-000000000001'::uuid,
          COALESCE(v_item.name, v_item.nombre, 'Efecto'),
          COALESCE(v_item.tipo, 'buff'),
          COALESCE(v_item."desc", ''),
          COALESCE(v_item.attr, 'todo'),
          COALESCE(v_item.bonus, '1'),
          COALESCE(v_item.visible, true),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          tipo = EXCLUDED.tipo,
          "desc" = EXCLUDED."desc",
          attr = EXCLUDED.attr,
          bonus = EXCLUDED.bonus,
          visible = EXCLUDED.visible,
          updated_at = NOW();
      END LOOP;
    END IF;
  END IF;
END $$;
-- ============================================================================
-- MIGRACIÓN 004: FUNCIONES RPC ATÓMICAS (VIDA, MANÁ, ORO) E IDEMPOTENCIA
-- Fecha: 2026-09-06
-- ============================================================================

-- 1. Tabla de comandos procesados para garantizar IDEMPOTENCIA ante reintentos de red
CREATE TABLE IF NOT EXISTS public.processed_commands (
  command_id UUID PRIMARY KEY,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_commands_created ON public.processed_commands(created_at);

-- Limpieza periódica de comandos antiguos (más de 24 horas)
CREATE OR REPLACE FUNCTION public.clean_old_processed_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM public.processed_commands WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC ATÓMICA: APLICAR DAÑO (apply_damage)
CREATE OR REPLACE FUNCTION public.apply_damage(
  p_character_id UUID,
  p_amount INT,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_combat JSONB;
  v_pv_actual INT;
  v_pv_max INT;
  v_escudo INT;
  v_damage_left INT;
  v_new_pv INT;
  v_new_escudo INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  -- A) Verificación de Idempotencia
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  -- B) Bloqueo de fila para atomicidad estricta
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_combat := COALESCE(v_row.data->'combat', '{}'::jsonb);
  v_pv_max := COALESCE((v_combat->>'pvMax')::int, 20);
  v_pv_actual := COALESCE((v_combat->>'pvActual')::int, v_pv_max);
  v_escudo := COALESCE((v_combat->>'escudoActual')::int, 0);

  -- Si amount es negativo o cero, no hacer nada o delegar a curar
  IF p_amount <= 0 THEN
    v_new_pv := v_pv_actual;
    v_new_escudo := v_escudo;
  ELSE
    v_damage_left := p_amount;
    
    -- Absorber primero con escudo si existe
    IF v_escudo > 0 THEN
      IF v_escudo >= v_damage_left THEN
        v_new_escudo := v_escudo - v_damage_left;
        v_damage_left := 0;
      ELSE
        v_damage_left := v_damage_left - v_escudo;
        v_new_escudo := 0;
      END IF;
    ELSE
      v_new_escudo := 0;
    END IF;

    -- El remanente entra a los puntos de vida
    v_new_pv := GREATEST(0, v_pv_actual - v_damage_left);
  END IF;

  -- C) Actualizar combat y estado en characters
  v_combat := jsonb_set(v_combat, '{pvActual}', to_jsonb(v_new_pv));
  v_combat := jsonb_set(v_combat, '{escudoActual}', to_jsonb(v_new_escudo));

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{combat}', v_combat),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'pvActual', v_new_pv,
    'pvMax', v_pv_max,
    'escudoActual', v_new_escudo,
    'damageTaken', p_amount,
    'updated_at', NOW()
  );

  -- D) Guardar comando procesado
  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'apply_damage', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC ATÓMICA: APLICAR CURACIÓN (apply_heal)
CREATE OR REPLACE FUNCTION public.apply_heal(
  p_character_id UUID,
  p_amount INT,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_combat JSONB;
  v_pv_actual INT;
  v_pv_max INT;
  v_new_pv INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  -- A) Idempotencia
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  -- B) Bloqueo de fila
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_combat := COALESCE(v_row.data->'combat', '{}'::jsonb);
  v_pv_max := COALESCE((v_combat->>'pvMax')::int, 20);
  v_pv_actual := COALESCE((v_combat->>'pvActual')::int, 0);

  IF p_amount <= 0 THEN
    v_new_pv := v_pv_actual;
  ELSE
    v_new_pv := LEAST(v_pv_max, v_pv_actual + p_amount);
  END IF;

  v_combat := jsonb_set(v_combat, '{pvActual}', to_jsonb(v_new_pv));

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{combat}', v_combat),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'pvActual', v_new_pv,
    'pvMax', v_pv_max,
    'healedAmount', p_amount,
    'updated_at', NOW()
  );

  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'apply_heal', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC ATÓMICA: MODIFICAR MANÁ (change_mana)
CREATE OR REPLACE FUNCTION public.change_mana(
  p_character_id UUID,
  p_amount INT,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_combat JSONB;
  v_mana_actual INT;
  v_mana_max INT;
  v_new_mana INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_combat := COALESCE(v_row.data->'combat', '{}'::jsonb);
  v_mana_max := COALESCE((v_combat->>'manaMax')::int, 40);
  v_mana_actual := COALESCE((v_combat->>'manaActual')::int, v_mana_max);

  v_new_mana := GREATEST(0, LEAST(v_mana_max, v_mana_actual + p_amount));

  v_combat := jsonb_set(v_combat, '{manaActual}', to_jsonb(v_new_mana));

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{combat}', v_combat),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'manaActual', v_new_mana,
    'manaMax', v_mana_max,
    'delta', p_amount,
    'updated_at', NOW()
  );

  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'change_mana', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC ATÓMICA: MODIFICAR ORO Y PLATA (change_gold)
CREATE OR REPLACE FUNCTION public.change_gold(
  p_character_id UUID,
  p_amount_oro INT,
  p_amount_plata INT DEFAULT 0,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_money JSONB;
  v_oro INT;
  v_plata INT;
  v_new_oro INT;
  v_new_plata INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_money := COALESCE(v_row.data->'money', '{"oro": 0, "plata": 0}'::jsonb);
  v_oro := COALESCE((v_money->>'oro')::int, 0);
  v_plata := COALESCE((v_money->>'plata')::int, 0);

  v_new_oro := GREATEST(0, v_oro + p_amount_oro);
  v_new_plata := GREATEST(0, v_plata + p_amount_plata);

  v_money := jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata);

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{money}', v_money),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'oro', v_new_oro,
    'plata', v_new_plata,
    'deltaOro', p_amount_oro,
    'deltaPlata', p_amount_plata,
    'updated_at', NOW()
  );

  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'change_gold', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- MIGRACIÓN 005: POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- Fecha: 2026-09-06
-- ============================================================================

-- Helper para comprobar si el usuario actual es GM de la campaña
CREATE OR REPLACE FUNCTION public.is_campaign_gm(p_campaign_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = p_campaign_id 
      AND user_id = auth.uid() 
      AND role = 'GM'
  ) OR EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = p_campaign_id AND gm_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper para comprobar si el usuario actual es miembro de la campaña (GM o PLAYER)
CREATE OR REPLACE FUNCTION public.is_campaign_member(p_campaign_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = p_campaign_id 
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. TABLA: campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver sus campañas" ON public.campaigns
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      gm_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.campaign_members WHERE campaign_id = campaigns.id AND user_id = auth.uid())
    )
  );

CREATE POLICY "Solo GM puede modificar su campaña" ON public.campaigns
  FOR UPDATE USING (gm_id = auth.uid());


-- 2. TABLA: campaign_members
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver miembros de su campaña" ON public.campaign_members
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.campaign_members cm WHERE cm.campaign_id = campaign_members.campaign_id AND cm.user_id = auth.uid())
    )
  );


-- 3. TABLA: characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera autenticado puede ver personajes de su campaña" ON public.characters
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Dueño o GM pueden actualizar su personaje" ON public.characters
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid() OR
      public.is_campaign_gm(campaign_id) OR
      EXISTS (
        SELECT 1 FROM public.campaign_members 
        WHERE character_id = characters.id AND user_id = auth.uid()
      )
    )
  );


-- 4. TABLA: maps
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos los miembros pueden ver mapas" ON public.maps
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Solo GM puede crear mapas" ON public.maps
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.is_campaign_gm(campaign_id)
  );

CREATE POLICY "Solo GM puede actualizar mapas" ON public.maps
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_gm(campaign_id)
  );

CREATE POLICY "Solo GM puede borrar mapas" ON public.maps
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_gm(campaign_id)
  );


-- 5. TABLA: map_markers (MARCADORES COMPARTIDOS 100% COLABORATIVOS)
-- Cualquier miembro (GM o PLAYER) puede crear, editar y borrar marcadores
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos los miembros pueden ver marcadores" ON public.map_markers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Cualquier miembro puede crear marcadores" ON public.map_markers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Cualquier miembro puede editar cualquier marcador" ON public.map_markers
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Cualquier miembro puede borrar cualquier marcador" ON public.map_markers
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );


-- 6. TABLAS DE CATÁLOGOS COMPARTIDOS
ALTER TABLE public.weapons_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Miembros pueden ver catálogo de armas" ON public.weapons_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "GM puede gestionar armas" ON public.weapons_catalog
  FOR ALL USING (public.is_campaign_gm(campaign_id));

ALTER TABLE public.bestiary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Miembros pueden ver bestiario" ON public.bestiary
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "GM puede gestionar bestiario" ON public.bestiary
  FOR ALL USING (public.is_campaign_gm(campaign_id));

ALTER TABLE public.buff_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Miembros pueden ver buffs" ON public.buff_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "GM puede gestionar buffs" ON public.buff_catalog
  FOR ALL USING (public.is_campaign_gm(campaign_id));
