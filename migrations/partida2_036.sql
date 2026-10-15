-- PARA LA PARTIDA 2 (proyecto teyxwlezzpongijlslty): pegar tal cual en su SQL Editor. Es la misma 036 de Krysalis.
-- 036: el máster pide tiradas (tarea 25).
-- public.roll_requests: cada petición del máster (qué tirada, CD visible, ventaja, texto y a qué fichas).
-- public.roll_request_secrets: la CD oculta, que solo lee el máster.
-- Las respuestas son filas de public.dice_rolls con su request_id (035); aquí se exige que el jugador
-- solo responda a peticiones abiertas dirigidas a su ficha, y una sola vez por ficha.
-- Solo el máster crea, cancela o borra peticiones. Cada proyecto de Supabase es una partida (sin campaign_id).
-- Se puede ejecutar dos veces. No borra datos. Para deshacer (hacer copia antes):
--   DROP INDEX IF EXISTS public.dice_rolls_request_char_uniq;
--   DROP POLICY IF EXISTS "tiradas: cada uno inserta las suyas" ON public.dice_rolls;
--   CREATE POLICY "tiradas: cada uno inserta las suyas" ON public.dice_rolls FOR INSERT TO authenticated
--     WITH CHECK (user_id = auth.uid() AND (hidden = false OR public.is_gm())
--       AND (character_id IS NULL OR public.is_gm()
--         OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.owner_id = auth.uid())));
--   DROP TABLE IF EXISTS public.roll_request_secrets;
--   DROP TABLE IF EXISTS public.roll_requests;

CREATE TABLE IF NOT EXISTS public.roll_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  roll_type text NOT NULL,            -- 'attr' o 'skill'
  roll_key text NOT NULL,             -- clave del atributo o id de la habilidad
  label text NOT NULL,
  dc int,                             -- solo si la CD se ve; la oculta va en roll_request_secrets
  has_secret_dc boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'normal',
  note text,
  target_char_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open', -- 'open' o 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roll_requests_created_at_idx ON public.roll_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS public.roll_request_secrets (
  request_id uuid PRIMARY KEY REFERENCES public.roll_requests(id) ON DELETE CASCADE,
  dc int
);

ALTER TABLE public.roll_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roll_request_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "peticiones: las ve el máster y sus destinatarios" ON public.roll_requests;
CREATE POLICY "peticiones: las ve el máster y sus destinatarios" ON public.roll_requests FOR SELECT TO authenticated
  USING (
    public.is_gm()
    OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = ANY(target_char_ids) AND c.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "peticiones: solo el máster crea" ON public.roll_requests;
CREATE POLICY "peticiones: solo el máster crea" ON public.roll_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_gm() AND created_by = auth.uid());

DROP POLICY IF EXISTS "peticiones: solo el máster cambia" ON public.roll_requests;
CREATE POLICY "peticiones: solo el máster cambia" ON public.roll_requests FOR UPDATE TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

DROP POLICY IF EXISTS "peticiones: solo el máster borra" ON public.roll_requests;
CREATE POLICY "peticiones: solo el máster borra" ON public.roll_requests FOR DELETE TO authenticated
  USING (public.is_gm());

DROP POLICY IF EXISTS "cd oculta: solo el máster" ON public.roll_request_secrets;
CREATE POLICY "cd oculta: solo el máster" ON public.roll_request_secrets FOR ALL TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

REVOKE ALL ON public.roll_requests FROM anon;
REVOKE ALL ON public.roll_request_secrets FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roll_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roll_request_secrets TO authenticated;

-- Respuestas: con request_id, solo a una petición abierta dirigida a esa ficha (el máster, libre)
DROP POLICY IF EXISTS "tiradas: cada uno inserta las suyas" ON public.dice_rolls;
CREATE POLICY "tiradas: cada uno inserta las suyas" ON public.dice_rolls FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (hidden = false OR public.is_gm())
    AND (
      character_id IS NULL
      OR public.is_gm()
      OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.owner_id = auth.uid())
    )
    AND (
      request_id IS NULL
      OR public.is_gm()
      OR EXISTS (SELECT 1 FROM public.roll_requests rq
                 WHERE rq.id = request_id AND rq.status = 'open' AND character_id = ANY(rq.target_char_ids))
    )
  );

-- Una sola respuesta por ficha y petición
CREATE UNIQUE INDEX IF NOT EXISTS dice_rolls_request_char_uniq ON public.dice_rolls (request_id, character_id)
  WHERE request_id IS NOT NULL AND character_id IS NOT NULL;
