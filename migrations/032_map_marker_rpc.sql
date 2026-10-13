-- 032: marcadores del mapa guardables por los jugadores.
-- Los mapas viven en campaign_map (fila 'main_map', array de mapas con sus "markers").
-- Solo el máster puede actualizar esa fila (RLS), así que los marcadores de los jugadores se perdían al recargar.
-- Dos funciones SECURITY DEFINER que tocan UN solo marcador, con la fila bloqueada:
--   save_map_marker(p_map_id, p_marker): añade o edita. El jugador solo edita los suyos (created_by = él);
--     al crear, created_by se pone siempre a auth.uid(). El máster puede con todos.
--   delete_map_marker(p_map_id, p_marker_id): quita uno. Mismas reglas.
-- No cambia el formato ni toca los marcadores que ya existen. Se puede ejecutar dos veces.
-- Deshacer:
--   DROP FUNCTION IF EXISTS public.save_map_marker(text, jsonb);
--   DROP FUNCTION IF EXISTS public.delete_map_marker(text, text);

CREATE OR REPLACE FUNCTION public.save_map_marker(p_map_id text, p_marker jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
declare
  uid uuid := auth.uid();
  gm boolean;
  v_maps jsonb;
  m_idx int;
  k_idx int;
  v_markers jsonb;
  old_marker jsonb;
  new_marker jsonb;
begin
  if uid is null then raise exception 'Sin sesión'; end if;
  if p_marker is null or coalesce(p_marker->>'id', '') = '' then raise exception 'Marcador sin id'; end if;
  gm := exists(select 1 from profiles p where p.id = uid and p.role in ('gm', 'master'));

  select data into v_maps from campaign_map where id = 'main_map' for update;
  if v_maps is null or jsonb_typeof(v_maps) <> 'array' then raise exception 'Mapa no encontrado'; end if;

  select i - 1 into m_idx from jsonb_array_elements(v_maps) with ordinality e(v, i) where v->>'id' = p_map_id limit 1;
  if m_idx is null then raise exception 'Mapa no encontrado'; end if;

  v_markers := coalesce(v_maps->m_idx->'markers', '[]'::jsonb);
  select i - 1, v into k_idx, old_marker from jsonb_array_elements(v_markers) with ordinality e(v, i) where v->>'id' = p_marker->>'id' limit 1;

  if k_idx is null then
    new_marker := p_marker || jsonb_build_object('created_by', uid::text);
    v_markers := v_markers || jsonb_build_array(new_marker);
  else
    if not gm and coalesce(old_marker->>'created_by', '') <> uid::text then
      raise exception 'Sin permiso para editar este marcador';
    end if;
    new_marker := p_marker || jsonb_build_object('created_by', old_marker->'created_by');
    v_markers := jsonb_set(v_markers, array[k_idx::text], new_marker);
  end if;

  update campaign_map
  set data = jsonb_set(v_maps, array[m_idx::text, 'markers'], v_markers), updated_at = now()
  where id = 'main_map';
  return new_marker;
end;
$$;

CREATE OR REPLACE FUNCTION public.delete_map_marker(p_map_id text, p_marker_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
declare
  uid uuid := auth.uid();
  gm boolean;
  v_maps jsonb;
  m_idx int;
  v_markers jsonb;
  old_marker jsonb;
begin
  if uid is null then raise exception 'Sin sesión'; end if;
  gm := exists(select 1 from profiles p where p.id = uid and p.role in ('gm', 'master'));

  select data into v_maps from campaign_map where id = 'main_map' for update;
  if v_maps is null or jsonb_typeof(v_maps) <> 'array' then raise exception 'Mapa no encontrado'; end if;

  select i - 1 into m_idx from jsonb_array_elements(v_maps) with ordinality e(v, i) where v->>'id' = p_map_id limit 1;
  if m_idx is null then raise exception 'Mapa no encontrado'; end if;

  v_markers := coalesce(v_maps->m_idx->'markers', '[]'::jsonb);
  select v into old_marker from jsonb_array_elements(v_markers) v where v->>'id' = p_marker_id limit 1;
  if old_marker is null then return false; end if;
  if not gm and coalesce(old_marker->>'created_by', '') <> uid::text then
    raise exception 'Sin permiso para quitar este marcador';
  end if;

  select coalesce(jsonb_agg(v order by i), '[]'::jsonb) into v_markers from jsonb_array_elements(v_markers) with ordinality e(v, i) where v->>'id' is distinct from p_marker_id;
  update campaign_map
  set data = jsonb_set(v_maps, array[m_idx::text, 'markers'], v_markers), updated_at = now()
  where id = 'main_map';
  return true;
end;
$$;

REVOKE ALL ON FUNCTION public.save_map_marker(text, jsonb) FROM public, anon;
REVOKE ALL ON FUNCTION public.delete_map_marker(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_map_marker(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_map_marker(text, text) TO authenticated;
