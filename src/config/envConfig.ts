/// <reference types="vite/client" />
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
 * Mask sensitive API keys for display in developer diagnostic UI
 */
export function maskApiKey(key: string): string {
  if (!key) return 'No configurada';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

// ----------------------------------------------------------------------
// DIRECT STATIC ENVIRONMENT ACCESS FOR VITE & VERCEL BUNDLER COMPATIBILITY
// Vite's build step statically replaces `import.meta.env.VITE_*` expressions.
// Dynamic indexing or wrapped function calls inside helper functions prevent
// the bundler from inlining variable values at compile time in production!
// ----------------------------------------------------------------------

const groqApiKeyVal = sanitizeEnvValue(
  import.meta.env.VITE_GROQ_API_KEY ||
  import.meta.env.GROQ_API_KEY ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY) : '')
);

const supabaseUrlVal = sanitizeEnvValue(
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) : '')
);

const supabaseAnonKeyVal = sanitizeEnvValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : '')
);

const cloudinaryCloudNameVal = sanitizeEnvValue(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env.CLOUDINARY_CLOUD_NAME ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME) : '')
);

const cloudinaryApiKeyVal = sanitizeEnvValue(
  import.meta.env.VITE_CLOUDINARY_API_KEY ||
  import.meta.env.CLOUDINARY_API_KEY ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY) : '')
);

const cloudinaryApiSecretVal = sanitizeEnvValue(
  import.meta.env.VITE_CLOUDINARY_API_SECRET ||
  import.meta.env.CLOUDINARY_API_SECRET ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET) : '')
);

const decolectaReniecTokenVal = sanitizeEnvValue(
  import.meta.env.VITE_DECOLECTA_RENIEC_TOKEN ||
  import.meta.env.DECOLECTA_RENIEC_TOKEN ||
  import.meta.env.VITE_RENIEC_TOKEN ||
  import.meta.env.RENIEC_TOKEN ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_DECOLECTA_RENIEC_TOKEN || process.env.DECOLECTA_RENIEC_TOKEN || process.env.VITE_RENIEC_TOKEN || process.env.RENIEC_TOKEN) : '')
);

const appUrlVal = sanitizeEnvValue(
  import.meta.env.VITE_APP_URL ||
  import.meta.env.APP_URL ||
  import.meta.env.VERCEL_URL ||
  (typeof process !== 'undefined' && process.env ? (process.env.VITE_APP_URL || process.env.APP_URL || process.env.VERCEL_URL) : '')
);

/**
 * Backward compatible helper for any remaining direct callers
 */
export function getEnvVariable(...keyAliases: string[]): string {
  for (const alias of keyAliases) {
    if (alias === 'VITE_GROQ_API_KEY' || alias === 'GROQ_API_KEY') return groqApiKeyVal;
    if (alias === 'VITE_SUPABASE_URL' || alias === 'SUPABASE_URL' || alias === 'NEXT_PUBLIC_SUPABASE_URL') return supabaseUrlVal;
    if (alias === 'VITE_SUPABASE_ANON_KEY' || alias === 'SUPABASE_ANON_KEY' || alias === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') return supabaseAnonKeyVal;
    if (alias === 'VITE_CLOUDINARY_CLOUD_NAME' || alias === 'CLOUDINARY_CLOUD_NAME') return cloudinaryCloudNameVal;
    if (alias === 'VITE_CLOUDINARY_API_KEY' || alias === 'CLOUDINARY_API_KEY') return cloudinaryApiKeyVal;
    if (alias === 'VITE_CLOUDINARY_API_SECRET' || alias === 'CLOUDINARY_API_SECRET') return cloudinaryApiSecretVal;
    if (alias === 'VITE_DECOLECTA_RENIEC_TOKEN' || alias === 'DECOLECTA_RENIEC_TOKEN' || alias === 'VITE_RENIEC_TOKEN' || alias === 'RENIEC_TOKEN') return decolectaReniecTokenVal;
    if (alias === 'VITE_APP_URL' || alias === 'APP_URL' || alias === 'VERCEL_URL') return appUrlVal;
  }
  return '';
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
  groqApiKey: groqApiKeyVal,

  // Supabase Database & Auth
  supabaseUrl: supabaseUrlVal,
  supabaseAnonKey: supabaseAnonKeyVal,

  // File Storage Vault (Cloudinary)
  cloudinaryCloudName: cloudinaryCloudNameVal,
  cloudinaryApiKey: cloudinaryApiKeyVal,
  cloudinaryApiSecret: cloudinaryApiSecretVal,

  // RENIEC Decolecta Identity API
  decolectaReniecToken: decolectaReniecTokenVal,

  // Application Public Base URL
  appUrl: appUrlVal
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
