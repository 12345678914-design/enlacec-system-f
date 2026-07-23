/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Presentation } from './components/Presentation';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AdminDashboard } from './components/views/AdminDashboard';
import { DocenteDashboard } from './components/views/DocenteDashboard';
import { Perfil } from './components/views/Perfil';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Sparkles, Loader2, Megaphone, X } from 'lucide-react';
import { getThemeClasses } from './lib/themeUtils';
import { ChatBotWidget } from './components/ChatBotWidget';
import { SplashLoader } from './components/SplashLoader';
import { UploadProgressModal } from './components/UploadProgressModal';

const FloatingNotificationItem: React.FC<{
  notification: any;
  onClose: (id: string) => void;
  onClick: () => void;
}> = ({ notification, onClose, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: 50 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={onClick}
      className="pointer-events-auto w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/80 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 cursor-pointer hover:border-indigo-500/30 dark:hover:border-cyan-500/30 transition-all select-none group"
    >
      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
        <Megaphone className="w-4 h-4 animate-bounce" />
      </div>
      <div className="flex-1 space-y-1 text-left min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-black text-gray-800 dark:text-zinc-200 truncate pr-4">
            {notification.title}
          </h4>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose(notification.id);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {notification.content}
        </p>
        <span className="block text-[9px] text-gray-450 dark:text-zinc-500 font-semibold font-mono pt-0.5">
          {notification.timestamp}
        </span>
      </div>
    </motion.div>
  );
};

