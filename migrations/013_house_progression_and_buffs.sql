-- ============================================================================
-- MIGRACIÓN 013: PROGRESO ATÓMICO Y MEJORAS DE LA CASA
-- Fecha: 2026-09-15
-- Funciones RPC: add_house_progress, toggle_house_upgrade
-- ============================================================================

-- 1. RPC ATÓMICA: SUBIR PROGRESO O STAT DE LA CASA (add_house_progress)
CREATE OR REPLACE FUNCTION public.add_house_progress(
  p_house_id UUID,
  p_amount INT,
  p_stat_name TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_house public.house%ROWTYPE;
  v_new_level INT;
  v_new_prog INT;
  v_new_max INT;
  v_stat_val INT;
  v_stat_prog INT;
  v_stat_max INT;
  v_did_level_up BOOLEAN := false;
  v_did_stat_up BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- A) Bloqueo estricto de la fila para atomicidad ante concurrencia
  SELECT * INTO v_house FROM public.house WHERE id = p_house_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Casa con ID % no encontrada', p_house_id;
  END IF;

  -- B) Progreso General (Nivel de la Casa)
  IF p_stat_name IS NULL OR p_stat_name = 'general' OR p_stat_name = '' THEN
    v_new_level := v_house.level;
    v_new_prog := GREATEST(0, v_house.progress_current + p_amount);
    v_new_max := GREATEST(10, v_house.progress_max);

    WHILE v_new_prog >= v_new_max LOOP
      v_new_level := v_new_level + 1;
      v_new_prog := v_new_prog - v_new_max;
      v_new_max := v_new_max + 50;
      v_did_level_up := true;

      -- Registrar evento de subida de nivel
      INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
      VALUES (
        p_house_id, p_actor_id, 'level_up',
        jsonb_build_object(
          'message', '¡La Casa Andante ha alcanzado el Nivel ' || v_new_level || '!',
          'level', v_new_level,
          'amount', p_amount
        )
      );
    END LOOP;

    IF NOT v_did_level_up AND p_amount != 0 THEN
      INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
      VALUES (
        p_house_id, p_actor_id, 'progress_gain',
        jsonb_build_object(
          'message', 'Progreso general de la casa aumentado en ' || p_amount || ' puntos.',
          'amount', p_amount,
          'current', v_new_prog,
          'max', v_new_max
        )
      );
    END IF;

    UPDATE public.house SET
      level = v_new_level,
      progress_current = v_new_prog,
      progress_max = v_new_max,
      updated_at = NOW()
    WHERE id = p_house_id
    RETURNING * INTO v_house;

  -- C) Progreso de Estadísticas Específicas
  ELSIF p_stat_name = 'confort' THEN
    v_stat_val := v_house.confort;
    v_stat_prog := GREATEST(0, v_house.confort_progress + p_amount);
    v_stat_max := GREATEST(5, v_house.confort_max);

    WHILE v_stat_prog >= v_stat_max LOOP
      v_stat_val := v_stat_val + 1;
      v_stat_prog := v_stat_prog - v_stat_max;
      v_stat_max := v_stat_max + 5;
      v_did_stat_up := true;
    END LOOP;

    UPDATE public.house SET
      confort = v_stat_val,
      confort_progress = v_stat_prog,
      confort_max = v_stat_max,
      updated_at = NOW()
    WHERE id = p_house_id
    RETURNING * INTO v_house;

    INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
    VALUES (
      p_house_id, p_actor_id, 'stat_gain',
      jsonb_build_object(
        'stat', 'confort',
        'message', (CASE WHEN v_did_stat_up THEN '¡El Confort de la casa subió a Nv. ' || v_stat_val || '!' ELSE 'Confort incrementado en ' || p_amount || ' pts.' END),
        'val', v_stat_val,
        'prog', v_stat_prog
      )
    );

  ELSIF p_stat_name = 'arcana' THEN
    v_stat_val := v_house.arcana;
    v_stat_prog := GREATEST(0, v_house.arcana_progress + p_amount);
    v_stat_max := GREATEST(5, v_house.arcana_max);

    WHILE v_stat_prog >= v_stat_max LOOP
      v_stat_val := v_stat_val + 1;
      v_stat_prog := v_stat_prog - v_stat_max;
      v_stat_max := v_stat_max + 5;
      v_did_stat_up := true;
    END LOOP;

    UPDATE public.house SET
      arcana = v_stat_val,
      arcana_progress = v_stat_prog,
      arcana_max = v_stat_max,
      updated_at = NOW()
    WHERE id = p_house_id
    RETURNING * INTO v_house;

    INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
    VALUES (
      p_house_id, p_actor_id, 'stat_gain',
      jsonb_build_object(
        'stat', 'arcana',
        'message', (CASE WHEN v_did_stat_up THEN '¡El poder de Arcana del Libro subió a Nv. ' || v_stat_val || '!' ELSE 'Arcana incrementada en ' || p_amount || ' pts.' END),
        'val', v_stat_val,
        'prog', v_stat_prog
      )
    );

  ELSIF p_stat_name = 'provisiones' THEN
    v_stat_val := v_house.provisiones;
    v_stat_prog := GREATEST(0, v_house.provisiones_progress + p_amount);
    v_stat_max := GREATEST(5, v_house.provisiones_max);

    WHILE v_stat_prog >= v_stat_max LOOP
      v_stat_val := v_stat_val + 1;
      v_stat_prog := v_stat_prog - v_stat_max;
      v_stat_max := v_stat_max + 5;
      v_did_stat_up := true;
    END LOOP;

    UPDATE public.house SET
      provisiones = v_stat_val,
      provisiones_progress = v_stat_prog,
      provisiones_max = v_stat_max,
      updated_at = NOW()
    WHERE id = p_house_id
    RETURNING * INTO v_house;

    INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
    VALUES (
      p_house_id, p_actor_id, 'stat_gain',
      jsonb_build_object(
        'stat', 'provisiones',
        'message', (CASE WHEN v_did_stat_up THEN '¡Las Provisiones de la cocina subieron a Nv. ' || v_stat_val || '!' ELSE 'Provisiones incrementadas en ' || p_amount || ' pts.' END),
        'val', v_stat_val,
        'prog', v_stat_prog
      )
    );

  ELSIF p_stat_name = 'custodia' THEN
    v_stat_val := v_house.custodia;
    v_stat_prog := GREATEST(0, v_house.custodia_progress + p_amount);
    v_stat_max := GREATEST(5, v_house.custodia_max);

    WHILE v_stat_prog >= v_stat_max LOOP
      v_stat_val := v_stat_val + 1;
      v_stat_prog := v_stat_prog - v_stat_max;
      v_stat_max := v_stat_max + 5;
      v_did_stat_up := true;
    END LOOP;

    UPDATE public.house SET
      custodia = v_stat_val,
      custodia_progress = v_stat_prog,
      custodia_max = v_stat_max,
      updated_at = NOW()
    WHERE id = p_house_id
    RETURNING * INTO v_house;

    INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
    VALUES (
      p_house_id, p_actor_id, 'stat_gain',
      jsonb_build_object(
        'stat', 'custodia',
        'message', (CASE WHEN v_did_stat_up THEN '¡La Custodia y camuflaje subió a Nv. ' || v_stat_val || '!' ELSE 'Custodia incrementada en ' || p_amount || ' pts.' END),
        'val', v_stat_val,
        'prog', v_stat_prog
      )
    );

  ELSIF p_stat_name = 'vinculo' THEN
    v_stat_val := v_house.vinculo;
    v_stat_prog := GREATEST(0, v_house.vinculo_progress + p_amount);
    v_stat_max := GREATEST(5, v_house.vinculo_max);

    WHILE v_stat_prog >= v_stat_max LOOP
      v_stat_val := v_stat_val + 1;
      v_stat_prog := v_stat_prog - v_stat_max;
      v_stat_max := v_stat_max + 5;
      v_did_stat_up := true;
    END LOOP;

    UPDATE public.house SET
      vinculo = v_stat_val,
      vinculo_progress = v_stat_prog,
      vinculo_max = v_stat_max,
      updated_at = NOW()
    WHERE id = p_house_id
    RETURNING * INTO v_house;

    INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
    VALUES (
      p_house_id, p_actor_id, 'stat_gain',
      jsonb_build_object(
        'stat', 'vinculo',
        'message', (CASE WHEN v_did_stat_up THEN '¡El Vínculo con los moradores subió a Nv. ' || v_stat_val || '!' ELSE 'Vínculo incrementado en ' || p_amount || ' pts.' END),
        'val', v_stat_val,
        'prog', v_stat_prog
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'house', to_jsonb(v_house),
    'stat_name', COALESCE(p_stat_name, 'general'),
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: DESBLOQUEAR O BLOQUEAR MEJORA (toggle_house_upgrade)
CREATE OR REPLACE FUNCTION public.toggle_house_upgrade(
  p_upgrade_id UUID,
  p_unlocked BOOLEAN,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_upg public.house_upgrades%ROWTYPE;
BEGIN
  SELECT * INTO v_upg FROM public.house_upgrades WHERE id = p_upgrade_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mejora con ID % no encontrada', p_upgrade_id;
  END IF;

  UPDATE public.house_upgrades SET
    unlocked = p_unlocked,
    updated_at = NOW()
  WHERE id = p_upgrade_id
  RETURNING * INTO v_upg;

  INSERT INTO public.house_events (house_id, actor_user_id, event_type, payload)
  VALUES (
    v_upg.house_id, p_actor_id, 'unlock_upgrade',
    jsonb_build_object(
      'upgrade_id', p_upgrade_id,
      'name', v_upg.name,
      'unlocked', p_unlocked,
      'message', (CASE WHEN p_unlocked THEN 'Mejora desbloqueada: ' || v_upg.name ELSE 'Mejora bloqueada: ' || v_upg.name END)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'upgrade', to_jsonb(v_upg)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
