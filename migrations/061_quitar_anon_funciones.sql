-- 061: quien no ha iniciado sesión no puede llamar a funciones que mueven datos. Solo restringe.
-- (Ya miraban la cuenta por dentro; esto lo cierra también desde fuera.) Igual en las dos partidas.
-- Deshacer: GRANT EXECUTE ON FUNCTION <cada una> TO anon;

DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('mover_dinero', 'long_rest', 'transferir', 'change_character_money', 'set_mantenimiento_exento')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
