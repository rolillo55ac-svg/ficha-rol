-- ============================================================================
-- MIGRACIÓN 014: PLANTAS MÚLTIPLES, MUEBLES CON INVENTARIO Y BUFFS EVOLUTIVOS
-- Fecha: 2026-09-15
-- ============================================================================

-- 1. Añadir columna furniture (JSONB) a house_rooms si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'house_rooms' AND column_name = 'furniture'
  ) THEN
    ALTER TABLE public.house_rooms ADD COLUMN furniture JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Añadir columnas de nivel y valor a house_upgrades si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'house_upgrades' AND column_name = 'level'
  ) THEN
    ALTER TABLE public.house_upgrades ADD COLUMN level INT NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'house_upgrades' AND column_name = 'bonus_value'
  ) THEN
    ALTER TABLE public.house_upgrades ADD COLUMN bonus_value TEXT DEFAULT '+1';
  END IF;
END $$;

-- 3. Índices para consultas de plantas y mejoras
CREATE INDEX IF NOT EXISTS idx_house_rooms_floor ON public.house_rooms(house_id, floor);
CREATE INDEX IF NOT EXISTS idx_house_upgrades_lvl ON public.house_upgrades(house_id, level);

-- 4. Distribución por plantas en la semilla inicial para mayor orden visual:
-- Planta 1 (Principal/Común): Salón, Cocina, Rincón de Cherk, Aposentos de Scarleth
UPDATE public.house_rooms 
SET floor = 1, pos_x = 0, pos_y = 0, width = 3, height = 2 
WHERE id = 'r0000000-0000-0000-0000-000000000001'::uuid;

UPDATE public.house_rooms 
SET floor = 1, pos_x = 3, pos_y = 0, width = 3, height = 2 
WHERE id = 'r0000000-0000-0000-0000-000000000002'::uuid;

UPDATE public.house_rooms 
SET floor = 1, pos_x = 0, pos_y = 2, width = 3, height = 2 
WHERE id = 'r0000000-0000-0000-0000-000000000003'::uuid;

UPDATE public.house_rooms 
SET floor = 1, pos_x = 3, pos_y = 2, width = 3, height = 2 
WHERE id = 'r0000000-0000-0000-0000-000000000004'::uuid;

-- Planta 2 (Planta Alta / Aposentos): Cuarto de Derek, Taller de Bucky, Estudio de Ink
UPDATE public.house_rooms 
SET floor = 2, pos_x = 0, pos_y = 0, width = 3, height = 2 
WHERE id = 'r0000000-0000-0000-0000-000000000005'::uuid;

UPDATE public.house_rooms 
SET floor = 2, pos_x = 3, pos_y = 0, width = 3, height = 2 
WHERE id = 'r0000000-0000-0000-0000-000000000006'::uuid;

UPDATE public.house_rooms 
SET floor = 2, pos_x = 0, pos_y = 2, width = 3, height = 2 
WHERE id = 'r0000000-0000-0000-0000-000000000007'::uuid;

-- 5. Semilla inicial de muebles de ejemplo en Cherk y Cocina
UPDATE public.house_rooms
SET furniture = '[
  {
    "id": "fur_cocina_1",
    "name": "Alacena de Roble Mágico",
    "type": "alacena",
    "items": [
      { "name": "Especias del Bosque Negro", "qty": 3, "notes": "Aumenta el aroma de los guisos." },
      { "name": "Ración de viaje curada", "qty": 6, "notes": "Alimento imperecedero." }
    ]
  }
]'::jsonb
WHERE id = 'r0000000-0000-0000-0000-000000000002'::uuid
AND (furniture IS NULL OR furniture = '[]'::jsonb);

UPDATE public.house_rooms
SET furniture = '[
  {
    "id": "fur_cherk_1",
    "name": "Estantería de Frascos y Musgos",
    "type": "estanteria",
    "items": [
      { "name": "Seta terrosa recolectada", "qty": 2, "notes": "Para ungüentos botánicos." },
      { "name": "Frasco de savia espesa", "qty": 1, "notes": "Cosechada cerca del río." }
    ]
  },
  {
    "id": "fur_cherk_2",
    "name": "Baúl de Viaje",
    "type": "baul",
    "items": [
      { "name": "Cuerda de cáñamo resistente", "qty": 1, "notes": "10 metros." }
    ]
  }
]'::jsonb
WHERE id = 'r0000000-0000-0000-0000-000000000003'::uuid
AND (furniture IS NULL OR furniture = '[]'::jsonb);
