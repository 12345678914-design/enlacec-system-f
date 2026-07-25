-- =========================================================================
-- SCRIPT DE CREACIÓN Y CONFIGURACIÓN DE RLS PARA 'servicio_profesor'
-- =========================================================================
-- Este script soluciona el problema de no poder desvincular o retirar a un
-- docente de un servicio debido a restricciones de Row Level Security (RLS)
-- o a la falta de la tabla/políticas en tu base de datos de Supabase.
-- =========================================================================

-- 1. CREACIÓN DE LA TABLA 'servicio_profesor' (Si no existiera)
CREATE TABLE IF NOT EXISTS public.servicio_profesor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio UUID REFERENCES public.servicio(id) ON DELETE CASCADE,
    id_profesor UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. HABILITAR SEGURIDAD A NIVEL DE FILAS (RLS)
-- Supabase habilita RLS por defecto en las tablas nuevas. Si no creamos políticas,
-- se bloquean todas las inserciones, lecturas y borrados desde el cliente.
ALTER TABLE public.servicio_profesor ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS DE ACCESO PÚBLICO (Para evitar bloqueos con la clave anon/authenticated)

-- Política para permitir lectura (SELECT)
DROP POLICY IF EXISTS "Permitir lectura publica de servicio_profesor" ON public.servicio_profesor;
CREATE POLICY "Permitir lectura publica de servicio_profesor" 
ON public.servicio_profesor FOR SELECT 
TO public, anon, authenticated
USING (true);

-- Política para permitir inserción (INSERT)
DROP POLICY IF EXISTS "Permitir insercion publica de servicio_profesor" ON public.servicio_profesor;
CREATE POLICY "Permitir insercion publica de servicio_profesor" 
ON public.servicio_profesor FOR INSERT 
TO public, anon, authenticated
WITH CHECK (true);

-- Política para permitir actualización (UPDATE)
DROP POLICY IF EXISTS "Permitir actualizacion publica de servicio_profesor" ON public.servicio_profesor;
CREATE POLICY "Permitir actualizacion publica de servicio_profesor" 
ON public.servicio_profesor FOR UPDATE 
TO public, anon, authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir borrado/eliminación (DELETE) - ESENCIAL PARA RETIRAR DOCENTES
DROP POLICY IF EXISTS "Permitir eliminacion publica de servicio_profesor" ON public.servicio_profesor;
CREATE POLICY "Permitir eliminacion publica de servicio_profesor" 
ON public.servicio_profesor FOR DELETE 
TO public, anon, authenticated
USING (true);


-- =========================================================================
-- SOLUCIÓN ALTERNATIVA RÁPIDA (SI NO DESEAS USAR RLS EN ESTA TABLA):
-- =========================================================================
-- Si prefieres que la tabla no tenga ninguna restricción de políticas de seguridad
-- y que cualquier llamada de Supabase Client pueda leer/escribir libremente,
-- simplemente descomenta la línea de abajo y ejecútala en tu editor de SQL:
--
-- ALTER TABLE public.servicio_profesor DISABLE ROW LEVEL SECURITY;
-- =========================================================================


-- =========================================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- =========================================================================
-- 1. Copia todo el contenido de este script SQL.
-- 2. Ve a tu Supabase Dashboard (https://supabase.com) e ingresa a tu proyecto.
-- 3. Haz clic en la pestaña "SQL Editor" en la barra lateral izquierda.
-- 4. Haz clic en "New query" (Nueva consulta) para abrir un editor en blanco.
-- 5. Pega este código en el editor.
-- 6. Haz clic en el botón "Run" (o presiona Cmd + Enter / Ctrl + Enter).
-- 7. Recarga la aplicación y prueba retirar al docente nuevamente. ¡Listo!
-- =========================================================================
