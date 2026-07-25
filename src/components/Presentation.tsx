/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getThemeClasses } from '../lib/themeUtils';
import { EnlaceCIcon } from './EnlaceCIcon';
import { 
  Sparkles, 
  ArrowRight, 
  Shield, 
  BookOpen, 
  Layers, 
  TrendingUp, 
  FlaskConical, 
  PenTool, 
  Users, 
  Wallet, 
  ChevronRight, 
  Cpu, 
  GraduationCap, 
  Compass, 
  Ruler, 
  CheckCircle2, 
  Calendar,
  Sparkle,
  Award,
  Globe,
  FileText,
  Clock,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PresentationProps {
  onStartLogin: () => void;
}

export const Presentation: React.FC<PresentationProps> = ({ onStartLogin }) => {
  const { theme } = useApp();
  const cl = getThemeClasses(theme.accentColor);
  
  // Interactive marketing options
  const [activeTab, setActiveTab] = useState<'labs' | 'tesla' | 'curriculum'>('labs');
  const [degreeLevel, setDegreeLevel] = useState<'high' | 'tech' | 'olympiad'>('tech');
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [showOfferAlert, setShowOfferAlert] = useState<boolean>(true);

  // Dynamic values based on tuition simulator
  const getTuitionEstimation = () => {
    let base = 1200;
    if (degreeLevel === 'high') base = 950;
    if (degreeLevel === 'olympiad') base = 1500;
    
    const discount = durationMonths >= 12 ? 0.20 : durationMonths >= 6 ? 0.10 : 0;
    const finalAmount = (base * durationMonths * (1 - discount)).toFixed(2);
    const monthlyPayment = (parseFloat(finalAmount) / durationMonths).toFixed(2);
    
    return {
      total: finalAmount,
      monthly: monthlyPayment,
      saved: (base * durationMonths * discount).toFixed(2),
      discountPercentage: discount * 100
    };
  };

  const tuition = getTuitionEstimation();

  // Bullet points for why to join ENLACEC
  const academyPerks = [
    {
      icon: <Award className="w-5 h-5 text-indigo-500" />,
      title: "Certificación Científica Oficial",
      desc: "Todas nuestras rutas cuentan con validez curricular internacional y convenios de ingreso directo a universidades de ingeniería."
    },
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      title: "Clases guiadas por IA Tesla",
      desc: "Cada estudiante dispone de Tesla, un tutor analítico con red de conocimiento profundo para resolver dudas de física, química y matemáticas en segundos."
    },
    {
      icon: <FlaskConical className="w-5 h-5 text-emerald-500" />,
      title: "Laboratorios Virtuales Propios",
      desc: "Simuladores cinemáticos interactivos, tablas periódicas integradas, y tableros interactivos para pruebas experimentales."
    },
    {
      icon: <Wallet className="w-5 h-5 text-amber-500" />,
      title: "Sistema de Becas al Talento",
      desc: "Financiamiento inmediato de hasta el 50% de la matrícula aplicando en nuestra prueba de suficiencia académica."
    }
  ];

  return (
    <div className={`min-h-screen ${cl.appBg} text-gray-950 dark:text-zinc-50 transition-colors duration-300 relative overflow-x-hidden font-sans pb-24`}>
      
      {/* BACKGROUND GRAPHIC AMBIENCE */}
      {/* Top radial mesh */}
      <motion.div 
        animate={{ 
          scale: [1, 1.08, 1],
          x: [0, 15, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-[-300px] left-[-150px] w-[800px] h-[800px] ${cl.meshBg1} rounded-full blur-[140px] pointer-events-none z-0 opacity-80`}
      />
      {/* Mid mesh */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          x: [0, -30, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={`absolute top-[35%] right-[-150px] w-[700px] h-[700px] ${cl.meshBg2} rounded-full blur-[130px] pointer-events-none z-0 opacity-70`}
      />
      {/* Bottom mesh */}
      <div className={`absolute bottom-[-100px] left-[5%] w-[600px] h-[600px] ${cl.meshBg3} rounded-full blur-[120px] pointer-events-none z-0 opacity-60`} />

      {/* Floating Ambient Atoms Icons with hover reactivity */}
      <div className="absolute top-[20%] left-[8%] animate-bounce pointer-events-none opacity-20 z-0">
        <Sparkle className="w-8 h-8 text-indigo-400" />
      </div>
      <div className="absolute top-[55%] left-[2%] animate-pulse pointer-events-none opacity-25 z-0">
        <Globe className="w-12 h-12 text-teal-400" />
      </div>
      <div className="absolute top-[75%] right-[5%] animate-bounce pointer-events-none opacity-20 z-0">
        <Sparkle className="w-10 h-10 text-emerald-400" />
      </div>

      {/* FIXED ANNOUNCEMENT POPUP (Cupos Limitados) */}
      <AnimatePresence>
        {showOfferAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-indigo-900 border-b border-indigo-800 text-white text-xs py-2.5 px-4 sticky top-0 z-[60] flex items-center justify-between shadow-md"
          >
            <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-6 font-semibold">
              <span className="flex items-center gap-2">
                <span className="bg-emerald-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                  ÚLTIMOS CUPOS
                </span>
                <span>¡Periodo de Matrícula Regular 2026 abierto! Descuento de hasta 20% en planes anuales.</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onStartLogin}
                  className="bg-white text-indigo-950 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  Postular Ahora →
                </button>
                <button 
                  type="button"
                  onClick={() => setShowOfferAlert(false)}
                  className="text-white/60 hover:text-white font-bold ml-1.5"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/40 dark:bg-zinc-950/40 border-b border-white/20 dark:border-zinc-900/30 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 select-none"
          >
            <div className={`p-2 bg-gradient-to-tr ${cl.gradient} rounded-2xl shadow-xl flex items-center justify-center border border-white/20`}>
              <EnlaceCIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-750 dark:from-white dark:via-zinc-150 dark:to-indigo-300">
                ACADEMIA ENLACEC
              </span>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-cyan-400">Excelencia Científica</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 dark:bg-zinc-900/65 backdrop-blur-md border border-gray-150 dark:border-white/5 rounded-full text-xs font-mono font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Matrículas Disponibles: 14 Cupos
            </span>
            <button
              id="presentation-nav-login"
              type="button"
              onClick={onStartLogin}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer flex items-center gap-2 ${cl.primaryBg} hover:brightness-110 shadow-indigo-500/10 hover:shadow-indigo-500/20`}
            >
              Iniciar Sesión
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded-full text-xs font-bold text-indigo-700 dark:text-cyan-400 shadow-sm shadow-indigo-500/5 hover:bg-indigo-500/15 transition-all">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500 dark:text-cyan-400" />
            <span>Admisión Abierta: Invierno / Primavera 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-black tracking-tight pb-3 leading-[1.08] select-none text-gray-900 dark:text-white">
            Forja tu Futuro en la <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-pink-600 to-emerald-555 dark:from-indigo-400 dark:via-cyan-400 dark:to-emerald-400">
              Academia Científica de Élite
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-sm md:text-base text-gray-650 dark:text-zinc-300 leading-relaxed font-semibold">
            Únete a un ecosistema educativo donde la física, la química avanzada y las matemáticas se dominan de forma intuitiva. Aprende con laboratorios dinámicos virtuales, el acompañamiento interactivo de nuestra **IA de consulta Tesla**, pizarras inteligentes estructuradas y evaluaciones automáticas en tiempo real.
          </p>

          {/* Action buttons with custom spring transitions */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              id="hero-btn-join-academy"
              type="button"
              onClick={onStartLogin}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer ${cl.primaryBg} hover:brightness-110 shadow-indigo-500/10 hover:shadow-indigo-500/25`}
            >
              Matricularse o Ingresar
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              href="#simulador-matricula"
              className="w-full sm:w-auto px-8 py-4 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-gray-250/40 dark:border-white/5 hover:border-indigo-500/50 dark:hover:border-indigo-500/40 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-700 dark:text-zinc-300 inline-flex items-center justify-center gap-2 transition-all shadow-md"
            >
              Simulador Tarifario
            </motion.a>
          </div>
        </motion.div>

        {/* Dynamic Metric Grid counters */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-14 bg-white/55 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-[28px] p-6 shadow-xl"
        >
          <div className="text-center p-3 border-r border-gray-200/50 dark:border-zinc-800/80 last:border-0">
            <h3 className="text-3xl font-black font-mono text-indigo-600 dark:text-cyan-400">98.5%</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 dark:text-zinc-500 mt-1">Ingreso Universitario</p>
          </div>
          <div className="text-center p-3 border-r border-gray-200/50 dark:border-zinc-800/80 last:border-0">
            <h3 className="text-3xl font-black font-mono text-amber-550 dark:text-amber-400">100%</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 dark:text-zinc-500 mt-1">Clases Grabadas con Guía IA</p>
          </div>
          <div className="text-center p-3 border-r border-gray-200/50 dark:border-zinc-800/80 last:border-0">
            <h3 className="text-3xl font-black font-sans text-rose-500">24/7</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 dark:text-zinc-500 mt-1">Respuesta de Dudas</p>
          </div>
          <div className="text-center p-3">
            <h3 className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">&lt; 15</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 dark:text-zinc-500 mt-1">Alumnos por Cátedra</p>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-14 flex justify-center"
        >
          <a
            href="#perks-section"
            className="group flex flex-col items-center gap-2 text-xs font-bold text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-cyan-405 transition-colors cursor-pointer"
          >
            <span className="uppercase tracking-[0.2em] font-mono text-[9px]">Explorar Beneficios</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="p-2 rounded-full bg-white/50 dark:bg-zinc-900/60 border border-gray-250/20 dark:border-zinc-800/60 shadow-sm group-hover:border-indigo-500/30 dark:group-hover:border-cyan-500/30 group-hover:shadow-md transition-all"
            >
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-455" />
            </motion.div>
          </a>
        </motion.div>
      </section>

      {/* DETAILED PERKS SECTION */}
      <section id="perks-section" className="max-w-6xl mx-auto px-6 py-12 relative z-10 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Block: Interactive Features list with smooth slide effects */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 text-left"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-cyan-450 font-mono">¿Por qué estudiar en ENLACEC?</span>
              <h2 className="text-3xl font-black tracking-tight leading-none text-gray-950 dark:text-white">
                Un Modelo Académico de Última Generación
              </h2>
              <p className="text-sm text-gray-650 dark:text-zinc-400 leading-normal">
                Nuestra plataforma unifica la gestión de tus calificaciones, ascesos rápidos y laboratorios interactivos en un diseño unificado y amigable para el alumno y docente.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {academyPerks.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white/55 dark:bg-zinc-900/35 border border-gray-200/50 dark:border-zinc-800/70 hover:bg-white/80 dark:hover:bg-zinc-900/55 transition-all shadow-sm"
                >
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-zinc-800/80 shrink-0 h-11 w-11 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-gray-550 dark:text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Block: Real-Time Selector Playground (Noticeable Interactive Demonstrations) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-gray-200/50 dark:border-zinc-800/80 rounded-[32px] p-6 shadow-2xl text-left flex flex-col justify-between min-h-[460px] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white font-black uppercase text-[8px] tracking-widest px-3 py-1 rounded-bl-xl shadow-md">
                Demostración Interactiva
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-450 font-mono">Explorador de Cátedras</span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1 leading-tight">
                  Explora las herramientas que tendrás para cada grado
                </h3>
                <p className="text-xs text-gray-550 dark:text-zinc-400 mt-1.5 lead-relaxed">
                  Haz clic en las pestañas para ver una representación real del software interactivo que se utiliza en cada rama de la academia.
                </p>
              </div>

              {/* Toggle Buttons Tab */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-150 dark:bg-zinc-950/60 rounded-2xl border border-gray-200/25 dark:border-zinc-800/60 my-4 z-10">
                <button
                  type="button"
                  onClick={() => setActiveTab('labs')}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'labs' ? 'bg-white dark:bg-zinc-850 text-indigo-700 dark:text-cyan-400 shadow-md' : 'text-gray-550 dark:text-zinc-455 hover:bg-white/30'}`}
                >
                  🔬 Laboratorios
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tesla')}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'tesla' ? 'bg-white dark:bg-zinc-850 text-indigo-700 dark:text-cyan-400 shadow-md' : 'text-gray-550 dark:text-zinc-455 hover:bg-white/30'}`}
                >
                  ⚡ Tutor Tesla
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'curriculum' ? 'bg-white dark:bg-zinc-850 text-indigo-700 dark:text-cyan-400 shadow-md' : 'text-gray-550 dark:text-zinc-455 hover:bg-white/30'}`}
                >
                  📖 Pizarra Tizas
                </button>
              </div>

              {/* Changing Display Frame with slide animation */}
              <div className="h-64 bg-slate-950 border border-zinc-800 rounded-3xl p-5 relative text-zinc-300 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-3 right-3 text-[8px] font-mono font-bold uppercase tracking-widest text-zinc-500 bg-zinc-900 border border-zinc-800/60 px-1.5 py-0.5 rounded-md pointer-events-none">
                  Vista Previa Académica
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'labs' && (
                    <motion.div
                      key="preview-labs"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col justify-between text-left h-full"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                          <FlaskConical className="w-3.5 h-3.5 animate-pulse" />
                          Simuladores de Física Dinámica
                        </h4>
                        <p className="text-[10px] text-zinc-440 mt-1 lines-clamp-2 leading-relaxed">
                          Fomenta el autodescubrimiento mediante la manipulación experimental en tiempo real de constantes universales como la fricción, masa inercial, y amplitud de ondas.
                        </p>
                      </div>

                      {/* Miniature Lab Visual representation */}
                      <div className="flex-1 flex items-center justify-center gap-4 bg-zinc-900/60 rounded-2xl p-3 border border-zinc-800 h-24 my-2.5">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute opacity-30" />
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
                            9.8
                          </div>
                          <span className="text-[7.5px] uppercase font-extrabold text-zinc-500">M/S²</span>
                        </div>
                        <div className="h-full w-px bg-zinc-800" />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between text-[7px] text-zinc-500 font-extrabold uppercase">
                            <span>Balance ácido-base de reacción</span>
                            <span className="text-cyan-400 font-mono">pH 7.4 (Sanguíneo)</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-cyan-400" style={{ width: '55%' }} />
                            <div className="h-full bg-teal-400" style={{ width: '20%' }} />
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] text-indigo-400 font-bold tracking-wide">
                        👉 Ideal para incentivar el razonamiento y la intuición matemática de los alumnos.
                      </span>
                    </motion.div>
                  )}

                  {activeTab === 'tesla' && (
                    <motion.div
                      key="preview-tesla"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col justify-between text-left h-full"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                          <Cpu className="w-3.5 h-3.5" />
                          Consultas Inteligentes en Vivo
                        </h4>
                        <p className="text-[10px] text-zinc-440 mt-1.5 lines-clamp-2 leading-relaxed">
                          La IA Tesla no solo responde preguntas mecánicas; ayuda a los alumnos a programar, depurar códigos, entender fórmulas moleculares pesadas paso a paso con látex estructurado de alta legibilidad.
                        </p>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl w-full my-2 flex flex-col gap-1.5 text-[9px] shadow-sm">
                        <div className="flex items-center gap-1.5 text-amber-450 font-bold border-b border-zinc-805 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Tesla • Asesor IA Escolar</span>
                        </div>
                        <p className="text-zinc-300 italic">
                          "La constante de Planck ($h \approx 6.626 \times 10^{-34}$ J·s) define la cuantización de paquetes de luz. ¿Calculamos la energía fotónica?"
                        </p>
                      </div>

                      <span className="text-[9px] text-cyan-400 font-bold tracking-wide">
                        🎯 Los docentes también utilizan Tesla para asentar calificaciones mediante dictado inteligente.
                      </span>
                    </motion.div>
                  )}

                  {activeTab === 'curriculum' && (
                    <motion.div
                      key="preview-chemistry"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col justify-between text-left h-full"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                          <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                          Pizarra de Tizones y Trazos de Precisión
                        </h4>
                        <p className="text-[10px] text-zinc-440 mt-1.5 lines-clamp-2 leading-relaxed">
                          Incentiva la explicación de vectores con nuestra pizarra integrada que admite herramientas de dibujo, regla transportadora, regla de ángulos dinámica y borrado con motas.
                        </p>
                      </div>

                      <div className="flex-1 flex items-center justify-center border border-zinc-800 bg-emerald-950/20 rounded-2xl h-14 p-2.5 my-2 text-center text-[10px] tracking-wide text-emerald-200 border-dashed border-emerald-500/30">
                        <div className="space-y-1">
                          <p className="font-serif italic text-emerald-300 font-bold">{"F = m · a \t y \t E = m · c²"}</p>
                          <p className="text-[7.5px] uppercase tracking-widest text-emerald-500 font-mono">Trazado interactivo con soporte LaTeX integrado</p>
                        </div>
                      </div>

                      <span className="text-[9px] text-indigo-400 font-bold tracking-wide">
                        📏 Diseñado especialmente para exposiciones académicas fluidas en clase.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* DETAILED INTERACTIVE TUITION & REGISTRATION ESTIMATOR SECTION (INCENTIVES MATRICULA) */}
      <section id="simulador-matricula" className="max-w-6xl mx-auto px-6 py-12 relative z-10 scroll-mt-24">
        
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-tr from-indigo-900/90 to-purple-950/90 border border-indigo-700/40 rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden"
        >
          
          {/* Subtle background circles */}
          <div className="absolute top-[-50px] right-[-50px] w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-block font-mono">
              Inversión Académica 2026
            </span>
            <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight">
              Simula tu Plan de Admisión Científica
              <Sparkles className="w-5 h-5 text-cyan-400 inline ml-1.5 animate-pulse" />
            </h2>
            <p className="text-xs text-indigo-200/80 leading-normal max-w-lg mx-auto">
              Utiliza nuestro cotizador interactivo para obtener un presupuesto estimado del ciclo regular escolar con los descuentos por matriculación temprana aplicados automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left controller panel */}
            <div className="lg:col-span-7 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-left space-y-5 text-white">
              
              {/* Option 1: Choose degree pipeline */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block pl-1">
                  Puntal Técnico / Ruta de Especialización:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDegreeLevel('high')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${degreeLevel === 'high' ? 'bg-white text-indigo-950 border-white shadow-lg' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    <span className="font-bold text-xs uppercase tracking-wider block">Básico Escolar</span>
                    <span className="text-[9px] opacity-75 mt-0.5 mt-auto text-[7.5px] uppercase tracking-wide">C. Escolares Generales</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDegreeLevel('tech')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${degreeLevel === 'tech' ? 'bg-white text-indigo-950 border-white shadow-lg' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    <span className="font-bold text-xs uppercase tracking-wider block">Ingeniería Avanzada</span>
                    <span className="text-[9px] opacity-75 mt-0.5 mt-auto text-[7.5px] uppercase tracking-wide">Física cuántica + Química</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDegreeLevel('olympiad')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${degreeLevel === 'olympiad' ? 'bg-white text-indigo-950 border-white shadow-lg' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    <span className="font-bold text-xs uppercase tracking-wider block">Olimpiada Científica</span>
                    <span className="text-[9px] opacity-75 mt-0.5 mt-auto text-[7.5px] uppercase tracking-wide">Entrenamiento de Competición</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Duration slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                    Duración del Periodo Lectivo:
                  </span>
                  <span className="font-extrabold text-cyan-400 font-mono text-xs">
                    {durationMonths} Meses {durationMonths === 12 ? '(Año Completo 🌟)' : durationMonths === 6 ? '(Medio año)' : ''}
                  </span>
                </div>
                <input 
                  type="range"
                  min="3"
                  max="12"
                  step="3"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[8px] text-indigo-300 pl-1">
                  <span>3 Meses (Trimestre)</span>
                  <span>6 Meses (Semestre)</span>
                  <span>9 Meses (Ciclo Estándar)</span>
                  <span>12 Meses (Ciclo Anual Completo)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs leading-relaxed border-t border-white/10">
                <div className="flex gap-2">
                  <div className="p-1 rounded bg-white/10 text-emerald-400 h-6 w-6 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <strong className="text-white block font-bold">Acceso a todas las herramientas</strong>
                    <span className="text-[10px] text-indigo-200">Pizarra, simuladores ilimitados y biblioteca.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="p-1 rounded bg-white/10 text-emerald-400 h-6 w-6 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <strong className="text-white block font-bold">Canal Premium Tesla AI</strong>
                    <span className="text-[10px] text-indigo-200">Consultas conversacionales 24/7 sin límites de tokens.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Estimator Display with beautiful highlights */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 text-indigo-950 flex flex-col justify-between text-left shadow-2xl relative min-h-[300px] border border-white">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Plan Estimado de Colegiatura</span>
                  <span className="text-[9px] bg-emerald-555/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                    {tuition.discountPercentage > 0 ? `-${tuition.discountPercentage}% Promoción` : 'Suscripción Estándar'}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-gray-450 uppercase font-bold tracking-widest">Inversión Mensual Estimada</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-mono tracking-tight text-indigo-950">${tuition.monthly}</span>
                    <span className="text-xs text-gray-500 font-bold font-sans">MXN/mes</span>
                  </div>
                </div>

                <div className="space-y-1 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
                  <div className="flex justify-between font-bold text-gray-600">
                    <span>Inversión Total Periodo ({durationMonths}m):</span>
                    <span className="font-mono text-gray-900">${tuition.total} MXN</span>
                  </div>
                  {parseFloat(tuition.saved) > 0 && (
                    <div className="flex justify-between font-bold text-emerald-600">
                      <span>Descuento Aplicado:</span>
                      <span className="font-mono">-${tuition.saved} MXN</span>
                    </div>
                  )}
                  <p className="text-[9.5px] text-zinc-500 mt-1.5 leading-normal font-semibold">
                    *Para activar este precio y becas especiales de laboratorios, postula tus datos ingresando al portal.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  id="estimator-btn-enroll-action"
                  type="button"
                  onClick={onStartLogin}
                  className="w-full py-3.5 bg-gradient-to-tr from-indigo-650 to-indigo-805 text-white shadow-xl hover:shadow-indigo-500/20 active:scale-95 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:brightness-110"
                >
                  Postular para Matricularse
                  <ArrowRight className="w-4 h-4 animate-bounce" />
                </button>
              </div>

            </div>

          </div>

        </motion.div>
      </section>

      {/* FINAL CALL TO ACTION SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-12 relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="bg-gradient-to-tr from-indigo-950 to-slate-900 border border-indigo-700/25 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.4 }}
        >
          {/* Intense background circle highlights */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <h2 className="text-2xl md:text-3.5xl font-black text-white tracking-tight leading-tight">
              ¿Listo para postular a la <br />
              Academia Científica ENLACEC?
            </h2>
            <p className="max-w-xl mx-auto text-xs md:text-sm text-indigo-200/80 leading-relaxed font-semibold">
              Ofrecemos accesos automatizados con un solo clic para los perfiles demostrativos de administradores y profesores titulares. ¡Explora las herramientas completas de inmediato!
            </p>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              id="cta-enroll-redirect"
              type="button"
              onClick={onStartLogin}
              className={`mx-auto px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-2xl cursor-pointer flex items-center gap-2 ${cl.primaryBg} hover:brightness-110`}
            >
              Comenzar Evaluación e Ingresar
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mt-8 border-t border-gray-250/30 dark:border-zinc-900/40 pt-8 text-center max-w-6xl mx-auto px-6 select-none relative z-10"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-zinc-500 font-bold">
          <div className="flex items-center gap-2">
            <EnlaceCIcon className="w-5 h-5 text-gray-400 dark:text-zinc-650" />
            <span>Academia Científica ENLACEC © 2026 • Todos los Derechos Reservados</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-indigo-500 transition-colors">Admisión v1.2</span>
            <span>•</span>
            <span className="hover:text-indigo-500 transition-colors">Seguridad de Enlaces Criptográficos</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};
