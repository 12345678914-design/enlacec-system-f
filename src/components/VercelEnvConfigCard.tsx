import React, { useState, useEffect } from 'react';
import { 
  getVercelEnvDiagnostics, 
  checkServerlessHealth, 
  EnvVariableInfo, 
  envConfig 
} from '../config/envConfig';
import { 
  Copy, 
  Check, 
  Server, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Code, 
  Sparkles, 
  Cpu, 
  Database, 
  FileText, 
  UserCheck, 
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const VercelEnvConfigCard: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [serverHealthResult, setServerHealthResult] = useState<any>(null);

  const diagnostics = getVercelEnvDiagnostics();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllForVercel = () => {
    const lines = diagnostics.map(d => `# ${d.label} (${d.category})\n${d.key}=""\n${d.viteKey}=""`).join('\n\n');
    navigator.clipboard.writeText(lines);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const runHealthCheck = async () => {
    setIsTestingHealth(true);
    setServerHealthResult(null);
    const result = await checkServerlessHealth();
    setServerHealthResult(result);
    setIsTestingHealth(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const categories = ['Todas', 'IA & Chatbot', 'Base de Datos', 'Bóveda de Archivos', 'Identidad & RENIEC'];

  const filteredDiagnostics = activeCategory === 'Todas' 
    ? diagnostics 
    : diagnostics.filter(d => d.category === activeCategory);

  const configuredCount = diagnostics.filter(d => d.isConfigured).length;
  const totalCount = diagnostics.length;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'IA & Chatbot': return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
      case 'Base de Datos': return <Database className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Bóveda de Archivos': return <FileText className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Identidad & RENIEC': return <UserCheck className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Cpu className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden font-sans my-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Server className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-cyan-400 border border-cyan-500/30">
                <Server className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Variables de Entorno para Vercel
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide">
                    Vercel Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Panel interactivo para configurar y diagnosticar claves en producción sin caídas de UI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={runHealthCheck}
                disabled={isTestingHealth}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingHealth ? 'animate-spin' : ''}`} />
                {isTestingHealth ? 'Diagnosticando...' : 'Diagnosticar Variables (Vite SPA)'}
              </button>

              <button
                type="button"
                onClick={handleCopyAllForVercel}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedAll ? '¡Copiado Todo!' : 'Copiar para Vercel'}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Estado General</div>
                <div className="font-bold text-emerald-300">
                  {configuredCount} / {totalCount} Configurar
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Motor IA</div>
                <div className="font-bold text-purple-300">
                  {envConfig.groqApiKey ? 'Groq Llama 3.3 Active' : 'Fallback Modo Guía'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Base de Datos</div>
                <div className="font-bold text-cyan-300">
                  {envConfig.supabaseUrl ? 'Supabase Conectado' : 'Modo Cache Offline'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Bóveda PDF</div>
                <div className="font-bold text-amber-300">
                  {envConfig.cloudinaryCloudName ? 'Cloudinary Cloud' : 'PDF Local Base64'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Serverless Live Diagnostic Result Banner */}
      <AnimatePresence>
        {serverHealthResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 border-b text-xs flex items-start gap-3 ${
              serverHealthResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200'
            }`}
          >
            {serverHealthResult.success ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <div className="font-bold flex items-center justify-between">
                <span>
                  {serverHealthResult.success 
                    ? '✔️ Modo SPA Cliente Activo en Vercel (100% Sin Serverless /api)' 
                    : '⚠️ Conexión con el Diagnóstico de Cliente no disponible'}
                </span>
                <span className="font-mono text-[10px] opacity-80">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              {serverHealthResult.success && serverHealthResult.data && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-1.5 rounded bg-white/60 dark:bg-zinc-900/60 border border-emerald-200/50 dark:border-emerald-800/50">
                    <span className="font-bold block text-gray-500">Groq IA:</span>
                    <span>{serverHealthResult.data.services?.groq_ai?.configured ? '✅ Activo' : '❌ Ausente'}</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/60 dark:bg-zinc-900/60 border border-emerald-200/50 dark:border-emerald-800/50">
                    <span className="font-bold block text-gray-500">Cloudinary:</span>
                    <span>{serverHealthResult.data.services?.cloudinary?.configured ? '✅ Activo' : '❌ Ausente'}</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/60 dark:bg-zinc-900/60 border border-emerald-200/50 dark:border-emerald-800/50">
                    <span className="font-bold block text-gray-500">RENIEC Token:</span>
                    <span>{serverHealthResult.data.services?.decolecta_reniec?.configured ? '✅ Activo' : '❌ Ausente'}</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/60 dark:bg-zinc-900/60 border border-emerald-200/50 dark:border-emerald-800/50">
                    <span className="font-bold block text-gray-500">Supabase:</span>
                    <span>{serverHealthResult.data.services?.supabase?.configured ? '✅ Activo' : '❌ Ausente'}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-750'
              }`}
            >
              {getCategoryIcon(cat)}
              {cat}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          Soporta nombres estándar y con prefijo <code className="bg-gray-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold text-indigo-600 dark:text-indigo-400">VITE_</code>
        </div>
      </div>

      {/* Variables List */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {filteredDiagnostics.map((item) => (
            <div
              key={item.key}
              className={`p-4 rounded-2xl border transition-all ${
                item.isConfigured
                  ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-emerald-400/50 dark:hover:border-emerald-500/50'
                  : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/30'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Left Info */}
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1 rounded bg-gray-100 dark:bg-zinc-800">
                      {getCategoryIcon(item.category)}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                    {item.isRequired ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        Requerida
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                        Opcional
                      </span>
                    )}
                    <span className="text-[9px] font-medium text-gray-400 font-mono">
                      {item.usedIn}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Fallback Graceful Message if missing */}
                  {!item.isConfigured && (
                    <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300/50 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Manejo de Fallback Seguro:</strong> {item.fallbackMessage}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Actions & Key Copying */}
                <div className="space-y-2 text-right shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    {item.isConfigured ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 border border-emerald-300/50 dark:border-emerald-800">
                        <Check className="w-3 h-3" /> Configurada
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 border border-amber-300/50 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3" /> Sin Configurar
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg">
                    {item.valueMasked}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.key, `${item.key}-std`)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-[11px] font-bold transition-all flex items-center gap-1"
                      title="Copiar nombre estándar para Vercel"
                    >
                      {copiedKey === `${item.key}-std` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{item.key}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.viteKey, `${item.key}-vite`)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800/50"
                      title="Copiar nombre con prefijo VITE_ para bundle frontend"
                    >
                      {copiedKey === `${item.key}-vite` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{item.viteKey}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="p-4 bg-gray-50 dark:bg-zinc-900/80 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-500" />
          <span>
            Para modificar variables en Vercel, ve a <strong>Project Settings -&gt; Environment Variables</strong> y guarda tus cambios.
          </span>
        </div>

        <a
          href="https://vercel.com/docs/projects/environment-variables"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
        >
          Documentación Vercel <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
