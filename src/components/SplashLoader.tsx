import React, { useState, useEffect } from 'react';
import { EnlaceCIcon } from './EnlaceCIcon';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, FlaskConical, GraduationCap } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SplashLoaderProps {
  onComplete: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Safely attempt to read context
  let appCtx: any = null;
  try {
    appCtx = useApp();
  } catch (e) {
    // Ignore error and fall back
  }
  const theme = appCtx?.theme;

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (!theme?.mode) {
      // Safe fallback to check DOM class or media query
      const isHtmlDark = document.documentElement.classList.contains('dark');
      if (isHtmlDark) {
        setIsDark(true);
      } else {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);
      }
      return;
    }

    if (theme.mode === 'dark') {
      setIsDark(true);
    } else if (theme.mode === 'light') {
      setIsDark(false);
    } else {
      // system mode - listen to system media query
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme?.mode]);

  const loadingTexts = [
    "Inicializando plataforma de élite...",
    "Configurando laboratorios interactivos de física...",
    "Calibrando canal neuronal de IA Tesla...",
    "Sincronizando bases de datos curriculares...",
    "Preparando pizarras interactivas de precisión...",
    "¡Todo listo! Bienvenido a ENLACEC..."
  ];

  useEffect(() => {
    // Progress incrementation
    const duration = 2200; // 2.2 seconds total duration
    const intervalTime = 30;
    const steps = duration / intervalTime;
    const stepIncrement = 100 / steps;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsDone(true);
          setTimeout(() => {
            onComplete();
          }, 600); // short delay after hitting 100% to let users admire "done" state
          return 100;
        }
        return Math.min(prev + stepIncrement, 100);
      });
    }, intervalTime);

    // Dynamic text cycle matching progress
    const textInterval = setInterval(() => {
      setLoadingTextIndex((prev) => {
        if (prev < loadingTexts.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, duration / (loadingTexts.length - 1));

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden font-sans select-none transition-colors duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background ambient glowing mesh gradients */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.45, 0.3],
          x: [-50, 50, -50],
          y: [-50, 50, -50]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/15'} rounded-full blur-[140px] pointer-events-none`}
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.4, 0.3],
          x: [50, -50, 50],
          y: [50, -50, 50]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-400/12'} rounded-full blur-[140px] pointer-events-none`}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6">
        
        {/* Glowing Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="relative mb-8"
        >
          {/* Pulsing Backlight */}
          <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/25' : 'bg-indigo-400/20'} blur-3xl rounded-full animate-pulse scale-110`} />
          
          <div className={`p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200/80 shadow-md'} border backdrop-blur-xl rounded-[32px] shadow-2xl relative flex items-center justify-center h-32 w-32 transition-all duration-500`}>
            <EnlaceCIcon className={`w-20 h-20 ${isDark ? 'text-white' : 'text-indigo-600'} transition-colors duration-500`} />
          </div>

          {/* Sparkles / Small Floating Elements around Logo */}
          <motion.div
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-3 -right-3 text-cyan-500"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -bottom-2 -left-3 text-emerald-500"
          >
            <FlaskConical className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Company Name with Elegant Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-1.5 mb-8"
        >
          <h1 className={`text-xl font-extrabold tracking-[0.25em] ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-100' : 'text-slate-900'} transition-all duration-500`}>
            ACADEMIA ENLACEC
          </h1>
          <p className={`text-[10px] uppercase font-black tracking-[0.45em] ${isDark ? 'text-cyan-400' : 'text-indigo-600'} font-mono transition-colors duration-500`}>
            EXCELENCIA CIENTÍFICA
          </p>
        </motion.div>

        {/* Progress Bar & Loader Information */}
        <div className="w-64 space-y-3.5">
          {/* Percentage */}
          <div className={`flex justify-between items-center text-[11px] font-mono font-bold ${isDark ? 'text-indigo-200/90' : 'text-slate-600'} transition-colors duration-500`}>
            <span className="flex items-center gap-1">
              <BrainCircuit className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'} animate-spin`} style={{ animationDuration: '4s' }} />
              <span>SISTEMA INTELIGENTE</span>
            </span>
            <span className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} tracking-wider transition-colors duration-500`}>{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className={`h-1.5 w-full ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-200 border-slate-300/40'} rounded-full border p-[2px] overflow-hidden transition-all duration-500`}>
            <motion.div
              layout
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          {/* Loading status messages */}
          <div className="h-8 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingTextIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className={`text-[11px] font-semibold ${isDark ? 'text-gray-400/90' : 'text-slate-500'} tracking-wide text-center transition-colors duration-500`}
              >
                {loadingTexts[loadingTextIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Futuristic bottom decorations */}
      <div className={`absolute bottom-6 left-6 right-6 flex justify-between text-[9px] font-mono ${isDark ? 'text-zinc-650' : 'text-slate-400'} font-bold tracking-wider uppercase transition-colors duration-500`}>
        <span className="flex items-center gap-1.5">
          <GraduationCap className={`w-4 h-4 ${isDark ? 'text-zinc-600' : 'text-slate-400'} transition-colors duration-500`} />
          <span>Ingreso Asegurado</span>
        </span>
        <span>Módulo de Admisión v1.2</span>
      </div>
    </div>
  );
};
