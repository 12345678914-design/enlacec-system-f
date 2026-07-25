import { AccentColor } from '../types';

export interface ThemeClasses {
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  lightBg: string;
  border: string;
  ring: string;
  badge: string;
  gradient: string;
  meshBg1: string;
  meshBg2: string;
  meshBg3: string;
  appBg: string;
  hoverText: string;
  hoverBg: string;
}

export const ACCENT_COLORS_METADATA = [
  { value: 'blue' as AccentColor, label: 'Azul Inteligente', hex: '#3b82f6' },
  { value: 'emerald' as AccentColor, label: 'Verde Orgánico', hex: '#10b981' },
  { value: 'purple' as AccentColor, label: 'Púrpura Creativo', hex: '#8b5cf6' },
  { value: 'amber' as AccentColor, label: 'Ámbar Cálido', hex: '#f59e0b' },
  { value: 'rose' as AccentColor, label: 'Rosa Vital', hex: '#f43f5e' },
  { value: 'indigo' as AccentColor, label: 'Índigo Real', hex: '#6366f1' },
  { value: 'orange' as AccentColor, label: 'Naranja Vibrante', hex: '#f97316' },
  { value: 'teal' as AccentColor, label: 'Teal Enérgico', hex: '#14b8a6' },
  { value: 'fuchsia' as AccentColor, label: 'Fucsia Audaz', hex: '#d946ef' },
  { value: 'violet' as AccentColor, label: 'Violeta Eléctrico', hex: '#7c3aed' },
];

