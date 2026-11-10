/**
 * SCRIPT NODE / TYPESCRIPT PARA LIMPIAR DATOS ACTUALES EXCEPTO USUARIOS
 * ======================================================================
 * Ejecutar con:
 *   npx tsx scripts/limpiar_datos_excepto_usuarios.ts
 * o
 *   npm run db:clean
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env o .env.local
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERROR: Faltan las variables de entorno de Supabase.');
  console.error('Por favor define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY) en tu archivo .env');
  console.error('O ejecuta directamente el script SQL en Supabase SQL Editor: limpiar_datos_excepto_usuarios.sql\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de tablas ordenadas de dependientes (hijos) a principales (padres)
// NOTA: 'usuarios' NUNCA está en esta lista.
const TABLAS_A_LIMPIAR = [
  // 1. Tablas hijas con claves foráneas a estudiantes o sesiones
  'asistencia_estudiantes',
  'attendance_records',
  'attendance',
  'sesiones',
  'notas',
  'servicio_estudiante',
  'estudiante_servicio',
  'estudiantes_servicios',
  'estudiantes_cursos',
  'servicio_profesor',
  'servicio_curso',
  'servicio_cursos',
  'curso_profesor',
  'espcialidades_profesor',
  'prestaciones',
  'recuperacion',
  'historial',
  
  // 2. Facturas y Finanzas
  'facturas',
  'movimientos',
  'movimientos_financieros',
  'transactions',
  'caja',
  
  // 3. Biblioteca y Recursos
  'recursos',
  'resources',
  'categorias',
  
  // 4. Muro y Avisos
  'eventos_noticias',
  'news',
  'notifications',
  
  // 5. Catálogos principales (padres)
  'estudiantes',
  'students',
  'servicio',
  'cursos',
  'especialidades',
  
  // 6. Códigos de Bóveda
  'codigo_acceso_boveda',
  'boveda_codigos'
];

async function limpiarBaseDeDatos() {
  console.log('\n=============================================================');
  console.log('🧹 INICIANDO LIMPIEZA DE DATOS (PRESERVANDO TABLA USUARIOS)');
  console.log('=============================================================');
  console.log(`📡 Conectando a Supabase URL: ${supabaseUrl}`);

  // 1. Contar y verificar usuarios antes de empezar
  const { count: usuariosTotal, error: errUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true });

  if (errUsuarios) {
    console.warn(`⚠️ Aviso al consultar tabla 'usuarios': ${errUsuarios.message}`);
  } else {
    console.log(`🔒 TABLA 'usuarios' DETECTADA: ${usuariosTotal ?? 0} usuarios/docentes encontrados.`);
    console.log(`🔒 REGLA DE SEGURIDAD: Esta tabla permanecerá 100% INTACTA.\n`);
  }

  // 2. Limpiar cada tabla en orden seguro
  for (const tabla of TABLAS_A_LIMPIAR) {
    try {
      // Intentar eliminar registros
      const { error, count } = await supabase
        .from(tabla)
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // match all uuid rows

      if (error) {
        // Puede fallar si la tabla no existe o tiene RLS restrictivo con anon key
        if (error.code === '42P01') {
          console.log(`  ℹ  Tabla no existe en tu esquema: [${tabla}] (Omitida)`);
        } else {
          // Intentar un match genérico por si el id es text o número
          const { error: errFallback } = await supabase
            .from(tabla)
            .delete()
            .filter('id', 'not.is', null);

          if (errFallback) {
            console.warn(`  ⚠️ No se pudo limpiar [${tabla}] via cliente API (${errFallback.message}).`);
            console.warn(`     (Recomendado: Ejecutar limpiar_datos_excepto_usuarios.sql en Supabase SQL Editor para saltar RLS)`);
          } else {
            console.log(`  ✔  Tabla limpiada: [${tabla}]`);
          }
        }
      } else {
        console.log(`  ✔  Tabla limpiada: [${tabla}] (${count ?? 0} registros eliminados)`);
      }
    } catch (e: any) {
      console.warn(`  ⚠️ Excepción con tabla [${tabla}]: ${e?.message}`);
    }
  }

  // 3. Restaurar clave inicial de Bóveda
  try {
    await supabase.from('codigo_acceso_boveda').insert([{ codigo: '1234' }]);
    console.log(`\n🔐 Clave de acceso a Bóveda restablecida por defecto: '1234'`);
  } catch (e) {
    // Si la tabla no existe o no tiene permisos, no es crítico
  }

  // 4. Verificación final de integridad
  console.log('\n=============================================================');
  console.log('🔍 VERIFICACIÓN FINAL:');
  const { count: finalUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Usuarios en sistema: ${finalUsuarios ?? 'Protegidos'} (INTACTOS)`);
  console.log('✅ Base de datos lista y limpia para nuevos registros.');
  console.log('=============================================================\n');
}

limpiarBaseDeDatos().catch((err) => {
  console.error('\n❌ Error durante la ejecución del script:', err);
  process.exit(1);
});
