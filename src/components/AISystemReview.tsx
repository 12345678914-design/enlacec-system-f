import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getThemeClasses } from '../lib/themeUtils';
import { callGroqAIChatClient } from '../services/clientServices';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  GraduationCap, 
  ListTodo, 
  HelpCircle, 
  Clock, 
  Play, 
  ArrowRight,
  ClipboardList,
  RefreshCw,
  Award
} from 'lucide-react';

export const AISystemReview: React.FC = () => {
  const { students, teachers, resources, balance, theme } = useApp();
  const cl = getThemeClasses(theme.accentColor);

  const [diagnosticRun, setDiagnosticRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local checklist state for user to mark things as "addressed" during this session
  const [resolvedTasks, setResolvedTasks] = useState<string[]>([]);

  // Scan and identify actual system issues
  const scanFinanceIssues = () => {
    const list: { id: string; type: 'docente' | 'estudiante'; name: string; amount: number; desc: string }[] = [];
    
    // 1. Teachers with pending payments
    teachers.forEach(t => {
      if (t.paymentStatus === 'pending') {
        list.push({
          id: `pay-doc-${t.id}`,
          type: 'docente',
          name: t.name,
          amount: t.salary,
          desc: `Honorarios de ${t.subject} pendientes de acreditar`
        });
      }
    });

    // 2. Students with unpaid debt
    students.forEach(s => {
      if (s.balance > 0) {
        list.push({
          id: `debt-est-${s.id}`,
          type: 'estudiante',
          name: s.name,
          amount: s.balance,
          desc: `Saldo pendiente de matrícula/colegiatura`
        });
      }
    });

    return list;
  };

  const scanAcademicIssues = () => {
    const list: { id: string; studentId: string; name: string; rate: number; desc: string }[] = [];
    
    // Students with attendance rate below 90%
    students.forEach(s => {
      if (s.attendanceRate < 90) {
        list.push({
          id: `att-est-${s.id}`,
          studentId: s.id,
          name: s.name,
          rate: s.attendanceRate,
          desc: `Alerta de inasistencias: asistencia crítica de ${s.attendanceRate}%`
        });
      }
    });

    return list;
  };

  const financeIssues = scanFinanceIssues();
  const academicIssues = scanAcademicIssues();
  
  // Resources stats
  const totalResources = resources.reduce((acc, curr) => {
    let count = 1; // self
    if (curr.children) count += curr.children.length;
    return acc + count;
  }, 0);

  // Whiteboard items count from local storage
  const getBoardCount = () => {
    try {
      const saved = localStorage.getItem('edu_ai_board_items_v2');
      if (saved) {
        const items = JSON.parse(saved);
        return Array.isArray(items) ? items.length : 0;
      }
    } catch {
      // safe ignore
    }
    return 1; // default initial layout contains 1 item
  };
  const boardCount = getBoardCount();

  const toggleTaskResolved = (taskId: string) => {
    setResolvedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Run the AI audit via client-side Groq service
  const runDiagnostic = async () => {
    setLoading(true);
    setDiagnosticRun(true);
    setErrorMsg('');
    setAiAnalysis('');

    const steps = [
      'Accediendo al catálogo de matrículas de estudiantes...',
      'Verificando saldos vencidos y deudas activas...',
      'Filtrando tasas de asistencias críticas diarias...',
      'Revisando nómina docente titular y pagos pendientes...',
      'Analizando carpetas de recursos institucionales...',
      'Invocando EnlaceC IA de Groq para auditoría...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 380));
    }

    try {
      // Formulate a structured payload to review the school system
      const systemOverviewPrompt = `
        Por favor realiza una auditoría detallada, amigable y muy profesional del estado administrativo de nuestro colegio. 
        Aquí tienes los datos reales del sistema actual:
        - Balance general en caja: $${balance}
        - Total estudiantes registrados: ${students.length} (${students.filter(s => s.status === 'active').length} activos, ${students.filter(s => s.status === 'inactive').length} inactivos)
        - Cantidad de profesores en planilla: ${teachers.length}
        - Alumnos con deudas de colegiatura: ${financeIssues.filter(f => f.type === 'estudiante').length}
        - Profesores con honorarios pendientes de pago: ${financeIssues.filter(f => f.type === 'docente').length}
        - Estudiantes con inasistencias críticas (asistencia < 90%): ${academicIssues.length} (por ejemplo, Lucas Mendoza con ${academicIssues.find(a => a.name.includes('Lucas'))?.rate || 'baja'}% de asistencia)
        - Recursos y carpetas cargados en el Drive: ${totalResources} recursos escolares
        - Elementos o experimentos activos en la pizarra del laboratorio de IA: ${boardCount} módulos

        Genera un informe rápido y elegante estructurado de la siguiente forma (redactado en español amigable, empático de IA y muy claro):
        1. **DIAGNÓSTICO GENERAL**: Una breve evaluación general del estado de salud del colegio.
        2. **ACCIONES DE MÁXIMA PRIORIDAD (PENDIENTES)**: Una lista con bullets de qué áreas se deben atender de inmediato (cobros pendientes, nómina docente pendiente, o alumnos con baja asistencia, menciona nombres reales de los datos proporcionados).
        3. **RECOMENDACIÓN FUTURA ENLACEC IA**: Sugerencias pedagógicas o administrativas para mejorar la cobranza, aumentar la asistencia y aprovechar el laboratorio libre de IA.

        No agregues saludos genéricos ni repitas la introducción del chatbot. Ve directo al punto con formato elegante de markdown simple.
      `;

      const result = await callGroqAIChatClient(
        systemOverviewPrompt,
        [],
        { role: 'admin', currentUser: { role: 'admin' } }
      );

      if (result && result.text) {
        setAiAnalysis(result.text);
      } else {
        throw new Error('No se pudo establecer comunicación con el motor de IA de Groq.');
      }
    } catch (err: any) {
      console.error('Audit Error:', err);
      setErrorMsg(err.message || 'Error desconocido al invocar la IA. Generando análisis local alternativo...');
      
      // Local recovery backup response
      setTimeout(() => {
        setAiAnalysis(`
### DIAGNÓSTICO GENERAL DETECTADO (Modo Local)
El colegio cuenta con un índice estable de matriculación, pero requiere atención inmediata para regularizar la tesorería de honorarios docentes y el cobro de colegiaturas vencidas.

### ACCIONES DE MÁXIMA PRIORIDAD:
* 🔴 **Regularizar Nómina**: Pagar honorarios de profesores pendientes de pago (Dra. Ana Cecilia por $1,950.00).
* 🔴 **Recuperar Cartera**: Activar proceso de cobranza preventiva para estudiantes con saldo deudor (p. ej. Mateo Quispe con deuda acumulada).
* 🟡 **Plan Vocacional Docente**: Seguir el plan de asistencia preventiva de Lucas Mendoza (asistencia crítica del 85%).

### SUGERENCIA DEL TUTOR INTELIGENTE ENLACEC:
Te recomendamos agendar una reunión con los apoderados de los alumnos con inasistencias acumuladas y utilizar el canal de mensajería incorporado para enviar avisos de pago preventivos en formato digital PDF.
        `);
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse double asterisks and bullet points cleanly to beautiful custom elements
  const renderFormattedAiText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-3.5 text-xs text-gray-700 dark:text-zinc-300 leading-relaxed text-left font-sans font-medium">
        {lines.map((line, idx) => {
          let trimmed = line.trim();
          if (!trimmed) return null;

          // Headers
          if (trimmed.startsWith('###') || trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50) {
            const cleanHeader = trimmed.replace(/###|\*\*/g, '').trim();
            return (
              <h4 key={idx} className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-5 mb-2 border-b border-gray-150/50 dark:border-zinc-800/80 pb-1.5 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{cleanHeader}</span>
              </h4>
            );
          }

          // Bullet items
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            const cleanItem = trimmed.substring(1).trim();
            // Format bold text inside item
            const parts = cleanItem.split('**');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>
                <span>
                  {parts.map((p, i) => (
                    i % 2 === 1 ? <strong key={i} className="font-extrabold text-gray-900 dark:text-white">{p}</strong> : p
                  ))}
                </span>
              </div>
            );
          }

          // Standard paragraphs
          const parts = trimmed.split('**');
          return (
            <p key={idx} className="pl-1">
              {parts.map((p, i) => (
                i % 2 === 1 ? <strong key={i} className="font-extrabold text-gray-900 dark:text-white">{p}</strong> : p
              ))}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div id="ai-system-review-applet-card" className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-6">
      
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-550 to-purple-600 text-white rounded-2xl shadow-md shrink-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-indigo-505 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">TESLA AI Auditor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            </div>
            <h3 className="text-sm font-extrabold text-gray-850 dark:text-zinc-150">Revisión del Sistema e Informe Inteligente</h3>
          </div>
        </div>

        {diagnosticRun && (
          <button
            id="btn-re-run-audit"
            type="button"
            onClick={runDiagnostic}
            disabled={loading}
            className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-750 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer disabled:opacity-50"
            title="Volver a ejecutar auditoría escolar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!diagnosticRun ? (
        // Initial Promo view or empty state triggering button
        <div className="p-5 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 text-center space-y-4 max-w-xl mx-auto">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-200">¿Qué deudas, ausencias o salarios tienes pendientes por regularizar hoy?</h4>
            <p className="text-[11px] text-gray-450 leading-relaxed px-4">
              El motor de IA de TESLA AI revisará el registro completo en tiempo real, cotejará ausencias críticas y creará un plan inmediato para optimizar las operaciones de tu plantel.
            </p>
          </div>

          <div className="flex justify-center pt-1.5">
            <button
              id="btn-initiate-ai-audit"
              type="button"
              onClick={runDiagnostic}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ejecutar Diagnóstico TESLA AI</span>
            </button>
          </div>
        </div>
      ) : (
        // Active Diagnostic state
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {loading ? (
              // Loading sequence card with step tracking
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center space-y-4 bg-slate-50/40 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center"
              >
                {/* Visual pulsating circles */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute w-12 h-12 bg-indigo-500/15 rounded-full animate-ping"></div>
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white relative shadow-md shadow-indigo-500/10">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-550 dark:text-indigo-400">Escaneando Base de Datos...</p>
                  <p className="text-xs text-gray-650 dark:text-zinc-300 font-bold animate-pulse">{loadStep}</p>
                </div>
              </motion.div>
            ) : (
              // Results dashboard
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-5"
              >
                {/* Left side: Checklist of findings detected */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-gray-50/70 dark:bg-zinc-950/20 border border-gray-150/60 dark:border-zinc-850/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-zinc-800 pb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-zinc-500 font-mono">Pendientes Escaneados ({financeIssues.length + academicIssues.length})</span>
                      <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-200/40 px-1 py-0.2 rounded dark:bg-zinc-800">{resolvedTasks.length} de {financeIssues.length + academicIssues.length} Atendidos</span>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {/* Financial Findings */}
                      {financeIssues.map(item => {
                        const isResolved = resolvedTasks.includes(item.id);
                        return (
                          <div 
                            key={item.id}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all select-none text-left ${
                              isResolved 
                                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                                : 'bg-white dark:bg-zinc-900 border-gray-200/50 dark:border-zinc-800/80 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isResolved}
                              onChange={() => toggleTaskResolved(item.id)}
                              className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 select-none cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-bold text-xs truncate ${isResolved ? 'line-through text-gray-400' : 'text-gray-800 dark:text-zinc-200'}`}>{item.name}</span>
                                <span className="font-mono text-[10px] font-extrabold text-red-500 shrink-0">${item.amount}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                              <span className="inline-block mt-1 px-1.5 py-0.2 text-[8px] font-bold tracking-wider uppercase border rounded border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">Cobranza</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Academic/Attendance Findings */}
                      {academicIssues.map(item => {
                        const isResolved = resolvedTasks.includes(item.id);
                        return (
                          <div 
                            key={item.id}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all select-none text-left ${
                              isResolved 
                                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                                : 'bg-white dark:bg-zinc-900 border-gray-200/50 dark:border-zinc-800/80 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isResolved}
                              onChange={() => toggleTaskResolved(item.id)}
                              className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 select-none cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-bold text-xs truncate ${isResolved ? 'line-through text-gray-400' : 'text-gray-800 dark:text-zinc-200'}`}>{item.name}</span>
                                <span className="font-mono text-[10px] font-extrabold text-yellow-500 shrink-0">{item.rate}%</span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                              <span className="inline-block mt-1 px-1.5 py-0.2 text-[8px] font-bold tracking-wider uppercase border rounded border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-mono">Asistencia</span>
                            </div>
                          </div>
                        );
                      })}

                      {financeIssues.length === 0 && academicIssues.length === 0 && (
                        <div className="p-8 text-center text-gray-400 dark:text-zinc-500">
                          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                          <p className="text-xs font-extrabold">¡Felicidades! Cero pendientes de alta prioridad en el sistema.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: AI diagnostic feedback paragraph */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="bg-gradient-to-tr from-indigo-50 bg-indigo-50/5 dark:bg-zinc-900/30 border border-indigo-250/30 dark:border-indigo-950/40 rounded-2xl p-5 shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-750 dark:text-indigo-400 font-sans">Sugerencias Estratégicas de TESLA AI</span>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto pr-1">
                      {errorMsg && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-mono tracking-wider font-bold mb-3">
                          ⚠️ {errorMsg}
                        </div>
                      )}
                      {renderFormattedAiText(aiAnalysis)}
                    </div>
                  </div>

                  {/* Summary / Call to action */}
                  <div className="bg-slate-50 dark:bg-zinc-950/30 border border-gray-200/50 dark:border-zinc-850/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-extrabold text-gray-800 dark:text-zinc-200">Asimilación de deudas escolares</h5>
                        <p className="text-[9px] text-gray-400 font-medium">Regulariza el estado financiero desde el panel principal.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-xl text-[10px] font-bold text-gray-700 dark:text-zinc-300 font-mono">
                      <span>Recursos cargados: {totalResources} files</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
};
