-- 037: rol admin, separado del máster (tarea 55).
-- Columna nueva profiles.is_admin (no se toca profiles.role ni su CHECK). El admin puede todo lo del
-- máster: is_gm() (= es_master_o_admin()) devuelve true para role 'gm' o is_admin; es_admin() solo
-- para is_admin (cuentas, accesos, copias...). Las políticas y funciones que comprobaban el rol a mano
-- ('gm'/'master') pasan a usar is_gm().
-- Nadie se pone admin desde la web: authenticated solo puede escribir display_name (020) y además
-- un trigger lo impide con sesión de usuario. Solo SQL o funciones con service_role.
-- Sin DROP (la herramienta de Supabase lo cancela). Se puede ejecutar dos veces. No borra datos.
-- Copia previa: backup.profiles_20261017_rol_admin.
-- Para deshacer (SQL Editor):
--   CREATE OR REPLACE FUNCTION public.is_gm() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
--     SET search_path = public, pg_temp AS
--     $$ select coalesce((select role = 'gm' from public.profiles where id = auth.uid()), false); $$;
--   DROP TRIGGER IF EXISTS profiles_admin_guard ON public.profiles;
--   UPDATE public.profiles SET is_admin = false WHERE is_admin;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;
--   (las políticas y funciones con is_gm() siguen valiendo igual para el máster)

CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.profiles_20261017_rol_admin AS SELECT * FROM public.profiles;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_gm()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  select coalesce((select role = 'gm' or is_admin from public.profiles where id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.es_master_o_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  select public.is_gm();
$$;

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

REVOKE ALL ON FUNCTION public.es_master_o_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.es_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_master_o_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_admin() TO authenticated;

-- Con sesión de usuario nadie cambia is_admin (ni el máster)
CREATE OR REPLACE FUNCTION public.profiles_admin_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'El admin solo se cambia desde el servidor' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER profiles_admin_guard BEFORE UPDATE OF is_admin ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_admin_guard();

-- El admin cuenta como máster en la partida principal
CREATE OR REPLACE FUNCTION public.sync_profile_campaign_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.campaign_members (campaign_id, user_id, role)
  VALUES ('c0000000-0000-0000-0000-000000000001', NEW.id,
          CASE WHEN NEW.role = 'gm' OR NEW.is_admin THEN 'GM' ELSE 'PLAYER' END)
  ON CONFLICT (campaign_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER profiles_sync_campaign_member AFTER INSERT OR UPDATE OF role, is_admin ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_campaign_member();

-- Políticas que miraban el rol a mano
ALTER POLICY characters_select ON public.characters USING (owner_id = auth.uid() OR public.is_gm());
ALTER POLICY characters_update ON public.characters USING (owner_id = auth.uid() OR public.is_gm());
ALTER POLICY characters_insert ON public.characters WITH CHECK (owner_id = auth.uid() OR public.is_gm());
ALTER POLICY campaign_map_select ON public.campaign_map USING (id NOT LIKE 'backup\_%' OR public.is_gm());
ALTER POLICY campaign_map_insert ON public.campaign_map WITH CHECK (public.is_gm());
ALTER POLICY campaign_map_update ON public.campaign_map USING (public.is_gm());

-- Marcadores: el admin edita y quita como el máster (mismo cuerpo, solo cambia la comprobación)
DO $$
DECLARE f regprocedure;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.save_map_marker(text, jsonb)'::regprocedure,
                           'public.delete_map_marker(text, text)'::regprocedure] LOOP
    IF pg_get_functiondef(f) LIKE '%p.role in (''gm'', ''master'')%' THEN
      EXECUTE replace(pg_get_functiondef(f), 'p.role in (''gm'', ''master'')',
                      '(p.role in (''gm'', ''master'') or p.is_admin)');
    END IF;
  END LOOP;
END $$;

-- Chemo es el admin (el trigger de arriba deja hacerlo porque aquí no hay sesión de usuario)
UPDATE public.profiles SET is_admin = true WHERE lower(email) = 'lolorey92@gmail.com' AND NOT is_admin;
