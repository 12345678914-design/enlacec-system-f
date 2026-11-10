import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const groqKey =
    process.env.VITE_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.VITE_GROK_API_KEY ||
    process.env.GROK_API_KEY ||
    env.VITE_GROQ_API_KEY ||
    env.GROQ_API_KEY ||
    env.VITE_GROK_API_KEY ||
    env.GROK_API_KEY ||
    '';

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'GROQ_', 'GROK_', 'GEMINI_', 'CLOUDINARY_', 'DECOLECTA_', 'SUPABASE_', 'APP_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.VITE_GROQ_API_KEY': JSON.stringify(groqKey),
      'process.env.GROQ_API_KEY': JSON.stringify(groqKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
