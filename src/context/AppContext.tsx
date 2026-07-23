/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadToCloudinaryClient } from '../services/clientServices';
import { 
  User, 
  Student, 
  Teacher, 
  ResourceItem, 
  FinancialTransaction, 
  AttendanceRecord, 
  AppThemeConfig, 
  SchoolNews,
  AppNotification,
  AccentColor,
  Course,
  Service,
  ServiceCourse,
  ServiceTeacher,
  Nota,
  Factura
} from '../types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (phone: string, passwordStr: string) => boolean;
  logout: () => void;
  changeTeacherPassword: (id: string, newPass: string) => void;
  
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<Student>;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  
  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  
  resources: ResourceItem[];
  addResource: (parentId: string | null, resource: Omit<ResourceItem, 'id' | 'updatedAt'>) => void;
  deleteResource: (id: string) => void;
  
  transactions: FinancialTransaction[];
  addTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'date'>) => void;
  balance: number;
  
  attendance: AttendanceRecord[];
  registerAttendance: (record: Omit<AttendanceRecord, 'id' | 'time'>) => void;
  
  // Courses and Services
  cursos: Course[];
  servicios: Service[];
  servicioCursos: ServiceCourse[];
  servicioProfesores: ServiceTeacher[];
  refreshCursos: () => Promise<Course[] | null>;
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  linkCourseToService: (serviceId: string, courseId: string) => Promise<void>;
  unlinkCourseFromService: (serviceId: string, courseId: string) => Promise<void>;
  linkTeacherToService: (serviceId: string, teacherId: string) => Promise<void>;
  unlinkTeacherFromService: (serviceId: string, teacherId: string) => Promise<void>;
  
  notas: Nota[];
  addNota: (nota: Omit<Nota, 'id'>) => Promise<void>;
  updateNota: (nota: Nota) => Promise<void>;
  deleteNota: (id: string) => Promise<void>;
  
  theme: AppThemeConfig;
  updateTheme: (theme: Partial<AppThemeConfig>) => void;
  
  news: SchoolNews[];
  addNews: (newsItem: Omit<SchoolNews, 'id' | 'date'>) => void;
  updateNews: (newsItem: SchoolNews) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  uploadNewsImage: (bucket: 'avisos' | 'noticias', fileName: string, fileOrDataUrl: File | string) => Promise<string | null>;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  addPushNotification: (notifData: { title: string; body: string; type?: string; image_url?: string; send_to_all?: boolean }) => Promise<void>;
  requestBrowserNotificationPermission: () => Promise<boolean>;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  errorLogs?: string[];
  supabaseStatus?: 'connected' | 'disconnected' | 'loading' | 'error';
  uploadProgress: {
    isOpen: boolean;
    progress: number;
    title: string;
    status: 'idle' | 'uploading' | 'success' | 'error';
  };
  setUploadProgress: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    progress: number;
    title: string;
    status: 'idle' | 'uploading' | 'success' | 'error';
  }>>;
  
  facturas: Factura[];
  addFactura: (facturaData: Omit<Factura, 'id' | 'created_at'>) => Promise<Factura>;
  updateFacturaStatus: (id: string, status: 'emitida' | 'pagada' | 'anulada') => Promise<void>;
  deleteFactura: (id: string) => Promise<void>;
  vaultPasscode: string;
  setVaultPasscode: (code: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial high-fidelity Mock Data in Spanish!
const INITIAL_STUDENTS: Student[] = [
  {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb01',
    nombre: 'Sofía',
    apellido: 'Valentino',
    contacto: 987654321,
    grado: 10,
    nivel: 'Secundaria',
    observacion: 'Participación y desempeño destacado.',
    estado: true,
    created_at: '2026-06-15T08:00:00.000Z',
    name: 'Sofía Valentino',
    email: 'sofia.val@sistema.edu',
    grade: '10° Grado',
    section: 'A',
    parentName: 'María Valentino',
    parentPhone: '+51 987 654 321',
    balance: 0,
    grades: [
      { subject: 'Matemáticas', score: 18 },
      { subject: 'Ciencias', score: 16 },
      { subject: 'Historia', score: 19 },
    ],
    attendanceRate: 98,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: '56af0b41-f762-4b2a-bf34-9721dafc3002',
    nombre: 'Mateo',
    apellido: 'Quispe',
    contacto: 912345678,
    grado: 11,
    nivel: 'Secundaria',
    observacion: 'Muestra interés pero requiere tutoría extra.',
    estado: true,
    created_at: '2026-06-15T08:30:00.000Z',
    name: 'Mateo Quispe',
    email: 'mateo.quispe@sistema.edu',
    grade: '11° Grado',
    section: 'B',
    parentName: 'Juan Quispe',
    parentPhone: '+51 912 345 678',
    balance: 150,
    grades: [
      { subject: 'Matemáticas', score: 14 },
      { subject: 'Ciencias', score: 15 },
      { subject: 'Historia', score: 12 },
    ],
    attendanceRate: 92,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: 'e281358d-7bf5-427f-94de-5f6cc810c003',
    nombre: 'Camila',
    apellido: 'Rojas',
    contacto: 965432109,
    grado: 10,
    nivel: 'Secundaria',
    observacion: 'Excelente conducta y dedicación académica.',
    estado: true,
    created_at: '2026-06-15T09:00:00.000Z',
    name: 'Camila Rojas',
    email: 'camila.rojas@sistema.edu',
    grade: '10° Grado',
    section: 'B',
    parentName: 'Andrés Rojas',
    parentPhone: '+51 965 432 109',
    balance: 0,
    grades: [
      { subject: 'Matemáticas', score: 20 },
      { subject: 'Ciencias', score: 19 },
      { subject: 'Historia', score: 17 },
    ],
    attendanceRate: 100,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: '8ef93db2-cf94-4d89-9ef9-c29013c8e004',
    nombre: 'Lucas',
    apellido: 'Mendoza',
    contacto: 945782134,
    grado: 11,
    nivel: 'Secundaria',
    observacion: 'Buen rendimiento, muy participativo en el aula.',
    estado: true,
    created_at: '2026-06-15T09:15:00.000Z',
    name: 'Lucas Mendoza',
    email: 'lucas.mendoza@sistema.edu',
    grade: '11° Grado',
    section: 'A',
    parentName: 'Fabiola Carranza',
    parentPhone: '+51 945 782 134',
    balance: 150,
    grades: [
      { subject: 'Matemáticas', score: 11 },
      { subject: 'Ciencias', score: 13 },
      { subject: 'Historia', score: 14 },
    ],
    attendanceRate: 85,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  },
  {
    id: '012ea351-46da-4bad-bd23-64efbc78f005',
    nombre: 'Valentina',
    apellido: 'Díaz',
    contacto: 999888777,
    grado: 10,
    nivel: 'Secundaria',
    observacion: 'Ausente por temas médicos recurrentes.',
    estado: false,
    created_at: '2026-06-15T10:00:00.000Z',
    name: 'Valentina Díaz',
    email: 'valentina.diaz@sistema.edu',
    grade: '10° Grado',
    section: 'A',
    parentName: 'Carlos Díaz',
    parentPhone: '+51 999 888 777',
    balance: 0,
    grades: [
      { subject: 'Matemáticas', score: 15 },
      { subject: 'Ciencias', score: 17 },
      { subject: 'Historia', score: 15 },
    ],
    attendanceRate: 95,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120',
    status: 'inactive'
  },
  {
    id: 'd9e23ba8-cf94-4d89-9ef9-c29013c8e006',
    nombre: 'Diego',
    apellido: 'Torres',
    contacto: 988776655,
    grado: 11,
    nivel: 'Secundaria',
    observacion: 'Excelente deportista y compañero de grupo.',
    estado: true,
    created_at: '2026-06-15T10:30:00.000Z',
    name: 'Diego Torres',
    email: 'diego.torres@sistema.edu',
    grade: '11° Grado',
    section: 'A',
    parentName: 'Elena Torres',
    parentPhone: '+51 988 776 655',
    balance: 0,
    grades: [
      { subject: 'Matemáticas', score: 17 },
      { subject: 'Ciencias', score: 15 },
      { subject: 'Historia', score: 18 },
    ],
    attendanceRate: 96,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
    status: 'active'
  }
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'f83d91bb-5991-49e0-811c-dcd2f3c8a001',
    nombre: 'Carlos',
    apellido: 'Fuentes',
    edad: 42,
    dni: 'DNI72345678',
    telefono: 954123456,
    codigo: 'DOC-001',
    foto_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    fecha_vencimiento: 2028,
    password: 'docente123',
    si_pass: false,
    activado: true,
    rol: 'docente',
    created_at: '2026-06-01T08:00:00.000Z',
    name: 'Prof. Carlos Fuentes',
    email: 'carlos.fuentes@sistema.edu',
    subject: 'Matemáticas',
    phone: '+51 954 123 456',
    salary: 1800,
    paymentStatus: 'paid',
    activeCourses: ['10° Grado A', '11° Grado B'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    rating: 4.8
  },
  {
    id: '7ea4e1a7-ccfa-44cb-b391-7db9dfefc102',
    nombre: 'Ana',
    apellido: 'Cecilia',
    edad: 37,
    dni: 'DNI81234567',
    telefono: 985642111,
    codigo: 'DOC-002',
    foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    fecha_vencimiento: 2029,
    password: 'docente123',
    si_pass: false,
    activado: true,
    rol: 'docente',
    created_at: '2026-06-02T08:00:00.000Z',
    name: 'Dra. Ana Cecilia',
    email: 'ana.cecilia@sistema.edu',
    subject: 'Ciencias',
    phone: '+51 985 642 111',
    salary: 1950,
    paymentStatus: 'pending',
    activeCourses: ['10° Grado B', '11° Grado A'],
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    rating: 4.9
  },
  {
    id: 'c90a2be7-5c56-4b82-bc18-ee51ffaf3103',
    nombre: 'Fernando',
    apellido: 'Paz',
    edad: 45,
    dni: 'DNI93366699',
    telefono: 933666999,
    codigo: 'DOC-003',
    foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    fecha_vencimiento: 2027,
    password: 'docente123',
    si_pass: false,
    activado: true,
    rol: 'docente',
    created_at: '2026-06-03T08:00:00.000Z',
    name: 'Lic. Fernando Paz',
    email: 'fernando.paz@sistema.edu',
    subject: 'Historia',
    phone: '+51 933 666 999',
    salary: 1700,
    paymentStatus: 'paid',
    activeCourses: ['10° Grado A', '10° Grado B', '11° Grado B'],
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    rating: 4.5
  }
];

const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'RES-001',
    name: 'Matemáticas',
    type: 'folder',
    updatedAt: '2026-06-10 14:30',
    category: 'Matemáticas',
    children: [
      {
        id: 'RES-001-1',
        name: 'Syllabus_Algebra_Lineal.pdf',
        type: 'file',
        size: '1.2 MB',
        updatedAt: '2026-06-10 14:35',
        category: 'Matemáticas'
      },
      {
        id: 'RES-001-2',
        name: 'Ejercicios_Trigonometria_Resueltos.docx',
        type: 'file',
        size: '850 KB',
        updatedAt: '2026-06-11 09:15',
        category: 'Matemáticas'
      }
    ]
  },
  {
    id: 'RES-002',
    name: 'Ciencias de la Naturaleza',
    type: 'folder',
    updatedAt: '2026-06-08 11:20',
    category: 'Ciencias',
    children: [
      {
        id: 'RES-002-1',
        name: 'Guia_Laboratorio_Quimica_Organica.pdf',
        type: 'file',
        size: '3.4 MB',
        updatedAt: '2026-06-08 11:25',
        category: 'Ciencias'
      },
      {
        id: 'RES-002-2',
        name: 'Diapositivas_Metabolismo_Celular.pptx',
        type: 'file',
        size: '5.1 MB',
        updatedAt: '2026-06-09 16:40',
        category: 'Ciencias'
      }
    ]
  },
  {
    id: 'RES-003',
    name: 'Planificaciones Académicas',
    type: 'folder',
    updatedAt: '2026-06-12 08:00',
    category: 'Administrativo',
    children: [
      {
        id: 'RES-003-1',
        name: 'Calendario_Academico_Editable_2026.xlsx',
        type: 'file',
        size: '920 KB',
        updatedAt: '2026-06-12 08:02',
        category: 'Administrativo'
      },
      {
        id: 'RES-003-2',
        name: 'Reglamento_Interno_ENLACEC_v3.pdf',
        type: 'file',
        size: '2.8 MB',
        updatedAt: '2026-06-12 08:15',
        category: 'Administrativo'
      }
    ]
  }
];

const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'TX-001',
    type: 'ingreso',
    amount: 150,
    concept: 'Pago Mensualidad - Sofía Valentino',
    category: 'Colegiatura',
    date: '2026-06-01',
    studentId: 'EST-001'
  },
  {
    id: 'TX-002',
    type: 'ingreso',
    amount: 150,
    concept: 'Pago Mensualidad - Camila Rojas',
    category: 'Colegiatura',
    date: '2026-06-02',
    studentId: 'EST-003'
  },
  {
    id: 'TX-003',
    type: 'egreso',
    amount: 1800,
    concept: 'Pago Planilla Mayo - Carlos Fuentes',
    category: 'Salario Docente',
    date: '2026-06-05',
    teacherId: 'DOC-001'
  },
  {
    id: 'TX-004',
    type: 'egreso',
    amount: 1700,
    concept: 'Pago Planilla Mayo - Fernando Paz',
    category: 'Salario Docente',
    date: '2026-06-05',
    teacherId: 'DOC-003'
  },
  {
    id: 'TX-005',
    type: 'ingreso',
    amount: 5000,
    concept: 'Subvención Estatal para Equipamiento',
    category: 'Otros',
    date: '2026-06-08'
  },
  {
    id: 'TX-006',
    type: 'egreso',
    amount: 450,
    concept: 'Compra de reactivos de Química',
    category: 'Material Educativo',
    date: '2026-06-12'
  }
];

const INITIAL_NEWS: SchoolNews[] = [
  {
    id: 'NEW-001',
    title: 'Nueva Biblioteca Virtual Implementada',
    content: 'A partir de la próxima semana, todos los estudiantes y docentes tendrán acceso gratuito a la nueva plataforma de libros digitales de investigación con más de 10,000 archivos escolares.',
    date: '2026-06-12',
    author: 'Dirección Académica',
    category: 'académico',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'NEW-002',
    title: 'Aniversario Institucional y Feria Tecnológica',
    content: 'Se invita a toda la comunidad estudiantil a participar del 15° aniversario de nuestro colegio. Tendremos stands de robótica, proyectos de ciencias y una gran kermés familiar.',
    date: '2026-06-10',
    author: 'Comisión de Eventos',
    category: 'evento',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400'
  }
];

