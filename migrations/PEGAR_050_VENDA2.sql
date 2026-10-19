-- VENDA2: pegar en el SQL Editor del proyecto de Venda2. Igual que la 050 de Krysalis.
BEGIN;
-- 050: subir La Casa a la nube volvía a fallar desde la 047. La 047 añadió house.room_editors (NOT NULL,
-- por defecto '{}'), pero import_house rellena la fila con jsonb_populate_record y lo que no viene en el
-- JSON queda en NULL en vez de tomar el valor por defecto → "null value in column room_editors".
-- Arreglo: añadir "room_editors":[] a los valores por defecto de import_house. No toca datos ni permisos
-- (CREATE OR REPLACE conserva los GRANT). Sirve igual para Krysalis y para Venda2.
-- Se puede ejecutar dos veces (si ya está, no hace nada). Para deshacer:
--   DO $$ DECLARE d text := pg_get_functiondef('public.import_house(jsonb,text)'::regprocedure);
--   BEGIN EXECUTE replace(d, '"players_can_edit":false,"room_editors":[],', '"players_can_edit":false,'); END $$;

DO $$
DECLARE
  d text := pg_get_functiondef('public.import_house(jsonb,text)'::regprocedure);
BEGIN
  IF position('room_editors' IN d) = 0 THEN
    IF position('"players_can_edit":false,' IN d) = 0 THEN
      RAISE EXCEPTION 'import_house no tiene la forma esperada: no se cambia';
    END IF;
    EXECUTE replace(d, '"players_can_edit":false,', '"players_can_edit":false,"room_editors":[],');
  END IF;
END $$;
COMMIT;
