-- 044: registro de accesos para el admin (tarea 55, C). Sin latidos: solo se apunta al entrar, al salir,
-- al abrir o esconder la web y lo que hace el admin con las cuentas.
--   * access_log: quién, cuándo, qué evento, dispositivo (corto) e IP. Nadie lo lee ni lo cambia desde la
--     web salvo el admin (y solo lectura, por admin_actividad). Lo de más de 90 días se borra solo al insertar.
--   * access_alertas: avisos para Discord (5 fallos seguidos con un usuario en 10 min, o usuario que no
--     existe). Los manda la función discord-notify (service_role) y los marca como enviados.
--   * registrar_acceso(usuario, ok, dispositivo): login bueno o malo. Se puede llamar sin sesión SOLO para
--     apuntar fallos: textos cortos, como mucho 10 por usuario y minuto, solo inserta. "ok" solo vale con
--     sesión y se apunta a nombre de quien llama. Devuelve si hay avisos pendientes (de cualquiera).
--   * registrar_sesion(evento, sesion, dispositivo): inicio y fin de sesión, logout y contraseña cambiada
--     (con sesión; el usuario sale de la sesión, no del navegador).
--   * admin_actividad(dias): lectura para el panel Ajustes › Admin › Actividad (solo es_admin()).
-- No toca datos de jugadores. Se puede ejecutar dos veces.
-- Para deshacer:
--   DROP FUNCTION IF EXISTS public.admin_actividad(integer);
--   DROP FUNCTION IF EXISTS public.registrar_sesion(text, uuid, text);
--   DROP FUNCTION IF EXISTS public.registrar_acceso(text, boolean, text);
--   DROP TABLE IF EXISTS public.access_alertas;
--   DROP TABLE IF EXISTS public.access_log;
--   DROP FUNCTION IF EXISTS public.access_log_limpiar();

CREATE TABLE IF NOT EXISTS public.access_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  usuario text NOT NULL DEFAULT '',
  evento text NOT NULL,
  user_agent text,
  ip text,
  sesion uuid,
  CONSTRAINT access_log_evento CHECK (evento IN ('login_ok','login_fail','logout','sesion_inicio','sesion_fin',
    'cuenta_creada','cuenta_desactivada','cuenta_reactivada','password_cambiada')),
  CONSTRAINT access_log_longitudes CHECK (length(usuario) <= 80 AND length(coalesce(user_agent, '')) <= 120
    AND length(coalesce(ip, '')) <= 45)
);
CREATE INDEX IF NOT EXISTS access_log_at ON public.access_log (at);
CREATE INDEX IF NOT EXISTS access_log_usuario_at ON public.access_log (usuario, at);
CREATE INDEX IF NOT EXISTS access_log_user_at ON public.access_log (user_id, at);
ALTER TABLE public.access_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.access_log FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.access_alertas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL CHECK (tipo IN ('fallos_seguidos','usuario_inexistente')),
  usuario text NOT NULL CHECK (length(usuario) <= 80),
  veces integer NOT NULL DEFAULT 1,
  enviado_at timestamptz
);
CREATE INDEX IF NOT EXISTS access_alertas_pendientes ON public.access_alertas (at) WHERE enviado_at IS NULL;
ALTER TABLE public.access_alertas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.access_alertas FROM anon, authenticated;

-- Registros y avisos de más de 90 días fuera (son solo registros, no datos de juego)
CREATE OR REPLACE FUNCTION public.access_log_limpiar()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  DELETE FROM public.access_log WHERE at < now() - interval '90 days';
  DELETE FROM public.access_alertas WHERE at < now() - interval '90 days';
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.access_log_limpiar() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER access_log_limpiar AFTER INSERT ON public.access_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.access_log_limpiar();

