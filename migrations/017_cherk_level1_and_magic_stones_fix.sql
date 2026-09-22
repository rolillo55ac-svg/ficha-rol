-- ============================================================================
-- MIGRACIÓN 017: CORRECCIÓN OFICIAL DE CHERK Y PERMISOS DEL MÁSTER (LORE / PUNTOS)
-- 1. Bajar nivel de Cherk a 1 (con PV 20 y Maná 10 oficiales)
-- 2. Fijar +1 en la habilidad Piedras Mágicas (skillBonus.piedras = 1)
-- 3. Asignar rol 'master' a rolillo55ac@gmail.com en public.profiles
-- 4. Actualizar update_character_data con SECURITY DEFINER para que el Máster
--    pueda guardar puntos y habilidades en cualquier personaje sin bloqueo RLS
-- ============================================================================

-- 1. Actualización de Cherk a nivel 1 y piedras mágicas 1
UPDATE public.characters
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(coalesce(data, '{}'::jsonb), '{nivel}', '"1"'),
        '{skillBonus,piedras}', '1'
      ),
      '{combat,pvMax}', '20'
    ),
    '{combat,pvActual}', '20'
  ),
  '{combat,manaMax}', '10'
),
updated_at = now()
WHERE id = 'a8039428-8ee7-4e31-baba-c6a1d8b6d8f3'::uuid
   OR name ILIKE '%cherk%';

-- 2. Asegurar que el usuario Máster tenga el rol en public.profiles
INSERT INTO public.profiles (id, email, role)
VALUES ('eaa97e7a-408d-476f-9774-55ec911833d8'::uuid, 'rolillo55ac@gmail.com', 'master')
ON CONFLICT (id) DO UPDATE SET role = 'master';

-- 3. Función atómica con SECURITY DEFINER para permitir al Máster guardar en cualquier ficha
CREATE OR REPLACE FUNCTION public.update_character_data(char_id uuid, patch jsonb)
RETURNS public.characters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.characters;
  caller_id uuid := auth.uid();
  caller_email text := coalesce(auth.jwt()->>'email', '');
  is_admin boolean;
BEGIN
  -- Permiso: dueño o Máster (por id, email o tabla profiles)
  SELECT (
    caller_id IS NULL
    OR caller_id = 'eaa97e7a-408d-476f-9774-55ec911833d8'::uuid
    OR caller_email ILIKE 'rolillo55ac@%'
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = caller_id AND (p.role = 'master' OR p.role = 'gm'))
  ) INTO is_admin;

  UPDATE public.characters
  SET data = public.jsonb_deep_merge(coalesce(data, '{}'::jsonb), patch),
      name = coalesce(patch->>'name', name),
      updated_at = now()
  WHERE id = char_id
    AND (is_admin OR owner_id = caller_id)
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personaje no encontrado o sin permiso para guardar cambios';
  END IF;

  RETURN updated_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_character_data(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_character_data(uuid, jsonb) TO anon;

-- 4. Actualizar política RLS para permitir al Máster actualizar personajes directamente
DROP POLICY IF EXISTS "characters_update" ON public.characters;
CREATE POLICY "characters_update" ON public.characters
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR auth.uid() = 'eaa97e7a-408d-476f-9774-55ec911833d8'::uuid
    OR (auth.jwt()->>'email') ILIKE 'rolillo55ac@%'
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.role = 'master' OR p.role = 'gm'))
  );
