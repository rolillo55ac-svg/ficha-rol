-- Tabla de reportes y sugerencias (app_feedback)

CREATE TABLE IF NOT EXISTS public.app_feedback (
    id TEXT PRIMARY KEY,
    ticket_code TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT,
    character_name TEXT,
    system_metadata JSONB,
    ai_triage JSONB,
    status TEXT DEFAULT 'pending',
    admin_reply TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agregar columnas en caso de que la tabla ya existiera previamente
ALTER TABLE public.app_feedback ADD COLUMN IF NOT EXISTS ticket_code TEXT;
ALTER TABLE public.app_feedback ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE public.app_feedback ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Habilitar RLS
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Permitir a cualquier jugador enviar reportes
DROP POLICY IF EXISTS "Allow public insert to app_feedback" ON public.app_feedback;
CREATE POLICY "Allow public insert to app_feedback"
ON public.app_feedback FOR INSERT
WITH CHECK (true);

-- Permitir lectura (los jugadores ven sus respuestas y el Administrador gestiona tickets)
DROP POLICY IF EXISTS "Allow read app_feedback" ON public.app_feedback;
DROP POLICY IF EXISTS "Allow authenticated read app_feedback" ON public.app_feedback;
CREATE POLICY "Allow read app_feedback"
ON public.app_feedback FOR SELECT
USING (true);

-- Permitir actualización de estado y respuesta por parte del Administrador
DROP POLICY IF EXISTS "Allow update app_feedback" ON public.app_feedback;
CREATE POLICY "Allow update app_feedback"
ON public.app_feedback FOR UPDATE
USING (true);
