-- PARA LA PARTIDA 2 (proyecto teyxwlezzpongijlslty): pegar tal cual en su SQL Editor. Es la 037 de Krysalis
-- adaptada (aquí no hay campaign_members y las políticas ya usan is_gm()).
-- 037: rol admin, separado del máster (tarea 55). Columna nueva profiles.is_admin. El admin puede todo lo
-- del máster (is_gm() = es_master_o_admin()); es_admin() solo el admin. Nadie se pone admin desde la web.
-- lolorey92@gmail.com queda como admin ahora o, si aún no tiene cuenta aquí, en cuanto se cree.
-- Se puede ejecutar dos veces. No borra datos. Para deshacer:
--   CREATE OR REPLACE FUNCTION public.is_gm() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
--     SET search_path = public, pg_temp AS
--     $$ select coalesce((select role = 'gm' from public.profiles where id = auth.uid()), false); $$;
--   DROP TRIGGER IF EXISTS profiles_admin_guard ON public.profiles;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

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

-- La cuenta de Chemo nace como admin si se crea más tarde
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
begin
  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, lower(coalesce(new.email, '')) = 'lolorey92@gmail.com');
  return new;
end;
$$;

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

UPDATE public.profiles SET is_admin = true WHERE lower(email) = 'lolorey92@gmail.com' AND NOT is_admin;
