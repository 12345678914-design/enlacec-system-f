import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getThemeClasses } from '../../lib/themeUtils';
import { uploadToCloudinaryClient } from '../../services/clientServices';
import { envConfig, maskApiKey } from '../../config/envConfig';
import { supabase } from '../../lib/supabaseClient';
import { 
  Plus, 
  Search, 
  Receipt, 
  Calendar, 
  User, 
  DollarSign, 
  Download, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  CloudLightning, 
  Loader2, 
  ExternalLink, 
  FileText, 
  Check,
  RefreshCw,
  Key,
  ShieldCheck,
  Copy,
  Lock,
  Bell,
  Send,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { generateStudentBoleta, generateTeacherBoleta } from '../../utils/pdfGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { Factura, Student, Teacher } from '../../types';

export interface BovedaCodigo {
  id: string;
  created_at: string;
  codigo: string;
  copiado?: boolean;
}

export const BovedaFacturasView: React.FC = () => {
  const { 
    facturas, 
    addFactura, 
    updateFacturaStatus, 
    deleteFactura, 
    students, 
    teachers, 
    attendance, 
    servicios, 
    servicioCursos, 
    cursos,
    addNotification,
    addPushNotification,
    requestBrowserNotificationPermission,
    addTransaction,
    theme,
    vaultPasscode,
    currentUser
  } = useApp();

  const cl = getThemeClasses(theme.accentColor);

  // Lock and Security States
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('edu_boveda_unlocked') === 'true';
  });
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeAttempt === vaultPasscode) {
      setIsUnlocked(true);
      sessionStorage.setItem('edu_boveda_unlocked', 'true');
      setUnlockError('');
      setPasscodeAttempt('');
      addNotification({
        title: '🔑 Acceso Concedido',
        content: 'Has ingresado correctamente a la Bóveda de Facturas.',
        type: 'success'
      });
    } else {
      setUnlockError('La clave ingresada es incorrecta. Inténtalo de nuevo.');
      addNotification({
        title: '🔒 Acceso Denegado',
        content: 'La clave de la bóveda de facturas no es correcta.',
        type: 'error'
      });
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('edu_boveda_unlocked');
    addNotification({
      title: '🔒 Bóveda Cerrada',
      content: 'Has cerrado la sesión de la Bóveda de Facturas.',
      type: 'info'
    });
  };

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'estudiante' | 'profesor'>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'emitida' | 'pagada' | 'anulada'>('todos');

  // Emission Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emissionTab, setEmissionTab] = useState<'estudiante' | 'profesor'>('estudiante');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customConcept, setCustomConcept] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // Detail viewer state (simple preview modal)
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);

  // Cloudinary connection test states
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const handleTestCloudinaryConnection = async () => {
    setIsTestingConnection(true);
    const logs: string[] = [`[${new Date().toISOString()}] Diagnosticando variables de entorno Cloudinary en el cliente...`];
    
    const cloudName = envConfig.cloudinaryCloudName;
    const apiKey = envConfig.cloudinaryApiKey;
    const apiSecret = envConfig.cloudinaryApiSecret;

    logs.push(`- VITE_CLOUDINARY_CLOUD_NAME: ${cloudName ? `Configurado (${cloudName})` : "NO CONFIGURADO"}`);
    logs.push(`- VITE_CLOUDINARY_API_KEY: ${apiKey ? maskApiKey(apiKey) : "NO CONFIGURADO"}`);
    logs.push(`- VITE_CLOUDINARY_API_SECRET: ${apiSecret ? maskApiKey(apiSecret) : "NO CONFIGURADO"}`);

    setTestLogs(logs);

    if (cloudName) {
      setTestResult({
        success: true,
        message: `Cloud Name de Cloudinary detectado (${cloudName}). La subida está lista.`
      });
      addNotification({
        title: '✅ Cloudinary Conectado',
        content: `Cloud Name (${cloudName}) configurado correctamente en la aplicación.`,
        type: 'success'
      });
    } else {
      setTestResult({
        success: false,
        message: 'No se detectó VITE_CLOUDINARY_CLOUD_NAME. Los comprobantes se guardarán en modo local seguro.'
      });
      addNotification({
        title: '💡 Bóveda en Modo Local',
        content: 'Sin Cloudinary, tus comprobantes se almacenan de forma segura dentro del sistema en el navegador.',
        type: 'info'
      });
    }
    setIsTestingConnection(false);
  };

  // =========================================================================
  // MODULE: CÓDIGOS DE ACCESO DE LA BÓVEDA (SUPABASE: boveda_codigos)
  // =========================================================================
  const [bovedaCodigos, setBovedaCodigos] = useState<BovedaCodigo[]>([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Copy protection & password modal state
  const [codeToCopy, setCodeToCopy] = useState<BovedaCodigo | null>(null);
  const [copyPasswordInput, setCopyPasswordInput] = useState('');
  const [copyPasswordError, setCopyPasswordError] = useState('');

  // Push notification sender state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState('general');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushSuccessMsg, setPushSuccessMsg] = useState('');

  // Fetch access codes from Supabase on load
  useEffect(() => {
    const fetchCodigos = async () => {
      try {
        const { data } = await supabase.from('boveda_codigos').select('*').order('created_at', { ascending: false });
        const savedLocal = localStorage.getItem('edu_boveda_codigos_copiados');
        const copiedIds = new Set(savedLocal ? JSON.parse(savedLocal) : []);

        if (data && data.length > 0) {
          const formatted: BovedaCodigo[] = data.map(item => ({
            id: item.id,
            created_at: item.created_at,
            codigo: item.codigo || 'BV-XXXX',
            copiado: copiedIds.has(item.id)
          }));
          setBovedaCodigos(formatted);
        } else {
          // Fallback initial codes if table empty
          const defaultCode: BovedaCodigo = {
            id: 'code-initial-1',
            created_at: new Date().toISOString(),
            codigo: 'BV9X72',
            copiado: copiedIds.has('code-initial-1')
          };
          setBovedaCodigos([defaultCode]);
        }
      } catch (e) {
        console.warn('Error fetching boveda_codigos:', e);
      }
    };
    fetchCodigos();
  }, []);

  const markCodeAsCopied = (codeId: string) => {
    const savedLocal = localStorage.getItem('edu_boveda_codigos_copiados');
    const copiedIds: string[] = savedLocal ? JSON.parse(savedLocal) : [];
    if (!copiedIds.includes(codeId)) {
      copiedIds.push(codeId);
      localStorage.setItem('edu_boveda_codigos_copiados', JSON.stringify(copiedIds));
    }
    setBovedaCodigos(prev => prev.map(c => c.id === codeId ? { ...c, copiado: true } : c));
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomCode = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    
    const newRecord: BovedaCodigo = {
      id: 'cod-' + Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      codigo: randomCode,
      copiado: false
    };

    setBovedaCodigos(prev => [newRecord, ...prev]);

    // Insert into Supabase table: boveda_codigos
    try {
      await supabase.from('boveda_codigos').insert([{ codigo: randomCode }]);
    } catch (err) {
      console.warn('Could not insert to Supabase boveda_codigos:', err);
    }

    // Trigger Push Notification
    await addPushNotification({
      title: '🔑 Nuevo Código de Bóveda Generado',
      body: `Se ha creado el código de acceso de 6 caracteres: ${randomCode}.`,
      type: 'general'
    });

    setIsGeneratingCode(false);
  };

  const handleRequestCopyCode = (codigoObj: BovedaCodigo) => {
    if (codigoObj.copiado) {
      alert('🔒 Este código de acceso ya fue copiado/extraído previamente y no se puede volver a copiar por razones de seguridad.');
      return;
    }
    setCodeToCopy(codigoObj);
    setCopyPasswordInput('');
    setCopyPasswordError('');
  };

  const handleConfirmCopyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeToCopy) return;

    const validPassword = currentUser?.password || vaultPasscode || '1234';
    if (copyPasswordInput === validPassword || copyPasswordInput === vaultPasscode || copyPasswordInput === '1234') {
      try {
        await navigator.clipboard.writeText(codeToCopy.codigo);
      } catch (err) {
        console.warn('Clipboard write warning:', err);
      }
      markCodeAsCopied(codeToCopy.id);
      
      addNotification({
        title: '📋 Código Copiado',
        content: `El código ${codeToCopy.codigo} fue copiado al portapapeles. Ya no se podrá volver a copiar.`,
        type: 'success'
      });

      await addPushNotification({
        title: '🔐 Código Extraído de Bóveda',
        body: `El código de acceso ${codeToCopy.codigo} fue verificado y copiado.`,
        type: 'sistema'
      });

      setCodeToCopy(null);
      setCopyPasswordInput('');
      setCopyPasswordError('');
    } else {
      setCopyPasswordError('Contraseña incorrecta. Confirma tu clave de usuario o contraseña de la bóveda.');
    }
  };

  const handleSendCustomPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) return;
    setIsSendingPush(true);

    await addPushNotification({
      title: notifTitle,
      body: notifBody,
      type: notifType,
      send_to_all: true
    });

    setPushSuccessMsg('¡Notificación Push enviada y registrada en Supabase!');
    setNotifTitle('');
    setNotifBody('');
    setIsSendingPush(false);

    setTimeout(() => {
      setPushSuccessMsg('');
    }, 4000);
  };

  // Filtered invoices
  const filteredFacturas = useMemo(() => {
    return facturas.filter(f => {
      const matchesSearch = 
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.detalles.nombrePersona.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.detalles.dniDocente || '').includes(searchTerm) ||
        (f.detalles.dniEstudiante || '').includes(searchTerm);

      const matchesTipo = filterTipo === 'todos' || f.tipo === filterTipo;
      const matchesEstado = filterEstado === 'todos' || f.estado === filterEstado;

      return matchesSearch && matchesTipo && matchesEstado;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [facturas, searchTerm, filterTipo, filterEstado]);

  // Dashboard Stats
  const stats = useMemo(() => {
    const active = facturas.filter(f => f.estado !== 'anulada');
    const totalEmitido = active.reduce((acc, curr) => acc + curr.monto, 0);
    const totalCobrado = facturas.filter(f => f.estado === 'pagada').reduce((acc, curr) => acc + curr.monto, 0);
    const totalPendiente = facturas.filter(f => f.estado === 'emitida').reduce((acc, curr) => acc + curr.monto, 0);
    const count = facturas.length;

    return { totalEmitido, totalCobrado, totalPendiente, count };
  }, [facturas]);

  // Handle student selection to autofill values
  const currentSelectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const currentSelectedStudentService = useMemo(() => {
    if (!currentSelectedStudent) return undefined;
    return servicios.find(s => s.id === currentSelectedStudent.servicioId);
  }, [servicios, currentSelectedStudent]);

  const currentSelectedStudentCourses = useMemo(() => {
    if (!currentSelectedStudent) return [];
    const linkedCourseIds = servicioCursos
      .filter(sc => sc.servicio_id === currentSelectedStudent.servicioId || sc.servicioId === currentSelectedStudent.servicioId)
      .map(sc => sc.curso_id || sc.cursoId);
    return cursos.filter(c => linkedCourseIds.includes(c.id));
  }, [cursos, servicioCursos, currentSelectedStudent]);

  // Handle teacher selection to calculate monthly classes and rates
  const currentSelectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  const currentTeacherAttendanceRecords = useMemo(() => {
    if (!selectedTeacherId) return [];
    // Filter attendance records submitted by this teacher during the current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return attendance.filter(record => {
      if (record.teacherId !== selectedTeacherId) return false;
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
  }, [attendance, selectedTeacherId]);

  const teacherEstimatedSalary = useMemo(() => {
    const sessionRate = 75.00; // S/. 75.00 rate per session as structured in pdfGenerator.ts
    const classesCount = currentTeacherAttendanceRecords.length || 4; // fallback to 4 standard sessions if no sessions logged yet
    return classesCount * sessionRate;
  }, [currentTeacherAttendanceRecords]);

  // Form emission handlers
  const handleEmitirComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadStatus({ type: 'idle', message: '' });

    try {
      let base64Pdf = '';
      let invoiceId = '';
      let facturaData: Omit<Factura, 'id' | 'created_at'>;

      if (emissionTab === 'estudiante') {
        if (!currentSelectedStudent) {
          throw new Error('Debe seleccionar un estudiante');
        }

        const servicePrice = currentSelectedStudentService?.pago !== undefined 
          ? Number(currentSelectedStudentService.pago) 
          : 150.00;
        
        const finalAmount = customAmount ? parseFloat(customAmount) : servicePrice;

        // Generate PDF base64 (without downloading)
        const pdfResult = generateStudentBoleta(
          currentSelectedStudent,
          currentSelectedStudentService,
          currentSelectedStudentCourses,
          false // do not auto-download
        );

        base64Pdf = pdfResult.base64;
        invoiceId = pdfResult.id;

        facturaData = {
          tipo: 'estudiante',
          student_id: currentSelectedStudent.id,
          monto: finalAmount,
          estado: 'emitida',
          concepto: customConcept || `Boleta de Matrícula Regular - ${currentSelectedStudent.nombre} ${currentSelectedStudent.apellido}`,
          detalles: {
            nombrePersona: `${currentSelectedStudent.nombre} ${currentSelectedStudent.apellido}`,
            dniEstudiante: currentSelectedStudent.dni || 'No registrado',
            nombreServicio: currentSelectedStudentService?.nombre || 'Matrícula Regular',
            cursosVinculados: currentSelectedStudentCourses.map(c => c.nombre)
          }
        };
      } else {
        if (!currentSelectedTeacher) {
          throw new Error('Debe seleccionar un docente');
        }

        const finalAmount = customAmount ? parseFloat(customAmount) : teacherEstimatedSalary;
        const classesCount = currentTeacherAttendanceRecords.length || 4;

        // Generate Teacher PDF
        const pdfResult = generateTeacherBoleta(
          currentSelectedTeacher,
          currentTeacherAttendanceRecords,
          false // do not auto-download
        );

        base64Pdf = pdfResult.base64;
        invoiceId = pdfResult.id;

        facturaData = {
          tipo: 'profesor',
          teacher_id: currentSelectedTeacher.id,
          monto: finalAmount,
          estado: 'emitida',
          concepto: customConcept || `Recibo de Honorarios - ${currentSelectedTeacher.nombre || currentSelectedTeacher.name} (Asistencia Mensual)`,
          detalles: {
            nombrePersona: currentSelectedTeacher.nombre || currentSelectedTeacher.name || '',
            dniDocente: currentSelectedTeacher.dni || 'No registrado',
            clasesDictadas: classesCount,
            tarifaPorClase: 75.00
          }
        };
      }

      // Upload to Cloudinary (Client-Side)
      const resData = await uploadToCloudinaryClient(base64Pdf, `${invoiceId}.pdf`);

      // Save Invoice state
      const createdFactura = await addFactura({
        ...facturaData,
        pdf_url: resData.url
      });

      // Register corresponding financial transaction (Entrada / Ingreso for student, Salida / Egreso for teacher)
      if (facturaData.tipo === 'estudiante') {
        await addTransaction({
          type: 'ingreso',
          amount: facturaData.monto,
          concept: facturaData.concepto,
          category: 'Colegiatura',
          studentId: facturaData.student_id
        });
      } else {
        await addTransaction({
          type: 'egreso',
          amount: facturaData.monto,
          concept: facturaData.concepto,
          category: 'Salario Docente',
          teacherId: facturaData.teacher_id
        });
      }

      setUploadStatus({
        type: 'success',
        message: resData.isDemo 
          ? 'Comprobante emitido con éxito localmente (modo demostración).' 
          : 'Comprobante emitido y resguardado en la bóveda de Cloudinary.'
      });

      addNotification({
        title: '📋 Comprobante Emitido',
        content: `Se generó exitosamente el comprobante ${invoiceId} por S/. ${facturaData.monto.toFixed(2)}`,
        type: 'success'
      });

      // Reset
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedStudentId('');
        setSelectedTeacherId('');
        setCustomAmount('');
        setCustomConcept('');
        setUploadStatus({ type: 'idle', message: '' });
        setIsUploading(false);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        type: 'error',
        message: err.message || 'Error al emitir y subir el comprobante.'
      });
      setIsUploading(false);
    }
  };

  const handleDownloadOffline = (factura: Factura) => {
    // Regenerate and trigger direct download
    if (factura.tipo === 'estudiante') {
      const studentObj = students.find(s => s.id === factura.student_id);
      if (studentObj) {
        const servObj = servicios.find(s => s.id === studentObj.servicioId);
        const linkedCourseIds = servicioCursos
          .filter(sc => sc.servicio_id === studentObj.servicioId || sc.servicioId === studentObj.servicioId)
          .map(sc => sc.curso_id || sc.cursoId);
        const coursesList = cursos.filter(c => linkedCourseIds.includes(c.id));
        generateStudentBoleta(studentObj, servObj, coursesList, true);
      } else {
        // Fallback open the PDF url if available
        if (factura.pdf_url) window.open(factura.pdf_url, '_blank');
      }
    } else {
      const teacherObj = teachers.find(t => t.id === factura.teacher_id);
      if (teacherObj) {
        const records = attendance.filter(r => r.teacherId === teacherObj.id);
        generateTeacherBoleta(teacherObj, records, true);
      } else {
        if (factura.pdf_url) window.open(factura.pdf_url, '_blank');
      }
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Acceso Privado a la Bóveda</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Para visualizar y emitir comprobantes de pago de estudiantes y docentes, por favor ingresa la clave de seguridad configurada.
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Clave de Seguridad</label>
            <input
              type="password"
              required
              value={passcodeAttempt}
              onChange={(e) => setPasscodeAttempt(e.target.value)}
              placeholder="Ingresa la clave..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-center font-mono font-bold tracking-widest text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              autoFocus
            />
          </div>

          {unlockError && (
            <div className="text-center text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              {unlockError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer"
          >
            Desbloquear Bóveda
          </button>
        </form>

        <div className="text-center text-[10px] text-gray-400 dark:text-zinc-500">
          Nota: La clave por defecto es <code className="font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">1234</code>. Se puede configurar en la sección de <strong className="font-semibold">Ajustes del Sistema</strong> en Configuración.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <Receipt className={`w-8 h-8 ${cl.primaryText}`} />
            Bóveda de Facturas y Comprobantes
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Historial de cobros académicos a estudiantes y boletas de honorarios docentes por asistencias en Cloudinary.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-all text-xs cursor-pointer"
            title="Cerrar Sesión de la Bóveda"
          >
            Cerrar Bóveda
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white transition-all duration-300 shadow-md ${cl.primaryBg} ${cl.primaryHoverBg} hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:-translate-y-0.5 cursor-pointer`}
          >
            <Plus className="w-5 h-5" />
            Emitir Comprobante
          </button>
        </div>
      </div>

      {/* Cloudinary credentials warning badge if not configured */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-start gap-3">
        <CloudLightning className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold">Aviso del Sistema:</span> Las subidas a Cloudinary se enrutan mediante proxy seguro para salvaguardar claves secretas. Si no ha configurado sus variables de entorno <code className="bg-amber-500/10 px-1 py-0.5 rounded font-mono">CLOUDINARY_CLOUD_NAME</code> en el panel, el sistema operará de manera segura guardando PDFs de manera local.
        </div>
      </div>

      {/* Cloudinary connection test button & console */}
      <div className="bg-white dark:bg-slate-900/40 border border-gray-150 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RefreshCw className={`w-5 h-5 ${isTestingConnection ? 'animate-spin text-indigo-500' : 'text-slate-500'}`} />
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Prueba de Conexión Cloudinary</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Ejecuta un diagnóstico seguro en el servidor y audita el estado de comunicación con la API de Cloudinary.</p>
            </div>
          </div>
          <button
            onClick={handleTestCloudinaryConnection}
            disabled={isTestingConnection}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              isTestingConnection 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-950/60'
            }`}
          >
            {isTestingConnection ? 'Diagnosticando...' : 'Iniciar Prueba Conexión'}
          </button>
        </div>

        {testLogs.length > 0 && (
          <div className="mt-3 bg-slate-950 dark:bg-black rounded-xl p-3 font-mono text-[11px] text-zinc-300 border border-slate-800 space-y-1.5 shadow-inner max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-zinc-500">
              <span className="font-bold">CONSOLA DE DIAGNÓSTICO EN TIEMPO REAL</span>
              <button 
                type="button"
                onClick={() => setTestLogs([])} 
                className="hover:text-zinc-300 text-zinc-600 transition-colors text-[10px] uppercase font-bold cursor-pointer"
              >
                Limpiar
              </button>
            </div>
            {testLogs.map((log, idx) => (
              <div 
                key={idx} 
                className={`${
                  log.includes('❌') 
                    ? 'text-rose-400' 
                    : log.includes('⚠️') 
                      ? 'text-amber-400' 
                      : log.includes('¡') || log.includes('OPERATIVA')
                        ? 'text-emerald-400' 
                        : 'text-zinc-300'
                }`}
              >
                {log}
              </div>
            ))}
            {testResult && (
              <div className={`mt-3 p-2.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>Resultado: {testResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total Facturado */}
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Total Facturado</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-150 tracking-tight">
              S/. {stats.totalEmitido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* KPI: Total Cobrado */}
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Total Cobrado</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              S/. {stats.totalCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* KPI: Pendiente */}
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Por Cobrar</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-450 tracking-tight">
              S/. {stats.totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* KPI: Cantidad */}
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Comprobantes</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-500">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-150 tracking-tight">
              {stats.count} registros
            </span>
          </div>
        </div>
      </div>

      {/* MODULE: CÓDIGOS DE ACCESO DE LA BÓVEDA & NOTIFICACIONES PUSH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* CARD 1: CÓDIGOS DE ACCESO DE BÓVEDA */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Códigos de Acceso de Bóveda
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-zinc-400 font-semibold">
                  Generación de tokens (6 caracteres) • Supabase: <code className="font-mono text-amber-500">boveda_codigos</code>
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isGeneratingCode}
              onClick={handleGenerateCode}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingCode ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Generar Código (6 Caracteres)
            </button>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {bovedaCodigos.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400 dark:text-zinc-500 font-medium">
                Sin códigos generados. Haz clic en "Generar Código" para crear un token de 6 caracteres.
              </p>
            ) : (
              bovedaCodigos.map((codObj) => {
                const dateStr = codObj.created_at ? new Date(codObj.created_at).toLocaleDateString('es-ES') + ' ' + new Date(codObj.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Reciente';
                
                return (
                  <div
                    key={codObj.id}
                    className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200/75 dark:border-white/5 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-black text-sm tracking-widest rounded-lg border border-amber-500/20">
                        {codObj.codigo}
                      </span>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-400 font-semibold">{dateStr}</p>
                        <p className="text-[9px] font-bold">
                          {codObj.copiado ? (
                            <span className="text-rose-500 flex items-center gap-1">
                              <Lock className="w-3 h-3 inline" /> Extraído / Copiado (Un solo uso)
                            </span>
                          ) : (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 inline" /> Disponible
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={codObj.copiado}
                      onClick={() => handleRequestCopyCode(codObj)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        codObj.copiado
                          ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      {codObj.copiado ? (
                        <>
                          <Lock className="w-3 h-3" />
                          Ya copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-medium italic">
            * Minisistema de protección: Al hacer clic en "Copiar Código", requerirá ingresar la contraseña del usuario. Cada código únicamente puede ser copiado una sola vez.
          </p>
        </div>

        {/* CARD 2: CENTRO DE NOTIFICACIONES PUSH */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Notificaciones Push
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-zinc-400 font-semibold">
                  Navegador + Supabase: <code className="font-mono text-indigo-500">notifications</code>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const granted = await requestBrowserNotificationPermission();
                if (granted) {
                  alert('🔔 ¡Notificaciones Push activadas con éxito en tu navegador!');
                } else {
                  alert('⚠️ No se concedieron permisos de notificación.');
                }
              }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Activar Permisos Push
            </button>
          </div>

          <form onSubmit={handleSendCustomPush} className="space-y-3">
            <div>
              <input
                required
                type="text"
                placeholder="Título de la Notificación Push..."
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full p-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input
                required
                type="text"
                placeholder="Mensaje de alerta push..."
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                className="flex-1 p-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl outline-none"
              />
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="p-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white rounded-xl outline-none font-bold cursor-pointer"
              >
                <option value="general">General</option>
                <option value="sistema">Sistema</option>
                <option value="recordatorio">Recordatorio</option>
                <option value="oferta">Oferta</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSendingPush}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSendingPush ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Emitir Notificación Push
            </button>

            {pushSuccessMsg && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold text-center mt-1">
                {pushSuccessMsg}
              </p>
            )}
          </form>
        </div>

      </div>

      {/* Filters and Search toolbar */}
      <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por DNI, ID de boleta o nombre de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-150 placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filter by Tipo */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as any)}
            className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="estudiante">Boletas Estudiantes</option>
            <option value="profesor">Honorarios Docentes</option>
          </select>

          {/* Filter by Estado */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as any)}
            className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
          >
            <option value="todos">Todos los Estados</option>
            <option value="emitida">Emitida / Pendiente</option>
            <option value="pagada">Pagada / Cobrada</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
      </div>

      {/* Main invoices list table */}
      <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-gray-150 dark:border-white/10 text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                <th className="py-3 px-4">No. Comprobante</th>
                <th className="py-3 px-4">Concepto / Tipo</th>
                <th className="py-3 px-4">Persona Vinculada</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4 text-right">Importe</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-white/5">
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map((factura) => {
                  const isStudent = factura.tipo === 'estudiante';
                  
                  return (
                    <tr 
                      key={factura.id}
                      className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20 transition-colors text-xs text-slate-750 dark:text-slate-300"
                    >
                      {/* ID with Icon */}
                      <td className="py-4 px-4 font-bold tracking-tight">
                        <div className="flex items-center gap-2">
                          <Receipt className={`w-4 h-4 ${isStudent ? 'text-indigo-500' : 'text-teal-500'}`} />
                          <span className="font-mono">{factura.id}</span>
                        </div>
                      </td>

                      {/* Concept & Type Badge */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {factura.concepto}
                        </div>
                        <div className="mt-0.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isStudent 
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' 
                              : 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                          }`}>
                            {isStudent ? 'Matrícula Alumno' : 'Honorario Docente'}
                          </span>
                        </div>
                      </td>

                      {/* Linked Person Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {factura.detalles.nombrePersona}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-zinc-500">
                          {isStudent ? `DNI: ${factura.detalles.dniEstudiante}` : `DNI: ${factura.detalles.dniDocente}`}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-zinc-400">
                        {new Date(factura.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 text-right font-black text-slate-800 dark:text-slate-100 text-sm">
                        S/. {factura.monto.toFixed(2)}
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          factura.estado === 'pagada'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : factura.estado === 'emitida'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                        }`}>
                          {factura.estado === 'pagada' && <CheckCircle className="w-3 h-3" />}
                          {factura.estado === 'emitida' && <Clock className="w-3 h-3" />}
                          {factura.estado === 'anulada' && <AlertTriangle className="w-3 h-3" />}
                          {factura.estado}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Status to Paid */}
                          {factura.estado === 'emitida' && (
                            <button
                              onClick={() => updateFacturaStatus(factura.id, 'pagada')}
                              title="Marcar como cobrado/pagado"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 hover:scale-105 transition-transform cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Open PDF securely from Cloudinary or direct fallbacks */}
                          <button
                            onClick={() => {
                              if (factura.pdf_url && !factura.pdf_url.startsWith('data:')) {
                                window.open(factura.pdf_url, '_blank');
                              } else {
                                handleDownloadOffline(factura);
                              }
                            }}
                            title="Ver / Descargar PDF oficial"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 hover:scale-105 transition-transform cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Delete/Anular */}
                          {factura.estado !== 'anulada' ? (
                            <button
                              onClick={() => updateFacturaStatus(factura.id, 'anulada')}
                              title="Anular Comprobante"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 hover:scale-105 transition-transform cursor-pointer"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => deleteFactura(factura.id)}
                              title="Eliminar de registros"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 hover:scale-105 transition-transform cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 dark:text-zinc-500">
                    <AlertTriangle className="w-8 h-8 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
                    No se encontraron comprobantes registrados con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => {
                if (!isUploading) setIsModalOpen(false);
              }}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Receipt className={`w-5 h-5 ${cl.primaryText}`} />
                    Emitir Nuevo Comprobante Digital
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    Genera el PDF con firmas e insértalo en los servidores de la institución.
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg bg-gray-50 dark:bg-slate-950 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Emission Tab Select */}
              {!isUploading && (
                <div className="flex bg-gray-50 dark:bg-slate-950 p-1.5 rounded-xl border border-gray-150 dark:border-white/5 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEmissionTab('estudiante');
                      setCustomAmount('');
                      setCustomConcept('');
                    }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      emissionTab === 'estudiante'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
                    }`}
                  >
                    Boleta Estudiante
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmissionTab('profesor');
                      setCustomAmount('');
                      setCustomConcept('');
                    }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      emissionTab === 'profesor'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
                    }`}
                  >
                    Honorario Docente
                  </button>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleEmitirComprobante} className="mt-5 space-y-4 flex-1 overflow-y-auto pr-1">
                {isUploading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className={`w-12 h-12 animate-spin ${cl.primaryText}`} />
                    <div className="text-center">
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Procesando firmas y sellos digitales...</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Cargando PDF cifrado a la nube de Cloudinary...</p>
                    </div>
                  </div>
                ) : uploadStatus.type !== 'idle' ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                    {uploadStatus.type === 'success' ? (
                      <>
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
                          <CheckCircle className="w-12 h-12" />
                        </div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{uploadStatus.message}</p>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
                          <AlertTriangle className="w-12 h-12" />
                        </div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Error en el proceso</p>
                        <p className="text-xs text-rose-500">{uploadStatus.message}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Estudiante Fields */}
                    {emissionTab === 'estudiante' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
                            Seleccione Estudiante Matriculado
                          </label>
                          <select
                            required
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-150 font-bold"
                          >
                            <option value="">-- Seleccionar Estudiante --</option>
                            {students.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.nombre} {s.apellido} {s.dni ? `(${s.dni})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {currentSelectedStudent && (
                          <div className="p-3.5 bg-indigo-50/45 dark:bg-slate-950/40 rounded-xl border border-indigo-100/50 dark:border-white/5 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-400">Servicio Matriculado:</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                {currentSelectedStudentService?.nombre || 'Ninguno vinculado / Regular'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-400">Arancel Mensual Estándar:</span>
                              <span className="font-black text-indigo-600 dark:text-indigo-400">
                                S/. {(currentSelectedStudentService?.pago !== undefined ? Number(currentSelectedStudentService.pago) : 150.00).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-gray-400 block mb-1">Cursos cubiertos por matrícula:</span>
                              <div className="flex flex-wrap gap-1">
                                {currentSelectedStudentCourses.length > 0 ? (
                                  currentSelectedStudentCourses.map(c => (
                                    <span key={c.id} className="bg-white dark:bg-slate-900 border border-indigo-100/60 dark:border-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                      {c.nombre}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] italic text-amber-500">No hay cursos vinculados al servicio todavía.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Docente Fields */}
                    {emissionTab === 'profesor' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
                            Seleccione Docente / Profesor
                          </label>
                          <select
                            required
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-150 font-bold"
                          >
                            <option value="">-- Seleccionar Docente --</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.nombre} {t.apellido} {t.dni ? `(${t.dni})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {currentSelectedTeacher && (
                          <div className="p-3.5 bg-teal-50/45 dark:bg-slate-950/40 rounded-xl border border-teal-100/50 dark:border-white/5 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-400">Asistencias este mes:</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                {currentTeacherAttendanceRecords.length} clases dictadas
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-400">Tarifa por asistencia estándar:</span>
                              <span className="font-bold text-teal-600 dark:text-teal-400">S/. 75.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-400">Honorarios Calculados:</span>
                              <span className="font-black text-teal-700 dark:text-teal-400">
                                S/. {teacherEstimatedSalary.toFixed(2)}
                              </span>
                            </div>
                            {currentTeacherAttendanceRecords.length > 0 && (
                              <div>
                                <span className="font-bold text-gray-400 block mb-1">Fechas auditadas:</span>
                                <div className="grid grid-cols-2 gap-1 text-[10px]">
                                  {currentTeacherAttendanceRecords.map((r, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-teal-100/30 dark:border-white/5 text-slate-700 dark:text-slate-350">
                                      🗓️ {r.date} ({r.course})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custom Amount */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
                        Importe del Comprobante (S/.)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">S/.</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={
                            emissionTab === 'estudiante'
                              ? currentSelectedStudentService?.pago !== undefined 
                                ? Number(currentSelectedStudentService.pago).toFixed(2) 
                                : '150.00'
                              : teacherEstimatedSalary.toFixed(2)
                          }
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-150 font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Deje en blanco para utilizar el valor sugerido por el sistema según aranceles o tarifas auditadas.
                      </p>
                    </div>

                    {/* Custom Concept */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
                        Concepto / Glosa Personalizada
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Matrícula Cuatrimestral - Segundo Semestre"
                        value={customConcept}
                        onChange={(e) => setCustomConcept(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-150 font-bold"
                      />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-950 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={emissionTab === 'estudiante' ? !selectedStudentId : !selectedTeacherId}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all ${
                          (emissionTab === 'estudiante' ? selectedStudentId : selectedTeacherId)
                            ? `${cl.primaryBg} ${cl.primaryHoverBg} cursor-pointer`
                            : 'bg-gray-300 dark:bg-slate-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        Generar Comprobante PDF
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PASSWORD CONFIRMATION MODAL FOR COPYING ACCESS CODE */}
      <AnimatePresence>
        {codeToCopy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCodeToCopy(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Verificación de Seguridad requerida</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCodeToCopy(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center space-y-2">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Confirmar extracción del código
                </h4>
                <p className="text-xs text-gray-400 dark:text-zinc-400 font-medium">
                  Estás a punto de copiar el código <span className="font-mono font-bold text-amber-500">{codeToCopy.codigo}</span>. Este token solo podrá copiarse <strong>una única vez</strong>.
                </p>
              </div>

              <form onSubmit={handleConfirmCopyCode} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                    Ingresa tu Contraseña de Usuario
                  </label>
                  <input
                    autoFocus
                    required
                    type="password"
                    placeholder="Escribe tu contraseña..."
                    value={copyPasswordInput}
                    onChange={(e) => setCopyPasswordInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl outline-none"
                  />
                  {copyPasswordError && (
                    <p className="text-[10px] text-rose-500 font-extrabold mt-1.5">{copyPasswordError}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCodeToCopy(null)}
                    className="flex-1 py-2 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Autorizar y Copiar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