const INITIAL_FACTURAS: Factura[] = [
  {
    id: 'FAC-EST-9348',
    created_at: '2026-07-05T10:00:00.000Z',
    tipo: 'estudiante',
    student_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb01',
    monto: 150.00,
    concepto: 'Boleta de Matrícula Regular - Sofía Valentino',
    estado: 'pagada',
    detalles: {
      nombrePersona: 'Sofía Valentino',
      dniEstudiante: '72345678',
      nombreServicio: 'Matrícula Regular de Secundaria',
      cursosVinculados: ['Álgebra Avanzada', 'Física Elemental', 'Geometría Plana']
    }
  },
  {
    id: 'FAC-DOC-7123',
    created_at: '2026-07-10T14:30:00.000Z',
    tipo: 'profesor',
    teacher_id: 'f83d91bb-5991-49e0-811c-dcd2f3c8a001',
    monto: 300.00,
    concepto: 'Boleta de Honorarios - Carlos Fuentes (Julio 2026)',
    estado: 'emitida',
    detalles: {
      nombrePersona: 'Prof. Carlos Fuentes',
      dniDocente: 'DNI72345678',
      clasesDictadas: 4,
      tarifaPorClase: 75.00
    }
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'ATT-001',
    teacherId: 'DOC-001',
    teacherName: 'Prof. Carlos Fuentes',
    course: '10° Grado A',
    date: '2026-06-15',
    time: '08:15',
    students: [
      { studentId: 'EST-001', studentName: 'Sofía Valentino', present: true },
      { studentId: 'EST-003', studentName: 'Camila Rojas', present: true },
      { studentId: 'EST-005', studentName: 'Valentina Díaz', present: true }
    ],
    comments: 'Clase de Álgebra Lineal. Participación activa de todo el grupo.'
  },
  {
    id: 'ATT-002',
    teacherId: 'DOC-002',
    teacherName: 'Dra. Ana Cecilia',
    course: '10° Grado A',
    date: '2026-06-12',
    time: '10:30',
    students: [
      { studentId: 'EST-001', studentName: 'Sofía Valentino', present: true },
      { studentId: 'EST-003', studentName: 'Camila Rojas', present: false },
      { studentId: 'EST-005', studentName: 'Valentina Díaz', present: true }
    ],
    comments: 'Práctica de laboratorio de Química. Camila Rojas justificó inasistencia médica.'
  },
  {
    id: 'ATT-003',
    teacherId: 'DOC-003',
    teacherName: 'Lic. Fernando Paz',
    course: '10° Grado A',
    date: '2026-06-10',
    time: '09:00',
    students: [
      { studentId: 'EST-001', studentName: 'Sofía Valentino', present: true },
      { studentId: 'EST-003', studentName: 'Camila Rojas', present: true },
      { studentId: 'EST-005', studentName: 'Valentina Díaz', present: true }
    ],
    comments: 'Exposición grupal sobre la Revolución Industrial.'
  },
  {
    id: 'ATT-004',
    teacherId: 'DOC-001',
    teacherName: 'Prof. Carlos Fuentes',
    course: '10° Grado A',
    date: '2026-06-08',
    time: '08:15',
    students: [
      { studentId: 'EST-001', studentName: 'Sofía Valentino', present: true },
      { studentId: 'EST-003', studentName: 'Camila Rojas', present: true },
      { studentId: 'EST-005', studentName: 'Valentina Díaz', present: false }
    ],
    comments: 'Ecuaciones de segundo grado.'
  },
  {
    id: 'ATT-005',
    teacherId: 'DOC-002',
    teacherName: 'Dra. Ana Cecilia',
    course: '10° Grado A',
    date: '2026-06-05',
    time: '10:30',
    students: [
      { studentId: 'EST-001', studentName: 'Sofía Valentino', present: true },
      { studentId: 'EST-003', studentName: 'Camila Rojas', present: true },
      { studentId: 'EST-005', studentName: 'Valentina Díaz', present: true }
    ],
    comments: 'Clase regular de Biología Celular.'
  },
  {
    id: 'ATT-006',
    teacherId: 'DOC-003',
    teacherName: 'Lic. Fernando Paz',
    course: '10° Grado A',
    date: '2026-06-03',
    time: '09:00',
    students: [
      { studentId: 'EST-001', studentName: 'Sofía Valentino', present: false },
      { studentId: 'EST-003', studentName: 'Camila Rojas', present: true },
      { studentId: 'EST-005', studentName: 'Valentina Díaz', present: true }
    ],
    comments: 'Sofía Valentino llegó tarde con justificación firmada por su apoderado.'
  },
  {
    id: 'ATT-007',
    teacherId: 'DOC-001',
    teacherName: 'Prof. Carlos Fuentes',
    course: '10° Grado A',
    date: '2026-06-01',
    time: '08:15',
    students: [
      { studentId: 'EST-001', studentName: 'Sofía Valentino', present: true },
      { studentId: 'EST-003', studentName: 'Camila Rojas', present: true },
      { studentId: 'EST-005', studentName: 'Valentina Díaz', present: true }
    ],
    comments: 'Inicio de la unidad didáctica de funciones trigonométricas.'
  },
  {
    id: 'ATT-008',
    teacherId: 'DOC-001',
    teacherName: 'Prof. Carlos Fuentes',
    course: '11° Grado B',
    date: '2026-06-12',
    time: '11:45',
    students: [
      { studentId: 'EST-002', studentName: 'Mateo Quispe', present: true },
      { studentId: 'EST-004', studentName: 'Lucas Mendoza', present: true }
    ],
    comments: 'Álgebra avanzada, límites matemáticos.'
  },
  {
    id: 'ATT-009',
    teacherId: 'DOC-002',
    teacherName: 'Dra. Ana Cecilia',
    course: '11° Grado B',
    date: '2026-06-09',
    time: '13:00',
    students: [
      { studentId: 'EST-002', studentName: 'Mateo Quispe', present: false },
      { studentId: 'EST-004', studentName: 'Lucas Mendoza', present: true }
    ],
    comments: 'Física cuántica elemental. Mateo Quispe con falta injustificada.'
  },
  {
    id: 'ATT-010',
    teacherId: 'DOC-003',
    teacherName: 'Lic. Fernando Paz',
    course: '11° Grado B',
    date: '2026-06-05',
    time: '11:45',
    students: [
      { studentId: 'EST-002', studentName: 'Mateo Quispe', present: true },
      { studentId: 'EST-004', studentName: 'Lucas Mendoza', present: false }
    ],
    comments: 'Análisis crítico sobre la caída de Constantinopla. Lucas Mendoza ausente.'
  }
];

// --- MAPPER HELPERS FOR RESILIENT DATABASE CONFIGURATION ---
const mapStudentFromDb = (row: any): Student => {
  const nombre = row.nombre || row.name?.split(' ')[0] || '';
  const apellido = row.apellido || row.name?.split(' ').slice(1).join(' ') || '';
  return {
    id: row.id,
    nombre,
    apellido,
    contacto: Number(row.contacto || row.parentPhone?.replace(/\D/g, '')?.slice(-9) || 987654321),
    grado: Number(row.grado || parseInt(row.grade) || 10),
    nivel: row.nivel || (row.grade?.includes('11') || row.grade?.includes('10') ? 'Secundaria' : 'Primaria'),
    observacion: row.observacion || '',
    estado: row.estado !== undefined ? !!row.estado : (row.status === 'active'),
    created_at: row.created_at || new Date().toISOString(),

    // compatibility
    name: row.name || `${nombre} ${apellido}`.trim(),
    email: row.email || `${nombre.toLowerCase()}.${apellido.toLowerCase().replace(/\s+/g, '')}@sistema.edu`,
    grade: row.grade || `${row.grado || 10}° Grado`,
    section: row.section || 'A',
    parentName: row.parent_name || row.parentName || `Apoderado de ${nombre}`,
    parentPhone: row.parent_phone || row.parentPhone || `+51 ${row.contacto || 987654321}`,
    balance: Number(row.balance ?? 0),
    grades: Array.isArray(row.grades) ? row.grades : [],
    attendanceRate: Number(row.attendance_rate !== undefined ? row.attendance_rate : (row.attendanceRate ?? 95)),
    avatarUrl: row.avatar_url !== undefined ? (row.avatar_url || '') : (row.avatarUrl || ''),
    status: (row.status || (row.estado ? 'active' : 'inactive')) as 'active' | 'inactive',
    servicioId: row.servicio_id || row.servicioId || undefined,
    dni: row.dni || ''
  };
};

const mapStudentToDb = (s: Student) => ({
  id: s.id,
  nombre: s.nombre,
  apellido: s.apellido,
  contacto: s.contacto,
  grado: s.grado,
  nivel: s.nivel,
  observacion: s.observacion,
  estado: s.estado,
  created_at: s.created_at || new Date().toISOString(),
  servicio_id: s.servicioId || null,
  servicioId: s.servicioId || null,
  dni: s.dni || null,
  
  // compatibility with potential legacy supabase students table
  name: s.name,
  email: s.email,
  grade: s.grade,
  section: s.section,
  parent_name: s.parentName,
  parentName: s.parentName,
  parent_phone: s.parentPhone,
  parentPhone: s.parentPhone,
  balance: s.balance,
  grades: s.grades,
  attendance_rate: s.attendanceRate,
  attendanceRate: s.attendanceRate,
  avatar_url: s.avatarUrl && s.avatarUrl.trim() !== '' ? s.avatarUrl : null,
  avatarUrl: s.avatarUrl && s.avatarUrl.trim() !== '' ? s.avatarUrl : null,
  status: s.status
});

const mapStudentToEstudiantesDb = (s: Student) => ({
  id: s.id,
  created_at: s.created_at || new Date().toISOString(),
  nombre: s.nombre || s.name?.split(' ')[0] || '',
  apellido: s.apellido || s.name?.split(' ').slice(1).join(' ') || '',
  contacto: s.contacto ? Number(s.contacto) : null,
  grado: s.grado ? Number(s.grado) : null,
  nivel: s.nivel || null,
  observacion: s.observacion || null,
  estado: s.estado !== undefined ? !!s.estado : null,
  avatar_url: s.avatarUrl && s.avatarUrl.trim() !== '' ? s.avatarUrl : null,
  dni: s.dni || null,
  servicio_id: s.servicioId || null
});

const mapTeacherFromDb = (row: any): Teacher => {
  const nombre = row.nombre || row.name?.replace('Prof. ', '')?.replace('Dra. ', '')?.replace('Lic. ', '')?.split(' ')[0] || '';
  const apellido = row.apellido || row.name?.replace('Prof. ', '')?.replace('Dra. ', '')?.replace('Lic. ', '')?.split(' ').slice(1).join(' ') || '';
  const telefono = Number(row.telefono || row.phone?.replace(/\D/g, '')?.slice(-9) || 954123456);
  
  // Extraer el año de manera segura por si viene como string de fecha (ej. "2028-12-31")
  const yearStr = row.fecha_vencimiento ? String(row.fecha_vencimiento).split('-')[0] : '2028';
  const fecha_vencimiento = Number(yearStr) || 2028;
  
  const codigo = row.codigo || `${telefono}-${fecha_vencimiento}`;
  const generatedEmail = `${nombre.toLowerCase().replace(/\s+/g, '')}.${apellido.toLowerCase().replace(/\s+/g, '')}@sistema.edu`;

  return {
    id: row.id,
    nombre,
    apellido,
    edad: row.edad ? Number(row.edad) : 35,
    dni: row.dni ? String(row.dni) : `DNI${Math.floor(10000000 + Math.random() * 90000000)}`,
    telefono,
    codigo,
    foto_url: row.foto_url || row.avatarUrl || '',
    fecha_vencimiento,
    password: row.password || 'docente123',
    si_pass: row.si_pass !== undefined ? !!row.si_pass : true,
    activado: true,
    rol: row.rol || 'docente',
    created_at: row.created_at || new Date().toISOString(),

    // Getters dinámicos de compatibilidad para evitar fallos de ejecución en el frontend
    get name() { return `Prof. ${nombre} ${apellido}`; },
    get email() { return row.email || generatedEmail; },
    get subject() { return row.subject || 'Matemáticas'; },
    get phone() { return row.phone || `+51 ${telefono}`; },
    get salary() { return Number(row.salary) || 1800; },
    get paymentStatus() { return row.paymentStatus || 'paid'; },
    get activeCourses() { return row.activeCourses || []; },
    get avatarUrl() { return row.foto_url || row.avatarUrl || ''; },
    get rating() { return Number(row.rating) || 5; }
  };
};

const mapTeacherToDb = (t: Teacher) => {
  const nombre = t.nombre || '';
  const apellido = t.apellido || '';
  
  // Limpiar teléfono y dni para asegurar tipos numéricos limpios (int4 en BD)
  // Eliminamos cualquier prefijo de país '+51' o '51' para evitar desbordamientos de int4
  let cleanPhoneStr = String(t.telefono || '').replace(/\D/g, '');
  if (cleanPhoneStr.startsWith('51') && cleanPhoneStr.length > 9) {
    cleanPhoneStr = cleanPhoneStr.slice(-9);
  }
  const cleanDniStr = String(t.dni || '').replace(/\D/g, '');
  
  const telefono = cleanPhoneStr ? parseInt(cleanPhoneStr, 10) : null;
  const dni = cleanDniStr ? parseInt(cleanDniStr, 10) : null;
  
  // Formatear año a fecha YYYY-12-31 para tipo date de PostgreSQL
  const yearNum = Number(String(t.fecha_vencimiento || '2028').split('-')[0]) || 2028;
  const fecha_vencimiento = `${yearNum}-12-31`;
  const codigo = `${telefono || 954123456}-${yearNum}`;

  return {
    id: t.id,
    nombre: nombre,
    apellido: apellido,
    edad: t.edad ? Number(t.edad) : null,
    dni: dni,
    telefono: telefono,
    codigo: codigo,
    foto_url: (t.foto_url && t.foto_url.trim() !== '') ? t.foto_url : ((t.avatarUrl && t.avatarUrl.trim() !== '') ? t.avatarUrl : null),
    avatar_url: (t.foto_url && t.foto_url.trim() !== '') ? t.foto_url : ((t.avatarUrl && t.avatarUrl.trim() !== '') ? t.avatarUrl : null),
    avatarUrl: (t.foto_url && t.foto_url.trim() !== '') ? t.foto_url : ((t.avatarUrl && t.avatarUrl.trim() !== '') ? t.avatarUrl : null),
    fecha_vencimiento: fecha_vencimiento,
    password: t.password || `docente${Math.floor(100 + Math.random() * 900)}`,
    si_pass: t.si_pass !== undefined ? !!t.si_pass : true,
    activado: true,
    rol: t.rol || 'docente',
    created_at: t.created_at || new Date().toISOString()
  };
};

