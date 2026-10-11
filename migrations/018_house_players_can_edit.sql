-- 018: Permiso del máster para que los jugadores editen su propia habitación en La Casa.
-- Solo añade una columna nueva con valor por defecto false. No modifica datos existentes.

ALTER TABLE public.house
  ADD COLUMN IF NOT EXISTS players_can_edit BOOLEAN NOT NULL DEFAULT false;
