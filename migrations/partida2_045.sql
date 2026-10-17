-- PARA LA PARTIDA 2 (proyecto teyxwlezzpongijlslty): pegar tal cual en su SQL Editor. Es la 045 de Krysalis, salvo que
-- allí no hay tabla de miembros: cada proyecto es una partida, así que la galería la leen y suben todos los que tienen sesión.
-- 045: Galería de Mundo e Historia del personaje (tarea 56). Solo añade: dos tablas nuevas, no toca las demás.
-- gallery: fotos de la partida (solo la URL del bucket images, nunca base64). Leen los miembros de la partida
--   (y máster/admin); sube cualquiera con sesión que sea miembro, a su nombre; borra quien la subió, el máster o el admin.
--   Como mucho 300 fotos por partida. Nadie edita.
-- character_story: historia larga de cada ficha, aparte del JSON de la ficha (que leen todos) para que la privada
--   no viaje a otros jugadores. Leen el dueño, máster/admin y, si visible_para_jugadores, los demás con sesión.
--   Escriben solo el dueño, el máster o el admin. Solo el máster o el admin borran (como las fichas).
-- Las fichas no tenían campo de historia ni trasfondo ("descripcion" es la descripción física): no hay nada que copiar.
-- Se puede ejecutar dos veces. Para deshacer (borra las fotos y las historias guardadas; hacer copia antes):
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.gallery;
--   DROP TABLE IF EXISTS public.gallery;
--   DROP TABLE IF EXISTS public.character_story;
--   DROP FUNCTION IF EXISTS public.gallery_limite();

CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000001',
  url text NOT NULL CHECK (url LIKE 'https://%' AND length(url) <= 1000),
  path text CHECK (path IS NULL OR length(path) <= 300),
  title text CHECK (title IS NULL OR length(title) <= 80),
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  uploader_name text CHECK (uploader_name IS NULL OR length(uploader_name) <= 80),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gallery_campaign_idx ON public.gallery (campaign_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.gallery_limite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF (SELECT count(*) FROM public.gallery WHERE campaign_id = NEW.campaign_id) >= 300 THEN
    RAISE EXCEPTION 'La galería ya tiene 300 fotos' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.gallery_limite() FROM PUBLIC, anon;
CREATE OR REPLACE TRIGGER gallery_limite BEFORE INSERT ON public.gallery
  FOR EACH ROW EXECUTE FUNCTION public.gallery_limite();

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gallery'
                 AND policyname = 'galería: leen los de la partida') THEN
    CREATE POLICY "galería: leen los de la partida" ON public.gallery FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gallery'
                 AND policyname = 'galería: cada uno sube las suyas') THEN
    CREATE POLICY "galería: cada uno sube las suyas" ON public.gallery FOR INSERT TO authenticated
    WITH CHECK (uploaded_by = auth.uid() AND (auth.uid() IS NOT NULL));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gallery'
                 AND policyname = 'galería: borra quien subió, máster o admin') THEN
    CREATE POLICY "galería: borra quien subió, máster o admin" ON public.gallery FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid() OR public.is_gm());
  END IF;
END $$;

REVOKE ALL ON public.gallery FROM anon;
GRANT SELECT, INSERT, DELETE ON public.gallery TO authenticated;

CREATE TABLE IF NOT EXISTS public.character_story (
  character_id uuid PRIMARY KEY,
  texto text NOT NULL DEFAULT '' CHECK (length(texto) <= 20000),
  visible_para_jugadores boolean NOT NULL DEFAULT false,
  updated_by uuid DEFAULT auth.uid(),
  actualizado timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.character_story ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'character_story'
                 AND policyname = 'historia: leen dueño, máster o todos si es pública') THEN
    CREATE POLICY "historia: leen dueño, máster o todos si es pública" ON public.character_story FOR SELECT TO authenticated
    USING (
      visible_para_jugadores
      OR public.is_gm()
      OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.owner_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'character_story'
                 AND policyname = 'historia: crea el dueño o el máster') THEN
    CREATE POLICY "historia: crea el dueño o el máster" ON public.character_story FOR INSERT TO authenticated
    WITH CHECK (
      public.is_gm()
      OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.owner_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'character_story'
                 AND policyname = 'historia: cambia el dueño o el máster') THEN
    CREATE POLICY "historia: cambia el dueño o el máster" ON public.character_story FOR UPDATE TO authenticated
    USING (
      public.is_gm()
      OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.owner_id = auth.uid())
    )
    WITH CHECK (
      public.is_gm()
      OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.owner_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'character_story'
                 AND policyname = 'historia: solo el máster borra') THEN
    CREATE POLICY "historia: solo el máster borra" ON public.character_story FOR DELETE TO authenticated
    USING (public.is_gm());
  END IF;
END $$;

REVOKE ALL ON public.character_story FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.character_story TO authenticated;

-- Tiempo real de la galería (postgres_changes respeta las reglas de lectura de arriba)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
                 AND schemaname = 'public' AND tablename = 'gallery') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery;
  END IF;
END $$;
