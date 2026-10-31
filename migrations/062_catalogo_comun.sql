-- 062 · Catálogo común (bestiario y monturas, armas, buffos y lore/fauna) — SOLO KRYSALIS
-- Krysalis guarda el catálogo común en campaign_map 'world_compendium' (bestiary, weaponsCatalog,
-- buffCatalog, lore.objetos), como hasta ahora. Las otras partidas lo leen y escriben con estas
-- dos funciones, enviando el token de su propia sesión: Krysalis se lo pregunta a Venda2
-- (rpc is_gm con ese token) y solo deja leer a cuentas válidas y escribir a máster/admin.
-- Lo propio de cada partida (misiones, pistas, PNJ, resumen, qué ve cada jugador) no pasa por aquí.
-- Deshacer:
--   drop function if exists public.catalogo_comun_guardar(text, jsonb);
--   drop function if exists public.catalogo_comun_leer(text);
--   drop function if exists public._catalogo_rol_otra(text);
--   drop table if exists public.catalogo_tokens;   -- solo caché de comprobaciones, sin datos de jugadores

create extension if not exists http with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- Caché de 10 min de tokens ya comprobados (solo el hash), para no preguntar a Venda2 cada vez
create table if not exists public.catalogo_tokens (
  token_hash text primary key,
  es_master  boolean not null,
  expira     timestamptz not null
);
alter table public.catalogo_tokens enable row level security;
revoke all on public.catalogo_tokens from anon, authenticated;

