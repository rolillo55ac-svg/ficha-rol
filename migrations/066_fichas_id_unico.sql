-- 066 · Una sola fila por ficha: la base rechaza dos filas de `characters` con el mismo id de ficha (data->>'id').
-- Motivo: crear una ficha y editarla enseguida llegó a insertar dos filas iguales (TK-4JP7).
-- Se aplica en las dos partidas. Idempotente. Falla (y no cambia nada) si aún queda algún duplicado.
-- Deshacer: DROP INDEX IF EXISTS public.characters_data_id_uniq;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.characters
    WHERE data->>'id' IS NOT NULL
    GROUP BY data->>'id' HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Quedan fichas duplicadas: no se crea el índice';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS characters_data_id_uniq
  ON public.characters ((data->>'id'));
