-- 041: registro de avisos a Discord para el límite por minuto de la función discord-notify (tarea 55, A).
-- Solo la función (service_role) lee y escribe: RLS activado y sin políticas; anon y authenticated sin permisos.
-- Se borran solos los de más de un día al insertar. No toca datos de jugadores. Se puede ejecutar dos veces.
-- Para deshacer: DROP TABLE IF EXISTS public.discord_envios;

CREATE TABLE IF NOT EXISTS public.discord_envios (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discord_envios_user_at ON public.discord_envios (user_id, at);
ALTER TABLE public.discord_envios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.discord_envios FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.discord_envios_limpiar()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  DELETE FROM public.discord_envios WHERE at < now() - interval '1 day';
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.discord_envios_limpiar() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER discord_envios_limpiar AFTER INSERT ON public.discord_envios
  FOR EACH STATEMENT EXECUTE FUNCTION public.discord_envios_limpiar();
