-- 034: partidas separadas, parte 1 (base). Solo AÑADE: no cambia ninguna política existente
-- ni borra nada, así que la web actual funciona exactamente igual que antes.
--  - Tablas nuevas: campaigns, campaign_members, campaign_invites (con RLS).
--  - Funciones: is_member(p), is_campaign_gm(p), is_world_gm(), house_campaign(house_id).
--  - Partidas: 'c0000000-0000-0000-0000-000000000001' (Krysalis, la actual) y 'prueba-campaign' / 'prueba-campaign-b' (pruebas).
--  - Miembros de Krysalis: todos los perfiles (GM los de profiles.role = 'gm', PLAYER el resto).
--    Las cuentas de prueba (prueba-*@example.com) además en las partidas de prueba.
--  - Mientras dure la transición, un trigger en profiles mete a los usuarios nuevos en Krysalis
--    y mantiene su rol igual que profiles.role (como hoy: quien entra, juega en la partida actual).
--  - Columna campaign_id (con valor por defecto = Krysalis) en characters, campaign_map y app_feedback;
--    FK a campaigns en house, game_clock y las anteriores.
-- Se puede ejecutar dos veces.
--
-- Copias hechas antes (esquema backup): characters_20261013_2330, campaign_map_20261013_2330,
-- app_feedback_20261013_2330, profiles_20261013_2330, house_20261013_2330, game_clock_20261013_2330.
--
-- Deshacer (antes de crear datos de otra partida):
--   DROP TRIGGER IF EXISTS profiles_sync_campaign_member ON public.profiles;
--   DROP FUNCTION IF EXISTS public.sync_profile_campaign_member();
--   ALTER TABLE public.house DROP CONSTRAINT IF EXISTS house_campaign_id_fkey;
--   ALTER TABLE public.game_clock DROP CONSTRAINT IF EXISTS game_clock_campaign_id_fkey;
--   ALTER TABLE public.characters DROP COLUMN IF EXISTS campaign_id;
--   ALTER TABLE public.campaign_map DROP COLUMN IF EXISTS campaign_id;
--   ALTER TABLE public.app_feedback DROP COLUMN IF EXISTS campaign_id;
--   DROP FUNCTION IF EXISTS public.house_campaign(text);
--   DROP FUNCTION IF EXISTS public.is_world_gm();
--   DROP FUNCTION IF EXISTS public.is_campaign_gm(text);
--   DROP FUNCTION IF EXISTS public.is_member(text);
--   DROP TABLE IF EXISTS public.campaign_invites;
--   DROP TABLE IF EXISTS public.campaign_members;
--   DROP TABLE IF EXISTS public.campaigns;

BEGIN;

-- 1. Tablas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived    boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.campaign_members (
  campaign_id  text NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('GM', 'PLAYER')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS campaign_members_user_idx ON public.campaign_members (user_id, campaign_id);

CREATE TABLE IF NOT EXISTS public.campaign_invites (
  code         text PRIMARY KEY,
  campaign_id  text NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  role         text NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('GM', 'PLAYER')),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at      timestamptz
);

-- 2. Funciones de permisos (SECURITY DEFINER para no caer en recursión de RLS)
CREATE OR REPLACE FUNCTION public.is_member(p_campaign text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaign_members
                 WHERE campaign_id = p_campaign AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_campaign_gm(p_campaign text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaign_members
                 WHERE campaign_id = p_campaign AND user_id = auth.uid() AND role = 'GM');
$$;

CREATE OR REPLACE FUNCTION public.is_world_gm() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaign_members
                 WHERE user_id = auth.uid() AND role = 'GM');
$$;

