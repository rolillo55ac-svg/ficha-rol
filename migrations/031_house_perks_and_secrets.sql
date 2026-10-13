-- 031: Mejoras de La Casa editables por el máster y panel secreto del máster. Solo añade; no toca datos existentes.
--  1. Tabla house_perks: las mejoras que ven todos (icono, nombre, descripción, orden). No se borran: se archivan (archived = true).
--     Antes estaban escritas en js/house.js (Daga y Buen camino); se rellenan aquí para cada casa que aún no tenga ninguna.
--     RLS: leer cualquiera con sesión; crear y cambiar solo el máster (is_gm()). Nadie la borra.
--  2. Tabla house_secrets: datos que solo ve el máster. id = 'house:<house_id>' (vida y notas de la casa)
--     o 'perk:<perk_id>' (estadísticas secretas y notas de una mejora). data es jsonb.
--     RLS: solo el máster la lee, la crea y la cambia. Nadie la borra. Sin acceso para anon.
-- Se puede ejecutar dos veces sin problema.
--
-- DESHACER (a mano, en el SQL Editor; antes, git revert del cliente):
--   DROP TABLE IF EXISTS public.house_secrets;
--   DROP TABLE IF EXISTS public.house_perks;

CREATE TABLE IF NOT EXISTS public.house_perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id text NOT NULL REFERENCES public.house(id),
  icon text NOT NULL DEFAULT '✨',
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS house_perks_house_idx ON public.house_perks (house_id, sort_order);

CREATE TABLE IF NOT EXISTS public.house_secrets (
  id text PRIMARY KEY,
  house_id text NOT NULL REFERENCES public.house(id),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.house_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mejoras casa: leer con sesión" ON public.house_perks;
CREATE POLICY "mejoras casa: leer con sesión" ON public.house_perks
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "mejoras casa: el máster crea" ON public.house_perks;
CREATE POLICY "mejoras casa: el máster crea" ON public.house_perks
  FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "mejoras casa: el máster cambia" ON public.house_perks;
CREATE POLICY "mejoras casa: el máster cambia" ON public.house_perks
  FOR UPDATE TO authenticated USING (public.is_gm()) WITH CHECK (public.is_gm());

DROP POLICY IF EXISTS "secretos casa: solo el máster lee" ON public.house_secrets;
CREATE POLICY "secretos casa: solo el máster lee" ON public.house_secrets
  FOR SELECT TO authenticated USING (public.is_gm());
DROP POLICY IF EXISTS "secretos casa: solo el máster crea" ON public.house_secrets;
CREATE POLICY "secretos casa: solo el máster crea" ON public.house_secrets
  FOR INSERT TO authenticated WITH CHECK (public.is_gm());
DROP POLICY IF EXISTS "secretos casa: solo el máster cambia" ON public.house_secrets;
CREATE POLICY "secretos casa: solo el máster cambia" ON public.house_secrets
  FOR UPDATE TO authenticated USING (public.is_gm()) WITH CHECK (public.is_gm());

REVOKE ALL ON public.house_perks FROM anon;
REVOKE ALL ON public.house_secrets FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.house_perks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.house_secrets TO authenticated;

INSERT INTO public.house_perks (house_id, icon, name, description, sort_order)
SELECT h.id, v.icon, v.name, v.description, v.sort_order
FROM public.house h
CROSS JOIN (VALUES
  ('🗡️', 'Daga', 'Una daga que defiende la casa.', 1),
  ('🧭', 'Buen camino', 'Al andar, la casa sabe por dónde ir para hacerse menos daño.', 2)
) AS v(icon, name, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.house_perks p WHERE p.house_id = h.id);
