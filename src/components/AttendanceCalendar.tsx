import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { AttendanceRecord } from '../types';

interface AttendanceCalendarProps {
  studentId: string;
  studentName: string;
  attendance: AttendanceRecord[];
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  studentId,
  studentName,
  attendance
}) => {
  // Let's set default active date to June 2026, which matches our system local time (June 2026) and mock data
  const [currentDate, setCurrentDate] = useState(() => {
    const sysDate = new Date();
    // Default to school year 2026, month of June (index 5)
    return new Date(2026, 5, 15);
  });

  const [selectedDayRecord, setSelectedDayRecord] = useState<AttendanceRecord | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekdayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Filter attendance records for this student and this month/year
  const studentRecordsInMonth = useMemo(() => {
    return attendance.filter(record => {
      if (!record.date) return false;
      const [yearStr, monthStr] = record.date.split('-');
      const recordYear = parseInt(yearStr, 10);
      const recordMonth = parseInt(monthStr, 10) - 1; // 1-to-12 -> 0-to-11
      
      const isMatchingStudent = record.students.some(s => s.studentId === studentId);
      const isMatchingDate = recordYear === currentYear && recordMonth === currentMonthIdx;
      
      return isMatchingStudent && isMatchingDate;
    });
  }, [attendance, studentId, currentYear, currentMonthIdx]);

  // Map representation of student record by day of month (e.g. "12": { record, present })
  const dayRecordsMap = useMemo(() => {
    const map: Record<number, { record: AttendanceRecord; present: boolean }> = {};
    studentRecordsInMonth.forEach(record => {
      const day = parseInt(record.date.split('-')[2], 10);
      const studentInstance = record.students.find(s => s.studentId === studentId);
      if (studentInstance) {
        map[day] = {
          record,
          present: studentInstance.present
        };
      }
    });
    return map;
  }, [studentRecordsInMonth, studentId]);

  // Calculate monthly metrics
  const stats = useMemo(() => {
    const total = studentRecordsInMonth.length;
    const present = studentRecordsInMonth.filter(record => {
      const studentInstance = record.students.find(s => s.studentId === studentId);
      return studentInstance?.present === true;
    }).length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    return { total, present, absent, rate };
  }, [studentRecordsInMonth, studentId]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedDayRecord(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDayRecord(null);
  };

  // Build calendar days
  const calendarCells = useMemo(() => {
    // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstDayOfCurrentMonth = new Date(currentYear, currentMonthIdx, 1).getDay();
    
    // Convert Sunday (0) to Monday-start indexing (0 = Mon, 1 = Tue, ..., 6 = Sun)
    // Sunday (0) -> 6
    // Monday (1) -> 0
    // Tuesday (2) -> 1, etc.
    const startingDayIndex = firstDayOfCurrentMonth === 0 ? 6 : firstDayOfCurrentMonth - 1;

    // Days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();

    const cells: { day: number | null; isCurrentMonth: boolean }[] = [];

    // Prepend empty cells with null day for previous month spaces
    for (let i = 0; i < startingDayIndex; i++) {
      cells.push({ day: null, isCurrentMonth: false });
    }

    // Add days of active month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      cells.push({ day, isCurrentMonth: true });
    }

    return cells;
  }, [currentYear, currentMonthIdx]);

  return (
    <div className="space-y-4 font-sans select-none" id={`attendance-calendar-${studentId}`}>
      {/* Visual statistics ribbon */}
      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        Reporte Mensual de Asistencia ({monthNames[currentMonthIdx]} {currentYear})
      </h4>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20 text-center">
          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Asistencias</p>
          <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.present}</h4>
          <span className="text-[8px] text-gray-400 block mt-0.5">Clases presentes</span>
        </div>
        <div className="bg-rose-500/10 dark:bg-rose-500/5 p-3 rounded-2xl border border-rose-500/20 text-center">
          <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Inasistencias</p>
          <h4 className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">{stats.absent}</h4>
          <span className="text-[8px] text-gray-400 block mt-0.5">Clases ausentes</span>
        </div>
        <div className="bg-blue-500/10 dark:bg-blue-500/5 p-3 rounded-2xl border border-blue-500/20 text-center">
          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tasa Mensual</p>
          <h4 className="text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5">{stats.rate}%</h4>
          <span className="text-[8px] text-gray-400 block mt-0.5">Cumplimiento total</span>
        </div>
      </div>

      {/* Main calendar box */}
      <div className="bg-gray-50/50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-100 dark:border-zinc-850">
        <div className="flex items-center justify-between mb-3.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 px-1.5 bg-white dark:bg-zinc-90 w-8 h-8 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-200">
              {monthNames[currentMonthIdx]} {currentYear}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 px-1.5 bg-white dark:bg-zinc-90 w-8 h-8 rounded-xl border border-gray-150 dark:border-zinc-800 shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[9px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
          {weekdayNames.map(dayName => (
            <div key={dayName} className="py-1">{dayName}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell, idx) => {
            const { day } = cell;
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
            }

            const recordInfo = dayRecordsMap[day];
            let cellBg = "hover:bg-gray-150 dark:hover:bg-zinc-900";
            let markerDot = null;
            let tooltipClass = "";

            if (recordInfo) {
              if (recordInfo.present) {
                cellBg = "bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/35 hover:bg-emerald-500/20";
                markerDot = <span className="absolute bottom-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />;
              } else {
                cellBg = "bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/35 hover:bg-rose-500/20";
                markerDot = <span className="absolute bottom-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />;
              }
            }

            const isSelected = selectedDayRecord && parseInt(selectedDayRecord.date.split('-')[2], 10) === day;

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => recordInfo && setSelectedDayRecord(recordInfo.record)}
                disabled={!recordInfo}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${cellBg} ${
                  isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                } ${recordInfo ? 'cursor-pointer' : 'text-gray-400 dark:text-zinc-650 opacity-60'}`}
              >
                <span className={recordInfo ? 'text-gray-800 dark:text-zinc-150' : ''}>{day}</span>
                {markerDot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info helper block if no day is clicked */}
      {!selectedDayRecord && stats.total > 0 && (
        <div className="p-3 bg-gray-50/70 dark:bg-zinc-950/45 rounded-2xl border border-gray-150/40 dark:border-zinc-850 flex items-start gap-2.5 text-[11px] text-gray-500 dark:text-zinc-400">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Toca cualquiera de los días resaltados en <span className="text-emerald-500 font-bold">verde (asistencia)</span> o <span className="text-rose-500 font-bold">rojo (inasistencia)</span> para ver la retroalimentación del docente, hora y más detalles.
          </p>
        </div>
      )}

      {/* Detailed dialog box for selected day's record */}
      {selectedDayRecord && (
        <div className="bg-white dark:bg-zinc-900 border border-indigo-150/30 dark:border-zinc-800 rounded-2xl p-4 shadow-xl shadow-indigo-500/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600" />
          
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-mono">
              Fecha: {selectedDayRecord.date}
            </span>
            {selectedDayRecord.students.find(s => s.studentId === studentId)?.present ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                <CheckCircle className="w-3 h-3" /> Asistió
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 px-2 py-0.5 rounded-full font-bold">
                <XCircle className="w-3 h-3" /> Ausente
              </span>
            )}
          </div>

          <h5 className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Clase: {selectedDayRecord.course}
          </h5>

          <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>Docente: <strong className="text-gray-700 dark:text-zinc-300 font-semibold">{selectedDayRecord.teacherName}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Hora de registro: <span className="font-mono">{selectedDayRecord.time}</span></span>
            </div>
            {selectedDayRecord.comments && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-zinc-850 flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed italic text-gray-600 dark:text-zinc-350 bg-gray-50 dark:bg-zinc-950/30 p-2 rounded-xl border border-gray-100 dark:border-zinc-850/50 w-full">
                  "{selectedDayRecord.comments}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
