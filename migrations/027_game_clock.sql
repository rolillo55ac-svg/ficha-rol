-- 027: Reloj de la partida ("Día N, HH:00"). Solo añade; no toca datos existentes.
--  1. Tabla game_clock: una fila por campaña con las horas de juego transcurridas (total_hours).
--     Día = total_hours / 24 + 1, hora = total_hours % 24. Empieza en Día 1, 08:00.
--  2. RLS: cualquier usuario con sesión la lee; solo el máster (is_gm()) crea o cambia la fila. Nadie borra.
--  3. RPC game_clock_add(campaign, horas) y game_clock_set(campaign, total): solo el máster; suman o ponen
--     las horas de forma atómica (nunca por debajo de 0) y devuelven el total nuevo.
--  4. Se añade a la publicación supabase_realtime para verla en directo en todos los móviles.
-- Se puede ejecutar dos veces sin problema.
--
-- DESHACER (a mano, en el SQL Editor):
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.game_clock;
--   DROP FUNCTION IF EXISTS public.game_clock_add(text, integer);
--   DROP FUNCTION IF EXISTS public.game_clock_set(text, integer);
--   DROP TABLE IF EXISTS public.game_clock;

CREATE TABLE IF NOT EXISTS public.game_clock (
  campaign_id text PRIMARY KEY,
  total_hours integer NOT NULL DEFAULT 8 CHECK (total_hours >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT auth.uid()
);

ALTER TABLE public.game_clock ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_clock' AND policyname = 'reloj: todos lo leen') THEN
    CREATE POLICY "reloj: todos lo leen" ON public.game_clock
      FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_clock' AND policyname = 'reloj: solo el máster lo crea') THEN
    CREATE POLICY "reloj: solo el máster lo crea" ON public.game_clock
      FOR INSERT TO authenticated WITH CHECK (public.is_gm());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_clock' AND policyname = 'reloj: solo el máster lo cambia') THEN
    CREATE POLICY "reloj: solo el máster lo cambia" ON public.game_clock
      FOR UPDATE TO authenticated USING (public.is_gm()) WITH CHECK (public.is_gm());
  END IF;
END $$;

REVOKE ALL ON public.game_clock FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.game_clock TO authenticated;

CREATE OR REPLACE FUNCTION public.game_clock_set(p_campaign_id text, p_total integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total integer;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede cambiar el reloj' USING ERRCODE = '42501';
  END IF;
  IF p_total IS NULL OR p_total < 0 OR p_total > 24 * 100000 THEN
    RAISE EXCEPTION 'Hora no válida' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.game_clock AS g (campaign_id, total_hours, updated_at, updated_by)
  VALUES (p_campaign_id, p_total, now(), auth.uid())
  ON CONFLICT (campaign_id) DO UPDATE
    SET total_hours = EXCLUDED.total_hours, updated_at = now(), updated_by = auth.uid()
  RETURNING g.total_hours INTO v_total;
  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.game_clock_add(p_campaign_id text, p_hours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total integer;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Solo el máster puede cambiar el reloj' USING ERRCODE = '42501';
  END IF;
  IF p_hours IS NULL OR abs(p_hours) > 24 * 1000 THEN
    RAISE EXCEPTION 'Horas no válidas' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.game_clock AS g (campaign_id, total_hours, updated_at, updated_by)
  VALUES (p_campaign_id, greatest(0, 8 + p_hours), now(), auth.uid())
  ON CONFLICT (campaign_id) DO UPDATE
    SET total_hours = greatest(0, g.total_hours + p_hours), updated_at = now(), updated_by = auth.uid()
  RETURNING g.total_hours INTO v_total;
  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.game_clock_set(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.game_clock_add(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.game_clock_set(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.game_clock_add(text, integer) TO authenticated;

INSERT INTO public.game_clock (campaign_id, total_hours, updated_by)
VALUES ('c0000000-0000-0000-0000-000000000001', 8, NULL)
ON CONFLICT (campaign_id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_clock') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_clock;
  END IF;
END $$;