-- 'master' | 'jugador' | null (token no válido en la otra partida)
create or replace function public._catalogo_rol_otra(p_token text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  h text;
  es boolean;
  resp extensions.http_response;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 4000 then return null; end if;
  h := encode(extensions.digest(p_token, 'sha256'), 'hex');
  select c.es_master into es from public.catalogo_tokens c where c.token_hash = h and c.expira > now();
  if found then return case when es then 'master' else 'jugador' end; end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  select * into resp from extensions.http((
    'POST',
    'https://teyxwlezzpongijlslty.supabase.co/rest/v1/rpc/is_gm',
    array[
      extensions.http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleXh3bGV6enBvbmdpamxzbHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTg4NDMsImV4cCI6MjEwNzQ5NDg0M30.BslXL77ijWeuOTlAtvLr7_m-16mzz2Vr-Te5FPGIQq8'),
      extensions.http_header('Authorization', 'Bearer ' || p_token)
    ],
    'application/json',
    '{}'
  )::extensions.http_request);
  if resp.status is distinct from 200 then return null; end if;
  es := coalesce(trim(resp.content) = 'true', false);

  insert into public.catalogo_tokens(token_hash, es_master, expira)
  values (h, es, now() + interval '10 minutes')
  on conflict (token_hash) do update set es_master = excluded.es_master, expira = excluded.expira;
  return case when es then 'master' else 'jugador' end;
end;
$$;
revoke all on function public._catalogo_rol_otra(text) from public, anon, authenticated;

create or replace function public.catalogo_comun_leer(p_token text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
  t timestamptz;
begin
  if auth.uid() is null and public._catalogo_rol_otra(p_token) is null then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  select data, updated_at into d, t from public.campaign_map where id = 'world_compendium';
  return jsonb_build_object(
    'bestiary',       coalesce(d->'bestiary', '[]'::jsonb),
    'weaponsCatalog', coalesce(d->'weaponsCatalog', '[]'::jsonb),
    'buffCatalog',    coalesce(d->'buffCatalog', '[]'::jsonb),
    'loreObjetos',    coalesce(d->'lore'->'objetos', '[]'::jsonb),
    'actualizado',    t
  );
end;
$$;
revoke all on function public.catalogo_comun_leer(text) from public;
grant execute on function public.catalogo_comun_leer(text) to authenticated;
-- PENDIENTE (lo pega Chemo; el guardián no deja a la máquina dar permisos a anon):
-- grant execute on function public.catalogo_comun_leer(text) to anon;

-- p_patch: { bestiary?: {cambios:[...], borrados:[ids]}, weaponsCatalog?: ..., buffCatalog?: ..., loreObjetos?: ... }
-- Solo lo que ha cambiado: lo demás del catálogo no se toca (así no se pisa lo que otra partida haya hecho a la vez).
-- Protecciones: solo máster/admin de la otra partida; como mucho 3 borrados por lista y llamada;
-- 'visible' lo decide cada partida: se conserva el de Krysalis (nuevas: ocultas en bestiario/lore).
create or replace function public.catalogo_comun_guardar(p_token text, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
  k text;
  ruta text[];
  viejo jsonb;
  cambios jsonb;
  borr jsonb;
  nuevo jsonb;
  vis_def jsonb;
begin
  if public._catalogo_rol_otra(p_token) is distinct from 'master' then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or length(p_patch::text) > 900000 then
    raise exception 'datos no válidos' using errcode = '22023';
  end if;

  select data into d from public.campaign_map where id = 'world_compendium' for update;
  if d is null then raise exception 'sin catálogo' using errcode = 'P0002'; end if;

  foreach k in array array['bestiary', 'weaponsCatalog', 'buffCatalog', 'loreObjetos'] loop
    continue when not (p_patch ? k);
    cambios := coalesce(p_patch->k->'cambios', '[]'::jsonb);
    borr := coalesce(p_patch->k->'borrados', '[]'::jsonb);
    if jsonb_typeof(cambios) <> 'array' or jsonb_typeof(borr) <> 'array' then
      raise exception 'datos no válidos' using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(cambios) e where jsonb_typeof(e) <> 'object' or coalesce(e->>'id', '') = '')
       or exists (select 1 from jsonb_array_elements(borr) e where jsonb_typeof(e) <> 'string') then
      raise exception 'datos no válidos' using errcode = '22023';
    end if;
    if jsonb_array_length(borr) > 3 then
      raise exception 'demasiados borrados de golpe en %', k using errcode = '22023';
    end if;
    ruta := case when k = 'loreObjetos' then array['lore', 'objetos'] else array[k] end;
    viejo := coalesce(d #> ruta, '[]'::jsonb);
    vis_def := case when k in ('bestiary', 'loreObjetos') then 'false'::jsonb else 'true'::jsonb end;

    -- lo que ya había (cambiado si viene en cambios, fuera si viene en borrados), en su orden
    select coalesce(jsonb_agg(
             coalesce(
               (select (c - 'visible') || jsonb_build_object('visible', coalesce(o.e->'visible', 'true'::jsonb))
                  from jsonb_array_elements(cambios) c where c->>'id' = o.e->>'id' limit 1),
               o.e)
             order by o.i), '[]'::jsonb)
      into nuevo
    from jsonb_array_elements(viejo) with ordinality o(e, i)
    where not (borr ? (o.e->>'id'));

    -- y lo nuevo, al final
    select nuevo || coalesce(jsonb_agg((c.e - 'visible') || jsonb_build_object('visible', vis_def) order by c.i), '[]'::jsonb)
      into nuevo
    from jsonb_array_elements(cambios) with ordinality c(e, i)
    where not exists (select 1 from jsonb_array_elements(viejo) o where o->>'id' = c.e->>'id')
      and not (borr ? (c.e->>'id'));

    if k = 'loreObjetos' and jsonb_typeof(d->'lore') is distinct from 'object' then
      d := jsonb_set(d, '{lore}', '{}'::jsonb);
    end if;
    d := jsonb_set(d, ruta, nuevo, true);
  end loop;

  update public.campaign_map set data = d, updated_at = now() where id = 'world_compendium';
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.catalogo_comun_guardar(text, jsonb) from public;
grant execute on function public.catalogo_comun_guardar(text, jsonb) to authenticated;
-- PENDIENTE (lo pega Chemo):
-- grant execute on function public.catalogo_comun_guardar(text, jsonb) to anon;