-- IP de quien llama (la pone el proxy de Supabase)
CREATE OR REPLACE FUNCTION public.access_ip()
RETURNS text LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT nullif(left(trim(split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1)), 45), '');
$$;
REVOKE ALL ON FUNCTION public.access_ip() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_acceso(p_usuario text, p_ok boolean, p_ua text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  u text := left(lower(trim(coalesce(p_usuario, ''))), 80);
  ua text := nullif(left(coalesce(p_ua, ''), 120), '');
  uid uuid;
  ultimo_ok timestamptz;
  fallos integer;
BEGIN
  IF p_ok THEN
    -- Un "entró bien" solo lo apunta quien de verdad tiene sesión, y siempre a su propio nombre
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    IF (SELECT count(*) FROM public.access_log WHERE user_id = auth.uid() AND at > now() - interval '1 minute') >= 30 THEN
      RETURN false;
    END IF;
    SELECT left(lower(coalesce(nullif(display_name, ''), email, '')), 80) INTO u FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.access_log (user_id, usuario, evento, user_agent, ip)
      VALUES (auth.uid(), coalesce(u, ''), 'login_ok', ua, public.access_ip());
    RETURN false;
  END IF;
  IF u = '' THEN RETURN false; END IF;
  -- Límites: 10 fallos por usuario y minuto, 120 por minuto en total
  IF (SELECT count(*) FROM public.access_log WHERE usuario = u AND evento = 'login_fail' AND at > now() - interval '1 minute') >= 10
     OR (SELECT count(*) FROM public.access_log WHERE evento = 'login_fail' AND at > now() - interval '1 minute') >= 120 THEN
    RETURN EXISTS (SELECT 1 FROM public.access_alertas WHERE enviado_at IS NULL);
  END IF;
  SELECT id INTO uid FROM public.profiles
    WHERE lower(email) = u OR lower(email) = u || '@jugadores.krysalis.invalid' LIMIT 1;
  INSERT INTO public.access_log (user_id, usuario, evento, user_agent, ip)
    VALUES (uid, u, 'login_fail', ua, public.access_ip());

  -- Avisos: uno por usuario cada 10 minutos; como mucho 5 por hora de usuarios que no existen y 10 de
  -- fallos seguidos (por separado: llenar uno no tapa el otro)
  IF NOT EXISTS (SELECT 1 FROM public.access_alertas WHERE usuario = u AND at > now() - interval '10 minutes') THEN
    IF uid IS NULL THEN
      IF (SELECT count(*) FROM public.access_alertas WHERE tipo = 'usuario_inexistente' AND at > now() - interval '1 hour') < 5 THEN
        INSERT INTO public.access_alertas (tipo, usuario) VALUES ('usuario_inexistente', u);
      END IF;
    ELSE
      SELECT max(at) INTO ultimo_ok FROM public.access_log
        WHERE user_id = uid AND evento = 'login_ok' AND at > now() - interval '10 minutes';
      SELECT count(*) INTO fallos FROM public.access_log
        WHERE user_id = uid AND evento = 'login_fail' AND at > coalesce(ultimo_ok, now() - interval '10 minutes');
      IF fallos >= 5 AND (SELECT count(*) FROM public.access_alertas WHERE tipo = 'fallos_seguidos' AND at > now() - interval '1 hour') < 10 THEN
        INSERT INTO public.access_alertas (tipo, usuario, veces) VALUES ('fallos_seguidos', u, fallos);
      END IF;
    END IF;
  END IF;
  -- Solo dice si hay avisos pendientes de cualquiera (no revela si este usuario existe)
  RETURN EXISTS (SELECT 1 FROM public.access_alertas WHERE enviado_at IS NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_sesion(p_evento text, p_sesion uuid DEFAULT NULL, p_ua text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  nombre text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF p_evento NOT IN ('sesion_inicio','sesion_fin','logout','password_cambiada') THEN
    RAISE EXCEPTION 'Evento no válido' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.access_log WHERE user_id = auth.uid() AND at > now() - interval '1 minute') >= 30 THEN
    RETURN;
  END IF;
  SELECT left(lower(coalesce(nullif(display_name, ''), email, '')), 80) INTO nombre FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.access_log (user_id, usuario, evento, user_agent, ip, sesion)
    VALUES (auth.uid(), coalesce(nombre, ''), p_evento, nullif(left(coalesce(p_ua, ''), 120), ''), public.access_ip(), p_sesion);
END;
$$;

-- Panel de Actividad. ultima_accion (solo en sesion_inicio): última tirada o guardado de su ficha antes de la
-- siguiente sesión, para estimar la duración ("≈") si el móvil no llegó a mandar el fin.
CREATE OR REPLACE FUNCTION public.admin_actividad(p_dias integer DEFAULT 7)
RETURNS TABLE (id bigint, at timestamptz, user_id uuid, usuario text, nombre text, evento text,
               user_agent text, ip text, sesion uuid, ultima_accion timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  d integer := greatest(1, least(coalesce(p_dias, 7), 90));
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo el admin' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    WITH l AS (
      SELECT a.*, lead(a.at) OVER (PARTITION BY a.user_id, (a.evento = 'sesion_inicio') ORDER BY a.at) AS siguiente
      FROM public.access_log a
      WHERE a.at > now() - make_interval(days => d)
    )
    SELECT l.id, l.at, l.user_id, l.usuario, coalesce(nullif(p.display_name, ''), p.email), l.evento,
           l.user_agent, l.ip, l.sesion,
           CASE WHEN l.evento = 'sesion_inicio' AND l.user_id IS NOT NULL THEN greatest(
             (SELECT max(r.created_at) FROM public.dice_rolls r
               WHERE r.user_id = l.user_id AND r.created_at >= l.at AND r.created_at < coalesce(l.siguiente, now())),
             (SELECT max(c.updated_at) FROM public.characters c
               WHERE c.owner_id = l.user_id AND c.updated_at >= l.at AND c.updated_at < coalesce(l.siguiente, now()))
           ) END
    FROM l LEFT JOIN public.profiles p ON p.id = l.user_id
    ORDER BY l.at DESC
    LIMIT 3000;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_acceso(text, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_sesion(text, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_actividad(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_acceso(text, boolean, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_sesion(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_actividad(integer) TO authenticated;
