/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AIBoardSandbox } from '../AIBoardSandbox';
import { AISystemReview } from '../AISystemReview';
import { TeslaAIChatView } from './TeslaAIChatView';
import { NewsAnnouncementsView } from './NewsAnnouncementsView';
import { BovedaFacturasView } from './BovedaFacturasView';
import { VercelEnvConfigCard } from '../VercelEnvConfigCard';
import { uploadToCloudinaryClient } from '../../services/clientServices';
import { AttendanceRecord, StudentAttendanceInstance, AccentColor, ResourceItem } from '../../types';
import { getThemeClasses } from '../../lib/themeUtils';
import { exportToCSV, exportTransactionsToPDF } from '../../utils/exportUtils';
import { generateTeacherBoleta } from '../../utils/pdfGenerator';
import { 
  Calendar, 
  CalendarClock, 
  CheckSquare, 
  Wallet, 
  Folder, 
  FileText, 
  Plus, 
  Search, 
  File, 
  ArrowUpRight, 
  CheckCircle,
  XCircle, 
  X, 
  MessageSquare,
  Sparkles,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCheck,
  ChevronRight,
  GripVertical,
  Settings,
  Download,
  FileSpreadsheet,
  FileDown,
  Trash2,
  Award,
  AlertCircle,
  Check,
  ClipboardList,
  Users,
  Edit,
  Save,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DocenteDashboardProps {
  activeTab: string;
  onChangeTab?: (tab: any) => void;
}

export const DocenteDashboard: React.FC<DocenteDashboardProps> = ({ activeTab, onChangeTab }) => {
  const { 
    currentUser, students, teachers, resources, 
    transactions, attendance, registerAttendance, 
    theme, updateTheme, news, cursos, refreshCursos,
    servicios, servicioCursos, servicioProfesores,
    notas, addNota, updateNota, deleteNota, addFactura
  } = useApp();

  const cl = getThemeClasses(theme.accentColor);

  // Match current logged in docente spec details
  const matchedDocente = teachers.find(t => t.email.toLowerCase() === currentUser?.email.toLowerCase());
  const teacherId = matchedDocente?.id || (teachers[0]?.id || 'f83d91bb-5991-49e0-811c-dcd2f3c8a001');
  const teacherName = matchedDocente?.name || currentUser?.name || 'Prof. Carlos Fuentes';
  const teacherSubject = matchedDocente?.subject || 'Matemáticas';

  // State for Notas module
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedNotaCourseId, setSelectedNotaCourseId] = useState<string>('');
  const [newGradeInputs, setNewGradeInputs] = useState<Record<string, string>>({});
  const [tempAssignedServiceIds, setTempAssignedServiceIds] = useState<string[]>([]);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedStudentIdForModal, setSelectedStudentIdForModal] = useState<string | null>(null);
  const [modalRows, setModalRows] = useState<Record<string, string>>({});
  const [newModalGradeInput, setNewModalGradeInput] = useState<string>('');

  // Find database assigned services
  const teacherServiceLinks = (servicioProfesores || []).filter(sp => {
    const tId = sp.id_profesor || sp.profesor_id || sp.teacherId;
    return tId === teacherId;
  });
  const dbTeacherServiceIds = teacherServiceLinks.map(sp => sp.id_servicio || sp.servicioId);
  const teacherServiceIds = Array.from(new Set([...dbTeacherServiceIds, ...tempAssignedServiceIds]));
  const teacherServices = (servicios || []).filter(s => teacherServiceIds.includes(s.id));

  // Auto-select first service when activeTab is 'notas' and services are available
  useEffect(() => {
    if (activeTab === 'notas') {
      if (teacherServices.length > 0 && !selectedServiceId) {
        setSelectedServiceId(teacherServices[0].id);
      }
    }
  }, [activeTab, teacherServices.length, selectedServiceId]);

  // Find courses linked to the selected service
  const getCoursesForService = (serviceId: string) => {
    const linked = (servicioCursos || []).filter(sc => {
      const sId = sc.servicio_id || sc.servicioId || sc.id_servicio;
      return sId === serviceId;
    });
    const courseIds = linked.map(sc => sc.curso_id || sc.cursoId || sc.id_curso);
    return (cursos || []).filter(c => courseIds.includes(c.id));
  };

  const serviceCourses = selectedServiceId ? getCoursesForService(selectedServiceId) : [];

  // Auto-select first course when service changes
  useEffect(() => {
    if (serviceCourses.length > 0) {
      if (!serviceCourses.some(c => c.id === selectedNotaCourseId)) {
        setSelectedNotaCourseId(serviceCourses[0].id);
      }
    } else {
      setSelectedNotaCourseId('');
    }
  }, [selectedServiceId, serviceCourses.length]);

  // Sub-state for Mis Asistencias
  const [showRegisterAttendance, setShowRegisterAttendance] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('Grupo General');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [cantidadSesiones, setCantidadSesiones] = useState(1);
  const [startTime, setStartTime] = useState('15:00');
  const [endTime, setEndTime] = useState('17:00');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [comments, setComments] = useState('');
  
  React.useEffect(() => {
    if (cursos && cursos.length > 0 && !selectedCourseId) {
      setSelectedCourseId(cursos[0].id);
    }
  }, [cursos, selectedCourseId]);

  // Initialize checklist for students of the selected grade/course
  const [studentCheckerList, setStudentCheckerList] = useState<{ id: string; name: string; present: boolean }[]>(() => {
    return students.map(s => ({ id: s.id, name: s.name, present: true }));
  });

  // Sync student checklist when students list or course selection changes
  React.useEffect(() => {
    if (students && students.length > 0) {
      setStudentCheckerList(
        students.map(s => ({ id: s.id, name: s.name, present: true }))
      );
    }
  }, [students, selectedCourseId]);

  // Resources state (Docente read only)
  const [currentFolder, setCurrentFolder] = useState<ResourceItem | null>(null);
  const [resourceSearch, setResourceSearch] = useState('');

  // Quick actions widget state for Docente
  const [docenteWidgets, setDocenteWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('edu_docente_widgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return ['mark-attendance', 'view-materials', 'view-salary', 'system-config'];
  });
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [draggedWidgetIdx, setDraggedWidgetIdx] = useState<number | null>(null);

  const [isSavingDocentePayment, setIsSavingDocentePayment] = useState(false);
  const [saveDocentePaymentMessage, setSaveDocentePaymentMessage] = useState('');

  // Real-time Sidebar collapse settings
  const [sidebarHideIcons, setSidebarHideIcons] = useState(() => {
    return localStorage.getItem('edu_sidebar_hide_icons') === 'true';
  });

  React.useEffect(() => {
    const handleSync = () => {
      setSidebarHideIcons(localStorage.getItem('edu_sidebar_hide_icons') === 'true');
    };
    window.addEventListener('sidebar-config-changed', handleSync);
    return () => {
      window.removeEventListener('sidebar-config-changed', handleSync);
    };
  }, []);

  const handleToggleSidebarHideIcons = (hide: boolean) => {
    setSidebarHideIcons(hide);
    localStorage.setItem('edu_sidebar_hide_icons', String(hide));
    window.dispatchEvent(new Event('sidebar-config-changed'));
  };

  const handleTogglePresent = (index: number) => {
    setStudentCheckerList(prev => prev.map((s, idx) => {
      if (idx === index) {
        return { ...s, present: !s.present };
      }
      return s;
    }));
  };

  // Submit recorded classroom attendance checklist (Steps: Save to vault first via Cloudinary, then confirm payment)
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 [DOCENTE-PAGO-FRONTEND] >>> Iniciando guardado de asistencia y cálculo de honorarios de docente...");
    
    const checklist: StudentAttendanceInstance[] = studentCheckerList.map(item => ({
      studentId: item.id,
      studentName: item.name,
      present: item.present
    }));

    const courseObj = cursos.find(c => c.id === selectedCourseId);
    if (!courseObj) {
      console.error("❌ [DOCENTE-PAGO-FRONTEND] Error: No se seleccionó un curso válido.");
      alert("Por favor seleccione un curso válido.");
      return;
    }
    const courseName = courseObj.nombre;
    const coursePago = courseObj.pago;
    const calculatedMonto = cantidadSesiones * 2 * coursePago;

    console.log(`💼 [DOCENTE-PAGO-FRONTEND] Detalle del cálculo: ${cantidadSesiones} sesiones × 2 horas = S/. ${calculatedMonto.toFixed(2)} (${courseName})`);

    setIsSavingDocentePayment(true);
    setSaveDocentePaymentMessage("Generando recibo de honorarios en PDF...");

    try {
      // Create temporary attendance record for PDF generation
      const tempRecord: AttendanceRecord = {
        id: `temp-${Date.now()}`,
        teacherId,
        teacherName,
        course: courseName,
        courseId: selectedCourseId,
        date: attendanceDate,
        time: startTime,
        students: checklist,
        comments: comments || undefined,
        inicio: startTime,
        fin: endTime,
        cantidadSesiones,
        monto: calculatedMonto
      };

      // 1. Generate Teacher PDF base64
      console.log("📄 [DOCENTE-PAGO-FRONTEND] Paso 1: Generando PDF de honorarios para el profesor...");
      const pdfResult = generateTeacherBoleta(
        matchedDocente || { id: teacherId, name: teacherName, dni: 'No registrado', email: currentUser?.email || '', subject: teacherSubject, salary: '1500', rol: 'profesor' } as any,
        [tempRecord],
        false // do not download
      );
      console.log(`📄 [DOCENTE-PAGO-FRONTEND] PDF generado con éxito. ID temporal: ${pdfResult.id}. Tamaño de cadena Base64: ${pdfResult.base64.length} caracteres.`);

      setSaveDocentePaymentMessage("Guardando en la bóveda (subiendo a Cloudinary)...");

      // 2. Upload PDF to Cloudinary (Client-Side)
      let pdfUrl = '';
      console.log("☁️ [DOCENTE-PAGO-FRONTEND] Paso 2: Subiendo PDF a Cloudinary...");
      try {
        const uploadResult = await uploadToCloudinaryClient(pdfResult.base64, `${pdfResult.id}.pdf`);
        pdfUrl = uploadResult.url;
        console.log("☁️ [DOCENTE-PAGO-FRONTEND] Resultado de subida:", uploadResult.message);
      } catch (uploadErr) {
        console.error('❌ [DOCENTE-PAGO-FRONTEND] Error de conexión al enviar comprobante a Cloudinary:', uploadErr);
      }

      // 3. Save to the Bóveda de Facturas
      console.log("🔒 [DOCENTE-PAGO-FRONTEND] Paso 3: Guardando recibo en la Bóveda de Facturas del Sistema...");
      const savedFactura = await addFactura({
        tipo: 'profesor',
        teacher_id: teacherId,
        monto: calculatedMonto,
        estado: 'emitida',
        concepto: `Recibo de Honorarios - ${teacherName} - ${courseName} (${attendanceDate})`,
        pdf_url: pdfUrl || undefined,
        detalles: {
          nombrePersona: teacherName,
          dniDocente: matchedDocente?.dni || 'No registrado',
          clasesDictadas: cantidadSesiones,
          tarifaPorClase: coursePago
        }
      });
      console.log("🔒 [DOCENTE-PAGO-FRONTEND] ¡Índice de Bóveda para el docente registrado y asegurado!", savedFactura);

      setSaveDocentePaymentMessage("Confirmando y registrando asistencia...");

      // 4. Confirm attendance & payment
      console.log("📝 [DOCENTE-PAGO-FRONTEND] Paso 4: Registrando asistencia en la base de datos de clases...");
      await registerAttendance({
        teacherId,
        teacherName,
        course: courseName,
        courseId: selectedCourseId,
        date: attendanceDate,
        students: checklist,
        comments: comments || undefined,
        inicio: startTime,
        fin: endTime,
        cantidadSesiones,
        monto: calculatedMonto
      });

      console.log("✅ [DOCENTE-PAGO-FRONTEND] ¡Operación completada con éxito absoluto!");

      // Success
      setIsSavingDocentePayment(false);
      setComments('');
      setCantidadSesiones(1);
      setShowRegisterAttendance(false);
      
      alert(`¡Pago confirmado con éxito!\nLa boleta de honorario se resguardó en la bóveda de Cloudinary e indexó correctamente.\nMonto calculado: S/. ${calculatedMonto.toFixed(2)}.`);
    } catch (err: any) {
      console.error("❌ [DOCENTE-PAGO-FRONTEND] Error crítico durante el flujo de registro:", err);
      setIsSavingDocentePayment(false);
      alert(`Error al procesar el pago e ingresarlo a la bóveda: ${err.message || err}`);
    }
  };


  /* =========================================================================
     MODULE: INICIO (TEACHER PORTAL HERO BOARD WITH NOTICES & CALENDAR)
     ========================================================================= */
  const renderInicioValue = () => {
    // Lead classes list
    const leadClasses = matchedDocente?.activeCourses || ['10° Grado A', '11° Grado B'];
    
    return (
      <div className="space-y-6">
        
        {/* Welcome branding hero card */}
        <div className={`p-6 bg-gradient-to-r ${cl.gradient} rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-5`}>
          <div className="space-y-1 text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center gap-2">
              <span className="bg-white/20 font-bold tracking-wider rounded-full px-2 py-0.5 text-[9px] uppercase">Docente Titular</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-1">¡Qué gusto verte, {teacherName}!</h2>
            <p className="text-xs text-white/85 max-w-md">
              Hoy dictas clases de <strong className="underline">{teacherSubject}</strong>. Revisa tu agenda periódica y comparte recursos con tus alumnos.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl text-center border border-white/10">
              <p className="text-[10px] text-white/70 uppercase font-semibold">Tus clases</p>
              <h3 className="text-xl font-extrabold mt-0.5">{leadClasses.length}</h3>
            </div>
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl text-center border border-white/10">
              <p className="text-[10px] text-white/70 uppercase font-semibold">Puntaje</p>
              <h3 className="text-xl font-extrabold mt-0.5">{matchedDocente?.rating || '4.8'}/5</h3>
            </div>
          </div>
        </div>

        {/* Quick Actions Widget Area */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-gray-850 dark:text-zinc-200 flex items-center gap-1.5 font-sans">
                <span>⚡ Panel de Accesos Rápidos</span>
              </h3>
              <p className="text-[11px] text-gray-400">Reorganiza arrastrando la barra lateral de las tarjetas, o pulsa "Ajustar Accesos" para configurarlas.</p>
            </div>
            
            <button
              id="docente-widget-config-toggle"
              type="button"
              onClick={() => setShowWidgetConfig(!showWidgetConfig)}
              className="self-start text-xs font-semibold px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-gray-150 dark:border-zinc-700 rounded-lg text-gray-650 dark:text-zinc-300 transition-all select-none"
            >
              {showWidgetConfig ? 'Cerrar Ajustes' : '🔧 Ajustar Accesos'}
            </button>
          </div>

          {/* Configuration Selection */}
          <AnimatePresence>
            {showWidgetConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b border-gray-100 dark:border-zinc-850 pb-4"
              >
                <div className="bg-gray-50/50 dark:bg-zinc-950/30 p-4 rounded-xl border border-gray-150/70 dark:border-zinc-800 space-y-3">
                  <p className="text-xs font-extrabold text-gray-600 dark:text-zinc-400">Habilita los accesos dinámicos que utilizarás más seguido:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { id: 'mark-attendance', title: 'Tomar Asistencia', desc: 'Control diario de asistencia', icon: CheckSquare },
                      { id: 'view-materials', title: 'Recursos Digitales', desc: 'Tareas, guías y carpetas', icon: Folder },
                      { id: 'view-salary', title: 'Consultar Honorarios', desc: 'Visualizar depósitos y salarios', icon: DollarSign },
                      { id: 'system-config', title: 'Estilo Visual', desc: 'Modifica color y apariencias', icon: Settings },
                      { id: 'quick-register', title: 'Lista Express', desc: 'Panel de registro inmediato', icon: UserCheck },
                    ].map(widget => {
                      const isChecked = docenteWidgets.includes(widget.id);
                      return (
                        <label 
                          key={widget.id}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400' 
                              : 'border-gray-200 dark:border-zinc-800 text-gray-450 hover:border-gray-300'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              let next;
                              if (isChecked) {
                                next = docenteWidgets.filter(id => id !== widget.id);
                              } else {
                                next = [...docenteWidgets, widget.id];
                              }
                              setDocenteWidgets(next);
                              localStorage.setItem('edu_docente_widgets', JSON.stringify(next));
                            }}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="text-[11px] leading-tight font-extrabold">
                            <div>{widget.title}</div>
                            <div className="text-[9px] text-gray-400 font-normal mt-0.5">{widget.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Cards Grid */}
          {(() => {
            const ALL_DOCENTE_WIDGETS = [
              { id: 'mark-attendance', title: 'Tomar Asistencia', desc: 'Control diario de asistencia', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30', action: () => onChangeTab?.('asistencias') },
              { id: 'view-materials', title: 'Recursos Digitales', desc: 'Tareas, guías y carpetas', icon: Folder, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30', action: () => onChangeTab?.('recursos') },
              { id: 'view-salary', title: 'Consultar Honorarios', desc: 'Visualizar depósitos y salarios', icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30', action: () => onChangeTab?.('finanzas') },
              { id: 'system-config', title: 'Estilo Visual', desc: 'Modifica color y apariencias', icon: Settings, color: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-950/30', action: () => onChangeTab?.('configuracion') },
              { id: 'quick-register', title: 'Lista Express', desc: 'Registro inmediato', icon: UserCheck, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30', action: () => { onChangeTab?.('asistencias'); setShowRegisterAttendance(true); } },
            ];

            const activeWidgetData = docenteWidgets
              .map(id => ALL_DOCENTE_WIDGETS.find(w => w.id === id))
              .filter((w): w is typeof ALL_DOCENTE_WIDGETS[0] => !!w);

            const handleDragStartLocal = (idx: number) => {
              setDraggedWidgetIdx(idx);
            };

            const handleDragOverLocal = (e: React.DragEvent) => {
              e.preventDefault();
            };

            const handleDropLocal = (targetIdx: number) => {
              if (draggedWidgetIdx === null || draggedWidgetIdx === targetIdx) return;
              const reordered = [...docenteWidgets];
              const [draggedItem] = reordered.splice(draggedWidgetIdx, 1);
              reordered.splice(targetIdx, 0, draggedItem);
              setDocenteWidgets(reordered);
              localStorage.setItem('edu_docente_widgets', JSON.stringify(reordered));
              setDraggedWidgetIdx(null);
            };

            if (activeWidgetData.length === 0) {
              return (
                <div className="text-center py-6 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-400">
                  Ninguno habilitado. Haz clic en "Ajustar Accesos" para agregar algunos.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 select-none">
                {activeWidgetData.map((widget, idx) => {
                  const IconComp = widget.icon;
                  return (
                    <div
                      key={widget.id}
                      draggable="true"
                      onDragStart={() => handleDragStartLocal(idx)}
                      onDragOver={handleDragOverLocal}
                      onDrop={() => handleDropLocal(idx)}
                      className="group bg-white dark:bg-zinc-900 border border-gray-150/70 dark:border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-2 border-l-3 border-l-purple-500 dark:border-l-purple-400 shadow-sm interactive-hover-lift cursor-grab active:cursor-grabbing hover:border-gray-350 dark:hover:border-zinc-700"
                    >
                      <button
                        type="button"
                        onClick={widget.action}
                        className="flex items-center gap-3 min-w-0 text-left cursor-pointer flex-1"
                      >
                        <div className={`p-2.5 rounded-xl ${widget.color} shrink-0`}>
                          <IconComp className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200 group-hover:text-purple-650 dark:group-hover:text-purple-400 transition-colors truncate">
                            {widget.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{widget.desc}</p>
                        </div>
                      </button>

                      {/* Drag Handle block */}
                      <div className="flex items-center text-gray-300 dark:text-zinc-700 group-hover:text-gray-450 dark:group-hover:text-zinc-500 transition-colors px-1 cursor-grab mt-0.5">
                        <GripVertical className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Dashboard grid: Courses Schedule & General Institutional News (NOTICIAS - REQUISITO) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Courses Schedule */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-450 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gray-450" />
              Tus Clases Activas
            </h3>
            
            <div className="space-y-3">
              {leadClasses.map((clase, i) => (
                <div key={i} className="p-3.5 bg-gray-50/50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-850/60 rounded-xl hover:translate-x-1 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-xs">{clase}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${cl.lightBg}`}>
                      {teacherSubject}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Horario: {i === 0 ? '08:00 - 09:30' : '10:00 - 11:30'}</span>
                    <span className="underline">Aula {i === 0 ? 'E-12' : 'B-04'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center border-t border-gray-100 dark:border-zinc-850">
              <p className="text-[10px] text-gray-400">¿Requieres cambios de salón? Solicítalo en Dirección.</p>
            </div>
          </div>

          {/* Institutional News (NOTICIAS - REQUISITO EXPLICITO) */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-450">Últimas Noticias Institucionales</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {news.map(item => (
                <div key={item.id} className="border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-28 object-cover object-center"
                    />
                  )}
                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-extrabold px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-990 text-emerald-600 dark:text-emerald-300 rounded uppercase">
                          {item.category}
                        </span>
                        <span className="text-[9px] text-gray-400">{item.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-250 mt-1 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-3 mt-1 leading-relaxed">{item.content}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-zinc-850 text-[10px] text-gray-400 font-medium">
                      Autor: {item.author}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* EnlaceC AI system auditor and pending tasks review */}
        <AISystemReview />

      </div>
    );
  };


  /* =========================================================================
     MODULE: ASISTENCIAS (CHECKLIST AND LIST LOGS - REQUISITO EXPLICITO)
     ========================================================================= */
  const renderAsistenciasValue = () => {
    // Filter instructor specific logs
    const classLogs = attendance.filter(log => log.teacherId === teacherId);

    return (
      <div className="space-y-6">
        
        {/* Dynamic header for attendance actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-810 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Bitácora de Asistencias Diarias</h3>
            <p className="text-xs text-gray-500">Mantén el registro de asistencia actualizado para fines de promedio e informes.</p>
          </div>
          
          <button
            id="btn-register-attendance-trigger"
            type="button"
            onClick={async () => {
              // Refresh courses from Supabase safely
              await refreshCursos();
              setSelectedCourseId('');
              // Reset list with all students
              if (students && students.length > 0) {
                setStudentCheckerList(students.map(s => ({ id: s.id, name: s.name, present: true })));
              }
              setShowRegisterAttendance(true);
            }}
            className={`w-full sm:w-auto px-4.5 py-2.5 text-xs font-bold text-white rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} transition-all flex items-center justify-center gap-2 shadow-sm`}
          >
            <Plus className="w-4 h-4" />
            Registrar Nueva Asistencia
          </button>
        </div>

        {/* Existing logs list */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-zinc-850">
            <h3 className="text-xs font-bold text-gray-450 uppercase tracking-widest">Historial de Clases Registradas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-zinc-950/60 border-b border-gray-100 dark:border-zinc-850">
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Fecha / Hora</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Clase / Curso</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Estudiantes Registrados</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Presentes / Ausentes</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Comentarios</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                {classLogs.map(log => {
                  const presentCount = log.students.filter(s => s.present).length;
                  const absentCount = log.students.length - presentCount;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/20 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-800 dark:text-zinc-200">{log.date}</p>
                        <p className="text-[10px] text-gray-450 font-mono mt-0.5">{log.time} Hrs</p>
                      </td>
                      <td className="p-4 font-semibold text-gray-750 dark:text-zinc-300">
                        {log.course}
                      </td>
                      <td className="p-4 text-gray-500">
                        {log.students.length} alumnos matriculados
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">
                            Presentes: {presentCount}
                          </span>
                          {absentCount > 0 && (
                            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400 rounded text-[10px] font-bold">
                              Faltas: {absentCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 italic max-w-xs truncate" title={log.comments}>
                        {log.comments || 'Sin comentarios adicionales'}
                      </td>
                      <td className="p-4 text-right">
                        <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[9px] font-bold uppercase">
                          Sincronizado
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {classLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-450 font-medium">
                      Aún no has registrado ninguna clase en este ciclo. Usa "Registrar Nueva Asistencia" arriba.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PORTAL FORM: CREAR ASISTENCIA (FORMULARIO CHECKLIST MARCADOR DE ASISTENCIAS) */}
        <AnimatePresence>
          {showRegisterAttendance && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRegisterAttendance(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3.5 border-b border-gray-150 dark:border-zinc-850 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className={`w-5 h-5 ${cl.primaryText}`} />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-205">Generar Registro de Asistencia</h3>
                  </div>
                  <button type="button" onClick={() => setShowRegisterAttendance(false)} className="p-1 hover:bg-gray-150 rounded text-gray-450">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isSavingDocentePayment ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                    <Loader2 className={`w-12 h-12 animate-spin ${cl.primaryText}`} />
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-gray-800 dark:text-zinc-200">Procesando y registrando pago...</p>
                      <p className="text-xs text-gray-450 dark:text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                        {saveDocentePaymentMessage}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAttendance} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Curso del Sistema</label>
                      <select
                        required
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        <option value="">-- Seleccionar curso --</option>
                        {cursos.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre} (S/. {c.pago.toFixed(2)}/h)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Fecha</label>
                        <input
                          required
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Cantidad de Sesiones</label>
                        <input
                          required
                          type="number"
                          min={1}
                          max={10}
                          value={cantidadSesiones}
                          onChange={(e) => setCantidadSesiones(parseInt(e.target.value, 10) || 1)}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Hora Inicio</label>
                        <input
                          required
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Hora Fin</label>
                        <input
                          required
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        />
                      </div>
                    </div>

                    {selectedCourseId ? (
                      <>
                        {/* Payment Estimation Info Banner */}
                        <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20">
                          <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 flex justify-between items-center">
                            <span>Honorarios de Asistencia Estimados:</span>
                            <span className="font-extrabold text-xs">
                              S/. {((cantidadSesiones * 2) * (cursos.find(c => c.id === selectedCourseId)?.pago || 20.0)).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-450 dark:text-zinc-400 mt-1">
                            Cálculo: {cantidadSesiones} sesiones × 2 horas c/u × S/. {(cursos.find(c => c.id === selectedCourseId)?.pago || 20.0).toFixed(2)}/hora.
                          </p>
                        </div>

                        {/* Dynamic checklist header */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            <span>Nombre del Alumno</span>
                            <span>Estatus</span>
                          </div>

                          <div className="bg-gray-50/50 dark:bg-zinc-950/20 border border-gray-150 dark:border-zinc-850/60 rounded-xl divide-y divide-gray-100 dark:divide-zinc-850 max-h-[220px] overflow-y-auto p-2">
                            {studentCheckerList.map((st, i) => (
                              <div key={st.id} className="flex justify-between items-center py-2.5 px-1.5 hover:bg-white dark:hover:bg-zinc-850 rounded-lg transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-gray-500">Nº {i + 1}</span>
                                  <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">{st.name}</span>
                                </div>

                                <button
                                  id={`checker-switch-${st.id}`}
                                  type="button"
                                  onClick={() => handleTogglePresent(i)}
                                  className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-colors flex items-center gap-1 ${
                                    st.present 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                      : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                  }`}
                                >
                                  {st.present ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Presente
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      Ausente
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Notas / Temario dictado (Comentarios)</label>
                          <textarea
                            rows={2}
                            placeholder="Ej. Se resolvió la guía n°3 de binomios. Examen programado."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className={`w-full p-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                        <UserCheck className="w-8 h-8 text-gray-300 dark:text-zinc-700 animate-pulse" />
                        <span>Por favor, seleccione un curso del sistema para cargar la lista de estudiantes y habilitar el registro de asistencia.</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold select-none">
                      <button
                        type="button"
                        onClick={() => setShowRegisterAttendance(false)}
                        className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300/80 rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedCourseId}
                        className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} disabled:opacity-45 disabled:cursor-not-allowed`}
                      >
                        Sincronizar Asistencia
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  };


  /* =========================================================================
     MODULE: FINANZAS (DOCENTE EARNINGS ONLY - REQUISITO EXPLICITO)
     ========================================================================= */
  const renderFinanzasValue = () => {
    // Collect payments made to this teacher specifically
    const paysReceived = transactions.filter(tx => 
      tx.teacherId === teacherId && tx.category === 'Salario Docente'
    );

    return (
      <div className="space-y-6">
        
        {/* Earnings Card & status info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm interactive-hover-lift">
            <h4 className="text-xs uppercase font-bold text-gray-450 tracking-wide">Tu Sueldo Mensual Establecido</h4>
            <h2 className={`text-3xl font-extrabold mt-1 tracking-tight ${cl.primaryText}`}>
              ${matchedDocente?.salary.toLocaleString('es-ES') || '1.800'} USD
            </h2>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Asignado por Dirección directiva</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between interactive-hover-lift">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Estatus Pago Actual</p>
              <h3 className="text-xl font-bold mt-1 text-gray-800 dark:text-zinc-200">
                {matchedDocente?.paymentStatus === 'paid' ? 'Liquidado / Pagado' : 'Pendiente Liberación'}
              </h3>
              <p className="text-[10px] text-gray-450 mt-1 font-medium">Ciclo Corriente: Mayo-Junio</p>
            </div>
            
            <div className={`p-3 rounded-full ${
              matchedDocente?.paymentStatus === 'paid' 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' 
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
            }`}>
              {matchedDocente?.paymentStatus === 'paid' ? (
                <CheckSquare className="w-6 h-6" />
              ) : (
                <CalendarClock className="w-6 h-6" />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm interactive-hover-lift">
            <h4 className="text-xs uppercase font-bold text-gray-450 tracking-wide">Total Recibido Año</h4>
            <h2 className="text-2xl font-bold mt-1 text-gray-800 dark:text-zinc-200">
              ${(paysReceived.reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString('es-ES')} USD
            </h2>
            <span className="text-[10px] text-gray-400 mt-2 block font-medium">Basado en comprobantes contables</span>
          </div>

        </div>

        {/* Quick payroll request */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 interactive-hover-lift">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Adelanto o Consulta de Remuneración</h3>
            <p className="text-xs text-gray-500">¿Requieres el desglose en PDF de tus comprobantes de pago? Solicítalo de manera instantánea.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              alert('Petición de boleta de pago enviada a la sección de contabilidad escolar. Recibirás tu PDF vía e-mail.');
            }}
            className={`px-5 py-2.5 text-xs font-bold text-white ${cl.primaryBg} ${cl.primaryHoverBg} rounded-xl transition-all shadow-sm`}
          >
            Descargar Desglose Pagos
          </button>
        </div>

        {/* Specific payroll history logs */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-zinc-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xs font-bold text-gray-450 uppercase tracking-widest">Historial Comprobantes Depositos</h3>
            <div className="flex items-center gap-2">
              <button
                id="btn-docente-export-csv"
                type="button"
                onClick={() => {
                  const csvHeaders = [
                    { label: 'Recibo ID', key: (rec: any, idx?: any) => `TX-${(typeof idx === 'number' ? idx + 1 : 1)}` },
                    { label: 'Fecha de Liquidación', key: (rec: any) => rec.date },
                    { label: 'Concepto', key: (rec: any) => rec.concept },
                    { label: 'Categoría', key: (rec: any) => rec.category },
                    { label: 'Monto Depositado', key: (rec: any) => `$${rec.amount} USD` }
                  ];
                  exportToCSV(paysReceived, csvHeaders, 'comprobantes_pago_docente.csv');
                }}
                className="px-3 py-1.5 text-[11px] font-bold text-gray-750 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 border border-gray-200 dark:border-zinc-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Exportar CSV
              </button>
              <button
                id="btn-docente-export-pdf"
                type="button"
                onClick={() => exportTransactionsToPDF(paysReceived, 'Colegio Tesla', teacherName)}
                className="px-3 py-1.5 text-[11px] font-bold text-gray-750 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 border border-gray-200 dark:border-zinc-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Exportar PDF
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-zinc-950/60 border-b border-gray-100 dark:border-zinc-850">
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Recibo ID</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Fecha de Liquidación</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Detalle / Concepto</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Categoría</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Monto Depositado</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap text-right">Estatus Bancario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                {paysReceived.map((rec, i) => (
                  <tr key={rec.id} className="hover:bg-gray-50/10 dark:hover:bg-zinc-850/10 transition-colors">
                    <td className="p-4 font-mono font-bold text-[11px] text-gray-500">TX-{i + 1}</td>
                    <td className="p-4 text-gray-650 dark:text-zinc-350">{rec.date}</td>
                    <td className="p-4 font-bold text-gray-800 dark:text-zinc-250">{rec.concept}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                        {rec.category}
                      </span>
                    </td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      +${rec.amount.toLocaleString('es-ES')} USD
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded font-bold text-[10px]">
                        Efectuado
                      </span>
                    </td>
                  </tr>
                ))}

                {paysReceived.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-450 font-medium">
                      Contabilidad aún no reporta transferencias bancarias directas para tu ID.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };


  /* =========================================================================
     MODULE: RECURSOS (READ ONLY FROM ADMIN AS REQUIRED)
     ========================================================================= */
  const renderRecursosValue = () => {
    const handleSingleClickResource = (item: ResourceItem) => {
      if (item.type === 'folder') {
        setCurrentFolder(item);
      } else {
        if (item.url && item.url.startsWith('http')) {
          window.open(item.url, '_blank');
        } else {
          alert(`Abriendo archivo académico del colegio:\n${item.name}\nFormato: ${item.size || 'Desconocido'}\n(Estás en modo Solo Lectura)`);
        }
      }
    };

    const handleGoBack = () => {
      setCurrentFolder(null);
    };

    const itemsOnScreen = currentFolder ? (currentFolder.children || []) : resources;

    return (
      <div className="space-y-6 animate-fade-in">
        
        {/* Drive directory controls header (READ ONLY PROMPT COHERENT WITH USER REQ) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 dark:bg-zinc-900/45 backdrop-blur-xl p-4.5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-black/[0.03] dark:shadow-black/20 transition-all duration-300">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-xl shadow-inner shrink-0">
              <Folder className="w-5 h-5 fill-indigo-250/20" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Archivero Escolar</h3>
                <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-955/30 px-1.5 py-0.5 rounded-md border border-blue-200/30">SOLO LECTURA</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm font-bold text-gray-800 dark:text-zinc-200">
                <button type="button" onClick={handleGoBack} className="hover:underline text-gray-500 dark:text-zinc-400 transition-colors">
                  Raíz Drive
                </button>
                {currentFolder && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-800 dark:text-zinc-150 font-extrabold px-2 py-0.5 bg-white/60 dark:bg-zinc-850/60 backdrop-blur-md rounded-lg border border-white/40 dark:border-white/10">{currentFolder.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {currentFolder && (
            <button
              id="btn-drive-teacher-back"
              type="button"
              onClick={handleGoBack}
              className="px-4 py-2.5 text-xs bg-white/40 hover:bg-white/60 dark:bg-zinc-800/40 dark:hover:bg-zinc-750/50 text-gray-705 dark:text-zinc-350 rounded-xl font-bold transition-all border border-white/40 dark:border-white/10 shadow-sm"
            >
              Regresar
            </button>
          )}
        </div>

        {/* Read-only resources list */}
        <div className="bg-white/40 dark:bg-zinc-900/45 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-black/[0.02] dark:shadow-black/15 p-6 overflow-hidden">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-5 leading-none">
            Material didáctico compartido por Directiva (Un clic para abrir)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {itemsOnScreen.map(item => (
              <div
                key={item.id}
                id={`drive-item-teacher-${item.id}`}
                onClick={() => handleSingleClickResource(item)}
                className="group border border-white/30 dark:border-white/5 bg-white/20 dark:bg-zinc-900/15 backdrop-blur-md hover:bg-white/40 dark:hover:bg-zinc-800/30 hover:border-white/45 dark:hover:border-white/15 hover:shadow-xl rounded-2xl p-4.5 flex flex-col items-center text-center cursor-pointer relative transition-all duration-300 hover:-translate-y-1"
              >
                {item.type === 'folder' ? (
                  <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl flex items-center justify-center text-yellow-600 mb-3.5 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                    <Folder className="w-7 h-7 fill-yellow-250 animate-scale" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center text-blue-600 mb-3.5 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                    <FileText className="w-7 h-7 animate-scale" />
                  </div>
                )}

                <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-250 truncate w-full leading-tight pr-1 pl-1" title={item.name}>
                  {item.name}
                </h4>
                
                {item.size ? (
                  <span className="text-[9px] text-gray-450 mt-1.5 font-bold px-1.5 py-0.5 bg-gray-105/50 dark:bg-zinc-805 rounded-md">{item.size}</span>
                ) : (
                  <span className="text-[9px] text-teal-650 dark:text-teal-400 mt-1.5 font-extrabold px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950/40 rounded-md">
                    {(item.children || []).length} items
                  </span>
                )}
                
                <span className="text-[8px] text-gray-400 mt-2.5 font-mono text-center tracking-wider">{item.updatedAt.split(' ')[0]}</span>
              </div>
            ))}

            {itemsOnScreen.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                Esta sección de recursos del administrador no cuenta con elementos o carpetas para mostrar.
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };


  /* =========================================================================
     MODULE: CONFIGURACION (DASHBOARD ADJUSTMENTS)
     ========================================================================= */
  const renderConfiguracionValue = () => {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-150">Ajustes de Perfil & Interfaz</h3>
          <p className="text-xs text-gray-400">Configura la paleta de colores y el comportamiento de visualización.</p>
        </div>

        {/* Accent switcher matching custom configs */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Gama Cromática Personalizada</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'blue' as AccentColor, label: 'Azul Inteligente', hex: '#3b82f6' },
              { value: 'emerald' as AccentColor, label: 'Verde Orgánico', hex: '#10b981' },
              { value: 'purple' as AccentColor, label: 'Púrpura Creativo', hex: '#8b5cf6' },
              { value: 'amber' as AccentColor, label: 'Ámbar Cálido', hex: '#f59e0b' },
              { value: 'rose' as AccentColor, label: 'Rosa Vital', hex: '#f43f5e' },
              { value: 'indigo' as AccentColor, label: 'Índigo Real', hex: '#6366f1' },
            ].map((color) => {
              const isSelected = theme.accentColor === color.value;
              return (
                <button
                  id={`config-color-docente-${color.value}`}
                  key={color.value}
                  type="button"
                  onClick={() => updateTheme({ accentColor: color.value })}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-55 dark:border-white dark:bg-zinc-850 font-bold'
                      : 'border-gray-100 hover:border-gray-150 dark:border-zinc-800 dark:hover:border-zinc-750'
                  }`}
                >
                  <span 
                    style={{ backgroundColor: color.hex }}
                    className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-zinc-950 shadow-sm"
                  />
                  <span className="text-xs text-gray-750 dark:text-zinc-200">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Estilo y Filosofía Visual</label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'frosted-glass', label: 'Cristal Esmerilado', desc: 'Diseño moderno translúcido con desenfoque y efecto de vidrio' }
            ].map((st) => {
              return (
                <button
                  id={`config-style-docente-${st.value}`}
                  key={st.value}
                  type="button"
                  className="p-3 rounded-xl border text-left transition-all outline-none flex flex-col gap-1 items-start border-indigo-600 bg-indigo-50/20 dark:border-indigo-400 dark:bg-zinc-850/80 font-bold"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold">{st.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight font-medium">{st.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Luminosity picker */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Luminosidad</label>
          <div className="grid grid-cols-3 gap-2 bg-gray-105 dark:bg-zinc-950 p-1 rounded-xl">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                id={`config-mode-docente-${mode}`}
                key={mode}
                type="button"
                onClick={() => updateTheme({ mode })}
                className={`py-2 text-xs font-semibold rounded-lg transition-all capitalize ${
                  theme.mode === mode
                    ? `${cl.primaryBg} text-white shadow-sm`
                    : 'text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {mode === 'system' ? 'Sistema' : mode === 'light' ? 'Claro' : 'Oscuro'}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Mini-Icons option */}
        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Barra Lateral (Escritorio)</label>
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-200/50 dark:border-zinc-800">
            <div className="space-y-1 pr-4">
              <span className="text-xs font-bold block text-gray-800 dark:text-zinc-200">Ocultar de todo al Colapsar</span>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">
                Si se activa, el panel colapsado se reduce a una línea fina de adorno y solo se despliega por completo al pasar el mouse.
              </p>
            </div>
            <button
              id="docente-config-sidebar-toggle-button"
              type="button"
              onClick={() => handleToggleSidebarHideIcons(!sidebarHideIcons)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                sidebarHideIcons ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-850'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  sidebarHideIcons ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-zinc-850 flex items-center justify-between text-xs text-gray-450 font-mono">
          <span>Suscripción: Aula Unificada Docente</span>
          <span className="font-bold text-gray-400">ENLACEC v1.2</span>
        </div>

        {/* Vercel Environment Variables Manager & Diagnostic Card */}
        <VercelEnvConfigCard />
      </div>
    );
  };


  /* =========================================================================
     NOTAS (GRADES) MODULE
     ========================================================================= */
  const renderNotasValue = () => {
    // Get list of students belonging to selected service
    let serviceStudents = (students || []).filter(st => {
      const sId = st.servicioId || st.servicio_id;
      return sId === selectedServiceId;
    });

    // Fallback: If no students match, show all students so the list is never empty
    if (serviceStudents.length === 0) {
      serviceStudents = students || [];
    }

    const modalStudent = (students || []).find(st => st.id === selectedStudentIdForModal);
    const modalStudentGrades = selectedStudentIdForModal ? (notas || []).filter(n => {
      const sId = n.id_estudiante;
      const cId = n.id_curso;
      const pId = n.id_profesor;
      return sId === selectedStudentIdForModal && cId === selectedNotaCourseId && pId === teacherId;
    }) : [];

    const getQualitativeGradeInfo = (num: number) => {
      if (num > 20) {
        if (num >= 90) return { letter: 'AD', label: 'Excelente (AD)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' };
        if (num >= 75) return { letter: 'A', label: 'Logro Previsto (A)', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' };
        if (num >= 55) return { letter: 'B', label: 'En Proceso (B)', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' };
        return { letter: 'C', label: 'En Inicio (C)', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' };
      } else {
        if (num >= 19) return { letter: 'AD', label: 'Excelente (AD)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' };
        if (num >= 14) return { letter: 'A', label: 'Logro Previsto (A)', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' };
        if (num >= 11) return { letter: 'B', label: 'En Proceso (B)', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' };
        return { letter: 'C', label: 'En Inicio (C)', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' };
      }
    };

    const getStudentGrades = (studentId: string) => {
      return (notas || []).filter(n => {
        const sId = n.id_estudiante;
        const cId = n.id_curso;
        const pId = n.id_profesor;
        return sId === studentId && cId === selectedNotaCourseId && pId === teacherId;
      });
    };

    const getStudentAverage = (studentId: string) => {
      const grades = getStudentGrades(studentId);
      if (grades.length === 0) return null;
      const validGrades = grades.map(g => Number(g.nota_numerica)).filter(val => !isNaN(val));
      if (validGrades.length === 0) return null;
      const sum = validGrades.reduce((acc, curr) => acc + curr, 0);
      return parseFloat((sum / validGrades.length).toFixed(1));
    };

    const handleAddGrade = async (studentId: string) => {
      const inputVal = newGradeInputs[studentId] || '';
      const numericGrade = parseFloat(inputVal);

      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
        window.alert('Por favor ingresa una nota numérica válida entre 0 y 20 (o 0 y 100).');
        return;
      }

      if (!selectedNotaCourseId) {
        window.alert('Por favor selecciona un curso primero.');
        return;
      }

      const qual = getQualitativeGradeInfo(numericGrade);

      try {
        await addNota({
          id_estudiante: studentId,
          id_profesor: teacherId,
          id_curso: selectedNotaCourseId,
          nota_numerica: numericGrade,
          nota_cuantitativa: qual.letter + ' - ' + qual.label
        });

        // Clear input for this student
        setNewGradeInputs(prev => ({
          ...prev,
          [studentId]: ''
        }));
      } catch (err) {
        console.error('Error adding grade:', err);
      }
    };

    const handleDeleteGrade = async (gradeId: string) => {
      if (window.confirm('¿Estás seguro de que deseas eliminar esta calificación?')) {
        try {
          await deleteNota(gradeId);
        } catch (err) {
          console.error('Error deleting grade:', err);
        }
      }
    };

    const handleSaveModalRow = async (gradeId: string) => {
      const valStr = modalRows[gradeId];
      const numVal = parseFloat(valStr);
      if (isNaN(numVal) || numVal < 0 || numVal > 100) {
        window.alert('Por favor ingresa una nota numérica válida entre 0 y 20 (o 0 y 100).');
        return;
      }
      const originalGrade = (notas || []).find(n => n.id === gradeId);
      if (!originalGrade) return;
      const qual = getQualitativeGradeInfo(numVal);
      try {
        await updateNota({
          ...originalGrade,
          nota_numerica: numVal,
          nota_cuantitativa: qual.letter + ' - ' + qual.label
        });
      } catch (err) {
        console.error('Error saving grade in modal:', err);
      }
    };

    const handleDeleteModalRow = async (gradeId: string) => {
      if (window.confirm('¿Estás seguro de que deseas eliminar esta calificación?')) {
        try {
          await deleteNota(gradeId);
          setModalRows(prev => {
            const copy = { ...prev };
            delete copy[gradeId];
            return copy;
          });
        } catch (err) {
          console.error('Error deleting grade in modal:', err);
        }
      }
    };

    const handleAddNewModalRow = async () => {
      const numVal = parseFloat(newModalGradeInput);
      if (isNaN(numVal) || numVal < 0 || numVal > 100) {
        window.alert('Por favor ingresa una nota numérica válida entre 0 y 20 (o 0 y 100).');
        return;
      }
      if (!selectedStudentIdForModal || !selectedNotaCourseId) return;
      const qual = getQualitativeGradeInfo(numVal);
      try {
        await addNota({
          id_estudiante: selectedStudentIdForModal,
          id_profesor: teacherId,
          id_curso: selectedNotaCourseId,
          nota_numerica: numVal,
          nota_cuantitativa: qual.letter + ' - ' + qual.label
        });
        setNewModalGradeInput('');
      } catch (err) {
        console.error('Error adding grade in modal:', err);
      }
    };

    // Calculate class average for this course
    const allAverages = serviceStudents
      .map(st => getStudentAverage(st.id))
      .filter((avg): avg is number => avg !== null);
    const classAverage = allAverages.length > 0 
      ? parseFloat((allAverages.reduce((acc, curr) => acc + curr, 0) / allAverages.length).toFixed(1))
      : null;

    return (
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${cl.lightBg} ${cl.primaryText}`}>
                <ClipboardList className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 font-sans tracking-tight">
                Módulo de Notas y Evaluación
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Registra y gestiona las calificaciones de los estudiantes inscritos en tus servicios asignados.
            </p>
          </div>
          
          {/* Quick link warning / setup for test service */}
          {teacherServices.length === 0 && servicios.length > 0 && (
            <button
              onClick={() => {
                if (servicios && servicios.length > 0) {
                  setTempAssignedServiceIds([servicios[0].id]);
                  setSelectedServiceId(servicios[0].id);
                }
              }}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <AlertCircle className="w-4 h-4" />
              Asignarme Servicio de Prueba
            </button>
          )}
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 dark:bg-zinc-900/55 rounded-2xl border border-gray-200/50 dark:border-zinc-800/60 font-sans">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Servicio Educativo Asignado
            </label>
            {teacherServices.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl flex items-center gap-2 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-450">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No tienes servicios asignados en la base de datos. Pide al administrador que te asigne uno.</span>
              </div>
            ) : (
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full py-2.5 px-4 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-gray-800 dark:text-zinc-200"
              >
                <option value="" disabled>Selecciona un servicio...</option>
                {teacherServices.map(srv => (
                  <option key={srv.id} value={srv.id}>
                    {srv.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Curso / Materia del Servicio
            </label>
            {serviceCourses.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl flex items-center gap-2 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-450">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No hay cursos asociados a este servicio. Vincula cursos en la configuración de servicios.</span>
              </div>
            ) : (
              <select
                value={selectedNotaCourseId}
                onChange={(e) => setSelectedNotaCourseId(e.target.value)}
                className="w-full py-2.5 px-4 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-gray-800 dark:text-zinc-200"
              >
                <option value="" disabled>Selecciona un curso...</option>
                {serviceCourses.map(crs => (
                  <option key={crs.id} value={crs.id}>
                    {crs.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Selected Service/Course View */}
        {selectedServiceId && selectedNotaCourseId ? (
          <div className="space-y-6">
            {/* Stats Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Alumnos del Servicio
                  </span>
                  <span className="text-2xl font-black text-gray-800 dark:text-zinc-100 mt-1 block">
                    {serviceStudents.length}
                  </span>
                </div>
                <div className={`p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-zinc-850 dark:text-zinc-300`}>
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Promedio General Aula
                  </span>
                  <span className="text-2xl font-black text-gray-800 dark:text-zinc-100 mt-1 block">
                    {classAverage !== null ? `${classAverage} / 20` : 'S/N'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-zinc-850 dark:text-zinc-300`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Evaluaciones Registradas
                  </span>
                  <span className="text-2xl font-black text-gray-800 dark:text-zinc-100 mt-1 block">
                    {serviceStudents.reduce((acc, curr) => acc + getStudentGrades(curr.id).length, 0)}
                  </span>
                </div>
                <div className={`p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-zinc-850 dark:text-zinc-300`}>
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Students evaluation sheet */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden font-sans">
              <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                  Lista de Estudiantes Inscritos
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                  Escala de Calificación: 1 a 20 (Sistema Nacional de Evaluación)
                </span>
              </div>

              {serviceStudents.length === 0 ? (
                <div className="p-12 text-center text-gray-400 dark:text-zinc-500">
                  <p className="font-semibold text-sm">No hay alumnos matriculados en este servicio educativo.</p>
                  <p className="text-xs mt-1">Registra alumnos y asígnales este servicio en la sección de Matrícula.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-850">
                  {serviceStudents.map(student => {
                    const studentGrades = getStudentGrades(student.id);
                    const avg = getStudentAverage(student.id);
                    const avgQual = avg !== null ? getQualitativeGradeInfo(avg) : null;

                    return (
                      <div 
                        key={student.id} 
                        className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 transition-all"
                      >
                        {/* Student Details */}
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <img 
                            src={student.avatarUrl || student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'} 
                            alt={`${student.nombre || student.name || 'Estudiante'} ${student.apellido || ''}`}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="text-sm font-bold block text-gray-900 dark:text-zinc-100">
                              {student.nombre || student.name || 'Estudiante'} {student.apellido || ''}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-zinc-500">
                              {student.nivel || 'S/N'} - Grado {student.grado !== undefined && student.grado !== null ? `${student.grado}°` : 'S/G'}
                            </span>
                          </div>
                        </div>

                        {/* List of grades N */}
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 mr-1 block lg:hidden">
                            Notas:
                          </span>
                          {studentGrades.length === 0 ? (
                            <span className="text-xs italic text-gray-400 dark:text-zinc-600 py-1 px-2">
                              Sin calificaciones registradas
                            </span>
                          ) : (
                            studentGrades.map((g, idx) => {
                              const score = Number(g.nota_numerica);
                              const qualInfo = getQualitativeGradeInfo(score);
                              return (
                                <div 
                                  key={g.id} 
                                  className={`group relative flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs font-bold transition-all ${qualInfo.color}`}
                                >
                                  <span>{score}</span>
                                  <span className="opacity-70 text-[10px] font-semibold">({qualInfo.letter})</span>
                                  <button
                                    onClick={() => handleDeleteGrade(g.id)}
                                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600 dark:hover:text-red-400 transition-all text-gray-400 ml-1.5"
                                    title="Eliminar esta nota"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Button to edit grades in a table-based modal */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudentIdForModal(student.id);
                              // Populate local modal input state
                              const currentGrades = getStudentGrades(student.id);
                              const initialVals: Record<string, string> = {};
                              currentGrades.forEach(g => {
                                initialVals[g.id] = g.nota_numerica !== undefined && g.nota_numerica !== null ? String(g.nota_numerica) : '';
                              });
                              setModalRows(initialVals);
                              setNewModalGradeInput('');
                              setIsGradeModalOpen(true);
                            }}
                            className={`flex items-center gap-2 py-1.5 px-3.5 text-white rounded-xl text-xs font-bold transition-all shadow-sm ${cl.primaryBg} ${cl.primaryHoverBg}`}
                            title="Editar todas las notas de este alumno"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar Nota</span>
                          </button>
                        </div>

                        {/* Calculated Average badge */}
                        <div className="min-w-[150px] flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 border-dashed border-gray-100 dark:border-zinc-800/60 pt-3 lg:pt-0">
                          <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block lg:hidden">
                            Promedio:
                          </span>
                          {avg === null ? (
                            <span className="text-xs font-medium text-gray-450 dark:text-zinc-600 bg-gray-50 dark:bg-zinc-950 py-1 px-3.5 rounded-lg border border-gray-200/50 dark:border-zinc-800">
                              Sin promedio
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 lg:flex-row-reverse">
                              <span className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">
                                {avg}
                              </span>
                              {avgQual && (
                                <span className={`py-0.5 px-2 rounded-md text-[10px] font-black border uppercase ${avgQual.color}`}>
                                  {avgQual.letter}
                                </span>
                              )}
                            </div>
                          )}
                          {avg !== null && avgQual && (
                            <span className="text-[10px] font-semibold text-gray-400 mt-0.5 hidden lg:block">
                              {avgQual.label}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50/50 dark:bg-zinc-950 rounded-2xl border border-gray-200/50 dark:border-zinc-850 text-gray-450 font-sans">
            <AlertCircle className="w-8 h-8 text-indigo-500/80 mx-auto mb-3" />
            <p className="font-bold text-sm">Selecciona un servicio y curso para comenzar</p>
            <p className="text-xs mt-1">Por favor elige las opciones de los dropdowns superiores para listar a los estudiantes.</p>
          </div>
        )}

        {/* Grade Editing Modal with Table */}
        <AnimatePresence>
          {isGradeModalOpen && modalStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsGradeModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              
              {/* Panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <img 
                      src={modalStudent.avatarUrl || modalStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'} 
                      alt={`${modalStudent.nombre || modalStudent.name || 'Estudiante'}`}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                        Evaluación de {modalStudent.nombre || modalStudent.name || 'Estudiante'} {modalStudent.apellido || ''}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {modalStudent.nivel || 'S/N'} - Grado {modalStudent.grado !== undefined && modalStudent.grado !== null ? `${modalStudent.grado}°` : 'S/G'} • Curso: {cursos.find(c => c.id === selectedNotaCourseId)?.nombre || ''}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsGradeModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body with Table */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  <div className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-zinc-800 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4 w-36">Nota Numérica</th>
                          <th className="py-3 px-4">Calificación Cualitativa</th>
                          <th className="py-3 px-4 text-center w-28">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                        {modalStudentGrades.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500 italic">
                              Sin calificaciones registradas para este curso.
                            </td>
                          </tr>
                        ) : (
                          modalStudentGrades.map((g, idx) => {
                            const val = modalRows[g.id] !== undefined ? modalRows[g.id] : (g.nota_numerica !== null && g.nota_numerica !== undefined ? String(g.nota_numerica) : '');
                            const parsedVal = parseFloat(val);
                            const qual = !isNaN(parsedVal) ? getQualitativeGradeInfo(parsedVal) : { letter: '-', label: 'Sin nota', color: 'bg-gray-50 text-gray-450 border-gray-205 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800' };
                            
                            const isDirty = val !== (g.nota_numerica !== null && g.nota_numerica !== undefined ? String(g.nota_numerica) : '');

                            return (
                              <tr key={g.id} className="hover:bg-gray-50/40 dark:hover:bg-zinc-900/20 transition-all">
                                <td className="py-3 px-4 text-center text-xs font-bold text-gray-400 dark:text-zinc-500">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={val}
                                    onChange={(e) => setModalRows(prev => ({ ...prev, [g.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveModalRow(g.id);
                                    }}
                                    className="w-24 py-1.5 px-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-800 dark:text-zinc-200"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`py-0.5 px-2 rounded-md text-[10px] font-black border uppercase ${qual.color}`}>
                                      {qual.letter}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                                      {qual.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-2">
                                    {isDirty && (
                                      <button
                                        onClick={() => handleSaveModalRow(g.id)}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-lg transition-all"
                                        title="Guardar cambios"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteModalRow(g.id)}
                                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                                      title="Eliminar nota"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* Row to Add New Grade */}
                        <tr className="bg-gray-50/50 dark:bg-zinc-900/20">
                          <td className="py-3.5 px-4 text-center text-xs font-bold text-indigo-500 dark:text-indigo-400">
                            +
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Nueva"
                              value={newModalGradeInput}
                              onChange={(e) => setNewModalGradeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddNewModalRow();
                              }}
                              className="w-24 py-1.5 px-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-800 dark:text-zinc-200"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            {(() => {
                              const parsedNewVal = parseFloat(newModalGradeInput);
                              if (isNaN(parsedNewVal)) {
                                return (
                                  <span className="text-xs text-gray-400 dark:text-zinc-500 italic">
                                    Ingresa nota para ver escala
                                  </span>
                                );
                              }
                              const qualNew = getQualitativeGradeInfo(parsedNewVal);
                              return (
                                <div className="flex items-center gap-2">
                                  <span className={`py-0.5 px-2 rounded-md text-[10px] font-black border uppercase ${qualNew.color}`}>
                                    {qualNew.letter}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                                    {qualNew.label}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={handleAddNewModalRow}
                                disabled={!newModalGradeInput}
                                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  newModalGradeInput 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                                    : 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-650 cursor-not-allowed'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30 flex justify-end">
                  <button
                    onClick={() => setIsGradeModalOpen(false)}
                    className="py-2 px-5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };


  /* =========================================================================
     ROUTER FOR SELECTED TAB
     ========================================================================= */
  const renderViewContent = () => {
    switch (activeTab) {
      case 'inicio':
        return renderInicioValue();
      case 'pizarra':
        return <AIBoardSandbox />;
      case 'tesla-ai':
        return <TeslaAIChatView />;
      case 'asistencias':
        return renderAsistenciasValue();
      case 'notas':
        return renderNotasValue();
      case 'finanzas':
        return renderFinanzasValue();
      case 'facturas':
        return <BovedaFacturasView />;
      case 'recursos':
        return renderRecursosValue();
      case 'avisos':
        return <NewsAnnouncementsView />;
      case 'configuracion':
        return renderConfiguracionValue();
      default:
        return renderInicioValue();
    }
  };

  return (
    <div className={activeTab === 'pizarra' || activeTab === 'tesla-ai' ? "w-full h-full p-0 flex flex-col overflow-hidden" : "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={activeTab === 'pizarra' || activeTab === 'tesla-ai' ? "w-full h-full flex flex-col flex-1 min-h-0" : ""}
        >
          {renderViewContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
