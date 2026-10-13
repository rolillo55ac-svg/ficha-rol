-- 030: Tiempo real privado. Solo añade políticas; no toca datos.
--  1. La web abre ahora sus canales con private: true (tiradas, estadísticas, sonidos, tickets, La Casa, mapa, reloj, fichas).
--  2. Políticas en realtime.messages: solo usuarios con sesión (authenticated) pueden escuchar y emitir,
--     y solo en los canales de la web (realtime_* y character_*). anon no tiene ninguna política: no entra.
--  3. Las tablas siguen protegidas por su propia RLS para postgres_changes (una ficha ajena no llega).
--  Cuando la web publicada use canales privados, se puede desactivar "Allow public access" en Realtime › Settings.
--  Con partidas separadas habrá que cambiar estas políticas para limitar cada canal a los miembros de su partida.
-- Se puede ejecutar dos veces sin problema.
--
-- DESHACER (a mano, en el SQL Editor; antes, volver a activar "Allow public access" si se desactivó):
--   DROP POLICY IF EXISTS "tiempo real: con sesión escucha" ON realtime.messages;
--   DROP POLICY IF EXISTS "tiempo real: con sesión emite" ON realtime.messages;

DROP POLICY IF EXISTS "tiempo real: con sesión escucha" ON realtime.messages;
CREATE POLICY "tiempo real: con sesión escucha" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (realtime.topic() LIKE 'realtime\_%' OR realtime.topic() LIKE 'character\_%')
  );

DROP POLICY IF EXISTS "tiempo real: con sesión emite" ON realtime.messages;
CREATE POLICY "tiempo real: con sesión emite" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (realtime.topic() LIKE 'realtime\_%' OR realtime.topic() LIKE 'character\_%')
  );
