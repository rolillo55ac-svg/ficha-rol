-- 060: la bienvenida se recuerda por cuenta (no solo en el móvil). Solo añade.
-- Se aplica en Krysalis y en Venda2.
-- Deshacer:
--   DROP FUNCTION IF EXISTS public.marcar_bienvenida_vista();
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS bienvenida_vista;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bienvenida_vista timestamptz;

-- Cada cuenta marca solo la suya
CREATE OR REPLACE FUNCTION public.marcar_bienvenida_vista()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET bienvenida_vista = now()
  WHERE id = auth.uid() AND bienvenida_vista IS NULL;
$$;

REVOKE ALL ON FUNCTION public.marcar_bienvenida_vista() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_bienvenida_vista() TO authenticated;

-- Quien ya juega no la vuelve a ver (solo esta columna nueva)
UPDATE public.profiles SET bienvenida_vista = now() WHERE bienvenida_vista IS NULL;
