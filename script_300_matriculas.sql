-- ==============================================================================
-- SCRIPT SQL: 300 MATRÍCULAS DISTRIBUIDAS DE ENERO A NOVIEMBRE
-- Servicio: 'PREPARACION DE INGRESO' (S/. 300.00 | 200 min)
-- Cursos Vinculados: ALGEBRA, ARITMETICA, FISICA
-- Docente Asignado: Prof. enrique gonzales
-- ==============================================================================
-- 
-- COMPATIBILIDAD TOTAL:
-- Este script utiliza EXCLUSIVAMENTE las columnas estándar en español de tu tabla:
--   'estudiantes' (id, nombre, apellido, contacto, grado, nivel, observacion, estado, created_at)
--   'movimientos' (nombre, monto, fecha, categoria)
--   'facturas'    (id, created_at, tipo, student_id, monto, concepto, estado, detalles)
--   'servicio_estudiante' (id_servicio, id_estudiante, created_at)
-- 
-- De esta forma NUNCA falla por columnas en inglés inexistentes como 'name', 'grade', etc.
-- ==============================================================================

-- 1. Asegurar extensiones de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Asegurar columnas opcionales en 'estudiantes' solo si no existen
ALTER TABLE IF EXISTS public.estudiantes ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE IF EXISTS public.estudiantes ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS public.estudiantes ADD COLUMN IF NOT EXISTS servicio_id UUID;

-- 2.1 Asegurar tablas de asistencia y columnas necesarias
CREATE TABLE IF NOT EXISTS public.sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    id_profesor UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    inicio TIME,
    fin TIME,
    tema TEXT DEFAULT NULL,
    monto NUMERIC DEFAULT 0
);

ALTER TABLE IF EXISTS public.sesiones ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE IF EXISTS public.sesiones ADD COLUMN IF NOT EXISTS curso_nombre TEXT;
ALTER TABLE IF EXISTS public.sesiones ADD COLUMN IF NOT EXISTS id_curso UUID;
ALTER TABLE IF EXISTS public.sesiones ADD COLUMN IF NOT EXISTS cantidad_sesiones INT DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.asistencia_estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    id_sesion UUID REFERENCES sesiones(id) ON DELETE CASCADE,
    id_estudiante UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    estado BOOLEAN DEFAULT true,
    observacion TEXT DEFAULT 'Presente'
);

-- 3. Asegurar catálogo de Cursos y Servicio según requerimientos institucionales
DO $$
DECLARE
    v_prof_id UUID;
    v_serv_id UUID;
    v_cur_alg UUID;
    v_cur_ari UUID;
    v_cur_fis UUID;
    v_cur_rm UUID;
    v_cur_rv UUID;
    v_cur_qui UUID;
    v_cur_lit UUID;
BEGIN
    RAISE NOTICE '🔧 Verificando cursos y servicios base...';

    -- Insertar Cursos solicitados si no existen
    -- 1 RAZONAMIENTO MATEMATICO (S/. 20.00)
    SELECT id INTO v_cur_rm FROM cursos WHERE UPPER(nombre) LIKE '%RAZONAMIENTO MATEMATICO%' LIMIT 1;
    IF v_cur_rm IS NULL THEN
        INSERT INTO cursos (nombre, descripcion, pago) 
        VALUES ('RAZONAMIENTO MATEMATICO', 'Sin descripción', 20.00) RETURNING id INTO v_cur_rm;
    END IF;

    -- 2 RAZONAMIENTO VERBAL (S/. 20.00)
    SELECT id INTO v_cur_rv FROM cursos WHERE UPPER(nombre) LIKE '%RAZONAMIENTO VERBAL%' LIMIT 1;
    IF v_cur_rv IS NULL THEN
        INSERT INTO cursos (nombre, descripcion, pago) 
        VALUES ('RAZONAMIENTO VERBAL', 'Sin descripción', 20.00) RETURNING id INTO v_cur_rv;
    END IF;

    -- 3 ALGEBRA (S/. 25.00)
    SELECT id INTO v_cur_alg FROM cursos WHERE UPPER(nombre) LIKE '%ALGEBRA%' LIMIT 1;
    IF v_cur_alg IS NULL THEN
        INSERT INTO cursos (nombre, descripcion, pago) 
        VALUES ('ALGEBRA', 'Sin descripción', 25.00) RETURNING id INTO v_cur_alg;
    END IF;

    -- 4 ARITMETICA (S/. 25.00)
    SELECT id INTO v_cur_ari FROM cursos WHERE UPPER(nombre) LIKE '%ARITMETICA%' LIMIT 1;
    IF v_cur_ari IS NULL THEN
        INSERT INTO cursos (nombre, descripcion, pago) 
        VALUES ('ARITMETICA', 'Sin descripción', 25.00) RETURNING id INTO v_cur_ari;
    END IF;

    -- 5 FISICA (S/. 30.00)
    SELECT id INTO v_cur_fis FROM cursos WHERE UPPER(nombre) LIKE '%FISICA%' LIMIT 1;
    IF v_cur_fis IS NULL THEN
        INSERT INTO cursos (nombre, descripcion, pago) 
        VALUES ('FISICA', 'Sin descripción', 30.00) RETURNING id INTO v_cur_fis;
    END IF;

    -- 6 QUIMICA (S/. 30.00)
    SELECT id INTO v_cur_qui FROM cursos WHERE UPPER(nombre) LIKE '%QUIMICA%' LIMIT 1;
    IF v_cur_qui IS NULL THEN
        INSERT INTO cursos (nombre, descripcion, pago) 
        VALUES ('QUIMICA', 'Sin descripción', 30.00) RETURNING id INTO v_cur_qui;
    END IF;

    -- 7 LITERATURA (S/. 25.00)
    SELECT id INTO v_cur_lit FROM cursos WHERE UPPER(nombre) LIKE '%LITERATURA%' LIMIT 1;
    IF v_cur_lit IS NULL THEN
        INSERT INTO cursos (nombre, descripcion, pago) 
        VALUES ('LITERATURA', 'Sin descripción', 25.00) RETURNING id INTO v_cur_lit;
    END IF;

    -- Docente: Prof. enrique gonzales
    SELECT id INTO v_prof_id FROM usuarios WHERE UPPER(nombre) LIKE '%ENRIQUE%' AND UPPER(apellido) LIKE '%GONZALES%' LIMIT 1;
    IF v_prof_id IS NULL THEN
        INSERT INTO usuarios (
            nombre, apellido, edad, dni, telefono, codigo, foto_url, fecha_vencimiento,
            password, si_pass, activado, rol
        ) VALUES (
            'Enrique', 'Gonzales', 38, 'DNI74892145', 987654321, 'DOC-004',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
            2029, 'docente123', false, true, 'docente'
        ) RETURNING id INTO v_prof_id;
        RAISE NOTICE '👨‍🏫 Docente creado: Prof. Enrique Gonzales (ID: %)', v_prof_id;
    END IF;

    -- Servicio: PREPARACION DE INGRESO (200 min | S/. 300.00)
    SELECT id INTO v_serv_id FROM servicio WHERE UPPER(nombre) LIKE '%PREPARACION DE INGRESO%' LIMIT 1;
    IF v_serv_id IS NULL THEN
        INSERT INTO servicio (nombre, descripcion, duracion, pago)
        VALUES (
            'PREPARACION DE INGRESO',
            'Sin descripción detallada.',
            200,
            300.00
        ) RETURNING id INTO v_serv_id;
        RAISE NOTICE '📦 Servicio creado: PREPARACION DE INGRESO (ID: %)', v_serv_id;
    END IF;

    -- Vincular Cursos al Servicio (ALGEBRA, ARITMETICA, FISICA)
    IF NOT EXISTS (SELECT 1 FROM servicio_curso WHERE id_servicio = v_serv_id AND id_curso = v_cur_alg) THEN
        INSERT INTO servicio_curso (id_servicio, id_curso) VALUES (v_serv_id, v_cur_alg);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM servicio_curso WHERE id_servicio = v_serv_id AND id_curso = v_cur_ari) THEN
        INSERT INTO servicio_curso (id_servicio, id_curso) VALUES (v_serv_id, v_cur_ari);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM servicio_curso WHERE id_servicio = v_serv_id AND id_curso = v_cur_fis) THEN
        INSERT INTO servicio_curso (id_servicio, id_curso) VALUES (v_serv_id, v_cur_fis);
    END IF;

    -- Asignar Docente al Servicio (Prof. Enrique Gonzales)
    IF NOT EXISTS (SELECT 1 FROM servicio_profesor WHERE id_servicio = v_serv_id AND id_profesor = v_prof_id) THEN
        INSERT INTO servicio_profesor (id_servicio, id_profesor) VALUES (v_serv_id, v_prof_id);
    END IF;

    RAISE NOTICE '✅ Configuración base lista. Procediendo a insertar 300 matrículas...';
END $$;

-- ==============================================================================
-- 4. INSERCIÓN MASIVA DE LOS 300 ESTUDIANTES Y SUS MATRÍCULAS
-- ==============================================================================
DO $$
DECLARE
    v_service_id UUID;
    v_has_dni_col BOOLEAN;
    v_has_avatar_col BOOLEAN;
    v_has_servicio_id_col BOOLEAN;
    v_exists_est_serv BOOLEAN;
    v_exists_serv_est BOOLEAN;
    v_exists_movimientos BOOLEAN;
    v_exists_facturas BOOLEAN;
