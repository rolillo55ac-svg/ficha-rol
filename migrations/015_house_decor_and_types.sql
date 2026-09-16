-- ============================================================================
-- MIGRACIÓN 015: CAPA DE DECORACIÓN Y PASILLOS EN LA CASA
-- Fecha: 2026-09-16
-- ============================================================================

-- 1. Añadir columna decor (JSONB) a house_rooms si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'house_rooms' AND column_name = 'decor'
  ) THEN
    ALTER TABLE public.house_rooms ADD COLUMN decor JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Índice para consultas optimizadas de habitaciones y tipos
CREATE INDEX IF NOT EXISTS idx_house_rooms_type ON public.house_rooms(house_id, room_type);
