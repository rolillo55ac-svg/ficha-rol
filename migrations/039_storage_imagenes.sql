-- 039: fotos y sonidos subidos (bucket images), tarea 55 versión A. LO PEGA CHEMO en el SQL Editor de
-- Krysalis y de Venda2 (la herramienta no puede tocar el esquema storage).
-- - Solo se aceptan imágenes y audio, como mucho 15 MB (los sonidos de personaje llegan a 15 MB;
--   las fotos ya se comprimen en el navegador a JPG pequeño).
-- - Subir: solo con sesión. Cambiar o borrar: solo quien lo subió (o el admin). Leer sigue siendo
--   público porque las fotos se ven con su enlace directo.
-- No borra archivos. Se puede ejecutar dos veces. Para deshacer:
--   UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL WHERE id = 'images';
--   DROP POLICY IF EXISTS "imagenes: cambia quien subio" ON storage.objects;
--   DROP POLICY IF EXISTS "imagenes: borra quien subio" ON storage.objects;
--   CREATE POLICY "Permitir actualizar imagenes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images');

UPDATE storage.buckets
   SET file_size_limit = 15 * 1024 * 1024,
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                                  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
                                  'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/flac', 'audio/webm']
 WHERE id = 'images';

DROP POLICY IF EXISTS "Permitir subida de imagenes" ON storage.objects;
CREATE POLICY "Permitir subida de imagenes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images' AND auth.uid() IS NOT NULL);

-- Antes cualquiera con sesión podía sobrescribir cualquier archivo
DROP POLICY IF EXISTS "Permitir actualizar imagenes" ON storage.objects;
DROP POLICY IF EXISTS "imagenes: cambia quien subio" ON storage.objects;
CREATE POLICY "imagenes: cambia quien subio" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'images' AND (owner_id = auth.uid()::text OR public.es_admin()))
  WITH CHECK (bucket_id = 'images' AND (owner_id = auth.uid()::text OR public.es_admin()));

DROP POLICY IF EXISTS "imagenes: borra quien subio" ON storage.objects;
CREATE POLICY "imagenes: borra quien subio" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND (owner_id = auth.uid()::text OR public.es_admin()));

-- Para revisar: todas las reglas de storage.objects. Si sale alguna más de escritura (INSERT, UPDATE,
-- DELETE o ALL) que no sea de las de arriba, avisa antes de borrarla.
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
