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
