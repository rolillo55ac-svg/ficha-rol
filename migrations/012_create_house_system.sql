-- ============================================================================
-- MIGRACIÓN 012: SISTEMA EXPERIMENTAL "LA CASA" (PROTOTIPO BETA)
-- Fecha: 2026-09-15
-- Tablas: house, house_rooms, house_upgrades, house_events
-- ============================================================================

-- 1. TABLA: house (Una por campaña)
CREATE TABLE IF NOT EXISTS public.house (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'La Casa Andante',
  description TEXT DEFAULT 'Un antiguo hogar nómada encantado con voluntad propia, guiado por un libro sapiente.',
  level INT NOT NULL DEFAULT 1,
  progress_current INT NOT NULL DEFAULT 0,
  progress_max INT NOT NULL DEFAULT 100,

  -- Estadísticas propias de la casa
  confort INT NOT NULL DEFAULT 1,
  confort_progress INT NOT NULL DEFAULT 0,
  confort_max INT NOT NULL DEFAULT 10,

  arcana INT NOT NULL DEFAULT 1,
  arcana_progress INT NOT NULL DEFAULT 0,
  arcana_max INT NOT NULL DEFAULT 10,

  provisiones INT NOT NULL DEFAULT 1,
  provisiones_progress INT NOT NULL DEFAULT 0,
  provisiones_max INT NOT NULL DEFAULT 10,

  custodia INT NOT NULL DEFAULT 1,
  custodia_progress INT NOT NULL DEFAULT 0,
  custodia_max INT NOT NULL DEFAULT 10,

  vinculo INT NOT NULL DEFAULT 1,
  vinculo_progress INT NOT NULL DEFAULT 0,
  vinculo_max INT NOT NULL DEFAULT 10,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);

-- 2. TABLA: house_rooms (Habitaciones y plano interactivo por cuadrícula)
CREATE TABLE IF NOT EXISTS public.house_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES public.house(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL DEFAULT 'habitacion_comun' CHECK (room_type IN ('cocina', 'salon', 'habitacion_personal', 'habitacion_comun', 'otro')),
  name TEXT NOT NULL,
  owner_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  level INT NOT NULL DEFAULT 1,
  description TEXT DEFAULT '',

  -- Coordenadas del plano funcional interactivo
  pos_x INT NOT NULL DEFAULT 0,
  pos_y INT NOT NULL DEFAULT 0,
  width INT NOT NULL DEFAULT 2,
  height INT NOT NULL DEFAULT 2,
  floor INT NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: house_upgrades (Mejoras instaladas y vinculación con buffs)
CREATE TABLE IF NOT EXISTS public.house_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES public.house(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.house_rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  unlocked BOOLEAN NOT NULL DEFAULT false,
  effect_type TEXT NOT NULL DEFAULT 'narrativo' CHECK (effect_type IN ('buff', 'narrativo', 'otro')),
  buff_id TEXT DEFAULT NULL,
  required_house_level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: house_events (Historial narrativo y de progresión)
CREATE TABLE IF NOT EXISTS public.house_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES public.house(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('level_up', 'unlock_upgrade', 'progress_gain', 'room_update', 'stat_gain')),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_house_campaign ON public.house(campaign_id);
CREATE INDEX IF NOT EXISTS idx_house_rooms_house ON public.house_rooms(house_id);
CREATE INDEX IF NOT EXISTS idx_house_rooms_owner ON public.house_rooms(owner_character_id);
CREATE INDEX IF NOT EXISTS idx_house_upgrades_house ON public.house_upgrades(house_id);
CREATE INDEX IF NOT EXISTS idx_house_upgrades_room ON public.house_upgrades(room_id);
CREATE INDEX IF NOT EXISTS idx_house_events_house ON public.house_events(house_id);

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.house ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_events ENABLE ROW LEVEL SECURITY;

-- Lectura: Pública para miembros y clientes de la aplicación
DROP POLICY IF EXISTS "house_select_all" ON public.house;
CREATE POLICY "house_select_all" ON public.house FOR SELECT USING (true);

DROP POLICY IF EXISTS "house_rooms_select_all" ON public.house_rooms;
CREATE POLICY "house_rooms_select_all" ON public.house_rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "house_upgrades_select_all" ON public.house_upgrades;
CREATE POLICY "house_upgrades_select_all" ON public.house_upgrades FOR SELECT USING (true);

DROP POLICY IF EXISTS "house_events_select_all" ON public.house_events;
CREATE POLICY "house_events_select_all" ON public.house_events FOR SELECT USING (true);

-- Escritura en house: Solo GM o service_role
DROP POLICY IF EXISTS "house_modify_gm" ON public.house;
CREATE POLICY "house_modify_gm" ON public.house FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.campaign_members 
    WHERE campaign_id = house.campaign_id AND user_id = auth.uid() AND role = 'GM'
  ) OR EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = house.campaign_id AND gm_id = auth.uid()
  ) OR (auth.jwt()->>'role' = 'service_role')
);

