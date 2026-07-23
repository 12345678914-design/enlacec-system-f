/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getThemeClasses } from '../lib/themeUtils';
import { EnlaceCIcon } from './EnlaceCIcon';
import { Key, LogIn, Phone } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onBackToWelcome?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBackToWelcome }) => {
  const { login, theme } = useApp();
  const cl = getThemeClasses(theme.accentColor);
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone) {
      setError('Por favor, ingresa tu número de teléfono.');
      return;
    }

    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    
    // Create a realistic delay for beautiful loading spinner effect
    setTimeout(() => {
      const success = login(phone, password);
      setLoading(false);
      if (!success) {
        setError('Credenciales inválidas. Verifica tu número de teléfono y contraseña.');
      }
    }, 600);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${cl.appBg} p-4 transition-colors duration-300 relative overflow-hidden font-sans`}>
      
      {/* Dynamic background accents (mesh gradients) */}
      <div className={`absolute top-[-150px] left-[-150px] w-[500px] h-[500px] ${cl.meshBg1} rounded-full blur-[110px] pointer-events-none z-0`}></div>
      <div className={`absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] ${cl.meshBg2} rounded-full blur-[110px] pointer-events-none z-0`}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 35 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        {/* Top brand header */}
        <div className={`bg-gradient-to-r ${cl.gradient} p-7 text-white relative`}>
          {onBackToWelcome && (
            <button
              id="login-btn-back-to-welcome"
              type="button"
              onClick={onBackToWelcome}
              className="absolute top-4 left-4 bg-white/10 hover:bg-white/25 active:scale-95 transition-all border border-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 select-none cursor-pointer"
            >
              ← Volver
            </button>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg shadow-black/5 flex items-center justify-center">
              <EnlaceCIcon className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ENLACEC</h1>
          </div>
          <p className="text-white/80 text-xs leading-normal">
            Acceso unificado al sistema escolar mediante autenticación directa de usuarios.
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 text-xs text-red-650 dark:text-red-400 bg-red-500/10 backdrop-blur-md rounded-xl border border-red-500/20 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-550 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">
                Número de Teléfono
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  id="login-phone-input"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 900000000 o 954123456"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-250/20 dark:border-white/10 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-550 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-250/20 dark:border-white/10 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3 h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:shadow-xl hover:brightness-105 active:scale-98 ${cl.primaryBg}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
