/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getThemeClasses } from '../../lib/themeUtils';
import { AttendanceRecord } from '../../types';
import { ReloadSupabaseButton } from '../ReloadSupabaseButton';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  UserCheck, 
  Users, 
  DollarSign, 
  BookOpen, 
  Calendar, 
  Receipt, 
  Eye, 
  X, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Layers,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminAsistenciasViewProps {
  onChangeTab?: (tab: string) => void;
}

export const AdminAsistenciasView: React.FC<AdminAsistenciasViewProps> = ({ onChangeTab }) => {
  const { 
    attendance, 
    updateAttendanceStatus, 
    teachers, 
    cursos, 
    theme, 
    facturas,
    addNotification 
  } = useApp();

  const cl = getThemeClasses(theme.accentColor);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'aprobadas' | 'rechazadas'>('pendientes');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('todos');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('todos');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Processing & Action states
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailModalRecord, setDetailModalRecord] = useState<AttendanceRecord | null>(null);

  // Check visual message banner state
  const [checkMessage, setCheckMessage] = useState<{
    show: boolean;
    title: string;
    description: string;
    count: number;
    amount: number;
  } | null>(null);

  // Helper to resolve attendance status
  const getRecordStatus = (att: AttendanceRecord): 'pendiente' | 'aprobada' | 'rechazada' => {
    if (att.estado === true || (att.estado as any) === 'ACEPTADO' || (att.estado as any) === 'Aceptado') {
      return 'aprobada';
    }
    if (att.estado === false || (att.estado as any) === 'RECHAZADO' || (att.estado as any) === 'Rechazado') {
      return 'rechazada';
    }
    return 'pendiente';
  };

  // Filtered attendance records
  const filteredAttendance = useMemo(() => {
    return attendance.filter(att => {
      const status = getRecordStatus(att);

      // Status filter
      if (statusFilter === 'pendientes' && status !== 'pendiente') return false;
      if (statusFilter === 'aprobadas' && status !== 'aprobada') return false;
      if (statusFilter === 'rechazadas' && status !== 'rechazada') return false;

      // Teacher filter
      if (selectedTeacherFilter !== 'todos' && att.teacherId !== selectedTeacherFilter && att.teacherName !== selectedTeacherFilter) {
        return false;
      }

      // Course filter
      if (selectedCourseFilter !== 'todos' && att.courseId !== selectedCourseFilter && att.course !== selectedCourseFilter) {
        return false;
      }

      // Search query (teacher, course, date, theme, comments)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTeacher = (att.teacherName || '').toLowerCase().includes(q);
        const matchesCourse = (att.course || '').toLowerCase().includes(q);
        const matchesComments = (att.comments || '').toLowerCase().includes(q);
        const matchesDate = (att.date || '').toLowerCase().includes(q);
        const matchesId = (att.id || '').toLowerCase().includes(q);
        if (!matchesTeacher && !matchesCourse && !matchesComments && !matchesDate && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [attendance, statusFilter, selectedTeacherFilter, selectedCourseFilter, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    let total = attendance.length;
    let pendientes = 0;
    let aprobadas = 0;
    let rechazadas = 0;
    let montoPendiente = 0;
    let montoTotalAprobado = 0;

    attendance.forEach(att => {
      const status = getRecordStatus(att);
      const sesiones = Number(att.cantidadSesiones) || 1;
      const monto = Number(att.monto) > 0 ? Number(att.monto) : sesiones * 150;

      if (status === 'pendiente') {
        pendientes++;
        montoPendiente += monto;
      } else if (status === 'aprobada') {
        aprobadas++;
        montoTotalAprobado += monto;
      } else if (status === 'rechazada') {
        rechazadas++;
      }
    });

    return { total, pendientes, aprobadas, rechazadas, montoPendiente, montoTotalAprobado };
  }, [attendance]);

  // Selected records summary
  const selectedRecords = useMemo(() => {
    return attendance.filter(a => selectedIds.has(a.id));
  }, [attendance, selectedIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedRecords.reduce((sum, att) => {
      const sesiones = Number(att.cantidadSesiones) || 1;
      return sum + (Number(att.monto) > 0 ? Number(att.monto) : sesiones * 150);
    }, 0);
  }, [selectedRecords]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.size === filteredAttendance.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAttendance.map(a => a.id)));
    }
  };

  const handleSelectOnlyPending = () => {
    const pendingIds = filteredAttendance
      .filter(a => getRecordStatus(a) === 'pendiente')
      .map(a => a.id);
    setSelectedIds(new Set(pendingIds));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Approval flow execution for a single record
  const handleApproveSingle = async (att: AttendanceRecord) => {
    setIsProcessing(true);
    try {
      await updateAttendanceStatus(att.id, true);
      const sesiones = Number(att.cantidadSesiones) || 1;
      const monto = Number(att.monto) > 0 ? Number(att.monto) : sesiones * 150;

      setCheckMessage({
        show: true,
        title: '¡Asistencia Aprobada con Éxito!',
        description: `Se aprobó la sesión de ${att.teacherName} (${att.course}) y se generó su Recibo por Honorarios Electrónico (E001) en la Bóveda.`,
        count: 1,
        amount: monto
      });

      addNotification({
        title: '✅ Asistencia Aprobada',
        content: `Asistencia de ${att.teacherName} aprobada. Comprobante E001 emitido por S/. ${monto.toFixed(2)}.`,
        type: 'success'
      });

      // Remove from selected set if present
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(att.id);
        return next;
      });

      setTimeout(() => setCheckMessage(null), 5000);
    } catch (err: any) {
      alert('Error al aprobar asistencia: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Rejection flow execution for a single record
  const handleRejectSingle = async (att: AttendanceRecord) => {
    if (!confirm(`¿Estás seguro de rechazar la asistencia de ${att.teacherName} (${att.course})?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      await updateAttendanceStatus(att.id, false);
      addNotification({
        title: '❌ Asistencia Rechazada',
        content: `Se ha marcado como rechazada la sesión de ${att.teacherName}.`,
        type: 'warning'
      });
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(att.id);
        return next;
      });
    } catch (err: any) {
      alert('Error al rechazar asistencia: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Approval execution
  const handleApproveSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const totalAmount = selectedTotalAmount;

    setIsProcessing(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await updateAttendanceStatus(id, true);
      }

      setCheckMessage({
        show: true,
        title: `¡${count} Asistencias Aprobadas con Éxito!`,
        description: `Se procesaron las ${count} asistencias seleccionadas. Se generaron sus respectivos comprobantes de liquidación de honorarios (E001) registrados en la Bóveda del sistema.`,
        count,
        amount: totalAmount
      });

      addNotification({
        title: `✅ ${count} Asistencias Aprobadas en Bloque`,
        content: `Liquidación total generada por S/. ${totalAmount.toFixed(2)}. Facturas electrónicas registradas.`,
        type: 'success'
      });

      setSelectedIds(new Set());
      setTimeout(() => setCheckMessage(null), 6000);
    } catch (err: any) {
      alert('Error durante la aprobación masiva: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Rejection execution
  const handleRejectSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Estás seguro de rechazar las ${selectedIds.size} asistencias seleccionadas?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await updateAttendanceStatus(id, false);
      }

      addNotification({
        title: `❌ ${selectedIds.size} Asistencias Rechazadas`,
        content: 'Las sesiones seleccionadas fueron marcadas como rechazadas.',
        type: 'warning'
      });

      setSelectedIds(new Set());
    } catch (err: any) {
      alert('Error durante el rechazo masivo: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Check Banner Message (Check Message Confirmation) */}
      <AnimatePresence>
        {checkMessage && checkMessage.show && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-5 bg-emerald-500 text-white rounded-2xl shadow-xl border border-emerald-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
          >
            {/* Background glowing particle */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start md:items-center gap-3.5 z-10">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-7 h-7 text-white animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold tracking-tight text-white">
                    {checkMessage.title}
                  </h4>
                  <span className="bg-white/25 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Flujo Completado
                  </span>
                </div>
                <p className="text-xs text-white/95 leading-relaxed max-w-2xl font-medium">
                  {checkMessage.description}
                </p>
                <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-white/90">
                  <span>Sesiones aprobadas: <strong className="text-white font-mono">{checkMessage.count}</strong></span>
                  <span>•</span>
                  <span>Total liquidado: <strong className="text-white font-mono">S/. {checkMessage.amount.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center z-10">
              {onChangeTab && (
                <button
                  type="button"
                  onClick={() => onChangeTab('facturas')}
                  className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Ver en Bóveda
                </button>
              )}
              <button
                type="button"
                onClick={() => setCheckMessage(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <CalendarCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">
                Módulo de Asistencias Docentes
              </h1>
              {stats.pendientes > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                  {stats.pendientes} por aprobar
                </span>
              )}
            </div>
            <p className="text-xs text-gray-700 dark:text-zinc-300 max-w-2xl leading-relaxed">
              Bandeja centralizada para supervisar, aprobar o rechazar las asistencias registradas por los profesores. Al aprobar, el sistema emite el Recibo por Honorarios (<strong className="text-black dark:text-white font-mono">E001</strong>) y habilita el pago de haberes correspondiente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ReloadSupabaseButton label="Recargar" showDatabaseBadge={true} />
            {stats.pendientes > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={async () => {
                  const pending = attendance.filter(a => getRecordStatus(a) === 'pendiente');
                  if (!pending.length) return;
                  if (!confirm(`¿Deseas aprobar todas las ${pending.length} asistencias pendientes de una sola vez?`)) {
                    return;
                  }
                  setIsProcessing(true);
                  try {
                    let totalAmt = 0;
                    for (const p of pending) {
                      await updateAttendanceStatus(p.id, true);
                      const sesiones = Number(p.cantidadSesiones) || 1;
                      totalAmt += Number(p.monto) > 0 ? Number(p.monto) : sesiones * 150;
                    }
                    setCheckMessage({
                      show: true,
                      title: '¡Todas las Asistencias Pendientes Aprobadas!',
                      description: `Se aprobaron ${pending.length} sesiones pendientes. Comprobantes emitidos y registrados en Bóveda.`,
                      count: pending.length,
                      amount: totalAmt
                    });
                    setTimeout(() => setCheckMessage(null), 6000);
                  } catch (e: any) {
                    alert('Error: ' + e.message);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar Todo Pendiente ({stats.pendientes})</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
          {/* Card 1: Pendientes */}
          <div 
            onClick={() => setStatusFilter('pendientes')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'pendientes'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-850/50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Pendientes
              </span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1">
              {stats.pendientes}
            </div>
            <div className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 font-mono mt-0.5">
              S/. {stats.montoPendiente.toFixed(2)} por devengar
            </div>
          </div>

          {/* Card 2: Aprobadas */}
          <div 
            onClick={() => setStatusFilter('aprobadas')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'aprobadas'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-855/50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Aprobadas
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
              {stats.aprobadas}
            </div>
            <div className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 font-mono mt-0.5">
              S/. {stats.montoTotalAprobado.toFixed(2)} emitidos
            </div>
          </div>

          {/* Card 3: Rechazadas */}
          <div 
            onClick={() => setStatusFilter('rechazadas')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'rechazadas'
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/20'
                : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-855/50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Rechazadas
              </span>
              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-1">
              {stats.rechazadas}
            </div>
            <div className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 mt-0.5">
              No procedentes
            </div>
          </div>

          {/* Card 4: Total Clases */}
          <div 
            onClick={() => setStatusFilter('todos')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'todos'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-855/50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                Total Sesiones
              </span>
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-xl font-black text-black dark:text-white font-mono mt-1">
              {stats.total}
            </div>
            <div className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 mt-0.5">
              Historial acumulado
            </div>
          </div>

          {/* Card 5: Docentes Activos */}
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-855/50 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                Plana Docente
              </span>
              <Users className="w-3.5 h-3.5 text-gray-600 dark:text-zinc-400" />
            </div>
            <div className="text-xl font-black text-black dark:text-white font-mono mt-1">
              {teachers.length}
            </div>
            <div className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 mt-0.5">
              Profesores registrados
            </div>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar (Multi-Select Automation) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="sticky top-4 z-30 p-4 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl shadow-2xl border border-gray-700 dark:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs font-mono shadow-sm">
                {selectedIds.size}
              </div>
              <div>
                <span className="text-xs font-bold block text-white dark:text-zinc-900">
                  {selectedIds.size} {selectedIds.size === 1 ? 'asistencia seleccionada' : 'asistencias seleccionadas'}
                </span>
                <span className="text-[11px] text-gray-300 dark:text-zinc-600 font-mono font-bold">
                  Monto a devengar: S/. {selectedTotalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApproveSelected}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Aprobar Seleccionados ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRejectSelected}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
                <span>Rechazar</span>
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-2 bg-gray-800 dark:bg-zinc-200 hover:bg-gray-700 dark:hover:bg-zinc-300 text-gray-200 dark:text-zinc-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Deseleccionar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(['pendientes', 'aprobadas', 'rechazadas', 'todos'] as const).map(st => {
              const active = statusFilter === st;
              const count = st === 'pendientes' ? stats.pendientes : st === 'aprobadas' ? stats.aprobadas : st === 'rechazadas' ? stats.rechazadas : stats.total;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs'
                      : 'text-gray-650 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    active ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Select Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 text-black dark:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              {selectedIds.size === filteredAttendance.length && filteredAttendance.length > 0
                ? 'Deseleccionar todo'
                : 'Seleccionar visibles'}
            </button>
            {stats.pendientes > 0 && (
              <button
                type="button"
                onClick={handleSelectOnlyPending}
                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Seleccionar pendientes ({stats.pendientes})
              </button>
            )}
          </div>
        </div>

        {/* Search bar & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800">
          {/* Search box with crisp high-contrast black/white text */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar profesor, curso, tema o fecha..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Teacher Selector */}
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos los Docentes ({teachers.length})</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name || `${t.nombre || ''} ${t.apellido || ''}`.trim() || t.id}
                </option>
              ))}
            </select>
          </div>

          {/* Course Selector */}
          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos los Cursos ({cursos.length})</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (S/. {c.pago.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / Attendance Sessions List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredAttendance.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-gray-400">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-black dark:text-white">
                No se encontraron asistencias
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {statusFilter === 'pendientes'
                  ? '¡Excelente! No hay asistencias pendientes por aprobar en este momento.'
                  : 'No hay registros que coincidan con los filtros seleccionados.'}
              </p>
            </div>
            {statusFilter !== 'todos' && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('todos');
                  setSearchQuery('');
                  setSelectedTeacherFilter('todos');
                  setSelectedCourseFilter('todos');
                }}
                className="px-3.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-semibold text-black dark:text-white rounded-lg transition-colors cursor-pointer"
              >
                Ver todas las asistencias
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/75 dark:bg-zinc-850/50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredAttendance.length && filteredAttendance.length > 0}
                      onChange={handleSelectAllVisible}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-4">Curso / Tema</th>
                  <th className="py-3 px-4">Fecha & Horario</th>
                  <th className="py-3 px-4">Alumnos</th>
                  <th className="py-3 px-4 text-right">Monto Devengado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
                {filteredAttendance.map((att, idx) => {
                  const status = getRecordStatus(att);
                  const isSelected = selectedIds.has(att.id);
                  const prof = teachers.find(
                    t => t.id === att.teacherId || t.name === att.teacherName
                  );
                  const profName = prof ? prof.name : (att.teacherName || 'Docente');
                  const avatarUrl = prof?.avatarUrl || prof?.foto_url;
                  const sesiones = Number(att.cantidadSesiones) || 1;
                  const monto = Number(att.monto) > 0 ? Number(att.monto) : sesiones * 150;
                  const studentsCount = att.students?.length || 0;
                  const presentCount = att.students?.filter(s => s.present).length || 0;

                  return (
                    <tr
                      key={att.id}
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20' 
                          : 'hover:bg-gray-50/50 dark:hover:bg-zinc-850/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(att.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Docente */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={profName}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {profName.charAt(0)}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <span className="font-bold text-black dark:text-white block truncate max-w-[160px]">
                              {profName}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              {prof?.subject || prof?.dni || 'Titular'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Curso / Tema */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-[200px]">
                          <span className="font-bold text-black dark:text-white block truncate">
                            {att.course || 'Clase General'}
                          </span>
                          <span className="text-[10px] text-gray-500 block truncate" title={att.comments}>
                            {att.comments || 'Sin observaciones detalladas'}
                          </span>
                        </div>
                      </td>

                      {/* Fecha & Horario */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-black dark:text-white block font-mono">
                            {att.date}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            {att.inicio || att.time || '08:00'} - {att.fin || '10:00'} ({sesiones} {sesiones === 1 ? 'sesión' : 'sesiones'})
                          </span>
                        </div>
                      </td>

                      {/* Alumnos */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailModalRecord(att)}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-[11px] font-semibold text-black dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          <span>
                            {presentCount}/{studentsCount} presentes
                          </span>
                          <Eye className="w-3 h-3 text-gray-400" />
                        </button>
                      </td>

                      {/* Monto Devengado */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          S/. {monto.toFixed(2)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {status === 'aprobada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Aprobada (E001)
                          </span>
                        ) : status === 'rechazada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rechazada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                            Por Aprobar
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {status === 'pendiente' ? (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApproveSingle(att)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Aprobar asistencia y emitir recibo E001"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Aprobar</span>
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleRejectSingle(att)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Rechazar asistencia"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Rechazar</span>
                              </button>
                            </>
                          ) : status === 'aprobada' ? (
                            <div className="flex items-center gap-1.5">
                              {onChangeTab && (
                                <button
                                  type="button"
                                  onClick={() => onChangeTab('facturas')}
                                  className="px-2.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Ver Recibo por Honorarios en Bóveda"
                                >
                                  <Receipt className="w-3 h-3 text-indigo-500" />
                                  <span>Recibo E001</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleRejectSingle(att)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Reevaluar a rechazado"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApproveSingle(att)}
                              className="px-2.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-black dark:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reevaluar y aprobar"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reevaluar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Attendance Detail Modal */}
      {detailModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Detalle de Asistencia Estudiantil</span>
                </h3>
                <p className="text-xs text-gray-500">
                  {detailModalRecord.course} • {detailModalRecord.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalRecord(null)}
                className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Profesor Titular</span>
                <span className="font-bold text-black dark:text-white">{detailModalRecord.teacherName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Monto de Sesión</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  S/. {(detailModalRecord.monto || (Number(detailModalRecord.cantidadSesiones) || 1) * 150).toFixed(2)}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-gray-200/60 dark:border-zinc-700/60">
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Tema / Bitácora</span>
                <span className="text-black dark:text-white font-medium">
                  {detailModalRecord.comments || 'Sin comentarios registrados por el profesor.'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Lista de Estudiantes ({detailModalRecord.students?.length || 0})
              </span>
              {detailModalRecord.students && detailModalRecord.students.length > 0 ? (
                detailModalRecord.students.map((st, i) => (
                  <div
                    key={st.studentId || i}
                    className="p-2.5 rounded-xl border border-gray-150 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-850/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        st.present 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {i + 1}
                      </div>
                      <span className="text-xs font-bold text-black dark:text-white">
                        {st.studentName}
                      </span>
                    </div>
                    {st.present ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Presente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Ausente
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-4 text-center">
                  No se registraron alumnos individuales para esta sesión.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
              <span className="text-xs text-gray-500">
                Estado actual: <strong>{getRecordStatus(detailModalRecord).toUpperCase()}</strong>
              </span>
              <div className="flex items-center gap-2">
                {getRecordStatus(detailModalRecord) === 'pendiente' && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleApproveSingle(detailModalRecord);
                        setDetailModalRecord(null);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleRejectSingle(detailModalRecord);
                        setDetailModalRecord(null);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setDetailModalRecord(null)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
