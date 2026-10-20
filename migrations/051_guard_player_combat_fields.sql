-- 051 (tarea 62): un jugador no puede cambiar en su ficha los valores que solo toca el máster.
-- Protege: nivel, atributos (attrs) y en combat: iniciativa, movilidad, defensa, defensaMagica, pvMax y manaMax.
-- Vida, escudo y maná actuales (pvActual, escudoActual, manaActual) los sigue cambiando el jugador.
-- Si un jugador los manda, se conserva el valor anterior en silencio (mismo método que la 048).
-- No cambia ni borra datos. Se puede ejecutar dos veces.
-- Deshacer:
--   DROP TRIGGER IF EXISTS characters_guard_player_fields ON public.characters;
--   DROP FUNCTION IF EXISTS public.guard_player_char_fields();
BEGIN;
CREATE OR REPLACE FUNCTION public.guard_player_char_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_key text;
  v_old_cb jsonb;
  v_new_cb jsonb;
BEGIN
  IF public.is_gm() THEN RETURN NEW; END IF;
  IF NEW.data IS NOT DISTINCT FROM OLD.data THEN RETURN NEW; END IF;

  IF (NEW.data->'nivel') IS DISTINCT FROM (OLD.data->'nivel') THEN
    NEW.data := CASE WHEN OLD.data ? 'nivel' THEN jsonb_set(NEW.data, '{nivel}', OLD.data->'nivel') ELSE NEW.data - 'nivel' END;
  END IF;
  IF (NEW.data->'attrs') IS DISTINCT FROM (OLD.data->'attrs') THEN
    NEW.data := CASE WHEN OLD.data ? 'attrs' THEN jsonb_set(NEW.data, '{attrs}', OLD.data->'attrs') ELSE NEW.data - 'attrs' END;
  END IF;

  IF (NEW.data->'combat') IS DISTINCT FROM (OLD.data->'combat') THEN
    v_old_cb := CASE WHEN jsonb_typeof(OLD.data->'combat') = 'object' THEN OLD.data->'combat' ELSE '{}'::jsonb END;
    v_new_cb := CASE WHEN jsonb_typeof(NEW.data->'combat') = 'object' THEN NEW.data->'combat' ELSE '{}'::jsonb END;
    FOREACH v_key IN ARRAY ARRAY['iniciativa','movilidad','defensa','defensaMagica','pvMax','manaMax'] LOOP
      IF v_old_cb ? v_key THEN
        v_new_cb := jsonb_set(v_new_cb, ARRAY[v_key], v_old_cb->v_key);
      ELSE
        v_new_cb := v_new_cb - v_key;
      END IF;
    END LOOP;
    NEW.data := jsonb_set(NEW.data, '{combat}', v_new_cb);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS characters_guard_player_fields ON public.characters;
CREATE TRIGGER characters_guard_player_fields
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.guard_player_char_fields();
COMMIT;
