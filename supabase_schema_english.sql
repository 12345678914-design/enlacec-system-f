-- ==========================================
-- SUPABASE DATABASE SCHEMA (ENGLISH VERSION)
-- Designed to match the school system architecture
-- with native English table and column names.
-- Includes dual-compatibility columns for resilience.
-- ==========================================

-- Enable extension for automatic UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: teachers (Corresponds to "usuarios" / Teachers & Staff)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    rating DOUBLE PRECISION,
    password TEXT DEFAULT 'docente123',
    si_pass BOOLEAN DEFAULT false,
    activado BOOLEAN DEFAULT true,
    rol TEXT DEFAULT 'docente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    nombre TEXT,
    apellido TEXT,
    edad INTEGER,
    dni TEXT,
    telefono BIGINT,
    codigo TEXT,
    foto_url TEXT,
    fecha_vencimiento INTEGER
);

-- 2. TABLE: students (Corresponds to "estudiantes")
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    nombre TEXT,
    apellido TEXT,
    contacto BIGINT,
    grado INTEGER,
    nivel TEXT,
    observacion TEXT,
    estado BOOLEAN DEFAULT true
);

-- 3. TABLE: categories (Corresponds to "categorias" for resources library)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE: resources (Corresponds to "recursos" for the documents library)
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    type TEXT DEFAULT 'file',
    size INTEGER,
    category TEXT,
    url TEXT,
    parent_id UUID,
    "parentId" UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    nombre TEXT,
    tipo TEXT,
    formato TEXT,
    categoria_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

-- 5. TABLE: courses (Corresponds to "cursos")
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    price DOUBLE PRECISION DEFAULT 0.0,
    
    -- Spanish compatibility columns
    nombre TEXT,
    pago DOUBLE PRECISION DEFAULT 0.0
);

-- 6. TABLE: services (Corresponds to "servicio")
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    duration INTEGER,
    price DOUBLE PRECISION DEFAULT 0.0,

    -- Spanish compatibility columns
    nombre TEXT,
    duracion INTEGER,
    pago DOUBLE PRECISION DEFAULT 0.0
);

-- 7. TABLE: service_courses (Corresponds to "servicio_curso")
CREATE TABLE IF NOT EXISTS service_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

    -- Spanish compatibility columns
    id_servicio UUID,
    id_curso UUID
);

-- 7.5. TABLE: service_teachers (Corresponds to "servicio_profesor")
CREATE TABLE IF NOT EXISTS service_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    id_servicio UUID,
    id_profesor UUID
);

-- 8. TABLE: student_courses (Corresponds to "estudiantes_cursos")
CREATE TABLE IF NOT EXISTS student_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    id_cursos UUID,
    id_estudiante UUID
);

-- 9. TABLE: course_teachers (Corresponds to "curso_profesor")
CREATE TABLE IF NOT EXISTS course_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,

    -- Spanish compatibility columns
    id_curso UUID,
    id_profesor UUID
);

-- 10. TABLE: grades (Corresponds to "notas")
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    numerical_grade INTEGER,
    qualitative_grade TEXT,

    -- Spanish compatibility columns
    id_estudiante UUID,
    id_profesor UUID,
    nota_numerica INTEGER,
    nota_cuantitativa TEXT
);

-- 11. TABLE: specialties (Corresponds to "especialidades")
CREATE TABLE IF NOT EXISTS specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    nombre TEXT
);

-- 12. TABLE: specialty_teachers (Corresponds to "espcialidades_profesor")
CREATE TABLE IF NOT EXISTS specialty_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    id_especialidad UUID,
    id_profesor UUID
);

-- 13. TABLE: history_logs (Corresponds to "historial")
CREATE TABLE IF NOT EXISTS history_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    id_usuario UUID,
    inicio_sesion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 14. TABLE: attendance (Primary English attendance storage table)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    "teacherId" UUID REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name TEXT,
    "teacherName" TEXT,
    course TEXT,
    date TEXT,
    time TEXT,
    students JSONB DEFAULT '[]'::jsonb,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 15. TABLE: attendance_records (Alternative/Fallback English attendance storage table)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    "teacherId" UUID REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_name TEXT,
    "teacherName" TEXT,
    course TEXT,
    date TEXT,
    time TEXT,
    students JSONB DEFAULT '[]'::jsonb,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 16. TABLE: benefits (Corresponds to "prestaciones" for bonuses/payouts)
CREATE TABLE IF NOT EXISTS benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    amount DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    id_profesor UUID,
    nombre TEXT,
    descripcion TEXT,
    monto DOUBLE PRECISION DEFAULT 0.0
);

-- 17. TABLE: recovery (Corresponds to "recuperacion" for security recovery codes)
CREATE TABLE IF NOT EXISTS recovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    code TEXT,
    phone BIGINT,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    id_usuario UUID,
    codigo TEXT,
    telefono BIGINT,
    usado BOOLEAN DEFAULT false
);

-- 18. TABLE: transactions (Corresponds to "movimientos" for school accounting)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT,
    amount DOUBLE PRECISION,
    concept TEXT,
    category TEXT,
    date TEXT,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    "studentId" UUID REFERENCES students(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    "teacherId" UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    nombre TEXT,
    monto DOUBLE PRECISION,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    categoria TEXT
);

-- 19. TABLE: news (Corresponds to "eventos_noticias" for school wall announcements)
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    date TEXT,
    author TEXT DEFAULT 'Administration',
    category TEXT DEFAULT 'academic',
    image_url TEXT,
    "imageUrl" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Spanish compatibility columns
    titulo TEXT,
    descripcion TEXT,
    imagen_url TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo TEXT
);

-- ==========================================
-- IMPORTANT NOTE FOR THE USER:
-- You can copy this English-first schema SQL block
-- and paste it directly into your Supabase SQL Editor
-- to provision English tables. The application supports
-- loading both versions gracefully!
-- ==========================================
