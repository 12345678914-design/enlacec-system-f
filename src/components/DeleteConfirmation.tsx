/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationProps {
  name: string;
  type: 'student' | 'teacher' | 'resource';
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ name, type, onConfirm, onCancel }) => {
  const typeLabel = type === 'student' ? 'estudiante' : type === 'teacher' ? 'docente' : 'recurso';
  const warningText = type === 'student' 
    ? 'Esta acción eliminará de forma permanente al estudiante, eliminando también su registro de calificaciones y asistencias.'
    : type === 'teacher'
    ? 'Esta acción dará de baja y removerá al docente del sistema de manera definitiva, afectando a sus cursos asignados.'
    : 'Esta carpeta o archivo se eliminará de forma permanente de los recursos compartidos del colegio.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-950/20 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative overflow-hidden"
      >
        {/* Decorative background warning glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-red-500/5 rounded-full blur-2xl" />

        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-xl text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-extrabold text-base text-gray-900 dark:text-zinc-50 tracking-tight leading-tight">
            ¿Confirmas eliminar este {typeLabel}?
          </h3>
          
          <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 break-words leading-tight">
              {name}
            </p>
            <span className="text-[9px] font-mono font-bold uppercase text-indigo-500 dark:text-indigo-400 mt-1 inline-block bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
              {typeLabel}
            </span>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
            {warningText}
          </p>
        </div>

        <div className="flex gap-2.5 pt-5 mt-4 border-t border-gray-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-bold text-gray-650 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Sí, eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
