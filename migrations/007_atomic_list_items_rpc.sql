-- ============================================================================
-- MIGRACIÓN 007: RPC ATÓMICA GENÉRICA PARA COLECCIONES DE OBJETOS, EQUIPO Y BUFFS
-- Fecha: 2026-09-08
-- ============================================================================

-- RPC ATÓMICA: GESTIONAR ELEMENTO DE LISTA (manage_character_list_item)
-- Maneja de forma atómica y concurrente con bloqueo FOR UPDATE:
--   - Listas permitidas: inventory, weapons, armors, stones, poisons, spells, summons, activeBuffs, customBuffs, passivesNeg, passivesPos, goddessTable
--   - Acciones permitidas: 'add', 'remove', 'update_qty', 'update_item'
CREATE OR REPLACE FUNCTION public.manage_character_list_item(
  p_character_id UUID,
  p_list_name TEXT,
  p_action TEXT,
  p_item_data JSONB DEFAULT NULL,
  p_item_id TEXT DEFAULT NULL,
  p_delta INT DEFAULT 0,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_list JSONB;
  v_new_list JSONB;
  v_cached_res JSONB;
  v_result JSONB;
  v_item_id TEXT;
BEGIN
  -- A) Validar nombre de lista permitido para seguridad estricta
  IF p_list_name NOT IN (
    'inventory', 'weapons', 'armors', 'stones', 'poisons', 
    'spells', 'summons', 'activeBuffs', 'customBuffs', 
    'passivesNeg', 'passivesPos', 'goddessTable'
  ) THEN
    RAISE EXCEPTION 'Lista % no permitida para gestión atómica', p_list_name;
  END IF;

  -- B) Verificación de Idempotencia ante reintentos de red
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  -- C) Bloqueo de fila para atomicidad estricta (exclusión mutua en la transacción)
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  -- Obtener array actual o inicializar como array vacío
  v_list := COALESCE(v_row.data->p_list_name, '[]'::jsonb);
  IF jsonb_typeof(v_list) <> 'array' THEN
    v_list := '[]'::jsonb;
  END IF;

  -- D) Ejecutar acción solicitada
  IF p_action = 'add' THEN
    IF p_item_data IS NULL THEN
      RAISE EXCEPTION 'p_item_data no puede ser null para acción add';
    END IF;
    -- Si ya existe un elemento con el mismo ID, reemplazarlo; si no, añadirlo
    v_item_id := p_item_data->>'id';
    IF v_item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_list) AS elem WHERE elem->>'id' = v_item_id
    ) THEN
      SELECT COALESCE(jsonb_agg(
        CASE WHEN elem->>'id' = v_item_id THEN p_item_data ELSE elem END
      ), '[]'::jsonb)
      INTO v_new_list
      FROM jsonb_array_elements(v_list) AS elem;
    ELSE
      v_new_list := v_list || jsonb_build_array(p_item_data);
    END IF;

  ELSIF p_action = 'remove' THEN
    IF p_item_id IS NULL THEN
      RAISE EXCEPTION 'p_item_id no puede ser null para acción remove';
    END IF;
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    INTO v_new_list
    FROM jsonb_array_elements(v_list) AS elem
    WHERE elem->>'id' <> p_item_id;

  ELSIF p_action = 'update_qty' THEN
    IF p_item_id IS NULL THEN
      RAISE EXCEPTION 'p_item_id no puede ser null para acción update_qty';
    END IF;
    SELECT COALESCE(jsonb_agg(
      CASE WHEN elem->>'id' = p_item_id THEN
        jsonb_set(
          elem, 
          '{qty}', 
          to_jsonb(GREATEST(0, COALESCE((elem->>'qty')::int, 1) + p_delta))
        )
      ELSE elem END
    ), '[]'::jsonb)
    INTO v_new_list
    FROM jsonb_array_elements(v_list) AS elem;

  ELSIF p_action = 'update_item' THEN
    IF p_item_id IS NULL OR p_item_data IS NULL THEN
      RAISE EXCEPTION 'p_item_id y p_item_data requeridos para update_item';
    END IF;
    SELECT COALESCE(jsonb_agg(
      CASE WHEN elem->>'id' = p_item_id THEN
        elem || p_item_data
      ELSE elem END
    ), '[]'::jsonb)
    INTO v_new_list
    FROM jsonb_array_elements(v_list) AS elem;

  ELSE
    RAISE EXCEPTION 'Acción % no reconocida', p_action;
  END IF;

  -- E) Actualizar documento en Supabase
  UPDATE public.characters
  SET 
    data = jsonb_set(data, ARRAY[p_list_name], v_new_list),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'list_name', p_list_name,
    'action', p_action,
    'items', v_new_list,
    'updated_at', NOW()
  );

  -- F) Registrar comando procesado para idempotencia
  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'manage_list_' || p_list_name, v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
