-- 021 (opcional): solo el máster puede borrar fichas.
-- Quita la política "characters_delete" (dueño o máster). Queda "solo el máster borra fichas" (is_gm()).
-- La web ya solo deja borrar al máster; esto lo asegura también en la base de datos.
-- Se puede ejecutar dos veces sin problema.
--
-- Copia previa: backup.characters_20261011 y backup.policies_20261011.
--
-- DESHACER:
--   CREATE POLICY characters_delete ON public.characters FOR DELETE USING (
--     (owner_id = auth.uid()) OR (EXISTS (SELECT 1 FROM public.profiles p
--       WHERE p.id = auth.uid() AND (p.role = 'master' OR p.role = 'gm'))));

DROP POLICY IF EXISTS characters_delete ON public.characters;
