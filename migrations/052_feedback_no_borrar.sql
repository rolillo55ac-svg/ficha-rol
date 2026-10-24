-- 052: los reportes (app_feedback) ya no se borran desde la web (tarea 64.4).
-- El 23/10 se borraron 9 reportes con el botón "Eliminar ticket"; "atendido" pasa a ser status = 'resolved'.
-- El máster solo puede borrar los reportes de las pruebas automáticas (id que empieza por 'prueba-').
-- No toca datos. Se puede ejecutar dos veces. Copia previa en Krysalis: backup.app_feedback_20261024_1900.
-- Deshacer (vuelve a dejar borrar cualquier reporte al máster):
--   ALTER POLICY "tickets: solo el máster borra" ON public.app_feedback USING (is_gm());
BEGIN;
ALTER POLICY "tickets: solo el máster borra" ON public.app_feedback USING (is_gm() AND id LIKE 'prueba-%');
COMMIT;
