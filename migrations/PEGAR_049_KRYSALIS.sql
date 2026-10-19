-- PEGAR EN Krysalis: SQL Editor de Supabase > pegar todo > Run. Es la migración 049 (tarea 61).
-- Si algo falla, no se aplica nada (va entero en una transacción). Se puede pegar dos veces.
-- Al final sale una tabla de comprobación: "quedan" debe ser 0 y "politicas_fotos" debe decir
-- solo "imagenes: listan quien subio y el master" (más las de subir, cambiar y borrar).
BEGIN;
-- 049: avisos del panel de Supabase (tarea 61). No cambia quién puede hacer qué ni toca datos.
-- * Políticas RLS de public y realtime: auth.uid() / auth.role() pasan a (select auth.uid()) /
--   (select auth.role()), con la misma lógica. Así se calculan una vez por consulta y no por fila.
--   Se hace con un bloque que recorre las políticas, para que valga igual en Krysalis y en Venda2.
-- * Índices en claves externas que no tenían (tablas pequeñas, no bloquea nada).
-- * Quita EXECUTE a funciones SECURITY DEFINER que no llama la web ni ninguna política ni función:
--   house_campaign, is_world_gm, es_master_o_admin y gallery_limite (esta es de trigger: el trigger
--   sigue funcionando, solo deja de poder llamarse por /rpc).
-- * Fotos (bucket images): se quita la política que dejaba a cualquiera, incluso sin sesión, LISTAR todos
--   los archivos. Las fotos se siguen viendo igual (el bucket es público y sus URL no pasan por RLS).
--   Listar solo puede quien subió el archivo (lo necesita la subida con upsert) y el máster/admin
--   (medidor de Ajustes › Almacenamiento). Subir, cambiar y borrar siguen igual.
-- Los toca el esquema auth/storage, así que lo pega Chemo (PEGAR_049_KRYSALIS.sql y PEGAR_049_VENDA2.sql).
-- Se puede ejecutar dos veces.
-- Para deshacer:
--   * Políticas: restaurar con el SQL guardado en backup.policies_049 (columna sql_antes), por ejemplo:
--       DO $$ DECLARE r record; BEGIN FOR r IN SELECT sql_antes FROM backup.policies_049 LOOP EXECUTE r.sql_antes; END LOOP; END $$;
--   * DROP INDEX IF EXISTS public.app_feedback_campaign_id_idx, public.campaign_invites_campaign_id_idx,
--       public.campaign_invites_created_by_idx, public.campaign_invites_used_by_idx,
--       public.campaign_map_campaign_id_idx, public.campaigns_created_by_idx,
--       public.characters_owner_id_idx, public.house_secrets_house_id_idx;
--   * GRANT EXECUTE ON FUNCTION public.house_campaign(text), public.is_world_gm(),
--       public.es_master_o_admin(), public.gallery_limite() TO authenticated;
--   * DROP POLICY IF EXISTS "imagenes: listan quien subio y el master" ON storage.objects;
--     CREATE POLICY "Permitir lectura publica imagenes" ON storage.objects FOR SELECT TO public
--       USING (bucket_id = 'images');

CREATE SCHEMA IF NOT EXISTS backup;

-- Copia de las políticas tal como estaban (solo la primera vez)
DO $$
DECLARE r record;
BEGIN
  IF to_regclass('backup.policies_049') IS NULL THEN
    CREATE TABLE backup.policies_049 (schemaname name, tablename name, policyname name, sql_antes text);
    FOR r IN
      SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies
      WHERE schemaname IN ('public', 'realtime')
        AND (coalesce(qual, '') ~ 'auth\.(uid|role|jwt)\(\)' OR coalesce(with_check, '') ~ 'auth\.(uid|role|jwt)\(\)')
    LOOP
      INSERT INTO backup.policies_049 VALUES (r.schemaname, r.tablename, r.policyname,
        format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename)
        || CASE WHEN r.qual IS NOT NULL THEN ' USING (' || r.qual || ')' ELSE '' END
        || CASE WHEN r.with_check IS NOT NULL THEN ' WITH CHECK (' || r.with_check || ')' ELSE '' END);
    END LOOP;
    ALTER TABLE backup.policies_049 ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- (select auth.xxx()) en las políticas; las que ya lo tienen no se tocan
DO $$
DECLARE
  r record;
  q text;
  c text;
  pat constant text := '(?<!SELECT )auth\.(uid|role|jwt)\(\)';
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies
    WHERE schemaname IN ('public', 'realtime')
      AND (coalesce(qual, '') ~ pat OR coalesce(with_check, '') ~ pat)
  LOOP
    q := regexp_replace(r.qual, pat, '(select auth.\1())', 'g');
    c := regexp_replace(r.with_check, pat, '(select auth.\1())', 'g');
    EXECUTE format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename)
      || CASE WHEN q IS NOT NULL THEN ' USING (' || q || ')' ELSE '' END
      || CASE WHEN c IS NOT NULL THEN ' WITH CHECK (' || c || ')' ELSE '' END;
  END LOOP;
END $$;

-- Índices en claves externas (solo si existe la tabla)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('app_feedback', 'campaign_id'), ('campaign_invites', 'campaign_id'), ('campaign_invites', 'created_by'),
    ('campaign_invites', 'used_by'), ('campaign_map', 'campaign_id'), ('campaigns', 'created_by'),
    ('characters', 'owner_id'), ('house_secrets', 'house_id')) v(t, col)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = r.t AND column_name = r.col) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)', r.t || '_' || r.col || '_idx', r.t, r.col);
    END IF;
  END LOOP;
END $$;

-- Funciones SECURITY DEFINER que nadie llama por /rpc
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.house_campaign(text)', 'public.is_world_gm()', 'public.es_master_o_admin()', 'public.gallery_limite()'] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    END IF;
  END LOOP;
END $$;

-- Fotos: nadie lista el bucket entero salvo el máster/admin
DROP POLICY IF EXISTS "Permitir lectura publica imagenes" ON storage.objects;
DROP POLICY IF EXISTS "imagenes: listan quien subio y el master" ON storage.objects;
CREATE POLICY "imagenes: listan quien subio y el master" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'images' AND (owner_id = (select auth.uid())::text OR (select public.is_gm())));

COMMIT;

SELECT
  (SELECT count(*) FROM pg_policies WHERE schemaname IN ('public','realtime')
     AND (coalesce(qual,'') ~ '(?<!SELECT )auth\.(uid|role|jwt)\(\)' OR coalesce(with_check,'') ~ '(?<!SELECT )auth\.(uid|role|jwt)\(\)')) AS quedan,
  (SELECT string_agg(policyname || ' (' || cmd || ')', ', ') FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') AS politicas_fotos;