CREATE OR REPLACE FUNCTION public.house_campaign(p_house_id text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT campaign_id FROM public.house WHERE id = p_house_id;
$$;

REVOKE EXECUTE ON FUNCTION public.is_member(text), public.is_campaign_gm(text),
  public.is_world_gm(), public.house_campaign(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member(text), public.is_campaign_gm(text),
  public.is_world_gm(), public.house_campaign(text) TO authenticated;

-- 3. Partidas y miembros
INSERT INTO public.campaigns (id, name) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Krysalis'),
  ('prueba-campaign', 'Prueba A'),
  ('prueba-campaign-b', 'Prueba B')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.campaign_members (campaign_id, user_id, role)
SELECT 'c0000000-0000-0000-0000-000000000001', p.id,
       CASE WHEN p.role = 'gm' THEN 'GM' ELSE 'PLAYER' END
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ON CONFLICT (campaign_id, user_id) DO NOTHING;

INSERT INTO public.campaign_members (campaign_id, user_id, role)
SELECT c.id, p.id, CASE WHEN p.role = 'gm' THEN 'GM' ELSE 'PLAYER' END
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
CROSS JOIN (VALUES ('prueba-campaign'), ('prueba-campaign-b')) AS c(id)
WHERE p.email LIKE 'prueba-%@example.com'
  AND (c.id = 'prueba-campaign' OR p.role = 'gm')
ON CONFLICT (campaign_id, user_id) DO NOTHING;

-- Transición: usuarios nuevos entran en Krysalis y su rol sigue a profiles.role.
CREATE OR REPLACE FUNCTION public.sync_profile_campaign_member() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.campaign_members (campaign_id, user_id, role)
  VALUES ('c0000000-0000-0000-0000-000000000001', NEW.id,
          CASE WHEN NEW.role = 'gm' THEN 'GM' ELSE 'PLAYER' END)
  ON CONFLICT (campaign_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_profile_campaign_member() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_sync_campaign_member ON public.profiles;
CREATE TRIGGER profiles_sync_campaign_member
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_campaign_member();

-- 4. RLS de las tablas nuevas (los cambios de miembros e invitaciones irán por RPC)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_invites ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.campaigns, public.campaign_members, public.campaign_invites FROM anon;
GRANT SELECT, UPDATE ON public.campaigns TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.campaign_members TO authenticated;
GRANT SELECT ON public.campaign_invites TO authenticated;

DROP POLICY IF EXISTS campaigns_select ON public.campaigns;
CREATE POLICY campaigns_select ON public.campaigns FOR SELECT TO authenticated
  USING (public.is_member(id));
DROP POLICY IF EXISTS campaigns_update ON public.campaigns;
CREATE POLICY campaigns_update ON public.campaigns FOR UPDATE TO authenticated
  USING (public.is_campaign_gm(id)) WITH CHECK (public.is_campaign_gm(id));

DROP POLICY IF EXISTS campaign_members_select ON public.campaign_members;
CREATE POLICY campaign_members_select ON public.campaign_members FOR SELECT TO authenticated
  USING (public.is_member(campaign_id));
DROP POLICY IF EXISTS campaign_members_update ON public.campaign_members;
CREATE POLICY campaign_members_update ON public.campaign_members FOR UPDATE TO authenticated
  USING (public.is_campaign_gm(campaign_id) AND user_id <> auth.uid())
  WITH CHECK (public.is_campaign_gm(campaign_id) AND user_id <> auth.uid());
DROP POLICY IF EXISTS campaign_members_delete ON public.campaign_members;
CREATE POLICY campaign_members_delete ON public.campaign_members FOR DELETE TO authenticated
  USING (public.is_campaign_gm(campaign_id) AND user_id <> auth.uid());

DROP POLICY IF EXISTS campaign_invites_select ON public.campaign_invites;
CREATE POLICY campaign_invites_select ON public.campaign_invites FOR SELECT TO authenticated
  USING (public.is_campaign_gm(campaign_id));

-- 5. campaign_id en las tablas de partida (las filas existentes quedan en Krysalis)
ALTER TABLE public.characters   ADD COLUMN IF NOT EXISTS campaign_id text NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000001';
ALTER TABLE public.campaign_map ADD COLUMN IF NOT EXISTS campaign_id text NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000001';
ALTER TABLE public.app_feedback ADD COLUMN IF NOT EXISTS campaign_id text NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000001';

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['characters', 'campaign_map', 'app_feedback', 'house', 'game_clock'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = t || '_campaign_id_fkey') THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE RESTRICT',
                     t, t || '_campaign_id_fkey');
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS characters_campaign_idx ON public.characters (campaign_id);

COMMIT;
