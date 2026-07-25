import { createClient } from '@supabase/supabase-js';
import { envConfig } from '../config/envConfig';

const supabaseUrl = envConfig.supabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envConfig.supabaseAnonKey || 'placeholder-anon-key';
const isRealConfig = !!(envConfig.supabaseUrl && envConfig.supabaseAnonKey);

// Beautiful console log formatting
const logPrefix = '%c[Supabase Client]';
const successStyle = 'background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
const infoStyle = 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
const warnStyle = 'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
const errorStyle = 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';

console.groupCollapsed(`${logPrefix} Configurando Inicialización...`, 'color: #3b82f6; font-weight: bold;');
console.log(`${logPrefix} URL configurada:`, infoStyle, supabaseUrl ? 'SÍ ✔️' : 'NO ❌');
console.log(`${logPrefix} Anon Key configurada:`, infoStyle, supabaseAnonKey ? 'SÍ ✔️' : 'NO ❌');
if (supabaseUrl) {
  console.log(`${logPrefix} Endpoint:`, 'color: #888;', supabaseUrl);
}
console.groupEnd();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    `${logPrefix} %cAtención: Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. La aplicación se ejecutará de forma segura en Modo Local utilizando memoria caché persistente.`,
    warnStyle,
    'color: inherit;'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Global status object for console debugging
(window as any).supabaseDiagnostics = {
  initializedAt: new Date().toISOString(),
  urlConfigured: !!supabaseUrl,
  anonKeyConfigured: !!supabaseAnonKey,
  status: 'pending',
  connectionTestResult: null
};

// Async verification test on load
async function verifySupabaseConnection() {
  if (!isRealConfig) {
    (window as any).supabaseDiagnostics.status = 'local_fallback';
    (window as any).supabaseDiagnostics.details = 'Using offline local storage because credentials are empty.';
    return;
  }

  try {
    console.log(`${logPrefix} %cIniciando prueba de conectividad y comprobación de esquemas...`, infoStyle, 'color: inherit;');
    
    // Test table 1: estudiantes
    const startTime = performance.now();
    const { data: estData, error: estError } = await supabase.from('estudiantes').select('id').limit(1);
    const duration = (performance.now() - startTime).toFixed(1);

    if (estError) {
      console.warn(
        `${logPrefix} %cComprobación 'estudiantes' (Español): No disponible o sin permisos. Código: ${estError.code}. Mensaje: ${estError.message}`,
        warnStyle,
        'color: inherit;'
      );

      // Attempt table 2: students (English version)
      const { data: stdData, error: stdError } = await supabase.from('students').select('id').limit(1);
      
      if (stdError) {
        console.warn(
          `${logPrefix} %cAtención de Conexión: No se pudo acceder a 'estudiantes' ni 'students' en Supabase. Se utilizará modo local.`,
          warnStyle,
          'color: inherit;'
        );
        console.warn(`${logPrefix} Detalle de la respuesta de students:`, stdError?.message || stdError);
        
        (window as any).supabaseDiagnostics.status = 'local_fallback';
        (window as any).supabaseDiagnostics.error = {
          estudiantes: estError.message,
          students: stdError.message
        };
      } else {
        console.log(
          `${logPrefix} %c¡Conexión Exitosa con esquema en INGLÉS! Tabla 'students' encontrada y accesible (${duration}ms).`,
          successStyle,
          'color: inherit;'
        );
        (window as any).supabaseDiagnostics.status = 'connected';
        (window as any).supabaseDiagnostics.schema = 'english';
        (window as any).supabaseDiagnostics.latencyMs = Number(duration);
      }
    } else {
      console.log(
        `${logPrefix} %c¡Conexión Exitosa con esquema en ESPAÑOL! Tabla 'estudiantes' encontrada y accesible (${duration}ms).`,
        successStyle,
        'color: inherit;'
      );
      (window as any).supabaseDiagnostics.status = 'connected';
      (window as any).supabaseDiagnostics.schema = 'spanish';
      (window as any).supabaseDiagnostics.latencyMs = Number(duration);
    }
  } catch (err: any) {
    console.error(`${logPrefix} %cError inesperado durante el health check de Supabase:`, errorStyle, err);
    (window as any).supabaseDiagnostics.status = 'exception';
    (window as any).supabaseDiagnostics.exception = err?.message || err;
  }
}

// Execute connection verification on script load
verifySupabaseConnection();
