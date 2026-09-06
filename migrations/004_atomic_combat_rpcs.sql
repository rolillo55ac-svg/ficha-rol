-- ============================================================================
-- MIGRACIÓN 004: FUNCIONES RPC ATÓMICAS (VIDA, MANÁ, ORO) E IDEMPOTENCIA
-- Fecha: 2026-09-06
-- ============================================================================

-- 1. Tabla de comandos procesados para garantizar IDEMPOTENCIA ante reintentos de red
CREATE TABLE IF NOT EXISTS public.processed_commands (
  command_id UUID PRIMARY KEY,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_commands_created ON public.processed_commands(created_at);

-- Limpieza periódica de comandos antiguos (más de 24 horas)
CREATE OR REPLACE FUNCTION public.clean_old_processed_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM public.processed_commands WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC ATÓMICA: APLICAR DAÑO (apply_damage)
CREATE OR REPLACE FUNCTION public.apply_damage(
  p_character_id UUID,
  p_amount INT,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_combat JSONB;
  v_pv_actual INT;
  v_pv_max INT;
  v_escudo INT;
  v_damage_left INT;
  v_new_pv INT;
  v_new_escudo INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  -- A) Verificación de Idempotencia
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
  v_pv_max := COALESCE((v_combat->>'pvMax')::int, 20);
  v_pv_actual := COALESCE((v_combat->>'pvActual')::int, v_pv_max);
  v_escudo := COALESCE((v_combat->>'escudoActual')::int, 0);

  -- Si amount es negativo o cero, no hacer nada o delegar a curar
  IF p_amount <= 0 THEN
    v_new_pv := v_pv_actual;
    v_new_escudo := v_escudo;
  ELSE
    v_damage_left := p_amount;
    
    -- Absorber primero con escudo si existe
    IF v_escudo > 0 THEN
      IF v_escudo >= v_damage_left THEN
        v_new_escudo := v_escudo - v_damage_left;
        v_damage_left := 0;
      ELSE
        v_damage_left := v_damage_left - v_escudo;
        v_new_escudo := 0;
      END IF;
    ELSE
      v_new_escudo := 0;
    END IF;

    -- El remanente entra a los puntos de vida
    v_new_pv := GREATEST(0, v_pv_actual - v_damage_left);
  END IF;

  -- C) Actualizar combat y estado en characters
  v_combat := jsonb_set(v_combat, '{pvActual}', to_jsonb(v_new_pv));
  v_combat := jsonb_set(v_combat, '{escudoActual}', to_jsonb(v_new_escudo));

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{combat}', v_combat),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'pvActual', v_new_pv,
    'pvMax', v_pv_max,
    'escudoActual', v_new_escudo,
    'damageTaken', p_amount,
    'updated_at', NOW()
  );

  -- D) Guardar comando procesado
  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'apply_damage', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC ATÓMICA: APLICAR CURACIÓN (apply_heal)
CREATE OR REPLACE FUNCTION public.apply_heal(
  p_character_id UUID,
  p_amount INT,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_combat JSONB;
  v_pv_actual INT;
  v_pv_max INT;
  v_new_pv INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  -- A) Idempotencia
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  -- B) Bloqueo de fila
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_combat := COALESCE(v_row.data->'combat', '{}'::jsonb);
  v_pv_max := COALESCE((v_combat->>'pvMax')::int, 20);
  v_pv_actual := COALESCE((v_combat->>'pvActual')::int, 0);

  IF p_amount <= 0 THEN
    v_new_pv := v_pv_actual;
  ELSE
    v_new_pv := LEAST(v_pv_max, v_pv_actual + p_amount);
  END IF;

  v_combat := jsonb_set(v_combat, '{pvActual}', to_jsonb(v_new_pv));

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{combat}', v_combat),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'pvActual', v_new_pv,
    'pvMax', v_pv_max,
    'healedAmount', p_amount,
    'updated_at', NOW()
  );

  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'apply_heal', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC ATÓMICA: MODIFICAR MANÁ (change_mana)
CREATE OR REPLACE FUNCTION public.change_mana(
  p_character_id UUID,
  p_amount INT,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_combat JSONB;
  v_mana_actual INT;
  v_mana_max INT;
  v_new_mana INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_combat := COALESCE(v_row.data->'combat', '{}'::jsonb);
  v_mana_max := COALESCE((v_combat->>'manaMax')::int, 40);
  v_mana_actual := COALESCE((v_combat->>'manaActual')::int, v_mana_max);

  v_new_mana := GREATEST(0, LEAST(v_mana_max, v_mana_actual + p_amount));

  v_combat := jsonb_set(v_combat, '{manaActual}', to_jsonb(v_new_mana));

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{combat}', v_combat),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'manaActual', v_new_mana,
    'manaMax', v_mana_max,
    'delta', p_amount,
    'updated_at', NOW()
  );

  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'change_mana', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC ATÓMICA: MODIFICAR ORO Y PLATA (change_gold)
CREATE OR REPLACE FUNCTION public.change_gold(
  p_character_id UUID,
  p_amount_oro INT,
  p_amount_plata INT DEFAULT 0,
  p_command_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_money JSONB;
  v_oro INT;
  v_plata INT;
  v_new_oro INT;
  v_new_plata INT;
  v_cached_res JSONB;
  v_result JSONB;
BEGIN
  IF p_command_id IS NOT NULL THEN
    SELECT result INTO v_cached_res FROM public.processed_commands WHERE command_id = p_command_id;
    IF v_cached_res IS NOT NULL THEN
      RETURN v_cached_res;
    END IF;
  END IF;

  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje con ID % no encontrado', p_character_id;
  END IF;

  v_money := COALESCE(v_row.data->'money', '{"oro": 0, "plata": 0}'::jsonb);
  v_oro := COALESCE((v_money->>'oro')::int, 0);
  v_plata := COALESCE((v_money->>'plata')::int, 0);

  v_new_oro := GREATEST(0, v_oro + p_amount_oro);
  v_new_plata := GREATEST(0, v_plata + p_amount_plata);

  v_money := jsonb_build_object('oro', v_new_oro, 'plata', v_new_plata);

  UPDATE public.characters
  SET 
    data = jsonb_set(data, '{money}', v_money),
    updated_at = NOW()
  WHERE id = p_character_id;

  v_result := jsonb_build_object(
    'success', true,
    'character_id', p_character_id,
    'oro', v_new_oro,
    'plata', v_new_plata,
    'deltaOro', p_amount_oro,
    'deltaPlata', p_amount_plata,
    'updated_at', NOW()
  );

  IF p_command_id IS NOT NULL THEN
    INSERT INTO public.processed_commands (command_id, character_id, command_type, result)
    VALUES (p_command_id, p_character_id, 'change_gold', v_result)
    ON CONFLICT (command_id) DO NOTHING;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
