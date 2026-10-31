-- 063: al guardar la ficha, cada campo de primer nivel que llega sustituye entero al anterior.
-- Antes se fusionaba en profundidad y lo borrado dentro de un campo (una bonificación, un objeto…) volvía al recargar.
-- Los campos que no llegan en el parche no se tocan. Dinero y candados siguen en sus disparadores.
-- Idempotente. Aplicar en Krysalis y Venda2.

CREATE OR REPLACE FUNCTION public.update_character_data(char_id uuid, patch jsonb)
 RETURNS characters
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  updated_row public.characters;
begin
  update public.characters
  set data = coalesce(data, '{}'::jsonb) || coalesce(patch, '{}'::jsonb),
      name = coalesce(patch->>'name', name),
      updated_at = now()
  where id = char_id
  returning * into updated_row;

  if not found then
    raise exception 'Personaje no encontrado o sin permiso';
  end if;

  return updated_row;
end;
$function$;

-- Deshacer (volver a la fusión en profundidad):
-- CREATE OR REPLACE FUNCTION public.update_character_data(char_id uuid, patch jsonb)
--  RETURNS characters LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp'
-- AS $function$
-- declare updated_row public.characters;
-- begin
--   update public.characters
--   set data = public.jsonb_deep_merge(coalesce(data, '{}'::jsonb), patch),
--       name = coalesce(patch->>'name', name),
--       updated_at = now()
--   where id = char_id
--   returning * into updated_row;
--   if not found then raise exception 'Personaje no encontrado o sin permiso'; end if;
--   return updated_row;
-- end;
-- $function$;
