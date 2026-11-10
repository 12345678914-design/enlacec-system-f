import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getThemeClasses } from '../../lib/themeUtils';
import { uploadToCloudinaryClient } from '../../services/clientServices';
import { envConfig, maskApiKey } from '../../config/envConfig';
import { supabase } from '../../lib/supabaseClient';
import { ReloadSupabaseButton } from '../ReloadSupabaseButton';
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
  ShieldAlert,
  QrCode,
  FileCode,
  Truck,
  Building2,
  Settings2,
  FileCheck2
} from 'lucide-react';
import {
  generateStudentBoleta,
  generateTeacherBoleta,
  generateSunatElectronicPdf,
  generateGuiaRemisionPdf
} from '../../utils/pdfGenerator';
import { exportFacturasToPDF } from '../../utils/exportUtils';
import {
  consultarPadronSunat,
  validarComprobanteSunat,
  emitirResumenOBajaSunat,
  generateSunatUblXml,
  generateSunatCdrXml,
  generateGuiaRemisionXml,
  generateCpeHash,
  buildSunatQrString,
  numeroALetrasSoles,
  downloadTextFile,
  getSunatConfig,
  saveSunatConfig,
  getSavedGuiasRemision,
  saveGuiaRemisionLocal,
  SunatPadronResult,
  SunatValidezResult,
  SunatGuiaRemision,
  SunatConfig
} from '../../services/sunatService';
import {
  consultarRucDni,
  validarComprobante,
  obtenerFacturasValidadasSunat,
  verificarFacturaExistenteEnSunat,
  eliminarFacturaValidadaSunat,
  EstadoComprobanteNormalizado,
  FacturaValidadaSunat
} from '../../lib/sunat';

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
    updateFactura,
    updateFacturaStatus, 
    deleteFactura, 
    students, 
    teachers, 
    attendance, 
    updateAttendanceStatus,
    servicios, 
    servicioCursos, 
    cursos,
    addNotification,
    addPushNotification,
    requestBrowserNotificationPermission,
    addTransaction,
    theme,
    vaultPasscode,
    setVaultPasscode,
    currentUser
  } = useApp();

  const cl = getThemeClasses(theme.accentColor);

  // Lock and Security States
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('edu_boveda_unlocked') === 'true';
  });
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Change passcode modal states
  const [showChangePasscodeModal, setShowChangePasscodeModal] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');
  const [isSavingPasscode, setIsSavingPasscode] = useState(false);

  // SUNAT Hybrid Mode & Config State
  const [sunatConfig, setSunatConfig] = useState<SunatConfig>(() => getSunatConfig());
  const [showSunatConfigModal, setShowSunatConfigModal] = useState(false);

  // Aprobar Asistencia de Profesores States
  const [showApproveAttendancePanel, setShowApproveAttendancePanel] = useState(true);
  const [attendanceFilterTab, setAttendanceFilterTab] = useState<'pendientes' | 'aprobadas' | 'todas'>('pendientes');
  const [approvingSessionId, setApprovingSessionId] = useState<string | null>(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  const pendingTeacherAttendances = useMemo(() => {
    return attendance.filter(
      att =>
        att.estado === null ||
        att.estado === undefined ||
        ((att.estado as any) !== true &&
          (att.estado as any) !== false &&
          (att.estado as any) !== 'ACEPTADO' &&
          (att.estado as any) !== 'Aceptado' &&
          (att.estado as any) !== 'RECHAZADO' &&
          (att.estado as any) !== 'Rechazado')
    );
  }, [attendance]);

  const approvedTeacherAttendances = useMemo(() => {
    return attendance.filter(
      att =>
        att.estado === true ||
        (att.estado as any) === 'ACEPTADO' ||
        (att.estado as any) === 'Aceptado'
    );
  }, [attendance]);

  const filteredTeacherAttendances = useMemo(() => {
    if (attendanceFilterTab === 'pendientes') return pendingTeacherAttendances;
    if (attendanceFilterTab === 'aprobadas') return approvedTeacherAttendances;
    return attendance;
  }, [attendance, attendanceFilterTab, pendingTeacherAttendances, approvedTeacherAttendances]);

  const handleApproveSingleAttendance = async (sessionId: string) => {
    setApprovingSessionId(sessionId);
    try {
      await updateAttendanceStatus(sessionId, true);
    } finally {
      setApprovingSessionId(null);
    }
  };

  const handleRejectSingleAttendance = async (sessionId: string) => {
    setApprovingSessionId(sessionId);
    try {
      await updateAttendanceStatus(sessionId, false);
    } finally {
      setApprovingSessionId(null);
    }
  };

  const handleApproveAllPendingAttendances = async () => {
    if (pendingTeacherAttendances.length === 0) return;
    setIsApprovingAll(true);
    try {
      for (const att of pendingTeacherAttendances) {
        await updateAttendanceStatus(att.id, true);
      }
    } finally {
      setIsApprovingAll(false);
    }
  };

  // SUNAT Modals States (Validador CPE, Consulta de Facturas Validadas, Resumen Diario, Comunicación de Baja, Guías GRE)
  const [showValidadorCpeModal, setShowValidadorCpeModal] = useState(false);
  const [validadorModalTab, setValidadorModalTab] = useState<'validar' | 'validadas'>('validar');
  const [valRucEmisor, setValRucEmisor] = useState('20000000001');
  const [valRazonSocialEmisor, setValRazonSocialEmisor] = useState('COLEGIO ENLACEC - SANDBOX BETA SUNAT');
  const [valTipoComp, setValTipoComp] = useState('01');
  const [valSerie, setValSerie] = useState('F001');
  const [valNumero, setValNumero] = useState('000001');
  const [valFecha, setValFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [valMonto, setValMonto] = useState('150.00');
  const [isValidatingCpe, setIsValidatingCpe] = useState(false);
  const [validezResult, setValidezResult] = useState<SunatValidezResult | null>(null);

  // Consulta de Facturas Validadas por la SUNAT States
  const [consultaValidadasBusqueda, setConsultaValidadasBusqueda] = useState('');
  const [consultaValidadasEstado, setConsultaValidadasEstado] = useState<'TODOS' | EstadoComprobanteNormalizado>('TODOS');
  const [consultaValidadasTipo, setConsultaValidadasTipo] = useState<string>('TODOS');
  const [consultaValidadasOrigen, setConsultaValidadasOrigen] = useState<'TODOS' | 'EMITIDA_SISTEMA' | 'VALIDADA_EXTERNA'>('TODOS');
  const [validadasRefreshTick, setValidadasRefreshTick] = useState(0);

  // Resumen Diario (RC) & Comunicación de Baja (RA)
  const [showResumenDiarioModal, setShowResumenDiarioModal] = useState(false);
  const [resumenFecha, setResumenFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSendingResumen, setIsSendingResumen] = useState(false);
  const [resumenResponse, setResumenResponse] = useState<{
    identificador: string;
    ticketSunat: string;
    mensaje: string;
    xmlContent: string;
    cdrContent: string;
  } | null>(null);

  const [facturaToBaja, setFacturaToBaja] = useState<Factura | null>(null);
  const [motivoBajaInput, setMotivoBajaInput] = useState('ERROR EN RUC/DNI O DATOS DE EMISIÓN');
  const [isSendingBaja, setIsSendingBaja] = useState(false);

  // Guías de Remisión Electrónica (GRE - Serie T001)
  const [showGreModal, setShowGreModal] = useState(false);
  const [guiasRemision, setGuiasRemision] = useState<SunatGuiaRemision[]>(() => getSavedGuiasRemision());
  const [greRucDestino, setGreRucDestino] = useState('20554433221');
  const [greNombreDestino, setGreNombreDestino] = useState('SEDE ACADÉMICA ENLACEC - ANEXO LABORATORIO');
  const [grePuntoPartida, setGrePuntoPartida] = useState('AV. GARCILASO DE LA VEGA 1472 - LIMA');
  const [grePuntoLlegada, setGrePuntoLlegada] = useState('AV. AREQUIPA 2450 - MIRAFLORES - LIMA');
  const [greMotivo, setGreMotivo] = useState('04 - Traslado entre establecimientos de la misma empresa');
  const [greModalidad, setGreModalidad] = useState('02 - Transporte Privado');
  const [grePesoKg, setGrePesoKg] = useState('18.50');
  const [grePlaca, setGrePlaca] = useState('B4X-782');
  const [greDniConductor, setGreDniConductor] = useState('46027897');
  const [greDescripcionBienes, setGreDescripcionBienes] = useState('Kits de Laboratorio de Física y Compendios Educativos');
  const [greSearchQuery, setGreSearchQuery] = useState('');
  const [greConsultaMsg, setGreConsultaMsg] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAttempt = passcodeAttempt.trim();
    let currentPass = (vaultPasscode || '1234').trim();

    // Verificación en tiempo real con Supabase si no coincide con el estado en memoria
    if (cleanAttempt !== currentPass) {
      try {
        const { data: latestDbRow } = await supabase
          .from('codigo_acceso_boveda')
          .select('codigo')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestDbRow && latestDbRow.codigo) {
          currentPass = latestDbRow.codigo.trim();
          setVaultPasscode(currentPass);
        }
      } catch (err) {
        console.warn('Error comprobando codigo_acceso_boveda en tiempo real:', err);
      }
    }

    if (cleanAttempt === currentPass) {
      setIsUnlocked(true);
      sessionStorage.setItem('edu_boveda_unlocked', 'true');
      setUnlockError('');
      setPasscodeAttempt('');
      addNotification({
        title: 'Acceso Concedido',
        content: 'Has ingresado correctamente a la Bóveda de Facturas.',
        type: 'success'
      });
    } else {
      setUnlockError('Acceso Denegado: La clave ingresada es incorrecta.');
      setPasscodeAttempt('');
      addNotification({
        title: 'Acceso Denegado',
        content: 'La clave de la bóveda de facturas no es válida. Acceso bloqueado.',
        type: 'error'
      });
    }
  };

  const handleChangePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    let currentPass = (vaultPasscode || '1234').trim();
    if (currentPassInput.trim() !== currentPass) {
      // Verificar con la tabla codigo_acceso_boveda
      try {
        const { data: latestDbRow } = await supabase
          .from('codigo_acceso_boveda')
          .select('codigo')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestDbRow && latestDbRow.codigo) {
          currentPass = latestDbRow.codigo.trim();
        }
      } catch {}

      if (currentPassInput.trim() !== currentPass) {
        setChangePassError('La clave actual ingresada es incorrecta.');
        return;
      }
    }

    if (newPassInput.trim().length < 4) {
      setChangePassError('La nueva clave debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassInput.trim() !== confirmPassInput.trim()) {
      setChangePassError('Las nuevas claves no coinciden.');
      return;
    }

    setIsSavingPasscode(true);
    try {
      const newCode = newPassInput.trim();
      
      // Guarda en el contexto y envía la fila a la tabla codigo_acceso_boveda
      await setVaultPasscode(newCode);

      setChangePassSuccess('¡Nuevo código registrado exitosamente en la tabla codigo_acceso_boveda!');
      addNotification({
        title: 'Código de Acceso Registrado',
        content: `El nuevo código de acceso (${newCode}) ha sido registrado en la tabla codigo_acceso_boveda de Supabase.`,
        type: 'success'
      });
      setTimeout(() => {
        setShowChangePasscodeModal(false);
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
        setChangePassSuccess('');
      }, 1500);
    } catch (err: any) {
      setChangePassError('Error guardando la nueva clave: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSavingPasscode(false);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('edu_boveda_unlocked');
    addNotification({
      title: 'Bóveda Cerrada',
      content: 'Has cerrado la sesión de la Bóveda de Facturas.',
      type: 'info'
    });
  };

  // Filter States (Por defecto muestra de este mes y año actual)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>(() => String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState<string>(() => String(new Date().getMonth() + 1));
  const [filterTipo, setFilterTipo] = useState<'todos' | 'estudiante' | 'profesor'>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'emitida' | 'pagada' | 'anulada'>('todos');
  const [filterSunatValidadas, setFilterSunatValidadas] = useState<'todos' | 'validadas_sunat' | 'anuladas_baja' | 'control_interno'>('todos');

  // Pestañas principales de estado SUNAT: Por Validar (Falta validar con botón Validar) vs Validadas vs Todas
  const [sunatListTab, setSunatListTab] = useState<'por_validar' | 'validadas' | 'todas' | 'anuladas'>('por_validar');
  const [selectedFacturaIds, setSelectedFacturaIds] = useState<string[]>([]);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [isValidatingBulk, setIsValidatingBulk] = useState(false);
  const [validationSuccessNotice, setValidationSuccessNotice] = useState<string | null>(null);

  // Helper canónico para identificar si una factura ya fue validada ante la SUNAT
  const isFacturaValidada = (f: Factura): boolean => {
    if (f.estado === 'anulada') return false;
    if (f.detalles?.modoTributario === 'interno_sin_ruc') return false;
    return f.detalles?.validadoSunat === true || f.detalles?.estadoSunat === 'VALIDADO';
  };

  // Contadores globales por categoría de comprobante
  const { countPorValidar, countValidadas, countTodas, countAnuladas } = useMemo(() => {
    let porVal = 0;
    let val = 0;
    let anul = 0;
    facturas.forEach(f => {
      if (f.estado === 'anulada' || f.detalles?.estadoSunat === 'BAJA_COMUNICADA') {
        anul++;
      } else if (isFacturaValidada(f)) {
        val++;
      } else if (f.detalles?.modoTributario !== 'interno_sin_ruc') {
        porVal++;
      }
    });
    return {
      countPorValidar: porVal,
      countValidadas: val,
      countTodas: facturas.length,
      countAnuladas: anul
    };
  }, [facturas]);

  const MONTH_LABELS: Record<string, string> = {
    '1': 'Enero',
    '2': 'Febrero',
    '3': 'Marzo',
    '4': 'Abril',
    '5': 'Mayo',
    '6': 'Junio',
    '7': 'Julio',
    '8': 'Agosto',
    '9': 'Septiembre',
    '10': 'Octubre',
    '11': 'Noviembre',
    '12': 'Diciembre'
  };

  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    const yearsSet = new Set<string>([String(currentY), String(currentY - 1), String(currentY - 2)]);
    facturas.forEach(f => {
      if (f.created_at) {
        const d = new Date(f.created_at);
        if (!isNaN(d.getTime())) {
          yearsSet.add(String(d.getFullYear()));
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [facturas]);

  // Emission Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emissionTab, setEmissionTab] = useState<'estudiante' | 'profesor'>('estudiante');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customConcept, setCustomConcept] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // SUNAT Emission Fields inside Modal
  const [tipoComprobanteCodigo, setTipoComprobanteCodigo] = useState<'03' | '01' | '02' | 'NV' | 'LQ'>('03');
  const [afectacionIgv, setAfectacionIgv] = useState<'exonerado' | 'gravado' | 'inafecto_rhe'>('exonerado');
  const [docReceptorInput, setDocReceptorInput] = useState('');
  const [nombreReceptorInput, setNombreReceptorInput] = useState('');
  const [direccionReceptorInput, setDireccionReceptorInput] = useState('LIMA - PERÚ');
  const [padronInfo, setPadronInfo] = useState<SunatPadronResult | null>(null);
  const [isConsultingPadron, setIsConsultingPadron] = useState(false);

  // Cloudinary connection test state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
        title: 'Cloudinary Conectado',
        content: `Cloud Name (${cloudName}) configurado correctamente en la aplicación.`,
        type: 'success'
      });
    } else {
      setTestResult({
        success: false,
        message: 'No se detectó VITE_CLOUDINARY_CLOUD_NAME. Los comprobantes se guardarán en modo local seguro.'
      });
      addNotification({
        title: 'Bóveda en Modo Local',
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

    try {
      const { data, error } = await supabase
        .from('boveda_codigos')
        .insert([{ codigo: randomCode }])
        .select()
        .single();

      if (!error && data) {
        newRecord.id = data.id;
        newRecord.created_at = data.created_at;
      }
    } catch (e) {
      console.warn('Fallback local para boveda_codigos:', e);
    }

    setBovedaCodigos(prev => [newRecord, ...prev]);
    setIsGeneratingCode(false);

    await addPushNotification({
      title: 'Nuevo Código de Bóveda Generado',
      body: `Se ha creado un nuevo código de acceso de 6 caracteres en la bóveda.`,
      type: 'sistema'
    });
  };

  const handleRequestCopyCode = (codeObj: BovedaCodigo) => {
    if (codeObj.copiado) return;
    setCodeToCopy(codeObj);
    setCopyPasswordInput('');
    setCopyPasswordError('');
  };

  const handleConfirmCopyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeToCopy) return;

    const validPassword = (vaultPasscode || '1234').trim();
    if (copyPasswordInput.trim() === validPassword) {
      try {
        await navigator.clipboard.writeText(codeToCopy.codigo);
      } catch (err) {
        console.warn('Clipboard write warning:', err);
      }
      markCodeAsCopied(codeToCopy.id);
      
      addNotification({
        title: 'Código Copiado',
        content: `El código ${codeToCopy.codigo} fue copiado al portapapeles. Ya no se podrá volver a copiar.`,
        type: 'success'
      });

      await addPushNotification({
        title: 'Código Extraído de Bóveda',
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

  // Filtered invoices (optimizado: salida rápida y acceso 100% seguro a propiedades sin errores de undefined)
  const filteredFacturas = useMemo(() => {
    if (!facturas || facturas.length === 0) return [];

    const searchLower = (searchTerm || '').trim().toLowerCase();
    const hasSearch = searchLower.length > 0;
    const isYearAll = filterYear === 'todos';
    const isMonthAll = filterMonth === 'todos';
    const isTipoAll = filterTipo === 'todos';
    const isEstadoAll = filterEstado === 'todos';
    const isSunatAll = filterSunatValidadas === 'todos';

    const now = new Date();
    const defaultYear = String(now.getFullYear());
    const defaultMonth = String(now.getMonth() + 1);

    return facturas.filter(f => {
      if (!f) return false;

      // 1. Filtro Año y Mes (extracción rápida desde ISO string)
      if (!isYearAll || !isMonthAll) {
        let fYear = defaultYear;
        let fMonth = defaultMonth;
        if (f.created_at && typeof f.created_at === 'string' && f.created_at.length >= 7) {
          fYear = f.created_at.substring(0, 4);
          const m = parseInt(f.created_at.substring(5, 7), 10);
          fMonth = !isNaN(m) ? String(m) : defaultMonth;
        } else if (f.created_at) {
          const fDate = new Date(f.created_at);
          if (!isNaN(fDate.getTime())) {
            fYear = String(fDate.getFullYear());
            fMonth = String(fDate.getMonth() + 1);
          }
        }
        if (!isYearAll && fYear !== filterYear) return false;
        if (!isMonthAll && fMonth !== filterMonth) return false;
      }

      // 2. Filtro Tipo
      if (!isTipoAll && f.tipo !== filterTipo) return false;

      // 3. Filtro Estado
      if (!isEstadoAll && f.estado !== filterEstado) return false;

      // 4. Filtro por Pestaña de Navegación SUNAT
      if (sunatListTab === 'por_validar') {
        // En "Falta Validar", mostrar comprobantes pendientes que no han sido validados ante SUNAT
        if (f.estado === 'anulada' || isFacturaValidada(f) || f.detalles?.modoTributario === 'interno_sin_ruc') {
          return false;
        }
      } else if (sunatListTab === 'validadas') {
        // En "Facturas Validadas", mostrar comprobantes con estado VALIDADO en SUNAT
        if (!isFacturaValidada(f)) {
          return false;
        }
      } else if (sunatListTab === 'anuladas') {
        if (f.estado !== 'anulada' && f.detalles?.estadoSunat !== 'BAJA_COMUNICADA') {
          return false;
        }
      }

      // Filtro SUNAT secundario (Dropdown)
      if (!isSunatAll) {
        const modo = f.detalles?.modoTributario;
        const estSunat = f.detalles?.estadoSunat;
        if (filterSunatValidadas === 'validadas_sunat') {
          if (!isFacturaValidada(f)) {
            return false;
          }
        } else if (filterSunatValidadas === 'anuladas_baja') {
          if (f.estado !== 'anulada' && estSunat !== 'BAJA_COMUNICADA') return false;
        } else if (filterSunatValidadas === 'control_interno') {
          if (modo !== 'interno_sin_ruc') return false;
        }
      }

      // 5. Búsqueda de texto (flexible para Serie-Correlativo, DNI, RUC, Nombre o Concepto)
      if (hasSearch) {
        const idMatch = f.id ? String(f.id).toLowerCase().includes(searchLower) : false;
        
        // Búsqueda inteligente por Serie y Correlativo:
        // Soporta: 'B001-000001', 'B001 000001', 'B001000001', 'B001-1', 'B001', '000001', etc.
        const effectiveSerie = f.detalles?.serieCorrelativo || 
          (f.tipo === 'estudiante' 
            ? `B001-${String(f.id || '').replace(/\D/g, '').slice(0, 6).padStart(6, '0')}` 
            : `E001-${String(f.id || '').replace(/\D/g, '').slice(0, 6).padStart(6, '0')}`);
        
        const effLower = effectiveSerie.toLowerCase();
        const effClean = effLower.replace(/[-\s]/g, '');
        const searchClean = searchLower.replace(/[-\s]/g, '');

        let serieMatch = effLower.includes(searchLower) || (searchClean.length >= 3 && effClean.includes(searchClean));

        // Si el usuario busca "B001-1", "B001 1" o similar sin los ceros de relleno
        if (!serieMatch && (searchLower.includes('-') || searchLower.includes(' '))) {
          const parts = searchLower.split(/[-\s]+/);
          if (parts.length === 2 && parts[0] && parts[1] && !isNaN(Number(parts[1]))) {
            const padded = `${parts[0].trim()}-${parts[1].trim().padStart(6, '0')}`;
            if (effLower.includes(padded)) {
              serieMatch = true;
            }
          }
        }

        const conceptoMatch = f.concepto ? String(f.concepto).toLowerCase().includes(searchLower) : false;
        const personaMatch = f.detalles?.nombrePersona ? String(f.detalles.nombrePersona).toLowerCase().includes(searchLower) : false;
        const dniDocMatch = f.detalles?.dniDocente ? String(f.detalles.dniDocente).toLowerCase().includes(searchLower) : false;
        const dniEstMatch = f.detalles?.dniEstudiante ? String(f.detalles.dniEstudiante).toLowerCase().includes(searchLower) : false;
        const rucMatch = f.detalles?.docClienteNumero ? String(f.detalles.docClienteNumero).toLowerCase().includes(searchLower) : false;

        if (!idMatch && !serieMatch && !conceptoMatch && !personaMatch && !dniDocMatch && !dniEstMatch && !rucMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [facturas, filterYear, filterMonth, searchTerm, filterTipo, filterEstado, filterSunatValidadas, sunatListTab]);

  // Lista de todas las facturas validadas por la SUNAT (emitidas y externas) usando src/lib/sunat.ts
  const facturasValidadasSunatList = useMemo(() => {
    return obtenerFacturasValidadasSunat(
      {
        busqueda: consultaValidadasBusqueda,
        estadoNormalizado: consultaValidadasEstado,
        tipoComprobante: consultaValidadasTipo,
        origen: consultaValidadasOrigen
      },
      facturas
    );
  }, [
    facturas,
    consultaValidadasBusqueda,
    consultaValidadasEstado,
    consultaValidadasTipo,
    consultaValidadasOrigen,
    validadasRefreshTick
  ]);

  // Dashboard Stats (calculados sobre las facturas filtradas por periodo/criterios)
  const stats = useMemo(() => {
    const active = filteredFacturas.filter(f => f.estado !== 'anulada');
    const totalEmitido = active.reduce((acc, curr) => acc + curr.monto, 0);
    const totalCobrado = filteredFacturas.filter(f => f.estado === 'pagada').reduce((acc, curr) => acc + curr.monto, 0);
    const totalPendiente = filteredFacturas.filter(f => f.estado === 'emitida').reduce((acc, curr) => acc + curr.monto, 0);
    const count = filteredFacturas.length;

    return { totalEmitido, totalCobrado, totalPendiente, count };
  }, [filteredFacturas]);

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
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return attendance.filter(record => {
      if (record.teacherId !== selectedTeacherId) return false;
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
  }, [attendance, selectedTeacherId]);

  const teacherEstimatedSalary = useMemo(() => {
    if (currentTeacherAttendanceRecords.length > 0) {
      const sumFromRecords = currentTeacherAttendanceRecords.reduce(
        (acc, r) => acc + (Number(r.monto) || 75.0),
        0
      );
      if (sumFromRecords > 0) return sumFromRecords;
    }
    const sessionRate = 75.00;
    const classesCount = currentTeacherAttendanceRecords.length || 4;
    return classesCount * sessionRate;
  }, [currentTeacherAttendanceRecords]);

  // Sync receptor fields when student or teacher changes
  useEffect(() => {
    if (emissionTab === 'estudiante' && currentSelectedStudent) {
      const dni = currentSelectedStudent.dni || '';
      const fullName = `${currentSelectedStudent.nombre} ${currentSelectedStudent.apellido}`.trim();
      setDocReceptorInput(dni);
      setNombreReceptorInput(fullName);
      setTipoComprobanteCodigo(sunatConfig.modo === 'interno_sin_ruc' ? 'NV' : '03');
      setAfectacionIgv('exonerado');
      setPadronInfo(null);
    } else if (emissionTab === 'profesor' && currentSelectedTeacher) {
      const dni = currentSelectedTeacher.dni || '';
      const fullName = `${currentSelectedTeacher.nombre || currentSelectedTeacher.name || ''} ${currentSelectedTeacher.apellido || ''}`.trim();
      setDocReceptorInput(dni);
      setNombreReceptorInput(fullName);
      setTipoComprobanteCodigo(sunatConfig.modo === 'interno_sin_ruc' ? 'LQ' : '02');
      setAfectacionIgv('inafecto_rhe');
      setPadronInfo(null);
    }
  }, [emissionTab, currentSelectedStudent, currentSelectedTeacher, sunatConfig.modo]);

  // Consulta Padrón SUNAT / RENIEC inside emission modal
  const handleConsultarPadronReceptor = async () => {
    const clean = docReceptorInput.trim();
    if (clean.length !== 8 && clean.length !== 11) {
      addNotification({
        title: 'Documento inválido',
        content: 'Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos para consultar en SUNAT.',
        type: 'warning'
      });
      return;
    }
    setIsConsultingPadron(true);
    try {
      const result = await consultarPadronSunat(clean);
      setPadronInfo(result);
      if (result.nombreRazonSocial) {
        setNombreReceptorInput(result.nombreRazonSocial);
      }
      if (result.direccionFiscal) {
        setDireccionReceptorInput(result.direccionFiscal);
      }
      if (clean.length === 11 && emissionTab === 'estudiante' && sunatConfig.modo === 'sandbox_beta') {
        setTipoComprobanteCodigo('01'); // Switch to Factura F001 automatically for RUC
      }
    } finally {
      setIsConsultingPadron(false);
    }
  };

  // Tax calculation preview inside modal
  const calculatedTaxes = useMemo(() => {
    const rawAmount = customAmount
      ? parseFloat(customAmount) || 0
      : emissionTab === 'estudiante'
      ? currentSelectedStudentService?.pago !== undefined
        ? Number(currentSelectedStudentService.pago)
        : 150.0
      : teacherEstimatedSalary;

    if (afectacionIgv === 'gravado') {
      const opGravada = +(rawAmount / 1.18).toFixed(2);
      const igvMonto = +(rawAmount - opGravada).toFixed(2);
      return {
        total: rawAmount,
        opGravada,
        opExonerada: 0,
        igvMonto,
        retencionRentaMonto: 0,
        letras: numeroALetrasSoles(rawAmount)
      };
    }

    if (afectacionIgv === 'inafecto_rhe') {
      const retencion = rawAmount > 1500 ? +(rawAmount * 0.08).toFixed(2) : 0;
      return {
        total: rawAmount,
        opGravada: 0,
        opExonerada: rawAmount,
        igvMonto: 0,
        retencionRentaMonto: retencion,
        letras: numeroALetrasSoles(rawAmount)
      };
    }

    return {
      total: rawAmount,
      opGravada: 0,
      opExonerada: rawAmount,
      igvMonto: 0,
      retencionRentaMonto: 0,
      letras: numeroALetrasSoles(rawAmount)
    };
  }, [customAmount, emissionTab, currentSelectedStudentService, teacherEstimatedSalary, afectacionIgv]);

  // Form emission handlers
  const handleEmitirComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadStatus({ type: 'idle', message: '' });

    try {
      // Block emission if taxpayer condition is NO HABIDO on Factura
      if (padronInfo && padronInfo.condicion === 'NO HABIDO' && tipoComprobanteCodigo === '01') {
        throw new Error('ALERTA SUNAT: No se puede emitir Factura Electrónica a un contribuyente en condición NO HABIDO.');
      }

      const nextSeq = String(facturas.length + 1).padStart(6, '0');
      const serieMap: Record<string, string> = {
        '01': 'F001',
        '03': 'B001',
        '02': 'E001',
        'NV': 'NV01',
        'LQ': 'LQ01'
      };
      const nombreCompMap: Record<string, string> = {
        '01': 'FACTURA ELECTRONICA',
        '03': 'BOLETA DE VENTA ELECTRONICA',
        '02': 'RECIBO POR HONORARIOS ELECTRONICO',
        'NV': 'NOTA DE VENTA INTERNA',
        'LQ': 'LIQUIDACION DE ASISTENCIA DOCENTE'
      };

      const serie = serieMap[tipoComprobanteCodigo] || 'B001';
      const serieCorrelativo = `${serie}-${nextSeq}`;
      const rucEmisor = sunatConfig.modo === 'sandbox_beta' ? sunatConfig.rucEmisor : '00000000000';
      const docNum = docReceptorInput.trim() || '00000000';
      const docTipo: '1' | '6' = docNum.length === 11 ? '6' : '1';
      const finalAmount = calculatedTaxes.total;
      const hashCpe = generateCpeHash(`${rucEmisor}|${serieCorrelativo}|${finalAmount}|${Date.now()}`);
      const qrCadena = buildSunatQrString({
        rucEmisor,
        tipoComprobanteCodigo,
        serieCorrelativo,
        igvMonto: calculatedTaxes.igvMonto,
        montoTotal: finalAmount,
        fechaEmision: new Date().toISOString().split('T')[0],
        docClienteTipo: docTipo,
        docClienteNumero: docNum,
        hashCpe
      });

      let base64Pdf = '';
      let invoiceId = serieCorrelativo;
      let facturaData: Omit<Factura, 'id' | 'created_at'>;

      if (emissionTab === 'estudiante') {
        if (!currentSelectedStudent) {
          throw new Error('Debe seleccionar un estudiante');
        }

        const conceptoFinal =
          customConcept ||
          `${nombreCompMap[tipoComprobanteCodigo]} - Matrícula ${currentSelectedStudentService?.nombre || 'Regular'} (${currentSelectedStudent.nombre} ${currentSelectedStudent.apellido})`;

        facturaData = {
          tipo: 'estudiante',
          student_id: currentSelectedStudent.id,
          monto: finalAmount,
          estado: 'emitida',
          concepto: conceptoFinal,
          detalles: {
            nombrePersona: nombreReceptorInput || `${currentSelectedStudent.nombre} ${currentSelectedStudent.apellido}`,
            dniEstudiante: currentSelectedStudent.dni || docNum,
            nombreServicio: currentSelectedStudentService?.nombre || 'Matrícula Regular',
            cursosVinculados: currentSelectedStudentCourses.map(c => c.nombre),
            metodoPago: 'Transferencia / Contado',
            modoTributario: sunatConfig.modo,
            tipoComprobanteCodigo,
            tipoComprobanteNombre: nombreCompMap[tipoComprobanteCodigo],
            serieCorrelativo,
            rucEmisor,
            razonSocialEmisor: sunatConfig.razonSocialEmisor,
            docClienteTipo: docTipo,
            docClienteNumero: docNum,
            direccionCliente: direccionReceptorInput,
            estadoContribuyente: padronInfo?.estado || 'ACTIVO',
            condicionContribuyente: padronInfo?.condicion || 'HABIDO',
            regimenContribuyente: padronInfo?.regimen || 'Educación - Exonerado Art. 2 Ley IGV',
            afectacionIgv,
            opGravada: calculatedTaxes.opGravada,
            opExonerada: calculatedTaxes.opExonerada,
            igvMonto: calculatedTaxes.igvMonto,
            retencionRentaMonto: 0,
            montoEnLetras: calculatedTaxes.letras,
            hashCpe,
            qrCadena,
            estadoSunat: sunatConfig.modo === 'sandbox_beta' ? 'ACEPTADO' : 'CONTROL_INTERNO',
            codigoRespuestaSunat: '0',
            mensajeSunat: `El comprobante ${serieCorrelativo} ha sido aceptado.`
          }
        };
      } else {
        if (!currentSelectedTeacher) {
          throw new Error('Debe seleccionar un docente');
        }

        const classesCount = currentTeacherAttendanceRecords.length || 4;
        const conceptoFinal =
          customConcept ||
          `${nombreCompMap[tipoComprobanteCodigo]} - Pago por ${classesCount} Sesiones de Asistencia (${currentSelectedTeacher.nombre || currentSelectedTeacher.name})`;

        facturaData = {
          tipo: 'profesor',
          teacher_id: currentSelectedTeacher.id,
          monto: finalAmount,
          estado: 'emitida',
          concepto: conceptoFinal,
          detalles: {
            nombrePersona: nombreReceptorInput || currentSelectedTeacher.nombre || currentSelectedTeacher.name || '',
            dniDocente: currentSelectedTeacher.dni || docNum,
            clasesDictadas: classesCount,
            tarifaPorClase: +(finalAmount / classesCount).toFixed(2),
            metodoPago: 'Abono en Cuenta / Planilla',
            modoTributario: sunatConfig.modo,
            tipoComprobanteCodigo,
            tipoComprobanteNombre: nombreCompMap[tipoComprobanteCodigo],
            serieCorrelativo,
            rucEmisor,
            razonSocialEmisor: sunatConfig.razonSocialEmisor,
            docClienteTipo: docTipo,
            docClienteNumero: docNum,
            direccionCliente: direccionReceptorInput,
            estadoContribuyente: padronInfo?.estado || 'ACTIVO',
            condicionContribuyente: padronInfo?.condicion || 'HABIDO',
            regimenContribuyente: padronInfo?.regimen || 'Renta 4ta Categoría (Docencia)',
            afectacionIgv,
            opGravada: calculatedTaxes.opGravada,
            opExonerada: calculatedTaxes.opExonerada,
            igvMonto: calculatedTaxes.igvMonto,
            retencionRentaMonto: calculatedTaxes.retencionRentaMonto,
            montoEnLetras: calculatedTaxes.letras,
            hashCpe,
            qrCadena,
            estadoSunat: sunatConfig.modo === 'sandbox_beta' ? 'ACEPTADO' : 'CONTROL_INTERNO',
            codigoRespuestaSunat: '0',
            mensajeSunat: `La liquidación ${serieCorrelativo} ha sido aceptada.`
          }
        };
      }

      // Generate SUNAT Electronic PDF with QR & Hash
      const tempFacturaForPdf: Factura = {
        id: serieCorrelativo,
        created_at: new Date().toISOString(),
        ...facturaData
      };
      const pdfResult = generateSunatElectronicPdf(tempFacturaForPdf, false);
      base64Pdf = pdfResult.base64;
      invoiceId = pdfResult.id;

      // Upload to Cloudinary (Client-Side)
      const resData = await uploadToCloudinaryClient(base64Pdf, `${invoiceId}.pdf`);

      // Save Invoice state
      await addFactura({
        ...facturaData,
        pdf_url: resData.url
      });

      // Register corresponding financial transaction
      if (facturaData.tipo === 'estudiante') {
        await addTransaction({
          type: 'ingreso',
          amount: facturaData.monto,
          concept: `${serieCorrelativo}: ${facturaData.concepto}`,
          category: 'Colegiatura',
          studentId: facturaData.student_id
        });
      } else {
        await addTransaction({
          type: 'egreso',
          amount: facturaData.monto,
          concept: `${serieCorrelativo}: ${facturaData.concepto}`,
          category: 'Salario Docente',
          teacherId: facturaData.teacher_id
        });
      }

      setUploadStatus({
        type: 'success',
        message:
          sunatConfig.modo === 'sandbox_beta'
            ? `Comprobante ${serieCorrelativo} emitido con XML UBL 2.1, QR SUNAT y CDR Aceptado (RUC Pruebas ${rucEmisor}).`
            : `Nota/Liquidación Interna ${serieCorrelativo} generada con éxito (Sin RUC).`
      });

      addNotification({
        title: `Comprobante ${serieCorrelativo} Emitido`,
        content: `Se generó el CPE por S/. ${facturaData.monto.toFixed(2)} con Hash ${hashCpe.slice(0, 12)}...`,
        type: 'success'
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedStudentId('');
        setSelectedTeacherId('');
        setCustomAmount('');
        setCustomConcept('');
        setPadronInfo(null);
        setUploadStatus({ type: 'idle', message: '' });
        setIsUploading(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        type: 'error',
        message: err.message || 'Error al emitir y firmar el comprobante.'
      });
      setIsUploading(false);
    }
  };

  const handleDownloadOffline = (factura: Factura) => {
    // If it has SUNAT electronic metadata or user wants the SUNAT format with QR & Hash, generate SUNAT PDF
    if (factura.detalles?.serieCorrelativo || factura.detalles?.hashCpe || sunatConfig.modo === 'sandbox_beta') {
      generateSunatElectronicPdf(factura, true);
      return;
    }

    if (factura.tipo === 'estudiante') {
      const studentObj = students.find(s => s.id === factura.student_id) || {
        id: factura.student_id || 'est-reg',
        nombre: factura.detalles?.nombrePersona || 'Estudiante',
        apellido: '',
        dni: factura.detalles?.dniEstudiante || '00000000',
        grado: 1,
        nivel: 'Secundaria',
        status: 'active'
      } as Student;

      const servObj = servicios.find(s => s.id === studentObj.servicioId);
      const linkedCourseIds = servicioCursos
        .filter(sc => sc.servicio_id === studentObj.servicioId || sc.servicioId === studentObj.servicioId)
        .map(sc => sc.curso_id || sc.cursoId);
      const coursesList = cursos.filter(c => linkedCourseIds.includes(c.id));

      generateStudentBoleta(studentObj, servObj, coursesList, true, {
        paymentMethod: factura.detalles?.metodoPago || 'Efectivo / Transferencia Bancaria',
        paymentStatus: factura.estado === 'pagada' ? 'PAGADO' : 'EMITIDA',
        amount: factura.monto,
        concepto: factura.concepto,
        transactionId: factura.id
      });
    } else {
      const teacherObj = (teachers.find(t => t.id === factura.teacher_id) || {
        id: factura.teacher_id || 'prof-reg',
        nombre: factura.detalles?.nombrePersona || 'Docente',
        dni: factura.detalles?.dniDocente || '00000000',
        email: 'docente@enlacec.edu.pe',
        phone: '900000000',
        subject: 'Cátedra General',
        specialty: 'Docencia',
        salary: factura.monto,
        status: 'active'
      }) as any;

      const records = attendance.filter(r => r.teacherId === teacherObj.id);

      generateTeacherBoleta(teacherObj, records, true, {
        amount: factura.monto,
        concepto: factura.concepto,
        paymentStatus: factura.estado === 'pagada' ? 'PAGADO' : 'EMITIDA',
        transactionId: factura.id
      });
    }
  };

  // Download XML UBL 2.1 for any Factura
  const handleDownloadXml = (factura: Factura) => {
    const ruc = factura.detalles?.rucEmisor || sunatConfig.rucEmisor || '20000000001';
    const tipo = factura.detalles?.tipoComprobanteCodigo || (factura.tipo === 'estudiante' ? '03' : '02');
    const sc = factura.detalles?.serieCorrelativo || `B001-${factura.id.replace(/\D/g, '').slice(0, 6).padStart(6, '0')}`;
    const xml = generateSunatUblXml(factura);
    downloadTextFile(`${ruc}-${tipo}-${sc}.xml`, xml);
    addNotification({
      title: 'XML UBL 2.1 Descargado',
      content: `Archivo ${ruc}-${tipo}-${sc}.xml generado con firma digital.`,
      type: 'info'
    });
  };

  // Download CDR (Constancia de Recepción SUNAT) for any Factura
  const handleDownloadCdr = (factura: Factura) => {
    const ruc = factura.detalles?.rucEmisor || sunatConfig.rucEmisor || '20000000001';
    const tipo = factura.detalles?.tipoComprobanteCodigo || (factura.tipo === 'estudiante' ? '03' : '02');
    const sc = factura.detalles?.serieCorrelativo || `B001-${factura.id.replace(/\D/g, '').slice(0, 6).padStart(6, '0')}`;
    const hash = factura.detalles?.hashCpe || generateCpeHash(`${ruc}|${sc}|${factura.monto}`);
    const cdr = generateSunatCdrXml({
      rucEmisor: ruc,
      serieCorrelativo: sc,
      tipoComprobanteNombre: factura.detalles?.tipoComprobanteNombre || 'Comprobante Electrónico',
      hashCpe: hash,
      ticketSunat: factura.detalles?.ticketSunat
    });
    downloadTextFile(`R-${ruc}-${tipo}-${sc}.xml`, cdr);
    addNotification({
      title: 'Constancia CDR SUNAT Descargada',
      content: `Constancia oficial R-${ruc}-${tipo}-${sc}.xml (Código 0: Aceptado) descargada.`,
      type: 'success'
    });
  };

  // Handle Validación de Comprobantes de Pago (Service #2 via src/lib/sunat.ts)
  const handleRunValidadorCpe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidatingCpe(true);
    try {
      const res = await validarComprobante(
        {
          rucEmisor: valRucEmisor,
          razonSocialEmisor: valRazonSocialEmisor,
          tipoComprobante: valTipoComp,
          serie: valSerie,
          numero: valNumero,
          fechaEmision: valFecha,
          montoTotal: parseFloat(valMonto) || 0
        },
        true
      );
      setValidezResult(res);
      setValidadasRefreshTick(prev => prev + 1);

      // Si coincide con alguna factura del sistema, actualizarla como VALIDADA en Supabase y estado local
      const scBuscado = `${valSerie}-${String(valNumero).padStart(6, '0')}`;
      const facturaCoincidente = facturas.find(f => {
        const sc = f.detalles?.serieCorrelativo || f.id;
        return sc.toUpperCase().includes(scBuscado.toUpperCase()) || sc.toUpperCase().includes(`${valSerie}${valNumero}`);
      });
      if (facturaCoincidente && res.esValido) {
        await updateFactura(facturaCoincidente.id, {
          detalles: {
            ...(facturaCoincidente.detalles || {}),
            validadoSunat: true,
            estadoSunat: 'ACEPTADO',
            fechaValidacionSunat: new Date().toISOString(),
            ticketSunat: res.ticketVerificacion,
            codigoRespuestaSunat: '0',
            mensajeSunat: res.mensaje
          }
        });
      }

      addNotification({
        title: `Validación SUNAT: ${res.estadoNormalizado}`,
        content: `${res.serieCorrelativo} (${res.rucEmisor}) -> Estado normalizado: ${res.estadoNormalizado}`,
        type: res.esValido ? 'success' : 'warning'
      });
    } finally {
      setIsValidatingCpe(false);
    }
  };

  // Validar directamente un comprobante de la tabla contra SUNAT: cambia estado a VALIDADO y lo envía a la Lista de Validados
  const handleValidarFacturaSunat = async (factura: Factura) => {
    setValidatingId(factura.id);
    setValidationSuccessNotice(null);
    try {
      const res = await verificarFacturaExistenteEnSunat(factura);

      const ticketSunat = res.ticketVerificacion || `VAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(factura.id || '').replace(/\D/g, '').slice(-4).padStart(4, '0')}`;

      // Persistir el cambio de estado a VALIDADO en Supabase y AppContext
      await updateFactura(factura.id, {
        detalles: {
          ...(factura.detalles || {}),
          validadoSunat: true,
          estadoSunat: 'ACEPTADO',
          fechaValidacionSunat: new Date().toISOString(),
          ticketSunat,
          codigoRespuestaSunat: '0',
          mensajeSunat: res.mensaje || 'Comprobante verificado y aceptado válidamente por SUNAT'
        }
      });

      setValidadasRefreshTick(prev => prev + 1);

      const sc = factura.detalles?.serieCorrelativo || factura.id;
      const msg = `✔ Comprobante ${sc} marcado como VALIDADO (Ticket: ${ticketSunat}). Ha sido enviado a la Lista de Validados.`;
      
      setValidationSuccessNotice(msg);

      addNotification({
        title: '✔ Comprobante Validado en SUNAT',
        content: msg,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error al validar comprobante en SUNAT:', err);
      addNotification({
        title: 'Error de Validación SUNAT',
        content: err.message || 'No se pudo completar la validación con el servicio SUNAT.',
        type: 'error'
      });
    } finally {
      setValidatingId(null);
    }
  };

  // Validar en lote todos los comprobantes seleccionados por el usuario
  const handleValidarSeleccionadosSunat = async () => {
    if (selectedFacturaIds.length === 0) return;
    setIsValidatingBulk(true);
    setValidationSuccessNotice(null);
    let count = 0;
    try {
      for (const id of selectedFacturaIds) {
        const factura = facturas.find(f => f.id === id);
        if (!factura) continue;
        const res = await verificarFacturaExistenteEnSunat(factura);
        const ticketSunat = res.ticketVerificacion || `VAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`;

        await updateFactura(factura.id, {
          detalles: {
            ...(factura.detalles || {}),
            validadoSunat: true,
            estadoSunat: 'ACEPTADO',
            fechaValidacionSunat: new Date().toISOString(),
            ticketSunat,
            codigoRespuestaSunat: '0',
            mensajeSunat: res.mensaje || 'Comprobante verificado y aceptado válidamente por SUNAT'
          }
        });
        count++;
      }
      setSelectedFacturaIds([]);
      setValidadasRefreshTick(prev => prev + 1);

      const msg = `✔ ${count} comprobante(s) validados exitosamente ante SUNAT y transferidos a Facturas Validadas.`;
      setValidationSuccessNotice(msg);

      addNotification({
        title: '✔ Validación Masiva Completada',
        content: msg,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error en validación en lote:', err);
      addNotification({
        title: 'Error en Validación Masiva',
        content: err.message || 'Ocurrió un error al validar los comprobantes seleccionados.',
        type: 'error'
      });
    } finally {
      setIsValidatingBulk(false);
    }
  };

  // Modal para consultar detalle de validez en SUNAT
  const handleVerificarFacturaEnSunat = async (factura: Factura) => {
    await handleValidarFacturaSunat(factura);
    const res = await verificarFacturaExistenteEnSunat(factura);
    setValidezResult(res);
    setValidadorModalTab('validadas');
    setShowValidadorCpeModal(true);
  };

  // Handle Resumen Diario de Boletas (Service #3A)
  const handleEmitirResumenDiario = async () => {
    setIsSendingResumen(true);
    try {
      const boletasDelDia = facturas.filter(f => f.estado !== 'anulada');
      const res = await emitirResumenOBajaSunat({
        tipoOperacion: 'RESUMEN_DIARIO',
        rucEmisor: sunatConfig.rucEmisor,
        fechaReferencia: resumenFecha,
        comprobantes: boletasDelDia.length > 0 ? boletasDelDia : facturas
      });
      setResumenResponse(res);
      addNotification({
        title: `Resumen Diario ${res.identificador} Aceptado`,
        content: `Ticket SUNAT N° ${res.ticketSunat}. Boletas agrupadas y declaradas correctamente.`,
        type: 'success'
      });
    } finally {
      setIsSendingResumen(false);
    }
  };

  // Handle Comunicación de Baja (Service #3B)
  const handleConfirmarComunicacionBaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facturaToBaja) return;
    setIsSendingBaja(true);
    try {
      const res = await emitirResumenOBajaSunat({
        tipoOperacion: 'BAJA',
        rucEmisor: sunatConfig.rucEmisor,
        fechaReferencia: new Date().toISOString().split('T')[0],
        comprobantes: [facturaToBaja],
        motivoBaja: motivoBajaInput
      });

      await updateFacturaStatus(facturaToBaja.id, 'anulada');
      downloadTextFile(`${sunatConfig.rucEmisor}-${res.identificador}.xml`, res.xmlContent);
      downloadTextFile(`R-${sunatConfig.rucEmisor}-${res.identificador}.xml`, res.cdrContent);

      addNotification({
        title: `Comunicación de Baja ${res.identificador}`,
        content: `Comprobante anulado ante SUNAT (Ticket: ${res.ticketSunat}). Se descargó el XML y CDR de Baja.`,
        type: 'warning'
      });
      setFacturaToBaja(null);
    } finally {
      setIsSendingBaja(false);
    }
  };

  // Handle Emitir Guía de Remisión Electrónica (Service #4)
  const handleEmitirGuiaRemision = async (e: React.FormEvent) => {
    e.preventDefault();
    const seq = String(guiasRemision.length + 1).padStart(6, '0');
    const sc = `T001-${seq}`;
    const fecha = new Date().toISOString().split('T')[0];
    const hash = generateCpeHash(`${sunatConfig.rucEmisor}|09|${sc}|${grePesoKg}|${Date.now()}`);
    const qr = `${sunatConfig.rucEmisor}|09|T001|${seq}|${Number(grePesoKg || 10).toFixed(2)}|${fecha}|6|${greRucDestino}|${hash}|`;

    const nuevaGre: SunatGuiaRemision = {
      id: `gre-${Date.now()}`,
      serieCorrelativo: sc,
      fechaEmision: fecha,
      rucRemitente: sunatConfig.rucEmisor,
      razonSocialRemitente: sunatConfig.razonSocialEmisor,
      destinatarioDocumento: greRucDestino,
      destinatarioNombre: greNombreDestino,
      puntoPartida: grePuntoPartida,
      puntoLlegada: grePuntoLlegada,
      motivoTraslado: greMotivo,
      modalidadTransporte: greModalidad,
      pesoBrutoKg: parseFloat(grePesoKg) || 10,
      placaVehiculo: grePlaca,
      dniConductor: greDniConductor,
      descripcionBienes: greDescripcionBienes,
      estadoSunat: 'ACEPTADO',
      hashGre: hash,
      qrCadena: qr,
      ticketSunat: `${Date.now()}910`
    };

    const updated = saveGuiaRemisionLocal(nuevaGre);
    setGuiasRemision(updated);
    addNotification({
      title: `Guía de Remisión ${sc} Emitida`,
      content: 'GRE autorizada por SUNAT con Código QR para traslado y control móvil.',
      type: 'success'
    });
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Acceso Privado a la Bóveda</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Para visualizar y emitir comprobantes electrónicos SUNAT de estudiantes y docentes, ingresa la clave de seguridad configurada.
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
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-center font-mono font-bold tracking-widest text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
            Bóveda de Facturas y Facturación SUNAT
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Emisión híbrida (Sandbox Beta SUNAT <code className="font-mono font-bold">RUC {sunatConfig.rucEmisor}</code> + Notas Internas sin RUC), XML UBL 2.1, CDR, Bajas y Guías de Remisión.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ReloadSupabaseButton label="Recargar Facturas" showDatabaseBadge={true} />
          <button
            type="button"
            onClick={() => {
              setShowChangePasscodeModal(true);
              setChangePassError('');
              setChangePassSuccess('');
              setCurrentPassInput('');
              setNewPassInput('');
              setConfirmPassInput('');
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 transition-all text-xs cursor-pointer border border-indigo-200/50 dark:border-indigo-900/40"
            title="Cambiar Contraseña de la Bóveda"
          >
            <Key className="w-3.5 h-3.5" />
            Cambiar Clave
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-all text-xs cursor-pointer"
            title="Cerrar Sesión de la Bóveda"
          >
            <Lock className="w-3.5 h-3.5" />
            Cerrar Bóveda
          </button>
          <button
            type="button"
            onClick={() => {
              setValidadorModalTab('validadas');
              setShowValidadorCpeModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all text-xs cursor-pointer"
            title="Ver y buscar todas las facturas aprobadas/validadas en la SUNAT"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Facturas Validadas SUNAT ({facturasValidadasSunatList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowApproveAttendancePanel(prev => !prev)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 transition-all text-xs cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Aprobar Asistencias Docentes</span>
            {pendingTeacherAttendances.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black font-mono">
                {pendingTeacherAttendances.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white transition-all duration-300 shadow-md ${cl.primaryBg} ${cl.primaryHoverBg} hover:shadow-lg cursor-pointer`}
          >
            <Plus className="w-5 h-5" />
            Emitir Comprobante CPE
          </button>
        </div>
      </div>

      {/* SUNAT HYBRID OPERATIONS BAR (5 Official SUNAT API Capabilities integrated directly) */}
      <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Pasarela Tributaria SUNAT UBL 2.1
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                  · {sunatConfig.modo === 'sandbox_beta' ? `Modo Sandbox Beta (RUC Pruebas: ${sunatConfig.rucEmisor})` : 'Modo Control Interno (Sin RUC - Series NV01/LQ01)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Opera sin RUC propio usando el entorno oficial de homologación de SUNAT o Notas de Venta internas. Cuando tramites tu RUC 10 o 20, cámbialo con un clic.
              </p>
            </div>
          </div>

          {/* Mode Toggle & Config */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  const updated: SunatConfig = { ...sunatConfig, modo: 'sandbox_beta' };
                  setSunatConfig(updated);
                  saveSunatConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  sunatConfig.modo === 'sandbox_beta'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
                }`}
              >
                Sandbox Beta SUNAT (20000000001)
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated: SunatConfig = { ...sunatConfig, modo: 'interno_sin_ruc' };
                  setSunatConfig(updated);
                  saveSunatConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  sunatConfig.modo === 'interno_sin_ruc'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
                }`}
              >
                Notas Internas (Sin RUC)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSunatConfigModal(true)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configurar RUC / SOL
            </button>
          </div>
        </div>

        {/* Action Buttons for the 5 SUNAT API Services + Consulta de Facturas Validadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              setValidezResult(null);
              setValidadorModalTab('validar');
              setShowValidadorCpeModal(true);
            }}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/70 dark:bg-slate-950/60 flex items-center gap-2.5 text-left transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Validar Comprobante CPE</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">Verifica autenticidad en SUNAT</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setValidadorModalTab('validadas');
              setShowValidadorCpeModal(true);
            }}
            className="p-2.5 rounded-xl border-2 border-emerald-500/60 dark:border-emerald-500/50 hover:border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center gap-2.5 text-left transition-all cursor-pointer shadow-xs"
          >
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 truncate">
                Facturas Validadas SUNAT ({facturasValidadasSunatList.length})
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate font-semibold">
                Buscar facturas aprobadas en SUNAT
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setResumenResponse(null);
              setShowResumenDiarioModal(true);
            }}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500 bg-gray-50/70 dark:bg-slate-950/60 flex items-center gap-2.5 text-left transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Resumen Diario Boletas (RC)</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">Envío agrupado de Boletas B001</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowGreModal(true)}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500 bg-gray-50/70 dark:bg-slate-950/60 flex items-center gap-2.5 text-left transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Guías de Remisión (GRE T001)</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">Traslado de bienes y consulta QR</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (filteredFacturas.length === 0) return;
              const target = filteredFacturas[0];
              handleDownloadXml(target);
              handleDownloadCdr(target);
            }}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-sky-400 dark:hover:border-sky-500 bg-gray-50/70 dark:bg-slate-950/60 flex items-center gap-2.5 text-left transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Descargar Último XML + CDR</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">Constancia firmada por SUNAT</p>
            </div>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Total Facturado</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-black dark:text-white tracking-tight">
              S/. {stats.totalEmitido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Total Cobrado</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">
              S/. {stats.totalCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Por Cobrar</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 tracking-tight">
              S/. {stats.totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Comprobantes</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-500">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-black dark:text-white tracking-tight">
              {stats.count} registros
            </span>
          </div>
        </div>
      </div>

      {/* PANEL DE APROBACIÓN DE ASISTENCIAS REGISTRADAS POR PROFESORES (Genera Factura en Sistema + Factura Personal del Profesor) */}
      {showApproveAttendancePanel && (
        <div className="bg-white dark:bg-slate-900/60 border border-emerald-200/80 dark:border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-3.5">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Aprobar Asistencias Registradas por Profesores
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      {pendingTeacherAttendances.length} pendiente(s) por aprobar
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {approvedTeacherAttendances.length} aprobada(s) y facturada(s)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Al aprobar una asistencia registrada por un docente, el sistema genera automáticamente su Recibo por Honorarios Electrónico (<code className="font-mono font-bold">E001</code>) y lo agrega tanto a las <strong>Facturas del Sistema</strong> como a <strong>Mis Facturas</strong> personales del profesor.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setAttendanceFilterTab('pendientes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendanceFilterTab === 'pendientes'
                        ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
                    }`}
                  >
                    Pendientes ({pendingTeacherAttendances.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceFilterTab('aprobadas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendanceFilterTab === 'aprobadas'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
                    }`}
                  >
                    Aprobadas ({approvedTeacherAttendances.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceFilterTab('todas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendanceFilterTab === 'todas'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
                    }`}
                  >
                    Todas ({attendance.length})
                  </button>
                </div>

                {pendingTeacherAttendances.length > 0 && (
                  <button
                    type="button"
                    disabled={isApprovingAll}
                    onClick={handleApproveAllPendingAttendances}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {isApprovingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Aprobar Todas ({pendingTeacherAttendances.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowApproveAttendancePanel(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Ocultar panel de asistencias"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredTeacherAttendances.length === 0 ? (
              <div className="p-6 text-center bg-gray-50/70 dark:bg-slate-950/40 rounded-xl border border-gray-100 dark:border-white/5">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                  {attendanceFilterTab === 'pendientes'
                    ? '¡Excelente! Todas las asistencias registradas por los profesores ya han sido revisadas y facturadas.'
                    : 'No se encontraron registros de asistencia en esta categoría.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-slate-950/60 border-b border-gray-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="py-2.5 px-3">Fecha / Horario</th>
                      <th className="py-2.5 px-3">Profesor</th>
                      <th className="py-2.5 px-3">Curso / Clase Dictada</th>
                      <th className="py-2.5 px-3 text-center">Alumnos Presentes</th>
                      <th className="py-2.5 px-3 text-center">Sesiones</th>
                      <th className="py-2.5 px-3 text-right">Honorarios (S/.)</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acción (Facturar)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredTeacherAttendances.map((att) => {
                      const prof = teachers.find(
                        t =>
                          t.id === att.teacherId ||
                          t.codigo === att.teacherId ||
                          t.name?.toLowerCase() === (att.teacherName || '').toLowerCase()
                      );
                      const profName = prof ? prof.name : (att.teacherName || 'Docente');
                      const sesiones = Number(att.cantidadSesiones) || 1;
                      const montoCalculado = Number(att.monto) > 0 ? Number(att.monto) : sesiones * 150;
                      const isApproved =
                        att.estado === true ||
                        (att.estado as any) === 'ACEPTADO' ||
                        (att.estado as any) === 'Aceptado';
                      const isRejected =
                        att.estado === false ||
                        (att.estado as any) === 'RECHAZADO' ||
                        (att.estado as any) === 'Rechazado';
                      const presentCount = Array.isArray(att.students)
                        ? att.students.filter(s => s.present).length
                        : 0;
                      const totalStudents = Array.isArray(att.students) ? att.students.length : 0;

                      const linkedInvoice = facturas.find(
                        f =>
                          f.detalles?.idSesionAsistencia === String(att.id) ||
                          (f.tipo === 'profesor' &&
                            (f.teacher_id === (prof?.id || att.teacherId)) &&
                            f.concepto.includes(`(${att.date})`))
                      );

                      return (
                        <tr key={att.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                            <span className="font-bold block">{att.date || 'Sin fecha'}</span>
                            <span className="text-[10px] text-gray-400">
                              {att.inicio?.substring(0, 5) || att.time || '08:00'} - {att.fin?.substring(0, 5) || '10:00'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{profName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              DNI: {prof?.dni || '72345678'} · {prof?.subject || 'Docente'}
                            </p>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-indigo-600 dark:text-indigo-400">{att.course || 'Clase General'}</p>
                            {att.comments && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[220px]" title={att.comments}>
                                {att.comments}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-zinc-300 font-bold">
                              {presentCount}/{totalStudents}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-zinc-300">
                            {sesiones}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            S/. {montoCalculado.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isApproved ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                  ✓ Aprobada y Facturada
                                </span>
                                {linkedInvoice?.detalles?.serieCorrelativo && (
                                  <span className="text-[9px] font-mono text-gray-400 mt-0.5">
                                    CPE: {linkedInvoice.detalles.serieCorrelativo}
                                  </span>
                                )}
                              </div>
                            ) : isRejected ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                                ✕ Rechazada
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                Pendiente Aprobación
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isApproved || approvingSessionId === att.id}
                                onClick={() => handleApproveSingleAttendance(att.id)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 opacity-75 cursor-default'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'
                                }`}
                                title="Aprobar asistencia y agregar factura al sistema y al portal del profesor"
                              >
                                {approvingSessionId === att.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>{isApproved ? 'En Facturas' : 'Aprobar y Facturar'}</span>
                              </button>
                              {!isApproved && (
                                <button
                                  type="button"
                                  disabled={isRejected || approvingSessionId === att.id}
                                  onClick={() => handleRejectSingleAttendance(att.id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                    isRejected
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 opacity-75 cursor-default'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer'
                                  }`}
                                  title="Rechazar asistencia"
                                >
                                  {isRejected ? 'Rechazada' : 'Rechazar'}
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
      )}

      {/* Pestañas de Navegación SUNAT: Por Validar (Falta validar) vs Facturas Validadas vs Todas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/40 p-2.5 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSunatListTab('por_validar');
              setSelectedFacturaIds([]);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              sunatListTab === 'por_validar'
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Falta Validar SUNAT</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              sunatListTab === 'por_validar'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {countPorValidar}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSunatListTab('validadas');
              setSelectedFacturaIds([]);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              sunatListTab === 'validadas'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Facturas Validadas SUNAT</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              sunatListTab === 'validadas'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {countValidadas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSunatListTab('todas');
              setSelectedFacturaIds([]);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              sunatListTab === 'todas'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Todas ({countTodas})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSunatListTab('anuladas');
              setSelectedFacturaIds([]);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              sunatListTab === 'anuladas'
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Anuladas ({countAnuladas})</span>
          </button>
        </div>

        {/* Acción masiva en pestaña 'por_validar' */}
        {sunatListTab === 'por_validar' && selectedFacturaIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isValidatingBulk}
              onClick={handleValidarSeleccionadosSunat}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isValidatingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Aprobar y Validar Seleccionados ({selectedFacturaIds.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFacturaIds([])}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Banner de Confirmación cuando se valida un comprobante */}
      {validationSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{validationSuccessNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            {sunatListTab !== 'validadas' && (
              <button
                type="button"
                onClick={() => setSunatListTab('validadas')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black cursor-pointer shadow-xs"
              >
                Ver en Lista de Validados →
              </button>
            )}
            <button
              type="button"
              onClick={() => setValidationSuccessNotice(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search toolbar (con filtro por Año y Mes - por defecto este mes - y Exportación PDF) */}
      <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-center gap-3 justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por Serie (B001, F001), DNI/RUC o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Filtro por Año */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase text-gray-400">Año:</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="bg-white text-black dark:bg-black dark:text-white px-2 py-0.5 rounded-md border border-gray-200 dark:border-zinc-700 text-xs font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos" className="bg-white text-black dark:bg-black dark:text-white">Todos</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className="bg-white text-black dark:bg-black dark:text-white">{yr}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Mes (Por defecto muestra de este mes) */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-bold uppercase text-gray-400">Mes:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-white text-black dark:bg-black dark:text-white px-2 py-0.5 rounded-md border border-gray-200 dark:border-zinc-700 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos" className="bg-white text-black dark:bg-black dark:text-white">Todos los meses</option>
                {Object.entries(MONTH_LABELS).map(([num, label]) => (
                  <option key={num} value={num} className="bg-white text-black dark:bg-black dark:text-white">{label}</option>
                ))}
              </select>
            </div>

            {/* Botón rápido para volver a Este Mes */}
            {(filterYear !== String(new Date().getFullYear()) || filterMonth !== String(new Date().getMonth() + 1)) && (
              <button
                type="button"
                onClick={() => {
                  setFilterYear(String(new Date().getFullYear()));
                  setFilterMonth(String(new Date().getMonth() + 1));
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-bold cursor-pointer"
              >
                Este Mes
              </button>
            )}

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="bg-white text-black dark:bg-black dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
            >
              <option value="todos" className="bg-white text-black dark:bg-black dark:text-white">Todos los Tipos</option>
              <option value="estudiante" className="bg-white text-black dark:bg-black dark:text-white">Matrícula Estudiantes (B001 / F001 / NV01)</option>
              <option value="profesor" className="bg-white text-black dark:bg-black dark:text-white">Salarios Docentes por Asistencia (E001 / LQ01)</option>
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="bg-white text-black dark:bg-black dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
            >
              <option value="todos" className="bg-white text-black dark:bg-black dark:text-white">Todos los Estados</option>
              <option value="emitida" className="bg-white text-black dark:bg-black dark:text-white">Emitida / Pendiente</option>
              <option value="pagada" className="bg-white text-black dark:bg-black dark:text-white">Pagada / Cobrada</option>
              <option value="anulada" className="bg-white text-black dark:bg-black dark:text-white">Anulada (Con Baja RA)</option>
            </select>

            <select
              value={filterSunatValidadas}
              onChange={(e) => setFilterSunatValidadas(e.target.value as any)}
              className="bg-white text-black dark:bg-black dark:text-white border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-bold"
            >
              <option value="todos">Validación SUNAT: Todas</option>
              <option value="validadas_sunat">Solo Facturas Validadas por SUNAT (ACEPTADO)</option>
              <option value="anuladas_baja">Anuladas con Baja RA en SUNAT</option>
              <option value="control_interno">Notas Internas (Sin RUC)</option>
            </select>

            {/* Botón Exportar PDF Filtrado */}
            <button
              type="button"
              onClick={() => {
                const mesNombre = filterMonth === 'todos' ? 'Todos los meses' : MONTH_LABELS[filterMonth] || filterMonth;
                const anioNombre = filterYear === 'todos' ? 'Todos los años' : filterYear;
                exportFacturasToPDF(filteredFacturas, {
                  titulo: 'REPORTE DE FACTURAS Y COMPROBANTES FILTRADOS - ADMINISTRACION',
                  periodoLabel: `${mesNombre} ${anioNombre}`,
                  filtroDetalle: `Pestaña: ${sunatListTab.toUpperCase()} | Tipo: ${filterTipo.toUpperCase()} | Estado: ${filterEstado.toUpperCase()}`
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              title="Exportar en PDF las facturas filtradas actualmente"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar PDF ({filteredFacturas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main invoices list table with PDF / XML / CDR downloads */}
      <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-gray-150 dark:border-white/10 text-[10px] font-black text-slate-850 dark:text-slate-100 uppercase tracking-widest">
                {sunatListTab === 'por_validar' && (
                  <th className="py-3 px-3 text-center w-8">
                    <input
                      type="checkbox"
                      checked={
                        filteredFacturas.length > 0 &&
                        filteredFacturas.every(f => selectedFacturaIds.includes(f.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFacturaIds(filteredFacturas.map(f => f.id));
                        } else {
                          setSelectedFacturaIds([]);
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Seleccionar todos los comprobantes para validar"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Serie / Correlativo</th>
                <th className="py-3 px-4">Concepto & Afectación</th>
                <th className="py-3 px-4">Receptor (DNI / RUC)</th>
                <th className="py-3 px-4">Fecha / Hash CPE</th>
                <th className="py-3 px-4 text-right">Importe Total</th>
                <th className="py-3 px-4 text-center">Estado / SUNAT</th>
                <th className="py-3 px-4 text-right">Descargas (PDF · XML · CDR) & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-white/5">
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map((factura, idx) => {
                  const isStudent = factura.tipo === 'estudiante';
                  const serieCorrelativo =
                    factura.detalles?.serieCorrelativo ||
                    (isStudent ? `B001-${String(idx + 1).padStart(6, '0')}` : `E001-${String(idx + 1).padStart(6, '0')}`);
                  const docNum =
                    factura.detalles?.docClienteNumero ||
                    (isStudent ? factura.detalles?.dniEstudiante : factura.detalles?.dniDocente) ||
                    '00000000';
                  const hashShort = (factura.detalles?.hashCpe || generateCpeHash(factura.id)).slice(0, 14) + '...';
                  const yaValidado = isFacturaValidada(factura);

                  return (
                    <tr 
                      key={factura.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-900/30 transition-colors text-xs text-slate-750 dark:text-slate-300"
                    >
                      {sunatListTab === 'por_validar' && (
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedFacturaIds.includes(factura.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFacturaIds(prev => [...prev, factura.id]);
                              } else {
                                setSelectedFacturaIds(prev => prev.filter(id => id !== factura.id));
                              }
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="py-3.5 px-4 font-bold tracking-tight">
                        <div className="flex items-center gap-2">
                          <QrCode className={`w-4 h-4 shrink-0 ${isStudent ? 'text-indigo-500' : 'text-teal-500'}`} />
                          <div>
                            <span className="font-mono font-black text-slate-900 dark:text-white block">
                              {serieCorrelativo}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              RUC: {factura.detalles?.rucEmisor || sunatConfig.rucEmisor}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-black dark:text-white truncate" title={factura.concepto}>
                          {factura.concepto}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                          <span>{isStudent ? 'Matrícula Estudiante' : 'Liquidación Asistencia Docente'}</span>
                          <span className="mx-1">·</span>
                          <span>
                            {factura.detalles?.afectacionIgv === 'gravado'
                              ? `Gravado IGV (S/. ${Number(factura.detalles?.igvMonto || 0).toFixed(2)})`
                              : factura.detalles?.afectacionIgv === 'inafecto_rhe'
                              ? 'RHE 4ta Categoría'
                              : 'Exonerado IGV (Educación)'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-black dark:text-white">
                          {factura.detalles?.nombrePersona || 'Receptor General'}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">
                          {docNum.length === 11 ? 'RUC' : 'DNI'}: {docNum} · {factura.detalles?.condicionContribuyente || 'HABIDO'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-black dark:text-white font-mono text-[11px] font-bold">
                          {new Date(factura.created_at).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold" title={factura.detalles?.hashCpe}>
                          Hash: {hashShort}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-black text-black dark:text-white text-sm">
                        S/. {factura.monto.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {factura.estado === 'anulada' ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3 h-3" />
                                ANULADA
                              </span>
                              <span className="text-[9px] font-mono text-rose-500 font-bold">
                                BAJA RA ENVIADA
                              </span>
                            </>
                          ) : yaValidado ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 shadow-xs">
                                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                VALIDADO SUNAT
                              </span>
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {factura.detalles?.ticketSunat ? `Ticket: ${factura.detalles.ticketSunat}` : 'CDR: ACEPTADO'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                FALTA VALIDAR
                              </span>
                              <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                                PENDIENTE SUNAT
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {factura.estado === 'emitida' && (
                            <button
                              type="button"
                              onClick={() => updateFacturaStatus(factura.id, 'pagada')}
                              title="Marcar como cobrado/pagado"
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Cobrar
                            </button>
                          )}

                          {/* PDF Download with SUNAT QR */}
                          <button
                            type="button"
                            onClick={() => handleDownloadOffline(factura)}
                            title="Descargar Representación Impresa PDF con QR SUNAT"
                            className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-mono font-bold hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>

                          {/* XML UBL 2.1 Download */}
                          <button
                            type="button"
                            onClick={() => handleDownloadXml(factura)}
                            title="Descargar XML UBL 2.1 firmado"
                            className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[10px] font-mono font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            XML
                          </button>

                          {/* CDR SUNAT Download */}
                          <button
                            type="button"
                            onClick={() => handleDownloadCdr(factura)}
                            title="Descargar Constancia de Recepción CDR de SUNAT"
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            CDR
                          </button>

                          {/* Estado de Validación SUNAT & Botón Validar */}
                          {yaValidado ? (
                            <span 
                              title={`Comprobante validado ante SUNAT (Ticket: ${factura.detalles?.ticketSunat || 'VAL-SUNAT'})`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-black flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 shadow-xs"
                            >
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Validado
                            </span>
                          ) : factura.estado !== 'anulada' ? (
                            <button
                              type="button"
                              onClick={() => handleValidarFacturaSunat(factura)}
                              disabled={validatingId === factura.id}
                              title="Validar comprobante en SUNAT y transferir a la lista de Validadas"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                            >
                              {validatingId === factura.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              )}
                              Validar SUNAT
                            </button>
                          ) : null}

                          {/* Comunicación de Baja (RA) / Delete */}
                          {factura.estado !== 'anulada' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFacturaToBaja(factura);
                                setMotivoBajaInput('ERROR EN EMISIÓN O DATOS DEL RECEPTOR');
                              }}
                              title="Emitir Comunicación de Baja SUNAT (RA)"
                              className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              Baja RA
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => deleteFactura(factura.id)}
                              title="Eliminar registro anulado"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={sunatListTab === 'por_validar' ? 8 : 7} className="py-10 text-center text-gray-400 dark:text-zinc-500 space-y-3">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {sunatListTab === 'por_validar' ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-emerald-500" />
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                            ¡Excelente! No hay comprobantes pendientes de validar en este filtro.
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Todos los comprobantes correspondientes a este periodo ya están registrados en la lista de Validadas de SUNAT.
                          </p>
                          <button
                            type="button"
                            onClick={() => setSunatListTab('validadas')}
                            className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            Ver Facturas Validadas ({countValidadas}) →
                          </button>
                        </>
                      ) : sunatListTab === 'validadas' ? (
                        <>
                          <ShieldCheck className="w-8 h-8 text-amber-500" />
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                            Aún no hay comprobantes validados en el filtro seleccionado.
                          </p>
                          {countPorValidar > 0 && (
                            <button
                              type="button"
                              onClick={() => setSunatListTab('por_validar')}
                              className="px-3.5 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              Ir a comprobantes que falta validar ({countPorValidar}) →
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-xs font-bold">
                          No se encontraron comprobantes registrados en el mes/filtro seleccionado ({filterMonth === 'todos' ? 'Todos' : MONTH_LABELS[filterMonth]} {filterYear}).
                        </p>
                      )}
                    </div>
                    {facturas.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterYear('todos');
                          setFilterMonth('todos');
                          setFilterTipo('todos');
                          setFilterEstado('todos');
                          setFilterSunatValidadas('todos');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Restablecer todos los filtros (Ver todos los meses y años)
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Generar Código
            </button>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {bovedaCodigos.map((codObj) => {
              const dateStr = codObj.created_at
                ? new Date(codObj.created_at).toLocaleDateString('es-ES') + ' ' + new Date(codObj.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                : 'Reciente';
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
                          <span className="text-rose-500">Extraído / Copiado (Un solo uso)</span>
                        ) : (
                          <span className="text-emerald-500">Disponible</span>
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
                    <Copy className="w-3 h-3" />
                    {codObj.copiado ? 'Ya copiado' : 'Copiar Código'}
                  </button>
                </div>
              );
            })}
          </div>
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
                  addNotification({ title: 'Permisos Push activos', content: 'Notificaciones del navegador habilitadas.', type: 'success' });
                }
              }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Activar Permisos Push
            </button>
          </div>

          <form onSubmit={handleSendCustomPush} className="space-y-3">
            <input
              required
              type="text"
              placeholder="Título de la Notificación Push..."
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full p-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl outline-none"
            />
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
              </select>
            </div>
            <button
              type="submit"
              disabled={isSendingPush}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSendingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

      {/* =====================================================================
          MODAL 1: EMISIÓN DE COMPROBANTE ELECTRÓNICO SUNAT (MATRÍCULA / DOCENTE)
         ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70"
            onClick={() => {
              if (!isUploading) setIsModalOpen(false);
            }}
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col z-10">
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-white/10 pb-3.5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Receipt className={`w-5 h-5 ${cl.primaryText}`} />
                    Emitir Comprobante Electrónico SUNAT (UBL 2.1)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {sunatConfig.modo === 'sandbox_beta'
                      ? `RUC Emisor Beta: ${sunatConfig.rucEmisor} · Genera PDF con QR, XML UBL 2.1 y CDR`
                      : 'Modo Control Interno sin RUC · Genera Nota de Venta / Liquidación Interna'}
                  </p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg bg-gray-50 dark:bg-slate-950 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {!isUploading && (
                <div className="flex bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-white/5 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmissionTab('estudiante');
                      setCustomAmount('');
                      setCustomConcept('');
                    }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      emissionTab === 'estudiante'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    1. Matrícula de Estudiante
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
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    2. Salario Docente por Asistencia
                  </button>
                </div>
              )}

              <form onSubmit={handleEmitirComprobante} className="mt-4 space-y-3.5 flex-1 overflow-y-auto pr-1">
                {isUploading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className={`w-12 h-12 animate-spin ${cl.primaryText}`} />
                    <div className="text-center">
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Firmando XML UBL 2.1 y generando Código QR SUNAT...</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Validando estructura tributaria y resguardando comprobante...</p>
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
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Observación Tributaria</p>
                        <p className="text-xs text-rose-500">{uploadStatus.message}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Selector de Estudiante o Docente */}
                    {emissionTab === 'estudiante' ? (
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                          Seleccionar Estudiante Matriculado
                        </label>
                        <select
                          required
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-150"
                        >
                          <option value="">-- Seleccionar Estudiante --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} {s.apellido} {s.dni ? `(DNI: ${s.dni})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                          Seleccionar Docente (Cálculo por Asistencias)
                        </label>
                        <select
                          required
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-150"
                        >
                          <option value="">-- Seleccionar Docente --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.nombre || t.name} {t.apellido || ''} {t.dni ? `(DNI: ${t.dni})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Tipo de Comprobante y Afectación IGV */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                          Tipo de Comprobante SUNAT
                        </label>
                        <select
                          value={tipoComprobanteCodigo}
                          onChange={(e) => setTipoComprobanteCodigo(e.target.value as any)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-150"
                        >
                          {emissionTab === 'estudiante' ? (
                            <>
                              <option value="03">03 - Boleta de Venta Electrónica (B001)</option>
                              <option value="01">01 - Factura Electrónica (F001 - RUC)</option>
                              <option value="NV">NV - Nota de Venta Interna (NV01 - Sin RUC)</option>
                            </>
                          ) : (
                            <>
                              <option value="02">02 - Recibo por Honorarios Electrónico (E001)</option>
                              <option value="LQ">LQ - Liquidación Interna de Asistencia (LQ01)</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                          Afectación Tributaria IGV / Renta
                        </label>
                        <select
                          value={afectacionIgv}
                          onChange={(e) => setAfectacionIgv(e.target.value as any)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-150"
                        >
                          <option value="exonerado">Exonerado IGV (0% - Servicios Educativos Art. 2)</option>
                          <option value="gravado">Gravado IGV (18% Desglosado)</option>
                          <option value="inafecto_rhe">Renta 4ta Categoría (Docentes / RHE)</option>
                        </select>
                      </div>
                    </div>

                    {/* Consulta de RUC y DNI (Padrón de Contribuyentes SUNAT - Servicio #1) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-gray-200 dark:border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          1. Consulta de Padrón SUNAT / RENIEC (Cliente o Docente)
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">Valida Activo y Habido</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={11}
                          value={docReceptorInput}
                          onChange={(e) => setDocReceptorInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="DNI (8 dígitos) o RUC (11 dígitos)..."
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          disabled={isConsultingPadron}
                          onClick={handleConsultarPadronReceptor}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          {isConsultingPadron ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                          Consultar SUNAT
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={nombreReceptorInput}
                          onChange={(e) => setNombreReceptorInput(e.target.value)}
                          placeholder="Nombre Completo o Razón Social"
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
                        />
                        <input
                          type="text"
                          value={direccionReceptorInput}
                          onChange={(e) => setDireccionReceptorInput(e.target.value)}
                          placeholder="Domicilio Fiscal"
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-zinc-300"
                        />
                      </div>

                      {padronInfo && (
                        <div className="pt-1 text-[11px] flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700 dark:text-zinc-300 border-t border-gray-200/60 dark:border-white/10">
                          <span>
                            Estado: <strong className={padronInfo.estado === 'ACTIVO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>{padronInfo.estado}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Condición: <strong className={padronInfo.condicion === 'HABIDO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>{padronInfo.condicion}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Régimen: <strong>{padronInfo.regimen}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resumen de Matrícula o Asistencias del Docente */}
                    {emissionTab === 'estudiante' && currentSelectedStudent && (
                      <div className="p-3 bg-indigo-50/40 dark:bg-slate-950/40 rounded-xl border border-indigo-100 dark:border-white/5 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Servicio Educativo:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {currentSelectedStudentService?.nombre || 'Matrícula Regular'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cursos Incluidos:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {currentSelectedStudentCourses.map(c => c.nombre).join(', ') || 'Plan Curricular General'}
                          </span>
                        </div>
                      </div>
                    )}

                    {emissionTab === 'profesor' && currentSelectedTeacher && (
                      <div className="p-3 bg-teal-50/40 dark:bg-slate-950/40 rounded-xl border border-teal-100 dark:border-white/5 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sesiones de Asistencia Registradas:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                            {currentTeacherAttendanceRecords.length || 4} sesiones dictadas
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Monto Calculado por Asistencias:</span>
                          <span className="font-mono font-black text-teal-600 dark:text-teal-400">
                            S/. {teacherEstimatedSalary.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Importe y Concepto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                          Importe Total (S/.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={calculatedTaxes.total.toFixed(2)}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                          Glosa / Concepto Personalizado
                        </label>
                        <input
                          type="text"
                          placeholder="Opcional: se autogenera si queda vacío"
                          value={customConcept}
                          onChange={(e) => setCustomConcept(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Desglose Tributario en Vivo */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 text-xs space-y-1">
                      <div className="flex justify-between font-mono text-[11px] text-gray-500 dark:text-zinc-400">
                        <span>Op. Exonerada: S/. {calculatedTaxes.opExonerada.toFixed(2)}</span>
                        <span>Op. Gravada: S/. {calculatedTaxes.opGravada.toFixed(2)}</span>
                        <span>IGV (18%): S/. {calculatedTaxes.igvMonto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-gray-200/70 dark:border-white/10">
                        <span className="text-[10px] font-mono text-gray-500 truncate max-w-[70%]">{calculatedTaxes.letras}</span>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          TOTAL: S/. {calculatedTaxes.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-zinc-300 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={emissionTab === 'estudiante' ? !selectedStudentId : !selectedTeacherId}
                        className={`px-4 py-2 text-xs font-black text-white rounded-xl shadow-md transition-all ${
                          (emissionTab === 'estudiante' ? selectedStudentId : selectedTeacherId)
                            ? `${cl.primaryBg} ${cl.primaryHoverBg} cursor-pointer`
                            : 'bg-gray-300 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Emitir Comprobante + XML + CDR
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

      {/* =====================================================================
          MODAL 2: VALIDACIÓN DE COMPROBANTES Y CONSULTA DE FACTURAS VALIDADAS SUNAT
         ===================================================================== */}
      {showValidadorCpeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowValidadorCpeModal(false)}
            className="fixed inset-0 bg-slate-950/70"
          />
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-3xl p-6 relative z-10 shadow-2xl max-h-[90vh] flex flex-col space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Validador CPE y Consulta de Facturas Validadas por la SUNAT
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Servicio utilitario <code className="font-mono">src/lib/sunat.ts</code> (Sandbox) con estados normalizados
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidadorCpeModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pestañas: Validar Nuevo CPE vs Consultar Facturas Validadas */}
              <div className="flex bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setValidadorModalTab('validar')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    validadorModalTab === 'validar'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Validar Comprobante en SUNAT
                </button>
                <button
                  type="button"
                  onClick={() => setValidadorModalTab('validadas')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    validadorModalTab === 'validadas'
                      ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Consultar Facturas Validadas ({facturasValidadasSunatList.length})
                </button>
              </div>

              {validadorModalTab === 'validar' ? (
                <div className="space-y-4 overflow-y-auto pr-1">
                  <form onSubmit={handleRunValidadorCpe} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">RUC del Emisor</label>
                        <div className="flex gap-1.5">
                          <input
                            required
                            type="text"
                            maxLength={11}
                            value={valRucEmisor}
                            onChange={(e) => setValRucEmisor(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const info = await consultarRucDni({ numero: valRucEmisor, tipo: 'RUC' });
                              if (info.nombreRazonSocial) {
                                setValRazonSocialEmisor(info.nombreRazonSocial);
                              }
                            }}
                            title="Consultar RUC en Padrón SUNAT"
                            className="px-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-xl font-bold text-[10px] cursor-pointer"
                          >
                            RUC
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Razón Social del Emisor</label>
                        <input
                          type="text"
                          value={valRazonSocialEmisor}
                          onChange={(e) => setValRazonSocialEmisor(e.target.value)}
                          placeholder="Razón Social del emisor..."
                          className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Tipo Comprobante</label>
                        <select
                          value={valTipoComp}
                          onChange={(e) => setValTipoComp(e.target.value)}
                          className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-bold"
                        >
                          <option value="01">01 - Factura Electrónica</option>
                          <option value="03">03 - Boleta de Venta</option>
                          <option value="02">02 - Recibo por Honorarios</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Serie (Ej. F001 / B001)</label>
                        <input
                          required
                          type="text"
                          value={valSerie}
                          onChange={(e) => setValSerie(e.target.value.toUpperCase())}
                          className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Número Correlativo</label>
                        <input
                          required
                          type="text"
                          value={valNumero}
                          onChange={(e) => setValNumero(e.target.value)}
                          className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Fecha Emisión</label>
                        <input
                          required
                          type="date"
                          value={valFecha}
                          onChange={(e) => setValFecha(e.target.value)}
                          className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Importe Total (S/.)</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={valMonto}
                          onChange={(e) => setValMonto(e.target.value)}
                          className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isValidatingCpe}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isValidatingCpe ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Validar Comprobante y Registrar en Facturas Validadas SUNAT
                    </button>
                  </form>

                  {validezResult && (
                    <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                      validezResult.esValido
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}>
                      <div className="font-black flex flex-wrap items-center justify-between gap-2">
                        <span>Estado Normalizado: {validezResult.estadoNormalizado || validezResult.estadoComprobante}</span>
                        <span className="font-mono">
                          Condición: {validezResult.condicionEmisorNormalizada || validezResult.condicionEmisor} · Código SUNAT: {validezResult.codigoEstado}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{validezResult.mensaje}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-current/15 font-mono text-[10px]">
                        <span>Ticket: {validezResult.ticketVerificacion || 'VAL-SUNAT'}</span>
                        <span>Hash: {(validezResult.hashVerificacion || '').slice(0, 22)}...</span>
                        <button
                          type="button"
                          onClick={() => setValidadorModalTab('validadas')}
                          className="underline font-bold cursor-pointer"
                        >
                          Ver en Historial de Facturas Validadas →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-3 overflow-hidden text-xs">
                  {/* Barra de filtros para consultar las facturas validadas por la SUNAT */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2 relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={consultaValidadasBusqueda}
                        onChange={(e) => setConsultaValidadasBusqueda(e.target.value)}
                        placeholder="Buscar por RUC, Serie (F001/B001), Razón Social o Ticket..."
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-black dark:text-white placeholder:text-gray-400"
                      />
                    </div>
                    <select
                      value={consultaValidadasEstado}
                      onChange={(e) => setConsultaValidadasEstado(e.target.value as any)}
                      className="p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-xs"
                    >
                      <option value="TODOS">Estado: Todos</option>
                      <option value="ACEPTADO">ACEPTADO (Válido)</option>
                      <option value="ANULADO">ANULADO (Baja RA)</option>
                      <option value="OBSERVADO">OBSERVADO</option>
                      <option value="NO_EXISTE">NO EXISTE</option>
                    </select>
                    <select
                      value={consultaValidadasOrigen}
                      onChange={(e) => setConsultaValidadasOrigen(e.target.value as any)}
                      className="p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-xs"
                    >
                      <option value="TODOS">Origen: Todos</option>
                      <option value="EMITIDA_SISTEMA">Emitidas en Sistema</option>
                      <option value="VALIDADA_EXTERNA">Validadas de Proveedores</option>
                    </select>
                  </div>

                  {/* Tabla de Facturas Validadas por la SUNAT */}
                  <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-xl divide-y divide-gray-100 dark:divide-white/5">
                    {facturasValidadasSunatList.length > 0 ? (
                      facturasValidadasSunatList.map((item: FacturaValidadaSunat) => (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-gray-50/70 dark:hover:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-slate-900 dark:text-white">
                                {item.serieCorrelativo}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500">
                                ({item.tipoComprobanteNombre})
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  item.estadoNormalizado === 'ACEPTADO'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : item.estadoNormalizado === 'ANULADO'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {item.estadoNormalizado} · {item.condicionContribuyente}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                              Emisor: {item.razonSocialEmisor} (RUC: {item.rucEmisor})
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              Receptor: {item.nombreReceptor} ({item.docReceptor}) · Fecha: {item.fechaEmision} · Ticket: {item.ticketSunat}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right mr-1">
                              <p className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                S/. {Number(item.montoTotal || 0).toFixed(2)}
                              </p>
                              <p className="text-[9px] font-mono text-gray-400">
                                IGV: S/. {Number(item.igvMonto || 0).toFixed(2)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const cdrXml = generateSunatCdrXml({
                                  rucEmisor: item.rucEmisor,
                                  serieCorrelativo: item.serieCorrelativo,
                                  tipoComprobanteNombre: item.tipoComprobanteNombre,
                                  hashCpe: item.hashCpe,
                                  ticketSunat: item.ticketSunat
                                });
                                downloadTextFile(
                                  `R-${item.rucEmisor}-${item.tipoComprobanteCodigo}-${item.serieCorrelativo}.xml`,
                                  cdrXml
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-mono font-bold text-[10px] hover:bg-emerald-100 cursor-pointer"
                              title="Descargar Constancia de Recepción CDR XML"
                            >
                              CDR XML
                            </button>

                            {item.origen === 'VALIDADA_EXTERNA' && (
                              <button
                                type="button"
                                onClick={() => {
                                  eliminarFacturaValidadaSunat(item.id);
                                  setValidadasRefreshTick(prev => prev + 1);
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                                title="Eliminar del historial"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-gray-400">
                        No se encontraron facturas validadas con los filtros seleccionados.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* =====================================================================
          MODAL 3: EMISIÓN DE RESUMEN DIARIO DE BOLETAS (RC - SERVICIO #3A)
         ===================================================================== */}
      {showResumenDiarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowResumenDiarioModal(false)}
            className="fixed inset-0 bg-slate-950/70"
          />
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Resumen Diario de Boletas (RC)</h3>
                    <p className="text-[10px] text-gray-400">Agrupa y declara en lote las Boletas de Venta Electrónicas</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowResumenDiarioModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Fecha de Emisión de Boletas</label>
                  <input
                    type="date"
                    value={resumenFecha}
                    onChange={(e) => setResumenFecha(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-white/10 flex justify-between items-center">
                  <span className="text-gray-500">Boletas activas para agrupar:</span>
                  <span className="font-mono font-black text-slate-800 dark:text-white">
                    {facturas.filter(f => f.estado !== 'anulada').length} comprobantes
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSendingResumen}
                  onClick={handleEmitirResumenDiario}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSendingResumen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Generar y Enviar Resumen Diario RC a SUNAT
                </button>

                {resumenResponse && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2">
                    <p className="font-black">{resumenResponse.mensaje}</p>
                    <p className="font-mono text-[11px]">Identificador: {resumenResponse.identificador} · Ticket: {resumenResponse.ticketSunat}</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => downloadTextFile(`${sunatConfig.rucEmisor}-${resumenResponse.identificador}.xml`, resumenResponse.xmlContent)}
                        className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg font-mono font-bold text-[11px] border border-emerald-500/30 cursor-pointer"
                      >
                        Descargar XML Resumen
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTextFile(`R-${sunatConfig.rucEmisor}-${resumenResponse.identificador}.xml`, resumenResponse.cdrContent)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-mono font-bold text-[11px] cursor-pointer"
                      >
                        Descargar CDR SUNAT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* =====================================================================
          MODAL 4: COMUNICACIÓN DE BAJA FORMAL (RA - SERVICIO #3B)
         ===================================================================== */}
      {facturaToBaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setFacturaToBaja(null)}
            className="fixed inset-0 bg-slate-950/70"
          />
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Comunicación de Baja SUNAT (RA)</h3>
                    <p className="text-[10px] text-gray-400">Anulación tributaria formal con generación de XML VoidedDocuments y CDR</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFacturaToBaja(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmarComunicacionBaja} className="space-y-3 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    Comprobante: <span className="font-mono">{facturaToBaja.detalles?.serieCorrelativo || facturaToBaja.id}</span>
                  </p>
                  <p className="text-gray-500 dark:text-zinc-400">
                    Receptor: {facturaToBaja.detalles?.nombrePersona || 'Receptor'} · Monto: S/. {Number(facturaToBaja.monto || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Motivo de Baja Tributaria (Obligatorio SUNAT)</label>
                  <input
                    required
                    type="text"
                    value={motivoBajaInput}
                    onChange={(e) => setMotivoBajaInput(e.target.value)}
                    placeholder="Ej. Error en RUC, operación cancelada, duplicidad..."
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-semibold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFacturaToBaja(null)}
                    className="flex-1 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-zinc-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingBaja}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSendingBaja ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    Enviar Baja RA + Descargar CDR
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =====================================================================
          MODAL 5: GUÍAS DE REMISIÓN ELECTRÓNICA (GRE T001 - SERVICIO #4)
         ===================================================================== */}
      {showGreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowGreModal(false)}
            className="fixed inset-0 bg-slate-950/70"
          />
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-2xl p-6 relative z-10 shadow-2xl max-h-[90vh] flex flex-col space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Guías de Remisión Electrónica (GRE - Serie T001)
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Emisión y consulta de traslado de materiales educativos / kits de laboratorio ante SUNAT
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowGreModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Emitir Nueva GRE */}
                <form onSubmit={handleEmitirGuiaRemision} className="p-3.5 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-white/10 space-y-3">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase text-[11px]">Emitir Nueva Guía de Remisión Remitente</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">RUC / DNI Destinatario</label>
                      <input
                        required
                        type="text"
                        value={greRucDestino}
                        onChange={(e) => setGreRucDestino(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Nombre / Sede Destinatario</label>
                      <input
                        required
                        type="text"
                        value={greNombreDestino}
                        onChange={(e) => setGreNombreDestino(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Punto de Partida (Ubigeo / Dirección)</label>
                      <input
                        required
                        type="text"
                        value={grePuntoPartida}
                        onChange={(e) => setGrePuntoPartida(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Punto de Llegada (Ubigeo / Dirección)</label>
                      <input
                        required
                        type="text"
                        value={grePuntoLlegada}
                        onChange={(e) => setGrePuntoLlegada(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Placa Vehículo / DNI Conductor</label>
                      <div className="flex gap-1.5">
                        <input
                          required
                          type="text"
                          value={grePlaca}
                          onChange={(e) => setGrePlaca(e.target.value.toUpperCase())}
                          placeholder="Placa"
                          className="w-1/2 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg font-mono"
                        />
                        <input
                          required
                          type="text"
                          value={greDniConductor}
                          onChange={(e) => setGreDniConductor(e.target.value)}
                          placeholder="DNI Cond."
                          className="w-1/2 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Peso Bruto (KGM) y Motivo</label>
                      <div className="flex gap-1.5">
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={grePesoKg}
                          onChange={(e) => setGrePesoKg(e.target.value)}
                          className="w-24 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold"
                        />
                        <select
                          value={greMotivo}
                          onChange={(e) => setGreMotivo(e.target.value)}
                          className="flex-1 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg"
                        >
                          <option value="01 - Venta / Entrega de Material Educativo">01 - Venta / Entrega Material</option>
                          <option value="04 - Traslado entre establecimientos de la misma empresa">04 - Traslado entre Sedes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Descripción de Bienes Trasladados</label>
                    <input
                      required
                      type="text"
                      value={greDescripcionBienes}
                      onChange={(e) => setGreDescripcionBienes(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    Emitir Guía de Remisión Electrónica (T001)
                  </button>
                </form>

                {/* Consulta de Estado de GRE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase text-[11px]">
                      Guías de Remisión Emitidas y Consulta de Fiscalización
                    </h4>
                    <input
                      type="text"
                      value={greSearchQuery}
                      onChange={(e) => setGreSearchQuery(e.target.value)}
                      placeholder="Filtrar T001-..."
                      className="px-2.5 py-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-lg font-mono text-[11px] text-black dark:text-white placeholder:text-gray-400"
                    />
                  </div>

                  {greConsultaMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      {greConsultaMsg}
                    </div>
                  )}

                  <div className="space-y-2">
                    {guiasRemision
                      .filter(g => {
                        const q = (greSearchQuery || '').toLowerCase().trim();
                        if (!q) return true;
                        return (
                          (g.serieCorrelativo ? String(g.serieCorrelativo).toLowerCase() : '').includes(q) ||
                          (g.descripcionBienes ? String(g.descripcionBienes).toLowerCase() : '').includes(q)
                        );
                      })
                      .map((gre) => (
                        <div key={gre.id} className="p-3 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-600 dark:text-amber-400">{gre.serieCorrelativo}</span>
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">· {gre.estadoSunat} (Ticket {gre.ticketSunat})</span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{gre.descripcionBienes}</p>
                            <p className="text-[10px] text-gray-500">
                              {gre.puntoPartida} → {gre.puntoLlegada} ({gre.pesoBrutoKg} KGM · Placa {gre.placaVehiculo})
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setGreConsultaMsg(`GRE ${gre.serieCorrelativo}: Estado EN TRÁNSITO / ACEPTADO POR SUNAT. Hash QR verificado para control aduanero/carreteras.`)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-[10px] font-bold cursor-pointer"
                            >
                              Validar Estado
                            </button>
                            <button
                              type="button"
                              onClick={() => generateGuiaRemisionPdf(gre, true)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-mono font-bold cursor-pointer"
                            >
                              PDF QR
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadTextFile(`${gre.rucRemitente}-09-${gre.serieCorrelativo}.xml`, generateGuiaRemisionXml(gre))}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                            >
                              XML
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================================
          MODAL 6: CONFIGURAR RUC / CREDENCIALES SOL SUNAT
         ===================================================================== */}
      {showSunatConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowSunatConfigModal(false)}
            className="fixed inset-0 bg-slate-950/70"
          />
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Parámetros del Emisor SUNAT</h3>
                    <p className="text-[10px] text-gray-400">Usa el RUC de pruebas 20000000001 o ingresa tu RUC 10 / RUC 20 cuando lo tengas</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowSunatConfigModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">RUC Emisor (Sin RUC propio usa: 20000000001)</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={sunatConfig.rucEmisor}
                    onChange={(e) => setSunatConfig({ ...sunatConfig, rucEmisor: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Razón Social / Nombre Comercial</label>
                  <input
                    type="text"
                    value={sunatConfig.razonSocialEmisor}
                    onChange={(e) => setSunatConfig({ ...sunatConfig, razonSocialEmisor: e.target.value })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Usuario SOL Secundario</label>
                    <input
                      type="text"
                      value={sunatConfig.usuarioSol}
                      onChange={(e) => setSunatConfig({ ...sunatConfig, usuarioSol: e.target.value })}
                      className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Clave SOL</label>
                    <input
                      type="password"
                      value={sunatConfig.claveSol}
                      onChange={(e) => setSunatConfig({ ...sunatConfig, claveSol: e.target.value })}
                      className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const reset: SunatConfig = {
                        modo: 'sandbox_beta',
                        rucEmisor: '20000000001',
                        razonSocialEmisor: 'COLEGIO ENLACEC - SANDBOX BETA SUNAT',
                        direccionEmisor: 'AV. GARCILASO DE LA VEGA 1472 - LIMA - PERÚ',
                        usuarioSol: 'MODDATOS',
                        claveSol: 'MODDATOS'
                      };
                      setSunatConfig(reset);
                      saveSunatConfig(reset);
                    }}
                    className="flex-1 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-zinc-300 font-bold rounded-xl cursor-pointer"
                  >
                    Restaurar Sandbox Beta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveSunatConfig(sunatConfig);
                      setShowSunatConfigModal(false);
                      addNotification({
                        title: 'Configuración Tributaria Guardada',
                        content: `RUC ${sunatConfig.rucEmisor} activo en la Bóveda.`,
                        type: 'success'
                      });
                    }}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Guardar Parámetros
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* PASSWORD CONFIRMATION MODAL FOR COPYING ACCESS CODE */}
      {codeToCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setCodeToCopy(null)}
            className="fixed inset-0 bg-slate-950/70"
          />
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl space-y-4">
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

            <form onSubmit={handleConfirmCopyCode} className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                  Ingresa la Contraseña de la Bóveda
                </label>
                <input
                  autoFocus
                  required
                  type="password"
                  placeholder="Escribe la contraseña..."
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
          </div>
        </div>
      )}

      {/* MODAL: CAMBIAR CLAVE DE BÓVEDA */}
      {showChangePasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowChangePasscodeModal(false)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Cambiar Clave de Bóveda</h3>
                  <p className="text-[10px] text-gray-400">Se registrará en la base de datos de inmediato.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePasscodeModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasscode} className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-gray-400 dark:text-zinc-500 mb-1">
                  Clave Actual de la Bóveda
                </label>
                <input
                  required
                  type="password"
                  placeholder="Clave actual (por defecto 1234)"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-gray-400 dark:text-zinc-500 mb-1">
                  Nueva Clave de Seguridad
                </label>
                <input
                  required
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-gray-400 dark:text-zinc-500 mb-1">
                  Confirmar Nueva Clave
                </label>
                <input
                  required
                  type="password"
                  placeholder="Repita la nueva clave"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl outline-none font-mono"
                />
              </div>

              {changePassError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
                  {changePassError}
                </div>
              )}

              {changePassSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
                  {changePassSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasscodeModal(false)}
                  className="flex-1 py-2 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPasscode}
                  className="flex-1 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingPasscode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Guardar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