-- Modificación en house_rooms: GM o dueño de la habitación personal (solo su fila)
DROP POLICY IF EXISTS "house_rooms_insert_gm" ON public.house_rooms;
CREATE POLICY "house_rooms_insert_gm" ON public.house_rooms FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaign_members cm ON cm.campaign_id = h.campaign_id
    WHERE h.id = house_rooms.house_id AND cm.user_id = auth.uid() AND cm.role = 'GM'
  ) OR EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaigns c ON c.id = h.campaign_id
    WHERE h.id = house_rooms.house_id AND c.gm_id = auth.uid()
  ) OR (auth.jwt()->>'role' = 'service_role')
);

DROP POLICY IF EXISTS "house_rooms_update_gm_or_owner" ON public.house_rooms;
CREATE POLICY "house_rooms_update_gm_or_owner" ON public.house_rooms FOR UPDATE USING (
  -- Es GM
  EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaign_members cm ON cm.campaign_id = h.campaign_id
    WHERE h.id = house_rooms.house_id AND cm.user_id = auth.uid() AND cm.role = 'GM'
  ) OR EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaigns c ON c.id = h.campaign_id
    WHERE h.id = house_rooms.house_id AND c.gm_id = auth.uid()
  ) OR (
    -- Es el dueño asignado de esta habitación personal
    owner_character_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.campaign_members cm
        WHERE cm.character_id = house_rooms.owner_character_id AND cm.user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.characters ch
        WHERE ch.id = house_rooms.owner_character_id AND ch.owner_id = auth.uid()
      )
    )
  ) OR (auth.jwt()->>'role' = 'service_role')
);

DROP POLICY IF EXISTS "house_rooms_delete_gm" ON public.house_rooms;
CREATE POLICY "house_rooms_delete_gm" ON public.house_rooms FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaign_members cm ON cm.campaign_id = h.campaign_id
    WHERE h.id = house_rooms.house_id AND cm.user_id = auth.uid() AND cm.role = 'GM'
  ) OR EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaigns c ON c.id = h.campaign_id
    WHERE h.id = house_rooms.house_id AND c.gm_id = auth.uid()
  ) OR (auth.jwt()->>'role' = 'service_role')
);

-- house_upgrades: Solo GM
DROP POLICY IF EXISTS "house_upgrades_all_gm" ON public.house_upgrades;
CREATE POLICY "house_upgrades_all_gm" ON public.house_upgrades FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaign_members cm ON cm.campaign_id = h.campaign_id
    WHERE h.id = house_upgrades.house_id AND cm.user_id = auth.uid() AND cm.role = 'GM'
  ) OR EXISTS (
    SELECT 1 FROM public.house h
    JOIN public.campaigns c ON c.id = h.campaign_id
    WHERE h.id = house_upgrades.house_id AND c.gm_id = auth.uid()
  ) OR (auth.jwt()->>'role' = 'service_role')
);

-- house_events: Insertable por usuarios autenticados
DROP POLICY IF EXISTS "house_events_insert_auth" ON public.house_events;
CREATE POLICY "house_events_insert_auth" ON public.house_events FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' OR (auth.jwt()->>'role' = 'service_role')
);

-- ============================================================================
-- 5. SEMILLA INICIAL PARA CAMPAÑA PRINCIPAL
-- ============================================================================
DO $$
DECLARE
  v_campaign_id UUID := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_house_id UUID := 'h0000000-0000-0000-0000-000000000001'::uuid;
  v_salon_id UUID := 'r0000000-0000-0000-0000-000000000001'::uuid;
  v_cocina_id UUID := 'r0000000-0000-0000-0000-000000000002'::uuid;
  v_cherk_room_id UUID := 'r0000000-0000-0000-0000-000000000003'::uuid;
  v_scarleth_room_id UUID := 'r0000000-0000-0000-0000-000000000004'::uuid;
  v_derek_room_id UUID := 'r0000000-0000-0000-0000-000000000005'::uuid;
  v_bucky_room_id UUID := 'r0000000-0000-0000-0000-000000000006'::uuid;
  v_ink_room_id UUID := 'r0000000-0000-0000-0000-000000000007'::uuid;
