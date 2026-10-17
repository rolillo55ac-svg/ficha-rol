-- PARA LA PARTIDA 2 (proyecto teyxwlezzpongijlslty): pegar tal cual en su SQL Editor. Es la misma 040 de Krysalis.
-- 040: límites de tamaño y de envíos (tarea 55, versión A).
-- app_feedback (reportes): textos con longitud máxima y como mucho 3 reportes por minuto por persona.
-- characters.data hasta 1 MB y campaign_map.data hasta 5 MB (hoy la ficha más grande ocupa ~14 KB y el
-- mapa con copias ~320 KB): evita que alguien llene la base con un texto gigante.
-- Los datos actuales cumplen todos los límites (comprobado el 17/10). No borra datos. Se puede ejecutar dos veces.
-- Para deshacer:
--   ALTER TABLE public.app_feedback DROP CONSTRAINT IF EXISTS app_feedback_longitudes;
--   ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_data_tamano;
--   ALTER TABLE public.campaign_map DROP CONSTRAINT IF EXISTS campaign_map_data_tamano;
--   DROP TRIGGER IF EXISTS app_feedback_ritmo ON public.app_feedback;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_feedback_longitudes') THEN
    ALTER TABLE public.app_feedback ADD CONSTRAINT app_feedback_longitudes CHECK (
      length(coalesce(title, '')) <= 200 AND length(coalesce(description, '')) <= 5000
      AND length(coalesce(admin_reply, '')) <= 5000 AND length(coalesce(contact, '')) <= 200
      AND length(coalesce(character_name, '')) <= 120 AND length(coalesce(category, '')) <= 40
      AND length(coalesce(ticket_code, '')) <= 40 AND length(coalesce(status, '')) <= 40
      AND octet_length(coalesce(system_metadata::text, '')) <= 8000
      AND octet_length(coalesce(ai_triage::text, '')) <= 20000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'characters_data_tamano') THEN
    ALTER TABLE public.characters ADD CONSTRAINT characters_data_tamano
      CHECK (octet_length(coalesce(data::text, '')) <= 1000000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_map_data_tamano') THEN
    ALTER TABLE public.campaign_map ADD CONSTRAINT campaign_map_data_tamano
      CHECK (octet_length(coalesce(data::text, '')) <= 5000000);
  END IF;
END $$;

-- Como mucho 3 reportes por minuto por persona (el máster no tiene límite)
CREATE OR REPLACE FUNCTION public.app_feedback_ritmo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_gm() AND (
       SELECT count(*) FROM public.app_feedback
        WHERE user_id = auth.uid() AND created_at > now() - interval '1 minute') >= 3 THEN
    RAISE EXCEPTION 'Demasiados reportes seguidos: espera un minuto' USING ERRCODE = '54000';
  END IF;
  -- la hora la pone la base (si no, se podría esquivar el límite con una fecha antigua)
  IF auth.uid() IS NOT NULL THEN NEW.created_at := now(); END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.app_feedback_ritmo() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER app_feedback_ritmo BEFORE INSERT ON public.app_feedback
  FOR EACH ROW EXECUTE FUNCTION public.app_feedback_ritmo();
