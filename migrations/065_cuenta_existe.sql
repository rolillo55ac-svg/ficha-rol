-- 065: cuenta_existe(usuario) -> boolean. Solo sí/no, con límite de llamadas por minuto.
-- Deshacer: DROP FUNCTION IF EXISTS public.cuenta_existe(text);
CREATE OR REPLACE FUNCTION public.cuenta_existe(p_usuario text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  u text := left(lower(trim(coalesce(p_usuario, ''))), 80);
BEGIN
  IF u = '' THEN RETURN false; END IF;
  -- Límite: 60 consultas por minuto en total
  IF (SELECT count(*) FROM public.access_log WHERE evento = 'cuenta_check' AND at > now() - interval '1 minute') >= 60 THEN
    RETURN false;
  END IF;
  INSERT INTO public.access_log (user_id, usuario, evento, ip) VALUES (NULL, '', 'cuenta_check', public.access_ip());
  IF position('@' in u) = 0 THEN u := u || '@jugadores.krysalis.invalid'; END IF;
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = u);
END;
$$;
REVOKE ALL ON FUNCTION public.cuenta_existe(text) FROM public;
GRANT EXECUTE ON FUNCTION public.cuenta_existe(text) TO anon, authenticated;
