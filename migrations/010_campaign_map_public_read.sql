-- ==============================================================================
-- MIGRACIÓN 010: Permitir lectura pública de campaign_map (compendio y misiones)
-- Permite que cualquier jugador o dispositivo pueda cargar las misiones y mapas
-- compartidos por el Master sin requerir sesión activa obligatoria previa.
-- Las operaciones de escritura y actualización siguen protegidas por rol de Master.
-- ==============================================================================

drop policy if exists "campaign_map_select" on public.campaign_map;

create policy "campaign_map_select" on public.campaign_map
  for select using (true);