function buildResourceTree(rows: any[]): ResourceItem[] {
  const itemMap = new Map<string, ResourceItem & { parent_id?: string | null; parentId?: string | null }>();
  
  rows.forEach(row => {
    const rType = row.tipo || row.type || 'file';
    const mapped: any = {
      id: row.id,
      name: row.nombre || row.name || '',
      type: (rType === 'folder' || rType === 'carpetas' || rType === 'carpeta' ? 'folder' : 'file') as 'file' | 'folder',
      size: row.size || undefined,
      updatedAt: row.created_at || row.updated_at || row.updatedAt || '',
      category: row.formato || row.category || undefined,
      url: row.url || undefined,
      parent_id: row.categoria_id !== undefined ? row.categoria_id : (row.parent_id !== undefined ? row.parent_id : row.parentId),
      parentId: row.categoria_id !== undefined ? row.categoria_id : (row.parent_id !== undefined ? row.parent_id : row.parentId),
      ...(rType === 'folder' || rType === 'carpetas' || rType === 'carpeta' ? { children: [] } : {})
    };
    itemMap.set(mapped.id, mapped);
  });
  
  const roots: ResourceItem[] = [];
  
  itemMap.forEach(item => {
    const pId = item.parent_id || item.parentId;
    if (pId) {
      const parent = itemMap.get(pId);
      if (parent) {
        if (!parent.children) parent.children = [];
        const { parent_id, parentId, ...cleanItem } = item;
        parent.children.push(cleanItem as ResourceItem);
      } else {
        const { parent_id, parentId, ...cleanItem } = item;
        roots.push(cleanItem as ResourceItem);
      }
    } else {
      const { parent_id, parentId, ...cleanItem } = item;
      roots.push(cleanItem as ResourceItem);
    }
  });
  
  return roots;
}

const isValidUUID = (str?: string | null): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const toOptionalUUID = (id?: string | null): string | null => {
  if (!id) return null;
  if (isValidUUID(id)) return id;
  return null;
};

const mapTransactionFromDb = (row: any): FinancialTransaction => {
  const concept = row.concept || row.nombre || '';
  const amount = Number(row.amount !== undefined ? row.amount : (row.monto !== undefined ? Math.abs(row.monto) : 0));
  const rawType = row.type || row.tipo || (row.monto && Number(row.monto) < 0 ? 'egreso' : 'ingreso');
  return {
    id: row.id,
    type: (rawType === 'egreso' || rawType === 'Egreso' || (row.monto !== undefined && Number(row.monto) < 0)) ? 'egreso' : 'ingreso',
    amount,
    concept,
    category: (row.category || row.categoria || 'Otros') as any,
    date: row.date || row.fecha || '',
    studentId: row.student_id !== undefined ? row.student_id : row.studentId,
    teacherId: row.teacher_id !== undefined ? row.teacher_id : row.teacherId,
    tipo: row.tipo || ''
  };
};

const mapTransactionToDb = (tx: FinancialTransaction) => {
  const rowId = isValidUUID(tx.id) ? tx.id : undefined;
  const studentUuid = toOptionalUUID(tx.studentId);
  const teacherUuid = toOptionalUUID(tx.teacherId);
  const nowIso = new Date().toISOString();
  const dateStr = tx.date || nowIso.split('T')[0];

  return {
    ...(rowId ? { id: rowId } : {}),
    type: tx.type,
    amount: tx.amount,
    concept: tx.concept,
    category: tx.category,
    date: dateStr,
    student_id: studentUuid,
    studentId: studentUuid,
    teacher_id: teacherUuid,
    teacherId: teacherUuid,
    nombre: tx.concept,
    monto: tx.type === 'egreso' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
    fecha: nowIso,
    categoria: tx.category,
    created_at: nowIso
  };
};

const mapAttendanceFromDb = (row: any): AttendanceRecord => ({
  id: row.id,
  teacherId: row.teacher_id !== undefined ? row.teacher_id : row.teacherId,
  teacherName: row.teacher_name !== undefined ? row.teacher_name : row.teacherName,
  course: row.course || '',
  date: row.date || '',
  time: row.time || '',
  students: Array.isArray(row.students) ? row.students : (typeof row.students === 'string' ? JSON.parse(row.students) : []),
  comments: row.comments || ''
});

const mapAttendanceToDb = (att: AttendanceRecord) => ({
  id: att.id,
  teacher_id: att.teacherId,
  teacherId: att.teacherId,
  teacher_name: att.teacherName,
  teacherName: att.teacherName,
  course: att.course,
  date: att.date,
  time: att.time,
  students: att.students,
  comments: att.comments || ''
});

const safeUUID = (id: string): string => {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  if (id.startsWith('NEW-')) {
    const numPart = id.replace('NEW-', '').padStart(12, '0');
    return `00000000-0000-4000-8000-${numPart}`;
  }
  return id;
};

const mapNewsFromDb = (row: any): SchoolNews => ({
  id: row.id,
  title: row.titulo || row.title || '',
  content: row.descripcion || row.content || '',
  date: row.fecha || row.date || '',
  author: row.author || 'Administración',
  category: (row.tipo || row.category || 'noticia') as any,
  imageUrl: row.imagen_url !== undefined ? row.imagen_url : (row.image_url !== undefined ? row.image_url : (row.imageUrl !== undefined ? row.imageUrl : ''))
});

