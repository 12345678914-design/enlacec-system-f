/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { AttendanceCalendar } from '../AttendanceCalendar';
import { AIBoardSandbox } from '../AIBoardSandbox';
import { AISystemReview } from '../AISystemReview';
import { UserAvatar } from '../UserAvatar';
import { ImageCropper } from '../ImageCropper';
import { DeleteConfirmation } from '../DeleteConfirmation';
import { SuccessFeedback } from '../SuccessFeedback';
import { TeslaAIChatView } from './TeslaAIChatView';
import { NewsAnnouncementsView } from './NewsAnnouncementsView';
import { BovedaFacturasView } from './BovedaFacturasView';
import { VercelEnvConfigCard } from '../VercelEnvConfigCard';
import { 
  lookupReniecDniClient, 
  generateDailySummaryClient, 
  uploadToCloudinaryClient 
} from '../../services/clientServices';
import { Student, Teacher, ResourceItem, FinancialTransaction, AccentColor } from '../../types';
import { exportToCSV, exportStudentsToPDF, exportTransactionsToPDF } from '../../utils/exportUtils';
import { generateStudentBoleta, generateTeacherBoleta } from '../../utils/pdfGenerator';
import { getThemeClasses, ACCENT_COLORS_METADATA } from '../../lib/themeUtils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  GraduationCap, 
  Users, 
  BookOpen,
  Layers,
  Folder, 
  FileText, 
  Filter,
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight, 
  File, 
  Coins, 
  DollarSign, 
  LogOut, 
  CheckCircle2, 
  X, 
  Percent, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  Settings,
  FolderPlus,
  ArrowRight,
  UserPlus,
  GripVertical,
  Edit,
  Upload,
  LayoutGrid,
  Table,
  Download,
  FileSpreadsheet,
  FileDown,
  Receipt,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  activeTab: string;
  onChangeTab?: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, onChangeTab }) => {
  const { 
    students, addStudent, updateStudent, deleteStudent,
    teachers, addTeacher, updateTeacher, deleteTeacher,
    resources, addResource, deleteResource,
    transactions, addTransaction, balance,
    attendance,
    theme, updateTheme, news, addNotification,
    errorLogs, supabaseStatus,
    cursos, servicios, servicioCursos, servicioProfesores,
    addCourse, updateCourse, deleteCourse, addService, updateService, deleteService, linkCourseToService, unlinkCourseFromService, linkTeacherToService, unlinkTeacherFromService,
    notas, addNota, updateNota, deleteNota,
    vaultPasscode, setVaultPasscode, addFactura
  } = useApp();

  const cl = getThemeClasses(theme.accentColor);

  const formatServiceDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Docente Sub-tabs state and modals
  const [docenteSubTab, setDocenteSubTab] = useState<'lista' | 'cursos' | 'asistencias'>('lista');
  const [courseSearch, setCourseSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCoursePago, setNewCoursePago] = useState(25);
  
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<any | null>(null);
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCoursePago, setEditCoursePago] = useState(25);

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuracion, setNewServiceDuracion] = useState<string>('');
  const [newServicePago, setNewServicePago] = useState<string>('');

  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<any | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDesc, setEditServiceDesc] = useState('');
  const [editServiceDuracion, setEditServiceDuracion] = useState<string>('');
  const [editServicePago, setEditServicePago] = useState<string>('');
  
  const [showLinkCourseModal, setShowLinkCourseModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedCourseToLinkId, setSelectedCourseToLinkId] = useState('');
  const [showLinkTeacherModal, setShowLinkTeacherModal] = useState(false);
  const [selectedTeacherToLinkId, setSelectedTeacherToLinkId] = useState('');

  // Diagnostics and Logs modal
  const [showErrorLogsModal, setShowErrorLogsModal] = useState(false);

  // Active module sub-state variables
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<'notas' | 'asistencias' | 'boleta'>('notas');
  const [addingGradeForCourseId, setAddingGradeForCourseId] = useState<string | null>(null);
  const [gradeProfId, setGradeProfId] = useState<string>('');
  const [gradeNum, setGradeNum] = useState<string>('15');
  const [gradeQual, setGradeQual] = useState<string>('EXCELENTE');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [dniStepCompleted, setDniStepCompleted] = useState(false);
  const [matriculaMode, setMatriculaMode] = useState<'nuevo' | 'existente'>('nuevo');
  const [existingStudentData, setExistingStudentData] = useState<Student | null>(null);
  const [isReniecAutofilled, setIsReniecAutofilled] = useState(false);

  React.useEffect(() => {
    if (showAddStudentModal) {
      setDniStepCompleted(false);
      setDniSearchError('');
      setMatriculaMode('nuevo');
      setExistingStudentData(null);
      setIsReniecAutofilled(false);
    }
  }, [showAddStudentModal]);
  const [enrollmentProcessStep, setEnrollmentProcessStep] = useState<'idle' | 'invoice' | 'saving' | 'success'>('idle');
  const [enrollmentInvoiceData, setEnrollmentInvoiceData] = useState<{ studentName: string; concept: string; amount: number; dni: string } | null>(null);
  const [studentDragActive, setStudentDragActive] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ src: string; target: 'newStudent' | 'editStudent' | 'newTeacher' | 'editTeacher' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'student' | 'teacher' | 'resource'; name: string; extraAction?: () => void } | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<{ type: 'created' | 'deleted'; message: string } | null>(null);
  const [newStudentData, setNewStudentData] = useState({
    nombre: '', apellido: '', contacto: 987654321, grado: 1, nivel: 'Primaria', observacion: '', estado: true, foto_url: '', servicioId: '', dni: ''
  });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentData, setEditStudentData] = useState({
    nombre: '', apellido: '', contacto: 987654321, grado: 1, nivel: 'Primaria', observacion: '', estado: true, foto_url: '', servicioId: '', dni: ''
  });

  const [teacherSearch, setTeacherSearch] = useState('');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherDragActive, setTeacherDragActive] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    nombre: '', apellido: '', edad: 35, dni: '', telefono: 954123456, codigo: '', foto_url: '', fecha_vencimiento: 2028, activado: true,
    subject: 'Matemáticas', salary: '1800', activeCourses: '10° Grado A', email: '', rating: 5, rol: 'profesor'
  });
  const [teacherViewMode, setTeacherViewMode] = useState<'grid' | 'table'>('grid');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editTeacherData, setEditTeacherData] = useState({
    nombre: '', apellido: '', edad: 35, dni: '', telefono: 954123456, codigo: '', foto_url: '', fecha_vencimiento: 2028, activado: true,
    subject: 'Matemáticas', salary: '1800', activeCourses: '10° Grado A', email: '', rating: 5, rol: 'profesor'
  });

  // Multi-selection states for student/teacher deletion with long press drag-and-drop trash bin
  const [financeTimeFilter, setFinanceTimeFilter] = useState<'all' | 'month' | 'week' | 'day'>('all');
  const [studentSelectionMode, setStudentSelectionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const [teacherSelectionMode, setTeacherSelectionMode] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const [draggedType, setDraggedType] = useState<'student' | 'teacher' | null>(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{
    type: 'student' | 'teacher';
    ids: string[];
    names: string[];
  } | null>(null);
  
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);

  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [dniSearchError, setDniSearchError] = useState('');

  const handleLookupDni = async (dni: string, isForTeacher: boolean = false, isEdit: boolean = false) => {
    if (!dni || dni.length !== 8) {
      alert("Por favor, ingrese un DNI válido de 8 dígitos.");
      return;
    }
    setIsSearchingDni(true);
    setDniSearchError('');
    setExistingStudentData(null);
    setIsReniecAutofilled(false);

    const cleanDni = dni.trim().replace(/\D/g, '');

    try {
      if (!isForTeacher && !isEdit) {
        // FIRST: Search local state and Supabase database for existing student by DNI
        let existingStudent = students.find(s => s.dni && String(s.dni).trim().replace(/\D/g, '') === cleanDni);

        if (!existingStudent) {
          try {
            const { data: dbEst } = await supabase.from('estudiantes').select('*').eq('dni', cleanDni);
            if (dbEst && dbEst.length > 0) {
              const item = dbEst[0];
              existingStudent = {
                id: item.id,
                nombre: item.nombre || '',
                apellido: item.apellido || '',
                contacto: item.contacto || item.telefono || 987654321,
                grado: item.grado || 1,
                nivel: item.nivel || 'Primaria',
                observacion: item.observacion || '',
                estado: item.estado !== undefined ? item.estado : true,
                dni: cleanDni,
                foto_url: item.foto_url || item.avatar_url || '',
                servicioId: item.servicio_id || item.servicioId || '',
                name: `${item.nombre || ''} ${item.apellido || ''}`.trim(),
                email: '',
                grade: `${item.grado || 1}° Grado`,
                section: 'A',
                parentName: '',
                parentPhone: '',
                balance: 0,
                grades: [],
                attendanceRate: 95,
                avatarUrl: item.foto_url || item.avatar_url || '',
                status: 'active'
              };
            }
          } catch (e) {
            console.warn("Error en la consulta de búsqueda en Supabase por DNI:", e);
          }
        }

        if (existingStudent) {
          // Found existing student in Supabase/local state -> Auto-fill and ask for service
          console.log("✅ Estudiante existente identificado en Supabase:", existingStudent);
          setExistingStudentData(existingStudent);
          setIsReniecAutofilled(true);
          setNewStudentData({
            nombre: existingStudent.nombre || existingStudent.name?.split(' ')[0] || '',
            apellido: existingStudent.apellido || existingStudent.name?.split(' ').slice(1).join(' ') || '',
            contacto: Number(existingStudent.contacto) || 987654321,
            grado: Number(existingStudent.grado) || 1,
            nivel: existingStudent.nivel || 'Primaria',
            observacion: existingStudent.observacion || '',
            estado: true,
            foto_url: existingStudent.foto_url || existingStudent.avatarUrl || '',
            servicioId: '', // Mandatorio escoger el nuevo servicio
            dni: cleanDni
          });
          setDniStepCompleted(true);
          setIsSearchingDni(false);
          return;
        }

        if (matriculaMode === 'existente') {
          setDniSearchError(`No se encontró ningún estudiante registrado previamente con el DNI ${cleanDni} en la base de datos de Supabase.`);
          setIsSearchingDni(false);
          return;
        }
      }

      // SECOND: Call RENIEC API directly client-side
      const data = await lookupReniecDniClient(cleanDni);
      if (data.error) {
        throw new Error(data.error);
      }
      
      const personObj = (data && typeof data === 'object' && data.data && typeof data.data === 'object') ? data.data : data;

      const nombreVal = (personObj.first_name || personObj.nombres || personObj.nombre || '').toString().trim();

      let apellidoVal = '';
      const paterno = personObj.first_last_name || personObj.apellido_paterno || personObj.apellidoPaterno || personObj.paterno || '';
      const materno = personObj.second_last_name || personObj.apellido_materno || personObj.apellidoMaterno || personObj.materno || '';

      if (paterno || materno) {
        apellidoVal = `${paterno} ${materno}`.trim();
      } else if (personObj.apellidos) {
        apellidoVal = personObj.apellidos.toString().trim();
      } else if (personObj.full_name || personObj.nombre_completo) {
        const full = (personObj.full_name || personObj.nombre_completo).toString().trim();
        if (nombreVal && full.includes(nombreVal)) {
          apellidoVal = full.replace(nombreVal, '').trim();
        } else {
          apellidoVal = full;
        }
      }

      setIsReniecAutofilled(true);

      // Update form fields with RENIEC API response
      if (isForTeacher) {
        if (isEdit) {
          setEditTeacherData(prev => ({
            ...prev,
            nombre: nombreVal,
            apellido: apellidoVal,
            dni: cleanDni
          }));
        } else {
          setNewTeacherData(prev => ({
            ...prev,
            nombre: nombreVal,
            apellido: apellidoVal,
            dni: cleanDni
          }));
        }
      } else {
        if (isEdit) {
          setEditStudentData(prev => ({
            ...prev,
            nombre: nombreVal,
            apellido: apellidoVal,
            dni: cleanDni
          }));
        } else {
          setNewStudentData(prev => ({
            ...prev,
            nombre: nombreVal,
            apellido: apellidoVal,
            dni: cleanDni
          }));
          setDniStepCompleted(true);
        }
      }
    } catch (err: any) {
      console.error("DNI lookup error:", err);
      setIsReniecAutofilled(false);
      setDniSearchError('No se encontró el DNI en RENIEC o el servicio no está disponible.');
    } finally {
      setIsSearchingDni(false);
    }
  };

  const handleItemPointerDown = (id: string, type: 'student' | 'teacher') => {
    // If we are already in selection mode, let's not set a timeout, as simple click will toggle selection
    if (type === 'student' && studentSelectionMode) return;
    if (type === 'teacher' && teacherSelectionMode) return;
    
    const timeout = setTimeout(() => {
      // Vibrate if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      if (type === 'student') {
        setStudentSelectionMode(true);
        setSelectedStudentIds([id]);
      } else {
        setTeacherSelectionMode(true);
        setSelectedTeacherIds([id]);
      }
    }, 600); // 600ms long press
    setLongPressTimeout(timeout);
  };

  const handleItemPointerUp = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const handleItemPointerLeave = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      if (next.length === 0) {
        setStudentSelectionMode(false);
      }
      return next;
    });
  };

  const toggleTeacherSelection = (id: string) => {
    setSelectedTeacherIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      if (next.length === 0) {
        setTeacherSelectionMode(false);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, type: 'student' | 'teacher') => {
    setIsDraggingSelected(true);
    setDraggedType(type);
    
    // Set text to avoid breaking drag API requirements on some browsers
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDraggingSelected(false);
    setIsHoveringTrash(false);
  };

  const handleDragOverTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHoveringTrash(true);
  };

  const handleDragLeaveTrash = () => {
    setIsHoveringTrash(false);
  };

  const handleDropOnTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSelected(false);
    setIsHoveringTrash(false);
    
    if (draggedType === 'student' && selectedStudentIds.length > 0) {
      const names = students
        .filter(s => selectedStudentIds.includes(s.id))
        .map(s => s.nombre ? `${s.nombre} ${s.apellido || ''}`.trim() : s.name);
      setBulkDeleteConfirm({
        type: 'student',
        ids: selectedStudentIds,
        names
      });
    } else if (draggedType === 'teacher' && selectedTeacherIds.length > 0) {
      const names = teachers
        .filter(t => selectedTeacherIds.includes(t.id))
        .map(t => t.name);
      setBulkDeleteConfirm({
        type: 'teacher',
        ids: selectedTeacherIds,
        names
      });
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteConfirm) return;
    const { type, ids, names } = bulkDeleteConfirm;
    
    try {
      if (type === 'student') {
        for (const id of ids) {
          await deleteStudent(id);
        }
        setSuccessFeedback({
          type: 'deleted',
          message: `Se han eliminado exitosamente ${ids.length} estudiantes: ${names.join(', ')}.`
        });
        setStudentSelectionMode(false);
        setSelectedStudentIds([]);
      } else {
        for (const id of ids) {
          await deleteTeacher(id);
        }
        setSuccessFeedback({
          type: 'deleted',
          message: `Se han dado de baja exitosamente ${ids.length} docentes: ${names.join(', ')}.`
        });
        setTeacherSelectionMode(false);
        setSelectedTeacherIds([]);
      }
    } catch (err) {
      console.error("Error deleting selected items:", err);
    } finally {
      setBulkDeleteConfirm(null);
    }
  };

  // Resources state (Single click storage system)
  const [currentFolder, setCurrentFolder] = useState<ResourceItem | null>(null);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceType, setNewResourceType] = useState<'file' | 'folder'>('file');
  const [newResourceSize, setNewResourceSize] = useState('1.5 MB');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceFormato, setNewResourceFormato] = useState<'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'LIBRO'>('DOCUMENTO');
  const [newResourceTipo, setNewResourceTipo] = useState('Recurso Académico');

  // Finances actions
  const [showFinanceModal, setShowFinanceModal] = useState<'ingreso' | 'egreso' | null>(null);
  const [financeForm, setFinanceForm] = useState({
    amount: '', concept: '', category: 'Colegiatura' as any, targetId: '', tipo: ''
  });

  // Quick actions widget state
  const [adminWidgets, setAdminWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('edu_admin_widgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return ['add-student', 'add-teacher', 'add-income', 'add-expense', 'upload-resource', 'view-finances'];
  });
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [draggedWidgetIdx, setDraggedWidgetIdx] = useState<number | null>(null);
  const [activeStatsTab, setActiveStatsTab] = useState<'financial' | 'enrollment'>('financial');

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

  // AI Daily summary states and toggles
  const [showAiSummary, setShowAiSummary] = useState(() => {
    return localStorage.getItem('edu_show_ai_summary') !== 'false';
  });
  const [aiSummaryText, setAiSummaryText] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string>('');

  const handleToggleAiSummary = (show: boolean) => {
    setShowAiSummary(show);
    localStorage.setItem('edu_show_ai_summary', String(show));
  };

  const fetchDailySummary = async () => {
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const activeCoursesList = cursos ? cursos.map(c => c.nombre) : [];
      const recentTx = transactions ? transactions.slice(0, 5).map(t => ({
        type: t.type,
        amount: t.amount,
        concept: t.concept,
        category: t.category,
        date: t.date
      })) : [];

      const summaryText = await generateDailySummaryClient({
        studentsCount: students.length,
        teachersCount: teachers.length,
        balance: balance,
        activeCourses: activeCoursesList,
        recentTransactions: recentTx
      });

      setAiSummaryText(summaryText);
    } catch (err: any) {
      console.error(err);
      setSummaryError(err.message || 'No se pudo generar el resumen hoy.');
    } finally {
      setLoadingSummary(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'inicio' && showAiSummary && !aiSummaryText && !loadingSummary) {
      fetchDailySummary();
    }
  }, [activeTab, showAiSummary]);

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;
      
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={i} className="text-xs font-black text-indigo-700 dark:text-cyan-400 mt-3 mb-1 first:mt-0 font-sans uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-3 rounded-full bg-indigo-500 dark:bg-cyan-400" />
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        return (
          <h3 key={i} className="text-sm font-extrabold text-gray-850 dark:text-zinc-200 mt-4 mb-2 first:mt-0 font-sans tracking-tight border-b border-gray-100 dark:border-zinc-800 pb-1">
            {trimmed.replace(/^#+\s+/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={i} className="font-extrabold text-gray-800 dark:text-zinc-200 text-xs mt-2.5">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const cleanContent = trimmed.replace(/^[-*]\s+/, '');
        const boldMatch = cleanContent.match(/^\*\*(.*?)\*\*:(.*)$/);
        if (boldMatch) {
          return (
            <li key={i} className="ml-4 list-disc text-xs text-gray-650 dark:text-zinc-350 leading-relaxed py-0.5">
              <span className="font-extrabold text-gray-800 dark:text-zinc-100">{boldMatch[1]}:</span>
              <span>{boldMatch[2]}</span>
            </li>
          );
        }
        return (
          <li key={i} className="ml-4 list-disc text-xs text-gray-650 dark:text-zinc-350 leading-relaxed py-0.5">
            {cleanContent}
          </li>
        );
      }

      const parts = trimmed.split('**');
      if (parts.length > 1) {
        return (
          <p key={i} className="text-xs text-gray-650 dark:text-zinc-350 leading-relaxed py-0.5">
            {parts.map((part, idx) => {
              if (idx % 2 === 1) {
                return <strong key={idx} className="font-extrabold text-gray-850 dark:text-white">{part}</strong>;
              }
              return part;
            })}
          </p>
        );
      }

      return (
        <p key={i} className="text-xs text-gray-650 dark:text-zinc-350 leading-relaxed py-0.5">
          {trimmed}
        </p>
      );
    });
  };

  // Handler: Add Student (Triggers intermediate invoice modal as requested)
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.servicioId) {
      alert("Es obligatorio seleccionar un Servicio Académico para completar la matrícula.");
      return;
    }
    const studentName = `${newStudentData.nombre} ${newStudentData.apellido}`.trim();
    const matchedService = servicios.find(s => s.id === newStudentData.servicioId);
    const amount = matchedService?.pago !== undefined ? Number(matchedService.pago) : 150.00;
    
    setEnrollmentInvoiceData({
      studentName,
      concept: existingStudentData
        ? `Matrícula a Nuevo Servicio (${matchedService?.nombre || 'Servicio Académico'}) - ${studentName}`
        : `Boleta de Matrícula Regular - ${studentName}`,
      amount,
      dni: newStudentData.dni || 'No registrado'
    });
    setEnrollmentProcessStep('invoice');
    setShowAddStudentModal(false);
  };

  const handleConfirmEnrollment = async () => {
    if (!enrollmentInvoiceData) {
      console.error("❌ [MATRICULA-FRONTEND] Error: No hay datos de pre-facturación disponibles.");
      return;
    }
    console.log("🚀 [MATRICULA-FRONTEND] >>> Iniciando confirmación de matrícula para el estudiante:", enrollmentInvoiceData.studentName);
    setEnrollmentProcessStep('saving');
    
    try {
      const studentName = enrollmentInvoiceData.studentName;
      let targetStudent: Student;

      if (existingStudentData) {
        console.log("📁 [MATRICULA-FRONTEND] Re-matriculando estudiante existente:", existingStudentData.id);
        targetStudent = {
          ...existingStudentData,
          nombre: newStudentData.nombre || existingStudentData.nombre,
          apellido: newStudentData.apellido || existingStudentData.apellido,
          contacto: Number(newStudentData.contacto) || existingStudentData.contacto,
          grado: Number(newStudentData.grado) || existingStudentData.grado,
          nivel: newStudentData.nivel || existingStudentData.nivel,
          observacion: newStudentData.observacion || existingStudentData.observacion,
          estado: true,
          servicioId: newStudentData.servicioId || existingStudentData.servicioId,
          status: 'active'
        };
        await updateStudent(targetStudent);

        // Registrar la transacción de la nueva matrícula en Finanzas (Ingreso/Verde)
        await addTransaction({
          type: 'ingreso',
          amount: enrollmentInvoiceData.amount,
          concept: enrollmentInvoiceData.concept,
          category: 'Colegiatura',
          studentId: targetStudent.id
        });
      } else {
        console.log("📁 [MATRICULA-FRONTEND] Paso 1: Creando ficha del estudiante en el almacén de datos...");
        
        // 1. Guardar en el almacén de estudiantes primero
        targetStudent = await addStudent({
          nombre: newStudentData.nombre,
          apellido: newStudentData.apellido,
          contacto: Number(newStudentData.contacto),
          grado: Number(newStudentData.grado),
          nivel: newStudentData.nivel,
          observacion: newStudentData.observacion,
          estado: newStudentData.estado,
          servicioId: newStudentData.servicioId || undefined,
          dni: newStudentData.dni || '',
          
          name: studentName,
          email: `${newStudentData.nombre.toLowerCase().replace(/\s+/g, '')}.${newStudentData.apellido.toLowerCase().replace(/\s+/g, '')}@sistema.edu`,
          grade: `${newStudentData.grado}° Grado`,
          section: 'A',
          parentName: `Apoderado de ${newStudentData.nombre}`,
          parentPhone: `+51 ${newStudentData.contacto}`,
          balance: 0,
          grades: [
            { subject: 'Matemáticas', score: Math.round(11 + Math.random() * 9) },
            { subject: 'Ciencias', score: Math.round(11 + Math.random() * 9) },
            { subject: 'Historia', score: Math.round(11 + Math.random() * 9) },
          ],
          attendanceRate: 95,
          avatarUrl: newStudentData.foto_url || '',
          status: newStudentData.estado ? 'active' : 'inactive'
        });
      }

      console.log("📁 [MATRICULA-FRONTEND] Ficha de estudiante procesada con éxito. ID Asignado:", targetStudent.id);

      // 2. Generar PDF de la boleta de matrícula
      console.log("📄 [MATRICULA-FRONTEND] Paso 2: Generando representación en PDF de la boleta de cobro...");
      const matchedService = servicios.find(s => s.id === newStudentData.servicioId);
      const linkedCourses = matchedService ? cursos.filter(c => 
        servicioCursos.some(sc => (sc.servicio_id === matchedService.id || sc.servicioId === matchedService.id) && (sc.curso_id === c.id || sc.cursoId === c.id))
      ) : [];

      // Generate PDF base64 (without downloading)
      const pdfResult = generateStudentBoleta(targetStudent, matchedService, linkedCourses, false);
      console.log(`📄 [MATRICULA-FRONTEND] PDF generado con ID temporal: ${pdfResult.id}. Tamaño de cadena Base64: ${pdfResult.base64.length} caracteres.`);

      // 3. Subir PDF a Cloudinary (Client-Side)
      let pdfUrl = '';
      console.log("☁️ [MATRICULA-FRONTEND] Paso 3: Intentando subir la boleta en PDF a Cloudinary...");
      try {
        const uploadResult = await uploadToCloudinaryClient(pdfResult.base64, `${pdfResult.id}.pdf`);
        pdfUrl = uploadResult.url;
        console.log("☁️ [MATRICULA-FRONTEND] Resultado de subida:", uploadResult.message);
      } catch (uploadErr) {
        console.error('❌ [MATRICULA-FRONTEND] Error de conexión al enviar boleta a Cloudinary:', uploadErr);
      }

      // 4. Guardar a la Bóveda de Facturas
      console.log("🔒 [MATRICULA-FRONTEND] Paso 4: Indexando la boleta en la Bóveda de Facturas del Sistema...");
      const savedFactura = await addFactura({
        tipo: 'estudiante',
        student_id: targetStudent.id,
        monto: enrollmentInvoiceData.amount,
        estado: 'emitida',
        concepto: enrollmentInvoiceData.concept,
        pdf_url: pdfUrl || undefined,
        detalles: {
          nombrePersona: studentName,
          dniEstudiante: targetStudent.dni || 'No registrado',
          nombreServicio: matchedService?.nombre || 'Matrícula Regular',
          cursosVinculados: linkedCourses.map(c => c.nombre)
        }
      });

      console.log("🔒 [MATRICULA-FRONTEND] ¡Índice de Bóveda registrado y asegurado!", savedFactura);

      // Success transition
      setEnrollmentProcessStep('success');
      
      // Reset form fields
      setNewStudentData({
        nombre: '', apellido: '', contacto: 987654321, grado: 1, nivel: 'Primaria', observacion: '', estado: true, foto_url: '', servicioId: '', dni: ''
      });
      setExistingStudentData(null);

      addNotification({
        title: '✅ Matrícula Exitosa',
        content: `Se matriculó a ${studentName} y se guardó la factura en la Bóveda.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      addNotification({
        title: '⚠️ Matrícula con Advertencias',
        content: `Se registró al alumno pero ocurrió un error secundario: ${err.message || err}`,
        type: 'warning'
      });
      setEnrollmentProcessStep('success');
    }
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent(student);
    let initialNivel = student.nivel || 'Primaria';
    let initialGrado = student.grado || 1;
    if (initialNivel === 'Secundaria') {
      if (initialGrado < 1 || initialGrado > 5) initialGrado = 1;
    } else {
      if (initialGrado < 1 || initialGrado > 6) initialGrado = 1;
    }
    setEditStudentData({
      nombre: student.nombre || student.name?.split(' ')[0] || '',
      apellido: student.apellido || student.name?.split(' ').slice(1).join(' ') || '',
      contacto: student.contacto || 987654321,
      grado: initialGrado,
      nivel: initialNivel,
      observacion: student.observacion || '',
      estado: student.estado !== undefined ? student.estado : student.status === 'active',
      foto_url: student.foto_url || student.avatarUrl || '',
      servicioId: student.servicioId || '',
      dni: student.dni || ''
    });
  };

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    updateStudent({
      ...editingStudent,
      nombre: editStudentData.nombre,
      apellido: editStudentData.apellido,
      contacto: Number(editStudentData.contacto),
      grado: Number(editStudentData.grado),
      nivel: editStudentData.nivel,
      observacion: editStudentData.observacion,
      estado: editStudentData.estado,
      foto_url: editStudentData.foto_url || '',
      avatarUrl: editStudentData.foto_url || '',
      avatar_url: editStudentData.foto_url || '',
      servicioId: editStudentData.servicioId || undefined,
      dni: editStudentData.dni || '',
      
      // compatibility update
      name: `${editStudentData.nombre} ${editStudentData.apellido}`.trim(),
      status: editStudentData.estado ? 'active' : 'inactive',
      grade: `${editStudentData.grado}° Grado`
    });
    setEditingStudent(null);
  };

  // Handler: Add Teacher
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const teacherName = `Prof. ${newTeacherData.nombre} ${newTeacherData.apellido}`;
    const generatedEmail = `${newTeacherData.nombre.toLowerCase().replace(/\s+/g, '')}.${newTeacherData.apellido.toLowerCase().replace(/\s+/g, '')}@sistema.edu`;
    const generatedCode = `${newTeacherData.telefono}-${newTeacherData.fecha_vencimiento}`;
    addTeacher({
      nombre: newTeacherData.nombre,
      apellido: newTeacherData.apellido,
      edad: Number(newTeacherData.edad),
      dni: newTeacherData.dni,
      telefono: Number(newTeacherData.telefono),
      codigo: generatedCode,
      foto_url: newTeacherData.foto_url || '',
      fecha_vencimiento: Number(newTeacherData.fecha_vencimiento),
      activado: true,
      si_pass: true,
      rol: newTeacherData.rol || 'profesor',

      // compatibility mappings
      name: teacherName,
      email: generatedEmail,
      subject: newTeacherData.subject,
      phone: `+51 ${newTeacherData.telefono}`,
      salary: 1800,
      paymentStatus: 'paid',
      activeCourses: [],
      avatarUrl: newTeacherData.foto_url || '',
      rating: 5
    });
    setNewTeacherData({
      nombre: '', apellido: '', edad: 35, dni: '', telefono: 954123456, codigo: '', foto_url: '', fecha_vencimiento: 2028, activado: true,
      subject: 'Matemáticas', salary: '1800', activeCourses: '10° Grado A', email: '', rating: 5, rol: 'profesor'
    });
    setShowAddTeacherModal(false);
    setSuccessFeedback({
      type: 'created',
      message: `El docente "${teacherName}" ha sido registrado correctamente.`
    });
  };

  const startEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditTeacherData({
      nombre: teacher.nombre || teacher.name?.replace('Prof. ', '')?.replace('Dra. ', '')?.replace('Lic. ', '')?.split(' ')[0] || '',
      apellido: teacher.apellido || teacher.name?.replace('Prof. ', '')?.replace('Dra. ', '')?.replace('Lic. ', '')?.split(' ').slice(1).join(' ') || '',
      edad: teacher.edad || 35,
      dni: teacher.dni || '',
      telefono: teacher.telefono || 954123456,
      codigo: teacher.codigo || '',
      foto_url: teacher.avatarUrl || '',
      fecha_vencimiento: teacher.fecha_vencimiento || 2028,
      activado: true,
      subject: teacher.subject || 'Matemáticas',
      salary: String(teacher.salary || '1800'),
      activeCourses: Array.isArray(teacher.activeCourses) ? teacher.activeCourses.join(', ') : '10° Grado A',
      email: teacher.email || '',
      rating: teacher.rating || 5,
      rol: teacher.rol || 'profesor'
    });
  };

  const handleEditTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const generatedEmail = `${editTeacherData.nombre.toLowerCase().replace(/\s+/g, '')}.${editTeacherData.apellido.toLowerCase().replace(/\s+/g, '')}@sistema.edu`;
    const generatedCode = `${editTeacherData.telefono}-${editTeacherData.fecha_vencimiento}`;
    updateTeacher({
      ...editingTeacher,
      nombre: editTeacherData.nombre,
      apellido: editTeacherData.apellido,
      edad: Number(editTeacherData.edad),
      dni: editTeacherData.dni,
      telefono: Number(editTeacherData.telefono),
      codigo: generatedCode,
      foto_url: editTeacherData.foto_url || editingTeacher.avatarUrl,
      fecha_vencimiento: Number(editTeacherData.fecha_vencimiento),
      activado: true,
      rol: editTeacherData.rol || 'profesor',
      
      // compatibility update
      name: `Prof. ${editTeacherData.nombre} ${editTeacherData.apellido}`,
      email: generatedEmail,
      subject: editTeacherData.subject,
      phone: `+51 ${editTeacherData.telefono}`,
      salary: 1800,
      activeCourses: [],
      avatarUrl: editTeacherData.foto_url || editingTeacher.avatarUrl,
      rating: 5
    });
    setEditingTeacher(null);
  };

  // Handler: Create simulated resource folder/file (Single click manager with structural constraint)
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName) return;

    // Outer root level can ONLY create folders, Inner folder level can ONLY create files/resources
    const forcedType = currentFolder ? 'file' : 'folder';
    const resourceName = newResourceName;
    
    addResource(currentFolder ? currentFolder.id : null, {
      name: resourceName,
      type: forcedType,
      size: forcedType === 'file' ? newResourceFormato : undefined,
      url: forcedType === 'file' ? (newResourceUrl || `https://example.com/resources/${encodeURIComponent(resourceName)}`) : undefined,
    });
    
    // Refresh folder view reference if we added inside a subfolder
    if (currentFolder) {
      const refreshedFolder = resources.find(r => r.id === currentFolder.id);
      if (refreshedFolder) {
        setCurrentFolder(refreshedFolder);
      } else {
        setCurrentFolder(null); // Return to root
      }
    }

    setNewResourceName('');
    setNewResourceUrl('');
    setNewResourceFormato('DOCUMENTO');
    setNewResourceTipo('Recurso Académico');
    setShowAddResourceModal(false);
    setSuccessFeedback({
      type: 'created',
      message: `El recurso "${resourceName}" ha sido creado correctamente.`
    });
  };

  // Handler: Action financially (Insert or withdraw money)
  const handleFinanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(financeForm.amount);
    if (!parsedAmount || parsedAmount <= 0 || !financeForm.concept) return;

    const defaultTipo = showFinanceModal === 'ingreso' ? 'prestacion' : 'paga';
    const finalTipo = financeForm.tipo.trim() || defaultTipo;

    addTransaction({
      type: showFinanceModal!,
      amount: parsedAmount,
      concept: financeForm.concept,
      category: financeForm.category,
      studentId: financeForm.targetId && financeForm.category === 'Colegiatura' ? financeForm.targetId : undefined,
      teacherId: financeForm.targetId && financeForm.category === 'Salario Docente' ? financeForm.targetId : undefined,
      tipo: finalTipo
    });

    setFinanceForm({ amount: '', concept: '', category: 'Colegiatura', targetId: '', tipo: '' });
    setShowFinanceModal(null);
  };


  /* =========================================================================
     MODULE: INICIO (HOME DASHBOARD)
     ========================================================================= */
  const renderInicioValue = () => {
    const totalEstudios = students.length;
    const totalProfes = teachers.length;
    const pendingCollection = students.reduce((acc, curr) => acc + curr.balance, 0);
    
    return (
      <div className="space-y-6">

        {/* Supabase Connection Status and Diagnostics Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm backdrop-blur-md ${
          supabaseStatus === 'connected'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              supabaseStatus === 'connected' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
            }`}>
              <Coins className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2 uppercase tracking-wide">
                <span>{supabaseStatus === 'connected' ? 'Base de Datos: Sincronizada con Supabase' : 'Base de Datos: Ejecución Segura en Modo Local'}</span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse ${
                  supabaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl leading-normal">
                {supabaseStatus === 'connected'
                  ? 'Se han cargado las tablas de manera prioritaria desde Supabase. Las operaciones de lectura y escritura se sincronizarán en tiempo real.'
                  : 'No se pudo establecer conexión estable con las tablas prioritarias de Supabase. La aplicación ha cargado la base de datos local respaldada en el dispositivo para garantizar una operatividad total sin pérdida de información.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {errorLogs && errorLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowErrorLogsModal(true)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                  supabaseStatus === 'connected'
                    ? 'border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                    : 'border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                }`}
              >
                <span>⚠️ Ver Registro de Errores ({errorLogs.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-white/40 hover:bg-white/60 dark:bg-zinc-850/40 dark:hover:bg-zinc-850/60 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-all cursor-pointer"
            >
              Recargar Base de Datos
            </button>
          </div>
        </div>
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm interactive-hover-lift">
            <div className={`p-3.5 rounded-xl ${cl.lightBg}`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">Total Estudiantes</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-zinc-150 mt-0.5">{totalEstudios}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center mt-0.5">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +2 nuevos este mes
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm interactive-hover-lift">
            <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">Planta Docente</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-zinc-150 mt-0.5">{totalProfes}</h3>
              <p className="text-[10px] text-gray-500 font-semibold flex items-center mt-0.5">
                100% Calificados
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm interactive-hover-lift">
            <div className={`p-3.5 rounded-xl ${cl.lightBg}`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">Balance Escolar</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-zinc-150 mt-0.5">
                ${balance.toLocaleString('es-ES')}
              </h3>
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center mt-0.5">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Cuenta principal
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm interactive-hover-lift">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">Debido Mensualidades</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-zinc-150 mt-0.5">
                ${pendingCollection.toLocaleString('es-ES')}
              </h3>
              <p className="text-[10px] text-amber-500 font-semibold flex items-center mt-0.5">
                Cobro pendiente
              </p>
            </div>
          </div>
        </div>

        {/* AI Daily Summary Panel */}
        {showAiSummary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-gradient-to-br from-indigo-50/70 via-indigo-100/30 to-white dark:from-zinc-900/60 dark:via-zinc-900/40 dark:to-zinc-950 p-6 rounded-2xl border border-indigo-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden"
          >
            {/* Ambient subtle spark glow overlay for AI theme */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-indigo-100/50 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/10">
                  <span className="text-sm font-black tracking-wider uppercase font-mono">AI</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-850 dark:text-zinc-200 leading-tight">Estado de Hoy • Asistente Inteligente</h3>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Análisis y sugerencias en tiempo real mediante Groq</p>
                </div>
              </div>

              <div className="flex items-center gap-2 select-none">
                <button
                  type="button"
                  onClick={fetchDailySummary}
                  disabled={loadingSummary}
                  className="px-2.5 py-1.5 text-[10px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 dark:text-cyan-400 rounded-lg transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <svg className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {loadingSummary ? 'Analizando...' : 'Actualizar'}
                </button>
              </div>
            </div>

            {loadingSummary ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-indigo-600 dark:border-t-cyan-400 rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-indigo-700 dark:text-cyan-400 animate-pulse">Sintetizando datos financieros y académicos...</p>
                  <p className="text-[10px] text-gray-400 mt-1">Conectando de manera segura con el servidor de IA de Groq</p>
                </div>
              </div>
            ) : summaryError ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 rounded-xl text-xs flex items-center gap-3">
                <span className="text-base">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold">No se pudo generar el reporte automatizado</p>
                  <p className="text-[10px] opacity-90 mt-0.5">{summaryError}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchDailySummary}
                  className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-400 font-extrabold rounded-lg transition-all"
                >
                  Reintentar
                </button>
              </div>
            ) : aiSummaryText ? (
              <div className="prose dark:prose-invert max-w-none text-left space-y-3 p-4 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-indigo-100/50 dark:border-zinc-800/80 backdrop-blur-sm shadow-inner overflow-hidden max-h-[350px] overflow-y-auto scrollbar-thin">
                {renderMarkdown(aiSummaryText)}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/40 dark:bg-zinc-900/40 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                <p className="text-xs text-gray-500">¿Listo para un resumen de alta precisión con inteligencia artificial?</p>
                <button
                  type="button"
                  onClick={fetchDailySummary}
                  className="mt-2 px-4 py-2 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
                >
                  Sintetizar Estado de Hoy
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Actions Widget Area */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-gray-850 dark:text-zinc-200 flex items-center gap-1.5 font-sans">
                <span>⚡ Acciones Rápidas Personalizables</span>
              </h3>
              <p className="text-[11px] text-gray-400">Ordena tus accesos arrastrándolos y soltándolos, o pulsa "Ajustar Accesos" para quitarlos/ponerlos.</p>
            </div>
            
            <button
              id="admin-widget-config-toggle"
              type="button"
              onClick={() => setShowWidgetConfig(!showWidgetConfig)}
              className="self-start text-xs font-semibold px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-gray-150 dark:border-zinc-700 rounded-lg text-gray-650 dark:text-zinc-300 transition-all select-none"
            >
              {showWidgetConfig ? 'Cerrar Ajustes' : '🔧 Ajustar Accesos'}
            </button>
          </div>

          {/* Configuration Grid */}
          <AnimatePresence>
            {showWidgetConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b border-gray-100 dark:border-zinc-850 pb-4"
              >
                <div className="bg-gray-50/50 dark:bg-zinc-950/30 p-4 rounded-xl border border-gray-150/70 dark:border-zinc-800 space-y-3">
                  <p className="text-xs font-extrabold text-gray-600 dark:text-zinc-400">Selecciona qué accesos rápidos tener disponibles en tu panel principal:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { id: 'add-student', title: 'Matricular Alumno', desc: 'Registra un nuevo estudiante', icon: UserPlus },
                      { id: 'add-teacher', title: 'Contratar Docente', desc: 'Registra un nuevo profesor', icon: Plus },
                      { id: 'add-income', title: 'Registrar Ingreso', desc: 'Registra cobro administrativo', icon: TrendingUp },
                      { id: 'add-expense', title: 'Registrar Egreso', desc: 'Desembolso o pago de materiales', icon: TrendingDown },
                      { id: 'upload-resource', title: 'Añadir Recurso', desc: 'Fichero o carpeta digital', icon: FolderPlus },
                      { id: 'view-finances', title: 'Caja y Transacciones', desc: 'Ver estado general de caja', icon: Coins },
                      { id: 'view-students', title: 'Ver Estudiantes', desc: 'Directorio y boletas escolares', icon: GraduationCap },
                      { id: 'system-config', title: 'Propiedades Visuales', desc: 'Gestor de temática y color', icon: Settings },
                    ].map(widget => {
                      const isChecked = adminWidgets.includes(widget.id);
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
                                next = adminWidgets.filter(id => id !== widget.id);
                              } else {
                                next = [...adminWidgets, widget.id];
                              }
                              setAdminWidgets(next);
                              localStorage.setItem('edu_admin_widgets', JSON.stringify(next));
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

          {/* Active Widgets Drag and Drop Grid */}
          {(() => {
            const ALL_ADMIN_WIDGETS = [
              { id: 'add-student', title: 'Matricular Alumno', desc: 'Registra un nuevo estudiante', icon: UserPlus, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30', action: () => { onChangeTab?.('estudiantes'); setShowAddStudentModal(true); } },
              { id: 'add-teacher', title: 'Contratar Docente', desc: 'Registra un nuevo profesor', icon: Plus, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30', action: () => { onChangeTab?.('docentes'); setShowAddTeacherModal(true); } },
              { id: 'add-income', title: 'Registrar Ingreso', desc: 'Registra cobro administrativo', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30', action: () => { onChangeTab?.('finanzas'); setShowFinanceModal('ingreso'); } },
              { id: 'add-expense', title: 'Registrar Egreso', desc: 'Desembolso o pago de materiales', icon: TrendingDown, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30', action: () => { onChangeTab?.('finanzas'); setShowFinanceModal('egreso'); } },
              { id: 'upload-resource', title: 'Añadir Recurso', desc: 'Fichero o carpeta digital', icon: FolderPlus, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30', action: () => { onChangeTab?.('recursos'); setShowAddResourceModal(true); } },
              { id: 'view-finances', title: 'Caja y Transacciones', desc: 'Ver estado general de caja', icon: Coins, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30', action: () => onChangeTab?.('finanzas') },
              { id: 'view-students', title: 'Ver Estudiantes', desc: 'Directorio y boletas escolares', icon: GraduationCap, color: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-950/30', action: () => onChangeTab?.('estudiantes') },
              { id: 'system-config', title: 'Propiedades Visuales', desc: 'Gestor de temática y color', icon: Settings, color: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-950/30', action: () => onChangeTab?.('configuracion') },
            ];

            const activeWidgetData = adminWidgets
              .map(id => ALL_ADMIN_WIDGETS.find(w => w.id === id))
              .filter((w): w is typeof ALL_ADMIN_WIDGETS[0] => !!w);

            const handleDragStartLocal = (idx: number) => {
              setDraggedWidgetIdx(idx);
            };

            const handleDragOverLocal = (e: React.DragEvent) => {
              e.preventDefault();
            };

            const handleDropLocal = (targetIdx: number) => {
              if (draggedWidgetIdx === null || draggedWidgetIdx === targetIdx) return;
              const reordered = [...adminWidgets];
              const [draggedItem] = reordered.splice(draggedWidgetIdx, 1);
              reordered.splice(targetIdx, 0, draggedItem);
              setAdminWidgets(reordered);
              localStorage.setItem('edu_admin_widgets', JSON.stringify(reordered));
              setDraggedWidgetIdx(null);
            };

            if (activeWidgetData.length === 0) {
              return (
                <div className="text-center py-6 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-400">
                  No tienes accesos rápidos configurados en este momento. Pulsa en "Ajustar Accesos" de arriba.
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
                      className="group bg-white dark:bg-zinc-900 border border-gray-150/70 dark:border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-2 border-l-3 border-l-indigo-500 dark:border-l-indigo-400 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-gray-350 dark:hover:border-zinc-700"
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
                          <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {widget.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{widget.desc}</p>
                        </div>
                      </button>

                      {/* Drag Handle block */}
                      <div className="flex items-center text-gray-300 dark:text-zinc-700 group-hover:text-gray-450 dark:group-hover:text-zinc-500 transition-colors px-1 cursor-grab">
                        <GripVertical className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Financial Flow Performance Tracker Graphics using Recharts */}
        {(() => {
          const liveIncomes = transactions.filter(t => t.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
          const liveExpenses = transactions.filter(t => t.type === 'egreso').reduce((a, b) => a + b.amount, 0);

          const getThemeColorHex = (accent: AccentColor) => {
            switch (accent) {
              case 'emerald': return '#10b981';
              case 'purple': return '#a855f7';
              case 'rose': return '#f43f5e';
              case 'amber': return '#f59e0b';
              case 'blue': return '#3b82f6';
              case 'indigo': return '#6366f1';
              default: return '#4f46e5';
            }
          };
          const activeColorHex = getThemeColorHex(theme.accentColor);

          // Dynamically compute monthly incomes/expenses from real transactions
          const monthlyBase: Record<number, { name: string; Ingresos: number; Egresos: number }> = {
            1: { name: 'Ene', Ingresos: 0, Egresos: 0 },
            2: { name: 'Feb', Ingresos: 0, Egresos: 0 },
            3: { name: 'Mar', Ingresos: 0, Egresos: 0 },
            4: { name: 'Abr', Ingresos: 0, Egresos: 0 },
            5: { name: 'May', Ingresos: 0, Egresos: 0 },
            6: { name: 'Jun', Ingresos: 0, Egresos: 0 },
            7: { name: 'Jul', Ingresos: 0, Egresos: 0 },
            8: { name: 'Ago', Ingresos: 0, Egresos: 0 },
            9: { name: 'Sep', Ingresos: 0, Egresos: 0 },
            10: { name: 'Oct', Ingresos: 0, Egresos: 0 },
            11: { name: 'Nov', Ingresos: 0, Egresos: 0 },
            12: { name: 'Dic', Ingresos: 0, Egresos: 0 },
          };

          // Aggregate from actual transactions
          transactions.forEach(t => {
            const dateStr = t.date || '';
            const parts = dateStr.split('-');
            if (parts.length >= 2) {
              const monthVal = parseInt(parts[1], 10);
              if (monthlyBase[monthVal]) {
                if (t.type === 'ingreso') {
                  monthlyBase[monthVal].Ingresos += t.amount;
                } else if (t.type === 'egreso') {
                  monthlyBase[monthVal].Egresos += t.amount;
                }
              }
            } else {
              // Try parsing with standard Date
              const d = new Date(dateStr);
              if (!isNaN(d.getTime())) {
                const monthVal = d.getMonth() + 1;
                if (monthlyBase[monthVal]) {
                  if (t.type === 'ingreso') {
                    monthlyBase[monthVal].Ingresos += t.amount;
                  } else if (t.type === 'egreso') {
                    monthlyBase[monthVal].Egresos += t.amount;
                  }
                  return;
                }
              }
              // Fallback to current month if date format is completely unexpected
              const currentMonth = new Date().getMonth() + 1;
              if (monthlyBase[currentMonth]) {
                if (t.type === 'ingreso') {
                  monthlyBase[currentMonth].Ingresos += t.amount;
                } else if (t.type === 'egreso') {
                  monthlyBase[currentMonth].Egresos += t.amount;
                }
              }
            }
          });

          const financialData = Object.values(monthlyBase).filter((m, idx) => {
            if (idx < 6) return true; // Always show Ene - Jun
            return m.Ingresos > 0 || m.Egresos > 0; // Show future months only if they have transactions
          });

          // Calculate real enrollments dynamically based on actual registration dates
          const enrollmentBase: Record<number, number> = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
          };

          students.forEach(s => {
            const dateStr = s.created_at || '';
            let monthVal = 1; // Default to Jan if unknown
            if (dateStr) {
              const d = new Date(dateStr);
              if (!isNaN(d.getTime())) {
                monthVal = d.getMonth() + 1;
              } else {
                const parts = dateStr.split('-');
                if (parts.length >= 2) {
                  monthVal = parseInt(parts[1], 10) || 1;
                }
              }
            }
            if (monthVal >= 1 && monthVal <= 12) {
              enrollmentBase[monthVal] += 1;
            }
          });

          const cumulativeEnrollment: Record<number, number> = {};
          let runningTotal = 0;
          for (let m = 1; m <= 12; m++) {
            runningTotal += enrollmentBase[m];
            cumulativeEnrollment[m] = runningTotal;
          }

          const enrollmentData = [
            { name: 'Ene', Estudiantes: cumulativeEnrollment[1] },
            { name: 'Feb', Estudiantes: cumulativeEnrollment[2] },
            { name: 'Mar', Estudiantes: cumulativeEnrollment[3] },
            { name: 'Abr', Estudiantes: cumulativeEnrollment[4] },
            { name: 'May', Estudiantes: cumulativeEnrollment[5] },
            { name: 'Jun', Estudiantes: cumulativeEnrollment[6] },
            { name: 'Jul', Estudiantes: cumulativeEnrollment[7] },
            { name: 'Ago', Estudiantes: cumulativeEnrollment[8] },
            { name: 'Sep', Estudiantes: cumulativeEnrollment[9] },
            { name: 'Oct', Estudiantes: cumulativeEnrollment[10] },
            { name: 'Nov', Estudiantes: cumulativeEnrollment[11] },
            { name: 'Dic', Estudiantes: cumulativeEnrollment[12] },
          ].filter((e, idx) => {
            if (idx < 6) return true; // Always show Ene - Jun
            return cumulativeEnrollment[idx + 1] > cumulativeEnrollment[6]; // Show future months only if they have new student registrations
          });

          const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-150 dark:border-zinc-800 p-3 rounded-xl shadow-xl text-left select-none text-xs">
                  <p className="font-extrabold text-gray-800 dark:text-zinc-200 mb-1.5">{label}</p>
                  <div className="space-y-1 font-semibold">
                    {payload.map((pld: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: pld.color || pld.fill }} 
                        />
                        <span className="text-gray-500 dark:text-zinc-450">{pld.name}:</span>
                        <span className="text-gray-800 dark:text-zinc-100 font-mono">
                          ${(pld.value || 0).toLocaleString('es-ES')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          };

          const EnrollmentTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-150 dark:border-zinc-800 p-3 rounded-xl shadow-xl text-left select-none text-xs">
                  <p className="font-extrabold text-gray-800 dark:text-zinc-200 mb-1.5">{label}</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: payload[0].color }} 
                    />
                    <span className="text-gray-500 dark:text-zinc-450">Matrícula:</span>
                    <span className="text-gray-800 dark:text-zinc-100 font-mono font-extrabold">
                      {payload[0].value} Alumnos
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 lg:col-span-2 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-850 dark:text-zinc-200">Estadísticas del Colegio</h3>
                    <p className="text-xs text-gray-400">Rendimiento financiero e histórico de ingreso estudiantil</p>
                  </div>

                  {/* Dynamic linkage between stats and finances/caja */}
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-950 p-2 rounded-xl border border-gray-150/50 dark:border-zinc-850/70">
                    <div className="text-left">
                      <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 block uppercase tracking-wider leading-none">Saldo de Caja</span>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-cyan-400 font-mono mt-0.5 block">${balance.toLocaleString('es-ES')} USD</span>
                    </div>
                    {onChangeTab && (
                      <>
                        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800" />
                        <button
                          type="button"
                          onClick={() => onChangeTab('finanzas')}
                          className="text-[10px] font-extrabold text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 select-none cursor-pointer"
                        >
                          Ver Movimientos <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Tab Selector Button Area */}
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-950 p-1 rounded-xl border border-gray-150/70 dark:border-zinc-850 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveStatsTab('financial')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeStatsTab === 'financial'
                          ? `${cl.primaryBg} text-white shadow-sm`
                          : 'text-gray-500 dark:text-zinc-450 hover:text-gray-850 dark:hover:text-zinc-250'
                      }`}
                    >
                      Flujo de Caja
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStatsTab('enrollment')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeStatsTab === 'enrollment'
                          ? `${cl.primaryBg} text-white shadow-sm`
                          : 'text-gray-500 dark:text-zinc-450 hover:text-gray-850 dark:hover:text-zinc-250'
                      }`}
                    >
                      Tendencias de Matrícula
                    </button>
                  </div>
                </div>

                {/* Animated Chart Display */}
                <div className="h-64 w-full select-none">
                  <AnimatePresence mode="wait">
                    {activeStatsTab === 'financial' ? (
                      <motion.div
                        key="financial-chart"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.mode === 'dark' ? '#27272a' : '#f4f4f5'} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: theme.mode === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 10, fontWeight: 600 }} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: theme.mode === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 10, fontWeight: 600 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                            <Legend 
                              verticalAlign="top" 
                              height={36} 
                              iconType="circle" 
                              iconSize={8}
                              wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingBottom: 15 }}
                            />
                            <Bar 
                              dataKey="Ingresos" 
                              fill={activeColorHex} 
                              radius={[4, 4, 0, 0]} 
                              name="Ingresos"
                            />
                            <Bar 
                              dataKey="Egresos" 
                              fill="#f43f5e" 
                              radius={[4, 4, 0, 0]} 
                              name="Egresos"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="enrollment-chart"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={activeColorHex} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={activeColorHex} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.mode === 'dark' ? '#27272a' : '#f4f4f5'} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: theme.mode === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 10, fontWeight: 600 }} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: theme.mode === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 10, fontWeight: 600 }}
                            />
                            <Tooltip content={<EnrollmentTooltip />} />
                            <Legend 
                              verticalAlign="top" 
                              height={36} 
                              iconType="circle" 
                              iconSize={8}
                              wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingBottom: 15 }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="Estudiantes" 
                              stroke={activeColorHex} 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill="url(#colorStudents)" 
                              name="Alumnos Registrados"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

          {/* Quick Recent News Feed widget */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-850 dark:text-zinc-200 mb-4">Anuncios Recientes</h3>
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {news.map(item => (
                  <div key={item.id} className="border-b border-gray-150/70 dark:border-zinc-850 pb-3 last:border-b-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 rounded uppercase">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-gray-400">{item.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-300 line-clamp-1 leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-normal">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-850 text-center mt-3">
              <button 
                id="news-admin-trigger"
                type="button" 
                className={`text-xs font-semibold ${cl.primaryText} hover:underline flex items-center gap-1.5 mx-auto`}
              >
                Escribir comunicado <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      );
    })()}

        {/* EnlaceC AI system auditor and pending tasks checks */}
        <AISystemReview />

      </div>
    );
  };


  /* =========================================================================
     MODULE: ESTUDIANTES (STUDENT CONTROL + REPORT CARD)
     ========================================================================= */
  const renderEstudiantesValue = () => {
    // Filtered students
    const filtered = students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.grade.toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        
        {/* Actions header bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-810 shadow-sm">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="search-students"
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Buscar por nombre, curso..."
              className={`w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-export-students-csv"
              type="button"
              onClick={() => {
                const csvHeaders = [
                  { label: 'ID', key: (s: Student) => s.id },
                  { label: 'Nombre Completo', key: (s: Student) => s.name || `${s.nombre || ''} ${s.apellido || ''}`.trim() },
                  { label: 'Correo Electrónico', key: (s: Student) => s.email || '' },
                  { label: 'Grado', key: (s: Student) => s.grade || `${s.grado || ''}° Grado ${s.nivel || ''}`.trim() },
                  { label: 'Sección', key: (s: Student) => s.section || '' },
                  { label: 'Nombre Apoderado', key: (s: Student) => s.parentName || '' },
                  { label: 'Teléfono Apoderado', key: (s: Student) => s.parentPhone || String(s.contacto || '') },
                  { label: 'Balance Pendiente', key: (s: Student) => `$${s.balance || 0} USD` }
                ];
                exportToCSV(filtered, csvHeaders, 'estudiantes_colegio_tesla.csv');
              }}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 border border-gray-200 dark:border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Exportar CSV
            </button>

            <button
              id="btn-export-students-pdf"
              type="button"
              onClick={() => exportStudentsToPDF(filtered, 'Colegio Tesla')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 border border-gray-200 dark:border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Exportar PDF
            </button>

            <button
              id="btn-add-student-trigger"
              type="button"
              onClick={() => setShowAddStudentModal(true)}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-bold text-white rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer`}
            >
              <UserPlus className="w-4 h-4" />
              Matricular Estudiante
            </button>
          </div>
        </div>

        {studentSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/60 p-3 rounded-xl flex items-center justify-between gap-3 text-xs mb-3"
          >
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>Modo Selección: <strong>{selectedStudentIds.length}</strong> {selectedStudentIds.length === 1 ? 'estudiante seleccionado' : 'estudiantes seleccionados'}.</span>
              <span className="text-[10px] opacity-80 text-gray-505 dark:text-zinc-400">Mantén presionado un elemento seleccionado y arrástralo al tacho de basura que aparecerá abajo para eliminarlos.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStudentSelectionMode(false);
                setSelectedStudentIds([]);
              }}
              className="px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg font-bold text-gray-700 dark:text-zinc-300 transition-all text-[11px]"
            >
              Cancelar Selección
            </button>
          </motion.div>
        )}

        {/* Tabular Directory with custom items */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-zinc-950/60 border-b border-gray-100 dark:border-zinc-850">
                  {studentSelectionMode && (
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap text-center w-12">Sel.</th>
                  )}
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Nº</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Estudiante</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Contacto</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Grado / Nivel</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Observación</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Estatus</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Fecha Registro</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap text-right">Reporte & Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-855">
                {filtered.map((student, index) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr 
                      key={student.id} 
                      draggable={studentSelectionMode && isSelected}
                      onDragStart={(e) => handleDragStart(e, 'student')}
                      onDragEnd={handleDragEnd}
                      onPointerDown={() => handleItemPointerDown(student.id, 'student')}
                      onPointerUp={handleItemPointerUp}
                      onPointerCancel={handleItemPointerUp}
                      onPointerLeave={handleItemPointerLeave}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('button') || target.closest('a') || target.closest('input[type="checkbox"]')) return;
                        
                        if (studentSelectionMode) {
                          toggleStudentSelection(student.id);
                        }
                      }}
                      className={`transition-colors cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/25 border-l-2 border-l-indigo-600' 
                          : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      {studentSelectionMode && (
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="p-4 font-mono font-bold text-xs text-gray-500 select-all" title={student.id}>
                        {index + 1}
                      </td>
                      <td className="p-4 flex items-center gap-3">
                        <UserAvatar
                          src={student.avatarUrl}
                          name={student.nombre ? `${student.nombre} ${student.apellido || ''}` : student.name}
                          className="w-10 h-10 rounded-xl ring-1 ring-gray-100"
                        />
                        <div>
                          <p className="font-bold text-gray-800 dark:text-zinc-200">
                            {student.nombre ? `${student.nombre} ${student.apellido || ''}` : student.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{student.email || `estudiante${index + 1}@sistema.edu`}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-650 dark:text-zinc-300">
                        <p className="text-[10px] text-gray-400 font-mono flex items-center mt-0.5">
                          <Phone className="w-3 h-3 mr-1 inline" /> {student.contacto || student.parentPhone || 'No registrado'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-700 dark:text-zinc-300">{student.grado || student.grade || '10'}° Grado</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{student.nivel || 'Secundaria'}</p>
                        {(() => {
                          const studentService = servicios.find(serv => serv.id === student.servicioId);
                          return studentService ? (
                            <p className="text-[10px] font-bold text-indigo-650 dark:text-indigo-450 mt-1 inline-flex items-center gap-1 bg-indigo-50/70 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded border border-indigo-100/50 dark:border-zinc-700/50">
                              {studentService.nombre}
                            </p>
                          ) : (
                            <p className="text-[9px] text-gray-400 italic mt-1">Sin servicio asignado</p>
                          );
                        })()}
                      </td>
                      <td className="p-4 max-w-[150px] truncate" title={student.observacion}>
                        <span className="text-gray-500 dark:text-zinc-400 font-medium">
                          {student.observacion || 'Sin observaciones'}
                        </span>
                      </td>
                      <td className="p-4">
                        {(student.estado !== undefined ? student.estado : (student.status === 'active')) ? (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 dark:text-zinc-500 font-mono text-[10px]">
                        {student.created_at ? new Date(student.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No registrado'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            id={`btn-report-${student.id}`}
                            type="button"
                            onClick={() => { setSelectedStudent(student); setStudentModalTab('notas'); }}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${cl.lightBg} border-transparent hover:brightness-105`}
                          >
                            Ver
                          </button>
                          <button
                            id={`btn-edit-student-trigger-${student.id}`}
                            type="button"
                            onClick={() => startEditStudent(student)}
                            className={`p-1.5 text-gray-400 ${cl.hoverText} hover:bg-gray-105 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center`}
                            title="Editar Estudiante"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-del-student-${student.id}`}
                            type="button"
                            onClick={() => setConfirmDelete({ id: student.id, type: 'student', name: student.nombre ? `${student.nombre} ${student.apellido || ''}`.trim() : student.name })}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-105 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center"
                            title="Eliminar Estudiante"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      Ningún estudiante coincide con el criterio de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* POPUP MODAL: ESTUDIANTE FOLDER REPORT (BOLETÍN ACADÉMICO COHERENTE CON REQUISITO) */}
        <AnimatePresence>
          {selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStudent(null)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl w-full max-w-xl p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4 pb-5 border-b border-gray-100 dark:border-zinc-850">
                  <UserAvatar
                    src={selectedStudent.avatarUrl}
                    name={selectedStudent.name}
                    className="w-16 h-16 rounded-2xl ring-2 ring-gray-100 dark:ring-zinc-800"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      ID: {students.findIndex(s => s.id === selectedStudent.id) !== -1 ? students.findIndex(s => s.id === selectedStudent.id) + 1 : selectedStudent.id}
                    </span>
                    <h3 className="text-base font-bold text-gray-800 dark:text-zinc-150 mt-1">{selectedStudent.name}</h3>
                    <p className="text-xs text-gray-450">{selectedStudent.grade} • Sección {selectedStudent.section}</p>
                  </div>
                </div>

                {/* Sub-tab navigation bar */}
                <div className="flex border-b border-gray-100 dark:border-zinc-850/65 mt-4 text-xs font-bold gap-4 select-none">
                  <button
                    type="button"
                    onClick={() => setStudentModalTab('notas')}
                    className={`pb-2.5 px-1 relative transition-colors ${
                      studentModalTab === 'notas' 
                        ? 'text-indigo-650 dark:text-indigo-400 font-extrabold' 
                        : 'text-gray-400 hover:text-gray-600 dark:text-zinc-500'
                    }`}
                  >
                    <span>Boletín de Notas</span>
                    {studentModalTab === 'notas' && (
                      <motion.div layoutId="student_tab_indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentModalTab('asistencias')}
                    className={`pb-2.5 px-1 relative transition-colors ${
                      studentModalTab === 'asistencias' 
                        ? 'text-indigo-650 dark:text-indigo-400 font-extrabold' 
                        : 'text-gray-400 hover:text-gray-600 dark:text-zinc-500'
                    }`}
                  >
                    <span>Calendario de Asistencias</span>
                    {studentModalTab === 'asistencias' && (
                      <motion.div layoutId="student_tab_indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentModalTab('boleta')}
                    className={`pb-2.5 px-1 relative transition-colors ${
                      studentModalTab === 'boleta' 
                        ? 'text-indigo-650 dark:text-indigo-400 font-extrabold' 
                        : 'text-gray-400 hover:text-gray-600 dark:text-zinc-500'
                    }`}
                  >
                    <span>Boleta de Matrícula y Pago</span>
                    {studentModalTab === 'boleta' && (
                      <motion.div layoutId="student_tab_indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                    )}
                  </button>
                </div>

                {/* Tab content swapping */}
                {studentModalTab === 'notas' && (
                  <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-450">Boletín Oficial de Notas</h4>

                    {/* Real-time Grades list from Supabase 'notas' table */}
                    {(() => {
                      const studentService = servicios.find(s => s.id === selectedStudent.servicioId);
                      const linkedCourseIds = servicioCursos
                        .filter(sc => sc.servicio_id === selectedStudent.servicioId || sc.servicioId === selectedStudent.servicioId)
                        .map(sc => sc.curso_id || sc.cursoId);
                      
                      // Fallback: if student has no service or the service has no courses, use all available courses
                      const displayedCourses = linkedCourseIds.length > 0 
                        ? cursos.filter(c => linkedCourseIds.includes(c.id))
                        : cursos;

                      const isFallback = linkedCourseIds.length === 0;

                      return (
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              {isFallback 
                                ? 'Cursos Generales de la Institución' 
                                : `Cursos del Servicio: ${studentService?.nombre || 'Servicio'}`
                              }
                            </span>
                            {!isFallback && (
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                {displayedCourses.length} vinculados
                              </span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {displayedCourses.map(course => {
                              // Filter grades for this student and this course
                              const courseGrades = notas.filter(
                                n => n.id_estudiante === selectedStudent.id && n.id_curso === course.id
                              );

                              // Calculate course average
                              const numericalGrades = courseGrades.filter(n => n.nota_numerica !== null && n.nota_numerica !== undefined) as { nota_numerica: number }[];
                              const avgScore = numericalGrades.length > 0 
                                ? (numericalGrades.reduce((acc, curr) => acc + curr.nota_numerica, 0) / numericalGrades.length)
                                : null;

                              return (
                                <div key={course.id} className="bg-gray-50/50 dark:bg-zinc-950/40 border border-gray-150 dark:border-zinc-850/65 rounded-xl p-3 shadow-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">{course.nombre}</h4>
                                      <p className="text-[9px] text-gray-400 dark:text-zinc-500 truncate">{course.descripcion || 'Sin descripción'}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {avgScore !== null && (
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${avgScore >= 15 ? 'bg-emerald-50 dark:bg-emerald-955/40 text-emerald-600' : avgScore >= 12 ? 'bg-blue-50 dark:bg-blue-955/40 text-blue-650' : 'bg-red-50 dark:bg-red-955/40 text-red-600'}`}>
                                          Prom: {avgScore.toFixed(1)}/20
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (addingGradeForCourseId === course.id) {
                                            setAddingGradeForCourseId(null);
                                          } else {
                                            setAddingGradeForCourseId(course.id);
                                            // Set defaults
                                            if (teachers.length > 0) {
                                              setGradeProfId(teachers[0].id);
                                            } else {
                                              setGradeProfId('default-prof');
                                            }
                                            setGradeNum('15');
                                            setGradeQual('EXCELENTE');
                                          }
                                        }}
                                        className="text-[9px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-lg font-bold transition-all"
                                      >
                                        {addingGradeForCourseId === course.id ? 'Cerrar' : '＋ Nota'}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Add Grade Form */}
                                  {addingGradeForCourseId === course.id && (
                                    <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-150 dark:border-zinc-850 animate-in slide-in-from-top-2 duration-200">
                                      <h5 className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">Registrar Calificación</h5>
                                      
                                      <div className="space-y-2.5">
                                        <div>
                                          <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Docente Evaluador</label>
                                          <select
                                            value={gradeProfId}
                                            onChange={(e) => setGradeProfId(e.target.value)}
                                            className="w-full p-1.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg outline-none"
                                          >
                                            <option value="">-- Seleccionar Docente --</option>
                                            <option value="system-prof">Docente del Sistema</option>
                                            {teachers.map(t => (
                                              <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
                                            ))}
                                          </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Nota Numérica (1-20)</label>
                                            <input
                                              type="number"
                                              min="1"
                                              max="20"
                                              value={gradeNum}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setGradeNum(val);
                                                const num = Number(val);
                                                if (num >= 18) setGradeQual('EXCELENTE');
                                                else if (num >= 14) setGradeQual('BIEN');
                                                else if (num >= 11) setGradeQual('MAS O MENOS');
                                                else if (num >= 6) setGradeQual('MAL');
                                                else if (num >= 1) setGradeQual('BAJO');
                                              }}
                                              className="w-full p-1.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Nota Cualitativa / Cualitativa</label>
                                            <input
                                              type="text"
                                              placeholder="Comentario o BAJO, MAL, BIEN, EXCELENTE"
                                              value={gradeQual}
                                              onChange={(e) => setGradeQual(e.target.value)}
                                              className="w-full p-1.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg outline-none"
                                            />
                                          </div>
                                        </div>

                                        {/* Quick Suggestion Chips */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {[
                                            { name: 'EXCELENTE', val: 18 },
                                            { name: 'BIEN', val: 15 },
                                            { name: 'MAS O MENOS', val: 12 },
                                            { name: 'MAL', val: 8 },
                                            { name: 'BAJO', val: 5 }
                                          ].map(lvl => (
                                            <button
                                              key={lvl.name}
                                              type="button"
                                              onClick={() => {
                                                setGradeQual(lvl.name);
                                                setGradeNum(String(lvl.val));
                                              }}
                                              className="text-[8px] bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 hover:border-indigo-400 px-1 py-0.5 rounded transition-all text-gray-600 dark:text-zinc-400"
                                            >
                                              {lvl.name} ({lvl.val})
                                            </button>
                                          ))}
                                        </div>

                                        <div className="flex justify-end gap-1.5 pt-1">
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              if (!gradeProfId) {
                                                alert("Por favor seleccione un docente.");
                                                return;
                                              }
                                              await addNota({
                                                id_estudiante: selectedStudent.id,
                                                id_profesor: gradeProfId,
                                                id_curso: course.id,
                                                nota_numerica: gradeNum ? Number(gradeNum) : null,
                                                nota_cuantitativa: gradeQual
                                              });
                                              setAddingGradeForCourseId(null);
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-[9px] font-bold"
                                          >
                                            Guardar Nota
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* List of grades for this course */}
                                  <div className="mt-2 space-y-1">
                                    {courseGrades.length === 0 ? (
                                      <p className="text-[9px] text-gray-400 dark:text-zinc-500 italic">No hay calificaciones registradas aún.</p>
                                    ) : (
                                      <div className="divide-y divide-gray-100 dark:divide-zinc-850 max-h-32 overflow-y-auto pr-1">
                                        {courseGrades.map(g => {
                                          const prof = teachers.find(t => t.id === g.id_profesor);
                                          const score = g.nota_numerica;
                                          return (
                                            <div key={g.id} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                                              <div className="min-w-0 pr-2">
                                                <div className="flex items-center gap-1.5">
                                                  <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${score && score >= 15 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : score && score >= 12 ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-650' : 'bg-red-50 dark:bg-red-950/20 text-red-650'}`}>
                                                    {score !== null ? `${score}/20` : '--/20'}
                                                  </span>
                                                  <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 truncate">
                                                    {g.nota_cuantitativa}
                                                  </span>
                                                </div>
                                                <p className="text-[8px] text-gray-400 dark:text-zinc-500">
                                                  Por: {prof ? `${prof.nombre} ${prof.apellido}` : 'Docente'} 
                                                  {g.created_at && ` • ${formatServiceDate(g.created_at)}`}
                                                </p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  if (confirm("¿Está seguro de eliminar esta calificación?")) {
                                                    await deleteNota(g.id);
                                                  }
                                                }}
                                                className="text-red-500 hover:text-red-600 text-[9px] font-bold"
                                              >
                                                Eliminar
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Summary performance stats block */}
                    {(() => {
                      const realStudentGrades = notas.filter(n => n.id_estudiante === selectedStudent.id);
                      const realGradesWithScore = realStudentGrades.filter(n => n.nota_numerica !== null && n.nota_numerica !== undefined) as { nota_numerica: number }[];
                      
                      const averageScore = realGradesWithScore.length > 0
                        ? realGradesWithScore.reduce((acc, curr) => acc + curr.nota_numerica, 0) / realGradesWithScore.length
                        : (selectedStudent.grades && selectedStudent.grades.length > 0 
                            ? selectedStudent.grades.reduce((a, b) => a + b.score, 0) / selectedStudent.grades.length 
                            : 15);

                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Card: Promedio general */}
                            <div id="card-report-promedio" className="relative overflow-hidden bg-gradient-to-br from-indigo-50/60 via-indigo-50/20 to-transparent dark:from-indigo-950/25 dark:via-indigo-950/10 dark:to-transparent p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/5">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                  <GraduationCap className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Promedio General</span>
                              </div>
                              <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="text-2xl font-extrabold text-indigo-750 dark:text-indigo-300 tracking-tight">
                                  {averageScore.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-zinc-500 font-bold">/ 20</span>
                              </div>
                              <div className="mt-1.5 text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400/80">
                                {averageScore >= 15 ? 'Excelente Rendimiento' : 'Rendimiento Regular'}
                              </div>
                            </div>

                            {/* Card: Tasa Asistencia */}
                            <div id="card-report-asistencia" className="relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-emerald-50/20 to-transparent dark:from-emerald-950/25 dark:via-emerald-950/10 dark:to-transparent p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/5">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Tasa Asistencia</span>
                              </div>
                              <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">
                                  {selectedStudent.attendanceRate}%
                                </span>
                              </div>
                              <div className="mt-1.5 text-[10px] font-bold text-emerald-650/80 dark:text-emerald-400/80">
                                {selectedStudent.attendanceRate >= 90 ? 'Asistencia Sobresaliente' : 'Requiere Seguimiento'}
                              </div>
                            </div>
                          </div>

                          <div className="p-3.5 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/40 rounded-xl">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Observación Pedagógica</span>
                            <p className="text-xs text-slate-550 dark:text-zinc-400 mt-1 leading-normal italic">
                              "El estudiante demuestra un {averageScore >= 15 ? 'sobresaliente interés y proactividad' : 'progreso básico, requiriendo reforzar conceptos extracurriculares'} en las horas de clase. Cumple con el reglamento y asiste de manera oportuna."
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {studentModalTab === 'asistencias' && (
                  <div className="mt-5 animate-in fade-in duration-200">
                    <AttendanceCalendar 
                      studentId={selectedStudent.id}
                      studentName={selectedStudent.name}
                      attendance={attendance}
                    />
                  </div>
                )}

                {studentModalTab === 'boleta' && (() => {
                  const studentService = servicios.find(s => s.id === selectedStudent.servicioId);
                  const linkedCourseIds = servicioCursos
                    .filter(link => (link.servicioId === selectedStudent.servicioId || link.servicio_id === selectedStudent.servicioId))
                    .map(link => (link.cursoId || link.curso_id));
                  const linkedCourses = cursos.filter(c => linkedCourseIds.includes(c.id));
                  const servicePrice = studentService?.pago !== undefined && studentService?.pago !== null ? Number(studentService.pago) : 150.00;

                  return (
                    <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                      <div className="bg-gray-50 dark:bg-zinc-950/40 border border-gray-150 dark:border-zinc-850 p-4.5 rounded-2xl shadow-sm space-y-4">
                        {/* Header styling like a paper invoice */}
                        <div className="flex justify-between items-start border-b border-gray-150 dark:border-zinc-850 pb-3">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">BOLETA OFICIAL DE MATRICULA</h4>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: BOL-EST-{selectedStudent.dni || "00000000"}</p>
                          </div>
                          <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100/35 dark:border-emerald-900/35">
                            PAGADO / ACTIVO
                          </span>
                        </div>

                        {/* Details list */}
                        <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Estudiante</span>
                            <span className="font-bold text-gray-800 dark:text-zinc-200 mt-0.5 block">{selectedStudent.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">D.N.I. / Documento</span>
                            <span className="font-mono text-gray-750 dark:text-zinc-350 mt-0.5 block">{selectedStudent.dni || "No registrado - Por favor actualice su ficha"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Servicio Contratado</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{studentService?.nombre || "Matricula Regular / Libre"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Grado & Nivel</span>
                            <span className="text-gray-750 dark:text-zinc-350 mt-0.5 block">{selectedStudent.grade} • {selectedStudent.nivel}</span>
                          </div>
                        </div>

                        {/* Courses list */}
                        <div className="border-t border-gray-100 dark:border-zinc-850 pt-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Cursos y Talleres Incluidos ({linkedCourses.length})</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {linkedCourses.map(c => (
                              <div key={c.id} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-gray-150 dark:border-zinc-850">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">{c.nombre}</p>
                                  <p className="text-[9px] text-gray-400 dark:text-zinc-500 truncate">{c.descripcion || "Sin descripcion"}</p>
                                </div>
                              </div>
                            ))}
                            {linkedCourses.length === 0 && (
                              <p className="text-[11px] text-gray-450 italic col-span-2">Ningun curso asignado a este servicio.</p>
                            )}
                          </div>
                        </div>

                        {/* Pricing block */}
                        <div className="border-t border-gray-150 dark:border-zinc-850 pt-3 flex justify-between items-center bg-gray-50 dark:bg-zinc-900 -mx-4.5 -mb-4.5 p-4 rounded-b-2xl">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Neto del Servicio</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">Incluye I.G.V. (18%)</p>
                          </div>
                          <span className="text-lg font-black text-emerald-650 dark:text-emerald-400 font-mono">
                            S/. {servicePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => generateStudentBoleta(selectedStudent, studentService, linkedCourses)}
                          className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Descargar Boleta de Pago (PDF)
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-6 flex justify-end gap-2.5 border-t border-gray-150 dark:border-zinc-850 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      alert('Descarga de Boletín simulada en formato PDF de alta fidelidad.');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white ${cl.primaryBg} ${cl.primaryHoverBg} transition-all`}
                  >
                    Exportar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cerrar Boleta
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* POPUP MODAL: STEP-BY-STEP STUDENT MATRICULA INVOICE & SAVING FLOW */}
        <AnimatePresence>
          {enrollmentProcessStep !== 'idle' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (enrollmentProcessStep === 'invoice' || enrollmentProcessStep === 'success') {
                    setEnrollmentProcessStep('idle');
                  }
                }}
                className="fixed inset-0 bg-black/40 backdrop-blur-[6px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl flex flex-col"
              >
                {/* 1. STEP: INVOICE REVIEW */}
                {enrollmentProcessStep === 'invoice' && enrollmentInvoiceData && (
                  <div className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">Comprobante de Pre-Matrícula</h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">Verifique los detalles del cobro académico antes de proceder.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-gray-100 dark:border-white/5 space-y-3 font-medium text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200/50 dark:border-white/5">
                        <span className="text-gray-400">Estudiante:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{enrollmentInvoiceData.studentName}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200/50 dark:border-white/5">
                        <span className="text-gray-400">DNI:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{enrollmentInvoiceData.dni}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200/50 dark:border-white/5">
                        <span className="text-gray-400">Concepto:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-right max-w-[200px] leading-tight">
                          {enrollmentInvoiceData.concept}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500 font-bold text-xs">Monto Total:</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          S/. {enrollmentInvoiceData.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEnrollmentProcessStep('idle');
                          setShowAddStudentModal(true);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-gray-250 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Atrás / Editar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmEnrollment}
                        className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-colors cursor-pointer ${cl.primaryBg} ${cl.primaryHoverBg}`}
                      >
                        Aceptar y Matricular
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. STEP: SAVING STATE */}
                {enrollmentProcessStep === 'saving' && (
                  <div className="p-8 flex flex-col items-center justify-center space-y-4 text-center">
                    <Loader2 className={`w-12 h-12 animate-spin ${cl.primaryText}`} />
                    <div className="space-y-1.5">
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Guardando en el almacén...</p>
                      <p className="text-xs text-gray-450 dark:text-zinc-500 max-w-[280px]">
                        Generando boleta de pago firmada digitalmente y resguardando copia cifrada en Cloudinary...
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. STEP: SUCCESS STATUS */}
                {enrollmentProcessStep === 'success' && enrollmentInvoiceData && (
                  <div className="p-6 space-y-6 text-center">
                    <div className="space-y-3">
                      <div className="inline-flex p-3.5 bg-emerald-500/10 text-emerald-500 rounded-full">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">¡Matriculado con Éxito!</h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                          El alumno <strong className="text-slate-700 dark:text-zinc-300">{enrollmentInvoiceData.studentName}</strong> ha sido matriculado y registrado en el almacén escolar.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed">
                      La boleta de pago ha sido guardada de forma segura en Cloudinary e indexada en la Bóveda de Facturas.
                    </div>

                    <button
                      type="button"
                      onClick={() => setEnrollmentProcessStep('idle')}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs text-white transition-colors cursor-pointer ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Entendido / Continuar
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* POPUP MODAL: ADD STUDENT FORM */}
        <AnimatePresence>
          {showAddStudentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddStudentModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-850 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                      {existingStudentData ? "Matricular a Nuevo Servicio (Estudiante Existente)" : "Proceso de Matrícula e Inscripción"}
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-400 font-medium">
                      {existingStudentData
                        ? "Estudiante identificado en Supabase. Elija el nuevo servicio para matricularlo."
                        : "Sincronizado con Supabase y consulta automática por DNI."}
                    </p>
                  </div>
                  <button type="button" onClick={() => setShowAddStudentModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* TAB SWITCHER: NUEVO ESTUDIANTE VS ESTUDIANTE EXISTENTE */}
                {!dniStepCompleted && (
                  <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setMatriculaMode('nuevo');
                        setExistingStudentData(null);
                        setDniSearchError('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        matriculaMode === 'nuevo'
                          ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      Nuevo Estudiante
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMatriculaMode('existente');
                        setExistingStudentData(null);
                        setDniSearchError('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        matriculaMode === 'existente'
                          ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      Matricular Estudiante Existente
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddStudent} className="space-y-4">
                  {!dniStepCompleted ? (
                    <div className="space-y-4 py-2">
                      {/* STEP 1: DNI INPUT FIRST */}
                      <div className="bg-gray-50 dark:bg-zinc-800/80 p-5 rounded-2xl border border-gray-150 dark:border-zinc-700 text-center space-y-4">
                        <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full">
                          <Search className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-100">
                            {matriculaMode === 'existente'
                              ? 'Paso 1: Buscar Estudiante Registrado en Supabase'
                              : 'Paso 1: Consulta de DNI'}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                            {matriculaMode === 'existente'
                              ? 'Ingrese el DNI para buscar la ficha en Supabase y autorrellenar sus datos para matricularlo a otro servicio.'
                              : 'Ingrese el DNI. Primero buscará en Supabase y, si es nuevo, consultará los datos con la API.'}
                          </p>
                        </div>

                        <div className="flex gap-2 max-w-xs mx-auto">
                          <input
                            type="text"
                            maxLength={8}
                            placeholder="DNI (8 dígitos)"
                            value={newStudentData.dni}
                            onChange={(e) => setNewStudentData({ ...newStudentData, dni: e.target.value.replace(/\D/g, '') })}
                            className={`flex-1 p-2 text-xs bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 rounded-lg outline-none transition-all text-center tracking-widest font-mono font-bold ${cl.ring}`}
                          />
                          <button
                            type="button"
                            disabled={isSearchingDni}
                            onClick={() => handleLookupDni(newStudentData.dni, false)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 dark:disabled:bg-indigo-900 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                          >
                            {isSearchingDni ? (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Search className="w-3.5 h-3.5" />
                            )}
                            Consultar DNI
                          </button>
                        </div>

                        {dniSearchError && (
                          <div className="p-2.5 bg-rose-500/10 dark:bg-rose-950/40 rounded-xl border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-semibold text-center leading-relaxed">
                            {dniSearchError}
                          </div>
                        )}

                        <div className="pt-3.5 border-t border-gray-150 dark:border-zinc-700/60 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setDniStepCompleted(true)}
                            className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-gray-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Continuar e ingresar manualmente
                          </button>
                          <span className="text-[9px] text-gray-400 dark:text-zinc-400 leading-relaxed">
                            * También puede omitir la consulta e ingresar o revisar los datos directamente.
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-150 dark:border-zinc-800 flex justify-end text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setShowAddStudentModal(false)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* STEP 2: FULL FORM DISPLAY WITH AUTOFILLED BADGE */}
                      {existingStudentData ? (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="text-left">
                              <span className="block text-[9px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">
                                Estudiante Registrado Encontrado en Supabase
                              </span>
                              <span className="text-xs font-bold text-gray-800 dark:text-zinc-100">
                                {existingStudentData.nombre} {existingStudentData.apellido} — DNI: {existingStudentData.dni}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDniStepCompleted(false);
                              setExistingStudentData(null);
                              setDniSearchError('');
                            }}
                            className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Cambiar DNI
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-500/15">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-500" />
                            <div className="text-left">
                              <span className="block text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">DNI Consultado</span>
                              <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 font-mono">DNI: {newStudentData.dni || 'No registrado'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDniStepCompleted(false);
                              setIsReniecAutofilled(false);
                              setDniSearchError('');
                            }}
                            className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Consultar otro DNI
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nombre</label>
                            {(isReniecAutofilled || existingStudentData) && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> RENIEC / DB
                              </span>
                            )}
                          </div>
                          <input
                            required
                            type="text"
                            placeholder="Ej. Sofía"
                            disabled={isReniecAutofilled || !!existingStudentData}
                            value={newStudentData.nombre}
                            onChange={(e) => setNewStudentData({ ...newStudentData, nombre: e.target.value })}
                            className={`w-full p-2 py-2.5 text-xs rounded-xl outline-none transition-all ${
                              isReniecAutofilled || existingStudentData
                                ? 'bg-gray-100 dark:bg-zinc-800/80 border border-emerald-500/40 text-gray-700 dark:text-zinc-300 font-semibold cursor-not-allowed opacity-90'
                                : `bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white ${cl.ring}`
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Apellido</label>
                            {(isReniecAutofilled || existingStudentData) && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> RENIEC / DB
                              </span>
                            )}
                          </div>
                          <input
                            required
                            type="text"
                            placeholder="Ej. Valentino"
                            disabled={isReniecAutofilled || !!existingStudentData}
                            value={newStudentData.apellido}
                            onChange={(e) => setNewStudentData({ ...newStudentData, apellido: e.target.value })}
                            className={`w-full p-2 py-2.5 text-xs rounded-xl outline-none transition-all ${
                              isReniecAutofilled || existingStudentData
                                ? 'bg-gray-100 dark:bg-zinc-800/80 border border-emerald-500/40 text-gray-700 dark:text-zinc-300 font-semibold cursor-not-allowed opacity-90'
                                : `bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white ${cl.ring}`
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Grado Escolar</label>
                          <select
                            value={newStudentData.grado}
                            onChange={(e) => setNewStudentData({ ...newStudentData, grado: Number(e.target.value) })}
                            className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                          >
                            {Array.from(
                              { length: newStudentData.nivel === 'Secundaria' ? 5 : 6 },
                              (_, i) => i + 1
                            ).map((val) => (
                              <option key={val} value={val}>
                                {val}° Grado
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nivel</label>
                          <select
                            value={newStudentData.nivel}
                            onChange={(e) => {
                              const nextNivel = e.target.value;
                              let nextGrado = newStudentData.grado;
                              if (nextNivel === 'Secundaria' && nextGrado > 5) {
                                nextGrado = 5;
                              } else if (nextGrado > 6) {
                                nextGrado = 6;
                              }
                              setNewStudentData({ ...newStudentData, nivel: nextNivel, grado: nextGrado });
                            }}
                            className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                          >
                            <option value="Primaria">Primaria</option>
                            <option value="Secundaria">Secundaria</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Celular de Contacto</label>
                        <input
                          required
                          type="text"
                          placeholder="Ej. 987654321"
                          value={newStudentData.contacto}
                          onChange={(e) => setNewStudentData({ ...newStudentData, contacto: e.target.value as any })}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        />
                      </div>

                      {/* Servicio a Matricular */}
                      <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-4">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Servicio Académico / Plan de Matrícula</label>
                        <select
                          required
                          value={newStudentData.servicioId}
                          onChange={(e) => setNewStudentData({ ...newStudentData, servicioId: e.target.value })}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        >
                          <option value="">-- Seleccione el Servicio en el que se matriculará --</option>
                          {servicios.map((serv) => (
                            <option key={serv.id} value={serv.id}>
                              {serv.nombre}{serv.pago !== undefined && serv.pago !== null ? ` (S/. ${Number(serv.pago).toFixed(2)})` : ''}
                            </option>
                          ))}
                        </select>

                        {newStudentData.servicioId && (() => {
                          const linkedCourseIds = servicioCursos
                            .filter(link => (link.servicioId === newStudentData.servicioId || link.servicio_id === newStudentData.servicioId))
                            .map(link => (link.cursoId || link.curso_id));
                          const linkedCourses = cursos.filter(c => linkedCourseIds.includes(c.id));

                          return (
                            <div className="mt-3 p-3 bg-indigo-50/40 dark:bg-zinc-850/40 rounded-xl border border-indigo-100/50 dark:border-zinc-800/60">
                              <span className="block text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-2">
                                Cursos que incluye este servicio:
                              </span>
                              {linkedCourses.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {linkedCourses.map(curso => (
                                    <span 
                                      key={curso.id} 
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-150 dark:border-zinc-750 shadow-sm"
                                    >
                                      <GraduationCap className="w-3 h-3 text-indigo-500" />
                                      {curso.nombre}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-400 dark:text-zinc-500 italic">Este servicio no tiene cursos vinculados todavía.</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Observación</label>
                        <textarea
                          placeholder="Ej. Estudiante destaca en matemáticas..."
                          value={newStudentData.observacion}
                          onChange={(e) => setNewStudentData({ ...newStudentData, observacion: e.target.value })}
                          className={`w-full p-2 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring} h-16 resize-none`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Foto de Perfil</label>
                        <div 
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setStudentDragActive(true); }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setStudentDragActive(true); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setStudentDragActive(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setStudentDragActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                              if (isImage) {
                                if (file.size > 2 * 1024 * 1024) {
                                  window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setImageToCrop({ src: reader.result, target: 'newStudent' });
                                  }
                                };
                                reader.readAsDataURL(file);
                              } else {
                                window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                              }
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            studentDragActive 
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20' 
                              : 'bg-gray-50 dark:bg-zinc-800 border-gray-200/60 dark:border-zinc-700 hover:border-gray-350 dark:hover:border-zinc-600'
                          }`}
                        >
                          {newStudentData.foto_url ? (
                            <div className="relative">
                              <img 
                                src={newStudentData.foto_url} 
                                alt="Vista previa" 
                                className="w-10 h-10 rounded-lg object-cover ring-2 ring-indigo-500/30" 
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => setNewStudentData({ ...newStudentData, foto_url: '' })}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                              <Upload className="w-5 h-5" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <label 
                              htmlFor="student-avatar-upload"
                              className="inline-block px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                            >
                              Elegir Imagen
                            </label>
                            <input
                              id="student-avatar-upload"
                              type="file"
                              accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.gif"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                                  if (!isImage) {
                                    window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                                    return;
                                  }
                                  if (file.size > 2 * 1024 * 1024) {
                                    window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      setImageToCrop({ src: reader.result, target: 'newStudent' });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                            <span className="block text-[9px] text-gray-400 dark:text-zinc-500 mt-1">PNG, JPG, JPEG, WEBP, GIF, HEIC (máx. 2MB)</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setShowAddStudentModal(false)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                        >
                          Matricular e Inscribir
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* POPUP MODAL: EDIT STUDENT FORM */}
        <AnimatePresence>
          {editingStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingStudent(null)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Editar Información del Estudiante</h3>
                  <button type="button" onClick={() => setEditingStudent(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEditStudentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Foto de Perfil</label>
                    <div 
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setStudentDragActive(true); }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setStudentDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setStudentDragActive(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStudentDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                          if (isImage) {
                            if (file.size > 2 * 1024 * 1024) {
                              window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setImageToCrop({ src: reader.result, target: 'editStudent' });
                              }
                            };
                            reader.readAsDataURL(file);
                          } else {
                            window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                          }
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        studentDragActive 
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20' 
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200/60 dark:border-zinc-700 hover:border-gray-350 dark:hover:border-zinc-600'
                      }`}
                    >
                      {editStudentData.foto_url ? (
                        <div className="relative">
                          <img 
                            src={editStudentData.foto_url} 
                            alt="Vista previa" 
                            className="w-10 h-10 rounded-lg object-cover ring-2 ring-indigo-500/30" 
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setEditStudentData({ ...editStudentData, foto_url: '' })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor="student-edit-avatar-upload"
                          className="inline-block px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                        >
                          Elegir Imagen
                        </label>
                        <input
                          id="student-edit-avatar-upload"
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                              if (!isImage) {
                                window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                                return;
                              }
                              if (file.size > 2 * 1024 * 1024) {
                                window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setImageToCrop({ src: reader.result, target: 'editStudent' });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <span className="block text-[9px] text-gray-400 dark:text-zinc-500 mt-1">PNG, JPG, JPEG, WEBP, GIF, HEIC (máx. 2MB)</span>
                      </div>
                    </div>
                  </div>

                  {/* DNI Field (Manual input when editing student) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                      DNI de Identidad
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Ingresar DNI (8 dígitos)"
                      value={editStudentData.dni}
                      onChange={(e) => setEditStudentData({ ...editStudentData, dni: e.target.value.replace(/\D/g, '') })}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Sofía"
                        value={editStudentData.nombre}
                        onChange={(e) => setEditStudentData({ ...editStudentData, nombre: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Apellido</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Valentino"
                        value={editStudentData.apellido}
                        onChange={(e) => setEditStudentData({ ...editStudentData, apellido: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Grado Escolar</label>
                      <select
                        value={editStudentData.grado}
                        onChange={(e) => setEditStudentData({ ...editStudentData, grado: Number(e.target.value) })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        {Array.from(
                          { length: editStudentData.nivel === 'Secundaria' ? 5 : 6 },
                          (_, i) => i + 1
                        ).map((val) => (
                          <option key={val} value={val}>
                            {val}° Grado
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nivel</label>
                      <select
                        value={editStudentData.nivel}
                        onChange={(e) => {
                          const nextNivel = e.target.value;
                          let nextGrado = editStudentData.grado;
                          if (nextNivel === 'Secundaria' && nextGrado > 5) {
                            nextGrado = 5;
                          } else if (nextGrado > 6) {
                            nextGrado = 6;
                          }
                          setEditStudentData({ ...editStudentData, nivel: nextNivel, grado: nextGrado });
                        }}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        <option value="Primaria">Primaria</option>
                        <option value="Secundaria">Secundaria</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Celular de Contacto</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. 987654321"
                      value={editStudentData.contacto}
                      onChange={(e) => setEditStudentData({ ...editStudentData, contacto: e.target.value as any })}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  {/* Servicio a Matricular */}
                  <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-4">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Servicio Académico / Plan de Matrícula</label>
                    <select
                      required
                      value={editStudentData.servicioId}
                      onChange={(e) => setEditStudentData({ ...editStudentData, servicioId: e.target.value })}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    >
                      <option value="">-- Seleccione el Servicio en el que se matriculará --</option>
                      {servicios.map((serv) => (
                        <option key={serv.id} value={serv.id}>
                          {serv.nombre}{serv.pago !== undefined && serv.pago !== null ? ` (S/. ${Number(serv.pago).toFixed(2)})` : ''}
                        </option>
                      ))}
                    </select>

                    {editStudentData.servicioId && (() => {
                      const linkedCourseIds = servicioCursos
                        .filter(link => (link.servicioId === editStudentData.servicioId || link.servicio_id === editStudentData.servicioId))
                        .map(link => (link.cursoId || link.curso_id));
                      const linkedCourses = cursos.filter(c => linkedCourseIds.includes(c.id));

                      return (
                        <div className="mt-3 p-3 bg-indigo-50/40 dark:bg-zinc-850/40 rounded-xl border border-indigo-100/50 dark:border-zinc-800/60">
                          <span className="block text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-2">
                            Cursos que incluye este servicio:
                          </span>
                          {linkedCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {linkedCourses.map(curso => (
                                <span 
                                  key={curso.id} 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-150 dark:border-zinc-750 shadow-sm"
                                >
                                  <GraduationCap className="w-3 h-3 text-indigo-500" />
                                  {curso.nombre}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 dark:text-zinc-500 italic">Este servicio no tiene cursos vinculados todavía.</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Observación</label>
                    <textarea
                      placeholder="Ej. Estudiante destaca en matemáticas..."
                      value={editStudentData.observacion}
                      onChange={(e) => setEditStudentData({ ...editStudentData, observacion: e.target.value })}
                      className={`w-full p-2 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring} h-16 resize-none`}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Guardar Cambios
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


  /* =========================================================================
     COMPARTIDOS / GLOBAL HANDLERS: CURSOS Y SERVICIOS
     ========================================================================= */
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    await addCourse({
      nombre: newCourseName,
      descripcion: newCourseDesc,
      pago: Number(newCoursePago) || 25
    });
    setNewCourseName('');
    setNewCourseDesc('');
    setNewCoursePago(25);
    setShowAddCourseModal(false);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    await addService({
      nombre: newServiceName,
      descripcion: newServiceDesc,
      duracion: newServiceDuracion ? Number(newServiceDuracion) : undefined,
      pago: newServicePago ? Number(newServicePago) : undefined
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceDuracion('');
    setNewServicePago('');
    setShowAddServiceModal(false);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEdit || !editCourseName.trim()) return;
    await updateCourse({
      id: selectedCourseForEdit.id,
      nombre: editCourseName,
      descripcion: editCourseDesc,
      pago: Number(editCoursePago) || 25,
      created_at: selectedCourseForEdit.created_at
    });
    setSelectedCourseForEdit(null);
    setEditCourseName('');
    setEditCourseDesc('');
    setEditCoursePago(25);
    setShowEditCourseModal(false);
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el curso "${name}"? Se desvinculará de cualquier servicio.`)) {
      await deleteCourse(id);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForEdit || !editServiceName.trim()) return;
    await updateService({
      id: selectedServiceForEdit.id,
      nombre: editServiceName,
      descripcion: editServiceDesc,
      duracion: editServiceDuracion ? Number(editServiceDuracion) : undefined,
      pago: editServicePago ? Number(editServicePago) : undefined,
      created_at: selectedServiceForEdit.created_at
    });
    setSelectedServiceForEdit(null);
    setEditServiceName('');
    setEditServiceDesc('');
    setEditServiceDuracion('');
    setEditServicePago('');
    setShowEditServiceModal(false);
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el servicio "${name}"? Se eliminarán todas sus vinculaciones de cursos.`)) {
      await deleteService(id);
    }
  };

  const handleLinkCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedCourseToLinkId) return;
    await linkCourseToService(selectedServiceId, selectedCourseToLinkId);
    setSelectedCourseToLinkId('');
    setShowLinkCourseModal(false);
  };

  const handleLinkTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedTeacherToLinkId) return;
    await linkTeacherToService(selectedServiceId, selectedTeacherToLinkId);
    setSelectedTeacherToLinkId('');
    setShowLinkTeacherModal(false);
  };


  /* =========================================================================
     MODULE: DOCENTES (TEACHERS DIRECTORY CONTROL)
     ========================================================================= */
  const renderDocentesValue = () => {
    const filtered = teachers.filter(t => 
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(teacherSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        
        {/* Navigation Tabs for Docentes / Asistencias */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setDocenteSubTab('lista')}
            className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 ${docenteSubTab === 'lista' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-750 dark:text-zinc-400'}`}
          >
            Directorio de Docentes
          </button>
          <button
            type="button"
            onClick={() => setDocenteSubTab('asistencias')}
            className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 ${docenteSubTab === 'asistencias' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-750 dark:text-zinc-400'}`}
          >
            Bitácora de Asistencias y Pagos
          </button>
        </div>

        {docenteSubTab === 'lista' && (
          <>
            {/* Actions bar for teachers */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-810 shadow-sm">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="search-teachers"
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="Buscar docente o especialidad..."
              className={`w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* View Switcher toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200/60 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setTeacherViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${teacherViewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                title="Vista Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTeacherViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${teacherViewMode === 'table' ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                title="Vista Tabla"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              id="btn-add-teacher-trigger"
              type="button"
              onClick={() => setShowAddTeacherModal(true)}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} transition-all flex items-center justify-center gap-2 shadow-sm`}
            >
              <Plus className="w-4 h-4" />
              Registrar Nuevo Docente
            </button>
          </div>
        </div>

        {teacherSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/60 p-3 rounded-xl flex items-center justify-between gap-3 text-xs mb-3 font-medium text-indigo-700 dark:text-indigo-400"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>Modo Selección: <strong>{selectedTeacherIds.length}</strong> {selectedTeacherIds.length === 1 ? 'docente seleccionado' : 'docentes seleccionados'}.</span>
              <span className="text-[10px] opacity-80 text-gray-505 dark:text-zinc-400">Mantén presionado un elemento seleccionado y arrástralo al tacho de basura que aparecerá abajo para darlos de baja.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTeacherSelectionMode(false);
                setSelectedTeacherIds([]);
              }}
              className="px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg font-bold text-gray-700 dark:text-zinc-300 transition-all text-[11px]"
            >
              Cancelar Selección
            </button>
          </motion.div>
        )}

        {/* Teachers List cards grid */}
        {teacherViewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {filtered.map((teacher, index) => {
              const isSelected = selectedTeacherIds.includes(teacher.id);
              return (
                <div 
                  key={teacher.id}
                  draggable={teacherSelectionMode && isSelected}
                  onDragStart={(e) => handleDragStart(e, 'teacher')}
                  onDragEnd={handleDragEnd}
                  onPointerDown={() => handleItemPointerDown(teacher.id, 'teacher')}
                  onPointerUp={handleItemPointerUp}
                  onPointerCancel={handleItemPointerUp}
                  onPointerLeave={handleItemPointerLeave}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('a') || target.closest('input[type="checkbox"]')) return;
                    
                    if (teacherSelectionMode) {
                      toggleTeacherSelection(teacher.id);
                    }
                  }}
                  className={`p-5 rounded-2xl border shadow-sm transition-all relative overflow-hidden cursor-pointer select-none ${
                    isSelected 
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/25 border-indigo-600 ring-2 ring-indigo-500/20 shadow-indigo-100/50 dark:shadow-none' 
                      : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:shadow-md'
                  }`}
                >
                  {teacherSelectionMode && (
                    <div className="absolute top-4 left-4 z-10">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleTeacherSelection(teacher.id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button
                      id={`btn-edit-teacher-trigger-${teacher.id}`}
                      type="button"
                      onClick={() => startEditTeacher(teacher)}
                      className={`p-1.5 text-gray-400 ${cl.hoverText} rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors`}
                      title="Editar docente"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-del-teacher-${teacher.id}`}
                      type="button"
                      onClick={() => setConfirmDelete({ id: teacher.id, type: 'teacher', name: teacher.name })}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      title="Dar de baja docente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={`flex items-center gap-4.5 mb-4 ${teacherSelectionMode ? 'pl-6' : ''}`}>
                    <UserAvatar
                      src={teacher.avatarUrl || teacher.foto_url}
                      name={teacher.name}
                      className="w-13 h-13 rounded-2xl ring-2 ring-gray-50"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-gray-850 dark:text-zinc-200 leading-tight">{teacher.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cl.lightBg} inline-block mt-1`}>
                        Espec: {teacher.subject}
                      </span>
                    </div>
                  </div>

                  {/* Specs detailed block */}
                  <div className="space-y-2 border-t border-gray-100 dark:border-zinc-850/60 pt-3.5 text-xs text-slate-650 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cursos Asignados:</span>
                      <span className="font-bold text-gray-850 dark:text-zinc-300">{teacher.activeCourses.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contacto:</span>
                      <span className="font-bold font-mono">{teacher.phone || teacher.telefono || 'No registrado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Edad:</span>
                      <span className="font-bold text-gray-850 dark:text-zinc-300">{teacher.edad || 35} años</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-gray-400">Vence Contrato:</span>
                      <span className="font-bold text-gray-850 dark:text-zinc-300 font-mono">{teacher.fecha_vencimiento || '2028'}</span>
                    </div>
                  </div>

                  {/* Actions & Payment Trigger */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-850/60 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono">ID: DOC-{index + 1}</span>
                    <button
                      id={`btn-view-teacher-details-${teacher.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                      }}
                      className={`text-xs font-bold ${cl.primaryText} hover:underline flex items-center gap-1`}
                    >
                      Ver Ficha <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full bg-white dark:bg-zinc-900 p-8 rounded-xl border border-gray-100 text-center text-gray-400">
                Ningún docente se encuentra registrado en el sistema bajo ese nombre.
              </div>
            )}
          </div>
        )}

        {/* Teachers List table representation */}
        {teacherViewMode === 'table' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 dark:bg-zinc-950/60 border-b border-gray-100 dark:border-zinc-850">
                    {teacherSelectionMode && (
                      <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap text-center w-12">Sel.</th>
                    )}
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Código</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Docente</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Especialidad</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Contacto / DNI</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Cursos Asignados</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Edad</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Estado / Vencimiento</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-855">
                  {filtered.map((teacher, index) => {
                    const isSelected = selectedTeacherIds.includes(teacher.id);
                    return (
                      <tr 
                        key={teacher.id}
                        draggable={teacherSelectionMode && isSelected}
                        onDragStart={(e) => handleDragStart(e, 'teacher')}
                        onDragEnd={handleDragEnd}
                        onPointerDown={() => handleItemPointerDown(teacher.id, 'teacher')}
                        onPointerUp={handleItemPointerUp}
                        onPointerCancel={handleItemPointerUp}
                        onPointerLeave={handleItemPointerLeave}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('a') || target.closest('input[type="checkbox"]')) return;
                          
                          if (teacherSelectionMode) {
                            toggleTeacherSelection(teacher.id);
                          }
                        }}
                        className={`transition-colors cursor-pointer select-none ${
                          isSelected 
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/25 border-l-2 border-l-indigo-600' 
                            : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/20'
                        }`}
                      >
                        {teacherSelectionMode && (
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleTeacherSelection(teacher.id)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-4 font-mono font-bold text-gray-700 dark:text-zinc-300">
                          {teacher.codigo || `DOC-${index + 1}`}
                        </td>
                        <td className="p-4 flex items-center gap-3">
                          <UserAvatar
                            src={teacher.avatarUrl || teacher.foto_url}
                            name={teacher.name}
                            className="w-10 h-10 rounded-xl ring-1 ring-gray-100"
                          />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-zinc-200">{teacher.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{teacher.email || `docente${index + 1}@sistema.edu`}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cl.lightBg} inline-block`}>
                            {teacher.subject}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-700 dark:text-zinc-300">{teacher.phone || teacher.telefono || 'No registrado'}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">DNI: {teacher.dni || 'Sin documento'}</p>
                        </td>
                        <td className="p-4 max-w-[150px] truncate" title={teacher.activeCourses.join(', ')}>
                          <p className="font-medium text-gray-700 dark:text-zinc-300">
                            {teacher.activeCourses.join(', ')}
                          </p>
                        </td>
                        <td className="p-4 font-semibold text-gray-750 dark:text-zinc-300">
                          {teacher.edad || 35} años
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div>
                              {(teacher.activado !== undefined ? teacher.activado : true) ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  Activo
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              Vence: {teacher.fecha_vencimiento || '2028'}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              id={`btn-view-ficha-${teacher.id}`}
                              type="button"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                              }}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${cl.lightBg} border-transparent hover:brightness-105`}
                            >
                              Ficha
                            </button>
                            <button
                              id={`btn-edit-teacher-trigger-table-${teacher.id}`}
                              type="button"
                              onClick={() => startEditTeacher(teacher)}
                              className={`p-1.5 text-gray-400 ${cl.hoverText} rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center`}
                              title="Editar docente"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-del-teacher-table-${teacher.id}`}
                              type="button"
                              onClick={() => setConfirmDelete({ id: teacher.id, type: 'teacher', name: teacher.name })}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                              title="Dar de baja docente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        Ningún docente coincide con el criterio de búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
        {/* SECTION: BITACORA DE ASISTENCIAS Y PAGOS */}
        {docenteSubTab === 'asistencias' && (
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-850 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Control de Sesiones y Honorarios</h3>
                <p className="text-xs text-gray-500">Visualiza la bitácora de clases dictadas por los docentes con su compensación respectiva</p>
              </div>
              
              {/* Quick Summary Cards */}
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl">
                  <span className="block text-[9px] text-gray-450 uppercase font-bold">Total Devengado</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    S/. {attendance.reduce((sum, item) => sum + (Number(item.monto) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl">
                  <span className="block text-[9px] text-gray-450 uppercase font-bold">Clases Registradas</span>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    {attendance.length} clases
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 dark:bg-zinc-950/60 border-b border-gray-100 dark:border-zinc-850">
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Nº Secuencial</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Docente</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Curso / Grupo</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Horario</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Sesiones (2h)</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 text-right">Monto a Pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-855">
                  {attendance.map((att, idx) => {
                    const prof = teachers.find(t => t.id === att.id_profesor || t.name === att.profesor);
                    const profName = prof ? prof.name : (att.profesor || 'Docente');
                    
                    return (
                      <tr key={att.id} className="hover:bg-gray-50/30 dark:hover:bg-zinc-800/10">
                        <td className="px-4 py-3.5 font-bold font-mono text-gray-550">
                          #{idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-750 dark:text-zinc-300 font-mono">
                          {att.fecha ? new Date(att.fecha + 'T12:00:00').toLocaleDateString('es-ES') : 'Sin fecha'}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-800 dark:text-zinc-250">
                          {profName}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-indigo-650 dark:text-indigo-400">{att.curso_nombre || 'Clase General'}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{att.grupo || 'Todo el alumnado'}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-gray-500">
                          {att.inicio?.substring(0, 5) || '15:00'} - {att.fin?.substring(0, 5) || '17:00'}
                        </td>
                        <td className="px-4 py-3.5 font-semibold font-mono text-center">
                          {att.cantidadSesiones || 1}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          S/. {(Number(att.monto) || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                        No hay registros de asistencias o clases dictadas en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* MODAL: ADD TEACHER FORM */}
        <AnimatePresence>
          {showAddTeacherModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddTeacherModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Contratar y Registrar Docente</h3>
                  <button type="button" onClick={() => setShowAddTeacherModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddTeacher} className="space-y-4">
                  {/* DNI Consultation (RENIEC / Decolecta) */}
                  <div className="bg-gray-50 dark:bg-zinc-800/80 p-3.5 rounded-xl border border-gray-150 dark:border-zinc-700">
                    <label className="block text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                      Consulta de Identidad (RENIEC / Decolecta API)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="Ingresar DNI (8 dígitos)"
                        value={newTeacherData.dni}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, dni: e.target.value.replace(/\D/g, '') })}
                        className={`flex-1 p-2 py-2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 rounded-lg outline-none transition-all ${cl.ring}`}
                      />
                      <button
                        type="button"
                        disabled={isSearchingDni}
                        onClick={() => handleLookupDni(newTeacherData.dni, true, false)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 dark:disabled:bg-indigo-900 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isSearchingDni ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        Consultar
                      </button>
                    </div>
                    {dniSearchError && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1.5">{dniSearchError}</p>
                    )}
                    <p className="text-[9px] text-gray-400 dark:text-zinc-400 font-medium mt-1.5">
                      * Al consultar se auto-completarán los nombres y apellidos del profesor utilizando la API de Decolecta.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Fernando"
                        value={newTeacherData.nombre}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, nombre: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Apellido</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Paz"
                        value={newTeacherData.apellido}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, apellido: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Edad</label>
                      <input
                        required
                        type="number"
                        placeholder="Ej. 35"
                        value={newTeacherData.edad}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, edad: Number(e.target.value) })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">DNI</label>
                      <input
                        required
                        type="text"
                        placeholder="Documento de identidad"
                        value={newTeacherData.dni}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, dni: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Teléfono</label>
                      <input
                        required
                        type="number"
                        placeholder="9 dígitos"
                        value={newTeacherData.telefono}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, telefono: Number(e.target.value) })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Materia Especialidad</label>
                      <select
                        value={newTeacherData.subject}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, subject: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        <option value="Matemáticas">Matemáticas</option>
                        <option value="Ciencias">Ciencias</option>
                        <option value="Historia">Historia</option>
                        <option value="Idiomas">Idiomas</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-550 uppercase tracking-wide mb-1">Fecha Vencimiento (Año)</label>
                      <input
                        required
                        type="number"
                        placeholder="Ej. 2028"
                        value={newTeacherData.fecha_vencimiento}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, fecha_vencimiento: Number(e.target.value) })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-550 uppercase tracking-wide mb-1">Rol de Acceso</label>
                      <select
                        value={newTeacherData.rol || 'profesor'}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, rol: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        <option value="profesor">Profesor (Docente)</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Foto de Perfil</label>
                    <div 
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setTeacherDragActive(true); }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setTeacherDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setTeacherDragActive(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTeacherDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                          if (isImage) {
                            if (file.size > 2 * 1024 * 1024) {
                              window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setImageToCrop({ src: reader.result, target: 'newTeacher' });
                              }
                            };
                            reader.readAsDataURL(file);
                          } else {
                            window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                          }
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        teacherDragActive 
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20' 
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200/60 dark:border-zinc-700 hover:border-gray-350 dark:hover:border-zinc-600'
                      }`}
                    >
                      {newTeacherData.foto_url ? (
                        <div className="relative">
                          <img 
                            src={newTeacherData.foto_url} 
                            alt="Vista previa" 
                            className="w-10 h-10 rounded-lg object-cover ring-2 ring-indigo-500/30" 
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setNewTeacherData({ ...newTeacherData, foto_url: '' })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor="teacher-avatar-upload"
                          className="inline-block px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                        >
                          Elegir Imagen
                        </label>
                        <input
                          id="teacher-avatar-upload"
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                              if (!isImage) {
                                window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                                return;
                              }
                              if (file.size > 2 * 1024 * 1024) {
                                window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setImageToCrop({ src: reader.result, target: 'newTeacher' });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <span className="block text-[9px] text-gray-400 mt-1">PNG, JPG, JPEG, WEBP, GIF, HEIC (máx. 2MB)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowAddTeacherModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Dar de alta
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: EDIT TEACHER FORM */}
        <AnimatePresence>
          {editingTeacher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setEditingTeacher(null)}
              />
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 w-full max-w-lg overflow-hidden relative z-10"
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-150 dark:border-zinc-850 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-850 dark:text-zinc-200">Editar Ficha de Docente</h3>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Modificar información del profesional</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditTeacherSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Carlos"
                        value={editTeacherData.nombre}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, nombre: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Apellido</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Mendoza"
                        value={editTeacherData.apellido}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, apellido: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Edad</label>
                      <input
                        required
                        type="number"
                        placeholder="35"
                        value={editTeacherData.edad}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, edad: Number(e.target.value) })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">DNI / Documento</label>
                      <input
                        required
                        type="text"
                        placeholder="8 dígitos"
                        value={editTeacherData.dni}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, dni: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Teléfono</label>
                      <input
                        required
                        type="number"
                        placeholder="9 dígitos"
                        value={editTeacherData.telefono}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, telefono: Number(e.target.value) })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Materia Especialidad</label>
                      <select
                        value={editTeacherData.subject}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, subject: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        <option value="Matemáticas">Matemáticas</option>
                        <option value="Ciencias">Ciencias</option>
                        <option value="Historia">Historia</option>
                        <option value="Idiomas">Idiomas</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-550 uppercase tracking-wide mb-1">Fecha Vencimiento (Año)</label>
                      <input
                        required
                        type="number"
                        placeholder="Ej. 2028"
                        value={editTeacherData.fecha_vencimiento}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, fecha_vencimiento: Number(e.target.value) })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-550 uppercase tracking-wide mb-1">Rol de Acceso</label>
                      <select
                        value={editTeacherData.rol || 'profesor'}
                        onChange={(e) => setEditTeacherData({ ...editTeacherData, rol: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        <option value="profesor">Profesor (Docente)</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Foto de Perfil</label>
                    <div 
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setTeacherDragActive(true); }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setTeacherDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setTeacherDragActive(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTeacherDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                          if (isImage) {
                            if (file.size > 2 * 1024 * 1024) {
                              window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setImageToCrop({ src: reader.result, target: 'editTeacher' });
                              }
                            };
                            reader.readAsDataURL(file);
                          } else {
                            window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                          }
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        teacherDragActive 
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20' 
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200/60 dark:border-zinc-700 hover:border-gray-350 dark:hover:border-zinc-600'
                      }`}
                    >
                      {editTeacherData.foto_url ? (
                        <div className="relative">
                          <img 
                            src={editTeacherData.foto_url} 
                            alt="Vista previa" 
                            className="w-10 h-10 rounded-lg object-cover ring-2 ring-indigo-500/30" 
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setEditTeacherData({ ...editTeacherData, foto_url: '' })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor="teacher-edit-avatar-upload"
                          className="inline-block px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                        >
                          Elegir Imagen
                        </label>
                        <input
                          id="teacher-edit-avatar-upload"
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|gif)$/i.test(file.name);
                              if (!isImage) {
                                window.alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp, .heic, .gif). No se admiten archivos de texto, documentos o Word.');
                                return;
                              }
                              if (file.size > 2 * 1024 * 1024) {
                                window.alert('La imagen seleccionada es demasiado grande. El límite es de 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setImageToCrop({ src: reader.result, target: 'editTeacher' });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <span className="block text-[9px] text-gray-400 mt-1">PNG, JPG, JPEG, WEBP, GIF, HEIC (máx. 2MB)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setEditingTeacher(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Guardar Cambios
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


  /* =========================================================================
     MODULE: RECURSOS (FILE MANAGER STYLE WITH SINGLE CLIK OPENING - REQUISITO)
     ========================================================================= */
  const renderRecursosValue = () => {
    // Current folder resources inside
    const currentDirectoryItems = currentFolder 
      ? (currentFolder.children || []) 
      : resources;

    const handleSingleClickResource = (item: ResourceItem) => {
      // If folder, open it in single click
      if (item.type === 'folder') {
        setCurrentFolder(item);
      } else {
        if (item.url && item.url.startsWith('http')) {
          window.open(item.url, '_blank');
        } else {
          alert(`Visualizando archivo de alta resolución: ${item.name}\nFormato: ${item.size || 'Desconocido'}\nEstatus escolar: Protegido`);
        }
      }
    };

    const handleGoBack = () => {
      // Return to root drive folder
      setCurrentFolder(null);
    };

    return (
      <div className="space-y-6 animate-fade-in">
        
         {/* Drive directory controls header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/40 dark:bg-zinc-900/45 backdrop-blur-xl p-4.5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-black/[0.03] dark:shadow-black/20 transition-all duration-300">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 rounded-xl shadow-inner shrink-0">
              <Folder className="w-5 h-5 fill-yellow-250/20" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Navegador Unificado de Recursos</h3>
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

          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
            {currentFolder && (
              <button
                id="btn-drive-back"
                type="button"
                onClick={handleGoBack}
                className="px-4 py-2.5 text-xs bg-white/40 hover:bg-white/60 dark:bg-zinc-800/40 dark:hover:bg-zinc-750/50 text-gray-700 dark:text-zinc-300 rounded-xl font-bold transition-all border border-white/40 dark:border-white/10 shadow-sm"
              >
                Subir de nivel
              </button>
            )}
            <button
              id="btn-drive-add-trigger"
              type="button"
              onClick={() => {
                setNewResourceType(currentFolder ? 'file' : 'folder');
                setShowAddResourceModal(true);
              }}
              className={`px-4.5 py-2.5 text-xs font-extrabold text-white rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95`}
            >
              {currentFolder ? (
                <>
                  <FileText className="w-4 h-4" />
                  Crear Recurso
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  Crear Carpeta
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Warning Helper (Outer folders, Inner files requirement) */}
        <div className="transition-all duration-300">
          {currentFolder ? (
            <div className="bg-blue-50/20 dark:bg-blue-955/5 backdrop-blur-lg border border-blue-100/40 dark:border-blue-900/20 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="p-2 bg-blue-100/50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Nivel de Almacenamiento (Carpeta: {currentFolder.name})</p>
                <p className="text-[11px] text-blue-600/90 dark:text-blue-400/80 mt-1 font-semibold leading-relaxed">
                  Estás operando dentro de una carpeta creada. Para respetar la política de guardado unificado, en este nivel solo puedes crear <span className="underline font-bold">Recursos Académicos (Archivos)</span>. La creación de subcarpetas está inhabilitada aquí.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/25 dark:bg-amber-955/5 backdrop-blur-lg border border-amber-100/30 dark:border-amber-900/10 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="p-2 bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <Folder className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Nivel Raíz Educativa (Directorio)</p>
                <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80 mt-1 font-semibold leading-relaxed">
                  Estás en la base modular de recursos escolares. Para mantener un portal limpio y consistente, aquí solo puedes iniciar y crear <span className="underline font-bold">Carpetas Temáticas principales</span>. La subida directa de archivos huérfanos está restringida en la raíz.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Drive Directory files list */}
        <div className="bg-white/40 dark:bg-zinc-900/45 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-black/[0.02] dark:shadow-black/15 overflow-hidden p-6 transition-all">
          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-5">
            {currentFolder ? 'Recursos Compartidos en esta sección' : 'Carpetas Unificadas del Colegio'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {currentDirectoryItems.map(item => (
              <div
                key={item.id}
                id={`drive-item-${item.id}`}
                onClick={() => handleSingleClickResource(item)}
                className="group border border-white/30 dark:border-white/5 bg-white/20 dark:bg-zinc-900/15 backdrop-blur-md hover:bg-white/40 dark:hover:bg-zinc-800/30 hover:border-white/45 dark:hover:border-white/15 hover:shadow-xl rounded-2xl p-4.5 flex flex-col items-center text-center cursor-pointer relative transition-all duration-300 hover:-translate-y-1"
              >
                <button
                  id={`btn-del-drive-item-${item.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid opening
                    setConfirmDelete({
                      id: item.id,
                      type: 'resource',
                      name: item.name,
                      extraAction: () => {
                        if (currentFolder && item.id === currentFolder.id) {
                          setCurrentFolder(null);
                        }
                      }
                    });
                  }}
                  className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  title="Eliminar recurso permanentemente"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

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
                  <span className="text-[9px] text-gray-450 mt-1.5 font-bold px-1.5 py-0.5 bg-gray-100/50 dark:bg-zinc-800 rounded-md">{item.size}</span>
                ) : (
                  <span className="text-[9px] text-teal-650 dark:text-teal-400 mt-1.5 font-extrabold px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950/40 rounded-md">
                    {(item.children || []).length} items
                  </span>
                )}
                
                <span className="text-[8px] text-gray-400 mt-2.5 font-mono text-center tracking-wider">{item.updatedAt.split(' ')[0]}</span>
              </div>
            ))}

            {currentDirectoryItems.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-450 flex flex-col items-center justify-center gap-4">
                <Folder className="w-12 h-12 text-gray-300 dark:text-zinc-700" />
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-zinc-400">Esta sección se encuentra vacía</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium max-w-xs mx-auto">
                    {currentFolder 
                      ? 'No hay archivos guardados aquí. Crea uno nuevo usando el botón de la parte superior.'
                      : 'No hay carpetas creadas en la raíz. Inicializa tu estructura organizadora escolar.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DRIVE CREATION MODAL */}
        <AnimatePresence>
          {showAddResourceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddResourceModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                    {currentFolder ? 'Crear Nuevo Archivo/Recurso' : 'Crear Nueva Carpeta'}
                  </h3>
                  <button type="button" onClick={() => setShowAddResourceModal(false)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddResource} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      {currentFolder ? 'Nombre del Archivo / Material' : 'Nombre de la Carpeta'}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={currentFolder ? "Ej. Guia_Examen_Fisica.pdf" : "Ej. Ciencias Naturales"}
                      value={newResourceName}
                      onChange={(e) => setNewResourceName(e.target.value)}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  {/* RESTRICTION DISPLAY COHERENT WITH USER MANDATE */}
                  <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-150 dark:border-zinc-800 text-xs shadow-sm">
                    <span className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-505 uppercase tracking-wider mb-2">
                      Tipo de Carga Habilitado
                    </span>
                    {currentFolder ? (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                        <FileText className="w-4 h-4" />
                        <span>Recurso / Archivo de Estudio (Forzado)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-550 font-bold">
                        <Folder className="w-4 h-4" />
                        <span>Carpeta de Organización (Forzado en Raíz)</span>
                      </div>
                    )}
                    <p className="text-[9.5px] text-gray-450 dark:text-zinc-500 mt-2.5 leading-relaxed font-semibold">
                      {currentFolder 
                        ? 'Estás dentro de una sección organizada. Solamente se adjuntan recursos legibles o descargables.'
                        : 'Estás en la base principal. Solamente se permite instaurar carpetas maestras por orden temático.'
                      }
                    </p>
                  </div>

                  {currentFolder && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Enlace / URL del Recurso
                        </label>
                        <input
                          type="url"
                          placeholder="https://ejemplo.com/recursos/material.pdf"
                          value={newResourceUrl}
                          onChange={(e) => setNewResourceUrl(e.target.value)}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Formato del Recurso
                        </label>
                        <select
                          value={newResourceFormato}
                          onChange={(e) => setNewResourceFormato(e.target.value as any)}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        >
                          <option value="AUDIO">AUDIO</option>
                          <option value="VIDEO">VIDEO</option>
                          <option value="DOCUMENTO">DOCUMENTO</option>
                          <option value="LIBRO">LIBRO</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Tipo de Archivo (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. PDF, MP3, MP4, EPUB"
                          value={newResourceTipo}
                          onChange={(e) => setNewResourceTipo(e.target.value)}
                          className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                        />
                      </div>
                    </>
                  )}

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowAddResourceModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-350/85 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} shadow-md transition-all`}
                    >
                      Crear Elemento
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


  /* =========================================================================
     MODULE: FINANZAS (CASH FLOW REGISTER + DEPOSITS / WITHDRAWAL - REQUISITO)
     ========================================================================= */
  const renderFinanzasValue = () => {
    // Filter transactions by selected time period
    const now = new Date();
    const filteredTransactions = transactions.filter(tx => {
      if (financeTimeFilter === 'all') return true;
      if (!tx.date) return false;
      
      const txDate = new Date(tx.date + (tx.date.includes('T') ? '' : 'T00:00:00'));
      if (isNaN(txDate.getTime())) return false;

      if (financeTimeFilter === 'day') {
        return txDate.toDateString() === now.toDateString();
      }
      if (financeTimeFilter === 'week') {
        const diffMs = Math.abs(now.getTime() - txDate.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (financeTimeFilter === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const filteredIngresos = filteredTransactions.filter(t => t.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
    const filteredEgresos = filteredTransactions.filter(t => t.type === 'egreso').reduce((a, b) => a + b.amount, 0);
    const filteredSaldo = filteredIngresos - filteredEgresos;

    return (
      <div className="space-y-6">
        
        {/* Time Period Filter Bar */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Filtrar Movimientos por Periodo:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFinanceTimeFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                financeTimeFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Todos los Registros ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFinanceTimeFilter('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                financeTimeFilter === 'month'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => setFinanceTimeFilter('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                financeTimeFilter === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => setFinanceTimeFilter('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                financeTimeFilter === 'day'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Hoy / Día
            </button>
          </div>
        </div>

        {/* Dynamic global metrics sheet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
            <h4 className="text-xs uppercase font-bold tracking-widest text-white/70">
              Saldo Escolar ({financeTimeFilter === 'all' ? 'Neto Total' : financeTimeFilter === 'month' ? 'Del Mes' : financeTimeFilter === 'week' ? 'De la Semana' : 'De Hoy'})
            </h4>
            <h2 className="text-3xl font-extrabold mt-1 leading-none tracking-tight">S/. {filteredSaldo.toLocaleString('es-ES')}</h2>
            <p className="text-[10px] text-white/80 mt-2 font-medium">
              {filteredTransactions.length} movimiento(s) visible(s)
            </p>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10">
              <Coins className="w-24 h-24 stroke-white stroke-1" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Acumulado Entradas (Verde)
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                +S/. {filteredIngresos.toLocaleString('es-ES')}
              </h3>
              <p className="text-[10px] text-gray-450 mt-1 font-medium">Matrículas, Inscripciones, Colegiatura</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                Acumulado Salidas (Rojo)
              </p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                -S/. {filteredEgresos.toLocaleString('es-ES')}
              </h3>
              <p className="text-[10px] text-gray-450 mt-1 font-medium">Pago a Docentes, Honorarios, Gastos Operativos</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Operations cash flow trigger panel */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Terminal de Caja Escolar</h3>
            <p className="text-xs text-gray-500">Agrega ingresos por donación/pagos o retira dinero para pagos a docentes u operacionales.</p>
          </div>
          <div className="flex gap-3">
            <button
              id="btn-withdraw-money"
              type="button"
              onClick={() => {
                setShowFinanceModal('egreso');
                setFinanceForm({ amount: '', concept: '', category: 'Salario Docente', targetId: '' });
              }}
              className="px-5 py-2.5 text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-all flex items-center gap-2"
            >
              <ArrowDownRight className="w-4 h-4" />
              Retirar / Registrar Egreso
            </button>
            <button
              id="btn-deposit-money"
              type="button"
              onClick={() => {
                setShowFinanceModal('ingreso');
                setFinanceForm({ amount: '', concept: '', category: 'Colegiatura', targetId: '' });
              }}
              className={`px-5 py-2.5 text-xs font-bold text-white ${cl.primaryBg} ${cl.primaryHoverBg} rounded-xl transition-all flex items-center gap-2 shadow-sm`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Ingresar / Registrar Ingreso
            </button>
          </div>
        </div>

        {/* Transactions log sheet */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-zinc-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xs font-bold text-gray-450 uppercase tracking-widest">Historial de Transacciones Coherentes</h3>
            <div className="flex items-center gap-2">
              <button
                id="btn-export-transactions-csv"
                type="button"
                onClick={() => {
                  const csvHeaders = [
                    { label: 'ID Transacción', key: (tx: FinancialTransaction) => tx.id },
                    { label: 'Fecha', key: (tx: FinancialTransaction) => tx.date },
                    { label: 'Concepto', key: (tx: FinancialTransaction) => tx.concept },
                    { label: 'Categoría', key: (tx: FinancialTransaction) => tx.category },
                    { label: 'Tipo', key: (tx: FinancialTransaction) => tx.type },
                    { label: 'Monto (USD)', key: (tx: FinancialTransaction) => String(tx.amount) }
                  ];
                  exportToCSV(filteredTransactions, csvHeaders, 'transacciones_financieras_tesla.csv');
                }}
                className="px-3 py-1.5 text-[11px] font-bold text-gray-750 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 border border-gray-200 dark:border-zinc-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Exportar CSV
              </button>
              <button
                id="btn-export-transactions-pdf"
                type="button"
                onClick={() => exportTransactionsToPDF(filteredTransactions, 'Colegio Tesla')}
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
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">ID</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Fecha</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Concepto</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Categoría</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap">Monto</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400 select-none whitespace-nowrap text-right">Estatus contable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-zinc-500 text-xs font-semibold">
                      No hay transacciones registradas en este periodo seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, index) => (
                    <tr key={tx.id} className="hover:bg-gray-50/20 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-[11px] text-gray-500">TX-{index + 1}</td>
                      <td className="p-4 text-gray-550 dark:text-zinc-350">{tx.date}</td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800 dark:text-zinc-200">{tx.concept}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-650 dark:text-zinc-300">
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-4">
                        {tx.type === 'ingreso' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center font-mono">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                            +S/. {tx.amount.toLocaleString('es-ES')}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-450 font-bold flex items-center font-mono">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                            -S/. {tx.amount.toLocaleString('es-ES')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 px-2 py-0.5 rounded-full">
                          Consolidado
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CASH REGISTRATION FINANCE FORM DIALOG BOX */}
        <AnimatePresence>
          {showFinanceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFinanceModal(null)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                    {showFinanceModal === 'ingreso' ? 'Registrar Entrada de Dinero' : 'Registrar Salida / Gasto'}
                  </h3>
                  <button type="button" onClick={() => setShowFinanceModal(null)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleFinanceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Monto en USD ($)</label>
                    <input
                      required
                      type="number"
                      placeholder="150"
                      value={financeForm.amount}
                      onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Concepto o Descripción</label>
                    <input
                      required
                      type="text"
                      placeholder={showFinanceModal === 'ingreso' ? 'Ej. Donativo o Pago Subvención' : 'Ej. Compra de tizas o Servicios de luz'}
                      value={financeForm.concept}
                      onChange={(e) => setFinanceForm({ ...financeForm, concept: e.target.value })}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                      Tipo de Movimiento (Ej. prestacion, paga, etc.)
                    </label>
                    <input
                      type="text"
                      placeholder={showFinanceModal === 'ingreso' ? 'Ej. prestacion' : 'Ej. paga'}
                      value={financeForm.tipo}
                      onChange={(e) => setFinanceForm({ ...financeForm, tipo: e.target.value })}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Categoría contable</label>
                      <select
                        value={financeForm.category}
                        onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value as any })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        {showFinanceModal === 'ingreso' ? (
                          <>
                            <option value="Colegiatura">Colegiatura</option>
                            <option value="Otros">Subvención / Donativo</option>
                          </>
                        ) : (
                          <>
                            <option value="Salario Docente">Salario Docente</option>
                            <option value="Material Educativo">Material Educativo</option>
                            <option value="Servicios">Servicios Operativos</option>
                            <option value="Otros">Otros Egresos</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Entidad Conectada</label>
                      <select
                        value={financeForm.targetId}
                        onChange={(e) => setFinanceForm({ ...financeForm, targetId: e.target.value })}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      >
                        <option value="">Ninguno / General</option>
                        {showFinanceModal === 'ingreso' 
                          ? students.map((s, idx) => <option key={s.id} value={s.id}>{s.name} (Estudiante Nº {idx + 1})</option>)
                          : teachers.map((t, idx) => <option key={t.id} value={t.id}>{t.name} (Docente Nº {idx + 1})</option>)
                        }
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold animate-none">
                    <button
                      type="button"
                      onClick={() => setShowFinanceModal(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-3 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Procesar Transacción
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Database Diagnostics and Error Logs Modal */}
        <AnimatePresence>
          {showErrorLogsModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowErrorLogsModal(false)}
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden space-y-4 max-h-[85vh] flex flex-col"
              >
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>📋 Registro de Errores - Base de Datos Sincronizada</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Sucesión de logs generados en el proceso de carga prioritaria (Supabase ➔ Local Seguro)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowErrorLogsModal(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-450 dark:text-zinc-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  <p className="text-gray-500 dark:text-zinc-400">
                    La aplicación sigue un esquema de carga de datos inteligente. Intenta cargar primero cada tabla en español desde Supabase. Si falla, intenta con el nombre correspondiente en inglés. Si ambas fallas se consolidan, se carga el respaldo local seguro para garantizar la operatividad sin interrupciones.
                  </p>

                  <div className="space-y-2 font-mono bg-zinc-950 text-red-400 p-4 rounded-2xl overflow-x-auto border border-zinc-800 max-h-[40vh]">
                    {errorLogs && errorLogs.length > 0 ? (
                      errorLogs.map((log, idx) => (
                        <div key={idx} className="pb-2 border-b border-zinc-900/60 last:border-0 leading-relaxed text-[11px]">
                          <span className="text-zinc-500">[{idx + 1}]</span> {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-emerald-400 py-2">✓ No se registraron errores de conexión con Supabase. Todo cargó de forma prioritaria de manera correcta.</div>
                    )}
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-3 rounded-2xl flex items-start gap-3">
                    <Coins className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold block text-xs">Respaldo Automático Activo ("Local Seguro")</span>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                        Dado que se detectaron fallos en ciertas tablas, el sistema habilitó el módulo local sin conexión de manera selectiva para las tablas comprometidas. Puede editar, matricular y gestionar los registros normalmente; todos los cambios se guardan localmente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowErrorLogsModal(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors animate-none"
                  >
                    Entendido
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
     MODULE: CONFIGURACION (INTERFACE CUSTOMIZER)
     ========================================================================= */
  const renderConfiguracionValue = () => {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-150">Ajustes del Sistema</h3>
          <p className="text-xs text-gray-400">Modifica la apariencia del portal para ajustarse a tu estilo preferido.</p>
        </div>

        {/* Accent colour picker circles */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Esquema de Colores (Marca)</label>
          <div className="grid grid-cols-2 gap-3">
            {ACCENT_COLORS_METADATA.map((color) => {
              const classes = getThemeClasses(color.value);
              const isSelected = theme.accentColor === color.value;
              return (
                <button
                  id={`config-color-${color.value}`}
                  key={color.value}
                  type="button"
                  onClick={() => updateTheme({ accentColor: color.value })}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all outline-none ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-zinc-800 font-bold'
                      : 'border-gray-100 hover:border-gray-200 dark:border-zinc-800 dark:hover:border-zinc-750'
                  }`}
                >
                  <span 
                    style={{ backgroundColor: color.hex }}
                    className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-sm"
                  />
                  <span className="text-xs text-gray-750 dark:text-zinc-200">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Estilo y Filosofía Visual</label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'frosted-glass', label: 'Cristal Esmerilado', desc: 'Diseño moderno translúcido con desenfoque y efecto de vidrio' }
            ].map((st) => {
              return (
                <button
                  id={`config-style-${st.value}`}
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

        {/* Dark Light mode */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Modo de Apariencia</label>
          <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-zinc-950 p-1 rounded-xl">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                id={`config-mode-${mode}`}
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
          <p className="text-[10px] text-gray-400 leading-normal">
            El tema del sistema por defecto respetará automáticamente la configuración de brillo de tu dispositivo corporativo.
          </p>
        </div>

        {/* Sidebar Mini-Icons option */}
        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Barra Lateral (Escritorio)</label>
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-200/50 dark:border-zinc-800">
            <div className="space-y-1 pr-4">
              <span className="text-xs font-bold block text-gray-800 dark:text-zinc-200">Ocultar de todo al Colapsar</span>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">
                Si se activa, el panel colapsado se reduce a una línea fina de adorno y solo se despliega por completo al pasar el mouse.
              </p>
            </div>
            <button
              id="config-sidebar-toggle-button"
              type="button"
              onClick={() => handleToggleSidebarHideIcons(!sidebarHideIcons)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                sidebarHideIcons ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-800'
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

        {/* AI Daily Summary Toggle Option */}
        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Asistente de Inteligencia Artificial (IA)</label>
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-200/50 dark:border-zinc-800">
            <div className="space-y-1 pr-4">
              <span className="text-xs font-bold block text-gray-800 dark:text-zinc-200">Resumen del Estado de Hoy con IA</span>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">
                Muestra una tarjeta dinámica en la pantalla principal que recopila datos de clases, ingresos y egresos, brindando un estado diario resumido mediante Groq.
              </p>
            </div>
            <button
              id="config-ai-summary-toggle"
              type="button"
              onClick={() => handleToggleAiSummary(!showAiSummary)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showAiSummary ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showAiSummary ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Vault Passcode Configuration */}
        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Seguridad de Módulos</label>
          <div className="p-3.5 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-200/50 dark:border-zinc-800 space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold block text-gray-800 dark:text-zinc-200">Clave de Acceso a Bóveda de Facturas</span>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">
                Establece la clave de seguridad requerida para entrar a la Bóveda de Facturas y visualizar los comprobantes cargados en Cloudinary.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={12}
                value={vaultPasscode}
                onChange={(e) => setVaultPasscode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="Ej. 1234"
                className="w-full max-w-[200px] px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-gray-400 font-medium italic">Sugerido usar solo letras y números.</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-zinc-850 flex items-center justify-between text-xs text-gray-450 font-mono">
          <span>Licenciado para: Directiva Colegio</span>
          <span className="font-bold text-gray-400">ENLACEC Prod</span>
        </div>

        {/* Vercel Environment Variables Manager & Diagnostic Card */}
        <VercelEnvConfigCard />
      </div>
    );
  };


  /* =========================================================================
     MODULE: CURSOS (DEDICATED COURSES PANEL)
     ========================================================================= */
  const renderCursosValue = () => {
    const filteredCursos = cursos.filter(c => 
      c.nombre.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(courseSearch.toLowerCase()))
    );

    // Calculate dynamic stats
    const totalCursos = cursos.length;
    const avgPago = totalCursos > 0 
      ? cursos.reduce((acc, c) => acc + (c.pago || 0), 0) / totalCursos 
      : 0;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header section with search & stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-5 rounded-2xl border border-indigo-100/50 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Director de Cursos Académicos</h4>
              <p className="text-xs text-gray-500 mt-1">
                Administra las materias y asignaturas de enseñanza disponibles en la institución. Define la tarifa horaria base aplicable a las asistencias registradas por los docentes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCourseModal(true)}
              className={`mt-4 w-full py-2.5 text-xs font-bold text-white rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15`}
            >
              <Plus className="w-4 h-4" />
              Crear Nuevo Curso
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-850 pb-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cursos Registrados</span>
              <BookOpen className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono">{totalCursos}</span>
              <span className="text-xs text-gray-450 block mt-1">Materias activas de enseñanza</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-850 pb-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pago Promedio / Hora</span>
              <Coins className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">S/. {avgPago.toFixed(2)}</span>
              <span className="text-xs text-gray-450 block mt-1">Compensación horaria referencial</span>
            </div>
          </div>
        </div>

        {/* Filter bar and Table card */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar curso por nombre o descripción..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-950 dark:text-zinc-100 rounded-xl outline-none transition-all ${cl.ring}`}
              />
            </div>
            {courseSearch && (
              <button
                type="button"
                onClick={() => setCourseSearch('')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-zinc-950/60 border-b border-gray-100 dark:border-zinc-850">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Nº</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Curso</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Descripción</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tarifa / Hora (S/.)</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                {filteredCursos.map((curso, idx) => (
                  <tr key={curso.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-gray-800 dark:text-zinc-200">{curso.nombre}</td>
                    <td className="px-4 py-3.5 text-gray-500 max-w-sm truncate" title={curso.descripcion}>
                      {curso.descripcion || <span className="italic text-gray-400">Sin descripción</span>}
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      S/. {curso.pago.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseForEdit(curso);
                            setEditCourseName(curso.nombre);
                            setEditCourseDesc(curso.descripcion || '');
                            setEditCoursePago(curso.pago);
                            setShowEditCourseModal(true);
                          }}
                          className={`p-2 text-gray-400 ${cl.hoverText} hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all`}
                          title="Editar Curso"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(curso.id, curso.nombre)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                          title="Eliminar Curso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCursos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      No se encontraron cursos que coincidan con la búsqueda.
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
     MODULE: SERVICIOS (DEDICATED SERVICES PANEL)
     ========================================================================= */
  const renderServiciosValue = () => {
    const filteredServicios = servicios.filter(s => 
      s.nombre.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      (s.descripcion && s.descripcion.toLowerCase().includes(serviceSearch.toLowerCase()))
    );

    // Dynamic stats
    const totalServicios = servicios.length;
    const linkedServicesCount = servicios.filter(s => {
      const links = servicioProfesores.filter(link => link.id_servicio === s.id);
      return links.length > 0;
    }).length;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header section with stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-purple-100/50 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Plataforma de Servicios Académicos</h4>
              <p className="text-xs text-gray-500 mt-1">
                Los servicios son paquetes comerciales que agrupan cursos individuales. Vincula cursos y asigna profesores calificados para su dictado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddServiceModal(true)}
              className={`mt-4 w-full py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-indigo-650 to-purple-600 hover:from-indigo-700 hover:to-purple-750 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15`}
            >
              <Plus className="w-4 h-4" />
              Crear Nuevo Servicio
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-850 pb-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Servicios Activos</span>
              <Layers className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono">{totalServicios}</span>
              <span className="text-xs text-gray-450 block mt-1">Paquetes educativos vigentes</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-850 pb-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Servicios con Personal</span>
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{linkedServicesCount}</span>
              <span className="text-xs text-gray-450 block mt-1">Suscripciones con docentes asignados</span>
            </div>
          </div>
        </div>

        {/* Filter bar and Grid of Services */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar servicio por nombre o descripción..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-950 dark:text-zinc-100 rounded-xl outline-none transition-all ${cl.ring}`}
              />
            </div>
            {serviceSearch && (
              <button
                type="button"
                onClick={() => setServiceSearch('')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServicios.map((serv, idx) => {
              // Find course links for this service
              const linkedCourseIds = servicioCursos
                .filter(link => (link.servicioId === serv.id || link.servicio_id === serv.id))
                .map(link => (link.cursoId || link.curso_id));
              const linkedCourses = cursos.filter(c => linkedCourseIds.includes(c.id));

              // Find teacher links for this service
              const linkedTeacherIds = servicioProfesores
                .filter(link => link.id_servicio === serv.id)
                .map(link => link.id_profesor);
              const linkedTeachers = teachers.filter(t => linkedTeacherIds.includes(t.id));

              return (
                <div key={serv.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group overflow-hidden">
                  <div className="space-y-4">
                    {/* Upper title row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mono font-bold py-0.5 px-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md">
                          SERVICIO Nº {idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-gray-800 dark:text-zinc-150 mt-2 tracking-tight leading-snug">
                          {serv.nombre}
                        </h4>
                        <p className="text-xs text-gray-450 mt-1 leading-relaxed">
                          {serv.descripcion || 'Sin descripción detallada.'}
                        </p>
                      </div>

                      {/* Top Action buttons */}
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-950 p-1 rounded-xl border border-gray-100 dark:border-zinc-850 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServiceForEdit(serv);
                            setEditServiceName(serv.nombre);
                            setEditServiceDesc(serv.descripcion || '');
                            setEditServiceDuracion(serv.duracion !== undefined && serv.duracion !== null ? String(serv.duracion) : '');
                            setEditServicePago(serv.pago !== undefined && serv.pago !== null ? String(serv.pago) : '');
                            setShowEditServiceModal(true);
                          }}
                          className={`p-1.5 text-gray-400 ${cl.hoverText} hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all`}
                          title="Editar Servicio"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(serv.id, serv.nombre)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all"
                          title="Eliminar Servicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meta info tags */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {serv.duracion !== undefined && serv.duracion !== null && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-850 rounded-lg text-[10px] font-semibold font-mono">
                          🕒 {serv.duracion} min
                        </div>
                      )}
                      {serv.pago !== undefined && serv.pago !== null && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/20 rounded-lg text-[10px] font-extrabold font-mono">
                          💰 S/. {Number(serv.pago).toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Linked Courses */}
                    <div className="pt-3 border-t border-gray-100 dark:border-zinc-850/65 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">
                          Cursos Vinculados ({linkedCourses.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServiceId(serv.id);
                            setShowLinkCourseModal(true);
                          }}
                          className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          Vincular Curso
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedCourses.map(curso => (
                          <span
                            key={curso.id}
                            onClick={async () => {
                              if (window.confirm(`¿Deseas desvincular el curso "${curso.nombre}" de este servicio?`)) {
                                await unlinkCourseFromService(serv.id, curso.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            title="Haga clic para desvincular"
                          >
                            {curso.nombre} <X className="w-2.5 h-2.5 opacity-60" />
                          </span>
                        ))}
                        {linkedCourses.length === 0 && (
                          <span className="text-[10px] text-gray-400 italic">No hay materias vinculadas. Vincula un curso para habilitar el dictado.</span>
                        )}
                      </div>
                    </div>

                    {/* Linked Teachers */}
                    <div className="pt-3 border-t border-gray-100 dark:border-zinc-850/65 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">
                          Docentes Asignados ({linkedTeachers.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServiceId(serv.id);
                            setShowLinkTeacherModal(true);
                          }}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          Asignar Docente
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedTeachers.map(teacher => (
                          <div
                            key={teacher.id}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/40"
                          >
                            <span>{teacher.name}</span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`¿Deseas desvincular al docente "${teacher.name}" de este servicio?`)) {
                                  await unlinkTeacherFromService(serv.id, teacher.id);
                                }
                              }}
                              className="p-0.5 rounded hover:bg-red-500/10 text-emerald-600 hover:text-red-600 dark:text-emerald-400 dark:hover:text-red-400 transition-all cursor-pointer"
                              title="Retirar docente de este servicio"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {linkedTeachers.length === 0 && (
                          <span className="text-[10px] text-gray-450 italic">Haga clic en 'Asignar Docente' para definir profesores habilitados.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredServicios.length === 0 && (
              <div className="md:col-span-2 text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-150 dark:border-zinc-800 text-gray-450 text-xs">
                No se encontraron servicios registrados.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCourseAndServiceModals = () => {
    return (
      <>
        {/* MODAL: ADD COURSE */}
        <AnimatePresence>
          {showAddCourseModal && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddCourseModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Registrar Nuevo Curso</h3>
                  <button type="button" onClick={() => setShowAddCourseModal(false)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre del Curso</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Reforzamiento de Matemática"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                    <textarea
                      placeholder="Breve sumilla curricular..."
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                      rows={3}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Tarifa de Pago por Hora (S/.)</label>
                    <input
                      required
                      type="number"
                      placeholder="Ej. 25.00"
                      value={newCoursePago}
                      onChange={(e) => setNewCoursePago(Number(e.target.value))}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowAddCourseModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Guardar Curso
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: ADD SERVICE */}
        <AnimatePresence>
          {showAddServiceModal && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddServiceModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Registrar Nuevo Servicio</h3>
                  <button type="button" onClick={() => setShowAddServiceModal(false)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateService} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre del Servicio (Agrupador)</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Ciclo Anual de Reforzamiento Integral"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                    <textarea
                      placeholder="Detalle comercial o académico del servicio..."
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      rows={4}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Duración (minutos)</label>
                      <input
                        type="number"
                        placeholder="Ej. 60"
                        value={newServiceDuracion}
                        onChange={(e) => setNewServiceDuracion(e.target.value)}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Pago / Costo (S/.)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ej. 150.00"
                        value={newServicePago}
                        onChange={(e) => setNewServicePago(e.target.value)}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Guardar Servicio
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: LINK COURSE TO SERVICE */}
        <AnimatePresence>
          {showLinkCourseModal && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLinkCourseModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Vincular Curso a Servicio</h3>
                  <button type="button" onClick={() => setShowLinkCourseModal(false)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleLinkCourse} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Servicio Seleccionado</label>
                    <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-gray-750 dark:text-zinc-300">
                      {servicios.find(s => s.id === selectedServiceId)?.nombre || 'Ninguno'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Seleccionar Curso a Agregar</label>
                    <select
                      required
                      value={selectedCourseToLinkId}
                      onChange={(e) => setSelectedCourseToLinkId(e.target.value)}
                      className={`w-full p-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    >
                      <option value="">-- Elige un curso --</option>
                      {cursos
                        .filter(c => {
                          // Filter out courses that are already linked to this service
                          const alreadyLinked = servicioCursos.some(link => link.servicioId === selectedServiceId && link.cursoId === c.id);
                          return !alreadyLinked;
                        })
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.nombre} (S/. {c.pago.toFixed(2)}/h)</option>
                        ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowLinkCourseModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedCourseToLinkId}
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} disabled:opacity-50`}
                    >
                      Vincular Curso
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: LINK TEACHER TO SERVICE */}
        <AnimatePresence>
          {showLinkTeacherModal && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLinkTeacherModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Asignar Docente a Servicio</h3>
                  <button type="button" onClick={() => setShowLinkTeacherModal(false)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleLinkTeacher} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Servicio Seleccionado</label>
                    <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-gray-750 dark:text-zinc-300">
                      {servicios.find(s => s.id === selectedServiceId)?.nombre || 'Ninguno'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Seleccionar Docente a Asignar</label>
                    <select
                      required
                      value={selectedTeacherToLinkId}
                      onChange={(e) => setSelectedTeacherToLinkId(e.target.value)}
                      className={`w-full p-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    >
                      <option value="">-- Elige un docente --</option>
                      {teachers
                        .filter(t => {
                          // Filter out administrators!
                          const r = (t.rol || '').toLowerCase();
                          const isAdmin = r === 'admin' || r === 'administrador' || r === 'director';
                          if (isAdmin) return false;

                          // Filter out teachers already linked to this service
                          const alreadyLinked = servicioProfesores.some(link => link.id_servicio === selectedServiceId && link.id_profesor === t.id);
                          return !alreadyLinked;
                        })
                        .map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Espec: {t.subject})</option>
                        ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowLinkTeacherModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedTeacherToLinkId}
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} disabled:opacity-50`}
                    >
                      Asignar Docente
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: EDIT COURSE */}
        <AnimatePresence>
          {showEditCourseModal && selectedCourseForEdit && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditCourseModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Editar Curso</h3>
                  <button type="button" onClick={() => setShowEditCourseModal(false)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateCourse} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre del Curso</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Reforzamiento de Matemática"
                      value={editCourseName}
                      onChange={(e) => setEditCourseName(e.target.value)}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                    <textarea
                      placeholder="Breve sumilla curricular..."
                      value={editCourseDesc}
                      onChange={(e) => setEditCourseDesc(e.target.value)}
                      rows={3}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Tarifa de Pago por Hora (S/.)</label>
                    <input
                      required
                      type="number"
                      placeholder="Ej. 25.00"
                      value={editCoursePago}
                      onChange={(e) => setEditCoursePago(Number(e.target.value))}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowEditCourseModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Actualizar Curso
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: EDIT SERVICE */}
        <AnimatePresence>
          {showEditServiceModal && selectedServiceForEdit && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditServiceModal(false)}
                className="fixed inset-0 bg-black/25 backdrop-blur-[5px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-850 mb-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Editar Servicio</h3>
                  <button type="button" onClick={() => setShowEditServiceModal(false)} className="p-1 hover:bg-gray-150 rounded text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateService} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre del Servicio</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Ciclo Anual de Reforzamiento"
                      value={editServiceName}
                      onChange={(e) => setEditServiceName(e.target.value)}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                    <textarea
                      placeholder="Detalle comercial o académico del servicio..."
                      value={editServiceDesc}
                      onChange={(e) => setEditServiceDesc(e.target.value)}
                      rows={4}
                      className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Duración (minutos)</label>
                      <input
                        type="number"
                        placeholder="Ej. 60"
                        value={editServiceDuracion}
                        onChange={(e) => setEditServiceDuracion(e.target.value)}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Pago / Costo (S/.)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ej. 150.00"
                        value={editServicePago}
                        onChange={(e) => setEditServicePago(e.target.value)}
                        className={`w-full p-2 py-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl outline-none transition-all ${cl.ring}`}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-150 dark:border-zinc-850 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowEditServiceModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg}`}
                    >
                      Actualizar Servicio
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
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
      case 'estudiantes':
        return renderEstudiantesValue();
      case 'docentes':
        return renderDocentesValue();
      case 'cursos':
        return renderCursosValue();
      case 'servicios':
        return renderServiciosValue();
      case 'recursos':
        return renderRecursosValue();
      case 'finanzas':
        return renderFinanzasValue();
      case 'facturas':
        return <BovedaFacturasView />;
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

      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedTeacher(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-150 dark:border-zinc-800 w-full max-w-lg overflow-hidden relative z-10"
            >
              {/* Card Header Profile Banner */}
              <div className="relative h-24 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-950/30 dark:via-purple-950/15 border-b border-gray-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-gray-150 dark:hover:bg-zinc-800 text-gray-500 hover:text-gray-700 dark:text-zinc-400 rounded-full transition-all z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Avatar & Primary Info */}
              <div className="px-6 pb-6 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10 mb-5 text-center sm:text-left">
                  <UserAvatar
                    src={selectedTeacher.avatarUrl || selectedTeacher.foto_url}
                    name={selectedTeacher.name}
                    className="w-20 h-20 rounded-2xl ring-4 ring-white dark:ring-zinc-900 shadow-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-[9px] font-extrabold uppercase py-0.5 px-2 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono">
                        {selectedTeacher.codigo || `DOC-${teachers.findIndex(t => t.id === selectedTeacher.id) !== -1 ? teachers.findIndex(t => t.id === selectedTeacher.id) + 1 : selectedTeacher.id.substring(0, 4).toUpperCase()}`}
                      </span>
                      {(selectedTeacher.activado !== undefined ? selectedTeacher.activado : true) ? (
                        <span className="text-[9px] font-extrabold uppercase py-0.5 px-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                          Cuenta Activa
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase py-0.5 px-2 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-zinc-150 mt-1.5 tracking-tight leading-snug">
                      {selectedTeacher.name}
                    </h3>
                    <p className="text-xs text-gray-450 dark:text-zinc-400 font-medium">
                      Especialista en {selectedTeacher.subject}
                    </p>
                  </div>
                </div>

                {/* Grid of details */}
                <div className="grid grid-cols-2 gap-4.5 bg-gray-50/50 dark:bg-zinc-950/40 p-4.5 rounded-2xl border border-gray-100 dark:border-zinc-850/60 max-h-[40vh] overflow-y-auto">
                  
                  {/* Nombre Completo Desglosado */}
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">Nombre</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-zinc-300 block mt-0.5">{selectedTeacher.nombre || selectedTeacher.name.replace('Prof. ', '')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">Apellido</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-zinc-300 block mt-0.5">{selectedTeacher.apellido || ''}</span>
                    </div>
                  </div>

                  {/* Correo & Teléfono */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">Correo Electrónico</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-300 block mt-0.5 break-all">{selectedTeacher.email || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">Teléfono / Celular</span>
                    <span className="text-xs font-semibold font-mono text-gray-800 dark:text-zinc-300 block mt-0.5">{selectedTeacher.phone || selectedTeacher.telefono || 'No registrado'}</span>
                  </div>

                  {/* DNI & Edad */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">DNI / Documento</span>
                    <span className="text-xs font-semibold font-mono text-gray-800 dark:text-zinc-300 block mt-0.5">{selectedTeacher.dni || 'Sin documento'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">Edad</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-300 block mt-0.5">{selectedTeacher.edad || 35} años</span>
                  </div>

                   {/* Contrato & Rol */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">Rol de Acceso</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-300 block mt-0.5 capitalize">{selectedTeacher.rol || 'Profesor'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block">Vence Contrato</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-300 block mt-0.5 font-mono">{selectedTeacher.fecha_vencimiento || '2028'}</span>
                  </div>

                  {/* Cursos Asignados */}
                  <div className="col-span-2 pt-3 border-t border-gray-100 dark:border-zinc-850/50">
                    <div>
                      <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block mb-1">Cursos y Clases Asignadas</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {Array.isArray(selectedTeacher.activeCourses) ? (
                          selectedTeacher.activeCourses.map((curso, index) => (
                            <span
                              key={index}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${cl.lightBg} ${cl.primaryText}`}
                            >
                              {curso}
                            </span>
                          ))
                        ) : (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${cl.lightBg} ${cl.primaryText}`}>
                            {selectedTeacher.activeCourses}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Servicios Vinculados (servicio_profesor) - ONLY FOR TEACHERS, NOT ADMINISTRATORS */}
                  {(() => {
                    const r = (selectedTeacher.rol || '').toLowerCase();
                    const isAdmin = r === 'admin' || r === 'administrador' || r === 'director';
                    if (isAdmin) return null;

                    return (
                      <div className="col-span-2 pt-3 border-t border-gray-100 dark:border-zinc-850/50">
                        <div>
                          <span className="text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider block mb-1">Servicios Vinculados</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {(() => {
                              const teacherServicesLinks = servicioProfesores.filter(link => link.id_profesor === selectedTeacher.id);
                              const teacherServices = servicios.filter(s => teacherServicesLinks.some(link => link.id_servicio === s.id));
                              
                              return (
                                <>
                                  {teacherServices.map(serv => (
                                    <div
                                      key={serv.id}
                                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/40"
                                    >
                                      <span>{serv.nombre}</span>
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (window.confirm(`¿Deseas desvincular al docente de este servicio "${serv.nombre}"?`)) {
                                            await unlinkTeacherFromService(serv.id, selectedTeacher.id);
                                          }
                                        }}
                                        className="p-0.5 rounded hover:bg-red-500/10 text-emerald-600 hover:text-red-600 dark:text-emerald-400 dark:hover:text-red-400 transition-all cursor-pointer"
                                        title="Retirar de servicio"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  {teacherServices.length === 0 && (
                                    <span className="text-[10px] text-gray-450 italic">No tiene servicios vinculados</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Quick assignment dropdown directly inside the profile details! */}
                          {(() => {
                            const teacherServicesLinks = servicioProfesores.filter(link => link.id_profesor === selectedTeacher.id);
                            const teacherServices = servicios.filter(s => teacherServicesLinks.some(link => link.id_servicio === s.id));
                            const unlinkedServices = servicios.filter(s => !teacherServices.some(ts => ts.id === s.id));
                            
                            if (unlinkedServices.length === 0) return null;
                            
                            return (
                              <div className="mt-3 flex items-center gap-2">
                                <select
                                  onChange={async (e) => {
                                    const sId = e.target.value;
                                    if (sId) {
                                      await linkTeacherToService(sId, selectedTeacher.id);
                                      e.target.value = ''; // Reset select
                                    }
                                  }}
                                  className="text-[11px] p-1.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-750 text-gray-800 dark:text-zinc-300 rounded-lg outline-none max-w-[200px]"
                                >
                                  <option value="">+ Vincular a Servicio...</option>
                                  {unlinkedServices.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                </div>

                {/* Footer buttons with premium interaction triggers */}
                <div className="mt-6 pt-4 border-t border-gray-150 dark:border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        startEditTeacher(selectedTeacher);
                        setSelectedTeacher(null);
                      }}
                      className="px-3.5 py-2 border border-gray-200 hover:border-gray-350 dark:border-zinc-700 dark:hover:border-zinc-650 text-gray-750 dark:text-zinc-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    >
                      <Edit className={`w-3.5 h-3.5 ${cl.primaryText}`} />
                      Editar Ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete({ id: selectedTeacher.id, type: 'teacher', name: selectedTeacher.name });
                        setSelectedTeacher(null);
                      }}
                      className="px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-955/20 text-red-600 dark:text-red-400 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Dar de baja
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const teacherAttendance = attendance.filter(r => r.teacherId === selectedTeacher.id);
                        generateTeacherBoleta(selectedTeacher, teacherAttendance);
                      }}
                      className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar Boleta (PDF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeacher(null)}
                      className={`px-4 py-2 text-white font-bold rounded-xl ${cl.primaryBg} ${cl.primaryHoverBg} shadow-sm`}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {imageToCrop && (
          <ImageCropper
            imageSrc={imageToCrop.src}
            onCancel={() => setImageToCrop(null)}
            onCrop={(croppedBase64) => {
              if (imageToCrop.target === 'newStudent') {
                setNewStudentData({ ...newStudentData, foto_url: croppedBase64 });
              } else if (imageToCrop.target === 'editStudent') {
                setEditStudentData({ ...editStudentData, ...({ foto_url: croppedBase64 } as any) });
              } else if (imageToCrop.target === 'newTeacher') {
                setNewTeacherData({ ...newTeacherData, foto_url: croppedBase64 });
              } else if (imageToCrop.target === 'editTeacher') {
                setEditTeacherData({ ...editTeacherData, foto_url: croppedBase64 });
              }
              setImageToCrop(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <DeleteConfirmation
            name={confirmDelete.name}
            type={confirmDelete.type}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => {
              const { id, type, name, extraAction } = confirmDelete;
              try {
                if (type === 'student') {
                  deleteStudent(id);
                  setSuccessFeedback({
                    type: 'deleted',
                    message: `El estudiante "${name}" ha sido eliminado del sistema de manera exitosa.`
                  });
                } else if (type === 'teacher') {
                  deleteTeacher(id);
                  setSuccessFeedback({
                    type: 'deleted',
                    message: `El docente "${name}" ha sido dado de baja de manera exitosa.`
                  });
                } else if (type === 'resource') {
                  deleteResource(id);
                  if (extraAction) {
                    try {
                      extraAction();
                    } catch (extraErr) {
                      console.error("Error running extraAction on delete:", extraErr);
                    }
                  }
                  setSuccessFeedback({
                    type: 'deleted',
                    message: `El recurso "${name}" ha sido eliminado de manera exitosa.`
                  });
                }
              } catch (err) {
                console.error("Error executing delete actions:", err);
              } finally {
                setConfirmDelete(null);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Animated Trash Bin Overlay */}
      <AnimatePresence>
        {isDraggingSelected && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: isHoveringTrash ? 1.05 : 1,
              backgroundColor: isHoveringTrash ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.7)'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 15, stiffness: 180 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 p-6 rounded-2xl border backdrop-blur-md transition-colors ${
              isHoveringTrash 
                ? 'border-red-500 shadow-lg shadow-red-500/20 text-red-500' 
                : 'border-white/10 text-white shadow-xl shadow-black/30'
            }`}
            onDragOver={handleDragOverTrash}
            onDragLeave={handleDragLeaveTrash}
            onDrop={handleDropOnTrash}
          >
            {/* Visual ripple effect inside trash bin */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-1">
              <motion.div 
                animate={{ 
                  scale: isHoveringTrash ? [1, 1.25, 1] : 1,
                  opacity: isHoveringTrash ? [0.4, 0.8, 0.4] : 0.4
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full bg-red-500/10"
              />
              <Trash2 className={`w-8 h-8 transition-transform duration-300 ${isHoveringTrash ? 'rotate-12 scale-110 text-red-500' : 'text-gray-300'}`} />
            </div>
            
            <div className="text-center select-none">
              <h5 className="font-extrabold text-sm tracking-wide uppercase">
                {isHoveringTrash ? '¡Suelta para eliminar!' : 'Arrastra aquí para eliminar'}
              </h5>
              <p className="text-[11px] text-gray-300 dark:text-zinc-400 mt-1">
                Eliminarás los {draggedType === 'student' ? 'estudiantes' : 'docentes'} seleccionados
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {bulkDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBulkDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-amber-500" />
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400">
                  <Trash2 className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Confirmar Eliminación en Bloque
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Estás a punto de eliminar/dar de baja permanentemente a <span className="font-bold text-red-650 dark:text-red-400">{bulkDeleteConfirm.names.length}</span> {bulkDeleteConfirm.type === 'student' ? 'estudiante(s)' : 'docente(s)'}:
                  </p>
                </div>
              </div>
              
              {/* List of names with custom styling */}
              <div className="mt-4 max-h-40 overflow-y-auto bg-gray-50 dark:bg-zinc-950/50 rounded-xl p-3 border border-gray-105 dark:border-zinc-850 space-y-1.5 scrollbar-thin">
                {bulkDeleteConfirm.names.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-750 dark:text-zinc-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-[11px] text-gray-400 mt-3 italic">
                Esta acción es irreversible y removerá todos los registros asociados en la base de datos.
              </p>
              
              {/* Actions buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBulkDeleteConfirm(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-500/15 hover:shadow-red-500/25 transition-all"
                >
                  Sí, Eliminar de Todos Modos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successFeedback && (
          <SuccessFeedback
            type={successFeedback.type}
            message={successFeedback.message}
            onClose={() => setSuccessFeedback(null)}
          />
        )}
      </AnimatePresence>

      {renderCourseAndServiceModals()}
    </div>
  );
};
