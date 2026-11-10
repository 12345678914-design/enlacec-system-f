/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, Check, Database } from 'lucide-react';

interface ReloadSupabaseButtonProps {
  label?: string;
  compact?: boolean;
  className?: string;
  onReloaded?: () => void;
  showDatabaseBadge?: boolean;
}

export const ReloadSupabaseButton: React.FC<ReloadSupabaseButtonProps> = ({
  label = 'Recargar',
  compact = false,
  className = '',
  onReloaded,
  showDatabaseBadge = false
}) => {
  const { reloadAllData, addNotification } = useApp();
  const [isReloading, setIsReloading] = useState(false);
  const [justReloaded, setJustReloaded] = useState(false);

  const handleReload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isReloading) return;

    setIsReloading(true);
    try {
      if (reloadAllData) {
        await reloadAllData();
      }
      setJustReloaded(true);
      if (onReloaded) {
        onReloaded();
      }
      addNotification({
        title: '🔄 Sincronización Exitosa',
        content: 'Datos actualizados en tiempo real desde Supabase.',
        type: 'info'
      });
      setTimeout(() => setJustReloaded(false), 2500);
    } catch (err: any) {
      console.warn('Error al recargar desde Supabase:', err);
      addNotification({
        title: '⚠️ Aviso de Sincronización',
        content: 'No se pudo conectar a Supabase. Se mantuvieron los datos en caché local.',
        type: 'warning'
      });
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleReload}
      disabled={isReloading}
      title="Recargar y sincronizar datos en tiempo real desde Supabase"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs select-none disabled:opacity-60 disabled:cursor-not-allowed ${
        justReloaded
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          : 'bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 text-black dark:text-white border-gray-200 dark:border-zinc-700'
      } ${className}`}
    >
      {justReloaded ? (
        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
      ) : (
        <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 ${isReloading ? 'animate-spin' : ''}`} />
      )}

      {!compact && (
        <span>
          {isReloading ? 'Recargando...' : justReloaded ? '¡Actualizado!' : label}
        </span>
      )}

      {showDatabaseBadge && !compact && (
        <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 bg-gray-100 dark:bg-zinc-900 rounded text-gray-500">
          <Database className="w-2.5 h-2.5 text-emerald-500" />
          Supabase
        </span>
      )}
    </button>
  );
};
