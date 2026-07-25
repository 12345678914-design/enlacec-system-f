/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, AlertTriangle, CloudLightning } from 'lucide-react';

interface UploadProgressModalProps {
  isOpen: boolean;
  progress: number;
  title: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  progress,
  title,
  status
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-gray-150 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden"
          >
            {/* Upper aesthetic tech accent */}
            <div className="flex justify-between items-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-mono">
                <CloudLightning className="w-3.5 h-3.5 animate-pulse" />
                <span>Almacenamiento Cloud</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                PROCESANDO...
              </span>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 my-2">
              {/* Status Visualizer */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800">
                {status === 'uploading' && (
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                )}
                {status === 'success' && (
                  <motion.div
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <AlertTriangle className="w-9 h-9 text-red-500 animate-bounce" />
                  </motion.div>
                )}
              </div>

              {/* Informational Texts */}
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {status === 'uploading' && 'Subiendo archivo...'}
                  {status === 'success' && '¡Carga completada!'}
                  {status === 'error' && 'Error al subir archivo'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium px-4">
                  {title}
                </p>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="w-full space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400 dark:text-zinc-500 font-mono">Progreso</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {progress}%
                  </span>
                </div>
                
                <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      status === 'error'
                        ? 'from-red-500 to-rose-600'
                        : status === 'success'
                        ? 'from-emerald-500 to-teal-500'
                        : 'from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-cyan-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Bottom info banner */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              <span>Sincronización segura vía Supabase</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
