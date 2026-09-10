-- ==============================================================================
-- Migración 011: Tabla de Reportes y Sugerencias (app_feedback) con Triage IA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.app_feedback (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT,
    character_name TEXT,
    system_metadata JSONB,
    ai_triage JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Permitir a cualquier jugador (autenticado o anónimo) enviar reportes
DROP POLICY IF EXISTS "Allow public insert to app_feedback" ON public.app_feedback;
CREATE POLICY "Allow public insert to app_feedback"
ON public.app_feedback FOR INSERT
WITH CHECK (true);

-- Solo usuarios autenticados / GM pueden consultar los reportes
DROP POLICY IF EXISTS "Allow authenticated read app_feedback" ON public.app_feedback;
CREATE POLICY "Allow authenticated read app_feedback"
ON public.app_feedback FOR SELECT
USING (auth.role() = 'authenticated');
