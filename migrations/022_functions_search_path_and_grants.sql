-- 022: Avisos de seguridad de funciones (get_advisors).
--  1. search_path fijo (public, pg_temp) en is_gm, handle_new_user, update_character_data,
--     jsonb_deep_merge y update_campaign_map. Solo cambia su configuración, no su código.
--  2. handle_new_user (la ejecuta el disparador on_auth_user_created al registrarse alguien):
--     nadie puede llamarla desde la API. El disparador sigue funcionando igual.
--  3. is_gm NO se le quita a anon: la lectura de fichas consulta profiles, cuya política
--     "el máster ve todos los perfiles" llama a is_gm(); sin ese permiso, leer fichas sin sesión
--     da error (la web lo hace al arrancar). Para anon is_gm() solo devuelve false: es inofensivo.
-- Se puede ejecutar dos veces sin problema.
--
-- Definiciones de antes (sin SET search_path; el código no cambia con esta migración):
--   is_gm()                 SECURITY DEFINER  select coalesce((select role = 'gm' from public.profiles where id = auth.uid()), false);
--   handle_new_user()       SECURITY DEFINER  insert into public.profiles (id, email) values (new.id, new.email); return new;
--   update_character_data() INVOKER           update characters set data = jsonb_deep_merge(data, patch), name = coalesce(patch->>'name', name) ...
--   jsonb_deep_merge()      INVOKER IMMUTABLE fusión recursiva de objetos jsonb
--   update_campaign_map()   INVOKER           update campaign_map set data = patch (array) o data || patch (objeto) ...
-- Permisos de antes en las cinco: EXECUTE para PUBLIC, anon, authenticated y service_role.
--
-- DESHACER:
--   ALTER FUNCTION public.is_gm() RESET search_path;
--   ALTER FUNCTION public.handle_new_user() RESET search_path;
--   ALTER FUNCTION public.update_character_data(uuid, jsonb) RESET search_path;
--   ALTER FUNCTION public.jsonb_deep_merge(jsonb, jsonb) RESET search_path;
--   ALTER FUNCTION public.update_campaign_map(text, jsonb) RESET search_path;
--   GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated;

ALTER FUNCTION public.is_gm() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_character_data(uuid, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.jsonb_deep_merge(jsonb, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_campaign_map(text, jsonb) SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

