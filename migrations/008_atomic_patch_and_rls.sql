-- ============================================================================
-- MIGRACIÓN 008: GUARDADO ATÓMICO POR FUSIÓN DE JSON (RPC) Y RLS ESTRICTO
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================================

-- Helper para fusión recursiva profunda de objetos JSONB (preserva subclaves no afectadas)
create or replace function public.jsonb_deep_merge(target jsonb, patch jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    jsonb_object_agg(
      coalesce(t.key, p.key),
      case
        when t.value is null then p.value
        when p.value is null then t.value
        when jsonb_typeof(t.value) = 'object' and jsonb_typeof(p.value) = 'object'
          then public.jsonb_deep_merge(t.value, p.value)
        else p.value
      end
    ),
    '{}'::jsonb
  )
  from jsonb_each(coalesce(target, '{}'::jsonb)) t
  full outer join jsonb_each(coalesce(patch, '{}'::jsonb)) p on t.key = p.key;
$$;

-- 1. Función de guardado atómico por fusión de JSON para personajes (evita el reseteo)
create or replace function public.update_character_data(char_id uuid, patch jsonb)
returns public.characters
language plpgsql
as $$
declare
  updated_row public.characters;
begin
  update public.characters
  set data = public.jsonb_deep_merge(coalesce(data, '{}'::jsonb), patch),
      name = coalesce(patch->>'name', name),
      updated_at = now()
  where id = char_id
  returning * into updated_row;

  if not found then
    raise exception 'Personaje no encontrado o sin permiso';
  end if;

  return updated_row;
end;
$$;

grant execute on function public.update_character_data(uuid, jsonb) to authenticated;
grant execute on function public.update_character_data(uuid, jsonb) to anon;

-- Misma función para el mapa de campaña y compendio compartido (fusión, no reemplazo)
create or replace function public.update_campaign_map(map_id text, patch jsonb)
returns public.campaign_map
language plpgsql
as $$
declare
  updated_row public.campaign_map;
begin
  update public.campaign_map
  set data = case
        when jsonb_typeof(patch) = 'array' then patch
        else coalesce(data, '{}'::jsonb) || patch
      end,
      updated_at = now()
  where id = map_id
  returning * into updated_row;

  if not found then
    raise exception 'Mapa no encontrado o sin permiso';
  end if;

  return updated_row;
end;
$$;

grant execute on function public.update_campaign_map(text, jsonb) to authenticated;
grant execute on function public.update_campaign_map(text, jsonb) to anon;

-- 2. Volver a activar RLS con políticas reales
alter table public.characters enable row level security;
alter table public.campaign_map enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Permitir todo en characters" on public.characters;
drop policy if exists "Permitir todo en campaign_map" on public.campaign_map;
drop policy if exists "Permitir lectura en profiles" on public.profiles;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "characters_select" on public.characters;
drop policy if exists "characters_update" on public.characters;
drop policy if exists "characters_insert" on public.characters;
drop policy if exists "characters_delete" on public.characters;
drop policy if exists "campaign_map_select" on public.campaign_map;
drop policy if exists "campaign_map_update" on public.campaign_map;
drop policy if exists "campaign_map_insert" on public.campaign_map;

-- profiles: cualquiera autenticado puede leer roles (necesario para comprobar si es master),
-- pero NADIE puede escribir desde la app. El rol se asigna a mano desde el Table Editor.
create policy "profiles_select" on public.profiles
  for select using (auth.uid() is not null);

-- characters: el dueño ve/edita la suya; el master ve/edita todas
create policy "characters_select" on public.characters
  for select using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'master' or p.role = 'gm'))
  );

create policy "characters_update" on public.characters
  for update using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'master' or p.role = 'gm'))
  );

create policy "characters_insert" on public.characters
  for insert with check (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'master' or p.role = 'gm'))
  );

create policy "characters_delete" on public.characters
  for delete using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'master' or p.role = 'gm'))
  );

-- campaign_map: cualquier autenticado puede leer; solo el master edita
create policy "campaign_map_select" on public.campaign_map
  for select using (auth.uid() is not null);

create policy "campaign_map_update" on public.campaign_map
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'master' or p.role = 'gm'))
  );

create policy "campaign_map_insert" on public.campaign_map
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'master' or p.role = 'gm'))
  );
