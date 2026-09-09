-- ============================================================================
-- MIGRACIÓN 005: AMPLIACIÓN DE MARCADORES DE MAPA E ICONOS PERSONALIZADOS
-- ============================================================================

-- 1. Eliminar la restricción CHECK antigua que limitaba a 4 tipos
ALTER TABLE public.map_markers 
  DROP CONSTRAINT IF EXISTS map_markers_kind_check;

-- 2. Añadir columna 'icon' si no existe
ALTER TABLE public.map_markers 
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📍';

-- 3. Índices de apoyo si fueran necesarios
CREATE INDEX IF NOT EXISTS idx_map_markers_kind ON public.map_markers(kind);
