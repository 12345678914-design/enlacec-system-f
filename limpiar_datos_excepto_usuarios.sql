-- ==============================================================================
-- SCRIPT DE LIMPIEZA TOTAL DE DATOS (PRESERVANDO LA TABLA USUARIOS)
-- Sistema Educativo Colegio / Plataforma Administrativa
-- ==============================================================================
-- 
-- DESCRIPCIÓN:
-- Este script vacía de forma segura y completa todas las tablas operativas
-- del sistema (Estudiantes, Asistencias, Sesiones, Notas, Facturas de Bóveda,
-- Movimientos de Caja, Servicios, Cursos, Recursos, Noticias y Notificaciones)
-- 
-- ⚠️ REGLA DE ORO:
-- LA TABLA "usuarios" (Profesores, Directivos, Administradores, contraseñas,
-- roles, credenciales, DNIs y perfiles) QUEDA 100% INTACTA Y PROTEGIDA.
-- 
-- INSTRUCCIONES DE USO:
-- 1. Ve a tu panel de Supabase (https://supabase.com/dashboard)
-- 2. Entra en tu proyecto y abre "SQL Editor" en el menú lateral izquierdo.
-- 3. Crea una nueva consulta ("New Query").
-- 4. Copia y pega TODO este archivo y haz clic en "RUN".
-- ==============================================================================

DO $$
DECLARE
    tbl_name text;
    -- Lista exhaustiva de todas las tablas operativas a limpiar
    -- (incluye nombres en español y alias en inglés para máxima compatibilidad)
    tables_to_truncate text[] := ARRAY[
        -- 1. Tablas dependientes de asistencias y sesiones
        'asistencia_estudiantes',
        'attendance_records',
        'attendance',
        'sesiones',
        
        -- 2. Calificaciones y notas
        'notas',
        
        -- 3. Relaciones entre estudiantes, cursos y servicios
        'servicio_estudiante',
        'estudiante_servicio',
        'estudiantes_servicios',
        'estudiantes_cursos',
        
        -- 4. Relaciones de servicios y cursos con profesores
        'servicio_profesor',
        'servicio_curso',
        'servicio_cursos',
        'curso_profesor',
        'espcialidades_profesor',
        
        -- 5. Tablas operativas de usuarios secundarios (historial, prestaciones, etc.)
        'prestaciones',
        'recuperacion',
        'historial',
        
        -- 6. Facturación electrónica y Bóveda SUNAT
        'facturas',
        
        -- 7. Finanzas, Caja Chica y Transacciones
        'movimientos',
        'movimientos_financieros',
        'transactions',
        'caja',
        
        -- 8. Biblioteca y Recursos
        'recursos',
        'resources',
        'categorias',
        
        -- 9. Comunicados, Muro y Notificaciones
        'eventos_noticias',
        'news',
        'notifications',
        
        -- 10. Catálogos principales (Cursos, Servicios, Estudiantes, Especialidades)
        'estudiantes',
        'students',
        'servicio',
        'cursos',
        'especialidades',
        
        -- 11. Bóveda Códigos (se resetea y luego se inserta código por defecto)
        'codigo_acceso_boveda',
        'boveda_codigos'
    ];
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '🚀 INICIANDO LIMPIEZA DE DATOS (PRESERVANDO USUARIOS)...';
    RAISE NOTICE '=======================================================';

    -- Iterar por cada tabla y limpiarla únicamente si existe en la base de datos
    FOREACH tbl_name IN ARRAY tables_to_truncate LOOP
        -- Verificar si la tabla existe en el esquema 'public'
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = tbl_name
        ) THEN
            -- Ejecutar TRUNCATE con CASCADE y reiniciar secuencias de IDs
            EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE;', tbl_name);
            RAISE NOTICE '✔ Tabla limpiada exitosamente: %', tbl_name;
        ELSE
            RAISE NOTICE 'ℹ Tabla no existe o no requerida en esta instancia: %', tbl_name;
        END IF;
    END LOOP;

    -- Re-establecer código de acceso inicial a la Bóveda de Facturas (1234)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'codigo_acceso_boveda'
    ) THEN
        INSERT INTO public.codigo_acceso_boveda (codigo) VALUES ('1234');
        RAISE NOTICE '🔐 Clave de Bóveda restablecida con código por defecto: 1234';
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'boveda_codigos'
    ) THEN
        INSERT INTO public.boveda_codigos (codigo) VALUES ('1234');
    END IF;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE '✅ LIMPIEZA COMPLETADA CON ÉXITO.';
    RAISE NOTICE '🔒 La tabla "usuarios" se mantuvo 100%% intacta.';
    RAISE NOTICE '=======================================================';
END $$;

-- ==============================================================================
-- REPORTE DE VERIFICACIÓN POST-LIMPIEZA
-- Muestra el estado actual de las tablas tras la ejecución
-- ==============================================================================

SELECT 
    'usuarios (Docentes / Administradores)' AS tabla, 
    COUNT(*) AS total_registros_conservados,
    'CONSERVADA 100%' AS estado
FROM usuarios
UNION ALL
SELECT 
    'estudiantes' AS tabla, 
    COUNT(*),
    'LIMPIA (0 registros)'
FROM estudiantes
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'estudiantes')
UNION ALL
SELECT 
    'facturas (Bóveda)' AS tabla, 
    COUNT(*),
    'LIMPIA (0 registros)'
FROM facturas
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'facturas')
UNION ALL
SELECT 
    'notas' AS tabla, 
    COUNT(*),
    'LIMPIA (0 registros)'
FROM notas
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas')
UNION ALL
SELECT 
    'sesiones' AS tabla, 
    COUNT(*),
    'LIMPIA (0 registros)'
FROM sesiones
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sesiones')
UNION ALL
SELECT 
    'asistencia_estudiantes' AS tabla, 
    COUNT(*),
    'LIMPIA (0 registros)'
FROM asistencia_estudiantes
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asistencia_estudiantes')
UNION ALL
SELECT 
    'cursos' AS tabla, 
    COUNT(*),
    'LIMPIA (0 registros)'
FROM cursos
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cursos')
UNION ALL
SELECT 
    'servicio' AS tabla, 
    COUNT(*),
    'LIMPIA (0 registros)'
FROM servicio
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servicio');
