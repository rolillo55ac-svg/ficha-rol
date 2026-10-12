-- 025: Candado del veredicto de las piedras y cierre de app_feedback. Solo restringe; no cambia datos.
--  1. Disparador en characters: si quien escribe NO es el máster (is_gm()), el veredicto de cada piedra
--     no se puede poner ni cambiar. En vez de rechazar el guardado (se perderían los demás cambios del
--     jugador), la base corrige la piedra:
--       - piedra que ya tenía veredicto: se mantienen veredictoMaster, resueltoEn y pendienteMaster = false
--         (y si se rompió, calidad = 'arruinada'). Así un móvil con datos viejos tampoco lo deshace.
--       - piedra sin veredicto: se quitan veredictoMaster y resueltoEn si los trae; si estaba esperando al
--         máster, sigue esperando (salvo que quede 'arruinada', que no necesita veredicto).
--  2. app_feedback: columna user_id (por defecto quien envía) y políticas nuevas, todas TO authenticated:
--     cada usuario envía tickets suyos y "pending" y ve los suyos; el máster ve, responde y borra todos.
--     Las tres políticas abiertas (public, USING/WITH CHECK true) se renombran y se cierran con ALTER POLICY
--     (no se borra ninguna).
--     Los tickets antiguos se quedan con user_id vacío: solo los ve el máster (el jugador sigue viendo
--     las respuestas por campaign_map 'app_feedback_sync').
-- Se puede ejecutar dos veces sin problema.
--
-- DESHACER (a mano, en el SQL Editor):
--   DROP TRIGGER IF EXISTS characters_guard_stone_verdict ON public.characters;
--   DROP FUNCTION IF EXISTS public.guard_stone_verdict();
--   DROP POLICY IF EXISTS "tickets: solo el máster borra" ON public.app_feedback;
--   ALTER POLICY "tickets: cada usuario envía los suyos" ON public.app_feedback RENAME TO "Allow public insert to app_feedback";
--   ALTER POLICY "Allow public insert to app_feedback" ON public.app_feedback TO public WITH CHECK (true);
--   ALTER POLICY "tickets: cada usuario ve los suyos y el máster todos" ON public.app_feedback RENAME TO "Allow read app_feedback";
--   ALTER POLICY "Allow read app_feedback" ON public.app_feedback TO public USING (true);
--   ALTER POLICY "tickets: solo el máster responde" ON public.app_feedback RENAME TO "Allow update app_feedback";
--   ALTER POLICY "Allow update app_feedback" ON public.app_feedback TO public USING (true) WITH CHECK (true);
--   (la columna user_id se puede dejar; no molesta)

CREATE OR REPLACE FUNCTION public.guard_stone_verdict()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF public.is_gm() THEN RETURN NEW; END IF;
  IF NEW.data IS NOT DISTINCT FROM OLD.data THEN RETURN NEW; END IF;
  IF jsonb_typeof(NEW.data->'stones') IS DISTINCT FROM 'array' THEN RETURN NEW; END IF;

  v_old := CASE WHEN jsonb_typeof(OLD.data->'stones') = 'array' THEN OLD.data->'stones' ELSE '[]'::jsonb END;

  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN jsonb_typeof(n.st) IS DISTINCT FROM 'object' THEN n.st
      WHEN o.st IS NOT NULL AND o.st->>'veredictoMaster' IS NOT NULL THEN
        n.st
        || jsonb_build_object('veredictoMaster', o.st->'veredictoMaster', 'pendienteMaster', false)
        || CASE WHEN o.st ? 'resueltoEn' THEN jsonb_build_object('resueltoEn', o.st->'resueltoEn') ELSE '{}'::jsonb END
        || CASE WHEN o.st->>'veredictoMaster' = 'rota' THEN '{"calidad":"arruinada"}'::jsonb ELSE '{}'::jsonb END
      ELSE
        (n.st - 'veredictoMaster' - 'resueltoEn')
        || CASE
             WHEN o.st->'pendienteMaster' = 'true'::jsonb
              AND n.st->'pendienteMaster' IS DISTINCT FROM 'true'::jsonb
              AND n.st->>'calidad' IS DISTINCT FROM 'arruinada'
             THEN '{"pendienteMaster":true}'::jsonb
             ELSE '{}'::jsonb
           END
    END
    ORDER BY n.ord), '[]'::jsonb)
  INTO v_new
  FROM jsonb_array_elements(NEW.data->'stones') WITH ORDINALITY AS n(st, ord)
  LEFT JOIN LATERAL (
    SELECT x AS st FROM jsonb_array_elements(v_old) x
    WHERE jsonb_typeof(n.st) = 'object' AND n.st->>'id' IS NOT NULL AND x->>'id' = n.st->>'id'
    LIMIT 1
  ) o ON true;

  IF v_new IS DISTINCT FROM NEW.data->'stones' THEN
    NEW.data := jsonb_set(NEW.data, '{stones}', v_new);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_stone_verdict() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER characters_guard_stone_verdict
  BEFORE UPDATE OF data ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.guard_stone_verdict();

ALTER TABLE public.app_feedback ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Las políticas viejas pasan a tener el nombre nuevo; si ya no están (segunda vez), se crean si faltan
DO $m$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_feedback' AND policyname = 'Allow public insert to app_feedback') THEN
    ALTER POLICY "Allow public insert to app_feedback" ON public.app_feedback RENAME TO "tickets: cada usuario envía los suyos";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_feedback' AND policyname = 'Allow read app_feedback') THEN
    ALTER POLICY "Allow read app_feedback" ON public.app_feedback RENAME TO "tickets: cada usuario ve los suyos y el máster todos";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_feedback' AND policyname = 'Allow update app_feedback') THEN
    ALTER POLICY "Allow update app_feedback" ON public.app_feedback RENAME TO "tickets: solo el máster responde";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_feedback' AND policyname = 'tickets: cada usuario envía los suyos') THEN
    CREATE POLICY "tickets: cada usuario envía los suyos" ON public.app_feedback FOR INSERT TO authenticated WITH CHECK (public.is_gm());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_feedback' AND policyname = 'tickets: cada usuario ve los suyos y el máster todos') THEN
    CREATE POLICY "tickets: cada usuario ve los suyos y el máster todos" ON public.app_feedback FOR SELECT TO authenticated USING (public.is_gm());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_feedback' AND policyname = 'tickets: solo el máster responde') THEN
    CREATE POLICY "tickets: solo el máster responde" ON public.app_feedback FOR UPDATE TO authenticated USING (public.is_gm());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_feedback' AND policyname = 'tickets: solo el máster borra') THEN
    CREATE POLICY "tickets: solo el máster borra" ON public.app_feedback FOR DELETE TO authenticated USING (public.is_gm());
  END IF;
END
$m$;

ALTER POLICY "tickets: cada usuario envía los suyos" ON public.app_feedback
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND COALESCE(status, 'pending') = 'pending'
              AND admin_reply IS NULL AND resolved_at IS NULL);

ALTER POLICY "tickets: cada usuario ve los suyos y el máster todos" ON public.app_feedback
  TO authenticated
  USING (user_id = auth.uid() OR public.is_gm());

ALTER POLICY "tickets: solo el máster responde" ON public.app_feedback
  TO authenticated
  USING (public.is_gm()) WITH CHECK (public.is_gm());

ALTER POLICY "tickets: solo el máster borra" ON public.app_feedback
  TO authenticated
  USING (public.is_gm());
