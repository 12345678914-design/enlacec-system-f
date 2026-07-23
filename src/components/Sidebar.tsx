/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { getThemeClasses } from '../lib/themeUtils';
import { EnlaceCIcon } from './EnlaceCIcon';
import { UserAvatar } from './UserAvatar';
import { 
  Home, 
  Users, 
  GraduationCap, 
  FolderOpen, 
  Wallet, 
  Settings, 
  LogOut, 
  X, 
  BookOpen,
  Layers,
  CalendarCheck,
  CheckSquare,
  Sparkles,
  Cpu,
  Megaphone,
  FileText,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onChangeTab: (tab: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeTab, onChangeTab }) => {
  const { currentUser, logout, theme } = useApp();
  const cl = getThemeClasses(theme.accentColor);

  // States for desktop hover expansion and responsive setting
  const [isHovered, setIsHovered] = React.useState(false);
  const [hideIcons, setHideIcons] = React.useState(() => {
    return localStorage.getItem('edu_sidebar_hide_icons') === 'true';
  });

  // Keep state synchronized in real-time
  React.useEffect(() => {
    const handleSync = () => {
      setHideIcons(localStorage.getItem('edu_sidebar_hide_icons') === 'true');
    };
    window.addEventListener('sidebar-config-changed', handleSync);
    return () => {
      window.removeEventListener('sidebar-config-changed', handleSync);
    };
  }, []);

  const toggleHideIcons = () => {
    const nextVal = !hideIcons;
    setHideIcons(nextVal);
    localStorage.setItem('edu_sidebar_hide_icons', String(nextVal));
    window.dispatchEvent(new Event('sidebar-config-changed'));
  };

  // Dynamic menu based on user role
  const getMenu = () => {
    if (currentUser?.role === 'admin') {
      return [
        { id: 'inicio', label: 'Inicio', icon: Home },
        { id: 'pizarra', label: 'Laboratorio AI', icon: Sparkles },
        { id: 'tesla-ai', label: 'TESLA AI', icon: Cpu },
        { id: 'estudiantes', label: 'Estudiantes', icon: GraduationCap },
        { id: 'docentes', label: 'Docentes', icon: Users },
        { id: 'cursos', label: 'Cursos', icon: BookOpen },
        { id: 'servicios', label: 'Servicios', icon: Layers },
        { id: 'recursos', label: 'Recursos', icon: FolderOpen },
        { id: 'finanzas', label: 'Finanzas', icon: Wallet },
        { id: 'facturas', label: 'Bóveda Facturas', icon: Receipt },
        { id: 'avisos', label: 'Avisos y Noticias', icon: Megaphone },
        { id: 'configuracion', label: 'Configuración', icon: Settings },
      ];
    } else {
      return [
        { id: 'inicio', label: 'Inicio', icon: Home },
        { id: 'pizarra', label: 'Laboratorio AI', icon: Sparkles },
        { id: 'tesla-ai', label: 'TESLA AI', icon: Cpu },
        { id: 'asistencias', label: 'Mis Asistencias', icon: CalendarCheck },
        { id: 'notas', label: 'Notas', icon: FileText },
        { id: 'finanzas', label: 'Finanzas', icon: Wallet },
        { id: 'facturas', label: 'Bóveda Facturas', icon: Receipt },
        { id: 'recursos', label: 'Recursos', icon: FolderOpen },
        { id: 'avisos', label: 'Avisos y Noticias', icon: Megaphone },
        { id: 'configuracion', label: 'Configuración', icon: Settings },
      ];
    }
  };

  const menuItems = getMenu();

  const handleTabClick = (tabId: string) => {
    onChangeTab(tabId);
    onClose(); // Close mobile drawer when clicked
  };

  const renderSidebarContent = (isMobile: boolean) => {
    const expanded = isMobile || isHovered;
    
    return (
      <div 
        className={`bg-white/20 dark:bg-slate-900/45 backdrop-blur-xl text-gray-800 dark:text-slate-100 flex flex-col h-full border-r border-gray-200/60 dark:border-white/15 z-10 transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'w-64' : hideIcons ? 'w-[18px]' : 'w-[76px]'
        }`}
      >
        {/* Brand logo */}
        <div className={`h-16 px-4 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 overflow-hidden shrink-0 ${
          expanded ? 'px-6' : 'px-2 justify-center'
        }`}>
          <button
            type="button"
            onClick={() => handleTabClick('inicio')}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          >
            <div className="p-1 rounded-xl bg-white/10 shadow-lg shadow-black/5 shrink-0 flex items-center justify-center">
              <EnlaceCIcon className="w-8 h-8" />
            </div>
            {expanded && (
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-white/60 truncate transition-all duration-300">
                ENLACEC
              </span>
            )}
          </button>
          
          {/* Mobile close button */}
          {isMobile && (
            <button
              id="btn-sidebar-close-mobile"
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-gray-550 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation menu */}
        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto transition-all duration-300 ${
          expanded ? 'px-4' : 'px-1.5'
        }`}>
          {expanded ? (
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-2.5 mb-3 transition-all truncate">
              Menú Principal
            </p>
          ) : (
            <div className="h-4 border-b border-gray-200/20 dark:border-white/5 mb-3"></div>
          )}

          {!expanded && hideIcons ? (
            // Elegant placeholder line indicators when icons are hidden completely
            <div className="flex flex-col items-center py-4 space-y-5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
              <div className="w-0.5 h-32 rounded-full bg-gray-250 dark:bg-zinc-800" />
            </div>
          ) : (
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`sidebar-item-${item.id}`}
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  title={!expanded ? item.label : undefined}
                  className={`flex items-center transition-all duration-250 group text-left border ${
                    expanded 
                      ? 'w-full gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider' 
                      : 'w-11 h-11 justify-center mx-auto rounded-xl p-0'
                  } ${
                    isActive
                      ? `${cl.primaryBg} text-white border-white/20 dark:border-white/10 shadow-lg shadow-indigo-500/10`
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border-transparent'
                  }`}
                >
                  <Icon className={`shrink-0 transition-transform group-hover:scale-110 ${
                    expanded ? 'w-4.5 h-4.5' : 'w-5 h-5'
                  } ${isActive ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`} />
                  {expanded && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.id === 'tesla-ai' && (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold font-mono text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/60 rounded-md shadow-sm select-none uppercase tracking-normal">
                          <span className="text-[10px]">Ctrl</span>
                          <span>+</span>
                          <span>K</span>
                        </kbd>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </nav>

        {/* Real-time configuration for hiding mini-icons when collapsed */}
        {expanded && (
          <div className="mx-4 mb-3 p-3 rounded-2xl bg-gray-150/40 dark:bg-zinc-950/40 border border-gray-200/50 dark:border-white/5 flex flex-col gap-1.5 select-none transition-all duration-305">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Iconos Reducidos</span>
              <button
                id="sidebar-toggle-mode-icon"
                type="button"
                onClick={toggleHideIcons}
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded transition-all border ${
                  hideIcons 
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400 dark:border-rose-400/20' 
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-400/20'
                }`}
              >
                {hideIcons ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 leading-normal font-medium">
              {hideIcons 
                ? 'Panel colapsado: Línea ultra-fina (18px) sin iconos.' 
                : 'Panel colapsado: Barra de miniconos compactos (76px).'}
            </p>
          </div>
        )}

        {/* User info & Logout at the bottom */}
        {(!expanded && hideIcons) ? null : (
          <div className={`p-4 border-t border-gray-200/50 dark:border-white/10 shrink-0 bg-gray-100/10 dark:bg-slate-950/20 backdrop-blur-md overflow-hidden transition-all duration-300 ${
            expanded ? '' : 'flex flex-col items-center gap-4 py-4 px-2'
          }`}>
            <div className={`flex items-center gap-3 ${expanded ? 'mb-4' : 'mb-0 justify-center'}`}>
              <UserAvatar
                src={currentUser?.avatarUrl}
                name={currentUser?.name}
                className="w-11 h-11 rounded-2xl ring-2 ring-white/60 dark:ring-white/10 shadow-md shrink-0"
              />
              {expanded && (
                <div className="min-w-0 flex-1 transition-all duration-300">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate leading-tight">{currentUser?.name}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-slate-450 truncate mt-0.5 font-mono">{currentUser?.email}</p>
                </div>
              )}
            </div>
            
            <button
              id="btn-sidebar-logout"
              type="button"
              onClick={logout}
              title={!expanded ? "Cerrar Sesión" : undefined}
              className={`border border-gray-200/50 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-red-500/10 hover:border-red-300 dark:hover:border-red-500/20 text-gray-500 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-400 transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${
                expanded 
                  ? 'w-full py-2.5 rounded-2xl text-xs' 
                  : 'w-11 h-11 rounded-xl p-0'
              }`}
            >
              <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
              {expanded && "Cerrar Sesión"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (visible inside main flex grid with dynamic hover-to-expand) */}
      <div 
        id="desktop-sidebar-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:block h-screen sticky top-0 shrink-0 select-none z-10 transition-all duration-300 ease-in-out ${
          isHovered ? 'w-64' : hideIcons ? 'w-[18px]' : 'w-[76px]'
        }`}
      >
        {renderSidebarContent(false)}
      </div>

      {/* Mobile Sidebar (controlled as modal backdrop drawer) */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] flex">
            {/* Backdrop slide-in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black"
            />
            {/* Sidebar drawer slide */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 h-full shadow-2xl"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
