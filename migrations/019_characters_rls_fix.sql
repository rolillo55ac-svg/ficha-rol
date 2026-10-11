-- 019: Quita la política "Cualquiera autenticado actualiza fichas" de public.characters.
-- Esa política (FOR ALL) dejaba a cualquier jugador con sesión cambiar o borrar fichas ajenas.
-- Quedan las políticas que ya existían: ver (cualquier autenticado), crear y editar (dueño o máster)
-- y borrar (máster; el dueño su propia ficha).
-- Se puede ejecutar dos veces sin problema.
--
-- Copia previa: backup.characters_20261011 y backup.policies_20261011.
--
-- DESHACER (vuelve a crear la política tal como estaba):
--   CREATE POLICY "Cualquiera autenticado actualiza fichas" ON public.characters
--     FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Cualquiera autenticado actualiza fichas" ON public.characters;
