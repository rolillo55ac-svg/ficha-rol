-- 064: el dueño real de la ficha (owner_id) sigue a la cuenta asignada (data.ownerEmail)
-- Antes: el máster asignaba la ficha a un jugador, pero en la base seguía siendo del máster.
-- El jugador no podía guardar (salía «sin conexión») ni cambiar su dinero («sin permiso»).
-- Solo el máster (o admin) puede cambiar la cuenta asignada; si lo intenta un jugador, se deja la de antes.
-- Deshacer:
--   DROP TRIGGER IF EXISTS characters_owner_sync ON public.characters;
--   DROP FUNCTION IF EXISTS public.sync_owner_from_email();
--   DROP FUNCTION IF EXISTS public.cuenta_a_email(text);
--   (los owner_id corregidos están en backup.characters_20261104_owner)

CREATE OR REPLACE FUNCTION public.cuenta_a_email(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN nullif(trim(coalesce(p, '')), '') IS NULL THEN ''
    WHEN position('@' in p) > 0 THEN lower(trim(p))
    ELSE lower(trim(p)) || '@jugadores.krysalis.invalid'
  END;
$$;

CREATE OR REPLACE FUNCTION public.sync_owner_from_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new text := public.cuenta_a_email(NEW.data->>'ownerEmail');
  v_old text := CASE WHEN TG_OP = 'UPDATE' THEN public.cuenta_a_email(OLD.data->>'ownerEmail') ELSE '' END;
  v_pid uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND v_new = v_old THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' AND v_new = '' THEN RETURN NEW; END IF;

  IF NOT public.is_gm() THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.data := CASE WHEN OLD.data ? 'ownerEmail'
        THEN jsonb_set(NEW.data, '{ownerEmail}', OLD.data->'ownerEmail')
        ELSE NEW.data - 'ownerEmail' END;
    END IF;
    RETURN NEW;
  END IF;

  IF v_new = '' THEN
    NEW.owner_id := coalesce(auth.uid(), NEW.owner_id);
    RETURN NEW;
  END IF;
  SELECT id INTO v_pid FROM public.profiles WHERE lower(email) = v_new LIMIT 1;
  IF v_pid IS NOT NULL THEN NEW.owner_id := v_pid; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_owner_from_email() FROM PUBLIC, anon;

CREATE OR REPLACE TRIGGER characters_owner_sync
  BEFORE INSERT OR UPDATE OF data ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.sync_owner_from_email();

-- Corrección de las fichas ya asignadas (solo la columna owner_id; data no se toca)
CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.characters_20261104_owner AS
  SELECT id, owner_id, data->>'ownerEmail' AS owner_email FROM public.characters;

UPDATE public.characters c
   SET owner_id = p.id
  FROM public.profiles p
 WHERE public.cuenta_a_email(c.data->>'ownerEmail') <> ''
   AND lower(p.email) = public.cuenta_a_email(c.data->>'ownerEmail')
   AND c.owner_id IS DISTINCT FROM p.id;
