-- ==============================================================================
-- MIGRACIÓN 009: Garantizar autoinserción (upsert) en update_campaign_map
-- Evita fallos "Mapa no encontrado o sin permiso" si la fila aún no se ha creado.
-- ==============================================================================

create or replace function public.update_campaign_map(map_id text, patch jsonb)
returns public.campaign_map
language plpgsql
security definer
as $$
declare
  updated_row public.campaign_map;
begin
  insert into public.campaign_map (id, data, updated_at)
  values (
    map_id,
    case when jsonb_typeof(patch) = 'array' then patch else patch end,
    now()
  )
  on conflict (id) do update
  set data = case
        when jsonb_typeof(patch) = 'array' then patch
        else coalesce(public.campaign_map.data, '{}'::jsonb) || patch
      end,
      updated_at = now()
  returning * into updated_row;

  return updated_row;
end;
$$;

grant execute on function public.update_campaign_map(text, jsonb) to authenticated;
grant execute on function public.update_campaign_map(text, jsonb) to anon;
