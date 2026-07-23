/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getThemeClasses } from '../lib/themeUtils';
import { UserAvatar } from './UserAvatar';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  LogOut, 
  Menu, 
  ChevronDown, 
  Calendar,
  Sparkles,
  Award,
  Search,
  FileText,
  Folder,
  Users,
  Phone,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  activeTabLabel: string;
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

// Interactive Mini Calendar Dropdown Component
const MiniCalendar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { theme } = useApp();
  const cl = getThemeClasses(theme.accentColor);
  
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const dayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(<div key={`empty-${i}`} className="text-center py-1 text-[10px] text-gray-300 dark:text-zinc-800" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
    daysGrid.push(
      <div 
        key={`day-${d}`} 
        className={`text-center py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
          isToday 
            ? `${cl.primaryBg} text-white shadow-md shadow-indigo-500/20` 
            : 'text-gray-750 dark:text-zinc-300 hover:bg-gray-150/60 dark:hover:bg-white/5'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <span>{d}</span>
        {isToday && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 w-64 select-none" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <button 
          type="button" 
          onClick={prevMonth} 
          className="p-1.5 hover:bg-gray-150 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-zinc-400 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-zinc-100 font-mono">
          {monthNames[month]} {year}
        </span>
        <button 
          type="button" 
          onClick={nextMonth} 
          className="p-1.5 hover:bg-gray-150 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-zinc-400 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayHeaders.map((h, i) => (
          <div key={i} className="text-center text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysGrid}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-150/50 dark:border-white/5 text-center">
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentDate(new Date());
          }}
          className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-cyan-450 hover:underline cursor-pointer"
        >
          Volver a Hoy
        </button>
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, activeTabLabel, activeTab, onChangeTab }) => {
  const { 
    currentUser, 
    logout, 
    theme, 
    updateTheme, 
    students, 
    teachers, 
    resources,
    notifications,
    markNotificationAsRead,
    deleteNotification,
    clearNotifications
  } = useApp();
  const cl = getThemeClasses(theme.accentColor);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemDetail, setSelectedItemDetail] = useState<{
    type: 'estudiante' | 'docente' | 'recurso';
    data: any;
  } | null>(null);

  // Flatten resources list for quick querying
  const getFlatResources = () => {
    interface FlatResource {
      id: string;
      name: string;
      type: 'folder' | 'file';
      size?: string;
      category: string;
      updatedAt: string;
    }
    const list: FlatResource[] = [];
    const traverse = (items: typeof resources) => {
      items.forEach(item => {
        list.push({
          id: item.id,
          name: item.name,
          type: item.type,
          size: item.size,
          category: item.category || 'Recurso',
          updatedAt: item.updatedAt
        });
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(resources);
    return list;
  };

  // Perform search matches across models
  const getSearchResults = () => {
    if (!searchQuery.trim()) return { students: [], teachers: [], resources: [] };
    const query = searchQuery.toLowerCase().trim();
    
    const filteredStudents = students.filter(s => 
      s.id.toLowerCase().includes(query) || 
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    );
    
    const filteredTeachers = teachers.filter(t => 
      t.id.toLowerCase().includes(query) || 
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query)
    );
    
    const flatRes = getFlatResources();
    const filteredResources = flatRes.filter(r => 
      r.id.toLowerCase().includes(query) || 
      r.name.toLowerCase().includes(query) ||
      r.category.toLowerCase().includes(query)
    );
    
    return {
      students: filteredStudents,
      teachers: filteredTeachers,
      resources: filteredResources
    };
  };

  // Dynamic salutation based on hours
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) return 'Buenos días';
    if (hours >= 12 && hours < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const cycleThemeMode = () => {
    const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(theme.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    updateTheme({ mode: modes[nextIndex] });
  };

  const getThemeIcon = () => {
    if (theme.mode === 'dark') return <Moon className="w-4.5 h-4.5 text-yellow-400" />;
    if (theme.mode === 'light') return <Sun className="w-4.5 h-4.5 text-amber-500" />;
    return <Monitor className="w-4.5 h-4.5 text-slate-400" />;
  };

  const getThemeLabel = () => {
    if (theme.mode === 'dark') return 'Oscuro';
    if (theme.mode === 'light') return 'Claro';
    return 'Sistema';
  };

  const markAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const markAllAsRead = () => {
    notifications.forEach(n => markNotificationAsRead(n.id));
  };

  const clearNotification = (id: string) => {
    deleteNotification(id);
  };

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <>
      <header className="sticky top-0 z-35 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 transition-colors duration-300 h-16 px-4 flex items-center justify-between">
        {/* Left side info */}
        <div className="flex items-center gap-3">
          <button
            id="btn-sidebar-toggle-mobile"
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 hover:bg-gray-250/50 dark:hover:bg-white/10 rounded-xl text-gray-500 dark:text-gray-300 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block pl-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              {currentUser?.role === 'admin' ? 'Área Directiva' : 'Área Docente'}
            </p>
            <h2 className="text-sm font-extrabold text-gray-800 dark:text-zinc-100 flex items-center gap-1.5 leading-none mt-1">
              <span>{activeTabLabel}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </h2>
          </div>
        </div>

        {/* Central Administrator Search Bar */}
        {currentUser?.role === 'admin' ? (
          <div className="flex-1 max-w-sm mx-4 hidden md:block relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar estudiante, docente o recurso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white/40 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50 backdrop-blur-md text-gray-800 dark:text-zinc-200"
              />
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[350px] overflow-y-auto">
                {(() => {
                  const results = getSearchResults();
                  const totalCount = results.students.length + results.teachers.length + results.resources.length;

                  if (totalCount === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Sin resultados para "{searchQuery}"
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-gray-150/40 dark:divide-white/5">
                      {/* Students Group */}
                      {results.students.length > 0 && (
                        <div className="p-1.5">
                          <div className="px-2 py-1 text-[8px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Estudiantes ({results.students.length})
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {results.students.map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedItemDetail({ type: 'estudiante', data: s });
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-2 py-1 rounded-lg hover:bg-gray-100/50 dark:hover:bg-white/5 flex items-center justify-between text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserAvatar src={s.avatarUrl} name={s.name} className="w-5 h-5 rounded-md" />
                                  <div className="truncate">
                                    <div className="font-extrabold text-gray-800 dark:text-zinc-200 truncate leading-tight">{s.name}</div>
                                    <div className="text-[9px] text-gray-450 font-mono leading-none mt-0.5">{s.id} • {s.grade}</div>
                                  </div>
                                </div>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-600 dark:text-blue-300 uppercase tracking-wider shrink-0">
                                  Ficha
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Teachers Group */}
                      {results.teachers.length > 0 && (
                        <div className="p-1.5">
                          <div className="px-2 py-1 text-[8px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Docentes ({results.teachers.length})
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {results.teachers.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setSelectedItemDetail({ type: 'docente', data: t });
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-2 py-1 rounded-lg hover:bg-gray-100/50 dark:hover:bg-white/5 flex items-center justify-between text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserAvatar src={t.avatarUrl} name={t.name} className="w-5 h-5 rounded-md" />
                                  <div className="truncate">
                                    <div className="font-extrabold text-gray-800 dark:text-zinc-200 truncate leading-tight">{t.name}</div>
                                    <div className="text-[9px] text-gray-450 font-mono leading-none mt-0.5">{t.id} • {t.subject}</div>
                                  </div>
                                </div>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-600 dark:text-emerald-300 uppercase tracking-wider shrink-0">
                                  Perfil
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources Group */}
                      {results.resources.length > 0 && (
                        <div className="p-1.5">
                          <div className="px-2 py-1 text-[8px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Recursos ({results.resources.length})
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {results.resources.map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setSelectedItemDetail({ type: 'recurso', data: r });
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-2 py-1 rounded-lg hover:bg-gray-100/50 dark:hover:bg-white/5 flex items-center justify-between text-xs transition-colors min-w-0"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="p-1 bg-indigo-500/10 rounded-md text-indigo-505 shrink-0">
                                    {r.type === 'folder' ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="truncate min-w-0">
                                    <div className="font-extrabold text-gray-800 dark:text-zinc-200 truncate leading-tight">{r.name}</div>
                                    <div className="text-[9px] text-gray-450 font-mono leading-none mt-0.5">{r.id} • {r.category}</div>
                                  </div>
                                </div>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-650 dark:text-indigo-300 uppercase tracking-wider shrink-0">
                                  Abrir
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3.5">
        
        {/* Real-time calendar indicator */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCalendarDropdown(!showCalendarDropdown);
              setShowNotifications(false);
              setShowProfileDropdown(false);
            }}
            className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-550 dark:text-zinc-300 bg-white/45 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl border border-gray-200/40 dark:border-white/10 backdrop-blur-md cursor-pointer transition-all outline-none"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </button>

          <AnimatePresence>
            {showCalendarDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCalendarDropdown(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  className="absolute right-0 mt-2.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border border-gray-200/60 dark:border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <MiniCalendar onClose={() => setShowCalendarDropdown(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Quick theme toggler */}
        <button
          id="btn-header-theme-toggle"
          type="button"
          onClick={cycleThemeMode}
          className="p-2 bg-white/45 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-gray-200/40 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md"
          title={`Tema actual: ${getThemeLabel()}`}
        >
          {getThemeIcon()}
          <span className="hidden sm:inline text-[10px] font-bold text-gray-650 dark:text-zinc-300 capitalize">{getThemeLabel()}</span>
        </button>

        {/* Notifications list */}
        <div className="relative">
          <button
            id="btn-header-notifications"
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="p-2 relative bg-white/45 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-gray-200/40 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 transition-colors backdrop-blur-md"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop for mobile overlays */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[80] bg-zinc-950/40 dark:bg-black/60 backdrop-blur-[5px] md:hidden"
                  onClick={() => setShowNotifications(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  className="fixed inset-x-4 top-[15vh] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2.5 w-auto max-w-md md:w-96 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border border-gray-200/60 dark:border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col"
                >
                  <div className="px-4 py-3.5 border-b border-gray-150 dark:border-zinc-850 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-gray-800 dark:text-zinc-150 text-[10px] uppercase tracking-widest">Avisos del Sistema</h3>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Alertas y notificaciones inmediatas</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[10px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg font-bold transition-all"
                        >
                          Marcar todo leído
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-lg text-gray-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-zinc-850/60 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 dark:text-zinc-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 select-none pointer-events-none" />
                        <span className="text-xs font-semibold">No tienes ninguna notificación nueva</span>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-4 transition-colors flex gap-3 relative group/item select-none cursor-pointer ${!n.read ? 'bg-indigo-500/5 dark:bg-indigo-400/5 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                          onClick={() => {
                            markAsRead(n.id);
                            if (onChangeTab) onChangeTab('avisos');
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`font-bold text-xs ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-zinc-300'}`}>{n.title}</span>
                              <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-mono shrink-0">{n.time || n.timestamp}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-normal pr-4">{n.desc || n.content}</p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(n.id);
                            }}
                            className="absolute right-3 top-3 opacity-0 group-hover/item:opacity-100 focus:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-red-500 transition-all"
                            title="Eliminar notificación"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-gray-150 dark:border-zinc-850 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold">{notifications.length === 0 ? 'Sin alertas' : `${notifications.length} Alertas`}</span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] font-extrabold uppercase text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-150 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Divider */}
        <div className="w-px h-6 bg-gray-200/60 dark:bg-white/10 hidden sm:block" />

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            id="btn-header-profile"
            type="button"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 bg-white/45 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-gray-200/40 dark:border-white/10 rounded-xl transition-all backdrop-blur-md"
          >
            <UserAvatar
              src={currentUser?.avatarUrl}
              name={currentUser?.name}
              className="w-7.5 h-7.5 rounded-lg ring-2 ring-white/60 dark:ring-white/10"
            />
            <div className="hidden sm:text-left sm:block pr-1">
              <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 leading-tight">
                {currentUser?.name.split(' ').slice(0, 2).join(' ')}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {currentUser?.role === 'admin' ? (
                  <span className="text-[8px] font-bold text-blue-650 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded uppercase">
                    Director
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-emerald-650 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase">
                    Docente
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block pr-0.5" />
          </button>

          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                className="absolute right-0 mt-2 w-52 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/15 rounded-2xl shadow-2xl py-2.5 z-40 text-xs text-gray-800 dark:text-zinc-200"
              >
                <div className="px-4 py-2 border-b border-gray-200/55 dark:border-white/10">
                  <p className="text-[8px] text-gray-450 uppercase tracking-widest font-extrabold">Iniciado como</p>
                  <p className="font-extrabold text-gray-850 dark:text-zinc-100 mt-0.5 truncate">{currentUser?.name}</p>
                  <p className="text-[9px] text-gray-400 truncate font-mono">{currentUser?.email}</p>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeTab('perfil');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-white/5 text-gray-700 dark:text-zinc-200 flex items-center gap-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-500" />
                    Mi Perfil
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>

    {/* Details modal with premium animations or frosted layout */}
    <AnimatePresence>
      {selectedItemDetail && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[5px] z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-gray-800 dark:text-zinc-300"
          >
            <button
              type="button"
              onClick={() => setSelectedItemDetail(null)}
              className="absolute top-4 right-4 p-1 rounded-xl bg-gray-200/40 dark:bg-white/5 text-gray-550 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Render header based on type */}
            <div className="flex items-center gap-4 mb-5 border-b border-gray-150/50 dark:border-white/10 pb-4">
              {selectedItemDetail.type === 'estudiante' && (
                <>
                  <UserAvatar
                    src={selectedItemDetail.data.avatarUrl}
                    name={selectedItemDetail.data.name}
                    className="w-12 h-12 rounded-2xl ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <span className="text-[8px] font-extrabold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Ficha de Estudiante
                    </span>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">
                      {selectedItemDetail.data.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono font-bold leading-none mt-0.5">{selectedItemDetail.data.id}</p>
                  </div>
                </>
              )}

              {selectedItemDetail.type === 'docente' && (
                <>
                  <UserAvatar
                    src={selectedItemDetail.data.avatarUrl}
                    name={selectedItemDetail.data.name}
                    className="w-12 h-12 rounded-2xl ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <span className="text-[8px] font-extrabold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Ficha del Docente
                    </span>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">
                      {selectedItemDetail.data.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono font-bold leading-none mt-0.5">{selectedItemDetail.data.id}</p>
                  </div>
                </>
              )}

              {selectedItemDetail.type === 'recurso' && (
                <>
                  <div className="w-12 h-12 bg-indigo-500/15 text-indigo-500 rounded-2xl flex items-center justify-center text-xl font-bold">
                    {selectedItemDetail.data.type === 'folder' ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {selectedItemDetail.data.type === 'folder' ? 'Carpeta / Directorio' : 'Archivo Digital'}
                    </span>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1 truncate max-w-[180px]">
                      {selectedItemDetail.data.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono font-bold leading-none mt-0.5">{selectedItemDetail.data.id}</p>
                  </div>
                </>
              )}
            </div>

            {/* Detail fields body */}
            <div className="space-y-3.5 mb-2">
              {selectedItemDetail.type === 'estudiante' && (
                <>
                  <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Grado / Sección</p>
                      <p className="font-extrabold mt-0.5 text-gray-805 dark:text-zinc-200">{selectedItemDetail.data.grade} - "{selectedItemDetail.data.section}"</p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Asistencia</p>
                      <p className="font-extrabold mt-0.5 text-emerald-500">{selectedItemDetail.data.attendanceRate}%</p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Estado Matricula</p>
                      <p className="font-extrabold mt-0.5 uppercase tracking-wider text-[10px]">
                        {selectedItemDetail.data.status === 'active' ? (
                          <span className="text-emerald-500">Activo</span>
                        ) : (
                          <span className="text-red-550">Inactivo</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Saldo Pendiente</p>
                      <p className={`font-extrabold mt-0.5 ${selectedItemDetail.data.balance > 0 ? 'text-red-500 font-extrabold' : 'text-emerald-550 dark:text-emerald-400'}`}>
                        ${selectedItemDetail.data.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-white/5 p-2.5 rounded-xl border border-gray-150/50 dark:border-white/10 space-y-1 text-[11px]">
                    <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Apoderado Responsable</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold flex items-center gap-1.5 text-gray-805 dark:text-zinc-200">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{selectedItemDetail.data.parentName}</span>
                      </p>
                      <p className="text-gray-500 dark:text-zinc-400 font-bold flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{selectedItemDetail.data.parentPhone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Grades */}
                  <div className="bg-white/40 dark:bg-white/5 p-2.5 rounded-xl border border-gray-150/50 dark:border-white/10 text-[11px]">
                    <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Boleta de Calificaciones</p>
                    <div className="space-y-1.5">
                      {selectedItemDetail.data.grades.map((g: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="font-bold text-gray-605 dark:text-zinc-300">{g.subject}</span>
                          <span className={`px-1.5 py-0.2 rounded font-extrabold text-[10px] font-mono ${g.score >= 13 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                            {g.score} / 20
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedItemDetail.type === 'docente' && (
                <>
                  <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Cátedra</p>
                      <p className="font-extrabold mt-0.5 text-gray-805 dark:text-zinc-200">{selectedItemDetail.data.subject}</p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Puntuación</p>
                      <p className="font-extrabold mt-0.5 flex items-center gap-1 text-amber-500">
                        <Award className="w-3 h-3" />
                        <span>{selectedItemDetail.data.rating} / 5.0</span>
                      </p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Salario Mensual</p>
                      <p className="font-extrabold mt-0.5 text-indigo-500">${selectedItemDetail.data.salary}</p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-150/50 dark:border-white/10">
                      <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Honorarios</p>
                      <p className="font-extrabold mt-0.5">
                        {selectedItemDetail.data.paymentStatus === 'paid' ? (
                          <span className="text-emerald-500 uppercase tracking-wider text-[10px]">Abonado</span>
                        ) : (
                          <span className="text-rose-500 uppercase tracking-wider text-[10px]">Pendiente</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-white/5 p-2.5 rounded-xl border border-gray-150/50 dark:border-white/10 space-y-1 text-[11px]">
                    <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Canales de Contacto</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold flex items-center gap-1.5 text-gray-805 dark:text-zinc-200">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{selectedItemDetail.data.email}</span>
                      </p>
                      <p className="text-gray-500 dark:text-zinc-400 font-bold flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{selectedItemDetail.data.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-white/5 p-2.5 rounded-xl border border-gray-150/50 dark:border-white/10 text-[11px]">
                    <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Cursos Asignados</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedItemDetail.data.activeCourses.map((c: string, idx: number) => (
                        <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-150/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedItemDetail.type === 'recurso' && (
                <>
                  <div className="bg-white/40 dark:bg-white/5 p-2.5 rounded-xl border border-gray-150/50 dark:border-white/10 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center pb-1 border-b border-gray-150/50 dark:border-white/10">
                      <span className="text-gray-400">Asignatura</span>
                      <span className="font-bold text-gray-850 dark:text-zinc-200">{selectedItemDetail.data.category}</span>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-gray-150/50 dark:border-white/10">
                      <span className="text-gray-400">Elemento</span>
                      <span className="font-bold text-gray-850 dark:text-zinc-200">{selectedItemDetail.data.type === 'folder' ? 'Carpeta del Módulo' : 'Fichero Adjunto'}</span>
                    </div>

                    {selectedItemDetail.data.size && (
                      <div className="flex justify-between items-center pb-1 border-b border-gray-150/50 dark:border-white/10">
                        <span className="text-gray-400">Peso en Disco</span>
                        <span className="font-bold font-mono">{selectedItemDetail.data.size}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Sincronizado</span>
                      <span className="font-bold font-mono text-gray-500">{selectedItemDetail.data.updatedAt}</span>
                    </div>
                  </div>

                  <div className="text-center text-[9px] text-gray-450 mt-3 p-2 border border-dashed border-gray-200 dark:border-white/10 rounded-xl leading-normal">
                    Este recurso digital está disponible en la base del portal. Edítalo directamente desde el gestor de recursos en caso de requerir reestructuración.
                  </div>
                </>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="w-full py-2 bg-indigo-505 hover:bg-indigo-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow shadow-indigo-500/10 active:scale-[0.98]"
              >
                Cerrar Detalle
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
};