function AppContent() {
  const { 
    currentUser, 
    theme, 
    uploadProgress, 
    notifications, 
    markNotificationAsRead 
  } = useApp();
  const cl = getThemeClasses(theme.accentColor);
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const prevUserRef = useRef<any>(currentUser);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (currentUser) {
      if (!prevUserRef.current) {
        setShowSuccessOverlay(true);
        setTimeout(() => {
          setShowSuccessOverlay(false);
        }, 1800);
      }
      prevUserRef.current = currentUser;
    } else {
      if (prevUserRef.current) {
        setShowLoginScreen(true);
      }
      prevUserRef.current = null;
      setShowSuccessOverlay(false);
    }
  }, [currentUser]);

  // Reset tab when role changes to avoid mismatched menus
  useEffect(() => {
    setActiveTab('inicio');
  }, [currentUser?.role]);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K) to open TESLA AI chat from anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('tesla-ai');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Reset scroll of main container to top when changing tabs to prevent floating header visibility glitches
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    // Intercept standard alert dialogs with a beautifully animated React modal toast
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      setToast({ message: msg, visible: true });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (!currentUser) {
    return (
      <>
        <AnimatePresence mode="popLayout">
          {isSplashLoading && (
            <motion.div
              key="splash-loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[99999]"
            >
              <SplashLoader onComplete={() => setIsSplashLoading(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!showLoginScreen ? (
            <motion.div
              key="presentation-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full text-zinc-950 dark:text-zinc-50"
            >
              <Presentation onStartLogin={() => setShowLoginScreen(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="login-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full text-zinc-950 dark:text-zinc-50"
            >
              <Login onBackToWelcome={() => setShowLoginScreen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Get human friendly label of active tab for header info
  const getActiveTabLabel = () => {
    const labels: Record<string, string> = {
      inicio: 'Inicio Panel',
      estudiantes: 'Matrícula de Estudiantes',
      docentes: 'Catálogo de Docentes',
      cursos: 'Gestión de Cursos',
      servicios: 'Gestión de Servicios',
      recursos: 'Carpeta de Recursos',
      pizarra: 'Laboratorio Científico de IA',
      'tesla-ai': 'TESLA AI - Asistente Humano de IA',
      finanzas: currentUser.role === 'admin' ? 'Caja / Flujo de Efectivo' : 'Tus Honorarios y Pagos',
      configuracion: 'Ajustes del Sistema',
      asistencias: 'Asistencias del Docente',
      notas: 'Gestión de Notas de Estudiantes',
      perfil: 'Tu Perfil del Sistema'
    };
    return labels[activeTab] || 'ENLACEC';
  };

  return (
    <>
      <AnimatePresence mode="popLayout">
        {isSplashLoading && (
          <motion.div
            key="splash-loader-auth"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999]"
          >
            <SplashLoader onComplete={() => setIsSplashLoading(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex h-screen ${cl.appBg} text-gray-900 dark:text-zinc-100 transition-colors duration-300 overflow-hidden relative font-sans`}>
      {/* Background Mesh Gradients */}
      <div className={`absolute top-[-150px] left-[-150px] w-[600px] h-[600px] ${cl.meshBg1} rounded-full blur-[120px] pointer-events-none z-0`}></div>
      <div className={`absolute bottom-[-150px] right-[-150px] w-[600px] h-[600px] ${cl.meshBg2} rounded-full blur-[120px] pointer-events-none z-0`}></div>
      <div className={`absolute top-1/2 left-1/4 w-[400px] h-[400px] ${cl.meshBg3} rounded-full blur-[100px] pointer-events-none z-0`}></div>

      {/* Sidebar Navigation Panel */}
      <Sidebar 
        isOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-20">
        <Header 
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
          activeTabLabel={getActiveTabLabel()} 
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        <main ref={mainRef} className={`flex-1 ${activeTab === 'pizarra' || activeTab === 'tesla-ai' ? 'overflow-hidden flex flex-col min-h-0' : 'overflow-y-auto'} bg-white/5 dark:bg-slate-900/30 transition-colors duration-300`}>
          {activeTab === 'perfil' ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
              <Perfil />
            </div>
          ) : currentUser.role === 'admin' ? (
            <AdminDashboard activeTab={activeTab} onChangeTab={setActiveTab} />
          ) : (
            <DocenteDashboard activeTab={activeTab} onChangeTab={setActiveTab} />
          )}
        </main>
      </div>

      {/* Dynamic Animated System Toast Dialog */}
      <AnimatePresence>
        {toast.visible && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              {/* Decorative accent top line matching active theme accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div className="flex-1 space-y-1.5 select-none text-left">
                  <h4 className="text-xs font-bold text-gray-400/80 dark:text-zinc-500 uppercase tracking-widest">Aviso del Sistema</h4>
                  <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                    {toast.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  id="btn-system-toast-close"
                  type="button"
                  onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Login Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div
            key="login-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl select-none"
          >
            {/* Background glowing rings */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none`}></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none`}></div>

            <div className="relative flex flex-col items-center text-center max-w-sm px-6">
              
              {/* Rotating Outer Halo and Avatar */}
              <div className="relative mb-6">
                {/* Rotating accent border */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2.5 rounded-full border-2 border-dashed border-indigo-500/40"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 rounded-full border border-dashed border-cyan-400/25"
                />

                {/* Pulsing glow ring */}
                <div className="absolute inset-0 bg-indigo-600/20 blur-xl rounded-full scale-110 animate-pulse" />

                {/* Avatar frame */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 15, delay: 0.1 }}
                  className="relative w-24 h-24 rounded-full bg-slate-900 border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-2xl"
                >
                  {currentUser?.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-3xl font-black">
                      {currentUser?.name?.[0] || 'U'}
                    </div>
                  )}

                  {/* Icon badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.4 }}
                    className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 border-2 border-slate-950 shadow-md animate-bounce"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Text section */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-2 mb-6"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Acceso Concedido</span>
                </div>
                
                <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                  ¡Hola, {currentUser?.name.split(' ')[0]}!
                </h2>
                
                <p className="text-xs text-zinc-400 font-semibold max-w-[280px]">
                  {currentUser?.role === 'admin' 
                    ? 'Iniciando sesión como Directora de la plataforma...' 
                    : 'Cargando tu aula virtual y horarios docentes...'}
                </p>
              </motion.div>

              {/* Techy load info */}
              <div className="w-44 space-y-2">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Sincronizando</span>
                  <span className="animate-pulse">Seguro</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating EnlaceC AI Chatbot Widget */}
      {activeTab !== 'pizarra' && activeTab !== 'tesla-ai' && <ChatBotWidget />}

      <UploadProgressModal
        isOpen={uploadProgress.isOpen}
        progress={uploadProgress.progress}
        title={uploadProgress.title}
        status={uploadProgress.status}
      />

      {/* Floating Real-time Push Notification alerts container */}
      <div className="fixed top-20 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {notifications
            ?.filter(n => !n.read)
            ?.slice(0, 3)
            ?.map(n => (
              <FloatingNotificationItem
                key={n.id}
                notification={n}
                onClose={(id) => markNotificationAsRead(id)}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  setActiveTab('avisos');
                }}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