BEGIN
    SELECT id INTO v_service_id FROM servicio WHERE UPPER(nombre) LIKE '%PREPARACION DE INGRESO%' LIMIT 1;
    IF v_service_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el servicio PREPARACION DE INGRESO';
    END IF;

    -- Detectar columnas y tablas existentes
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudiantes' AND column_name = 'dni') INTO v_has_dni_col;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudiantes' AND column_name = 'avatar_url') INTO v_has_avatar_col;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudiantes' AND column_name = 'servicio_id') INTO v_has_servicio_id_col;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudiantes_servicios') INTO v_exists_est_serv;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'servicio_estudiante') INTO v_exists_serv_est;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'movimientos') INTO v_exists_movimientos;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'facturas') INTO v_exists_facturas;

    RAISE NOTICE '🚀 Insertando lote de 300 matrículas de Enero a Noviembre...';

    -- Tabla temporal con los datos
    CREATE TEMP TABLE IF NOT EXISTS tmp_matriculas_batch (
        idx INT,
        id UUID,
        nombre TEXT,
        apellido TEXT,
        name TEXT,
        dni TEXT,
        contacto BIGINT,
        grado INT,
        nivel TEXT,
        avatar_url TEXT,
        mes_num INT,
        mes_nombre TEXT,
        created_at TIMESTAMPTZ,
        date_str TEXT,
        factura_id TEXT,
        monto NUMERIC
    ) ON COMMIT DROP;

    TRUNCATE tmp_matriculas_batch;
    INSERT INTO tmp_matriculas_batch VALUES        (1, '8ec6e6f4-96f7-4fde-abce-5440062f903f'::UUID, 'Joaquin', 'Campos Diaz', 'Joaquin Campos Diaz', '88299464', 921668732, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/65.jpg', 1, 'Enero', '2026-01-01 08:47:17-05'::TIMESTAMPTZ, '2026-01-01', 'B001-000001', 300.0),
        (2, '6f5a1728-bef2-49a2-aeda-f346ea2b4d7c'::UUID, 'Claudia', 'Huaman Mendoza', 'Claudia Huaman Mendoza', '85072954', 989089901, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/44.jpg', 1, 'Enero', '2026-01-02 16:12:45-05'::TIMESTAMPTZ, '2026-01-02', 'B001-000002', 300.0),
        (3, '3d2744f7-4865-4f93-8429-000230d72794'::UUID, 'Bruno', 'Diaz Silva', 'Bruno Diaz Silva', '81541238', 991030736, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/11.jpg', 1, 'Enero', '2026-01-03 11:48:21-05'::TIMESTAMPTZ, '2026-01-03', 'B001-000003', 300.0),
        (4, 'f9ae00e9-0be0-4513-8786-f77b906329f6'::UUID, 'Lucas', 'Acosta Garcia', 'Lucas Acosta Garcia', '71537611', 998753260, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/49.jpg', 1, 'Enero', '2026-01-04 17:56:55-05'::TIMESTAMPTZ, '2026-01-04', 'B001-000004', 300.0),
        (5, 'bf506399-6c66-411f-81d4-3d1f26d7ce02'::UUID, 'Victor', 'Castro Palacios', 'Victor Castro Palacios', '72395870', 991756179, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/35.jpg', 1, 'Enero', '2026-01-04 13:10:23-05'::TIMESTAMPTZ, '2026-01-04', 'B001-000005', 300.0),
        (6, '1805478c-e7c8-42c7-a631-5614e93f1f77'::UUID, 'Leonardo', 'Mendoza Pacheco', 'Leonardo Mendoza Pacheco', '71077105', 952339391, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/28.jpg', 1, 'Enero', '2026-01-06 16:14:43-05'::TIMESTAMPTZ, '2026-01-06', 'B001-000006', 300.0),
        (7, '843ce75e-85ed-4e9a-bd31-cb7a24a939df'::UUID, 'Maria', 'Castillo Lopez', 'Maria Castillo Lopez', '78275445', 985345555, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/47.jpg', 1, 'Enero', '2026-01-07 14:56:58-05'::TIMESTAMPTZ, '2026-01-07', 'B001-000007', 300.0),
        (8, '736c7cbc-ba26-4763-9837-e7e6b83a5f30'::UUID, 'Leonardo', 'Ochoa Torres', 'Leonardo Ochoa Torres', '75128503', 994214382, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/60.jpg', 1, 'Enero', '2026-01-07 10:32:31-05'::TIMESTAMPTZ, '2026-01-07', 'B001-000008', 300.0),
        (9, '4a2292ee-1208-4ec4-be69-ffd1f61551d9'::UUID, 'Martina', 'Bravo Benitez', 'Martina Bravo Benitez', '78953167', 996028436, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/93.jpg', 1, 'Enero', '2026-01-08 16:55:00-05'::TIMESTAMPTZ, '2026-01-08', 'B001-000009', 300.0),
        (10, '909bd9f1-21fa-4a6f-bc8d-e6f9510a87e5'::UUID, 'Diego', 'Ochoa Fernandez', 'Diego Ochoa Fernandez', '80014145', 995758349, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/70.jpg', 1, 'Enero', '2026-01-10 12:32:48-05'::TIMESTAMPTZ, '2026-01-10', 'B001-000010', 300.0),
        (11, '10f62d57-034a-436a-9331-e71b6e816972'::UUID, 'Flavia', 'Flores Torres', 'Flavia Flores Torres', '82179613', 951273847, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/94.jpg', 1, 'Enero', '2026-01-11 16:58:00-05'::TIMESTAMPTZ, '2026-01-11', 'B001-000011', 300.0),
        (12, '4d2c01d1-8638-4b78-ac58-5aaee9f7fce5'::UUID, 'Victoria', 'Soto Salazar', 'Victoria Soto Salazar', '88448347', 932162965, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/97.jpg', 1, 'Enero', '2026-01-11 09:48:34-05'::TIMESTAMPTZ, '2026-01-11', 'B001-000012', 300.0),
        (13, 'b97bfcf5-c51b-427c-b61b-0b083cb3a692'::UUID, 'Victor', 'Villegas Herrera', 'Victor Villegas Herrera', '84700199', 979467853, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/76.jpg', 1, 'Enero', '2026-01-12 11:45:19-05'::TIMESTAMPTZ, '2026-01-12', 'B001-000013', 300.0),
        (14, '92945634-2235-43cc-9f61-376ed5e1f690'::UUID, 'Eduardo', 'Sanchez Mendoza', 'Eduardo Sanchez Mendoza', '72261579', 914216175, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/28.jpg', 1, 'Enero', '2026-01-13 17:14:00-05'::TIMESTAMPTZ, '2026-01-13', 'B001-000014', 300.0),
        (15, '8c10ba6e-8ae8-49b5-b08b-b45e63554f05'::UUID, 'Esteban', 'Montero Huaman', 'Esteban Montero Huaman', '76389096', 922660194, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/87.jpg', 1, 'Enero', '2026-01-14 17:36:30-05'::TIMESTAMPTZ, '2026-01-14', 'B001-000015', 300.0),
        (16, '8b4bf576-d41d-4d74-8f30-e3b6d0258aba'::UUID, 'Emma', 'Espinoza Vasquez', 'Emma Espinoza Vasquez', '76382351', 981979055, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/10.jpg', 1, 'Enero', '2026-01-15 09:03:25-05'::TIMESTAMPTZ, '2026-01-15', 'B001-000016', 300.0),
        (17, '497f535f-9186-4a53-bb68-18cc40ab8fdb'::UUID, 'Claudia', 'Lozano Quispe', 'Claudia Lozano Quispe', '73129379', 941726318, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/8.jpg', 1, 'Enero', '2026-01-15 16:06:03-05'::TIMESTAMPTZ, '2026-01-15', 'B001-000017', 300.0),
        (18, 'f4ab2cad-bc54-4c10-8ab1-27babdf84831'::UUID, 'Gabriela', 'Vargas Mamani', 'Gabriela Vargas Mamani', '88648490', 998834863, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/95.jpg', 1, 'Enero', '2026-01-16 08:24:16-05'::TIMESTAMPTZ, '2026-01-16', 'B001-000018', 300.0),
        (19, '77e9fb15-5f6e-428c-a7d7-5b83468eeee6'::UUID, 'Patricia', 'Montes Vega', 'Patricia Montes Vega', '75282565', 917634247, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/87.jpg', 1, 'Enero', '2026-01-17 13:03:03-05'::TIMESTAMPTZ, '2026-01-17', 'B001-000019', 300.0),
        (20, 'c456b564-0fb8-4435-b22b-d63a97ba9c5e'::UUID, 'Rocio', 'Cruz Rodriguez', 'Rocio Cruz Rodriguez', '72750906', 966267415, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/92.jpg', 1, 'Enero', '2026-01-18 14:07:56-05'::TIMESTAMPTZ, '2026-01-18', 'B001-000020', 300.0),
        (21, 'c6fda474-f72f-4572-936d-6dbc74170f66'::UUID, 'Andrea', 'Paredes Gutierrez', 'Andrea Paredes Gutierrez', '72434143', 911250299, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/28.jpg', 1, 'Enero', '2026-01-19 12:25:08-05'::TIMESTAMPTZ, '2026-01-19', 'B001-000021', 300.0),
        (22, '43710e88-142a-48c6-8a4f-6ce0628b63d8'::UUID, 'Paula', 'Herrera Vargas', 'Paula Herrera Vargas', '75293105', 968812137, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/86.jpg', 1, 'Enero', '2026-01-20 10:59:22-05'::TIMESTAMPTZ, '2026-01-20', 'B001-000022', 300.0),
        (23, 'ff37a050-50ce-4c32-9804-d8f3794b4824'::UUID, 'Joaquin', 'Castillo Torres', 'Joaquin Castillo Torres', '73591531', 984252420, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/27.jpg', 1, 'Enero', '2026-01-21 12:59:42-05'::TIMESTAMPTZ, '2026-01-21', 'B001-000023', 300.0),
        (24, '087027d9-c07d-42bc-bb2b-a89f36ffa9cf'::UUID, 'Leonardo', 'Rojas Fernandez', 'Leonardo Rojas Fernandez', '84212844', 947135391, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/21.jpg', 1, 'Enero', '2026-01-22 12:32:31-05'::TIMESTAMPTZ, '2026-01-22', 'B001-000024', 300.0),
        (25, '385e4272-3f34-4773-b1d9-ddbdce82a192'::UUID, 'Martina', 'Garcia Palacios', 'Martina Garcia Palacios', '75001431', 983227889, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/6.jpg', 1, 'Enero', '2026-01-23 16:45:27-05'::TIMESTAMPTZ, '2026-01-23', 'B001-000025', 300.0),
        (26, '78fd77e5-745d-4ebd-bdbd-884d6e49cc7b'::UUID, 'Thiago', 'Soto Diaz', 'Thiago Soto Diaz', '81867485', 985146293, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/23.jpg', 1, 'Enero', '2026-01-23 08:57:22-05'::TIMESTAMPTZ, '2026-01-23', 'B001-000026', 300.0),
        (27, '9beba91c-8778-4db5-abcd-921e1cf6cf28'::UUID, 'Lucero', 'Montero Soto', 'Lucero Montero Soto', '78327110', 945810056, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/29.jpg', 1, 'Enero', '2026-01-25 08:11:47-05'::TIMESTAMPTZ, '2026-01-25', 'B001-000027', 300.0),
        (28, '66939573-ae26-409e-8a47-a97195986838'::UUID, 'Julieta', 'Mendoza Flores', 'Julieta Mendoza Flores', '76480360', 963481198, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/66.jpg', 1, 'Enero', '2026-01-25 15:22:19-05'::TIMESTAMPTZ, '2026-01-25', 'B001-000028', 300.0),
        (29, '0451a3b4-95a2-4682-8ba0-27aa12f3c180'::UUID, 'Emmanuel', 'Chavez Miranda', 'Emmanuel Chavez Miranda', '78907573', 915134794, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/56.jpg', 1, 'Enero', '2026-01-26 16:21:01-05'::TIMESTAMPTZ, '2026-01-26', 'B001-000029', 300.0),
        (30, 'ab03893f-0c75-425c-8015-50ad8f583dcc'::UUID, 'Valeria', 'Castillo Rodriguez', 'Valeria Castillo Rodriguez', '84631662', 910226999, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/47.jpg', 1, 'Enero', '2026-01-27 16:07:24-05'::TIMESTAMPTZ, '2026-01-27', 'B001-000030', 300.0),
        (31, 'abc6fd00-bb0a-4df1-9cff-3c8881814909'::UUID, 'Martina', 'Navarro Romero', 'Martina Navarro Romero', '87016207', 951511484, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/25.jpg', 1, 'Enero', '2026-01-28 13:39:20-05'::TIMESTAMPTZ, '2026-01-28', 'B001-000031', 300.0),
        (32, '80e101cc-a4ef-4248-926b-048e45ed1691'::UUID, 'Alejandra', 'Cabrera Romero', 'Alejandra Cabrera Romero', '83625621', 983542887, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/78.jpg', 1, 'Enero', '2026-01-28 14:43:47-05'::TIMESTAMPTZ, '2026-01-28', 'B001-000032', 300.0),
        (33, 'f4c8f8a0-3fde-49af-b39c-a4cf35077d0a'::UUID, 'Patricia', 'Salazar Guerrero', 'Patricia Salazar Guerrero', '75693898', 998429450, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/12.jpg', 1, 'Enero', '2026-01-30 15:28:28-05'::TIMESTAMPTZ, '2026-01-30', 'B001-000033', 300.0),
        (34, '161dfbb4-61a2-43c6-ba3c-5f349b7facbc'::UUID, 'Lucas', 'Gonzales Flores', 'Lucas Gonzales Flores', '71550675', 942862209, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/81.jpg', 1, 'Enero', '2026-01-31 11:43:19-05'::TIMESTAMPTZ, '2026-01-31', 'B001-000034', 300.0),
        (35, 'c4d4ebfa-f2c0-4653-b44d-850464c71afc'::UUID, 'Raul', 'Palacios Quispe', 'Raul Palacios Quispe', '73576476', 967062156, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/7.jpg', 1, 'Enero', '2026-01-31 14:31:25-05'::TIMESTAMPTZ, '2026-01-31', 'B001-000035', 300.0),
        (36, '9e355738-a2c3-4eb6-a371-cfa804c52c5f'::UUID, 'Carla', 'Vega Carrasco', 'Carla Vega Carrasco', '89980064', 952587010, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/58.jpg', 2, 'Febrero', '2026-02-01 09:29:08-05'::TIMESTAMPTZ, '2026-02-01', 'B001-000036', 300.0),
        (37, 'a151044f-4851-45ee-83d7-395cb9c1fd1e'::UUID, 'Milagros', 'Castro Delgado', 'Milagros Castro Delgado', '87491919', 975041510, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/35.jpg', 2, 'Febrero', '2026-02-02 15:28:16-05'::TIMESTAMPTZ, '2026-02-02', 'B001-000037', 300.0),
        (38, 'ff0be6e7-f63c-42bd-aac2-0ba7867b7005'::UUID, 'Bruno', 'Palacios Gonzales', 'Bruno Palacios Gonzales', '77179067', 918620650, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/27.jpg', 2, 'Febrero', '2026-02-02 16:05:08-05'::TIMESTAMPTZ, '2026-02-02', 'B001-000038', 300.0),
        (39, '5d4d09db-a58d-454a-81b3-c4038d0d80d2'::UUID, 'Jimena', 'Flores Montes', 'Jimena Flores Montes', '89316962', 961053877, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/54.jpg', 2, 'Febrero', '2026-02-03 14:57:49-05'::TIMESTAMPTZ, '2026-02-03', 'B001-000039', 300.0),
        (40, 'd7fc6691-93aa-4ca6-bc4b-72c436989a63'::UUID, 'Flavia', 'Mendoza Castro', 'Flavia Mendoza Castro', '84624228', 975181765, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/93.jpg', 2, 'Febrero', '2026-02-04 16:51:38-05'::TIMESTAMPTZ, '2026-02-04', 'B001-000040', 300.0),
        (41, '29fcd45b-1567-47c1-81d6-efbda27671b7'::UUID, 'Claudia', 'Flores Alarcon', 'Claudia Flores Alarcon', '89860625', 985751409, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/24.jpg', 2, 'Febrero', '2026-02-04 15:58:08-05'::TIMESTAMPTZ, '2026-02-04', 'B001-000041', 300.0),
        (42, '715b76c1-9771-4c88-9020-083728fdc4fd'::UUID, 'Fabricio', 'Ponce Medina', 'Fabricio Ponce Medina', '79336742', 966581473, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/45.jpg', 2, 'Febrero', '2026-02-04 14:20:13-05'::TIMESTAMPTZ, '2026-02-04', 'B001-000042', 300.0),
        (43, '4b5c01a3-df61-4323-8183-a41437bf624d'::UUID, 'Santiago', 'Espinoza Vasquez', 'Santiago Espinoza Vasquez', '70683839', 993394260, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/28.jpg', 2, 'Febrero', '2026-02-05 09:49:41-05'::TIMESTAMPTZ, '2026-02-05', 'B001-000043', 300.0),
        (44, '05ad3745-c3c8-439d-b94b-585869884a83'::UUID, 'Oscar', 'Campos Acosta', 'Oscar Campos Acosta', '73843085', 931980274, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/51.jpg', 2, 'Febrero', '2026-02-06 12:49:23-05'::TIMESTAMPTZ, '2026-02-06', 'B001-000044', 300.0),
        (45, '25f42e79-65dd-4a7a-8c38-07a46d6a17c1'::UUID, 'Milagros', 'Espinoza Diaz', 'Milagros Espinoza Diaz', '80119435', 990585882, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/85.jpg', 2, 'Febrero', '2026-02-07 11:04:37-05'::TIMESTAMPTZ, '2026-02-07', 'B001-000045', 300.0),
        (46, '7d649233-0001-4d16-8b30-2ee3228e0cb5'::UUID, 'Gonzalo', 'Pacheco Cordova', 'Gonzalo Pacheco Cordova', '73541296', 968186525, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/84.jpg', 2, 'Febrero', '2026-02-07 16:41:21-05'::TIMESTAMPTZ, '2026-02-07', 'B001-000046', 300.0),
        (47, '3db322f1-9e3e-4eab-8d73-4531cd5eb61e'::UUID, 'Julio', 'Miranda Castro', 'Julio Miranda Castro', '80814747', 942949803, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/73.jpg', 2, 'Febrero', '2026-02-08 16:49:30-05'::TIMESTAMPTZ, '2026-02-08', 'B001-000047', 300.0),
        (48, 'ed0dab98-218e-459f-8a73-9b0dcf2f9565'::UUID, 'Rodrigo', 'Chavez Cordova', 'Rodrigo Chavez Cordova', '77117561', 957623800, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/72.jpg', 2, 'Febrero', '2026-02-09 14:21:01-05'::TIMESTAMPTZ, '2026-02-09', 'B001-000048', 300.0),
        (49, '0e6b1756-a956-44ab-b6bf-7c5f5b5a4520'::UUID, 'Flavia', 'Carrasco Ponce', 'Flavia Carrasco Ponce', '78063933', 973900135, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/52.jpg', 2, 'Febrero', '2026-02-09 11:05:15-05'::TIMESTAMPTZ, '2026-02-09', 'B001-000049', 300.0),
        (50, '44abeb4d-fdc9-4eb8-bb17-25980353a6dd'::UUID, 'Manuel', 'Vega Silva', 'Manuel Vega Silva', '84277538', 983871890, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/30.jpg', 2, 'Febrero', '2026-02-10 12:42:37-05'::TIMESTAMPTZ, '2026-02-10', 'B001-000050', 300.0);
    INSERT INTO tmp_matriculas_batch VALUES        (51, '64f7dcbf-cc5a-4180-bd86-435879a5511c'::UUID, 'Jimena', 'Chavez Vasquez', 'Jimena Chavez Vasquez', '77260663', 974988034, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/13.jpg', 2, 'Febrero', '2026-02-10 11:20:07-05'::TIMESTAMPTZ, '2026-02-10', 'B001-000051', 300.0),
        (52, '3b757dce-ab04-442c-ae44-7e3ae1989c79'::UUID, 'Mateo', 'Acosta Benitez', 'Mateo Acosta Benitez', '74247419', 946817443, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/97.jpg', 2, 'Febrero', '2026-02-11 12:14:23-05'::TIMESTAMPTZ, '2026-02-11', 'B001-000052', 300.0),
        (53, '4a2748b0-77b9-439f-a504-d21769d5c28d'::UUID, 'Axel', 'Morales Chavez', 'Axel Morales Chavez', '71723916', 943887075, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/74.jpg', 2, 'Febrero', '2026-02-12 08:36:18-05'::TIMESTAMPTZ, '2026-02-12', 'B001-000053', 300.0),
        (54, '08ca6533-9169-4006-9a9a-77bc995717bb'::UUID, 'Andrea', 'Rojas Espinoza', 'Andrea Rojas Espinoza', '73974574', 984903294, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/49.jpg', 2, 'Febrero', '2026-02-12 08:09:09-05'::TIMESTAMPTZ, '2026-02-12', 'B001-000054', 300.0),
        (55, 'fe147820-28e5-4b8b-9067-be610f692e33'::UUID, 'Fiorella', 'Romero Cabrera', 'Fiorella Romero Cabrera', '72020993', 991823275, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/21.jpg', 2, 'Febrero', '2026-02-13 15:19:55-05'::TIMESTAMPTZ, '2026-02-13', 'B001-000055', 300.0),
        (56, 'de48733f-df99-4614-b237-450f228e7340'::UUID, 'Axel', 'Palacios Cruz', 'Axel Palacios Cruz', '85767646', 949092160, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/10.jpg', 2, 'Febrero', '2026-02-13 16:04:10-05'::TIMESTAMPTZ, '2026-02-13', 'B001-000056', 300.0),
        (57, '90083c85-9333-40dd-8939-5e7857945d4b'::UUID, 'Carla', 'Montero Vasquez', 'Carla Montero Vasquez', '84265296', 925405014, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/10.jpg', 2, 'Febrero', '2026-02-14 12:50:50-05'::TIMESTAMPTZ, '2026-02-14', 'B001-000057', 300.0),
        (58, 'c04cb66b-7226-4004-8ff2-19a84abc2938'::UUID, 'Mariana', 'Cardenas Torres', 'Mariana Cardenas Torres', '85726894', 950814428, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/77.jpg', 2, 'Febrero', '2026-02-14 12:38:47-05'::TIMESTAMPTZ, '2026-02-14', 'B001-000058', 300.0),
        (59, '87300367-1a32-4a2b-8bb5-28774b457eb8'::UUID, 'Valentina', 'Rojas Mendoza', 'Valentina Rojas Mendoza', '89300479', 988802305, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/84.jpg', 2, 'Febrero', '2026-02-15 14:47:20-05'::TIMESTAMPTZ, '2026-02-15', 'B001-000059', 300.0),
        (60, '3af88c4f-a674-4edf-a459-ddff42e38aff'::UUID, 'Christian', 'Rojas Salazar', 'Christian Rojas Salazar', '81675635', 964807553, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/89.jpg', 2, 'Febrero', '2026-02-16 12:11:37-05'::TIMESTAMPTZ, '2026-02-16', 'B001-000060', 300.0),
        (61, '95bdebe6-6d9b-42d7-9140-f640d9a17b16'::UUID, 'Gabriela', 'Rojas Gutierrez', 'Gabriela Rojas Gutierrez', '78469100', 953389073, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/60.jpg', 2, 'Febrero', '2026-02-17 14:52:48-05'::TIMESTAMPTZ, '2026-02-17', 'B001-000061', 300.0),
        (62, '83e3cde6-42ee-408c-addd-fd3a858c4385'::UUID, 'Flavia', 'Fernandez Cardenas', 'Flavia Fernandez Cardenas', '71731803', 937321124, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/16.jpg', 2, 'Febrero', '2026-02-17 11:33:23-05'::TIMESTAMPTZ, '2026-02-17', 'B001-000062', 300.0),
        (63, '0d753c2a-4290-486a-ac81-cb66677a4637'::UUID, 'Andrea', 'Carrasco Quispe', 'Andrea Carrasco Quispe', '88530482', 964759583, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/83.jpg', 2, 'Febrero', '2026-02-17 17:51:15-05'::TIMESTAMPTZ, '2026-02-17', 'B001-000063', 300.0),
        (64, '0dd1bd89-2742-4406-8642-00ab5ce5ed65'::UUID, 'Ruben', 'Castro Huaman', 'Ruben Castro Huaman', '86189999', 973380266, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/66.jpg', 2, 'Febrero', '2026-02-19 15:59:45-05'::TIMESTAMPTZ, '2026-02-19', 'B001-000064', 300.0),
        (65, '460f38d6-ed08-4b28-a44b-391b62bcc9be'::UUID, 'Gonzalo', 'Morales Guerrero', 'Gonzalo Morales Guerrero', '87036849', 945859307, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/63.jpg', 2, 'Febrero', '2026-02-19 10:55:04-05'::TIMESTAMPTZ, '2026-02-19', 'B001-000065', 300.0),
        (66, '4ac56d55-68bf-45a4-9dd6-fbc86e74cbe8'::UUID, 'Manuel', 'Ponce Benitez', 'Manuel Ponce Benitez', '82657069', 971115319, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/30.jpg', 2, 'Febrero', '2026-02-20 15:34:30-05'::TIMESTAMPTZ, '2026-02-20', 'B001-000066', 300.0),
        (67, '8e88c412-2bc6-4e08-b3c8-b01aa5cfcc80'::UUID, 'Carolina', 'Montero Medina', 'Carolina Montero Medina', '82954653', 999078806, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/43.jpg', 2, 'Febrero', '2026-02-21 14:02:20-05'::TIMESTAMPTZ, '2026-02-21', 'B001-000067', 300.0),
        (68, 'c618aa89-c1d3-4a77-b76d-c5d10e9575dd'::UUID, 'Sofia', 'Navarro Gonzales', 'Sofia Navarro Gonzales', '83756599', 997883261, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/89.jpg', 2, 'Febrero', '2026-02-21 15:06:33-05'::TIMESTAMPTZ, '2026-02-21', 'B001-000068', 300.0),
        (69, 'd15d5312-a377-4340-b64c-bf33f85b88bf'::UUID, 'Claudia', 'Medina Gutierrez', 'Claudia Medina Gutierrez', '86372800', 982613940, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/30.jpg', 2, 'Febrero', '2026-02-22 09:54:21-05'::TIMESTAMPTZ, '2026-02-22', 'B001-000069', 300.0),
        (70, '3fa6aebd-47bb-45e5-9e91-4df07c486f5f'::UUID, 'Emma', 'Cardenas Perez', 'Emma Cardenas Perez', '80048414', 913885234, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/56.jpg', 2, 'Febrero', '2026-02-23 14:06:48-05'::TIMESTAMPTZ, '2026-02-23', 'B001-000070', 300.0),
        (71, '56d9dc35-5e87-4f2d-98dd-fb5d446e2874'::UUID, 'Zoe', 'Perez Chavez', 'Zoe Perez Chavez', '72649738', 991804602, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/30.jpg', 2, 'Febrero', '2026-02-22 16:26:36-05'::TIMESTAMPTZ, '2026-02-22', 'B001-000071', 300.0),
        (72, '78cddb06-4a6e-452b-abf2-f19d4106aca1'::UUID, 'Gabriela', 'Vargas Bravo', 'Gabriela Vargas Bravo', '88340790', 931203129, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/55.jpg', 2, 'Febrero', '2026-02-23 12:29:16-05'::TIMESTAMPTZ, '2026-02-23', 'B001-000072', 300.0),
        (73, '742e47f1-1eb6-4b3c-9ebd-ba6bb56a9869'::UUID, 'Bruno', 'Montes Salazar', 'Bruno Montes Salazar', '73578689', 941837210, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/3.jpg', 2, 'Febrero', '2026-02-24 15:54:19-05'::TIMESTAMPTZ, '2026-02-24', 'B001-000073', 300.0),
        (74, 'c728a28d-2117-4013-9ddf-bc064b849338'::UUID, 'Vanessa', 'Delgado Campos', 'Vanessa Delgado Campos', '71645651', 991390501, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/29.jpg', 2, 'Febrero', '2026-02-25 14:17:00-05'::TIMESTAMPTZ, '2026-02-25', 'B001-000074', 300.0),
        (75, 'f9a06bfe-ed88-4188-9e9c-88cfc40ece7b'::UUID, 'Carla', 'Bravo Lozano', 'Carla Bravo Lozano', '74589549', 994322033, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/47.jpg', 2, 'Febrero', '2026-02-26 17:16:43-05'::TIMESTAMPTZ, '2026-02-26', 'B001-000075', 300.0),
        (76, '521cca66-e1b6-4a1c-9005-669df9419ef9'::UUID, 'Gonzalo', 'Chavez Vasquez', 'Gonzalo Chavez Vasquez', '74434546', 982398083, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/33.jpg', 2, 'Febrero', '2026-02-26 09:58:18-05'::TIMESTAMPTZ, '2026-02-26', 'B001-000076', 300.0),
        (77, '460d6e3d-687d-49fb-85c6-820f307ac389'::UUID, 'Ariana', 'Montero Torres', 'Ariana Montero Torres', '85714593', 920106509, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/72.jpg', 2, 'Febrero', '2026-02-27 15:51:18-05'::TIMESTAMPTZ, '2026-02-27', 'B001-000077', 300.0),
        (78, '1f3e3f6c-c99e-4fcc-ba83-d7673aaf83cf'::UUID, 'Gabriela', 'Herrera Bravo', 'Gabriela Herrera Bravo', '78796677', 988458327, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/80.jpg', 2, 'Febrero', '2026-02-27 14:00:16-05'::TIMESTAMPTZ, '2026-02-27', 'B001-000078', 300.0),
        (79, '26184d0c-46cf-4d69-8713-2d3763d4d875'::UUID, 'Estefania', 'Garcia Fernandez', 'Estefania Garcia Fernandez', '85578233', 950559278, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/15.jpg', 2, 'Febrero', '2026-02-28 16:20:58-05'::TIMESTAMPTZ, '2026-02-28', 'B001-000079', 300.0),
        (80, '72dbcc00-ed4b-4864-bd4a-83fff65dd08f'::UUID, 'Victor', 'Campos Palacios', 'Victor Campos Palacios', '88125852', 966254240, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/79.jpg', 2, 'Febrero', '2026-02-28 16:08:24-05'::TIMESTAMPTZ, '2026-02-28', 'B001-000080', 300.0),
        (81, '1f8faa62-f345-4f18-a448-5c04d5f9fcb7'::UUID, 'Axel', 'Cardenas Espinoza', 'Axel Cardenas Espinoza', '82169724', 923335151, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/51.jpg', 3, 'Marzo', '2026-03-01 12:02:44-05'::TIMESTAMPTZ, '2026-03-01', 'B001-000081', 300.0),
        (82, '43bcc2ee-574f-4759-a2f6-db6e051108d4'::UUID, 'Victor', 'Ramos Villegas', 'Victor Ramos Villegas', '70716637', 916788532, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/98.jpg', 3, 'Marzo', '2026-03-02 09:54:52-05'::TIMESTAMPTZ, '2026-03-02', 'B001-000082', 300.0),
        (83, 'c4cc7fbb-cde8-435d-a11e-4a8767349fdb'::UUID, 'Ariana', 'Delgado Gonzales', 'Ariana Delgado Gonzales', '89997825', 910380581, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/15.jpg', 3, 'Marzo', '2026-03-03 17:13:52-05'::TIMESTAMPTZ, '2026-03-03', 'B001-000083', 300.0),
        (84, '034f73e5-270b-4485-9ca4-febd659974f8'::UUID, 'Thiago', 'Miranda Gutierrez', 'Thiago Miranda Gutierrez', '70529525', 933386929, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/96.jpg', 3, 'Marzo', '2026-03-04 08:08:00-05'::TIMESTAMPTZ, '2026-03-04', 'B001-000084', 300.0),
        (85, '0b8b3bfc-35e5-47d6-9740-aaae0fc22065'::UUID, 'Emma', 'Cardenas Rios', 'Emma Cardenas Rios', '77433976', 992558242, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/62.jpg', 3, 'Marzo', '2026-03-04 15:49:23-05'::TIMESTAMPTZ, '2026-03-04', 'B001-000085', 300.0),
        (86, 'b93e93d1-664b-4d86-a2d6-71d06973fc74'::UUID, 'Axel', 'Garcia Rojas', 'Axel Garcia Rojas', '80808279', 991644298, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/71.jpg', 3, 'Marzo', '2026-03-05 14:43:06-05'::TIMESTAMPTZ, '2026-03-05', 'B001-000086', 300.0),
        (87, '09c62d19-5dc1-45ad-941a-f5ec069a534c'::UUID, 'Facundo', 'Cruz Mamani', 'Facundo Cruz Mamani', '73327876', 925356396, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/59.jpg', 3, 'Marzo', '2026-03-06 14:38:33-05'::TIMESTAMPTZ, '2026-03-06', 'B001-000087', 300.0),
        (88, 'b4e1d606-b45d-4ce4-b87c-9fd5555d0a0c'::UUID, 'Emmanuel', 'Herrera Gonzales', 'Emmanuel Herrera Gonzales', '85913789', 919010480, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/17.jpg', 3, 'Marzo', '2026-03-06 09:20:27-05'::TIMESTAMPTZ, '2026-03-06', 'B001-000088', 300.0),
        (89, '599cdd42-3826-4093-9b3d-f328cbbbbe94'::UUID, 'Daniel', 'Huaman Silva', 'Daniel Huaman Silva', '84191405', 916904975, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/28.jpg', 3, 'Marzo', '2026-03-07 17:35:35-05'::TIMESTAMPTZ, '2026-03-07', 'B001-000089', 300.0),
        (90, 'dbc3863e-4448-453f-b3b9-9f951fbeff31'::UUID, 'Manuel', 'Herrera Torres', 'Manuel Herrera Torres', '79347198', 987054398, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/72.jpg', 3, 'Marzo', '2026-03-08 15:14:54-05'::TIMESTAMPTZ, '2026-03-08', 'B001-000090', 300.0),
        (91, 'b738c5e9-0a03-41ec-b5f0-f24a2527eb80'::UUID, 'Patricio', 'Romero Morales', 'Patricio Romero Morales', '81778391', 910819505, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/95.jpg', 3, 'Marzo', '2026-03-08 12:01:11-05'::TIMESTAMPTZ, '2026-03-08', 'B001-000091', 300.0),
        (92, 'd5ca33e7-582b-4731-a2d1-7fb5213c0ff8'::UUID, 'Romina', 'Huaman Paredes', 'Romina Huaman Paredes', '81438571', 931127115, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/7.jpg', 3, 'Marzo', '2026-03-10 08:05:47-05'::TIMESTAMPTZ, '2026-03-10', 'B001-000092', 300.0),
        (93, 'e519b08f-86a9-4e08-aaa4-a397c65feabd'::UUID, 'Axel', 'Soto Mamani', 'Axel Soto Mamani', '86296102', 991480362, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/45.jpg', 3, 'Marzo', '2026-03-10 17:03:43-05'::TIMESTAMPTZ, '2026-03-10', 'B001-000093', 300.0),
        (94, '5e32fe92-8f21-4d6a-bbc6-195449a50844'::UUID, 'Cecilia', 'Soto Romero', 'Cecilia Soto Romero', '71523953', 939597483, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/99.jpg', 3, 'Marzo', '2026-03-11 12:43:43-05'::TIMESTAMPTZ, '2026-03-11', 'B001-000094', 300.0),
        (95, 'eee1dcee-87cd-4d18-94dc-35d0aeadd0ca'::UUID, 'Christian', 'Campos Mamani', 'Christian Campos Mamani', '75895339', 927339011, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/46.jpg', 3, 'Marzo', '2026-03-12 12:18:20-05'::TIMESTAMPTZ, '2026-03-12', 'B001-000095', 300.0),
        (96, 'e09b872e-e7be-459b-9310-03d01f318da5'::UUID, 'Matias', 'Ochoa Gutierrez', 'Matias Ochoa Gutierrez', '89319271', 967617561, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/52.jpg', 3, 'Marzo', '2026-03-12 08:27:01-05'::TIMESTAMPTZ, '2026-03-12', 'B001-000096', 300.0),
        (97, 'f9d4f422-f9d1-4861-85a2-4c541c966fc5'::UUID, 'Gabriela', 'Lozano Palacios', 'Gabriela Lozano Palacios', '82141761', 921828592, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/11.jpg', 3, 'Marzo', '2026-03-13 13:10:51-05'::TIMESTAMPTZ, '2026-03-13', 'B001-000097', 300.0),
        (98, '4d75637b-c203-4278-b03e-ee84d19f35da'::UUID, 'Nicolas', 'Garcia Rios', 'Nicolas Garcia Rios', '73826099', 981216573, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/19.jpg', 3, 'Marzo', '2026-03-14 12:47:21-05'::TIMESTAMPTZ, '2026-03-14', 'B001-000098', 300.0),
        (99, '784817ed-4730-488c-8970-e330b5199fad'::UUID, 'Gabriel', 'Ponce Villegas', 'Gabriel Ponce Villegas', '72528436', 933776150, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/83.jpg', 3, 'Marzo', '2026-03-15 10:16:12-05'::TIMESTAMPTZ, '2026-03-15', 'B001-000099', 300.0),
        (100, '513b815a-9d06-47cd-9474-795725292043'::UUID, 'Nicole', 'Gonzales Cardenas', 'Nicole Gonzales Cardenas', '72291306', 972937522, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/65.jpg', 3, 'Marzo', '2026-03-16 17:20:55-05'::TIMESTAMPTZ, '2026-03-16', 'B001-000100', 300.0);
    INSERT INTO tmp_matriculas_batch VALUES        (101, 'bbb15add-ab05-4a40-9905-86cb37bf2159'::UUID, 'Adrian', 'Garcia Villegas', 'Adrian Garcia Villegas', '73029847', 992545028, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/58.jpg', 3, 'Marzo', '2026-03-16 15:28:02-05'::TIMESTAMPTZ, '2026-03-16', 'B001-000101', 300.0),
        (102, 'f6ccd682-08df-40dc-8bab-2b23c649f3e7'::UUID, 'Esteban', 'Rios Gonzales', 'Esteban Rios Gonzales', '72076136', 970468188, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/23.jpg', 3, 'Marzo', '2026-03-18 17:41:12-05'::TIMESTAMPTZ, '2026-03-18', 'B001-000102', 300.0),
        (103, '55d318b2-4146-4034-860a-5eec3604af64'::UUID, 'Antonella', 'Herrera Vargas', 'Antonella Herrera Vargas', '82999542', 964864099, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/9.jpg', 3, 'Marzo', '2026-03-18 15:28:33-05'::TIMESTAMPTZ, '2026-03-18', 'B001-000103', 300.0),
        (104, 'f1891d9c-2db2-4927-b48e-21b9db82659a'::UUID, 'Julio', 'Montes Soto', 'Julio Montes Soto', '75045691', 954743095, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/90.jpg', 3, 'Marzo', '2026-03-19 16:43:24-05'::TIMESTAMPTZ, '2026-03-19', 'B001-000104', 300.0),
        (105, 'f1c042b9-f64e-4fcc-9cf9-2d711295a832'::UUID, 'Andrea', 'Carrasco Medina', 'Andrea Carrasco Medina', '81021844', 927152188, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/3.jpg', 3, 'Marzo', '2026-03-20 10:38:45-05'::TIMESTAMPTZ, '2026-03-20', 'B001-000105', 300.0),
        (106, 'ee4aa4f7-1af2-4270-a763-fc153c748d7a'::UUID, 'Flavia', 'Vasquez Mendoza', 'Flavia Vasquez Mendoza', '74615927', 930796389, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/95.jpg', 3, 'Marzo', '2026-03-20 10:13:21-05'::TIMESTAMPTZ, '2026-03-20', 'B001-000106', 300.0),
        (107, '1c5893e1-8401-4ca8-af93-fa137fcfd7e8'::UUID, 'Alejandra', 'Lopez Cruz', 'Alejandra Lopez Cruz', '82640621', 930703455, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/93.jpg', 3, 'Marzo', '2026-03-22 08:42:21-05'::TIMESTAMPTZ, '2026-03-22', 'B001-000107', 300.0),
        (108, 'fbbd3031-4c42-4fc9-8478-6c710bfcbb08'::UUID, 'Adriana', 'Reyes Vargas', 'Adriana Reyes Vargas', '85063522', 941407343, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/48.jpg', 3, 'Marzo', '2026-03-22 14:23:43-05'::TIMESTAMPTZ, '2026-03-22', 'B001-000108', 300.0),
        (109, '3b60dd6c-6d6b-41c8-9083-aa7f4b7d6a0f'::UUID, 'Romina', 'Rios Vega', 'Romina Rios Vega', '84047926', 931751079, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/62.jpg', 3, 'Marzo', '2026-03-23 17:28:29-05'::TIMESTAMPTZ, '2026-03-23', 'B001-000109', 300.0),
        (110, '720f3ac2-e849-4093-a52e-85df2ca39e21'::UUID, 'Cecilia', 'Montes Torres', 'Cecilia Montes Torres', '79565127', 921257528, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/12.jpg', 3, 'Marzo', '2026-03-24 16:59:06-05'::TIMESTAMPTZ, '2026-03-24', 'B001-000110', 300.0),
        (111, '2e75b0ea-d396-44ca-be83-cc5b6c1f3dee'::UUID, 'Valentina', 'Huaman Sanchez', 'Valentina Huaman Sanchez', '83302787', 977378254, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/4.jpg', 3, 'Marzo', '2026-03-25 11:52:28-05'::TIMESTAMPTZ, '2026-03-25', 'B001-000111', 300.0),
        (112, '46b1383c-1b7b-452a-9997-f4513d9db832'::UUID, 'Maria', 'Lopez Rodriguez', 'Maria Lopez Rodriguez', '79626075', 973411827, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/33.jpg', 3, 'Marzo', '2026-03-25 09:53:45-05'::TIMESTAMPTZ, '2026-03-25', 'B001-000112', 300.0),
        (113, '29ba0929-05a9-4ad8-94bc-a84c24551b89'::UUID, 'Fiorella', 'Torres Delgado', 'Fiorella Torres Delgado', '79667084', 941895531, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/59.jpg', 3, 'Marzo', '2026-03-26 10:35:46-05'::TIMESTAMPTZ, '2026-03-26', 'B001-000113', 300.0),
        (114, '07bcbd3d-dd6e-4150-8849-4f8badd7ce72'::UUID, 'Facundo', 'Cabrera Espinoza', 'Facundo Cabrera Espinoza', '74817639', 949093864, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/24.jpg', 3, 'Marzo', '2026-03-26 15:38:34-05'::TIMESTAMPTZ, '2026-03-26', 'B001-000114', 300.0),
        (115, '6e23541e-a29d-427a-9693-14dfbb19dfd6'::UUID, 'Maximiliano', 'Benitez Rios', 'Maximiliano Benitez Rios', '87032987', 984377016, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/48.jpg', 3, 'Marzo', '2026-03-28 09:33:23-05'::TIMESTAMPTZ, '2026-03-28', 'B001-000115', 300.0),
        (116, '79c639fa-e3e6-44bf-a305-159b1daa6aff'::UUID, 'Thiago', 'Navarro Soto', 'Thiago Navarro Soto', '73478382', 988101741, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/23.jpg', 3, 'Marzo', '2026-03-28 08:22:50-05'::TIMESTAMPTZ, '2026-03-28', 'B001-000116', 300.0),
        (117, 'fb60c8c7-fbee-4fc3-baac-6da258cfda29'::UUID, 'Victoria', 'Garcia Acosta', 'Victoria Garcia Acosta', '85357178', 914963880, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/40.jpg', 3, 'Marzo', '2026-03-29 15:44:30-05'::TIMESTAMPTZ, '2026-03-29', 'B001-000117', 300.0),
        (118, '62e286eb-12c1-4879-95f5-390e8c1e8487'::UUID, 'Raul', 'Vasquez Vargas', 'Raul Vasquez Vargas', '81978065', 916416148, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/96.jpg', 3, 'Marzo', '2026-03-30 16:30:16-05'::TIMESTAMPTZ, '2026-03-30', 'B001-000118', 300.0),
        (119, '1e386560-01c4-406b-8532-808ac8a08aaa'::UUID, 'Christian', 'Herrera Montero', 'Christian Herrera Montero', '87424006', 945798645, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/70.jpg', 3, 'Marzo', '2026-03-30 14:21:11-05'::TIMESTAMPTZ, '2026-03-30', 'B001-000119', 300.0),
        (120, '068ae39e-d46d-4426-8e23-16a7c7aaedf0'::UUID, 'Andrea', 'Cardenas Cruz', 'Andrea Cardenas Cruz', '84298082', 932366682, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/79.jpg', 3, 'Marzo', '2026-03-31 09:05:20-05'::TIMESTAMPTZ, '2026-03-31', 'B001-000120', 300.0),
        (121, '74d4882c-de5d-45a3-9b35-4975686f49f3'::UUID, 'Mia', 'Soto Fernandez', 'Mia Soto Fernandez', '83630153', 958762794, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/87.jpg', 4, 'Abril', '2026-04-02 12:40:50-05'::TIMESTAMPTZ, '2026-04-02', 'B001-000121', 300.0),
        (122, '0e507e6e-cb8e-4a3a-8ea4-e65347626809'::UUID, 'Raul', 'Herrera Medina', 'Raul Herrera Medina', '89033571', 914346684, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/98.jpg', 4, 'Abril', '2026-04-03 08:08:04-05'::TIMESTAMPTZ, '2026-04-03', 'B001-000122', 300.0),
        (123, '95e0d577-f6ec-41ad-a026-87ea8137682d'::UUID, 'Raul', 'Castro Espinoza', 'Raul Castro Espinoza', '73806703', 913478029, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/34.jpg', 4, 'Abril', '2026-04-03 10:33:23-05'::TIMESTAMPTZ, '2026-04-03', 'B001-000123', 300.0),
        (124, '4b2783de-d3e9-4553-8f94-e5ac594eee04'::UUID, 'Flavia', 'Vasquez Torres', 'Flavia Vasquez Torres', '74554289', 919939096, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/86.jpg', 4, 'Abril', '2026-04-05 11:39:18-05'::TIMESTAMPTZ, '2026-04-05', 'B001-000124', 300.0),
        (125, '3736aa5f-ac53-4295-90e1-a327a519b5c2'::UUID, 'Alvaro', 'Montes Perez', 'Alvaro Montes Perez', '75841524', 958518659, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/31.jpg', 4, 'Abril', '2026-04-06 09:35:34-05'::TIMESTAMPTZ, '2026-04-06', 'B001-000125', 300.0),
        (126, '207602a4-e14a-497a-8bcb-f7541c371af3'::UUID, 'Gabriela', 'Montero Carrasco', 'Gabriela Montero Carrasco', '74354399', 992134318, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/68.jpg', 4, 'Abril', '2026-04-07 08:23:35-05'::TIMESTAMPTZ, '2026-04-07', 'B001-000126', 300.0),
        (127, 'bb1b6c3b-6861-4a61-8f69-05bc32ea6b0e'::UUID, 'Rodrigo', 'Villegas Garcia', 'Rodrigo Villegas Garcia', '85098638', 972523073, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/24.jpg', 4, 'Abril', '2026-04-08 14:52:36-05'::TIMESTAMPTZ, '2026-04-08', 'B001-000127', 300.0),
        (128, '4a631f71-b66e-4093-a78e-17c33329d843'::UUID, 'Camila', 'Lozano Torres', 'Camila Lozano Torres', '87384622', 930537388, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/67.jpg', 4, 'Abril', '2026-04-10 10:27:32-05'::TIMESTAMPTZ, '2026-04-10', 'B001-000128', 300.0),
        (129, 'db99bae7-703e-4476-aeee-1da7138722c5'::UUID, 'Karla', 'Castro Lopez', 'Karla Castro Lopez', '80161107', 992467167, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/20.jpg', 4, 'Abril', '2026-04-11 09:16:12-05'::TIMESTAMPTZ, '2026-04-11', 'B001-000129', 300.0),
        (130, '2c18b9e5-702f-4b8f-878d-0f795410a336'::UUID, 'Lorena', 'Rodriguez Pacheco', 'Lorena Rodriguez Pacheco', '70952056', 920901547, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/54.jpg', 4, 'Abril', '2026-04-12 17:46:57-05'::TIMESTAMPTZ, '2026-04-12', 'B001-000130', 300.0),
        (131, '7e7c9ccf-a57d-4b4d-a666-baeb2bf5e017'::UUID, 'Mariana', 'Villegas Romero', 'Mariana Villegas Romero', '86204939', 942866956, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/57.jpg', 4, 'Abril', '2026-04-13 08:31:56-05'::TIMESTAMPTZ, '2026-04-13', 'B001-000131', 300.0),
        (132, '42db4110-11d9-4a4a-bac7-8488ac0146a5'::UUID, 'Nicole', 'Ochoa Acosta', 'Nicole Ochoa Acosta', '80714480', 956354851, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/41.jpg', 4, 'Abril', '2026-04-14 15:13:21-05'::TIMESTAMPTZ, '2026-04-14', 'B001-000132', 300.0),
        (133, 'fc32db22-437f-4abd-9693-03b34c537299'::UUID, 'Diego', 'Sanchez Vargas', 'Diego Sanchez Vargas', '82889929', 992594562, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/74.jpg', 4, 'Abril', '2026-04-15 09:17:28-05'::TIMESTAMPTZ, '2026-04-15', 'B001-000133', 300.0),
        (134, '36d19336-6516-4ffd-83af-7ae36f893b5d'::UUID, 'Facundo', 'Paredes Cordova', 'Facundo Paredes Cordova', '80352900', 976755908, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/28.jpg', 4, 'Abril', '2026-04-17 11:48:10-05'::TIMESTAMPTZ, '2026-04-17', 'B001-000134', 300.0),
        (135, '5c68d543-e436-4600-86c3-4c36ad31a712'::UUID, 'Raul', 'Bravo Salazar', 'Raul Bravo Salazar', '79588124', 982033413, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/98.jpg', 4, 'Abril', '2026-04-18 08:03:18-05'::TIMESTAMPTZ, '2026-04-18', 'B001-000135', 300.0),
        (136, 'c2b14e3f-cf2d-48ec-8dd3-dd08d4be113c'::UUID, 'Valeria', 'Herrera Carrasco', 'Valeria Herrera Carrasco', '79683866', 919869264, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/88.jpg', 4, 'Abril', '2026-04-19 08:25:03-05'::TIMESTAMPTZ, '2026-04-19', 'B001-000136', 300.0),
        (137, '49c18872-3dcc-49dc-a6d9-e296372aa70b'::UUID, 'Fabricio', 'Carrasco Herrera', 'Fabricio Carrasco Herrera', '74840809', 936717096, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/18.jpg', 4, 'Abril', '2026-04-20 10:06:25-05'::TIMESTAMPTZ, '2026-04-20', 'B001-000137', 300.0),
        (138, '0ea010c3-1eba-45c4-b768-2cd137706810'::UUID, 'Facundo', 'Lopez Gutierrez', 'Facundo Lopez Gutierrez', '80688094', 931810655, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/65.jpg', 4, 'Abril', '2026-04-22 15:33:29-05'::TIMESTAMPTZ, '2026-04-22', 'B001-000138', 300.0),
        (139, '3a720879-715e-4368-99bd-734cae025e06'::UUID, 'Natalia', 'Pacheco Flores', 'Natalia Pacheco Flores', '82360037', 954458225, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/4.jpg', 4, 'Abril', '2026-04-23 16:31:45-05'::TIMESTAMPTZ, '2026-04-23', 'B001-000139', 300.0),
        (140, '686ab8d7-04ca-4083-b78b-8e3ac438305f'::UUID, 'Rocio', 'Cabrera Mendoza', 'Rocio Cabrera Mendoza', '71723193', 988319168, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/19.jpg', 4, 'Abril', '2026-04-24 12:41:50-05'::TIMESTAMPTZ, '2026-04-24', 'B001-000140', 300.0),
        (141, '481f3d99-e417-49d6-9ce6-505a3650159b'::UUID, 'Martina', 'Vasquez Flores', 'Martina Vasquez Flores', '84798798', 952103092, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/79.jpg', 4, 'Abril', '2026-04-25 11:02:36-05'::TIMESTAMPTZ, '2026-04-25', 'B001-000141', 300.0),
        (142, '05dd0bef-2f3e-47fb-8568-f10ba39dfc2d'::UUID, 'Karla', 'Gutierrez Soto', 'Karla Gutierrez Soto', '86051466', 980528349, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/70.jpg', 4, 'Abril', '2026-04-27 08:45:08-05'::TIMESTAMPTZ, '2026-04-27', 'B001-000142', 300.0),
        (143, '5a5e0f96-8f0a-415d-b6f4-1b647135472f'::UUID, 'Thiago', 'Castro Carrasco', 'Thiago Castro Carrasco', '80015969', 940181142, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/41.jpg', 4, 'Abril', '2026-04-27 12:39:30-05'::TIMESTAMPTZ, '2026-04-27', 'B001-000143', 300.0),
        (144, 'efc09cea-70df-40da-ad1d-830bdeaceeec'::UUID, 'Sara', 'Vargas Torres', 'Sara Vargas Torres', '89242688', 982905845, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/37.jpg', 4, 'Abril', '2026-04-29 16:59:59-05'::TIMESTAMPTZ, '2026-04-29', 'B001-000144', 300.0),
        (145, '3a180848-24ba-4231-a209-c022fdf803c1'::UUID, 'Emmanuel', 'Campos Salazar', 'Emmanuel Campos Salazar', '77180205', 937121108, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/14.jpg', 4, 'Abril', '2026-04-30 09:22:59-05'::TIMESTAMPTZ, '2026-04-30', 'B001-000145', 300.0),
        (146, '91ed5964-ba6d-477e-93c8-0bf1291b3a69'::UUID, 'Maximiliano', 'Mendoza Fernandez', 'Maximiliano Mendoza Fernandez', '77812698', 917045237, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/1.jpg', 5, 'Mayo', '2026-05-01 17:15:15-05'::TIMESTAMPTZ, '2026-05-01', 'B001-000146', 300.0),
        (147, '83feeae4-c05a-48d4-9e9a-6beea65b0a80'::UUID, 'Natalia', 'Salazar Villegas', 'Natalia Salazar Villegas', '76692631', 948553376, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/30.jpg', 5, 'Mayo', '2026-05-03 10:26:41-05'::TIMESTAMPTZ, '2026-05-03', 'B001-000147', 300.0),
        (148, '6ace4e69-897a-4e32-96ad-1c09a902266a'::UUID, 'Alejandro', 'Rodriguez Lozano', 'Alejandro Rodriguez Lozano', '83320927', 976489301, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/78.jpg', 5, 'Mayo', '2026-05-04 08:58:58-05'::TIMESTAMPTZ, '2026-05-04', 'B001-000148', 300.0),
        (149, '79858311-7773-4c64-9c59-c60babbb1d32'::UUID, 'Claudia', 'Vega Cordova', 'Claudia Vega Cordova', '74503002', 977674279, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/94.jpg', 5, 'Mayo', '2026-05-05 13:18:29-05'::TIMESTAMPTZ, '2026-05-05', 'B001-000149', 300.0),
        (150, 'a40ddd1e-b3ed-4518-8b1b-b8542a129bba'::UUID, 'Fabricio', 'Guerrero Vargas', 'Fabricio Guerrero Vargas', '89051576', 935925669, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/66.jpg', 5, 'Mayo', '2026-05-07 12:45:11-05'::TIMESTAMPTZ, '2026-05-07', 'B001-000150', 300.0);
    INSERT INTO tmp_matriculas_batch VALUES        (151, 'b60d24b2-17ba-454b-8e71-a152d4baa3d9'::UUID, 'Joaquin', 'Salazar Gutierrez', 'Joaquin Salazar Gutierrez', '78323079', 910916723, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/39.jpg', 5, 'Mayo', '2026-05-09 14:42:06-05'::TIMESTAMPTZ, '2026-05-09', 'B001-000151', 300.0),
        (152, 'd4e4aa7d-76ed-4779-8bf7-e91c33f20be4'::UUID, 'Jimena', 'Espinoza Sanchez', 'Jimena Espinoza Sanchez', '73966967', 972464258, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/89.jpg', 5, 'Mayo', '2026-05-10 17:00:16-05'::TIMESTAMPTZ, '2026-05-10', 'B001-000152', 300.0),
        (153, '1b40411a-7619-496a-a4e8-63b270e04229'::UUID, 'Joaquin', 'Salazar Gonzales', 'Joaquin Salazar Gonzales', '85266550', 991300905, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/86.jpg', 5, 'Mayo', '2026-05-11 12:23:39-05'::TIMESTAMPTZ, '2026-05-11', 'B001-000153', 300.0),
        (154, 'c327cc20-facd-4edb-80bd-d15378b99f51'::UUID, 'Luciana', 'Vega Cardenas', 'Luciana Vega Cardenas', '87722549', 958557943, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/74.jpg', 5, 'Mayo', '2026-05-14 11:43:48-05'::TIMESTAMPTZ, '2026-05-14', 'B001-000154', 300.0),
        (155, '791e21d4-8fea-416e-ac0e-3a2bc634844d'::UUID, 'Martina', 'Bravo Ramos', 'Martina Bravo Ramos', '89567189', 975609379, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/66.jpg', 5, 'Mayo', '2026-05-15 10:20:54-05'::TIMESTAMPTZ, '2026-05-15', 'B001-000155', 300.0),
        (156, 'e0497529-14f9-421b-ba4c-08821501e781'::UUID, 'Alvaro', 'Navarro Flores', 'Alvaro Navarro Flores', '83285834', 944152669, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/90.jpg', 5, 'Mayo', '2026-05-16 17:03:35-05'::TIMESTAMPTZ, '2026-05-16', 'B001-000156', 300.0),
        (157, '78a8f9bc-40d3-4050-8c30-324ed98d250d'::UUID, 'Esteban', 'Rodriguez Vargas', 'Esteban Rodriguez Vargas', '83719297', 934156684, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/49.jpg', 5, 'Mayo', '2026-05-18 08:59:57-05'::TIMESTAMPTZ, '2026-05-18', 'B001-000157', 300.0),
        (158, 'ccee2c53-c0fa-430e-9883-6bcc0f5721f2'::UUID, 'Martina', 'Chavez Benitez', 'Martina Chavez Benitez', '83188859', 980980044, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/87.jpg', 5, 'Mayo', '2026-05-19 16:08:41-05'::TIMESTAMPTZ, '2026-05-19', 'B001-000158', 300.0),
        (159, '25dc175c-c0b2-447b-b8d1-080726d0b836'::UUID, 'Paula', 'Paredes Silva', 'Paula Paredes Silva', '75205009', 946997080, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/99.jpg', 5, 'Mayo', '2026-05-22 14:34:24-05'::TIMESTAMPTZ, '2026-05-22', 'B001-000159', 300.0),
        (160, 'a5b4fa6c-52ad-488f-b8b6-0f7780c0d8dc'::UUID, 'Oscar', 'Rodriguez Cardenas', 'Oscar Rodriguez Cardenas', '71633306', 942847661, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/18.jpg', 5, 'Mayo', '2026-05-23 08:15:13-05'::TIMESTAMPTZ, '2026-05-23', 'B001-000160', 300.0),
        (161, '5fa6858d-b8e4-466f-adf4-18ebcb3fc56e'::UUID, 'Lorena', 'Gutierrez Cabrera', 'Lorena Gutierrez Cabrera', '80759735', 941796721, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/39.jpg', 5, 'Mayo', '2026-05-24 12:14:52-05'::TIMESTAMPTZ, '2026-05-24', 'B001-000161', 300.0),
        (162, '2ab9ed1a-bd33-4b12-bae9-52cf1b7509db'::UUID, 'Zoe', 'Fernandez Bravo', 'Zoe Fernandez Bravo', '84334472', 984605013, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/68.jpg', 5, 'Mayo', '2026-05-26 16:37:56-05'::TIMESTAMPTZ, '2026-05-26', 'B001-000162', 300.0),
        (163, '3a12ac86-5705-47a0-a1a3-378473282e7e'::UUID, 'Alejandro', 'Ponce Benitez', 'Alejandro Ponce Benitez', '85888655', 942342202, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/8.jpg', 5, 'Mayo', '2026-05-27 14:26:09-05'::TIMESTAMPTZ, '2026-05-27', 'B001-000163', 300.0),
        (164, '30c45368-6259-4388-96ba-fdfd3200e3a8'::UUID, 'Thiago', 'Castillo Ramos', 'Thiago Castillo Ramos', '81081787', 996799390, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/7.jpg', 5, 'Mayo', '2026-05-29 14:35:33-05'::TIMESTAMPTZ, '2026-05-29', 'B001-000164', 300.0),
        (165, 'bdf7bdee-839f-44c0-80b4-5090b8d3aa56'::UUID, 'Valeria', 'Montero Ponce', 'Valeria Montero Ponce', '89716036', 985007641, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/28.jpg', 5, 'Mayo', '2026-05-30 17:38:02-05'::TIMESTAMPTZ, '2026-05-30', 'B001-000165', 300.0),
        (166, '65c2b7cf-f73a-41d2-b0bb-751d66650886'::UUID, 'Thiago', 'Palacios Cruz', 'Thiago Palacios Cruz', '76862322', 963235053, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/69.jpg', 6, 'Junio', '2026-06-02 09:47:48-05'::TIMESTAMPTZ, '2026-06-02', 'B001-000166', 300.0),
        (167, 'df8a39c0-e7ce-43fb-83d1-e04031657291'::UUID, 'Flavia', 'Paredes Diaz', 'Flavia Paredes Diaz', '85753484', 952980983, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/95.jpg', 6, 'Junio', '2026-06-03 12:16:23-05'::TIMESTAMPTZ, '2026-06-03', 'B001-000167', 300.0),
        (168, '61cfeca3-abda-4209-a46b-02656cb4dadf'::UUID, 'Melanie', 'Huaman Vargas', 'Melanie Huaman Vargas', '75114078', 936332415, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/84.jpg', 6, 'Junio', '2026-06-04 12:35:59-05'::TIMESTAMPTZ, '2026-06-04', 'B001-000168', 300.0),
        (169, '438b37d3-7150-45e7-97db-2b3ed306dda6'::UUID, 'Melanie', 'Villegas Campos', 'Melanie Villegas Campos', '86461656', 971851421, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/24.jpg', 6, 'Junio', '2026-06-06 13:16:48-05'::TIMESTAMPTZ, '2026-06-06', 'B001-000169', 300.0),
        (170, 'a078de75-69d8-462c-8320-b95987283a89'::UUID, 'Mia', 'Pacheco Soto', 'Mia Pacheco Soto', '71627872', 910856822, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/2.jpg', 6, 'Junio', '2026-06-08 16:41:03-05'::TIMESTAMPTZ, '2026-06-08', 'B001-000170', 300.0),
        (171, '7cf90b86-56da-409e-938a-68c76fb15728'::UUID, 'Carla', 'Reyes Salazar', 'Carla Reyes Salazar', '86369676', 912111482, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/93.jpg', 6, 'Junio', '2026-06-08 15:23:03-05'::TIMESTAMPTZ, '2026-06-08', 'B001-000171', 300.0),
        (172, '244d38b3-1859-4a9b-8e92-47899d6a4cb6'::UUID, 'Vanessa', 'Mamani Montero', 'Vanessa Mamani Montero', '76015197', 924363501, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/33.jpg', 6, 'Junio', '2026-06-10 12:01:32-05'::TIMESTAMPTZ, '2026-06-10', 'B001-000172', 300.0),
        (173, 'd639dfe5-c494-4bc2-86af-d1bdacad00f5'::UUID, 'Piero', 'Paredes Cabrera', 'Piero Paredes Cabrera', '78160702', 940314047, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/12.jpg', 6, 'Junio', '2026-06-12 12:50:25-05'::TIMESTAMPTZ, '2026-06-12', 'B001-000173', 300.0),
        (174, '215a2fcd-44af-4046-afb9-b0292f481eef'::UUID, 'Mateo', 'Palacios Perez', 'Mateo Palacios Perez', '72774485', 977089857, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/30.jpg', 6, 'Junio', '2026-06-13 14:35:30-05'::TIMESTAMPTZ, '2026-06-13', 'B001-000174', 300.0),
        (175, 'b03f74a0-39e7-49dc-9fa8-baa69431709a'::UUID, 'Matias', 'Bravo Castro', 'Matias Bravo Castro', '88221086', 985633013, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/76.jpg', 6, 'Junio', '2026-06-14 17:30:17-05'::TIMESTAMPTZ, '2026-06-14', 'B001-000175', 300.0),
        (176, 'af9e17e5-25e3-4765-af48-cf2960589513'::UUID, 'Javier', 'Espinoza Cabrera', 'Javier Espinoza Cabrera', '83057928', 982553061, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/65.jpg', 6, 'Junio', '2026-06-16 14:59:04-05'::TIMESTAMPTZ, '2026-06-16', 'B001-000176', 300.0),
        (177, 'b3ed618e-45b7-494c-9a89-06ebac273388'::UUID, 'Matias', 'Morales Cruz', 'Matias Morales Cruz', '89985310', 963244581, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/46.jpg', 6, 'Junio', '2026-06-18 13:03:06-05'::TIMESTAMPTZ, '2026-06-18', 'B001-000177', 300.0),
        (178, '09b284d0-4d7d-4530-8736-2688f1ebccae'::UUID, 'Carla', 'Medina Rojas', 'Carla Medina Rojas', '79911290', 943077929, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/20.jpg', 6, 'Junio', '2026-06-19 14:27:11-05'::TIMESTAMPTZ, '2026-06-19', 'B001-000178', 300.0),
        (179, '85e92c69-517d-459e-bbd1-7133009393fb'::UUID, 'Alvaro', 'Cardenas Herrera', 'Alvaro Cardenas Herrera', '79051859', 923721268, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/66.jpg', 6, 'Junio', '2026-06-21 13:23:06-05'::TIMESTAMPTZ, '2026-06-21', 'B001-000179', 300.0),
        (180, '528fc251-15a7-4658-883b-a73b4ccc072a'::UUID, 'Diana', 'Cruz Guerrero', 'Diana Cruz Guerrero', '80886075', 961705758, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/32.jpg', 6, 'Junio', '2026-06-22 08:05:22-05'::TIMESTAMPTZ, '2026-06-22', 'B001-000180', 300.0),
        (181, '8070a07b-450b-49f2-9e32-10ad8c114936'::UUID, 'Christopher', 'Romero Castro', 'Christopher Romero Castro', '86546493', 929587040, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/10.jpg', 6, 'Junio', '2026-06-24 10:43:24-05'::TIMESTAMPTZ, '2026-06-24', 'B001-000181', 300.0),
        (182, '4061ac69-8392-454f-b693-1933c3273d5f'::UUID, 'Fernando', 'Vasquez Paredes', 'Fernando Vasquez Paredes', '73589397', 928185096, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/49.jpg', 6, 'Junio', '2026-06-25 11:46:40-05'::TIMESTAMPTZ, '2026-06-25', 'B001-000182', 300.0),
        (183, 'db969033-9170-407a-90c3-652461625b14'::UUID, 'Raul', 'Cruz Lopez', 'Raul Cruz Lopez', '80080935', 953038948, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/38.jpg', 6, 'Junio', '2026-06-27 13:28:21-05'::TIMESTAMPTZ, '2026-06-27', 'B001-000183', 300.0),
        (184, 'e04506b5-3e4b-4ea1-835e-88be59a38f3b'::UUID, 'Bruno', 'Castro Pacheco', 'Bruno Castro Pacheco', '83184715', 958991556, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/4.jpg', 6, 'Junio', '2026-06-28 15:36:50-05'::TIMESTAMPTZ, '2026-06-28', 'B001-000184', 300.0),
        (185, '80a5f159-92cd-4e65-b4eb-783599008c3c'::UUID, 'Adrian', 'Lozano Palacios', 'Adrian Lozano Palacios', '72320579', 964914054, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/20.jpg', 6, 'Junio', '2026-06-30 15:45:13-05'::TIMESTAMPTZ, '2026-06-30', 'B001-000185', 300.0),
        (186, '6733664f-5f5a-4c55-b51b-8bfc8200cebf'::UUID, 'Natalia', 'Miranda Alarcon', 'Natalia Miranda Alarcon', '87930394', 977996397, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/77.jpg', 7, 'Julio', '2026-07-01 14:04:28-05'::TIMESTAMPTZ, '2026-07-01', 'B001-000186', 300.0),
        (187, 'ad917e5e-9f66-4579-9fd5-f19b03387a5a'::UUID, 'Victor', 'Silva Perez', 'Victor Silva Perez', '71486350', 985594147, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/13.jpg', 7, 'Julio', '2026-07-02 09:06:49-05'::TIMESTAMPTZ, '2026-07-02', 'B001-000187', 300.0),
        (188, '3e17dd28-b8c8-4d3a-b5f5-0829f49c42f0'::UUID, 'Jimena', 'Cabrera Mendoza', 'Jimena Cabrera Mendoza', '84957846', 960213478, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/20.jpg', 7, 'Julio', '2026-07-03 16:47:33-05'::TIMESTAMPTZ, '2026-07-03', 'B001-000188', 300.0),
        (189, '6b0dfc5a-606b-4999-9a67-e01f9f292de9'::UUID, 'Emiliano', 'Torres Lozano', 'Emiliano Torres Lozano', '74753830', 956751880, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/45.jpg', 7, 'Julio', '2026-07-04 08:30:06-05'::TIMESTAMPTZ, '2026-07-04', 'B001-000189', 300.0),
        (190, '81c274c1-71d3-4204-a5c3-dd958d3c83c7'::UUID, 'Matias', 'Romero Rodriguez', 'Matias Romero Rodriguez', '73861620', 913031322, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/67.jpg', 7, 'Julio', '2026-07-05 15:46:44-05'::TIMESTAMPTZ, '2026-07-05', 'B001-000190', 300.0),
        (191, 'f9d35dac-07cf-4784-8f71-21d4afa4d7ce'::UUID, 'Salvador', 'Mendoza Montero', 'Salvador Mendoza Montero', '83591136', 994524999, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/95.jpg', 7, 'Julio', '2026-07-06 10:21:35-05'::TIMESTAMPTZ, '2026-07-06', 'B001-000191', 300.0),
        (192, '789865e1-c4dc-43b0-a13b-8edc5fd4c250'::UUID, 'Mateo', 'Acosta Ramos', 'Mateo Acosta Ramos', '76904981', 947358810, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/42.jpg', 7, 'Julio', '2026-07-07 11:28:37-05'::TIMESTAMPTZ, '2026-07-07', 'B001-000192', 300.0),
        (193, '21ab4385-1bbf-4776-ad35-af7fbed0b6bb'::UUID, 'Cecilia', 'Fernandez Gutierrez', 'Cecilia Fernandez Gutierrez', '83040569', 992048427, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/80.jpg', 7, 'Julio', '2026-07-08 09:16:42-05'::TIMESTAMPTZ, '2026-07-08', 'B001-000193', 300.0),
        (194, '94d83d5b-515c-4568-abdc-328b7695cc4c'::UUID, 'Vanessa', 'Lopez Gutierrez', 'Vanessa Lopez Gutierrez', '73954780', 942020689, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/50.jpg', 7, 'Julio', '2026-07-09 12:58:39-05'::TIMESTAMPTZ, '2026-07-09', 'B001-000194', 300.0),
        (195, '11711ef2-184e-4370-a605-f55c2a66bcca'::UUID, 'Christian', 'Fernandez Benitez', 'Christian Fernandez Benitez', '75812795', 984479105, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/80.jpg', 7, 'Julio', '2026-07-10 10:36:24-05'::TIMESTAMPTZ, '2026-07-10', 'B001-000195', 300.0),
        (196, 'fc2b961e-beab-4b69-a741-92ca896d66c4'::UUID, 'Bruno', 'Carrasco Rios', 'Bruno Carrasco Rios', '86608432', 964913082, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/11.jpg', 7, 'Julio', '2026-07-11 13:00:31-05'::TIMESTAMPTZ, '2026-07-11', 'B001-000196', 300.0),
        (197, '4f2dc942-8fd9-47bc-9dec-f6564461e885'::UUID, 'Ignacio', 'Vargas Perez', 'Ignacio Vargas Perez', '85345159', 985920319, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/70.jpg', 7, 'Julio', '2026-07-13 11:18:02-05'::TIMESTAMPTZ, '2026-07-13', 'B001-000197', 300.0),
        (198, '88585fe9-9c03-460b-a1a7-86613b5bdcfa'::UUID, 'Melanie', 'Cardenas Benitez', 'Melanie Cardenas Benitez', '77333050', 967063296, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/45.jpg', 7, 'Julio', '2026-07-14 13:34:52-05'::TIMESTAMPTZ, '2026-07-14', 'B001-000198', 300.0),
        (199, 'f95a4d6e-439c-4a3a-ad97-15d588cde963'::UUID, 'Paula', 'Ramos Montero', 'Paula Ramos Montero', '89727452', 957060874, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/27.jpg', 7, 'Julio', '2026-07-15 09:28:55-05'::TIMESTAMPTZ, '2026-07-15', 'B001-000199', 300.0),
        (200, '7c434bc6-7f80-432e-a37d-07270af92c9c'::UUID, 'Ignacio', 'Perez Gutierrez', 'Ignacio Perez Gutierrez', '79819191', 948833650, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/18.jpg', 7, 'Julio', '2026-07-16 17:22:34-05'::TIMESTAMPTZ, '2026-07-16', 'B001-000200', 300.0);
    INSERT INTO tmp_matriculas_batch VALUES        (201, '8e4dfd8d-9580-4764-836d-bf508c1e7c30'::UUID, 'Estefania', 'Lopez Palacios', 'Estefania Lopez Palacios', '74452366', 943511112, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/19.jpg', 7, 'Julio', '2026-07-17 14:58:03-05'::TIMESTAMPTZ, '2026-07-17', 'B001-000201', 300.0),
        (202, '0d4e2fd4-b563-4ddd-ada7-bf1ddc9256f6'::UUID, 'Matias', 'Fernandez Guerrero', 'Matias Fernandez Guerrero', '73123742', 964069715, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/42.jpg', 7, 'Julio', '2026-07-18 12:40:26-05'::TIMESTAMPTZ, '2026-07-18', 'B001-000202', 300.0),
        (203, 'c15cac80-8015-4a01-a03e-f4738165a14d'::UUID, 'Jimena', 'Silva Montes', 'Jimena Silva Montes', '72125025', 981729237, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/42.jpg', 7, 'Julio', '2026-07-19 09:46:29-05'::TIMESTAMPTZ, '2026-07-19', 'B001-000203', 300.0),
        (204, '9f689294-dec1-492f-a09d-ac2a6aa2ab85'::UUID, 'Christian', 'Guerrero Morales', 'Christian Guerrero Morales', '71624345', 916166355, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/1.jpg', 7, 'Julio', '2026-07-20 13:35:36-05'::TIMESTAMPTZ, '2026-07-20', 'B001-000204', 300.0),
        (205, 'fc0be2bf-4d7a-46d4-be8e-e65a22d08b42'::UUID, 'Estefania', 'Romero Perez', 'Estefania Romero Perez', '79194567', 922527880, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/7.jpg', 7, 'Julio', '2026-07-21 14:12:44-05'::TIMESTAMPTZ, '2026-07-21', 'B001-000205', 300.0),
        (206, 'ada112b7-1602-42d2-921a-525cfe5a6f10'::UUID, 'Fiorella', 'Villegas Rojas', 'Fiorella Villegas Rojas', '73193834', 910145801, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/88.jpg', 7, 'Julio', '2026-07-22 12:46:44-05'::TIMESTAMPTZ, '2026-07-22', 'B001-000206', 300.0),
        (207, 'cafac7d2-62c4-4a69-9ee5-0600f77cd2ac'::UUID, 'Fiorella', 'Palacios Lopez', 'Fiorella Palacios Lopez', '86028960', 919506414, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/48.jpg', 7, 'Julio', '2026-07-23 08:44:21-05'::TIMESTAMPTZ, '2026-07-23', 'B001-000207', 300.0),
        (208, '0cc5521d-44c7-4386-975b-4e3a45af78b0'::UUID, 'Victoria', 'Villegas Bravo', 'Victoria Villegas Bravo', '74793353', 919182050, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/45.jpg', 7, 'Julio', '2026-07-24 10:24:49-05'::TIMESTAMPTZ, '2026-07-24', 'B001-000208', 300.0),
        (209, '1af3f407-ab5f-4a90-86ad-34f9a762017f'::UUID, 'Adriana', 'Ochoa Ramos', 'Adriana Ochoa Ramos', '72908767', 923484199, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/41.jpg', 7, 'Julio', '2026-07-25 10:58:26-05'::TIMESTAMPTZ, '2026-07-25', 'B001-000209', 300.0),
        (210, '7fa74edb-69b0-46d0-8ec5-c8388a1e1c3f'::UUID, 'Manuel', 'Cruz Navarro', 'Manuel Cruz Navarro', '79560355', 913600310, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/38.jpg', 7, 'Julio', '2026-07-26 11:17:41-05'::TIMESTAMPTZ, '2026-07-26', 'B001-000210', 300.0),
        (211, 'dde49769-e375-4b44-b8dd-c72b7120b820'::UUID, 'Christian', 'Fernandez Cruz', 'Christian Fernandez Cruz', '72382767', 980905413, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/54.jpg', 7, 'Julio', '2026-07-27 11:31:24-05'::TIMESTAMPTZ, '2026-07-27', 'B001-000211', 300.0),
        (212, 'de159243-0914-4049-9f4b-a90bb18a4222'::UUID, 'Mia', 'Flores Miranda', 'Mia Flores Miranda', '72266017', 911851322, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/65.jpg', 7, 'Julio', '2026-07-28 10:48:30-05'::TIMESTAMPTZ, '2026-07-28', 'B001-000212', 300.0),
        (213, '4a44bacb-fc15-4fef-8c29-aed901d3c90b'::UUID, 'Piero', 'Rojas Fernandez', 'Piero Rojas Fernandez', '88004127', 982162880, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/27.jpg', 7, 'Julio', '2026-07-29 16:49:26-05'::TIMESTAMPTZ, '2026-07-29', 'B001-000213', 300.0),
        (214, '248ac4e3-3960-40a2-8856-77eb5e5f3275'::UUID, 'Eduardo', 'Ponce Lozano', 'Eduardo Ponce Lozano', '72218454', 951630244, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/59.jpg', 7, 'Julio', '2026-07-31 10:34:20-05'::TIMESTAMPTZ, '2026-07-31', 'B001-000214', 300.0),
        (215, '8314e5e5-965f-4a89-91c7-2c21fee67f62'::UUID, 'Allison', 'Chavez Torres', 'Allison Chavez Torres', '70424965', 928416255, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/93.jpg', 7, 'Julio', '2026-07-31 08:19:42-05'::TIMESTAMPTZ, '2026-07-31', 'B001-000215', 300.0),
        (216, '6b9ee974-e1f4-4981-92c1-1c55c16a48f5'::UUID, 'Sara', 'Navarro Torres', 'Sara Navarro Torres', '70985032', 954964418, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/81.jpg', 8, 'Agosto', '2026-08-01 13:08:47-05'::TIMESTAMPTZ, '2026-08-01', 'B001-000216', 300.0),
        (217, '4f557c07-9b67-4a63-b39f-1a9c4a8e4693'::UUID, 'Javier', 'Perez Herrera', 'Javier Perez Herrera', '75278447', 944241100, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/1.jpg', 8, 'Agosto', '2026-08-02 15:32:23-05'::TIMESTAMPTZ, '2026-08-02', 'B001-000217', 300.0),
        (218, '8ef37c02-cd13-486d-9722-29d7d7f70871'::UUID, 'Bruno', 'Gonzales Chavez', 'Bruno Gonzales Chavez', '71186604', 984204255, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/35.jpg', 8, 'Agosto', '2026-08-03 08:15:02-05'::TIMESTAMPTZ, '2026-08-03', 'B001-000218', 300.0),
        (219, '77b40ff5-53ad-49a3-8797-c2f0208a5f63'::UUID, 'Camila', 'Chavez Mendoza', 'Camila Chavez Mendoza', '87306507', 916164431, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/42.jpg', 8, 'Agosto', '2026-08-05 17:23:07-05'::TIMESTAMPTZ, '2026-08-05', 'B001-000219', 300.0),
        (220, '26db3995-f764-486d-8cb5-2cd3be1dbdbc'::UUID, 'Javier', 'Guerrero Romero', 'Javier Guerrero Romero', '78139768', 972267186, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/98.jpg', 8, 'Agosto', '2026-08-06 15:00:23-05'::TIMESTAMPTZ, '2026-08-06', 'B001-000220', 300.0),
        (221, '12ffda97-d105-4f7a-9539-5419e980c937'::UUID, 'Benjamin', 'Benitez Silva', 'Benjamin Benitez Silva', '70321948', 954965270, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/27.jpg', 8, 'Agosto', '2026-08-08 10:00:59-05'::TIMESTAMPTZ, '2026-08-08', 'B001-000221', 300.0),
        (222, '55ef164d-c486-4b1b-b4a2-66a7a0a7d77e'::UUID, 'Maria', 'Acosta Castro', 'Maria Acosta Castro', '73121456', 915892193, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/75.jpg', 8, 'Agosto', '2026-08-09 11:26:31-05'::TIMESTAMPTZ, '2026-08-09', 'B001-000222', 300.0),
        (223, 'eb0992fd-c5fc-4f6d-9885-238986cbbc8b'::UUID, 'Hugo', 'Cabrera Sanchez', 'Hugo Cabrera Sanchez', '84595603', 998911718, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/90.jpg', 8, 'Agosto', '2026-08-09 10:40:52-05'::TIMESTAMPTZ, '2026-08-09', 'B001-000223', 300.0),
        (224, 'a994cf08-960a-4ba1-8b1e-98eb52b54332'::UUID, 'Matias', 'Vasquez Lopez', 'Matias Vasquez Lopez', '89619546', 924626086, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/16.jpg', 8, 'Agosto', '2026-08-11 13:20:28-05'::TIMESTAMPTZ, '2026-08-11', 'B001-000224', 300.0),
        (225, '70b1d296-b1ff-4061-9dbc-0911b239f31a'::UUID, 'Daniel', 'Rojas Perez', 'Daniel Rojas Perez', '80207760', 990973889, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/92.jpg', 8, 'Agosto', '2026-08-12 11:28:19-05'::TIMESTAMPTZ, '2026-08-12', 'B001-000225', 300.0),
        (226, '524f744b-8062-42ec-b976-e2acba00e667'::UUID, 'Alvaro', 'Castillo Pacheco', 'Alvaro Castillo Pacheco', '75834033', 914171767, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/60.jpg', 8, 'Agosto', '2026-08-13 13:25:32-05'::TIMESTAMPTZ, '2026-08-13', 'B001-000226', 300.0),
        (227, '57f939d3-351a-46fa-9cd1-de1370f41ba1'::UUID, 'Benjamin', 'Lopez Vasquez', 'Benjamin Lopez Vasquez', '83441295', 959961172, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/26.jpg', 8, 'Agosto', '2026-08-14 10:07:00-05'::TIMESTAMPTZ, '2026-08-14', 'B001-000227', 300.0),
        (228, '0c9c53d8-5104-4e66-b249-c68661cd44b8'::UUID, 'Fabricio', 'Torres Rodriguez', 'Fabricio Torres Rodriguez', '85468422', 916796477, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/4.jpg', 8, 'Agosto', '2026-08-16 15:51:08-05'::TIMESTAMPTZ, '2026-08-16', 'B001-000228', 300.0),
        (229, 'b8499cfe-d982-4098-9ae0-e9466ea968e7'::UUID, 'Alejandro', 'Castro Cardenas', 'Alejandro Castro Cardenas', '74987242', 914650569, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/53.jpg', 8, 'Agosto', '2026-08-17 14:11:22-05'::TIMESTAMPTZ, '2026-08-17', 'B001-000229', 300.0),
        (230, 'a603e77d-f6b3-420c-8a7c-317ce2fb06cc'::UUID, 'Joaquin', 'Huaman Vasquez', 'Joaquin Huaman Vasquez', '87643392', 943440045, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/70.jpg', 8, 'Agosto', '2026-08-19 15:03:05-05'::TIMESTAMPTZ, '2026-08-19', 'B001-000230', 300.0),
        (231, 'f0384cef-ce66-44c6-b59d-a339e4ac1254'::UUID, 'Romina', 'Castro Chavez', 'Romina Castro Chavez', '70874528', 952799022, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/68.jpg', 8, 'Agosto', '2026-08-20 13:58:36-05'::TIMESTAMPTZ, '2026-08-20', 'B001-000231', 300.0),
        (232, '92183fb8-9bd4-4332-86e2-2760ce64cff9'::UUID, 'Victor', 'Espinoza Castro', 'Victor Espinoza Castro', '87907650', 917503932, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/23.jpg', 8, 'Agosto', '2026-08-21 17:14:10-05'::TIMESTAMPTZ, '2026-08-21', 'B001-000232', 300.0),
        (233, '9b04bb1f-bc67-448c-b766-c4a9bf9b9ea4'::UUID, 'Rocio', 'Flores Acosta', 'Rocio Flores Acosta', '81800494', 986188876, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/70.jpg', 8, 'Agosto', '2026-08-22 13:51:47-05'::TIMESTAMPTZ, '2026-08-22', 'B001-000233', 300.0),
        (234, 'a28debef-f437-41a5-917a-e1adb21fdd0a'::UUID, 'Oscar', 'Mendoza Flores', 'Oscar Mendoza Flores', '87664680', 974154596, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/44.jpg', 8, 'Agosto', '2026-08-23 15:02:05-05'::TIMESTAMPTZ, '2026-08-23', 'B001-000234', 300.0),
        (235, 'b4ee1950-5a2a-4446-a24d-be9dd0a0dc8d'::UUID, 'Ruben', 'Gonzales Delgado', 'Ruben Gonzales Delgado', '73721877', 980638102, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/13.jpg', 8, 'Agosto', '2026-08-25 13:03:01-05'::TIMESTAMPTZ, '2026-08-25', 'B001-000235', 300.0),
        (236, '6641cc4a-5543-4895-9c0f-9e5b5dc18498'::UUID, 'Fiorella', 'Guerrero Fernandez', 'Fiorella Guerrero Fernandez', '86347719', 997131500, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/46.jpg', 8, 'Agosto', '2026-08-26 13:08:10-05'::TIMESTAMPTZ, '2026-08-26', 'B001-000236', 300.0),
        (237, '383df12c-d94b-4c83-9371-89fd6602ff67'::UUID, 'Julio', 'Palacios Vargas', 'Julio Palacios Vargas', '74273102', 933851602, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/78.jpg', 8, 'Agosto', '2026-08-27 17:52:11-05'::TIMESTAMPTZ, '2026-08-27', 'B001-000237', 300.0),
        (238, '3e7513e4-ad72-4103-b503-db9874fd5573'::UUID, 'Flavia', 'Gonzales Morales', 'Flavia Gonzales Morales', '72610757', 941943272, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/82.jpg', 8, 'Agosto', '2026-08-28 17:14:40-05'::TIMESTAMPTZ, '2026-08-28', 'B001-000238', 300.0),
        (239, 'c1e0ff9e-4aaf-49e1-b73e-99d1400eb59c'::UUID, 'Thiago', 'Palacios Garcia', 'Thiago Palacios Garcia', '81760196', 944448045, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/22.jpg', 8, 'Agosto', '2026-08-30 13:28:00-05'::TIMESTAMPTZ, '2026-08-30', 'B001-000239', 300.0),
        (240, 'd5556254-4fdd-4e0d-948f-6c1312aff3a2'::UUID, 'Bruno', 'Diaz Lozano', 'Bruno Diaz Lozano', '86088989', 987585294, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/41.jpg', 8, 'Agosto', '2026-08-31 15:56:24-05'::TIMESTAMPTZ, '2026-08-31', 'B001-000240', 300.0),
        (241, 'd35eb026-c7cf-42e6-b6a9-2bd4442b58cb'::UUID, 'Bruno', 'Perez Navarro', 'Bruno Perez Navarro', '72516663', 983423305, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/56.jpg', 9, 'Septiembre', '2026-09-01 09:04:21-05'::TIMESTAMPTZ, '2026-09-01', 'B001-000241', 300.0),
        (242, '98ea6c04-f099-4f40-86b9-8f55c1e69dd2'::UUID, 'Leonardo', 'Diaz Morales', 'Leonardo Diaz Morales', '76897129', 935499255, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/85.jpg', 9, 'Septiembre', '2026-09-03 10:38:56-05'::TIMESTAMPTZ, '2026-09-03', 'B001-000242', 300.0),
        (243, '3c933840-0080-4183-b465-8254b64ab152'::UUID, 'Manuel', 'Lozano Cordova', 'Manuel Lozano Cordova', '75153623', 917315517, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/81.jpg', 9, 'Septiembre', '2026-09-04 11:06:03-05'::TIMESTAMPTZ, '2026-09-04', 'B001-000243', 300.0),
        (244, '641f2940-a485-4b8e-b64a-ce22aa71f4d8'::UUID, 'Eduardo', 'Vargas Rojas', 'Eduardo Vargas Rojas', '85890394', 925503345, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/83.jpg', 9, 'Septiembre', '2026-09-06 11:06:01-05'::TIMESTAMPTZ, '2026-09-06', 'B001-000244', 300.0),
        (245, '046ec600-a3ce-42d0-8b7d-e7c9be46b902'::UUID, 'Alejandro', 'Cardenas Rodriguez', 'Alejandro Cardenas Rodriguez', '78834746', 969020960, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/20.jpg', 9, 'Septiembre', '2026-09-07 10:23:56-05'::TIMESTAMPTZ, '2026-09-07', 'B001-000245', 300.0),
        (246, 'fc9089fa-4c75-426d-b7db-42d9db80e989'::UUID, 'Ignacio', 'Huaman Ponce', 'Ignacio Huaman Ponce', '89787935', 940536245, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/88.jpg', 9, 'Septiembre', '2026-09-09 09:05:42-05'::TIMESTAMPTZ, '2026-09-09', 'B001-000246', 300.0),
        (247, '33221667-4ce4-44ad-841a-afbd488ebc5d'::UUID, 'Alvaro', 'Rojas Alarcon', 'Alvaro Rojas Alarcon', '71165294', 977390918, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/16.jpg', 9, 'Septiembre', '2026-09-11 15:36:56-05'::TIMESTAMPTZ, '2026-09-11', 'B001-000247', 300.0),
        (248, '5fa4d818-2258-400a-9ce3-180bc6ac6dcf'::UUID, 'Valeria', 'Lopez Rodriguez', 'Valeria Lopez Rodriguez', '84206104', 920518444, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/34.jpg', 9, 'Septiembre', '2026-09-12 15:11:10-05'::TIMESTAMPTZ, '2026-09-12', 'B001-000248', 300.0),
        (249, '5c06c2d1-508e-4c52-a45c-27fed142c0f1'::UUID, 'Karla', 'Gutierrez Montes', 'Karla Gutierrez Montes', '79267761', 979751366, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/54.jpg', 9, 'Septiembre', '2026-09-13 09:05:24-05'::TIMESTAMPTZ, '2026-09-13', 'B001-000249', 300.0),
        (250, '7a2738d6-971e-447c-841d-c89520578142'::UUID, 'Emma', 'Diaz Cabrera', 'Emma Diaz Cabrera', '73388676', 948398732, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/63.jpg', 9, 'Septiembre', '2026-09-14 10:09:36-05'::TIMESTAMPTZ, '2026-09-14', 'B001-000250', 300.0);
    INSERT INTO tmp_matriculas_batch VALUES        (251, 'f76fee8f-c667-4bf0-b6fe-7f1027447f76'::UUID, 'Gabriel', 'Reyes Cruz', 'Gabriel Reyes Cruz', '83479483', 915205303, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/35.jpg', 9, 'Septiembre', '2026-09-16 15:02:11-05'::TIMESTAMPTZ, '2026-09-16', 'B001-000251', 300.0),
        (252, '14529964-76df-47f5-8c54-b8990ac8770f'::UUID, 'Andrea', 'Castro Lozano', 'Andrea Castro Lozano', '86496003', 923182514, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/35.jpg', 9, 'Septiembre', '2026-09-18 08:21:52-05'::TIMESTAMPTZ, '2026-09-18', 'B001-000252', 300.0),
        (253, 'cba9b509-f079-4168-ac9c-4c8b90fe1f9b'::UUID, 'Samuel', 'Pacheco Huaman', 'Samuel Pacheco Huaman', '86255791', 979323646, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/91.jpg', 9, 'Septiembre', '2026-09-19 17:41:05-05'::TIMESTAMPTZ, '2026-09-19', 'B001-000253', 300.0),
        (254, 'd662f72b-e64a-42d3-8215-29ecfaf5bdb7'::UUID, 'Lorena', 'Flores Chavez', 'Lorena Flores Chavez', '76468067', 936941091, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/36.jpg', 9, 'Septiembre', '2026-09-21 10:49:54-05'::TIMESTAMPTZ, '2026-09-21', 'B001-000254', 300.0),
        (255, '4e448fa0-ec34-485e-ad5a-545f5e89331c'::UUID, 'Martina', 'Bravo Flores', 'Martina Bravo Flores', '78118095', 959991642, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/45.jpg', 9, 'Septiembre', '2026-09-22 15:32:25-05'::TIMESTAMPTZ, '2026-09-22', 'B001-000255', 300.0),
        (256, '5dba97d4-b673-4860-84d8-b5c5af8b43a0'::UUID, 'Mariana', 'Flores Medina', 'Mariana Flores Medina', '71666012', 931865061, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/35.jpg', 9, 'Septiembre', '2026-09-23 12:47:53-05'::TIMESTAMPTZ, '2026-09-23', 'B001-000256', 300.0),
        (257, 'b59bea28-865c-423d-b82e-7a0941f26482'::UUID, 'Vanessa', 'Quispe Salazar', 'Vanessa Quispe Salazar', '74439724', 996888739, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/40.jpg', 9, 'Septiembre', '2026-09-25 16:01:55-05'::TIMESTAMPTZ, '2026-09-25', 'B001-000257', 300.0),
        (258, 'f700ef19-a554-4909-8df0-89889d6bd88e'::UUID, 'Gael', 'Paredes Castillo', 'Gael Paredes Castillo', '77321880', 972639147, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/1.jpg', 9, 'Septiembre', '2026-09-27 12:27:57-05'::TIMESTAMPTZ, '2026-09-27', 'B001-000258', 300.0),
        (259, 'b5fadaca-10ca-4d4c-9d43-69d81015dfd0'::UUID, 'Mariana', 'Romero Bravo', 'Mariana Romero Bravo', '73627386', 974657836, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/34.jpg', 9, 'Septiembre', '2026-09-28 13:35:41-05'::TIMESTAMPTZ, '2026-09-28', 'B001-000259', 300.0),
        (260, '4800ba24-8ba4-487e-b633-e370d6651a27'::UUID, 'Paula', 'Sanchez Montero', 'Paula Sanchez Montero', '83559293', 998654879, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/34.jpg', 9, 'Septiembre', '2026-09-30 12:12:09-05'::TIMESTAMPTZ, '2026-09-30', 'B001-000260', 300.0),
        (261, '668d71ee-2cbc-41a4-aa77-01562575c820'::UUID, 'Ruben', 'Cabrera Pacheco', 'Ruben Cabrera Pacheco', '76372495', 956059101, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/65.jpg', 10, 'Octubre', '2026-10-02 14:24:47-05'::TIMESTAMPTZ, '2026-10-02', 'B001-000261', 300.0),
        (262, 'a2ff7ef2-1f65-479f-a238-8bc1e5ed1738'::UUID, 'Zoe', 'Vargas Diaz', 'Zoe Vargas Diaz', '85796784', 927172371, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/84.jpg', 10, 'Octubre', '2026-10-02 10:53:42-05'::TIMESTAMPTZ, '2026-10-02', 'B001-000262', 300.0),
        (263, 'c3ce4071-2b51-4b6c-8072-379369f92beb'::UUID, 'Lucero', 'Guerrero Morales', 'Lucero Guerrero Morales', '82471592', 944971668, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/82.jpg', 10, 'Octubre', '2026-10-04 13:14:47-05'::TIMESTAMPTZ, '2026-10-04', 'B001-000263', 300.0),
        (264, 'e7dbca7e-eac5-45c8-a9af-65bcd1e056e5'::UUID, 'Patricia', 'Torres Ochoa', 'Patricia Torres Ochoa', '82806693', 981113720, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/44.jpg', 10, 'Octubre', '2026-10-06 17:04:30-05'::TIMESTAMPTZ, '2026-10-06', 'B001-000264', 300.0),
        (265, '974ec55e-8e1a-42b7-afab-c03b1797456d'::UUID, 'Maria', 'Gutierrez Ochoa', 'Maria Gutierrez Ochoa', '76051768', 920846331, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/8.jpg', 10, 'Octubre', '2026-10-07 17:57:58-05'::TIMESTAMPTZ, '2026-10-07', 'B001-000265', 300.0),
        (266, 'a4ac91cc-9247-4f2c-843e-dcdfd8f480f8'::UUID, 'Lorena', 'Ponce Perez', 'Lorena Ponce Perez', '86427481', 921816709, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/62.jpg', 10, 'Octubre', '2026-10-08 12:13:48-05'::TIMESTAMPTZ, '2026-10-08', 'B001-000266', 300.0),
        (267, 'a6d1fb2a-a7a7-4e30-ae0b-139bca820978'::UUID, 'Sofia', 'Gutierrez Ponce', 'Sofia Gutierrez Ponce', '87818537', 935578773, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/40.jpg', 10, 'Octubre', '2026-10-10 08:34:12-05'::TIMESTAMPTZ, '2026-10-10', 'B001-000267', 300.0),
        (268, 'd475b9e8-6c03-4c16-8c11-c2714a3bd201'::UUID, 'Matias', 'Pacheco Rodriguez', 'Matias Pacheco Rodriguez', '80006007', 949034245, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/44.jpg', 10, 'Octubre', '2026-10-12 14:32:37-05'::TIMESTAMPTZ, '2026-10-12', 'B001-000268', 300.0),
        (269, '3b32d145-d738-4b54-8327-47b3647fbdb8'::UUID, 'Piero', 'Flores Mendoza', 'Piero Flores Mendoza', '77526975', 927610141, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/92.jpg', 10, 'Octubre', '2026-10-14 15:22:48-05'::TIMESTAMPTZ, '2026-10-14', 'B001-000269', 300.0),
        (270, 'd1feb829-5d5f-4aba-b4f6-6d6e528c42d6'::UUID, 'Claudia', 'Reyes Sanchez', 'Claudia Reyes Sanchez', '89928784', 916437132, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/49.jpg', 10, 'Octubre', '2026-10-15 08:24:56-05'::TIMESTAMPTZ, '2026-10-15', 'B001-000270', 300.0),
        (271, '8f5593dd-5924-48a8-80a9-8c42b07a4ea2'::UUID, 'Guillermo', 'Bravo Fernandez', 'Guillermo Bravo Fernandez', '70312208', 950415166, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/90.jpg', 10, 'Octubre', '2026-10-16 12:30:44-05'::TIMESTAMPTZ, '2026-10-16', 'B001-000271', 300.0),
        (272, '52eb7fd4-5ff6-4259-8628-63cb2de0aae4'::UUID, 'Mariana', 'Torres Guerrero', 'Mariana Torres Guerrero', '73565618', 976805406, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/26.jpg', 10, 'Octubre', '2026-10-18 09:32:46-05'::TIMESTAMPTZ, '2026-10-18', 'B001-000272', 300.0),
        (273, 'e14a61db-e8bd-43c7-88c6-9915382cbb13'::UUID, 'Christian', 'Ramos Palacios', 'Christian Ramos Palacios', '86128405', 954372866, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/86.jpg', 10, 'Octubre', '2026-10-20 14:18:10-05'::TIMESTAMPTZ, '2026-10-20', 'B001-000273', 300.0),
        (274, '8d5efc64-8844-4da6-ba57-d20124802792'::UUID, 'Julio', 'Diaz Castillo', 'Julio Diaz Castillo', '77756452', 971304112, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/6.jpg', 10, 'Octubre', '2026-10-21 09:49:32-05'::TIMESTAMPTZ, '2026-10-21', 'B001-000274', 300.0),
        (275, 'b3470887-9d1e-4338-b8dd-cf8535c85d4f'::UUID, 'Cesar', 'Torres Diaz', 'Cesar Torres Diaz', '71539782', 911298197, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/94.jpg', 10, 'Octubre', '2026-10-23 13:51:43-05'::TIMESTAMPTZ, '2026-10-23', 'B001-000275', 300.0),
        (276, 'dafb439b-395b-4ceb-abd8-9dddc21f403f'::UUID, 'Salvador', 'Castro Lozano', 'Salvador Castro Lozano', '82942464', 974188958, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/21.jpg', 10, 'Octubre', '2026-10-24 13:11:07-05'::TIMESTAMPTZ, '2026-10-24', 'B001-000276', 300.0),
        (277, 'f9a4706f-856e-43c2-aea3-731672c9423d'::UUID, 'Adriana', 'Chavez Reyes', 'Adriana Chavez Reyes', '82742321', 958130331, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/63.jpg', 10, 'Octubre', '2026-10-25 17:30:51-05'::TIMESTAMPTZ, '2026-10-25', 'B001-000277', 300.0),
        (278, '2ec86541-1dcb-4626-b4a1-1e6d5a87db8c'::UUID, 'Raul', 'Gutierrez Quispe', 'Raul Gutierrez Quispe', '87609966', 987396519, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/67.jpg', 10, 'Octubre', '2026-10-27 14:28:02-05'::TIMESTAMPTZ, '2026-10-27', 'B001-000278', 300.0),
        (279, '1c3a8d82-f9f5-4bac-8a26-71e245a063c4'::UUID, 'Paula', 'Salazar Silva', 'Paula Salazar Silva', '82914316', 929952062, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/61.jpg', 10, 'Octubre', '2026-10-29 17:06:27-05'::TIMESTAMPTZ, '2026-10-29', 'B001-000279', 300.0),
        (280, '5982c9db-83ef-4b63-ad94-785bc30fc9ce'::UUID, 'Thiago', 'Morales Castro', 'Thiago Morales Castro', '71689489', 978038903, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/11.jpg', 10, 'Octubre', '2026-10-31 10:04:48-05'::TIMESTAMPTZ, '2026-10-31', 'B001-000280', 300.0),
        (281, '05c648fb-2e76-4eb7-9c2d-8f7722863233'::UUID, 'Adriana', 'Gutierrez Torres', 'Adriana Gutierrez Torres', '86689080', 997694240, 3, 'Secundaria', 'https://randomuser.me/api/portraits/women/1.jpg', 11, 'Noviembre', '2026-11-01 17:28:05-05'::TIMESTAMPTZ, '2026-11-01', 'B001-000281', 300.0),
        (282, '8fd848df-3467-4815-8fda-4ab1288efcaf'::UUID, 'Facundo', 'Carrasco Ramos', 'Facundo Carrasco Ramos', '85307797', 955748676, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/99.jpg', 11, 'Noviembre', '2026-11-03 17:39:40-05'::TIMESTAMPTZ, '2026-11-03', 'B001-000282', 300.0),
        (283, '922a9141-f1b1-4c9e-b0a4-b7166de76f71'::UUID, 'Axel', 'Torres Diaz', 'Axel Torres Diaz', '77440598', 910294869, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/48.jpg', 11, 'Noviembre', '2026-11-04 15:45:42-05'::TIMESTAMPTZ, '2026-11-04', 'B001-000283', 300.0),
        (284, '8b567866-4730-4f6f-a10c-5fe4075fca03'::UUID, 'Ruben', 'Campos Navarro', 'Ruben Campos Navarro', '83730834', 924356130, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/28.jpg', 11, 'Noviembre', '2026-11-06 08:57:10-05'::TIMESTAMPTZ, '2026-11-06', 'B001-000284', 300.0),
        (285, '8d8c8357-a553-4b5f-a3ab-a22e0d1a1a8f'::UUID, 'Gonzalo', 'Rodriguez Fernandez', 'Gonzalo Rodriguez Fernandez', '89757222', 926538199, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/1.jpg', 11, 'Noviembre', '2026-11-07 11:45:21-05'::TIMESTAMPTZ, '2026-11-07', 'B001-000285', 300.0),
        (286, 'd6277a3c-616d-4982-8350-44757fcccae0'::UUID, 'Hugo', 'Salazar Rios', 'Hugo Salazar Rios', '75945927', 987652255, 4, 'Secundaria', 'https://randomuser.me/api/portraits/men/42.jpg', 11, 'Noviembre', '2026-11-09 08:35:59-05'::TIMESTAMPTZ, '2026-11-09', 'B001-000286', 300.0),
        (287, '822ec3a2-3c6c-4747-b160-b2e432113733'::UUID, 'Paula', 'Castro Alarcon', 'Paula Castro Alarcon', '81504432', 949483304, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/39.jpg', 11, 'Noviembre', '2026-11-10 14:26:38-05'::TIMESTAMPTZ, '2026-11-10', 'B001-000287', 300.0),
        (288, '2ec81323-0a26-4cb6-905c-94cf1fc441ea'::UUID, 'Karla', 'Fernandez Ramos', 'Karla Fernandez Ramos', '76740719', 938147161, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/23.jpg', 11, 'Noviembre', '2026-11-12 16:55:20-05'::TIMESTAMPTZ, '2026-11-12', 'B001-000288', 300.0),
        (289, '43cad4e3-096d-4034-a559-060a852bf9e6'::UUID, 'Karla', 'Salazar Miranda', 'Karla Salazar Miranda', '89147440', 999544328, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/67.jpg', 11, 'Noviembre', '2026-11-13 13:45:07-05'::TIMESTAMPTZ, '2026-11-13', 'B001-000289', 300.0),
        (290, '75246825-afdf-4af9-b87c-1040a15e710b'::UUID, 'Valeria', 'Castro Ponce', 'Valeria Castro Ponce', '75400095', 948468887, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/27.jpg', 11, 'Noviembre', '2026-11-14 14:09:03-05'::TIMESTAMPTZ, '2026-11-14', 'B001-000290', 300.0),
        (291, '534b77a7-4742-418f-8fe4-7135fdd102c0'::UUID, 'Fernando', 'Ochoa Bravo', 'Fernando Ochoa Bravo', '88853731', 940106027, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/7.jpg', 11, 'Noviembre', '2026-11-16 08:22:52-05'::TIMESTAMPTZ, '2026-11-16', 'B001-000291', 300.0),
        (292, 'e69b303e-8408-4106-93d2-bfcd8530cc4b'::UUID, 'Nicole', 'Carrasco Sanchez', 'Nicole Carrasco Sanchez', '70435041', 943734435, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/82.jpg', 11, 'Noviembre', '2026-11-18 14:26:50-05'::TIMESTAMPTZ, '2026-11-18', 'B001-000292', 300.0),
        (293, '28d48c18-6dee-4da8-85c7-76b83616b76a'::UUID, 'Diana', 'Vasquez Delgado', 'Diana Vasquez Delgado', '76492705', 949483865, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/95.jpg', 11, 'Noviembre', '2026-11-19 13:48:37-05'::TIMESTAMPTZ, '2026-11-19', 'B001-000293', 300.0),
        (294, 'd4cadf6e-f149-40a0-8049-493dce99bb3e'::UUID, 'Emmanuel', 'Lopez Perez', 'Emmanuel Lopez Perez', '89595320', 944227688, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/42.jpg', 11, 'Noviembre', '2026-11-21 14:02:27-05'::TIMESTAMPTZ, '2026-11-21', 'B001-000294', 300.0),
        (295, '36ad03d0-db4a-4064-b2ae-62c16c0cc8e1'::UUID, 'Javier', 'Carrasco Silva', 'Javier Carrasco Silva', '72445473', 952662313, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/21.jpg', 11, 'Noviembre', '2026-11-22 17:53:42-05'::TIMESTAMPTZ, '2026-11-22', 'B001-000295', 300.0),
        (296, '22934237-53ba-49ba-9c6c-732e19c1e356'::UUID, 'Samuel', 'Soto Morales', 'Samuel Soto Morales', '81108749', 958425464, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/72.jpg', 11, 'Noviembre', '2026-11-23 16:25:05-05'::TIMESTAMPTZ, '2026-11-23', 'B001-000296', 300.0),
        (297, 'e037b336-a53d-4e98-b86a-bebec4cf7c0e'::UUID, 'Thiago', 'Villegas Reyes', 'Thiago Villegas Reyes', '78181481', 915352233, 5, 'Secundaria', 'https://randomuser.me/api/portraits/men/70.jpg', 11, 'Noviembre', '2026-11-25 08:07:42-05'::TIMESTAMPTZ, '2026-11-25', 'B001-000297', 300.0),
        (298, '72f5c92a-1eab-4a23-b5b9-64d50da4c699'::UUID, 'Brenda', 'Rios Montero', 'Brenda Rios Montero', '87070333', 969801634, 5, 'Secundaria', 'https://randomuser.me/api/portraits/women/66.jpg', 11, 'Noviembre', '2026-11-27 08:58:33-05'::TIMESTAMPTZ, '2026-11-27', 'B001-000298', 300.0),
        (299, '352f3f3f-b43d-46d9-9d78-b8e1a3f09d54'::UUID, 'Sofia', 'Fernandez Garcia', 'Sofia Fernandez Garcia', '77072652', 999970857, 4, 'Secundaria', 'https://randomuser.me/api/portraits/women/83.jpg', 11, 'Noviembre', '2026-11-28 09:10:49-05'::TIMESTAMPTZ, '2026-11-28', 'B001-000299', 300.0),
        (300, 'd3aa0cb5-8ccb-485a-894a-0130346a8337'::UUID, 'Salvador', 'Acosta Morales', 'Salvador Acosta Morales', '71271253', 921746856, 3, 'Secundaria', 'https://randomuser.me/api/portraits/men/74.jpg', 11, 'Noviembre', '2026-11-30 09:47:43-05'::TIMESTAMPTZ, '2026-11-30', 'B001-000300', 300.0);

    -- 1. Insertar Estudiantes usando ÚNICAMENTE las columnas oficiales en español
    INSERT INTO public.estudiantes (
        id,
        nombre,
        apellido,
        contacto,
        grado,
        nivel,
        observacion,
        estado,
        created_at
    )
    SELECT
        t.id,
        t.nombre,
        t.apellido,
        t.contacto,
        t.grado,
        t.nivel,
        'Estudiante matriculado en PREPARACION DE INGRESO (' || t.mes_nombre || '). DNI: ' || t.dni,
        true,
        t.created_at
    FROM tmp_matriculas_batch t
    ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido,
        contacto = EXCLUDED.contacto,
        created_at = EXCLUDED.created_at;

    RAISE NOTICE '✔ 300 Estudiantes insertados en public.estudiantes';

    -- Actualizar DNI si la columna existe
    IF v_has_dni_col THEN
        UPDATE public.estudiantes e
        SET dni = t.dni
        FROM tmp_matriculas_batch t
        WHERE e.id = t.id;
        RAISE NOTICE '✔ Columna DNI actualizada para los 300 estudiantes';
    END IF;

    -- Actualizar avatar_url si la columna existe
    IF v_has_avatar_col THEN
        UPDATE public.estudiantes e
        SET avatar_url = t.avatar_url
        FROM tmp_matriculas_batch t
        WHERE e.id = t.id;
    END IF;

    -- Actualizar servicio_id si la columna existe
    IF v_has_servicio_id_col THEN
        UPDATE public.estudiantes e
        SET servicio_id = v_service_id
        FROM tmp_matriculas_batch t
        WHERE e.id = t.id;
    END IF;

    -- 2. Insertar Relación en 'servicio_estudiante'
    IF v_exists_serv_est THEN
        INSERT INTO public.servicio_estudiante (id_servicio, id_estudiante, created_at)
        SELECT v_service_id, t.id, t.created_at
        FROM tmp_matriculas_batch t;
        RAISE NOTICE '✔ 300 Relaciones de matrícula registradas en public.servicio_estudiante';
    END IF;

    -- 2.1 Insertar Relación en 'estudiantes_servicios' (si existe la tabla)
    IF v_exists_est_serv THEN
        INSERT INTO public.estudiantes_servicios (id_servicio, id_estudiante, created_at)
        SELECT v_service_id, t.id, t.created_at
        FROM tmp_matriculas_batch t;
        RAISE NOTICE '✔ 300 Relaciones de matrícula registradas en public.estudiantes_servicios';
    END IF;

    -- 3. Insertar Movimientos de Caja usando ÚNICAMENTE columnas estándar (nombre, monto, fecha, categoria)
    IF v_exists_movimientos THEN
        INSERT INTO public.movimientos (
            nombre,
            monto,
            fecha,
            categoria
        )
        SELECT
            'Pago Matrícula - PREPARACION DE INGRESO (' || t.name || ')',
            t.monto,
            t.created_at,
            'Colegiatura'
        FROM tmp_matriculas_batch t;
        RAISE NOTICE '✔ 300 Ingresos de caja registrados en public.movimientos (S/. 300.00 c/u)';
    END IF;

    -- 4. Insertar Boletas en 'facturas' (Bóveda de Facturas y SUNAT)
    IF v_exists_facturas THEN
        INSERT INTO public.facturas (
            id,
            created_at,
            tipo,
            student_id,
            monto,
            concepto,
            estado,
            detalles
        )
        SELECT
            t.factura_id,
            t.created_at,
            'estudiante',
            t.id,
            t.monto,
            'Matrícula y Colegiatura - PREPARACION DE INGRESO',
            'pagada',
            jsonb_build_object(
                'nombreServicio', 'PREPARACION DE INGRESO',
                'nombrePersona', t.name,
                'nombreEstudiante', t.nombre,
                'apellidoEstudiante', t.apellido,
                'dniEstudiante', t.dni,
                'contactoEstudiante', t.contacto,
                'mesMatricula', t.mes_nombre,
                'modoTributario', 'sandbox_beta',
                'tipoComprobanteCodigo', '03',
                'tipoComprobanteNombre', 'Boleta Electrónica',
                'serieCorrelativo', t.factura_id,
                'rucEmisor', '20000000001',
                'razonSocialEmisor', 'COLEGIO ENLACE C S.A.C.',
                'docClienteTipo', '1',
                'docClienteNumero', t.dni,
                'metodoPago', 'Transferencia / Caja',
                'estadoSunat', 'PENDIENTE_VALIDACION',
                'validadoSunat', false,
                'opGravada', 0,
                'opExonerada', t.monto,
                'igvMonto', 0.00,
                'montoEnLetras', 'SON TRESCIENTOS Y 00/100 SOLES'
            )
        FROM tmp_matriculas_batch t
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE '✔ 300 Boletas electrónicas emitidas en public.facturas (B001-000001 a B001-000300)';
    END IF;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE '🎉 PROCESO COMPLETADO: 300 MATRÍCULAS INSERTADAS CON ÉXITO';
    RAISE NOTICE '=======================================================';
END $$;

-- ==============================================================================
-- ==============================================================================
-- 5. CARGA DE SESIONES Y ASISTENCIAS REALISTAS (ENERO A NOVIEMBRE)
-- Docente: Prof. Enrique Gonzales
-- Cursos: ALGEBRA (S/. 25.00), ARITMETICA (S/. 25.00), FISICA (S/. 30.00)
-- Total Sesiones: 33 sesiones escolares (3 por mes: Enero hasta Noviembre)
-- Estados: 25 Aprobadas (Meses anteriores) y 8 Pendientes (Octubre y Noviembre)
--          listas para probar el módulo de Aprobación de Asistencias.
-- ==============================================================================
DO $$
DECLARE
    v_prof_id UUID;
    v_cur_alg UUID;
    v_cur_ari UUID;
    v_cur_fis UUID;
    v_ses_id UUID;
    v_fecha DATE;
    v_inicio TIME;
    v_fin TIME;
    v_monto NUMERIC;
    v_tema TEXT;
    v_curso_nombre TEXT;
    v_cur_id UUID;
    v_estado_sesion TEXT;
    v_is_approved BOOLEAN;
    v_mes_num INT;
    v_ses_idx INT := 0;
    v_est_record RECORD;
    v_asist_id UUID;
    v_presente BOOLEAN;
    v_obs TEXT;
    v_next_e_num INT;
    v_recibo_id TEXT;
    v_random_val FLOAT;
BEGIN
    RAISE NOTICE '📋 Iniciando generación de sesiones y asistencias escolares...';

    -- 1. Obtener identificadores del docente y cursos vinculados
    SELECT id INTO v_prof_id FROM usuarios WHERE UPPER(nombre) LIKE '%ENRIQUE%' AND UPPER(apellido) LIKE '%GONZALES%' LIMIT 1;
    SELECT id INTO v_cur_alg FROM cursos WHERE UPPER(nombre) LIKE '%ALGEBRA%' LIMIT 1;
    SELECT id INTO v_cur_ari FROM cursos WHERE UPPER(nombre) LIKE '%ARITMETICA%' LIMIT 1;
    SELECT id INTO v_cur_fis FROM cursos WHERE UPPER(nombre) LIKE '%FISICA%' LIMIT 1;

    IF v_prof_id IS NULL THEN
        RAISE NOTICE '⚠️ Docente Enrique Gonzales no encontrado, omitiendo asistencias.';
        RETURN;
    END IF;

    -- Tabla temporal con las 33 sesiones programadas (3 sesiones por cada uno de los 11 meses)
    CREATE TEMP TABLE IF NOT EXISTS tmp_sesiones_batch (
        idx INT,
        mes_num INT,
        fecha DATE,
        inicio TIME,
        fin TIME,
        curso_nombre TEXT,
        curso_id UUID,
        monto NUMERIC,
        tema TEXT,
        estado TEXT -- 'APROBADO' o 'PENDIENTE'
    ) ON COMMIT DROP;

    TRUNCATE tmp_sesiones_batch;

    INSERT INTO tmp_sesiones_batch VALUES
        -- Enero (Ciclo Verano) - APROBADAS
        (1, 1, '2026-01-10', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Leyes de Exponentes y Polinomios Especiales', 'APROBADO'),
        (2, 1, '2026-01-17', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Teoría de Conjuntos y Operaciones Fundamentales', 'APROBADO'),
        (3, 1, '2026-01-24', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Análisis Dimensional y Vectores en el Plano', 'APROBADO'),

        -- Febrero - APROBADAS
        (4, 2, '2026-02-07', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Productos Notables y División Algebraica', 'APROBADO'),
        (5, 2, '2026-02-14', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Numeración y Sistemas de Conteo', 'APROBADO'),
        (6, 2, '2026-02-21', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Cinemática: MRU y MRUV', 'APROBADO'),

        -- Marzo (Inicio Ciclo Anual Regular) - APROBADAS
        (7, 3, '2026-03-07', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Factorización de Polinomios por Aspa Doble Especial', 'APROBADO'),
        (8, 3, '2026-03-14', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Cuatro Operaciones: Suma y Resta en Distintas Bases', 'APROBADO'),
        (9, 3, '2026-03-21', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Movimiento Vertical de Caída Libre (MVCL)', 'APROBADO'),

        -- Abril - APROBADAS
        (10, 4, '2026-04-11', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Fracciones Algebraicas y MCD/MCM', 'APROBADO'),
        (11, 4, '2026-04-18', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Divisibilidad: Principios y Criterios SUNAT/Admisión', 'APROBADO'),
        (12, 4, '2026-04-25', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Movimiento Parabólico de Caída Libre (MPCL)', 'APROBADO'),

        -- Mayo - APROBADAS
        (13, 5, '2026-05-09', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Radicación y Racionalización de Expresiones Irracionales', 'APROBADO'),
        (14, 5, '2026-05-16', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Números Primos y Teorema Fundamental de la Aritmética', 'APROBADO'),
        (15, 5, '2026-05-23', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Estática I: Primera Condición de Equilibrio (DCL)', 'APROBADO'),

        -- Junio - APROBADAS
        (16, 6, '2026-06-06', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Ecuaciones de Primer y Segundo Grado', 'APROBADO'),
        (17, 6, '2026-06-13', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Máximo Común Divisor y Mínimo Común Múltiplo', 'APROBADO'),
        (18, 6, '2026-06-20', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Estática II: Momento de una Fuerza y Segunda Condición', 'APROBADO'),

        -- Julio (Medio Año Intensivo) - APROBADAS
        (19, 7, '2026-07-04', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Matrices y Determinantes: Métodos de Gauss y Cramer', 'APROBADO'),
        (20, 7, '2026-07-11', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Razones y Proporciones: Aritméticas y Geométricas', 'APROBADO'),
        (21, 7, '2026-07-18', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Dinámica Lineal: Segunda Ley de Newton', 'APROBADO'),

        -- Agosto - APROBADAS
        (22, 8, '2026-08-08', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Sistema de Ecuaciones Lineales y No Lineales', 'APROBADO'),
        (23, 8, '2026-08-15', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Magnitudes Proporcionales y Reparto Proporcional', 'APROBADO'),
        (24, 8, '2026-08-22', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Trabajo Mecánico y Potencia Mecánica', 'APROBADO'),

        -- Septiembre - APROBADAS
        (25, 9, '2026-09-05', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Desigualdades e Inecuaciones de Primer y Segundo Grado', 'APROBADO'),
        (26, 9, '2026-09-12', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Regla de Tres Simple y Compuesta', 'APROBADO'),
        (27, 9, '2026-09-19', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Energía Mecánica y Conservación de la Energía', 'APROBADO'),

        -- Octubre - PENDIENTES (Para que el Administrador las apruebe en el módulo)
        (28, 10, '2026-10-03', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Funciones Reales de Variable Real: Dominio y Rango', 'PENDIENTE'),
        (29, 10, '2026-10-10', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Tanto por Ciento y Aplicaciones Comerciales', 'PENDIENTE'),
        (30, 10, '2026-10-24', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Hidrostática: Presión y Principio de Pascal/Arquímedes', 'PENDIENTE'),

        -- Noviembre - PENDIENTES (Para que el Administrador las apruebe en el módulo)
        (31, 11, '2026-11-07', '08:00', '10:00', 'ALGEBRA', v_cur_alg, 150.0, 'Logaritmos y Ecuaciones Exponenciales Avanzadas', 'PENDIENTE'),
        (32, 11, '2026-11-14', '10:15', '12:15', 'ARITMETICA', v_cur_ari, 150.0, 'Interés Simple y Compuesto / Descuento Comercial', 'PENDIENTE'),
        (33, 11, '2026-11-21', '08:00', '10:00', 'FISICA', v_cur_fis, 180.0, 'Electrostática: Ley de Coulomb y Campo Eléctrico', 'PENDIENTE');

    -- Iterar por cada una de las 33 sesiones e insertarlas
    FOR v_ses_idx IN 1..33 LOOP
        SELECT 
            mes_num, fecha, inicio, fin, curso_nombre, curso_id, monto, tema, estado
        INTO 
            v_mes_num, v_fecha, v_inicio, v_fin, v_curso_nombre, v_cur_id, v_monto, v_tema, v_estado_sesion
        FROM tmp_sesiones_batch
        WHERE idx = v_ses_idx;

        v_ses_id := gen_random_uuid();
        v_is_approved := (v_estado_sesion = 'APROBADO');

        -- Insertar en 'sesiones'
        INSERT INTO public.sesiones (
            id,
            created_at,
            id_profesor,
            fecha,
            inicio,
            fin,
            tema,
            monto,
            estado,
            curso_nombre,
            id_curso,
            cantidad_sesiones
        ) VALUES (
            v_ses_id,
            (v_fecha || ' ' || v_inicio)::TIMESTAMPTZ,
            v_prof_id,
            v_fecha,
            v_inicio,
            v_fin,
            v_tema,
            v_monto,
            v_estado_sesion,
            v_curso_nombre,
            v_cur_id,
            1
        );

        -- Registrar asistencia de estudiantes matriculados hasta esa fecha
        -- (Con un 95% de asistencia para realismo educativo)
        FOR v_est_record IN 
            SELECT id, nombre, apellido, dni 
            FROM public.estudiantes 
            WHERE created_at::date <= v_fecha
            ORDER BY created_at ASC
            LIMIT 45
        LOOP
            v_asist_id := gen_random_uuid();
            v_random_val := random();

            IF v_random_val > 0.08 THEN
                v_presente := true;
                v_obs := 'Presente';
            ELSE
                v_presente := false;
                v_obs := 'Inasistencia justificada';
            END IF;

            INSERT INTO public.asistencia_estudiantes (
                id,
                created_at,
                id_sesion,
                id_estudiante,
                estado,
                observacion
            ) VALUES (
                v_asist_id,
                (v_fecha || ' ' || v_inicio)::TIMESTAMPTZ,
                v_ses_id,
                v_est_record.id,
                v_presente,
                v_obs
            );
        END LOOP;

        -- Para las sesiones que ya fueron APROBADAS históricamente (Enero a Septiembre),
        -- registrar su Recibo por Honorarios Electrónico (E001) en 'facturas' y egreso en 'movimientos'
        IF v_is_approved THEN
            SELECT COALESCE(MAX(SUBSTRING(serieCorrelativo FROM 6)::INT), 0) + 1
            INTO v_next_e_num
            FROM (
                SELECT (detalles->>'serieCorrelativo') AS serieCorrelativo
                FROM public.facturas
                WHERE tipo = 'profesor' AND detalles->>'serieCorrelativo' LIKE 'E001-%'
            ) sub;

            IF v_next_e_num IS NULL THEN
                v_next_e_num := v_ses_idx;
            END IF;

            v_recibo_id := 'E001-' || LPAD(v_next_e_num::TEXT, 6, '0');

            -- Insertar comprobante en Bóveda SUNAT (facturas)
            INSERT INTO public.facturas (
                id,
                created_at,
                tipo,
                teacher_id,
                monto,
                concepto,
                estado,
                detalles
            ) VALUES (
                v_recibo_id,
                (v_fecha || ' ' || v_fin)::TIMESTAMPTZ,
                'profesor',
                v_prof_id,
                v_monto,
                'Recibo por Honorarios - Asistencia Aprobada: Prof. Enrique Gonzales - ' || v_curso_nombre || ' (' || v_fecha || ')',
                'emitida',
                jsonb_build_object(
                    'idSesionAsistencia', v_ses_id::TEXT,
                    'nombrePersona', 'Prof. Enrique Gonzales',
                    'dniDocente', 'DNI74892145',
                    'clasesDictadas', 1,
                    'tarifaPorClase', v_monto,
                    'serieCorrelativo', v_recibo_id,
                    'tipoComprobanteCodigo', '02',
                    'tipoComprobanteNombre', 'RECIBO POR HONORARIOS ELECTRONICO',
                    'modoTributario', 'sandbox_beta',
                    'rucEmisor', '20000000001',
                    'razonSocialEmisor', 'COLEGIO ENLACE C S.A.C.',
                    'docClienteTipo', '1',
                    'docClienteNumero', '74892145',
                    'metodoPago', 'Transferencia Bancaria',
                    'estadoSunat', 'PENDIENTE_VALIDACION',
                    'validadoSunat', false,
                    'retencionRentaMonto', ROUND(v_monto * 0.08, 2),
                    'opExonerada', v_monto,
                    'igvMonto', 0.00,
                    'montoEnLetras', 'SON ' || v_monto::TEXT || ' Y 00/100 SOLES'
                )
            ) ON CONFLICT (id) DO NOTHING;

            -- Registrar egreso en caja
            INSERT INTO public.movimientos (
                nombre,
                monto,
                fecha,
                categoria
            ) VALUES (
                'Pago Docente - Asistencia Aprobada: Prof. Enrique Gonzales (' || v_curso_nombre || ')',
                v_monto,
                (v_fecha || ' ' || v_fin)::TIMESTAMPTZ,
                'Salario Docente'
            );
        END IF;
    END LOOP;

    RAISE NOTICE '✔ 33 Sesiones y cientos de asistencias insertadas con éxito.';
    RAISE NOTICE '✔ 25 Sesiones históricas aprobadas con sus recibos E001 generados.';
    RAISE NOTICE '✔ 8 Sesiones pendientes listas en el módulo de Asistencias para aprobación en lote.';
END $$;

-- ==============================================================================
-- 6. REPORTE DE RESUMEN Y AUDITORÍA POR MES (MATRÍCULAS Y ASISTENCIAS)
-- ==============================================================================
-- Resumen de Matrículas
SELECT 
    EXTRACT(MONTH FROM created_at) AS mes_numero,
    TO_CHAR(created_at, 'TMMonth') AS mes_nombre,
    COUNT(*) AS total_matriculas,
    SUM(monto) AS total_recaudado_soles,
    MIN(created_at)::date AS primera_matricula_mes,
    MAX(created_at)::date AS ultima_matricula_mes
FROM facturas
WHERE concepto LIKE '%PREPARACION DE INGRESO%'
GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'TMMonth')
ORDER BY mes_numero;

-- Resumen de Sesiones y Asistencias de Profesores
SELECT 
    s.estado AS estado_sesion,
    COUNT(DISTINCT s.id) AS total_sesiones,
    COUNT(a.id) AS total_registros_asistencia,
    SUM(CASE WHEN a.observacion = 'Presente' THEN 1 ELSE 0 END) AS total_presentes,
    SUM(s.monto) AS total_honorarios_soles
FROM sesiones s
LEFT JOIN asistencia_estudiantes a ON a.id_sesion = s.id
GROUP BY s.estado;
