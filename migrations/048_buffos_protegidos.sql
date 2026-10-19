-- 048: buffos y debuffos protegidos en la ficha (tarea 60, reporte TK-9QP2). Solo restringe; no mueve ni borra datos.
-- * characters_guard_active_buffs: si quien guarda no es máster/admin, en data.activeBuffs solo cuenta
--   qué buffos tiene la ficha y si están activos (active, shieldGranted):
--   - un buffo que ya tenía conserva su definición (nombre, tipo, bonus, atributo...) tal como estaba;
--   - uno nuevo solo entra si existe en el catálogo (campaign_map 'world_compendium', buffCatalog) y no está
--     oculto, y se copia la definición del catálogo, no la que mande el jugador;
--   - quitarlo de la ficha (desvincular) sí está permitido.
-- * El catálogo ya solo lo escribe el máster/admin (políticas de campaign_map con is_gm()).
-- Se puede ejecutar dos veces.
-- Para deshacer:
--   DROP TRIGGER IF EXISTS characters_guard_active_buffs ON public.characters;
--   DROP FUNCTION IF EXISTS public.guard_active_buffs();

CREATE OR REPLACE FUNCTION public.guard_active_buffs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_old jsonb;
  v_cat jsonb;
  v_new jsonb;
BEGIN
  IF public.is_gm() THEN RETURN NEW; END IF;
  IF NEW.data IS NOT DISTINCT FROM OLD.data THEN RETURN NEW; END IF;
  IF (NEW.data->'activeBuffs') IS NOT DISTINCT FROM (OLD.data->'activeBuffs') THEN RETURN NEW; END IF;

  v_old := CASE WHEN jsonb_typeof(OLD.data->'activeBuffs') = 'array' THEN OLD.data->'activeBuffs' ELSE '[]'::jsonb END;

  IF jsonb_typeof(NEW.data->'activeBuffs') IS DISTINCT FROM 'array' THEN
    NEW.data := jsonb_set(NEW.data, '{activeBuffs}', v_old);
    RETURN NEW;
  END IF;

  SELECT CASE WHEN jsonb_typeof(m.data->'buffCatalog') = 'array' THEN m.data->'buffCatalog' ELSE '[]'::jsonb END
    INTO v_cat FROM public.campaign_map m WHERE m.id = 'world_compendium';
  v_cat := COALESCE(v_cat, '[]'::jsonb);

  SELECT COALESCE(jsonb_agg(r.item ORDER BY r.ord), '[]'::jsonb)
  INTO v_new
  FROM (
    SELECT n.ord,
      CASE
        WHEN o.ab IS NOT NULL THEN
          o.ab || jsonb_build_object(
            'active', COALESCE(n.ab->'active', o.ab->'active', 'true'::jsonb),
            'shieldGranted', COALESCE(n.ab->'shieldGranted', o.ab->'shieldGranted', '0'::jsonb))
        WHEN cat.b IS NOT NULL THEN
          jsonb_build_object(
            'id', cat.b->'id', 'name', cat.b->'name', 'type', cat.b->'type',
            'bonus', cat.b->'bonus', 'attr', cat.b->'attr',
            'active', COALESCE(n.ab->'active', 'true'::jsonb),
            'shieldGranted', COALESCE(n.ab->'shieldGranted', '0'::jsonb))
        ELSE NULL
      END AS item
    FROM jsonb_array_elements(NEW.data->'activeBuffs') WITH ORDINALITY AS n(ab, ord)
    LEFT JOIN LATERAL (
      SELECT x AS ab FROM jsonb_array_elements(v_old) x
      WHERE jsonb_typeof(n.ab) = 'object' AND x->>'id' = n.ab->>'id'
      LIMIT 1
    ) o ON true
    LEFT JOIN LATERAL (
      SELECT y AS b FROM jsonb_array_elements(v_cat) y
      WHERE jsonb_typeof(n.ab) = 'object' AND y->>'id' = n.ab->>'id'
        AND COALESCE(y->>'visible', 'true') <> 'false'
      LIMIT 1
    ) cat ON true
  ) r
  WHERE r.item IS NOT NULL;

  IF v_new IS DISTINCT FROM NEW.data->'activeBuffs' THEN
    NEW.data := jsonb_set(NEW.data, '{activeBuffs}', v_new);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS characters_guard_active_buffs ON public.characters;
CREATE TRIGGER characters_guard_active_buffs
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.guard_active_buffs();
