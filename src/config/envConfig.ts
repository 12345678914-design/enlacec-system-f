/**
 * Centralized Environment Configuration Loader for ENLACEC
 * Safely resolves client and server environment variables for Vercel deployment and local development.
 * Aligned with user Vercel Dashboard variables (VITE_ prefixed).
 */

function sanitizeEnvValue(val: unknown): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (
    trimmed === '' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === '""' ||
    trimmed === "''"
  ) {
    return '';
  }
  return trimmed;
}

/**
 * Safely retrieves an environment variable from import.meta.env or process.env.
 * Checks VITE_ prefixed keys first to match Vercel production setup.
 */
export function getEnvVariable(...keyAliases: string[]): string {
  // 1. Check import.meta.env (Vite client environment)
  const metaEnv = (import.meta as any)?.env || {};
  for (const alias of keyAliases) {
    if (metaEnv[alias] !== undefined) {
      const sanitized = sanitizeEnvValue(metaEnv[alias]);
      if (sanitized) return sanitized;
    }
  }

  // 2. Check global process.env if available
  if (typeof process !== 'undefined' && process && process.env) {
    for (const alias of keyAliases) {
      if (process.env[alias] !== undefined) {
        const sanitized = sanitizeEnvValue(process.env[alias]);
        if (sanitized) return sanitized;
      }
    }
  }

  return '';
}

/**
 * Mask sensitive API keys for display in developer diagnostic UI
 */
