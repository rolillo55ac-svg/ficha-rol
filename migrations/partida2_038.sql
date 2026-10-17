-- PARA LA PARTIDA 2 (proyecto teyxwlezzpongijlslty): pegar tal cual en su SQL Editor. Es la misma 038 de Krysalis.
-- 038: sin sesión no se ve ni se toca nada (tarea 55, versión A).
-- Las políticas que valían para el rol "public" (también anon) pasan a "authenticated"; sus condiciones no
-- cambian. Se quitan a anon los permisos sobre tablas y funciones de public (la web no lee nada sin entrar).
-- Antes, anon podía leer el lore revelado de campaign_lore.
-- No borra datos. Se puede ejecutar dos veces. Lista de políticas cambiadas: backup.policies_20261017_038.
-- Para deshacer (SQL Editor):
--   DO $$ DECLARE p record; BEGIN
--     FOR p IN SELECT tablename, policyname FROM backup.policies_20261017_038 LOOP
--       EXECUTE format('ALTER POLICY %I ON public.%I TO public', p.policyname, p.tablename);
--     END LOOP; END $$;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
--   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.policies_20261017_038 AS
  SELECT tablename, policyname, cmd, roles::text AS roles, qual, with_check
  FROM pg_policies WHERE schemaname = 'public' AND 'public' = ANY(roles);

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND 'public' = ANY(roles) LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', p.policyname, p.tablename);
  END LOOP;
END $$;

-- Quien entra conserva justo las funciones que ya podía usar (antes las tenía por PUBLIC)
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.prokind = 'f' AND has_function_privilege('authenticated', p.oid, 'EXECUTE') LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
