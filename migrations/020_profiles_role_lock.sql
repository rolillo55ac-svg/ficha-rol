-- 020: Nadie puede cambiarse el rol (ni hacerse máster) desde la web o la consola.
-- Antes: la política "editar mi propio perfil" + el permiso UPDATE sobre todas las columnas
-- dejaban a cualquier usuario hacer  update profiles set role = 'gm'  en su propia fila.
-- Ahora:
--   * anon y authenticated pierden todos los permisos de escritura sobre profiles
--     (UPDATE, INSERT, DELETE, TRUNCATE, TRIGGER, REFERENCES). Siguen pudiendo leer (SELECT).
--   * authenticated solo puede cambiar su display_name (la política "editar mi propio perfil" limita a su fila).
--   * El perfil nuevo lo crea el disparador on_auth_user_created (handle_new_user, SECURITY DEFINER)
--     con role = 'player' por defecto: no le afecta este cambio.
--   * El rol solo se cambia a mano desde el panel de Supabase.
--   * El esquema backup (copias) queda cerrado a anon y authenticated.
-- Se puede ejecutar dos veces sin problema.
--
-- Copia previa: backup.profiles_20261011 y backup.policies_20261011.
--
-- DESHACER (vuelve a los permisos de antes):
--   GRANT INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.profiles TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

REVOKE ALL ON SCHEMA backup FROM anon, authenticated;
