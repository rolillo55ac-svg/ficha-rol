-- ============================================================================
-- MIGRACIÓN 006: RPC ATÓMICA PARA ESCUDO (change_shield)
-- Fecha: 2026-09-08
-- ============================================================================

-- RPC ATÓMICA: MODIFICAR ESCUDO (change_shield)
-- Permite sumar o restar escudo de forma atómica y concurrente con bloqueo FOR UPDATE
CREATE OR REPLACE FUNCTION public.change_shield(
  p_character_id UUID,
  p_amount INT,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_combat JSONB;
  v_escudo INT;
  v_new_escudo INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  -- A) Verificación de Idempotencia ante reintentos de red
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  -- B) Bloqueo de fila para atomicidad estricta
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_combat := COALESCE(v_row.data->'combat', '{}'::jsonb);
  v_escudo := COALESCE((v_combat->>'escudoActual')::int, 0);

  -- El escudo nunca puede ser negativo
  v_new_escudo := GREATEST(0, v_escudo + p_amount);

  v_combat := jsonb_set(v_combat, '{escudoActual}', to_jsonb(v_new_escudo));

  -- C) Actualizar combat y estado en characters
  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{combat}', v_combat),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'escudoActual', v_new_escudo,
    'delta', p_amount,
    'updated_at', NOW()
  );

  -- D) Guardar comando procesado
  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'change_shield', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
