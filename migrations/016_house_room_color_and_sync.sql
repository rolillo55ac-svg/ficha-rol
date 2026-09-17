-- ============================================================================
-- MIGRACIÓN 016: COLOR DE FONDO DE HABITACIONES Y SINCRONIZACIÓN PERMISIVA
-- Fecha: 2026-09-16
-- ============================================================================

-- 1. Añadir columna color a house_rooms si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'house_rooms' AND column_name = 'color'
  ) THEN
    ALTER TABLE public.house_rooms ADD COLUMN color VARCHAR(32) DEFAULT NULL;
  END IF;
END $$;

-- 2. Asegurar que la actualización de muebles, decor y color esté permitida para todos los miembros conectados
DROP POLICY IF EXISTS "house_rooms_update_all_members" ON public.house_rooms;
CREATE POLICY "house_rooms_update_all_members" ON public.house_rooms 
FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Habilitar publicación Realtime en house_rooms si no está incluida
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.house_rooms;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