export function maskApiKey(key: string): string {
  if (!key) return 'No configurada';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export interface EnvVariableInfo {
  key: string;
  viteKey: string;
  label: string;
  category: 'IA & Chatbot' | 'Base de Datos' | 'Bóveda de Archivos' | 'Identidad & RENIEC' | 'Servidor';
  description: string;
  isConfigured: boolean;
  valueMasked: string;
  isRequired: boolean;
  usedIn: 'Cliente Frontend' | 'Backend Serverless' | 'Ambos (Full-Stack)';
  fallbackMessage: string;
}

export const envConfig = {
  // Artificial Intelligence (Groq AI)
  groqApiKey: getEnvVariable('VITE_GROQ_API_KEY', 'GROQ_API_KEY'),

  // Supabase Database & Auth
  supabaseUrl: getEnvVariable('VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnvVariable('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // File Storage Vault (Cloudinary)
  cloudinaryCloudName: getEnvVariable('VITE_CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: getEnvVariable('VITE_CLOUDINARY_API_KEY', 'CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: getEnvVariable('VITE_CLOUDINARY_API_SECRET', 'CLOUDINARY_API_SECRET'),

  // RENIEC Decolecta Identity API
  decolectaReniecToken: getEnvVariable('VITE_DECOLECTA_RENIEC_TOKEN', 'DECOLECTA_RENIEC_TOKEN', 'VITE_RENIEC_TOKEN', 'RENIEC_TOKEN'),

  // Application Public Base URL
  appUrl: getEnvVariable('VITE_APP_URL', 'APP_URL', 'VERCEL_URL')
};

/**
 * Returns diagnostic metadata for environment variables in Vercel.
 */
export function getVercelEnvDiagnostics(): EnvVariableInfo[] {
  return [
    {
      key: 'VITE_GROQ_API_KEY',
      viteKey: 'GROQ_API_KEY',
      label: 'IA Principal Groq (Llama 3.3 70B)',
      category: 'IA & Chatbot',
      description: 'Potencia el Asistente EnlaceC-Bot (Tesla), el análisis de datos escolares y la generación de resúmenes diarios.',
      isConfigured: !!envConfig.groqApiKey,
      valueMasked: maskApiKey(envConfig.groqApiKey),
      isRequired: true,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Si está ausente, el chatbot muestra un panel explicativo informativo.'
    },
    {
      key: 'VITE_SUPABASE_URL',
      viteKey: 'SUPABASE_URL',
      label: 'URL de Proyecto Supabase',
      category: 'Base de Datos',
      description: 'Endpoint REST/Realtime de tu base de datos PostgreSQL alojada en Supabase.',
      isConfigured: !!envConfig.supabaseUrl,
      valueMasked: envConfig.supabaseUrl ? envConfig.supabaseUrl : 'No configurada',
      isRequired: true,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Si está ausente, la plataforma opera en Modo Memoria Local sin interrumpir la experiencia.'
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      viteKey: 'SUPABASE_ANON_KEY',
      label: 'Clave Pública Supabase (Anon Key)',
      category: 'Base de Datos',
      description: 'Token público de autorización para consultar y sincronizar tablas en Supabase.',
      isConfigured: !!envConfig.supabaseAnonKey,
      valueMasked: maskApiKey(envConfig.supabaseAnonKey),
      isRequired: true,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Si está ausente, los datos se conservan localmente.'
    },
    {
      key: 'VITE_CLOUDINARY_CLOUD_NAME',
      viteKey: 'CLOUDINARY_CLOUD_NAME',
      label: 'Cloud Name de Cloudinary',
      category: 'Bóveda de Archivos',
      description: 'Identificador de tu cuenta Cloudinary para la Bóveda de Comprobantes y Facturas PDF.',
      isConfigured: !!envConfig.cloudinaryCloudName,
      valueMasked: envConfig.cloudinaryCloudName || 'No configurada',
      isRequired: true,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Si falta, los comprobantes se almacenan en modo local Base64.'
    },
    {
      key: 'VITE_CLOUDINARY_API_KEY',
      viteKey: 'CLOUDINARY_API_KEY',
      label: 'API Key de Cloudinary',
      category: 'Bóveda de Archivos',
      description: 'Clave pública de autenticación para la API de archivos en la nube.',
      isConfigured: !!envConfig.cloudinaryApiKey,
      valueMasked: maskApiKey(envConfig.cloudinaryApiKey),
      isRequired: true,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Sin esta clave, la bóveda genera vista previa local.'
    },
    {
      key: 'VITE_CLOUDINARY_API_SECRET',
      viteKey: 'CLOUDINARY_API_SECRET',
      label: 'API Secret de Cloudinary',
      category: 'Bóveda de Archivos',
      description: 'Firma secreta para autorizar subidas de facturas y PDF a Cloudinary.',
      isConfigured: !!envConfig.cloudinaryApiSecret,
      valueMasked: maskApiKey(envConfig.cloudinaryApiSecret),
      isRequired: true,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Sin esta clave, se guardan las boletas en PDF local.'
    },
    {
      key: 'VITE_DECOLECTA_RENIEC_TOKEN',
      viteKey: 'DECOLECTA_RENIEC_TOKEN',
      label: 'Token RENIEC Decolecta API',
      category: 'Identidad & RENIEC',
      description: 'Permite autocompletar nombres reales a partir de DNI peruano en la matrícula.',
      isConfigured: !!envConfig.decolectaReniecToken,
      valueMasked: maskApiKey(envConfig.decolectaReniecToken),
      isRequired: false,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Si no está presente, la matrícula utiliza el motor de simulación de nombres inteligente.'
    },
    {
      key: 'APP_URL',
      viteKey: 'VITE_APP_URL',
      label: 'URL Pública de la Aplicación',
      category: 'Servidor',
      description: 'URL principal de la aplicación en producción Vercel.',
      isConfigured: !!envConfig.appUrl,
      valueMasked: envConfig.appUrl || 'No configurada',
      isRequired: false,
      usedIn: 'Cliente Frontend',
      fallbackMessage: 'Usa la dirección por defecto del servidor.'
    }
  ];
}

/**
 * Perform real-time client environment diagnosis in Vite SPA mode (No serverless required)
 */
export async function checkServerlessHealth() {
  const diagnostics = getVercelEnvDiagnostics();
  const configuredCount = diagnostics.filter(d => d.isConfigured).length;
  
  return {
    success: true,
    data: {
      status: "ok",
      mode: "Cliente Frontend SPA Vercel (Sin Serverless /api)",
      timestamp: new Date().toISOString(),
      services: {
        groq_ai: { configured: !!envConfig.groqApiKey },
        cloudinary: { configured: !!envConfig.cloudinaryCloudName },
        decolecta_reniec: { configured: !!envConfig.decolectaReniecToken },
        supabase: { configured: !!(envConfig.supabaseUrl && envConfig.supabaseAnonKey) }
      },
      configuredCount,
      totalCount: diagnostics.length
    }
  };
}
