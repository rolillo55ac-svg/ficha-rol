-- 026: nombres de muebles sencillos.
-- El catálogo de muebles (js/house.js, CANVA_ASSET_LIBRARY) pasa a nombres cortos
-- ("Cama", "Baúl", "Librería"...). Aquí se cambian los muebles ya guardados en
-- house_rooms (furniture.name y decor.label) SOLO si su nombre es exactamente el
-- antiguo nombre por defecto del catálogo. Si alguien le puso otro nombre, no se toca.
-- Solo cambia textos de nombre: no borra muebles, objetos ni posiciones.
-- Se puede ejecutar dos veces: la segunda no encuentra nombres antiguos y no hace nada.
--
-- Copia antes de aplicar (hecha a mano): backup.house_rooms_20261012_1622 (15 estancias).
-- Además, cada cambio queda apuntado en backup.house_item_renames_026 y la tabla de
-- equivalencias antiguo -> nuevo en backup.house_item_names_026.
-- Restaurar todo desde la copia:
--   UPDATE public.house_rooms h SET furniture = b.furniture, decor = b.decor
--   FROM backup.house_rooms_20261012_1622 b WHERE b.id = h.id;
--
-- Deshacer (vuelve a poner el nombre antiguo solo en los muebles cambiados aquí):
--   UPDATE public.house_rooms h SET
--     furniture = (SELECT jsonb_agg(CASE WHEN r.item_id IS NOT NULL AND e->>'name' = r.new_name
--                    THEN jsonb_set(e, '{name}', to_jsonb(r.old_name)) ELSE e END ORDER BY o)
--                  FROM jsonb_array_elements(h.furniture) WITH ORDINALITY AS t(e, o)
--                  LEFT JOIN backup.house_item_renames_026 r
--                    ON r.room_id = h.id AND r.field = 'name' AND r.item_id = e->>'id'),
--     decor = (SELECT jsonb_agg(CASE WHEN r.item_id IS NOT NULL AND e->>'label' = r.new_name
--                THEN jsonb_set(e, '{label}', to_jsonb(r.old_name)) ELSE e END ORDER BY o)
--              FROM jsonb_array_elements(h.decor) WITH ORDINALITY AS t(e, o)
--              LEFT JOIN backup.house_item_renames_026 r
--                ON r.room_id = h.id AND r.field = 'label' AND r.item_id = e->>'id')
--   WHERE h.id IN (SELECT room_id FROM backup.house_item_renames_026);

CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.house_item_renames_026 (
  room_id text, item_id text, field text, old_name text, new_name text,
  changed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backup.house_item_names_026 (old_name text PRIMARY KEY, new_name text);
INSERT INTO backup.house_item_names_026 (old_name, new_name) VALUES
  ('Puerta Batiente con Arco', 'Puerta'),
  ('Arco de Paso Abierto', 'Arco'),
  ('Puerta Doble Señorial', 'Puerta doble'),
  ('Ventana con Vano de Luz', 'Ventana'),
  ('Escaleras (Subir Piso)', 'Escalera de subida'),
  ('Escaleras (Bajar Piso)', 'Escalera de bajada'),
  ('Puerta Principal de Entrada', 'Puerta principal'),
  ('Cama Individual', 'Cama'),
  ('Cama de Matrimonio / Dosel', 'Cama doble'),
  ('Sillón Orejero de Reposo', 'Sillón'),
  ('Mesa de Roble con 4 Sillas', 'Mesa'),
  ('Escritorio de Estudio y Pergaminos', 'Escritorio'),
  ('Mesa de Alquimia y Matraces', 'Mesa de alquimia'),
  ('Baúl Reforzado de Viaje', 'Baúl'),
  ('Alacena Despensa de Víveres', 'Despensa'),
  ('Armero de Guardia y Panoplia', 'Armero'),
  ('Librería de Grimorios Sapientes', 'Librería'),
  ('Fogón con Caldero Errante', 'Fogón'),
  ('Chimenea de Piedra con Leña', 'Chimenea'),
  ('Banco de Trabajo y Forja', 'Banco de trabajo'),
  ('Alfombra Persa Granate', 'Alfombra'),
  ('Alfombra Rúnica Celestial', 'Alfombra rúnica'),
  ('Piel de Oso Nórdico', 'Piel de oso'),
  ('Tapiz Bordado del Mapa', 'Tapiz'),
  ('Trofeo de Cráneo de Bestia', 'Trofeo'),
  ('Diana con Flechas', 'Diana'),
  ('Barriles de Hidromiel Enana', 'Barriles'),
  ('Planta Frondosa en Maceta', 'Planta'),
  ('Setas Bioluminiscentes', 'Setas'),
  ('Bonsái Arcano Viviente', 'Bonsái'),
  ('Anaquel de Pociones y Viales', 'Estante de pociones'),
  ('Mesa Táctica de Cartografía', 'Mesa de mapas'),
  ('Pedestal de Gema Radiante', 'Pedestal con gema'),
  ('Telaraña Ancestral de Rincón', 'Telaraña'),
  ('Candelabro Alto de Forja', 'Candelabro'),
  ('Farol de Aceite de Pared', 'Farol'),
  ('Brasero de Fuego Violeta', 'Brasero'),
  ('Gran Chimenea de Piedra', 'Chimenea grande')
ON CONFLICT (old_name) DO NOTHING;

INSERT INTO backup.house_item_renames_026 (room_id, item_id, field, old_name, new_name)
SELECT h.id, e->>'id', 'name', m.old_name, m.new_name
FROM public.house_rooms h, jsonb_array_elements(COALESCE(h.furniture, '[]'::jsonb)) e
JOIN backup.house_item_names_026 m ON m.old_name = e->>'name'
UNION ALL
SELECT h.id, e->>'id', 'label', m.old_name, m.new_name
FROM public.house_rooms h, jsonb_array_elements(COALESCE(h.decor, '[]'::jsonb)) e
JOIN backup.house_item_names_026 m ON m.old_name = e->>'label';

UPDATE public.house_rooms h SET
  furniture = (SELECT jsonb_agg(CASE WHEN m.old_name IS NOT NULL
                 THEN jsonb_set(e, '{name}', to_jsonb(m.new_name)) ELSE e END ORDER BY o)
               FROM jsonb_array_elements(h.furniture) WITH ORDINALITY AS t(e, o)
               LEFT JOIN backup.house_item_names_026 m ON m.old_name = e->>'name')
WHERE jsonb_typeof(h.furniture) = 'array'
  AND EXISTS (SELECT 1 FROM jsonb_array_elements(h.furniture) e JOIN backup.house_item_names_026 m ON m.old_name = e->>'name');

UPDATE public.house_rooms h SET
  decor = (SELECT jsonb_agg(CASE WHEN m.old_name IS NOT NULL
             THEN jsonb_set(e, '{label}', to_jsonb(m.new_name)) ELSE e END ORDER BY o)
           FROM jsonb_array_elements(h.decor) WITH ORDINALITY AS t(e, o)
           LEFT JOIN backup.house_item_names_026 m ON m.old_name = e->>'label')
WHERE jsonb_typeof(h.decor) = 'array'
  AND EXISTS (SELECT 1 FROM jsonb_array_elements(h.decor) e JOIN backup.house_item_names_026 m ON m.old_name = e->>'label');
