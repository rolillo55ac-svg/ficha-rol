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