const mapNewsToDb = (n: SchoolNews) => {
  const dbObj: any = {
    titulo: n.title || '',
    descripcion: n.content || '',
    imagen_url: n.imageUrl || null,
    fecha: n.date || new Date().toISOString().split('T')[0],
    tipo: n.category || 'noticia'
  };
  const validId = safeUUID(n.id);
  if (validId) {
    dbObj.id = validId;
  }
  return dbObj;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('edu_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Diagnostics states
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'loading' | 'error'>('loading');

  // Data states
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('edu_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('edu_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [resources, setResources] = useState<ResourceItem[]>(() => {
    const saved = localStorage.getItem('edu_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('edu_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('edu_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [news, setNews] = useState<SchoolNews[]>(() => {
    const saved = localStorage.getItem('edu_news');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  useEffect(() => {
    localStorage.setItem('edu_news', JSON.stringify(news));
  }, [news]);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('edu_app_notifications');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'notif-1', title: '📢 Plataforma Sincronizada', content: 'Sistema de avisos y notificaciones en tiempo real activado con éxito.', type: 'news', timestamp: 'Hace unos instantes', read: false },
      { id: 'notif-2', title: '📅 Recordatorio de Evento', content: 'Próxima reunión general informativa el lunes a las 09:00 AM.', type: 'event', timestamp: 'Hace 2 horas', read: false },
      { id: 'notif-3', title: '💼 Flujo de Caja Conectado', content: 'Las estadísticas del dashboard y movimientos de caja están completamente vinculadas.', type: 'finance', timestamp: 'Ayer', read: true }
    ];
  });

  const [facturas, setFacturas] = useState<Factura[]>(() => {
    const saved = localStorage.getItem('edu_facturas');
    return saved ? JSON.parse(saved) : [];
  });

  const [vaultPasscode, setVaultPasscodeState] = useState<string>(() => {
    const saved = localStorage.getItem('edu_vault_passcode');
    return saved || '1234';
  });

  const setVaultPasscode = (code: string) => {
    setVaultPasscodeState(code);
    localStorage.setItem('edu_vault_passcode', code);
  };

  // Default courses and services constants
  const DEFAULT_CURSOS: Course[] = [
    { id: 'cur-mat', nombre: 'Reforzamiento de Matemática', descripcion: 'Clases intensivas de álgebra, aritmética y geometría', pago: 25.0 },
    { id: 'cur-lec', nombre: 'Reforzamiento de Lectora', descripcion: 'Comprensión lectora y análisis de de textos', pago: 20.0 },
    { id: 'cur-rob', nombre: 'Taller de Robótica', descripcion: 'Introducción a la programación y circuitos electrónicos', pago: 30.0 },
    { id: 'cur-ing', nombre: 'Inglés Intensivo', descripcion: 'Gramática, vocabulario y expresión oral', pago: 22.0 }
  ];

  const DEFAULT_SERVICIOS: Service[] = [
    { id: 'ser-ref-pri', nombre: 'Reforzamiento Primaria', descripcion: 'Nivelación integral para alumnos de educación primaria' },
    { id: 'ser-ref-sec', nombre: 'Reforzamiento Secundaria', descripcion: 'Preparación avanzada para alumnos de educación secundaria' },
    { id: 'ser-talleres', nombre: 'Talleres Extracurriculares', descripcion: 'Desarrollo de habilidades tecnológicas y científicas' }
  ];

  const DEFAULT_SERVICIO_CURSOS: ServiceCourse[] = [
    { id: 'sc-1', servicio_id: 'ser-ref-pri', curso_id: 'cur-mat' },
    { id: 'sc-2', servicio_id: 'ser-ref-pri', curso_id: 'cur-lec' },
    { id: 'sc-3', servicio_id: 'ser-ref-sec', curso_id: 'cur-mat' },
    { id: 'sc-4', servicio_id: 'ser-ref-sec', curso_id: 'cur-ing' },
    { id: 'sc-5', servicio_id: 'ser-talleres', curso_id: 'cur-rob' }
  ];

  const [cursos, setCursos] = useState<Course[]>(() => {
    const saved = localStorage.getItem('edu_cursos');
    return saved ? JSON.parse(saved) : DEFAULT_CURSOS;
  });

  const [servicios, setServicios] = useState<Service[]>(() => {
    const saved = localStorage.getItem('edu_servicios');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICIOS;
  });

  const [servicioCursos, setServicioCursos] = useState<ServiceCourse[]>(() => {
    const saved = localStorage.getItem('edu_servicio_cursos');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICIO_CURSOS;
  });

  const [servicioProfesores, setServicioProfesores] = useState<ServiceTeacher[]>(() => {
    const saved = localStorage.getItem('edu_servicio_profesores');
    return saved ? JSON.parse(saved) : [];
  });

  const [notas, setNotas] = useState<Nota[]>(() => {
    const saved = localStorage.getItem('edu_notas');
    return saved ? JSON.parse(saved) : [];
  });

  // Global theme settings
  const [theme, setTheme] = useState<AppThemeConfig>(() => {
    const saved = localStorage.getItem('edu_theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.layoutStyle = 'frosted-glass';
      return parsed;
    }
    return {
      mode: 'system',
      accentColor: 'blue',
      layoutStyle: 'frosted-glass'
    };
  });

  // School cash flow balance indicator (default starting at 12,450.00 COP/USD/etc.)
  const [balance, setBalance] = useState<number>(15000);
  const [balanceLoadedFromCaja, setBalanceLoadedFromCaja] = useState<boolean>(false);

  // Global upload progress state for student and teacher registration images
  const [uploadProgress, setUploadProgress] = useState<{
    isOpen: boolean;
    progress: number;
    title: string;
    status: 'idle' | 'uploading' | 'success' | 'error';
  }>({
    isOpen: false,
    progress: 0,
    title: '',
    status: 'idle'
  });

  // Load from Supabase on mount
  const loadData = async () => {
    setSupabaseStatus('loading');
    const newErrors: string[] = [];
    const addErrorLog = (table: string, err: any) => {
      const msg = err?.message || (typeof err === 'string' ? err : 'Tabla no accesible');
      console.warn(`⚠️ [SISTEMA-LOG] Consulta a la tabla ${table} desde Supabase: ${msg}`);
    };

    console.log("%c🚀 [SISTEMA] Iniciando carga y sincronización de base de datos...", "color: #6366f1; font-weight: bold; font-size: 13px; text-decoration: underline;");
    let hasAnySupabaseSuccess = false;

    // 1. Students (estudiantes / students)
    let studentsLoadedFromSupabase = false;
    console.log("📂 [SISTEMA-LOG] Cargando tabla: Estudiantes...");
    try {
      const { data, error } = await supabase.from('estudiantes').select('*');
      if (!error && data) {
        setStudents(data.map(mapStudentFromDb));
        studentsLoadedFromSupabase = true;
        hasAnySupabaseSuccess = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'estudiantes' cargada exitosamente de Supabase. Registros:", data.length);
      }
    } catch (err) {
      console.warn("⚠️ [SISTEMA-LOG] 'estudiantes' no accesible en Supabase:", err);
    }

    if (!studentsLoadedFromSupabase) {
      try {
        const { data, error } = await supabase.from('students').select('*');
        if (!error && data) {
          setStudents(data.map(mapStudentFromDb));
          studentsLoadedFromSupabase = true;
          hasAnySupabaseSuccess = true;
          console.log("✅ [SISTEMA-LOG] Tabla 'students' cargada exitosamente de Supabase. Registros:", data.length);
        }
      } catch (err) {
        console.warn("⚠️ [SISTEMA-LOG] 'students' no accesible en Supabase:", err);
      }
    }

    // FALLBACK: if not loaded from Supabase, load from local
    if (!studentsLoadedFromSupabase) {
      const saved = localStorage.getItem('edu_students');
      const loadedData = saved ? JSON.parse(saved) : INITIAL_STUDENTS;
      setStudents(loadedData);
      console.log("ℹ️ [SISTEMA-LOG] Estudiantes cargados de Almacenamiento Local (offline fallback). Registros:", loadedData.length);
    }


    // 2. Teachers / Users (usuarios)
    console.log("📂 [SISTEMA-LOG] Cargando tabla: Docentes...");
    let teachersLoadedFromSupabase = false;
    try {
      const { data, error } = await supabase.from('usuarios').select('*');
      if (!error && data) {
        setTeachers(data.map(mapTeacherFromDb));
        teachersLoadedFromSupabase = true;
        hasAnySupabaseSuccess = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'usuarios' cargada exitosamente de Supabase. Registros:", data.length);
      }
    } catch (err) {
      console.warn("⚠️ [SISTEMA-LOG] 'usuarios' no accesible en Supabase:", err);
    }

    if (!teachersLoadedFromSupabase) {
      const saved = localStorage.getItem('edu_teachers');
      const loadedData = saved ? JSON.parse(saved) : INITIAL_TEACHERS;
      setTeachers(loadedData);
      console.log("ℹ️ [SISTEMA-LOG] Docentes cargados de Almacenamiento Local (offline fallback). Registros:", loadedData.length);
    }


    // 3. Resources (recursos / categorias)
    let resourcesLoadedFromSupabase = false;
    console.log("📂 [SISTEMA-LOG] Cargando tablas: categorias y recursos...");
    try {
      const { data: catData, error: catError } = await supabase.from('categorias').select('*');
      const { data: recData } = await supabase.from('recursos').select('*');

      if (!catError && catData) {
        // Map categories and resources into standard ResourceItem[] tree structure!
        const mappedCategories: ResourceItem[] = catData.map(cat => {
          const catRecs = recData ? recData.filter(rec => rec.categoria_id === cat.id) : [];
          return {
            id: cat.id,
            name: cat.nombre || 'Sin nombre',
            type: 'folder',
            updatedAt: cat.created_at || new Date().toISOString(),
            category: cat.nombre as any,
            children: catRecs.map(rec => ({
              id: rec.id,
              name: rec.nombre || 'Sin nombre',
              type: (rec.tipo === 'folder' ? 'folder' : 'file') as 'file' | 'folder',
              size: rec.formato || '1.2 MB',
              url: rec.url || '',
              updatedAt: rec.created_at || new Date().toISOString(),
              category: cat.nombre as any
            }))
          };
        });

        setResources(mappedCategories);
        resourcesLoadedFromSupabase = true;
        hasAnySupabaseSuccess = true;
        console.log("✅ [SISTEMA-LOG] Categorías y Recursos cargados de Supabase:", mappedCategories.length);
      }
    } catch (err) {
      console.warn("⚠️ [SISTEMA-LOG] 'categorias/recursos' no accesible en Supabase:", err);
    }

    if (!resourcesLoadedFromSupabase) {
      try {
        const { data, error } = await supabase.from('recursos').select('*');
        if (!error && data) {
          setResources(buildResourceTree(data));
          resourcesLoadedFromSupabase = true;
          hasAnySupabaseSuccess = true;
          console.log("✅ [SISTEMA-LOG] Tabla 'recursos' cargada de Supabase. Registros:", data.length);
        }
      } catch (err) {
        console.warn("⚠️ [SISTEMA-LOG] 'recursos' no accesible en Supabase:", err);
      }
    }

    if (!resourcesLoadedFromSupabase) {
      try {
        const { data, error } = await supabase.from('resources').select('*');
        if (!error && data) {
          setResources(buildResourceTree(data));
          resourcesLoadedFromSupabase = true;
          hasAnySupabaseSuccess = true;
          console.log("✅ [SISTEMA-LOG] Tabla 'resources' cargada de Supabase. Registros:", data.length);
        }
      } catch (err) {
        console.warn("⚠️ [SISTEMA-LOG] 'resources' no accesible en Supabase:", err);
      }
    }

    // FALLBACK: local
    if (!resourcesLoadedFromSupabase) {
      const saved = localStorage.getItem('edu_resources');
      const loadedData = saved ? JSON.parse(saved) : INITIAL_RESOURCES;
      setResources(loadedData);
      console.log("ℹ️ [SISTEMA-LOG] Recursos cargados de Almacenamiento Local (offline fallback).");
    }


    // 4. Transactions (movimientos / transactions)
    let transactionsLoadedFromSupabase = false;
    let tempTransactions: FinancialTransaction[] = [];
    console.log("📂 [SISTEMA-LOG] Cargando tabla: Movimientos de Caja Chica...");
    try {
      const { data, error } = await supabase.from('movimientos').select('*');
      if (!error && data) {
        const mapped = data.map(mapTransactionFromDb);
        setTransactions(mapped);
        tempTransactions = mapped;
        transactionsLoadedFromSupabase = true;
        hasAnySupabaseSuccess = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'movimientos' cargada de Supabase. Registros:", data.length);
      }
    } catch (err) {
      console.warn("⚠️ [SISTEMA-LOG] 'movimientos' no accesible en Supabase:", err);
    }

    if (!transactionsLoadedFromSupabase) {
      try {
        const { data, error } = await supabase.from('transactions').select('*');
        if (!error && data) {
          const mapped = data.map(mapTransactionFromDb);
          setTransactions(mapped);
          tempTransactions = mapped;
          transactionsLoadedFromSupabase = true;
          hasAnySupabaseSuccess = true;
          console.log("✅ [SISTEMA-LOG] Tabla 'transactions' cargada de Supabase. Registros:", data.length);
        }
      } catch (err) {
        console.warn("⚠️ [SISTEMA-LOG] 'transactions' no accesible en Supabase:", err);
      }
    }

    // FALLBACK: local
    if (!transactionsLoadedFromSupabase) {
      const saved = localStorage.getItem('edu_transactions');
      const loadedData = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
      setTransactions(loadedData);
      tempTransactions = loadedData;
      console.log("ℹ️ [SISTEMA-LOG] Transacciones cargadas de Almacenamiento Local (offline fallback). Registros:", loadedData.length);
    }

    // 4b. Caja (balance / saldo)
    console.log("📂 [SISTEMA-LOG] Cargando tabla: Caja...");
    try {
      const { data: cajaData, error: cajaError } = await supabase
        .from('caja')
        .select('*')
        .order('fecha_actualizado', { ascending: false })
        .limit(1);

      if (cajaError) {
        addErrorLog('caja', cajaError);
      } else if (cajaData) {
        setBalanceLoadedFromCaja(true);
        hasAnySupabaseSuccess = true;
        if (cajaData.length > 0) {
          const dbBalance = Number(cajaData[0].monto);
          setBalance(dbBalance);
          console.log("✅ [SISTEMA-LOG] Tabla 'caja' cargada exitosamente de Supabase. Saldo actual:", dbBalance);
        } else {
          // If the table is empty, calculate the balance dynamically from the loaded transactions
          // (using a base of 15000) so the local UI stays consistent.
          const calculatedBalance = tempTransactions.reduce((acc, curr) => {
            return curr.type === 'ingreso' ? acc + curr.amount : acc - curr.amount;
          }, 15000);
          setBalance(calculatedBalance);
          console.log("✅ [SISTEMA-LOG] Tabla 'caja' de Supabase está vacía. Se inicializó el balance dinámicamente con:", calculatedBalance);
        }
      }
    } catch (err) {
      addErrorLog('caja', err);
    }


    // 5. Attendance (sesiones & asistencia_estudiantes / attendance / attendance_records)
    let attendanceLoadedFromSupabase = false;
    console.log("📂 [SISTEMA-LOG] Cargando tabla: Sesiones de Asistencia y Asistencia de Estudiantes...");
    try {
      const { data: ses, error: seErr } = await supabase.from('sesiones').select('*');
      const { data: asist, error: asErr } = await supabase.from('asistencia_estudiantes').select('*');

      if (!seErr && ses && !asErr && asist) {
        const records = ses.map((s: any) => {
          const matchingAsist = asist.filter((a: any) => a.id_sesion === s.id || a.idSesion === s.id);
          return {
            id: s.id,
            teacherId: s.id_profesor || s.idProfesor || '',
            teacherName: '',
            course: s.curso_nombre || s.tema || 'Clase',
            date: s.fecha || s.date || '',
            time: s.inicio || s.time || '',
            students: matchingAsist.map((a: any) => ({
              studentId: a.id_estudiante || a.idEstudiante,
              studentName: '',
              present: a.estado === 'P' || a.estado === 'p' || a.present === true
            })),
            comments: s.tema || s.observacion || '',
            courseId: s.id_curso || s.idCurso || undefined,
            inicio: s.inicio || undefined,
            fin: s.fin || undefined,
            monto: s.monto ? Number(s.monto) : undefined,
            cantidadSesiones: s.cantidad_sesiones || s.cantidadSesiones || 1
          };
        });
        setAttendance(records);
        attendanceLoadedFromSupabase = true;
        hasAnySupabaseSuccess = true;
        console.log("✅ [SISTEMA-LOG] Asistencia cargada y unificada desde 'sesiones' y 'asistencia_estudiantes' de Supabase. Registros:", records.length);
      }
    } catch (err) {
      console.warn("⚠️ [SISTEMA-LOG] 'sesiones/asistencia_estudiantes' no accesible:", err);
    }

    if (!attendanceLoadedFromSupabase) {
      try {
        const { data, error } = await supabase.from('attendance').select('*');
        if (!error && data) {
          setAttendance(data.map(mapAttendanceFromDb));
          attendanceLoadedFromSupabase = true;
          hasAnySupabaseSuccess = true;
          console.log("✅ [SISTEMA-LOG] Tabla 'attendance' cargada exitosamente de Supabase. Registros:", data.length);
        }
      } catch (err) {
        console.warn("⚠️ [SISTEMA-LOG] 'attendance' no accesible:", err);
      }
    }

    if (!attendanceLoadedFromSupabase) {
      try {
        const { data, error } = await supabase.from('attendance_records').select('*');
        if (!error && data) {
          setAttendance(data.map(mapAttendanceFromDb));
          attendanceLoadedFromSupabase = true;
          hasAnySupabaseSuccess = true;
          console.log("✅ [SISTEMA-LOG] Tabla 'attendance_records' cargada exitosamente de Supabase. Registros:", data.length);
        }
      } catch (err) {
        console.warn("⚠️ [SISTEMA-LOG] 'attendance_records' no accesible:", err);
      }
    }

    // FALLBACK: local
    if (!attendanceLoadedFromSupabase) {
      const saved = localStorage.getItem('edu_attendance');
      const loadedData = saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
      setAttendance(loadedData);
      console.log("ℹ️ [SISTEMA-LOG] Registros de Asistencia cargados de Almacenamiento Local (offline fallback). Registros:", loadedData.length);
    }


    // 6. News (eventos_noticias / news)
    let newsLoadedFromSupabase = false;
    console.log("📂 [SISTEMA-LOG] Cargando tabla: Eventos y Noticias...");
    try {
      const { data, error } = await supabase.from('eventos_noticias').select('*');
      if (!error && data) {
        setNews(data.map(mapNewsFromDb));
        newsLoadedFromSupabase = true;
        hasAnySupabaseSuccess = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'eventos_noticias' cargada exitosamente de Supabase. Registros:", data.length);
      }
    } catch (err) {
      console.warn("⚠️ [SISTEMA-LOG] 'eventos_noticias' no accesible:", err);
    }

    if (!newsLoadedFromSupabase) {
      try {
        const { data, error } = await supabase.from('news').select('*');
        if (!error && data) {
          setNews(data.map(mapNewsFromDb));
          newsLoadedFromSupabase = true;
          hasAnySupabaseSuccess = true;
          console.log("✅ [SISTEMA-LOG] Tabla 'news' cargada exitosamente de Supabase. Registros:", data.length);
        }
      } catch (err) {
        console.warn("⚠️ [SISTEMA-LOG] 'news' no accesible:", err);
      }
    }

    // FALLBACK: local
    if (!newsLoadedFromSupabase) {
      const saved = localStorage.getItem('edu_news');
      const loadedData = saved ? JSON.parse(saved) : INITIAL_NEWS;
      setNews(loadedData);
      console.log("ℹ️ [SISTEMA-LOG] Comunicados y Noticias cargados de Almacenamiento Local (offline fallback). Registros:", loadedData.length);
    }

    // 7-12. Additional System tables from the schema (loaded safely and logged)
    console.log("📂 [SISTEMA-LOG] Consultando tablas adicionales del sistema escolar...");
    
    // Cursos
    let cursosLoaded = false;
    try {
      const fetched = await refreshCursos();
      cursosLoaded = fetched !== null;
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta inicial de tabla 'cursos':", e);
    }
    if (!cursosLoaded) {
      const saved = localStorage.getItem('edu_cursos');
      if (saved) setCursos(JSON.parse(saved));
    }

    // Servicio
    let serviciosLoaded = false;
    try {
      const { data, error } = await supabase.from('servicio').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'servicio' de Supabase:", error.message || error);
      } else if (data) {
        const mappedServicios = data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre || '',
          descripcion: item.descripcion || '',
          duracion: item.duracion !== undefined && item.duracion !== null ? Number(item.duracion) : undefined,
          pago: item.pago !== undefined && item.pago !== null ? Number(item.pago) : undefined,
          created_at: item.created_at
        }));
        setServicios(mappedServicios);
        localStorage.setItem('edu_servicios', JSON.stringify(mappedServicios));
        serviciosLoaded = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'servicio' cargada de Supabase:", mappedServicios.length);
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de tabla 'servicio':", e);
    }
    if (!serviciosLoaded) {
      const saved = localStorage.getItem('edu_servicios');
      if (saved) setServicios(JSON.parse(saved));
    }

    // Servicio Cursos (Intermediate)
    let scLoaded = false;
    try {
      const { data, error } = await supabase.from('servicio_cursos').select('*');
      if (error) {
        const { data: altData, error: altError } = await supabase.from('servicio_curso').select('*');
        if (!altError && altData) {
          const mapped = altData.map((item: any) => ({
            id: item.id || item.d,
            servicio_id: item.servicio_id || item.servicioId || item.id_servicio,
            curso_id: item.curso_id || item.cursoId || item.id_curso
          }));
          setServicioCursos(mapped);
          localStorage.setItem('edu_servicio_cursos', JSON.stringify(mapped));
          scLoaded = true;
        }
      } else if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id || item.d,
          servicio_id: item.servicio_id || item.servicioId || item.id_servicio,
          curso_id: item.curso_id || item.cursoId || item.id_curso
        }));
        setServicioCursos(mapped);
        localStorage.setItem('edu_servicio_cursos', JSON.stringify(mapped));
        scLoaded = true;
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de intermediate table:", e);
    }
    if (!scLoaded) {
      const saved = localStorage.getItem('edu_servicio_cursos');
      if (saved) setServicioCursos(JSON.parse(saved));
    }

    // Servicio Profesor (Intermediate)
    let spLoaded = false;
    try {
      const { data, error } = await supabase.from('servicio_profesor').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'servicio_profesor' de Supabase:", error.message || error);
      } else if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          id_servicio: item.id_servicio || item.servicio_id || item.servicioId,
          id_profesor: item.id_profesor || item.profesor_id || item.id_usuario || item.usuario_id || item.teacherId
        }));
        setServicioProfesores(mapped);
        localStorage.setItem('edu_servicio_profesores', JSON.stringify(mapped));
        spLoaded = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'servicio_profesor' cargada de Supabase:", mapped.length, mapped);
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de tabla 'servicio_profesor':", e);
    }
    if (!spLoaded) {
      const saved = localStorage.getItem('edu_servicio_profesores');
      if (saved) setServicioProfesores(JSON.parse(saved));
    }

    // Notas (Grades)
    let notasLoaded = false;
    try {
      const { data, error } = await supabase.from('notas').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'notas' de Supabase:", error.message || error);
      } else if (data) {
        const mappedNotas: Nota[] = data.map((item: any) => {
          let rawQual = item.nota_cuantitativa || '';
          let courseId = item.id_curso || '';
          
          if (rawQual.includes('|||')) {
            const parts = rawQual.split('|||');
            rawQual = parts[0];
            courseId = parts[1];
          } else if (rawQual.startsWith('{') && rawQual.endsWith('}')) {
            try {
              const parsed = JSON.parse(rawQual);
              rawQual = parsed.q || '';
              courseId = parsed.c || '';
            } catch (e) {
              // Ignore
            }
          }
          
          return {
            id: item.id,
            created_at: item.created_at,
            id_estudiante: item.id_estudiante,
            id_profesor: item.id_profesor,
            id_curso: courseId,
            nota_numerica: item.nota_numerica !== undefined && item.nota_numerica !== null ? Number(item.nota_numerica) : null,
            nota_cuantitativa: rawQual
          };
        });
        setNotas(mappedNotas);
        localStorage.setItem('edu_notas', JSON.stringify(mappedNotas));
        notasLoaded = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'notas' cargada de Supabase:", mappedNotas.length);
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de tabla 'notas':", e);
    }
    if (!notasLoaded) {
      const saved = localStorage.getItem('edu_notas');
      if (saved) setNotas(JSON.parse(saved));
    }

    // Prestaciones
    try {
      const { data, error } = await supabase.from('prestaciones').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'prestaciones' de Supabase:", error.message || error);
      } else {
        console.log("✅ [SISTEMA-LOG] Tabla 'prestaciones' consultada exitosamente de Supabase. Registros:", data?.length || 0, data);
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de tabla 'prestaciones':", e);
    }

    // Especialidades
    try {
      const { data, error } = await supabase.from('especialidades').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'especialidades' de Supabase:", error.message || error);
      } else {
        console.log("✅ [SISTEMA-LOG] Tabla 'especialidades' consultada exitosamente de Supabase. Registros:", data?.length || 0, data);
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de tabla 'especialidades':", e);
    }

    // Historial
    try {
      const { data, error } = await supabase.from('historial').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'historial' de Supabase:", error.message || error);
      } else {
        console.log("✅ [SISTEMA-LOG] Tabla 'historial' consultada exitosamente de Supabase. Registros:", data?.length || 0, data);
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de tabla 'historial':", e);
    }

    // Recuperación
    try {
      const { data, error } = await supabase.from('recuperacion').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'recuperacion' de Supabase:", error.message || error);
      } else {
        console.log("✅ [SISTEMA-LOG] Tabla 'recuperacion' consultada exitosamente de Supabase. Registros:", data?.length || 0, data);
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en la consulta de tabla 'recuperacion':", e);
    }

    // Facturas / Bóveda de Comprobantes (Supabase Synchronized)
    let facturasLoadedFromSupabase = false;
    console.log("📂 [SISTEMA-LOG] Cargando tabla: Facturas de la Bóveda...");
    try {
      const { data, error } = await supabase.from('facturas').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const mappedFacturas: Factura[] = data.map((item: any) => ({
          id: item.id,
          tipo: item.tipo,
          student_id: item.student_id,
          teacher_id: item.teacher_id,
          monto: Number(item.monto),
          concepto: item.concepto,
          estado: item.estado,
          pdf_url: item.pdf_url,
          detalles: typeof item.detalles === 'string' ? JSON.parse(item.detalles) : (item.detalles || {}),
          created_at: item.created_at
        }));
        setFacturas(mappedFacturas);
        localStorage.setItem('edu_facturas', JSON.stringify(mappedFacturas));
        facturasLoadedFromSupabase = true;
        hasAnySupabaseSuccess = true;
        console.log("✅ [SISTEMA-LOG] Tabla 'facturas' cargada exitosamente de Supabase. Registros:", data.length);
      }
    } catch (err) {
      console.warn("⚠️ [SISTEMA-LOG] 'facturas' no accesible:", err);
    }

    if (!facturasLoadedFromSupabase) {
      const saved = localStorage.getItem('edu_facturas');
      const loadedData = saved ? JSON.parse(saved) : [];
      setFacturas(loadedData);
      console.log("ℹ️ [SISTEMA-LOG] Facturas cargadas de Almacenamiento Local (offline fallback). Registros:", loadedData.length);
    }

    console.log("%c🏁 [SISTEMA] Sincronización de base de datos finalizada.", "color: #10b981; font-weight: bold; font-size: 13px;");

    // Update global status
    setErrorLogs(newErrors);
    if (hasAnySupabaseSuccess) {
      setSupabaseStatus('connected');
    } else {
      setSupabaseStatus('local');
    }
  };

  // Seed helper if Supabase connected but tables are empty
  const seedIfEmpty = async () => {
    try {
      const { count, error } = await supabase.from('students').select('*', { count: 'exact', head: true });
      if (!error && (count === null || count === 0)) {
        await supabase.from('students').insert(INITIAL_STUDENTS.map(mapStudentToDb));
        await supabase.from('teachers').insert(INITIAL_TEACHERS.map(mapTeacherToDb));
        await supabase.from('transactions').insert(INITIAL_TRANSACTIONS.map(mapTransactionToDb));
        await supabase.from('news').insert(INITIAL_NEWS.map(mapNewsToDb));
        
        // Flatten and seed resources
        const flattenResources = (items: ResourceItem[], parentId: string | null = null): any[] => {
          let rows: any[] = [];
          items.forEach(item => {
            rows.push({
              id: item.id,
              name: item.name,
              type: item.type,
              size: item.size || null,
              category: item.category || null,
              url: item.url || null,
              parent_id: parentId,
              parentId: parentId,
              updated_at: item.updatedAt,
              updatedAt: item.updatedAt
            });
            if (item.children && item.children.length > 0) {
              rows = [...rows, ...flattenResources(item.children, item.id)];
            }
          });
          return rows;
        };
        const flatRes = flattenResources(INITIAL_RESOURCES);
        await supabase.from('resources').insert(flatRes);

        const { error: attErr } = await supabase.from('attendance').insert(INITIAL_ATTENDANCE.map(mapAttendanceToDb));
        if (attErr) {
          await supabase.from('attendance_records').insert(INITIAL_ATTENDANCE.map(mapAttendanceToDb));
        }
        
        console.log('Successfully seeded Supabase with offline starter data!');
        await loadData();
      }
    } catch (err) {
      console.warn('Auto-seeding could not complete on Supabase database, likely missing target tables Schema.', err);
    }
  };

  // Run on start
  useEffect(() => {
    loadData().then(() => {
      const hasUrl = !!(import.meta as any).env?.VITE_SUPABASE_URL;
      const hasKey = !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      if (hasUrl && hasKey) {
        seedIfEmpty();
      }
    });
  }, []);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('edu_current_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('edu_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('edu_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('edu_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('edu_transactions', JSON.stringify(transactions));
    if (!balanceLoadedFromCaja) {
      const txTotal = transactions.reduce((acc, curr) => {
        return curr.type === 'ingreso' ? acc + curr.amount : acc - curr.amount;
      }, 15000);
      setBalance(txTotal);
    }
  }, [transactions, balanceLoadedFromCaja]);

  useEffect(() => {
    localStorage.setItem('edu_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('edu_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('edu_app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('edu_facturas', JSON.stringify(facturas));
  }, [facturas]);

  useEffect(() => {
    const handleRealtimeNewsChange = (payload: any) => {
      const { eventType, new: newRow, old: oldRow } = payload;
      console.log('🔥 [REALTIME-NEWS] Cambio recibido en Supabase:', payload);
      
      if (eventType === 'INSERT') {
        const parsedNews = mapNewsFromDb(newRow);
        setNews(prev => {
          if (prev.some(n => n.id === parsedNews.id)) return prev;
          return [parsedNews, ...prev];
        });

        const titleText = parsedNews.category === 'evento' ? '📅 Nuevo Evento Publicado' : '📢 Nuevo Aviso Escolar';
        const newNotif: AppNotification = {
          id: 'notif-' + Math.random().toString(36).substring(2, 11),
          title: titleText,
          content: `${parsedNews.title}: ${parsedNews.content}`,
          type: parsedNews.category === 'evento' ? 'event' : 'news',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-ES'),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
      } 
      else if (eventType === 'UPDATE') {
        const parsedNews = mapNewsFromDb(newRow);
        setNews(prev => prev.map(n => n.id === parsedNews.id ? parsedNews : n));
      } 
      else if (eventType === 'DELETE') {
        const deletedId = oldRow?.id;
        if (deletedId) {
          setNews(prev => prev.filter(n => n.id !== deletedId && safeUUID(n.id) !== deletedId));
        }
      }
    };

    const channel1 = supabase
      .channel('realtime-eventos-noticias')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'eventos_noticias' },
        (payload) => handleRealtimeNewsChange(payload)
      )
      .subscribe();

    const channel2 = supabase
      .channel('realtime-news-fallback')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        (payload) => handleRealtimeNewsChange(payload)
      )
      .subscribe();

    const channel3 = supabase
      .channel('realtime-notifications-push')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new;
          if (!n) return;
          const mappedNotif: AppNotification = {
            id: n.id || generateUUID(),
            title: n.title || 'Nueva Notificación',
            content: n.body || '',
            type: n.type === 'general' ? 'news' : n.type === 'recordatorio' ? 'event' : n.type === 'oferta' ? 'finance' : 'system',
            timestamp: 'Hace instantes',
            read: false
          };
          setNotifications(prev => {
            if (prev.some(x => x.id === mappedNotif.id)) return prev;
            return [mappedNotif, ...prev];
          });

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(n.title || 'Alerta EnlaceC', {
                body: n.body || '',
                icon: n.image_url || '/icon.png'
              });
            } catch (e) {
              console.warn('Push notification error:', e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('edu_theme', JSON.stringify(theme));
    
    const root = window.document.documentElement;
    const layout = 'frosted-glass';
    root.classList.remove('style-frosted-glass', 'style-windows-fluent', 'style-neo-brutalist', 'style-minimalist', 'style-cosmic-dark');
    root.classList.add(`style-${layout}`);
    
    const isCosmic = false;
    const applyThemeMode = (isDark: boolean) => {
      const finalDark = isCosmic || isDark;
      if (finalDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    if (theme.mode === 'dark') {
      applyThemeMode(true);
    } else if (theme.mode === 'light') {
      applyThemeMode(false);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyThemeMode(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        applyThemeMode(e.matches);
      };
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        (mediaQuery as any).addListener(handleChange);
      }
      
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          (mediaQuery as any).removeListener(handleChange);
        }
      };
    }
  }, [theme]);

  // Login handler
  const login = (phone: string, passwordStr: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '').trim();
    const cleanPassword = passwordStr.trim();

    // 1. First search in database loaded users (teachers)
    const matchedUser = teachers.find(t => {
      const dbPhoneStr = String(t.telefono || '').replace(/\D/g, '').trim();
      const dbPassword = (t.password || '').trim();
      
      // Match phone (either exactly as typed or digits only comparison)
      const phoneMatches = dbPhoneStr === cleanPhone || String(t.telefono).trim() === phone.trim();
      // Match password exactly
      const passwordMatches = dbPassword === cleanPassword;
      
      return phoneMatches && passwordMatches;
    });

    if (matchedUser) {
      const dbRol = (matchedUser.rol || 'docente').toLowerCase().trim();
      let resolvedRole: 'admin' | 'docente' = 'docente';
      
      // Filter role using tolower to avoid problems
      if (dbRol.includes('admin') || dbRol.includes('director') || dbRol.includes('administrador')) {
        resolvedRole = 'admin';
      }

      setCurrentUser({
        id: matchedUser.id,
        name: matchedUser.name || `${matchedUser.nombre} ${matchedUser.apellido}`,
        email: matchedUser.email || '',
        role: resolvedRole,
        avatarUrl: matchedUser.avatarUrl,
        course: matchedUser.activeCourses ? matchedUser.activeCourses[0] : undefined,
        si_pass: matchedUser.si_pass !== undefined ? !!matchedUser.si_pass : true
      });
      return true;
    }

    // 2. Default Fallbacks (using phone number or placeholder names)
    const lowerPhone = phone.trim().toLowerCase();
    
    // Admin fallback:
    if (lowerPhone === 'admin' || lowerPhone === '900000000' || lowerPhone === '123456789') {
      if (cleanPassword === 'admin123') {
        setCurrentUser({
          id: 'USR-ADMIN',
          name: 'Directora Patricia Mendoza',
          email: 'admin@sistema.edu',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120'
        });
        return true;
      }
    }
    
    // Docente fallback:
    if (lowerPhone === 'docente' || lowerPhone === '954123456') {
      if (cleanPassword === 'docente123') {
        const firstTeacher = teachers.find(t => {
          const dbRol = (t.rol || 'docente').toLowerCase().trim();
          return dbRol === 'docente' || dbRol === 'profesor';
        }) || teachers[0] || INITIAL_TEACHERS[0];
        
        setCurrentUser({
          id: firstTeacher.id,
          name: firstTeacher.name || `${firstTeacher.nombre} ${firstTeacher.apellido}`,
          email: firstTeacher.email || '',
          role: 'docente',
          avatarUrl: firstTeacher.avatarUrl,
          course: firstTeacher.activeCourses ? firstTeacher.activeCourses[0] : undefined,
          si_pass: firstTeacher.si_pass !== undefined ? !!firstTeacher.si_pass : true
        });
        return true;
      }
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Helper for generating automatic UUIDs
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Helper to upload base64 images to Supabase Storage under 'perfiles' bucket
  const uploadProfileImage = async (id: string, type: 'students' | 'teachers', dataUrl: string, telefono?: string | number): Promise<string | null> => {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return dataUrl;
    }

    setUploadProgress({
      isOpen: true,
      progress: 5,
      title: type === 'students' ? 'Estudiante: Sincronizando foto con el almacenamiento de perfiles...' : 'Docente: Sincronizando foto con el almacenamiento de perfiles...',
      status: 'uploading'
    });

    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress > 92) {
        currentProgress = 92;
      }
      setUploadProgress(prev => ({
        ...prev,
        progress: currentProgress
      }));
    }, 150);

    try {
      console.log(`📡 [SISTEMA-STORAGE] Iniciando carga de imagen para ${type} (ID: ${id}, Teléfono: ${telefono}) al bucket 'perfiles'...`);
      const arr = dataUrl.split(',');
      if (arr.length < 2) {
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, status: 'error', progress: 100 }));
        setTimeout(() => setUploadProgress(prev => ({ ...prev, isOpen: false })), 2000);
        return null;
      }
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      const extension = mime.split('/')[1] || 'jpg';
      const fileIdentifier = telefono ? String(telefono).replace(/\D/g, '') : id;
      const filePath = `${type}/${fileIdentifier}.${extension}`;

      const { data, error } = await supabase.storage
        .from('perfiles')
        .upload(filePath, u8arr, {
          contentType: mime,
          upsert: true
        });

      clearInterval(interval);

      if (error) {
        console.warn(`⚠️ [SISTEMA-STORAGE] Error de carga en bucket 'perfiles':`, error.message || error);
        setUploadProgress(prev => ({
          ...prev,
          status: 'error',
          progress: 100,
          title: `Error al subir imagen: ${error.message || 'Error en servidor'}`
        }));
        setTimeout(() => setUploadProgress(prev => ({ ...prev, isOpen: false })), 2500);
        return null;
      }

      console.log(`✅ [SISTEMA-STORAGE] Imagen subida exitosamente a Supabase Storage:`, data.path);

      const { data: publicUrlData } = supabase.storage.from('perfiles').getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl || '';
      console.log(`🔗 [SISTEMA-STORAGE] URL pública obtenida:`, publicUrl);

      setUploadProgress(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        title: 'Imagen de perfil guardada correctamente en la nube.'
      }));

      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadProgress(prev => ({ ...prev, isOpen: false }));

      return publicUrl;
    } catch (err: any) {
      clearInterval(interval);
      console.error(`❌ [SISTEMA-STORAGE] Error inesperado en carga de imagen:`, err);
      setUploadProgress(prev => ({
        ...prev,
        status: 'error',
        progress: 100,
        title: `Error inesperado: ${err?.message || 'Fallo de red'}`
      }));
      setTimeout(() => setUploadProgress(prev => ({ ...prev, isOpen: false })), 2500);
      return null;
    }
  };

  // Student CRUD actions with Supabase write-through
  const addStudent = async (studentData: Omit<Student, 'id'>) => {
    const newId = generateUUID();
    const originalAvatar = studentData.avatarUrl;

    const newStudent: Student = {
      ...studentData,
      id: newId,
      created_at: new Date().toISOString()
    };
    setStudents(prev => [...prev, newStudent]);
    
    let isRegistered = false;
    try {
      const { error } = await supabase.from('estudiantes').insert([mapStudentToEstudiantesDb(newStudent)]);
      if (error) {
        const { error: error2 } = await supabase.from('students').insert([mapStudentToDb(newStudent)]);
        if (!error2) isRegistered = true;
      } else {
        isRegistered = true;
      }
    } catch (e) {
      try {
        const { error: error2 } = await supabase.from('students').insert([mapStudentToDb(newStudent)]);
        if (!error2) isRegistered = true;
      } catch (err2) {
        console.error('Error writing student to Supabase:', err2);
      }
    }

    console.log(`📢 [SISTEMA-REGISTRO] Registro de estudiante en BD confirmado: ${isRegistered ? 'EXITOSO' : 'FALLIDO (Modo Offline)'}`);
    
    // Subir foto de perfil después de confirmar el registro en la base de datos
    if (originalAvatar && originalAvatar.startsWith('data:')) {
      const cloudUrl = await uploadProfileImage(newId, 'students', originalAvatar, newStudent.contacto);
      if (cloudUrl) {
        setStudents(prev => prev.map(s => s.id === newId ? { ...s, avatarUrl: cloudUrl } : s));
        const updatedStudent: Student = {
          ...newStudent,
          avatarUrl: cloudUrl
        };
        try {
          const { error } = await supabase.from('estudiantes').update(mapStudentToEstudiantesDb(updatedStudent)).eq('id', newId);
          if (error) {
            await supabase.from('students').update(mapStudentToDb(updatedStudent)).eq('id', newId);
          }
          console.log(`✅ [SISTEMA-REGISTRO] Ficha de estudiante actualizada en BD con la URL pública de la foto.`);
        } catch (upErr) {
          console.warn(`⚠️ No se pudo actualizar la URL de la foto en la BD:`, upErr);
        }
      }
    }
    
    // Siempre registrar la matrícula como ingreso de finanzas de forma secuencial
    const studentDisplayName = `${studentData.nombre || studentData.name || ''} ${studentData.apellido || ''}`.trim() || 'Estudiante';
    await addTransaction({
      type: 'ingreso',
      amount: 150,
      concept: `Inscripción y Matrícula - ${studentDisplayName}`,
      category: 'Colegiatura',
      studentId: newStudent.id
    });

    return newStudent;
  };

  const updateStudent = async (updated: Student) => {
    let finalStudent = { ...updated };
    const originalAvatar = updated.avatarUrl;

    if (originalAvatar && originalAvatar.startsWith('data:')) {
      const cloudUrl = await uploadProfileImage(updated.id, 'students', originalAvatar, updated.contacto);
      if (cloudUrl) {
        finalStudent = {
          ...updated,
          avatarUrl: cloudUrl
        };
      }
    }

    setStudents(prev => prev.map(s => s.id === finalStudent.id ? finalStudent : s));
    try {
      const { error } = await supabase.from('estudiantes').update(mapStudentToEstudiantesDb(finalStudent)).eq('id', finalStudent.id);
      if (error) {
        await supabase.from('students').update(mapStudentToDb(finalStudent)).eq('id', finalStudent.id);
      }
    } catch (e) {
      try {
        await supabase.from('students').update(mapStudentToDb(finalStudent)).eq('id', finalStudent.id);
      } catch (err2) {
        console.error('Error updating student in Supabase:', err2);
      }
    }
  };

  const deleteStudent = async (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    try {
      const { error } = await supabase.from('estudiantes').delete().eq('id', id);
      if (error) {
        await supabase.from('students').delete().eq('id', id);
      }
    } catch (e) {
      try {
        await supabase.from('students').delete().eq('id', id);
      } catch (err2) {
        console.error('Error deleting student from Supabase:', err2);
      }
    }
  };

  // Teacher/Docente CRUD actions with Supabase write-through
  const addTeacher = async (teacherData: Omit<Teacher, 'id'>) => {
    const tempPassword = `temp-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = generateUUID();
    const originalAvatar = teacherData.avatarUrl || teacherData.foto_url;

    const newTeacher: Teacher = {
      ...teacherData,
      id: newId,
      password: tempPassword,
      si_pass: true, // Mark that they need to change password on first login
      activado: teacherData.activado !== undefined ? teacherData.activado : true,
      created_at: new Date().toISOString()
    };
    setTeachers(prev => [...prev, newTeacher]);

    let isRegistered = false;
    try {
      const { error } = await supabase.from('usuarios').insert([mapTeacherToDb(newTeacher)]);
      if (!error) {
        isRegistered = true;
      } else {
        console.error('Error inserting into usuarios:', error);
      }
    } catch (e) {
      console.error('Error adding teacher to Supabase:', e);
    }

    console.log(`📢 [SISTEMA-REGISTRO] Registro de docente en BD confirmado: ${isRegistered ? 'EXITOSO' : 'FALLIDO (Modo Offline)'}`);

    // Subir foto de perfil después de confirmar el registro en la base de datos
    if (originalAvatar && originalAvatar.startsWith('data:')) {
      const cloudUrl = await uploadProfileImage(newId, 'teachers', originalAvatar, newTeacher.telefono);
      if (cloudUrl) {
        setTeachers(prev => prev.map(t => t.id === newId ? { ...t, avatarUrl: cloudUrl, foto_url: cloudUrl } : t));
        const updatedTeacher: Teacher = {
          ...newTeacher,
          avatarUrl: cloudUrl,
          foto_url: cloudUrl
        };
        try {
          const { error } = await supabase.from('usuarios').update(mapTeacherToDb(updatedTeacher)).eq('id', newId);
          if (error) {
            console.error('Error updating public url in usuarios:', error);
          }
          console.log(`✅ [SISTEMA-REGISTRO] Ficha de docente actualizada en BD con la URL pública de la foto.`);
        } catch (upErr) {
          console.warn(`⚠️ No se pudo actualizar la URL de la foto del docente en la BD:`, upErr);
        }
      }
    }
  };

  const updateTeacher = async (updated: Teacher) => {
    let finalTeacher = { ...updated };
    const originalAvatar = updated.avatarUrl || updated.foto_url;

    if (originalAvatar && originalAvatar.startsWith('data:')) {
      const cloudUrl = await uploadProfileImage(updated.id, 'teachers', originalAvatar, updated.telefono);
      if (cloudUrl) {
        finalTeacher = {
          ...updated,
          avatarUrl: cloudUrl,
          foto_url: cloudUrl
        };
      }
    }

    setTeachers(prev => prev.map(t => t.id === finalTeacher.id ? finalTeacher : t));
    
    if (currentUser && currentUser.id === finalTeacher.id) {
      setCurrentUser(prev => prev ? {
        ...prev,
        name: finalTeacher.name,
        email: finalTeacher.email,
        avatarUrl: finalTeacher.avatarUrl
      } : null);
    }

    try {
      const { error } = await supabase.from('usuarios').update(mapTeacherToDb(finalTeacher)).eq('id', finalTeacher.id);
      if (error) {
        console.error('Error updating teacher in usuarios:', error);
      }
    } catch (e) {
      console.error('Error updating teacher in Supabase:', e);
    }
  };

  const deleteTeacher = async (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    setServicioProfesores(prev => {
      const updated = prev.filter(link => link.id_profesor !== id);
      localStorage.setItem('edu_servicio_profesores', JSON.stringify(updated));
      return updated;
    });
    try {
      await supabase.from('servicio_profesor').delete().eq('id_profesor', id);
    } catch (e) {
      console.warn("Error deleting relations from servicio_profesor for teacher:", e);
    }
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) {
        console.error('Error deleting teacher in usuarios:', error);
      }
    } catch (e) {
      console.error('Error deleting teacher from Supabase:', e);
    }
  };

  // Resource actions with Supabase write-through
  const addResource = async (parentId: string | null, resourceData: Omit<ResourceItem, 'id' | 'updatedAt'>) => {
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    const timestamp = new Date().toISOString();
    const newId = generateUUID();
    
    const newRes: ResourceItem = {
      ...resourceData,
      id: newId,
      updatedAt: new Date().toLocaleDateString('es-ES') + ' ' + new Date().toLocaleTimeString('es-ES'),
      ...(resourceData.type === 'folder' ? { children: [] } : {})
    };

    if (parentId === null) {
      // Create a category (folder)
      setResources(prev => [...prev, newRes]);

      const dbRow = {
        id: newId,
        nombre: resourceData.name,
        descripcion: `Categoría de ${resourceData.name}`
      };

      try {
        const { error } = await supabase.from('categorias').insert([dbRow]);
        if (error) {
          console.error('Error inserting into categorias table, attempting fallback:', error);
          // Fallback to legacy single table insert
          const legacyRow = {
            id: newId,
            nombre: resourceData.name,
            tipo: 'folder',
            updated_at: timestamp
          };
          await supabase.from('recursos').insert([legacyRow]);
        } else {
          console.log('✅ [SISTEMA-LOG] Categoría insertada en Supabase:', dbRow);
        }
      } catch (e) {
        console.error('Exception inserting into categorias:', e);
      }
    } else {
      // Create a resource (file) inside a category
      const addToChildren = (items: ResourceItem[]): ResourceItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newRes]
            };
          } else if (item.children) {
            return {
              ...item,
              children: addToChildren(item.children)
            };
          }
          return item;
        });
      };
      setResources(prev => addToChildren(prev));

      const dbRow = {
        id: newId,
        nombre: resourceData.name,
        url: resourceData.url || `https://example.com/resources/${encodeURIComponent(resourceData.name)}`,
        categoria_id: parentId,
        tipo: resourceData.type || 'file',
        formato: resourceData.size || '1.2 MB'
      };

      try {
        const { error } = await supabase.from('recursos').insert([dbRow]);
        if (error) {
          console.error('Error inserting into recursos table, attempting fallback:', error);
          // Fallback to legacy single table insert
          const legacyRow = {
            id: newId,
            nombre: resourceData.name,
            tipo: 'file',
            size: resourceData.size,
            url: dbRow.url,
            parent_id: parentId,
            updated_at: timestamp
          };
          await supabase.from('resources').insert([legacyRow]);
        } else {
          console.log('✅ [SISTEMA-LOG] Recurso insertado en Supabase:', dbRow);
        }
      } catch (e) {
        console.error('Exception inserting into recursos:', e);
      }
    }
  };

  const deleteResource = async (id: string) => {
    const removeFromList = (items: ResourceItem[]): ResourceItem[] => {
      return items
        .filter(item => item.id !== id)
        .map(item => {
          if (item.children) {
            return {
              ...item,
              children: removeFromList(item.children)
            };
          }
          return item;
        });
    };
    setResources(prev => removeFromList(prev));

    try {
      // To avoid foreign key issues, let's delete any resources belonging to this category first (if it's a category)
      const { data: recsToDelete } = await supabase.from('recursos').select('id').eq('categoria_id', id);
      if (recsToDelete && recsToDelete.length > 0) {
        const recIds = recsToDelete.map(r => r.id);
        await supabase.from('recursos').delete().in('id', recIds);
      }
      
      // Now delete category
      const { error: catErr } = await supabase.from('categorias').delete().eq('id', id);
      
      // If not a category or not found, try deleting directly as a single resource
      const { error: recErr } = await supabase.from('recursos').delete().eq('id', id);
      
      // Try legacy fallbacks as well
      await supabase.from('resources').delete().eq('id', id);

      console.log(`✅ [SISTEMA-LOG] Intento de eliminación para ID ${id}. Categoría Err:`, catErr, `Recurso Err:`, recErr);
    } catch (e) {
      console.error('Error deleting resource from Supabase:', e);
    }
  };

  // Finance actions with Supabase write-through
  const addTransaction = async (txData: Omit<FinancialTransaction, 'id' | 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newTx: FinancialTransaction = {
      ...txData,
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date: todayStr
    };

    // Calculate new balance locally using current state
    const delta = txData.amount;
    const isEgreso = txData.type === 'egreso';
    const nextBalance = isEgreso ? balance - delta : balance + delta;

    setTransactions(prev => [newTx, ...prev]);
    setBalance(nextBalance);
    // Since we are writing to caja database now, mark balance as loaded/synced
    setBalanceLoadedFromCaja(true);

    if (txData.studentId && txData.category === 'Colegiatura') {
      const s = students.find(item => item.id === txData.studentId);
      if (s) {
        await updateStudent({ ...s, balance: Math.max(0, s.balance - txData.amount) });
      }
    }
    if (txData.teacherId && txData.category === 'Salario Docente') {
      const t = teachers.find(item => item.id === txData.teacherId);
      if (t) {
        await updateTeacher({ ...t, paymentStatus: 'paid' });
      }
    }

    // 1. Save to transactions table (with fallback to movimientos)
    try {
      const dbRow = mapTransactionToDb(newTx);
      console.log('📂 [FINANZAS] Insertando nueva transacción en Supabase "transactions":', dbRow);
      const { error } = await supabase.from('transactions').insert([dbRow]);
      if (error) {
        console.warn('⚠️ Error al insertar en "transactions", intentando fallback en "movimientos":', error);
        await supabase.from('movimientos').insert([dbRow]);
      } else {
        console.log('✅ [FINANZAS] Transacción agregada exitosamente a la tabla "transactions"');
      }
    } catch (e) {
      console.error('Error adding transaction to Supabase:', e);
    }

    // 2. Save to caja table
    try {
      const dbCajaRow = {
        monto: nextBalance,
        fecha_actualizado: new Date().toISOString()
      };
      const { error: cajaErr } = await supabase.from('caja').insert([dbCajaRow]);
      if (cajaErr) {
        console.error('Error inserting into caja table:', cajaErr);
      } else {
        console.log('✅ [SISTEMA-LOG] Caja (Saldo) actualizada exitosamente en Supabase:', dbCajaRow);
      }
    } catch (e) {
      console.error('Exception inserting into caja:', e);
    }
  };

  // Attendance actions with Supabase write-through
  const registerAttendance = async (recordData: Omit<AttendanceRecord, 'id' | 'time'>) => {
    const timeFormatted = new Date().toTimeString().split(' ')[0].substring(0, 5);
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: generateUUID(),
      time: timeFormatted
    };
    
    setAttendance(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('edu_attendance', JSON.stringify(updated));
      return updated;
    });

    recordData.students.forEach(async (studentAtt) => {
      const s = students.find(item => item.id === studentAtt.studentId);
      if (s) {
        const previousRate = s.attendanceRate;
        const delta = studentAtt.present ? 0.3 : -1.5;
        const nextRate = Math.min(100, Math.max(50, parseFloat((previousRate + delta).toFixed(1))));
        await updateStudent({ ...s, attendanceRate: nextRate });
      }
    });

    try {
      const { error: sesErr } = await supabase.from('sesiones').insert([{
        id: newRecord.id,
        id_profesor: newRecord.teacherId,
        idProfesor: newRecord.teacherId,
        fecha: newRecord.date,
        date: newRecord.date,
        inicio: newRecord.inicio || newRecord.time,
        time: newRecord.time,
        fin: newRecord.fin || newRecord.time,
        tema: newRecord.comments || 'Asistencia registrada',
        comments: newRecord.comments,
        monto: newRecord.monto || 0,
        cantidad_sesiones: newRecord.cantidadSesiones || 1,
        id_curso: newRecord.courseId || null,
        curso_nombre: newRecord.course
      }]);

      if (!sesErr) {
        const attendanceRows = recordData.students.map(s => ({
          id: generateUUID(),
          id_sesion: newRecord.id,
          idSesion: newRecord.id,
          id_estudiante: s.studentId,
          idEstudiante: s.studentId,
          estado: s.present,
          present: s.present,
          observacion: null
        }));
        await supabase.from('asistencia_estudiantes').insert(attendanceRows);
      } else {
        const { error } = await supabase.from('attendance').insert([mapAttendanceToDb(newRecord)]);
        if (error) {
          await supabase.from('attendance_records').insert([mapAttendanceToDb(newRecord)]);
        }
      }
    } catch (e) {
      try {
        const { error } = await supabase.from('attendance').insert([mapAttendanceToDb(newRecord)]);
        if (error) {
          await supabase.from('attendance_records').insert([mapAttendanceToDb(newRecord)]);
        }
      } catch (err2) {
        console.error('Error registering attendance to Supabase:', err2);
      }
    }
  };

  // Theme modifications
  const updateTheme = (newSettings: Partial<AppThemeConfig>) => {
    setTheme(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // News additions with Supabase write-through
  const addNews = async (newsData: Omit<SchoolNews, 'id' | 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const item: SchoolNews = {
      ...newsData,
      id: generateUUID(),
      date: todayStr
    };
    setNews(prev => [item, ...prev]);
    
    try {
      const dbPayload = mapNewsToDb(item);
      console.log("📂 [SISTEMA-LOG] Insertando registro en Supabase 'eventos_noticias':", dbPayload);
      const { data, error } = await supabase.from('eventos_noticias').insert([dbPayload]).select();
      if (error) {
        console.warn("⚠️ Error al insertar en 'eventos_noticias':", error.message);
        await supabase.from('news').insert([dbPayload]);
      } else {
        console.log("✅ [SISTEMA-LOG] Evento/Noticia guardado exitosamente en 'eventos_noticias':", data);
      }
    } catch (e) {
      console.error('Error adding news to Supabase:', e);
    }
  };

  const updateNews = async (updatedItem: SchoolNews) => {
    setNews(prev => prev.map(n => n.id === updatedItem.id ? updatedItem : n));
    try {
      const dbPayload = mapNewsToDb(updatedItem);
      console.log("📂 [SISTEMA-LOG] Actualizando registro en Supabase 'eventos_noticias':", dbPayload);
      const { error } = await supabase.from('eventos_noticias').update(dbPayload).eq('id', safeUUID(updatedItem.id));
      if (error) {
        console.warn("⚠️ Error al actualizar en 'eventos_noticias':", error.message);
        await supabase.from('news').update(dbPayload).eq('id', safeUUID(updatedItem.id));
      } else {
        console.log("✅ [SISTEMA-LOG] Evento/Noticia actualizado exitosamente en 'eventos_noticias'");
      }
    } catch (e) {
      console.error('Error updating news in Supabase:', e);
    }
  };

  const deleteNews = async (id: string) => {
    setNews(prev => prev.filter(n => n.id !== id));
    try {
      console.log("📂 [SISTEMA-LOG] Eliminando registro de Supabase 'eventos_noticias' con id:", id);
      const { error } = await supabase.from('eventos_noticias').delete().eq('id', safeUUID(id));
      if (error) {
        console.warn("⚠️ Error al eliminar en 'eventos_noticias':", error.message);
        await supabase.from('news').delete().eq('id', safeUUID(id));
      } else {
        console.log("✅ [SISTEMA-LOG] Evento/Noticia eliminado exitosamente de 'eventos_noticias'");
      }
    } catch (e) {
      console.error('Error deleting news in Supabase:', e);
    }
  };

  const uploadNewsImage = async (bucket: 'avisos' | 'noticias' | string, fileName: string, fileOrDataUrl: File | string): Promise<string | null> => {
    setUploadProgress({
      isOpen: true,
      progress: 10,
      title: `Subiendo imagen a Cloudinary (enlacec_eventos_noticias)...`,
      status: 'uploading'
    });

    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 5;
      if (currentProgress > 90) currentProgress = 90;
      setUploadProgress(prev => ({ ...prev, progress: currentProgress }));
    }, 180);

    try {
      let dataUrlStr = '';
      if (typeof fileOrDataUrl === 'string') {
        dataUrlStr = fileOrDataUrl;
      } else {
        dataUrlStr = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(fileOrDataUrl);
        });
      }

      // 1. Try uploading to Cloudinary in folder 'enlacec_eventos_noticias' (Client-Side)
      if (dataUrlStr.startsWith('data:')) {
        const resData = await uploadToCloudinaryClient(
          dataUrlStr,
          fileName || `evento_noticia_${Date.now()}`,
          'enlacec_eventos_noticias'
        );

        if (resData?.url) {
          clearInterval(interval);
          setUploadProgress(prev => ({
            ...prev,
            status: 'success',
            progress: 100,
            title: 'Imagen de noticia subida exitosamente!'
          }));
          setTimeout(() => setUploadProgress(prev => ({ ...prev, isOpen: false })), 1200);
          return resData.url;
        }
      }

      // Fallback: Supabase Storage
      let body: any;
      let contentType = 'image/jpeg';

      if (typeof fileOrDataUrl === 'string') {
        if (!fileOrDataUrl.startsWith('data:')) {
          clearInterval(interval);
          setUploadProgress(prev => ({ ...prev, isOpen: false }));
          return fileOrDataUrl;
        }
        const arr = fileOrDataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        body = u8arr;
      } else {
        body = fileOrDataUrl;
        contentType = fileOrDataUrl.type;
      }

      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const uniqueName = `${Date.now()}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from(bucket || 'noticias')
        .upload(uniqueName, body, {
          contentType: contentType,
          upsert: true
        });

      clearInterval(interval);

      if (error) {
        const { data: fbData, error: fbError } = await supabase.storage
          .from('perfiles')
          .upload(`news/${uniqueName}`, body, {
            contentType: contentType,
            upsert: true
          });
        
        if (fbError) {
          return dataUrlStr;
        }

        const { data: fbUrlData } = supabase.storage.from('perfiles').getPublicUrl(`news/${uniqueName}`);
        setUploadProgress(prev => ({
          ...prev,
          status: 'success',
          progress: 100,
          title: 'Imagen subida con éxito.'
        }));
        setTimeout(() => setUploadProgress(prev => ({ ...prev, isOpen: false })), 1200);
        return fbUrlData?.publicUrl || dataUrlStr;
      }

      const { data: urlData } = supabase.storage.from(bucket || 'noticias').getPublicUrl(uniqueName);
      
      setUploadProgress(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        title: 'Imagen subida correctamente!'
      }));
      setTimeout(() => setUploadProgress(prev => ({ ...prev, isOpen: false })), 1200);
      return urlData?.publicUrl || dataUrlStr;
    } catch (err: any) {
      clearInterval(interval);
      console.error('Error uploading news image:', err);
      setUploadProgress(prev => ({
        ...prev,
        status: 'error',
        progress: 100,
        title: `Error al subir imagen: ${err.message || 'Error desconocido'}`
      }));
      setTimeout(() => setUploadProgress(prev => ({ ...prev, isOpen: false })), 1500);
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null;
    }
  };

  const addNotification = (notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: generateUUID(),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-ES'),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const requestBrowserNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Tu navegador no soporta Notificaciones Push del Navegador.');
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  };

  const addPushNotification = async (notifData: { title: string; body: string; type?: string; image_url?: string; send_to_all?: boolean }) => {
    const title = notifData.title || 'Notificación del Sistema';
    const body = notifData.body || '';
    const type = notifData.type || 'general';
    const image_url = notifData.image_url || '';
    const send_to_all = notifData.send_to_all ?? true;

    // Add local app notification
    addNotification({
      title,
      content: body,
      type: type === 'general' ? 'news' : type === 'recordatorio' ? 'event' : type === 'oferta' ? 'finance' : 'system'
    });

    // Fire browser push if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: image_url || '/icon.png'
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }

    // Persist in Supabase table: notifications
    try {
      await supabase.from('notifications').insert([{
        title,
        body,
        type,
        image_url,
        send_to_all
      }]);
    } catch (err) {
      console.warn('Could not insert push notification to Supabase table notifications:', err);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const changeTeacherPassword = async (id: string, newPass: string) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, password: newPass, si_pass: false } : t));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, si_pass: false } : null);
    }
    try {
      const teacherObj = teachers.find(t => t.id === id);
      if (teacherObj) {
        const updatedTeacher = { ...teacherObj, password: newPass, si_pass: false };
        const { error } = await supabase.from('usuarios').update(mapTeacherToDb(updatedTeacher)).eq('id', id);
        if (error) {
          await supabase.from('teachers').update(mapTeacherToDb(updatedTeacher)).eq('id', id);
        }
      }
    } catch (e) {
      try {
        const teacherObj = teachers.find(t => t.id === id);
        if (teacherObj) {
          const updatedTeacher = { ...teacherObj, password: newPass, si_pass: false };
          await supabase.from('teachers').update(mapTeacherToDb(updatedTeacher)).eq('id', id);
        }
      } catch (err2) {
        console.error('Error updating password in Supabase:', err2);
      }
    }
  };

  const refreshCursos = async (): Promise<Course[] | null> => {
    try {
      const { data, error } = await supabase.from('cursos').select('*');
      if (error) {
        console.warn("⚠️ [SISTEMA-LOG] No se pudo leer la tabla 'cursos' de Supabase (esquema o conexión):", error.message || error);
        return null;
      } else if (data) {
        const mappedCursos = data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre || '',
          descripcion: item.descripcion || '',
          pago: Number(item.pago) || 0,
          created_at: item.created_at
        }));
        setCursos(mappedCursos);
        localStorage.setItem('edu_cursos', JSON.stringify(mappedCursos));
        console.log("✅ [SISTEMA-LOG] refreshCursos: tabla 'cursos' consultada y cargada exitosamente de Supabase:", mappedCursos.length);
        return mappedCursos;
      }
    } catch (e) {
      console.warn("⚠️ [SISTEMA-LOG] Error en refreshCursos de tabla 'cursos':", e);
    }
    return null;
  };

  const addCourse = async (courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...courseData,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    setCursos(prev => {
      const updated = [...prev, newCourse];
      localStorage.setItem('edu_cursos', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('cursos').insert([{
        id: newCourse.id,
        nombre: newCourse.nombre,
        descripcion: newCourse.descripcion,
        pago: newCourse.pago
      }]);
    } catch (e) {
      console.error("Error writing course to Supabase:", e);
    }
  };

  const addService = async (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    setServicios(prev => {
      const updated = [...prev, newService];
      localStorage.setItem('edu_servicios', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('servicio').insert([{
        id: newService.id,
        nombre: newService.nombre,
        descripcion: newService.descripcion,
        duracion: newService.duracion !== undefined ? Number(newService.duracion) : null,
        pago: newService.pago !== undefined ? Number(newService.pago) : null
      }]);
    } catch (e) {
      console.error("Error writing service to Supabase:", e);
    }
  };

  const linkCourseToService = async (serviceId: string, courseId: string) => {
    const newLink: ServiceCourse = {
      id: generateUUID(),
      servicio_id: serviceId,
      curso_id: courseId
    };
    setServicioCursos(prev => {
      const updated = [...prev, newLink];
      localStorage.setItem('edu_servicio_cursos', JSON.stringify(updated));
      return updated;
    });

    // Option 1: servicio_cursos with id, servicio_id, curso_id
    try {
      const { error } = await supabase.from('servicio_cursos').insert([{
        id: newLink.id,
        servicio_id: serviceId,
        curso_id: courseId
      }]);
      if (!error) return;
    } catch (e) {}

    // Option 2: servicio_cursos with id, id_servicio, id_curso
    try {
      const { error } = await supabase.from('servicio_cursos').insert([{
        id: newLink.id,
        id_servicio: serviceId,
        id_curso: courseId
      }]);
      if (!error) return;
    } catch (e) {}

    // Option 3: servicio_curso with id, servicio_id, curso_id
    try {
      const { error } = await supabase.from('servicio_curso').insert([{
        id: newLink.id,
        servicio_id: serviceId,
        curso_id: courseId
      }]);
      if (!error) return;
    } catch (e) {}

    // Option 4: servicio_curso with d, id_servicio, id_curso
    try {
      const { error } = await supabase.from('servicio_curso').insert([{
        d: newLink.id,
        id_servicio: serviceId,
        id_curso: courseId
      }]);
      if (!error) return;
    } catch (e) {}

    // Option 5: servicio_curso with id, id_servicio, id_curso
    try {
      const { error } = await supabase.from('servicio_curso').insert([{
        id: newLink.id,
        id_servicio: serviceId,
        id_curso: courseId
      }]);
      if (!error) return;
    } catch (e) {
      console.error("Error writing intermediate link to Supabase after multiple attempts:", e);
    }
  };

  const updateCourse = async (updatedCourse: Course) => {
    setCursos(prev => {
      const updated = prev.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      localStorage.setItem('edu_cursos', JSON.stringify(updated));
      return updated;
    });
    try {
      await supabase.from('cursos').update({
        nombre: updatedCourse.nombre,
        descripcion: updatedCourse.descripcion,
        pago: updatedCourse.pago
      }).eq('id', updatedCourse.id);
    } catch (e) {
      console.error("Error updating course in Supabase:", e);
    }
  };

  const deleteCourse = async (id: string) => {
    // Delete linked relation references first
    setServicioCursos(prev => {
      const updated = prev.filter(link => link.curso_id !== id && link.cursoId !== id);
      localStorage.setItem('edu_servicio_cursos', JSON.stringify(updated));
      return updated;
    });
    try {
      await supabase.from('servicio_cursos').delete().eq('curso_id', id);
      await supabase.from('servicio_cursos').delete().eq('id_curso', id);
      await supabase.from('servicio_curso').delete().eq('curso_id', id);
      await supabase.from('servicio_curso').delete().eq('id_curso', id);
    } catch (e) {
      console.warn("Error deleting course relations from Supabase:", e);
    }

    // Now delete course itself
    setCursos(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('edu_cursos', JSON.stringify(updated));
      return updated;
    });
    try {
      await supabase.from('cursos').delete().eq('id', id);
    } catch (e) {
      console.error("Error deleting course from Supabase:", e);
    }
  };

  const updateService = async (updatedService: Service) => {
    setServicios(prev => {
      const updated = prev.map(s => s.id === updatedService.id ? updatedService : s);
      localStorage.setItem('edu_servicios', JSON.stringify(updated));
      return updated;
    });
    try {
      await supabase.from('servicio').update({
        nombre: updatedService.nombre,
        descripcion: updatedService.descripcion,
        duracion: updatedService.duracion !== undefined ? Number(updatedService.duracion) : null,
        pago: updatedService.pago !== undefined ? Number(updatedService.pago) : null
      }).eq('id', updatedService.id);
    } catch (e) {
      console.error("Error updating service in Supabase:", e);
    }
  };

  const deleteService = async (id: string) => {
    // Delete linked relation references first
    setServicioCursos(prev => {
      const updated = prev.filter(link => link.servicio_id !== id && link.servicioId !== id);
      localStorage.setItem('edu_servicio_cursos', JSON.stringify(updated));
      return updated;
    });
    setServicioProfesores(prev => {
      const updated = prev.filter(link => link.id_servicio !== id);
      localStorage.setItem('edu_servicio_profesores', JSON.stringify(updated));
      return updated;
    });
    try {
      await supabase.from('servicio_profesor').delete().eq('id_servicio', id);
    } catch (e) {
      console.warn("Error deleting relations from servicio_profesor for service:", e);
    }
    try {
      await supabase.from('servicio_cursos').delete().eq('servicio_id', id);
      await supabase.from('servicio_cursos').delete().eq('id_servicio', id);
      await supabase.from('servicio_curso').delete().eq('servicio_id', id);
      await supabase.from('servicio_curso').delete().eq('id_servicio', id);
    } catch (e) {
      console.warn("Error deleting service relations from Supabase:", e);
    }

    // Now delete service itself
    setServicios(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('edu_servicios', JSON.stringify(updated));
      return updated;
    });
    try {
      await supabase.from('servicio').delete().eq('id', id);
    } catch (e) {
      console.error("Error deleting service from Supabase:", e);
    }
  };

  const unlinkCourseFromService = async (serviceId: string, courseId: string) => {
    const link = servicioCursos.find(
      item => 
        (item.servicio_id === serviceId || item.servicioId === serviceId) && 
        (item.curso_id === courseId || item.cursoId === courseId)
    );
    if (!link) {
      console.warn("⚠️ No link found between service", serviceId, "and course", courseId);
      return;
    }
    const id = link.id;

    setServicioCursos(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('edu_servicio_cursos', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('servicio_cursos').delete().eq('id', id);
      await supabase.from('servicio_cursos').delete().eq('d', id);
      await supabase.from('servicio_curso').delete().eq('id', id);
      await supabase.from('servicio_curso').delete().eq('d', id);
    } catch (e) {
      console.error("Error unlinking course from service:", e);
    }
  };

  const linkTeacherToService = async (serviceId: string, teacherId: string) => {
    // Check if link already exists
    const exists = servicioProfesores.some(
      item => 
        (item.id_servicio === serviceId) && 
        (item.id_profesor === teacherId)
    );
    if (exists) {
      console.warn("⚠️ Link already exists between service", serviceId, "and teacher", teacherId);
      return;
    }

    const tempId = generateUUID();
    const newLink: ServiceTeacher = {
      id: tempId,
      id_servicio: serviceId,
      id_profesor: teacherId
    };

    setServicioProfesores(prev => {
      const updated = [...prev, newLink];
      localStorage.setItem('edu_servicio_profesores', JSON.stringify(updated));
      return updated;
    });

    try {
      // Insertion into 'servicio_profesor'
      const { data, error } = await supabase.from('servicio_profesor').insert([{
        id_servicio: serviceId,
        id_profesor: teacherId
      }]).select();

      if (data && data[0]) {
        // Update our local state link ID with the real ID returned from Supabase
        const realId = data[0].id;
        setServicioProfesores(prev => {
          const updated = prev.map(item => item.id === tempId ? { ...item, id: realId } : item);
          localStorage.setItem('edu_servicio_profesores', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error("Error linking teacher to service in Supabase:", e);
    }
  };

  const unlinkTeacherFromService = async (serviceId: string, teacherId: string) => {
    const link = servicioProfesores.find(
      item => 
        (item.id_servicio === serviceId) && 
        (item.id_profesor === teacherId)
    );
    if (!link) {
      console.warn("⚠️ No link found between service", serviceId, "and teacher", teacherId);
      return;
    }
    const id = link.id;

    setServicioProfesores(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('edu_servicio_profesores', JSON.stringify(updated));
      return updated;
    });

    try {
      console.log(`[SISTEMA-LOG] Intentando desvincular docente ${teacherId} de servicio ${serviceId} con ID de registro ${id}`);
      
      let rlsErrorFound = false;

      // 1. Try deleting by row ID (this is the most precise and robust method)
      if (id) {
        const { error: errId } = await supabase.from('servicio_profesor').delete().eq('id', id);
        if (errId) {
          console.warn("⚠️ Error al eliminar por ID en 'servicio_profesor':", errId.message);
          if (errId.message.toLowerCase().includes("policy") || errId.message.toLowerCase().includes("row-level security") || errId.message.toLowerCase().includes("permission")) {
            rlsErrorFound = true;
          }
        } else {
          console.log("✅ Eliminado por ID de registro con éxito.");
        }
      }

      // 2. Also execute composite key deletes to ensure clean DB state under all schema variants
      const { error: errComp1 } = await supabase.from('servicio_profesor')
        .delete()
        .eq('id_servicio', serviceId)
        .eq('id_profesor', teacherId);

      const { error: errComp2 } = await supabase.from('servicio_profesor')
        .delete()
        .eq('servicio_id', serviceId)
        .eq('profesor_id', teacherId);

      if (errComp1 && errComp1.message && (errComp1.message.toLowerCase().includes("policy") || errComp1.message.toLowerCase().includes("row-level security") || errComp1.message.toLowerCase().includes("permission"))) {
        rlsErrorFound = true;
      }
      if (errComp2 && errComp2.message && (errComp2.message.toLowerCase().includes("policy") || errComp2.message.toLowerCase().includes("row-level security") || errComp2.message.toLowerCase().includes("permission"))) {
        rlsErrorFound = true;
      }

      if (rlsErrorFound) {
        window.alert(
          "No se pudo desvincular al docente en Supabase debido a la falta de políticas de seguridad (RLS).\n\n" +
          "Para solucionarlo inmediatamente, copia y ejecuta el script 'create_servicio_profesor_rls.sql' (creado en la raíz de tu proyecto) en el SQL Editor de tu panel de Supabase."
        );
      } else if (errComp1 && errComp2) {
        console.warn("⚠️ Advertencia en borrado por claves compuestas:", errComp1.message, errComp2.message);
      } else {
        console.log("✅ Limpieza de claves compuestas completada.");
      }
    } catch (e) {
      console.error("Error unlinking teacher from service in Supabase:", e);
    }
  };

  const addNota = async (notaData: Omit<Nota, 'id'>) => {
    const newNota: Nota = {
      ...notaData,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    setNotas(prev => {
      const updated = [...prev, newNota];
      localStorage.setItem('edu_notas', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('notas').insert([{
        id: newNota.id,
        id_estudiante: newNota.id_estudiante,
        id_profesor: newNota.id_profesor,
        nota_numerica: newNota.nota_numerica !== undefined && newNota.nota_numerica !== null ? Number(newNota.nota_numerica) : null,
        nota_cuantitativa: `${newNota.nota_cuantitativa}|||${newNota.id_curso}`
      }]);
    } catch (e) {
      console.error("Error writing grade (nota) to Supabase:", e);
    }
  };

  const updateNota = async (updatedNota: Nota) => {
    setNotas(prev => {
      const updated = prev.map(n => n.id === updatedNota.id ? updatedNota : n);
      localStorage.setItem('edu_notas', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('notas').update({
        id_estudiante: updatedNota.id_estudiante,
        id_profesor: updatedNota.id_profesor,
        nota_numerica: updatedNota.nota_numerica !== undefined && updatedNota.nota_numerica !== null ? Number(updatedNota.nota_numerica) : null,
        nota_cuantitativa: `${updatedNota.nota_cuantitativa}|||${updatedNota.id_curso}`
      }).eq('id', updatedNota.id);
    } catch (e) {
      console.error("Error updating grade (nota) in Supabase:", e);
    }
  };

  const deleteNota = async (id: string) => {
    setNotas(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('edu_notas', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('notas').delete().eq('id', id);
    } catch (e) {
      console.error("Error deleting grade (nota) from Supabase:", e);
    }
  };

  const addFactura = async (facturaData: Omit<Factura, 'id' | 'created_at'>): Promise<Factura> => {
    console.log("📢 [BOVEDA-SISTEMA] Iniciando guardado de nueva factura/boleta...", {
      tipo: facturaData.tipo,
      monto: facturaData.monto,
      concepto: facturaData.concepto,
      nombrePersona: facturaData.detalles?.nombrePersona,
      pdf_url: facturaData.pdf_url ? `${facturaData.pdf_url.substring(0, 100)}...` : "Ninguno"
    });

    const newFactura: Factura = {
      ...facturaData,
      id: `FAC-${facturaData.tipo === 'estudiante' ? 'EST' : 'DOC'}-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString()
    };
    
    setFacturas(prev => {
      const updated = [...prev, newFactura];
      localStorage.setItem('edu_facturas', JSON.stringify(updated));
      console.log(`💾 [BOVEDA-SISTEMA] Factura ${newFactura.id} guardada en localStorage (Almacenamiento Local Seguro). Total facturas locales: ${updated.length}`);
      return updated;
    });

    try {
      console.log(`🌐 [BOVEDA-SISTEMA] Intentando persistir Factura ${newFactura.id} en base de datos remota Supabase (tabla 'facturas')...`);
      const { error } = await supabase.from('facturas').insert([newFactura]);
      if (error) {
        console.error("❌ [BOVEDA-SISTEMA] Error devuelto por Supabase al insertar la factura:", error);
        throw error;
      }
      console.log(`✅ [BOVEDA-SISTEMA] ¡ÉXITO COMPLETO! Factura ${newFactura.id} guardada y sincronizada correctamente en la base de datos remota Supabase.`);
    } catch (e: any) {
      console.warn("⚠️ [BOVEDA-SISTEMA] La tabla 'facturas' podría no estar creada o configurada en Supabase todavía. Resguardando factura de forma offline/local estable.", e.message || e);
    }
    
    return newFactura;
  };

  const updateFacturaStatus = async (id: string, status: 'emitida' | 'pagada' | 'anulada') => {
    setFacturas(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, estado: status } : f);
      localStorage.setItem('edu_facturas', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('facturas').update({ estado: status }).eq('id', id);
    } catch (e) {
      console.warn("Could not sync invoice status update with Supabase:", e);
    }
  };

  const deleteFactura = async (id: string) => {
    setFacturas(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem('edu_facturas', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('facturas').delete().eq('id', id);
    } catch (e) {
      console.warn("Could not sync invoice deletion with Supabase:", e);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      login,
      logout,
      changeTeacherPassword,
      students,
      addStudent,
      updateStudent,
      deleteStudent,
      teachers,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      resources,
      addResource,
      deleteResource,
      transactions,
      addTransaction,
      balance,
      attendance,
      registerAttendance,
      cursos,
      servicios,
      servicioCursos,
      servicioProfesores,
      refreshCursos,
      addCourse,
      updateCourse,
      deleteCourse,
      addService,
      updateService,
      deleteService,
      linkCourseToService,
      unlinkCourseFromService,
      linkTeacherToService,
      unlinkTeacherFromService,
      notas,
      addNota,
      updateNota,
      deleteNota,
      theme,
      updateTheme,
      news,
      addNews,
      updateNews,
      deleteNews,
      uploadNewsImage,
      notifications,
      addNotification,
      addPushNotification,
      requestBrowserNotificationPermission,
      markNotificationAsRead,
      deleteNotification,
      clearNotifications,
      errorLogs,
      supabaseStatus,
      uploadProgress,
      setUploadProgress,
      facturas,
      addFactura,
      updateFacturaStatus,
      deleteFactura,
      vaultPasscode,
      setVaultPasscode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
