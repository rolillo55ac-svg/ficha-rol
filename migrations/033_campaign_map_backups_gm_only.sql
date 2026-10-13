-- 033: las copias semanales (campaign_map, filas backup_*) solo las lee el máster.
-- Llevan todo el estado del máster (notas personales de todas las fichas, tickets, bestiario, lore)
-- y antes cualquier usuario con sesión podía leerlas (y le llegaban por tiempo real).
-- El resto de filas (main_map, world_compendium, app_feedback_sync...) siguen igual: las lee cualquiera con sesión.
-- No toca datos ni borra nada: solo cambia la política existente con ALTER POLICY. Se puede ejecutar dos veces.
--
-- Deshacer:
--   ALTER POLICY campaign_map_select ON public.campaign_map TO public USING (auth.uid() IS NOT NULL);

ALTER POLICY campaign_map_select ON public.campaign_map
  TO authenticated
  USING (
    id NOT LIKE 'backup\_%'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('master', 'gm')
    )
  );
