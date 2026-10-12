-- 028: Horas de destilado por rareza (Alquimia). Solo añade; no toca datos existentes.
--  1. Columna nueva game_clock.distill_hours (jsonb, puede ser NULL): {"Común":2,"Rara":4,"Muy rara":8,"Legendaria":24}.
--     NULL = valores por defecto del cliente. La cambia solo el máster (misma política de UPDATE que el reloj, 027).
--  2. Al ir en la misma fila que el reloj, llega en directo por la misma suscripción.
-- Se puede ejecutar dos veces sin problema.
--
-- DESHACER (a mano, en el SQL Editor):
--   ALTER TABLE public.game_clock DROP COLUMN IF EXISTS distill_hours;

ALTER TABLE public.game_clock ADD COLUMN IF NOT EXISTS distill_hours jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_clock_distill_hours_obj') THEN
    ALTER TABLE public.game_clock ADD CONSTRAINT game_clock_distill_hours_obj
      CHECK (distill_hours IS NULL OR jsonb_typeof(distill_hours) = 'object');
  END IF;
END $$;
