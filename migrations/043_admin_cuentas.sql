-- 043: panel Admin › Jugadores (tarea 55, B). Dos funciones que solo responden al admin (es_admin()):
--   * admin_listar_cuentas(): cuentas con su rol y sus fichas. Si están desactivadas y la última entrada
--     las da la función admin-usuarios (acción "estado"): aquí no se lee el esquema auth.
--   * admin_cambiar_rol(usuario, rol): jugador <-> máster de OTRA cuenta. No toca is_admin y no deja
--     cambiarse a uno mismo ni tocar otra cuenta de admin.
-- Crear cuentas, contraseñas y desactivar van por la función del servidor admin-usuarios.
-- No toca datos. Se puede ejecutar dos veces.
-- Para deshacer:
--   DROP FUNCTION IF EXISTS public.admin_listar_cuentas();
--   DROP FUNCTION IF EXISTS public.admin_cambiar_rol(uuid, text);

CREATE OR REPLACE FUNCTION public.admin_listar_cuentas()
RETURNS TABLE (id uuid, email text, display_name text, role text, is_admin boolean, fichas text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo el admin' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT p.id, p.email, p.display_name, p.role, p.is_admin,
           (SELECT string_agg(c.name, ', ' ORDER BY c.name) FROM public.characters c WHERE c.owner_id = p.id)
    FROM public.profiles p
    ORDER BY p.is_admin DESC, p.role, lower(coalesce(p.display_name, p.email));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_cambiar_rol(p_user uuid, p_rol text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo el admin' USING ERRCODE = '42501';
  END IF;
  IF p_rol NOT IN ('player', 'gm') THEN
    RAISE EXCEPTION 'Rol no válido' USING ERRCODE = '22023';
  END IF;
  IF p_user = auth.uid() THEN
    RAISE EXCEPTION 'No puedes cambiar tu propio rol' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user AND is_admin) THEN
    RAISE EXCEPTION 'Las cuentas de admin no se cambian desde aquí' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles SET role = p_rol WHERE id = p_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta no encontrada' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_listar_cuentas() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_cambiar_rol(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_cuentas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cambiar_rol(uuid, text) TO authenticated;