export function getThemeClasses(accent: AccentColor): ThemeClasses {
  switch (accent) {
    case 'orange':
      return {
        primaryBg: 'bg-orange-600 dark:bg-orange-500',
        primaryHoverBg: 'hover:bg-orange-700 dark:hover:bg-orange-600',
        primaryText: 'text-orange-600 dark:text-orange-400',
        lightBg: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300',
        border: 'border-orange-500 dark:border-orange-400',
        ring: 'focus:ring-orange-500 focus:border-orange-500',
        badge: 'bg-orange-100 text-orange-850 dark:bg-orange-900/40 dark:text-orange-200',
        gradient: 'from-orange-550 to-amber-600',
        meshBg1: 'bg-orange-500/10 dark:bg-orange-500/18',
        meshBg2: 'bg-amber-500/10 dark:bg-amber-500/12',
        meshBg3: 'bg-red-500/5 dark:bg-red-500/8',
        appBg: 'bg-orange-50/15 dark:bg-zinc-950',
        hoverText: 'hover:text-orange-600 dark:hover:text-orange-400',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-950/20'
      };
    case 'teal':
      return {
        primaryBg: 'bg-teal-600 dark:bg-teal-500',
        primaryHoverBg: 'hover:bg-teal-700 dark:hover:bg-teal-600',
        primaryText: 'text-teal-650 dark:text-teal-400',
        lightBg: 'bg-teal-50 dark:bg-teal-950/20 text-teal-750 dark:text-teal-300',
        border: 'border-teal-500 dark:border-teal-400',
        ring: 'focus:ring-teal-500 focus:border-teal-500',
        badge: 'bg-teal-100 text-teal-850 dark:bg-teal-900/40 dark:text-teal-200',
        gradient: 'from-teal-550 to-emerald-600',
        meshBg1: 'bg-teal-500/10 dark:bg-teal-500/18',
        meshBg2: 'bg-emerald-500/10 dark:bg-emerald-500/12',
        meshBg3: 'bg-cyan-500/5 dark:bg-cyan-500/8',
        appBg: 'bg-teal-50/15 dark:bg-zinc-950',
        hoverText: 'hover:text-teal-650 dark:hover:text-teal-400',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-950/20'
      };
    case 'fuchsia':
      return {
        primaryBg: 'bg-fuchsia-600 dark:bg-fuchsia-500',
        primaryHoverBg: 'hover:bg-fuchsia-700 dark:hover:bg-fuchsia-600',
        primaryText: 'text-fuchsia-600 dark:text-fuchsia-400',
        lightBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-700 dark:text-fuchsia-300',
        border: 'border-fuchsia-500 dark:border-fuchsia-400',
        ring: 'focus:ring-fuchsia-500 focus:border-fuchsia-500',
        badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200',
        gradient: 'from-fuchsia-550 to-pink-600',
        meshBg1: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/18',
        meshBg2: 'bg-pink-500/10 dark:bg-pink-500/12',
        meshBg3: 'bg-purple-500/5 dark:bg-purple-500/8',
        appBg: 'bg-fuchsia-50/15 dark:bg-zinc-950',
        hoverText: 'hover:text-fuchsia-600 dark:hover:text-fuchsia-400',
        hoverBg: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/20'
      };
    case 'violet':
      return {
        primaryBg: 'bg-violet-600 dark:bg-violet-400',
        primaryHoverBg: 'hover:bg-violet-705 dark:hover:bg-violet-500',
        primaryText: 'text-violet-600 dark:text-violet-400',
        lightBg: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300',
        border: 'border-violet-500 dark:border-violet-400',
        ring: 'focus:ring-violet-500 focus:border-violet-500',
        badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
        gradient: 'from-violet-550 to-indigo-650',
        meshBg1: 'bg-violet-500/10 dark:bg-violet-500/18',
        meshBg2: 'bg-indigo-500/10 dark:bg-indigo-500/12',
        meshBg3: 'bg-purple-500/5 dark:bg-purple-500/8',
        appBg: 'bg-violet-50/15 dark:bg-zinc-950',
        hoverText: 'hover:text-violet-600 dark:hover:text-violet-400',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-950/20'
      };
    case 'emerald':
      return {
        primaryBg: 'bg-emerald-600 dark:bg-emerald-500',
        primaryHoverBg: 'hover:bg-emerald-700 dark:hover:bg-emerald-600',
        primaryText: 'text-emerald-600 dark:text-emerald-400',
        lightBg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500 dark:border-emerald-400',
        ring: 'focus:ring-emerald-500 focus:border-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
        gradient: 'from-emerald-500 to-teal-600',
        meshBg1: 'bg-emerald-500/10 dark:bg-emerald-500/18',
        meshBg2: 'bg-teal-500/10 dark:bg-teal-500/12',
        meshBg3: 'bg-green-550/5 dark:bg-green-550/8',
        appBg: 'bg-emerald-50/20 dark:bg-zinc-950',
        hoverText: 'hover:text-emerald-600 dark:hover:text-emerald-400',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
      };
    case 'purple':
      return {
        primaryBg: 'bg-purple-600 dark:bg-purple-500',
        primaryHoverBg: 'hover:bg-purple-700 dark:hover:bg-purple-600',
        primaryText: 'text-purple-600 dark:text-purple-400',
        lightBg: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
        border: 'border-purple-500 dark:border-purple-400',
        ring: 'focus:ring-purple-500 focus:border-purple-500',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
        gradient: 'from-purple-500 to-indigo-600',
        meshBg1: 'bg-purple-500/10 dark:bg-purple-500/18',
        meshBg2: 'bg-indigo-500/10 dark:bg-indigo-500/12',
        meshBg3: 'bg-pink-550/5 dark:bg-pink-550/8',
        appBg: 'bg-purple-50/20 dark:bg-zinc-950',
        hoverText: 'hover:text-purple-600 dark:hover:text-purple-400',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/20'
      };
    case 'amber':
      return {
        primaryBg: 'bg-amber-600 dark:bg-amber-500',
        primaryHoverBg: 'hover:bg-amber-700 dark:hover:bg-amber-600',
        primaryText: 'text-amber-600 dark:text-amber-400',
        lightBg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
        border: 'border-amber-500 dark:border-amber-400',
        ring: 'focus:ring-amber-500 focus:border-amber-500',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
        gradient: 'from-amber-500 to-orange-600',
        meshBg1: 'bg-amber-500/10 dark:bg-amber-500/18',
        meshBg2: 'bg-yellow-500/10 dark:bg-yellow-500/12',
        meshBg3: 'bg-orange-550/5 dark:bg-orange-550/8',
        appBg: 'bg-amber-50/20 dark:bg-zinc-950',
        hoverText: 'hover:text-amber-600 dark:hover:text-amber-400',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/20'
      };
    case 'rose':
      return {
        primaryBg: 'bg-rose-600 dark:bg-rose-500',
        primaryHoverBg: 'hover:bg-rose-700 dark:hover:bg-rose-650',
        primaryText: 'text-rose-600 dark:text-rose-450',
        lightBg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
        border: 'border-rose-500 dark:border-rose-400',
        ring: 'focus:ring-rose-500 focus:border-rose-500',
        badge: 'bg-rose-100 text-rose-850 dark:bg-rose-900/40 dark:text-rose-200',
        gradient: 'from-rose-500 to-pink-600',
        meshBg1: 'bg-rose-500/10 dark:bg-rose-500/18',
        meshBg2: 'bg-pink-500/10 dark:bg-pink-500/12',
        meshBg3: 'bg-red-550/5 dark:bg-red-550/8',
        appBg: 'bg-rose-50/20 dark:bg-zinc-950',
        hoverText: 'hover:text-rose-600 dark:hover:text-rose-450',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-950/20'
      };
    case 'indigo':
      return {
        primaryBg: 'bg-indigo-600 dark:bg-indigo-500',
        primaryHoverBg: 'hover:bg-indigo-700 dark:hover:bg-indigo-600',
        primaryText: 'text-indigo-600 dark:text-indigo-400',
        lightBg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-500 dark:border-indigo-400',
        ring: 'focus:ring-indigo-500 focus:border-indigo-500',
        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
        gradient: 'from-indigo-500 to-violet-600',
        meshBg1: 'bg-indigo-500/10 dark:bg-indigo-500/18',
        meshBg2: 'bg-blue-500/10 dark:bg-blue-500/12',
        meshBg3: 'bg-violet-550/5 dark:bg-violet-550/8',
        appBg: 'bg-indigo-50/20 dark:bg-zinc-950',
        hoverText: 'hover:text-indigo-600 dark:hover:text-indigo-400',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
      };
    case 'blue':
    default:
      return {
        primaryBg: 'bg-blue-600 dark:bg-blue-500',
        primaryHoverBg: 'hover:bg-blue-700 dark:hover:bg-blue-600',
        primaryText: 'text-blue-600 dark:text-blue-400',
        lightBg: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
        border: 'border-blue-500 dark:border-blue-400',
        ring: 'focus:ring-blue-500 focus:border-blue-500',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
        gradient: 'from-blue-500 to-cyan-600',
        meshBg1: 'bg-blue-500/10 dark:bg-blue-500/18',
        meshBg2: 'bg-purple-500/10 dark:bg-purple-500/12',
        meshBg3: 'bg-indigo-550/5 dark:bg-indigo-550/8',
        appBg: 'bg-slate-150/30 dark:bg-slate-950',
        hoverText: 'hover:text-blue-600 dark:hover:text-blue-400',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
      };
  }
}
