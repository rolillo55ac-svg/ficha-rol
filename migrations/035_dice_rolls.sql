-- 035: historial de tiradas en la base (tarea 24).
-- Cada tirada se guarda en public.dice_rolls; el tiempo real (broadcast 'dice_roll') queda solo para el aviso al momento.
-- Quién: el que tira la inserta con su usuario (y solo con una ficha suya, salvo el máster).
-- La leen todos los usuarios con sesión (cada proyecto de Supabase es una partida); las ocultas (hidden) solo el máster y quien tiró.
-- Nadie edita; solo el máster borra.
-- Se puede ejecutar dos veces. Para deshacer (borra el historial guardado; hacer copia antes):
--   DROP TABLE IF EXISTS public.dice_rolls;

CREATE TABLE IF NOT EXISTS public.dice_rolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  character_id uuid,
  char_name text,
  label text,
  kind text,
  sides int,
  qty int,
  dice jsonb,
  modifier int,
  total int,
  mode text,
  dc int,
  success boolean,
  is_crit boolean NOT NULL DEFAULT false,
  is_fumble boolean NOT NULL DEFAULT false,
  formula_text text,
  hidden boolean NOT NULL DEFAULT false,
  game_hours int,
  request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dice_rolls_created_at_idx ON public.dice_rolls (created_at DESC);
CREATE INDEX IF NOT EXISTS dice_rolls_character_idx ON public.dice_rolls (character_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dice_rolls_request_idx ON public.dice_rolls (request_id) WHERE request_id IS NOT NULL;

ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tiradas: se leen las visibles" ON public.dice_rolls;
CREATE POLICY "tiradas: se leen las visibles" ON public.dice_rolls FOR SELECT TO authenticated
  USING (hidden = false OR user_id = auth.uid() OR public.is_gm());

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
  );

DROP POLICY IF EXISTS "tiradas: solo el máster borra" ON public.dice_rolls;
CREATE POLICY "tiradas: solo el máster borra" ON public.dice_rolls FOR DELETE TO authenticated
  USING (public.is_gm());

REVOKE ALL ON public.dice_rolls FROM anon;
GRANT SELECT, INSERT, DELETE ON public.dice_rolls TO authenticated;
