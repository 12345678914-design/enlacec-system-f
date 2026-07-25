-- =========================================================================
-- SCRIPT DE ALIGNACIÓN DE ATRIBUTOS Y REGISTRO DE AUDITORÍA (DOCENTES)
-- =========================================================================
-- Este script permite que la tabla 'teachers' (o 'teacher') posea 
-- exactamente las mismas columnas en español que la tabla principal 'usuarios'.
-- Adicionalmente, implementa un sistema automático de auditoría/logs ('auditoria_docentes')
-- mediante disparadores (triggers) en PostgreSQL/Supabase.
-- =========================================================================

-- Habilitar extensión para generación automática de UUIDs si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. ADAPTACIÓN DE LA TABLA 'teachers' (Añadir atributos en español)
-- =========================================================================
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS apellido TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS edad INTEGER;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS telefono BIGINT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS fecha_vencimiento INTEGER;

-- Asegurar columnas básicas de autenticación/estado en 'teachers'
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'docente123';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS si_pass BOOLEAN DEFAULT false;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS activado BOOLEAN DEFAULT true;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'docente';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- =========================================================================
-- 2. ADAPTACIÓN DE LA TABLA 'teacher' (Caso de uso singular)
-- =========================================================================
-- Por resiliencia en caso de que su base de datos use el nombre singular:
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher') THEN
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS nombre TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS apellido TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS edad INTEGER;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS dni TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS telefono BIGINT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS codigo TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS foto_url TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS fecha_vencimiento INTEGER;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'docente123';
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS si_pass BOOLEAN DEFAULT false;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS activado BOOLEAN DEFAULT true;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'docente';
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
        
        -- Compatibilidad con columnas de inglés en singular
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS subject TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS salary DOUBLE PRECISION;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending';
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS active_courses TEXT[];
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS "activeCourses" TEXT[];
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
        ALTER TABLE teacher ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION;
    END IF;
END $$;

-- =========================================================================
-- 3. CREACIÓN DE LA TABLA DE AUDITORÍA (LOGS DE ACCIÓN DE DOCENTES)
-- =========================================================================
CREATE TABLE IF NOT EXISTS auditoria_docentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    docente_id UUID NOT NULL,
    tabla_afectada TEXT NOT NULL, -- 'usuarios', 'teachers', 'teacher'
    accion TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    nombre_anterior TEXT,
    nombre_nuevo TEXT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_bd TEXT DEFAULT CURRENT_USER,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- 4. FUNCIÓN DISPARADORA (TRIGGER FUNCTION) DE AUDITORÍA
-- =========================================================================
CREATE OR REPLACE FUNCTION registrar_auditoria_docente()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_anterior TEXT;
    v_nombre_nuevo TEXT;
BEGIN
    -- Determinar el nombre representativo (usando columna nombre únicamente)
    IF (TG_OP = 'DELETE') THEN
        v_nombre_anterior := COALESCE(OLD.nombre, '');
    ELSIF (TG_OP = 'UPDATE') THEN
        v_nombre_anterior := COALESCE(OLD.nombre, '');
        v_nombre_nuevo := COALESCE(NEW.nombre, '');
    ELSE -- INSERT
        v_nombre_nuevo := COALESCE(NEW.nombre, '');
    END IF;

    -- Registrar auditoría en base a la operación
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO auditoria_docentes (docente_id, tabla_afectada, accion, nombre_nuevo, datos_nuevos)
        VALUES (NEW.id, TG_TABLE_NAME, 'INSERT', v_nombre_nuevo, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO auditoria_docentes (docente_id, tabla_afectada, accion, nombre_anterior, nombre_nuevo, datos_anteriores, datos_nuevos)
        VALUES (NEW.id, TG_TABLE_NAME, 'UPDATE', v_nombre_anterior, v_nombre_nuevo, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO auditoria_docentes (docente_id, tabla_afectada, accion, nombre_anterior, datos_anteriores)
        VALUES (OLD.id, TG_TABLE_NAME, 'DELETE', v_nombre_anterior, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 5. ASOCIACIÓN DE TRIGGERS A LAS TABLAS DE DOCENTES
-- =========================================================================

-- Trigger para la tabla principal en español 'usuarios'
DROP TRIGGER IF EXISTS trg_auditoria_usuarios ON usuarios;
CREATE TRIGGER trg_auditoria_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_docente();

-- Trigger para la tabla en inglés 'teachers'
DROP TRIGGER IF EXISTS trg_auditoria_teachers ON teachers;
CREATE TRIGGER trg_auditoria_teachers
AFTER INSERT OR UPDATE OR DELETE ON teachers
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_docente();

-- Trigger para la tabla en inglés singular 'teacher' (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_auditoria_teacher ON teacher;';
        EXECUTE 'CREATE TRIGGER trg_auditoria_teacher AFTER INSERT OR UPDATE OR DELETE ON teacher FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_docente();';
    END IF;
END $$;
