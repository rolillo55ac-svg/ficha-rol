-- 029: Notas secretas del catálogo de Alquimia (efecto real en enemigos y en Cherk). Solo añade; no toca datos existentes.
--  1. Tabla alchemy_secrets: una fila por sustancia del catálogo (substance_id = id de ALCHEMY_CATALOG en js/state.js).
--     Antes estas notas iban dentro del código de la web y cualquier jugador podía leerlas.
--  2. RLS: solo el máster (is_gm()) la lee, la crea y la cambia. Nadie la borra. Sin acceso para anon.
--  3. Se rellena con las 46 notas que había en el código (ON CONFLICT DO NOTHING: no pisa lo que cambie el máster).
-- Se puede ejecutar dos veces sin problema.
--
-- DESHACER (a mano, en el SQL Editor; antes, volver a poner las notas en js/state.js con git revert):
--   DROP TABLE IF EXISTS public.alchemy_secrets;

CREATE TABLE IF NOT EXISTS public.alchemy_secrets (
  substance_id text PRIMARY KEY,
  efecto_enemigo text NOT NULL DEFAULT '',
  efecto_cherk text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alchemy_secrets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alchemy_secrets' AND policyname = 'alquimia secreta: solo el máster la lee') THEN
    CREATE POLICY "alquimia secreta: solo el máster la lee" ON public.alchemy_secrets
      FOR SELECT TO authenticated USING (public.is_gm());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alchemy_secrets' AND policyname = 'alquimia secreta: solo el máster la crea') THEN
    CREATE POLICY "alquimia secreta: solo el máster la crea" ON public.alchemy_secrets
      FOR INSERT TO authenticated WITH CHECK (public.is_gm());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alchemy_secrets' AND policyname = 'alquimia secreta: solo el máster la cambia') THEN
    CREATE POLICY "alquimia secreta: solo el máster la cambia" ON public.alchemy_secrets
      FOR UPDATE TO authenticated USING (public.is_gm()) WITH CHECK (public.is_gm());
  END IF;
END $$;

REVOKE ALL ON public.alchemy_secrets FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.alchemy_secrets TO authenticated;

INSERT INTO public.alchemy_secrets (substance_id, efecto_enemigo, efecto_cherk) VALUES
  ('subst_amanita', 'Base de venenos (Muy común). Entorpece las funciones motoras.', 'Neutralizante digestivo / Estimulante base.'),
  ('subst_seta_sueno', 'Sueño profundo / Paralización motora progresiva.', 'No necesitas dormir (Máximo 1 noche sin penalización).'),
  ('subst_seta_terrosa', 'Entumecer músculos y articulaciones.', '+ Mitad de movilidad (4 Turnos).'),
  ('subst_nenufar_p', 'Reduce la Percepción rival (-2 a tiradas de Advertir y Buscar).', '+2 a Percepción (20 min).'),
  ('subst_nenufar_m', 'Daño continuo por toxina corrosiva (1d4 por turno).', '+3 de vida falsa / escudo orgánico (hasta perderla).'),
  ('subst_flor_caido', 'Veneno mortal. Colapso biológico fulminante.', 'Trance agónico: Inmune a caer inconsciente durante 3 turnos.'),
  ('subst_flor_sombra', 'Ceguera temporal e hipersensibilidad a la luz.', 'Visión en la oscuridad completa (20 min).'),
  ('subst_cactus', 'Urticante lacerante, ardor constante que distrae en combate.', '+1 a las acciones (3 Turnos).'),
  ('subst_corteza_congelada', 'Congela al rival (-4 a Movilidad / entumecimiento glacial).', 'Resistencia térmica absoluta al calor y fuego (15 min).'),
  ('subst_seta_secante', 'Deshidrata con extrema rapidez, causando jadeo y sed dolorosa.', 'Absorbe y drena toxinas estomacales ajenas.'),
  ('subst_flor_volcan', 'Azufre corrosivo. Quema piel y corroe armaduras leves.', 'Calor interno que otorga inmunidad al congelamiento ambiental.'),
  ('subst_baya_v', 'Visión monocromática en blanco y negro (anula contrastes).', 'Visión térmica: Detecta siluetas calientes en la penumbra.'),
  ('subst_baya_n', 'Duerme la lengua y cuerdas vocales (impide articular conjuros).', 'Anestesia local: Ignora penalizadores por dolor.'),
  ('subst_quimera', 'Paraliza por completo el sistema nervioso motor.', 'Hiperreflejos felinos: +3 a Reflejos y Esquivar (3 turnos).'),
  ('subst_escorpion_cobre', 'Quemadura de sol abrasadora interna.', 'Piel bronceada endurecida: +2 a la Absorción física.'),
  ('subst_flor_n_oasis', 'Ceguera por fotofobia aguda y lagrimeo constante.', 'Clarividencia: Ojos descansados bajo la noche estelar.'),
  ('subst_escorpion_negro', 'Dolor fatal e insuficiencia nerviosa dolorosa.', 'Furia adrenalínica: +1d6 al daño del próximo ataque físico.'),
  ('subst_sudor_pajaro', 'Corrosivo dérmico y escozor agudo al contacto.', 'Ligereza corporal y reducción de penalización de armadura.'),
  ('subst_melocoton_pinch', 'Adicción severa, náusea e inestabilidad al disiparse.', 'Éxtasis embriagador: Inmune a efectos de miedo o cobardía.'),
  ('subst_calamar_gigante', 'Indigestión masiva y mareo de mar en tierra.', 'Elasticidad tentacular: +2 a maniobras de presa o escape.'),
  ('subst_v_serpiente', 'Pesadillas alucinógenas y pánico visceral.', 'Termorrecepción ofídica: Capacidad de percibir criaturas a 15m.'),
  ('subst_pez_globo', 'Parálisis respiratoria y sofoco asfixiante.', 'Respiración acuática completa (20 min).'),
  ('subst_alga_playa', 'Sabor salobre vomitivo que interrumpe acciones.', 'Base de pociones (Muy común). Facilita decocciones curativas.'),
  ('subst_musgo_v', 'Fosforescencia delatora: Ilumina al enemigo e impide ocultarse.', 'Emite Luz Verde suave iluminando 10m sin necesidad de antorcha.'),
  ('subst_flor_rey', 'Inestabilidad de éter: Penaliza el lanzamiento de hechizos.', '+Defensa mágica temporal (+4 contra magia durante 1 hora).'),
  ('subst_flor_lirio_p', 'Purga gástrica incontrolable.', 'Cura venenos, toxinas y ponzoñas activas de inmediato.'),
  ('subst_raiz_manglar', 'Enraizamiento vegetal molesto a sus pies.', 'Crecimiento de Plantas acelerado en la tierra circundante.'),
  ('subst_flor_dia', 'Deslumbramiento por energía solar desbordada.', '+Vitalidad temporal (+10 PV máximos por 2 horas).'),
  ('subst_crisantemo', 'Sobrecarga de estímulos sensoriales.', '+Percepción aguda (+2 a tiradas de Advertir/Buscar).'),
  ('subst_flor_oasis', 'Fuga de maná por sobre-ionización.', 'Regeneración de Maná / Energía rápida (+10 Maná al instante).'),
  ('subst_musgo_a', 'Resplandor azulado que revela puntos débiles.', 'Emite Luz Azul fría y serena útil para explorar sin ruido.'),
  ('subst_flor_cristal', 'Petrificación celular transitoria y dolor articular.', 'Regeneración celular avanzada: Recupera 3 PV por turno (3 turnos).'),
  ('subst_flor_melosa', 'Sopor placentero que reduce la agresividad.', 'Dulce sedante: Disipa crisis nerviosas o penalizadores de pánico.'),
  ('subst_musgo_rio', 'Emplasto resbaladizo inofensivo.', 'Base de ungüentos (Muy común). Facilita bálsamos tópicos.'),
  ('subst_flor_aire', 'Evaporación acelerada de defensas dérmicas.', 'Mejorador de ungüentos: Duplica la duración de otros bálsamos.'),
  ('subst_margarita', 'Cicatrización superficial mínima.', 'Curación básica de heridas: Restaura 1d6+2 PV al aplicarse.'),
  ('subst_margarita_x2', 'Inocuo en humanoides.', 'Curación animal: Restaura 2d6 PV a monturas, bestias o familiares.'),
  ('subst_musgo_olor', 'Olor penetrante que delata al enemigo a larga distancia.', 'Rastreo de feromonas y pistas: +3 a tiradas de Rastrear.'),
  ('subst_flor_agua', 'Obstrucción de poros y sensación de ahogo.', 'Apnea prolongada bajo el agua (hasta 15 min sin consumir aire).'),
  ('subst_seta_lenosa', 'Coagulación desordenada en cortes externos.', 'Cicatrización rápida de cortes profundos y cese de sangrados.'),
  ('subst_musgo_estanque', 'Tinte verdoso que ensucia armaduras.', 'Camuflaje con el entorno: +2 a tiradas de Sigilo entre vegetación.'),
  ('subst_flor_hestia', 'Calor sofocante cutáneo.', 'Resistencia al frío extremo e inmunidad a hipotermia ambiental.'),
  ('subst_flor_terra', 'Espasmo muscular menor en extremidades.', 'Energía y rendimiento de Atleta: +2 en Atletismo y +2 Movilidad.'),
  ('subst_flor_escarcha', 'Escalofríos paralizantes.', 'Resistencia al calor extremo y quemaduras por sol o brasas.'),
  ('subst_bayas_glue', 'Adherencia molesta en manos y mangos de armas.', 'Pegamento adhesivo instantáneo de gran tenacidad mecánica.'),
  ('subst_hestia_escarcha', 'Choque térmico alternante desestabilizador.', 'Adaptación climática universal: Inmune tanto al frío como al calor extremos.')
ON CONFLICT (substance_id) DO NOTHING;
