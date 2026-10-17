-- 042: cada jugador solo lee su propio perfil (tarea 55, A). Antes cualquiera con sesión leía los correos
-- de todos. El máster/admin los sigue viendo ("el máster ve todos los perfiles"). La web solo lee el propio.
-- No toca datos. Se puede ejecutar dos veces.
-- Para deshacer: ALTER POLICY profiles_select ON public.profiles USING (auth.uid() IS NOT NULL);

ALTER POLICY profiles_select ON public.profiles USING (auth.uid() = id);