BEGIN
  -- Verificar que la campaña exista
  IF EXISTS (SELECT 1 FROM public.campaigns WHERE id = v_campaign_id) THEN
    -- Insertar Casa
    INSERT INTO public.house (
      id, campaign_id, name, description, level, progress_current, progress_max,
      confort, confort_progress, confort_max,
      arcana, arcana_progress, arcana_max,
      provisiones, provisiones_progress, provisiones_max,
      custodia, custodia_progress, custodia_max,
      vinculo, vinculo_progress, vinculo_max
    ) VALUES (
      v_house_id, v_campaign_id, 'La Casa Andante',
      'Un antiguo hogar nómada encantado que viaja entre tierras guiado por un libro sapiente.',
      1, 0, 100,
      1, 0, 10,
      1, 0, 10,
      1, 0, 10,
      1, 0, 10,
      1, 0, 10
    ) ON CONFLICT (id) DO NOTHING;

    -- Habitaciones Comunes
    INSERT INTO public.house_rooms (id, house_id, room_type, name, level, description, pos_x, pos_y, width, height, floor)
    VALUES
      (v_salon_id, v_house_id, 'salon', 'Salón del Hogar Caliente', 1, 'Espaciosa sala central con chimenea encantada, sillones de terciopelo gastado y un atril donde reposa el Libro Guía.', 0, 0, 3, 2, 1),
      (v_cocina_id, v_house_id, 'cocina', 'Cocina del Caldero Errante', 1, 'Cocina rústica donde el fuego nunca se apaga. Huele a especias raras y caldo caliente.', 3, 0, 3, 2, 1)
    ON CONFLICT (id) DO NOTHING;

    -- Habitaciones Personales (Vinculadas a los personajes oficiales)
    INSERT INTO public.house_rooms (id, house_id, room_type, name, owner_character_id, level, description, pos_x, pos_y, width, height, floor)
    VALUES
      (v_cherk_room_id, v_house_id, 'habitacion_personal', 'Rincón Botánico de Cherk', 'a8039428-8ee7-4e31-baba-c6a1d8b6d8f3'::uuid, 1, 'Habitación húmeda y sombría repleta de frascos con musgos, nenúfares y brotes venenosos.', 0, 2, 2, 2, 1),
      (v_scarleth_room_id, v_house_id, 'habitacion_personal', 'Aposentos de Scarleth', '5e9c545e-176a-4e99-a3e7-299f89fa0779'::uuid, 1, 'Estancia silenciosa con estanterías de pergaminos, velas violetas y un escritorio ordenado.', 2, 2, 2, 2, 1),
      (v_derek_room_id, v_house_id, 'habitacion_personal', 'Cuarto de Derek', 'd9dee50e-051d-4058-b4a5-d46c809fbb25'::uuid, 1, 'Habitación robusta con armero de madera pulida, afiladores de espadas y correajes.', 4, 2, 2, 2, 1),
      (v_bucky_room_id, v_house_id, 'habitacion_personal', 'Taller de Bucky', '4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e'::uuid, 1, 'Espacio lleno de herramientas curiosas, engranajes y pieles de animales curtidas.', 0, 4, 2, 2, 1),
      (v_ink_room_id, v_house_id, 'habitacion_personal', 'Estudio de Ink', 'ece1cdb6-f8c6-4010-b3e8-045887dc92a3'::uuid, 1, 'Estancia con bocetos en las paredes, tinta aromática y cojines para el descanso.', 2, 4, 2, 2, 1)
    ON CONFLICT (id) DO NOTHING;

    -- Mejoras Semilla Iniciales
    INSERT INTO public.house_upgrades (id, house_id, room_id, name, description, unlocked, effect_type, required_house_level)
    VALUES
      ('u0000000-0000-0000-0000-000000000001'::uuid, v_house_id, v_cocina_id, 'Horno Encantado', 'Mantiene la comida caliente de forma mágica y realza las propiedades nutritivas.', false, 'narrativo', 1),
      ('u0000000-0000-0000-0000-000000000002'::uuid, v_house_id, v_cherk_room_id, 'Invernadero de Hongos y Venenos', 'Permite cultivar especies vegetales tóxicas con mayor efectividad en cada descanso.', false, 'narrativo', 1)
    ON CONFLICT (id) DO NOTHING;

    -- Evento inicial
    INSERT INTO public.house_events (house_id, event_type, payload)
    VALUES (
      v_house_id, 'level_up',
      '{"message": "La Casa Andante ha despertado a su nivel inicial 1.", "level": 1}'::jsonb
    );
  END IF;
END $$;
