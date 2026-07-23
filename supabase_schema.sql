-- ==========================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS SUPABASE
-- Diseñado para coincidir exactamente con el esquema de la imagen
-- e incluye columnas de compatibilidad para la aplicación.
-- ==========================================

-- Habilitar extensión para generación automática de UUIDs si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: usuarios (Profesores y Personal)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    apellido TEXT,
    edad INTEGER,
    dni TEXT,
    telefono BIGINT,
    codigo TEXT,
    foto_url TEXT,
    fecha_vencimiento INTEGER,
    password TEXT DEFAULT 'docente123',
    si_pass BOOLEAN DEFAULT false,
    activado BOOLEAN DEFAULT true,
    rol TEXT DEFAULT 'docente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Columnas de compatibilidad en inglés
    name TEXT,
    email TEXT,
    subject TEXT,
    phone TEXT,
    salary DOUBLE PRECISION,
    payment_status TEXT DEFAULT 'pending',
    "paymentStatus" TEXT DEFAULT 'pending',
    active_courses TEXT[],
    "activeCourses" TEXT[],
    avatar_url TEXT,
    "avatarUrl" TEXT,
    rating DOUBLE PRECISION
);

-- 2. TABLA: estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    apellido TEXT,
    contacto BIGINT,
    grado INTEGER,
    nivel TEXT,
    observacion TEXT,
    estado BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Columnas de compatibilidad en inglés
    name TEXT,
    email TEXT,
    grade TEXT,
    section TEXT DEFAULT 'A',
    parent_name TEXT,
    "parentName" TEXT,
    parent_phone TEXT,
    "parentPhone" TEXT,
    balance DOUBLE PRECISION DEFAULT 0.0,
    grades JSONB DEFAULT '[]'::jsonb,
    attendance_rate DOUBLE PRECISION DEFAULT 95.0,
    "attendanceRate" DOUBLE PRECISION DEFAULT 95.0,
    avatar_url TEXT,
    "avatarUrl" TEXT,
    status TEXT DEFAULT 'active'
);

-- 3. TABLA: categorias (Para recursos/biblioteca)
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA: recursos (Archivos y carpetas de la biblioteca)
CREATE TABLE IF NOT EXISTS recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    url TEXT,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    tipo TEXT DEFAULT 'file',
    formato TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Columnas de compatibilidad en inglés
    name TEXT,
    type TEXT,
    size INTEGER,
    category TEXT,
    parent_id UUID,
    "parentId" UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA: cursos
CREATE TABLE IF NOT EXISTS cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    descripcion TEXT,
    pago DOUBLE PRECISION DEFAULT 0.0
);

-- 6. TABLA: servicio
CREATE TABLE IF NOT EXISTS servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    nombre TEXT DEFAULT NULL,
    descripcion TEXT DEFAULT NULL,
    duracion INTEGER DEFAULT NULL,
    pago REAL DEFAULT NULL
);

-- 7. TABLA: servicio_curso
CREATE TABLE IF NOT EXISTS servicio_curso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio UUID REFERENCES servicio(id) ON DELETE CASCADE,
    id_curso UUID REFERENCES cursos(id) ON DELETE CASCADE
);

-- 7.5. TABLA: servicio_profesor (Relación de Servicios y Profesores)
CREATE TABLE IF NOT EXISTS servicio_profesor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio UUID REFERENCES servicio(id) ON DELETE CASCADE,
    id_profesor UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TABLA: estudiantes_cursos
CREATE TABLE IF NOT EXISTS estudiantes_cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cursos UUID REFERENCES cursos(id) ON DELETE CASCADE,
    id_estudiante UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    duracion INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. TABLA: curso_profesor
CREATE TABLE IF NOT EXISTS curso_profesor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_curso UUID REFERENCES cursos(id) ON DELETE CASCADE,
    id_profesor UUID REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 10. TABLA: notas
CREATE TABLE IF NOT EXISTS notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    id_estudiante UUID DEFAULT gen_random_uuid() REFERENCES estudiantes(id) ON DELETE CASCADE,
    id_profesor UUID DEFAULT gen_random_uuid() REFERENCES usuarios(id) ON DELETE CASCADE,
    id_curso UUID REFERENCES cursos(id) ON DELETE CASCADE,
    nota_numerica INTEGER, -- int2 NULL, Rango de 1 al 20
    nota_cuantitativa TEXT -- text, Cualitativa (BAJO, MAL, MAS O MENOS, BIEN, EXCELENTE, o personalizada)
);

-- 11. TABLA: especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. TABLA: espcialidades_profesor (Nótese el nombre de tabla con la tipografía de la imagen)
CREATE TABLE IF NOT EXISTS espcialidades_profesor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_especialidad UUID REFERENCES especialidades(id) ON DELETE CASCADE,
    id_profesor UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. TABLA: historial
CREATE TABLE IF NOT EXISTS historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    inicio_sesion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 14. TABLA: sesiones (Asistencia / Clases dictadas)
CREATE TABLE IF NOT EXISTS sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_profesor UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    inicio TIME,
    fin TIME,
    tema TEXT
);

-- 15. TABLA: asistencia_estudiantes
CREATE TABLE IF NOT EXISTS asistencia_estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sesion UUID REFERENCES sesiones(id) ON DELETE CASCADE,
    id_estudiante UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    estado VARCHAR(10), -- 'P' (Presente), 'F' (Falta), etc.
    observacion TEXT
);

-- 16. TABLA: prestaciones
CREATE TABLE IF NOT EXISTS prestaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_profesor UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre TEXT,
    descripcion TEXT,
    monto DOUBLE PRECISION DEFAULT 0.0
);

-- 17. TABLA: recuperacion
CREATE TABLE IF NOT EXISTS recuperacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo TEXT,
    telefono BIGINT,
    usado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 18. TABLA: movimientos (Caja Chica / Finanzas)
CREATE TABLE IF NOT EXISTS movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    monto DOUBLE PRECISION,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    categoria TEXT,
    
    -- Columnas de compatibilidad en inglés
    type TEXT,
    amount DOUBLE PRECISION,
    concept TEXT,
    category TEXT,
    date TEXT,
    student_id UUID,
    "studentId" UUID,
    teacher_id UUID,
    "teacherId" UUID
);

-- 19. TABLA: eventos_noticias (Muro de Comunicados)
CREATE TABLE IF NOT EXISTS eventos_noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT,
    descripcion TEXT,
    imagen_url TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo TEXT,
    
    -- Columnas de compatibilidad en inglés
    title TEXT,
    content TEXT,
    date TEXT,
    author TEXT,
    category TEXT,
    image_url TEXT,
    "imageUrl" TEXT
);

-- 20. TABLA: facturas (Bóveda de Facturas y Comprobantes)
CREATE TABLE IF NOT EXISTS facturas (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    tipo TEXT NOT NULL CHECK (tipo IN ('estudiante', 'profesor')),
    student_id UUID REFERENCES estudiantes(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    monto DOUBLE PRECISION NOT NULL,
    concepto TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('emitida', 'pagada', 'anulada')) DEFAULT 'emitida',
    pdf_url TEXT,
    detalles JSONB DEFAULT '{}'::jsonb
);

-- ==========================================
-- NOTA IMPORTANTE PARA EL USUARIO:
-- Puedes copiar todo este bloque de código SQL
-- y pegarlo directamente en el SQL Editor de tu
-- panel de Supabase para crear todas tus tablas
-- perfectamente configuradas.
-- ==========================================
