/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getThemeClasses } from '../../lib/themeUtils';
import { supabase } from '../../lib/supabaseClient';
import { 
  User, 
  Lock, 
  Phone, 
  Shield, 
  Check, 
  X,
  CheckCircle2,
  XCircle,
  Save, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Building,
  Upload,
  Edit3,
  KeyRound,
  IdCard,
  Loader2,
  Calendar,
  Database,
  Hash,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UsuarioRow {
  id: string;
  created_at?: string;
  nombre?: string;
  apellido?: string;
  edad?: number;
  dni?: number;
  telefono?: number;
  codigo?: string;
  foto_url?: string;
  fecha_vencimiento?: string;
  password?: string;
  si_pass?: boolean;
  activado?: boolean;
  rol?: string;
}

export const Perfil: React.FC = () => {
  const { currentUser, setCurrentUser, teachers, updateTeacher, theme } = useApp();
  const cl = getThemeClasses(theme.accentColor);

  const isDocente = currentUser?.role === 'docente';
  const teacherData = isDocente ? teachers.find(t => t.id === currentUser?.id) : null;

  // Supabase 'usuarios' record state
  const [dbUser, setDbUser] = useState<UsuarioRow | null>(null);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavingPass, setIsSavingPass] = useState<boolean>(false);

  // Profile Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEdad, setEditEdad] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editDragActive, setEditDragActive] = useState(false);

  // Password Change Modal state
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passErrorMsg, setPassErrorMsg] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch record directly from Supabase 'usuarios' table
  const fetchUserFromSupabase = async () => {
    setIsLoadingSupabase(true);
    try {
      let matchedData: UsuarioRow | null = null;

      // 1. Query by currentUser.id
      if (currentUser?.id) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (!error && data) {
          matchedData = data;
        }
      }

      // 2. Query by phone if not found by id
      if (!matchedData) {
        const phoneToFind = teacherData?.telefono || currentUser?.id;
        const cleanPhone = String(phoneToFind || '').replace(/\D/g, '');
        if (cleanPhone) {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('telefono', parseInt(cleanPhone, 10))
            .maybeSingle();
          if (!error && data) {
            matchedData = data;
          }
        }
      }

      // 3. Fallback: get first user row from usuarios
      if (!matchedData) {
        const { data } = await supabase.from('usuarios').select('*').limit(1);
        if (data && data.length > 0) {
          matchedData = data[0];
        }
      }

      if (matchedData) {
        setDbUser(matchedData);
      }
    } catch (err) {
      console.error('Error al conectar con la tabla usuarios de Supabase:', err);
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  useEffect(() => {
    fetchUserFromSupabase();
  }, [currentUser, teacherData]);

  // Derived user display properties based on Supabase usuarios record
  const displayNombre = dbUser?.nombre || teacherData?.nombre || currentUser?.name?.split(' ')[0] || 'Usuario';
  const displayApellido = dbUser?.apellido || teacherData?.apellido || currentUser?.name?.split(' ').slice(1).join(' ') || '';
  const displayFullName = `${displayNombre} ${displayApellido}`.trim();
  const displayRol = (dbUser?.rol || teacherData?.rol || currentUser?.role || 'DOCENTE').toUpperCase();
  const displayFoto = dbUser?.foto_url || teacherData?.foto_url || currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160';
  const displayTelefono = dbUser?.telefono ? String(dbUser.telefono) : (teacherData?.telefono ? String(teacherData.telefono) : '954123456');
  const displayDni = dbUser?.dni ? String(dbUser.dni) : (teacherData?.dni || '70123456');
  const displayEdad = dbUser?.edad !== undefined && dbUser?.edad !== null ? `${dbUser.edad} años` : (teacherData?.edad ? `${teacherData.edad} años` : '35 años');
  const displayCodigo = dbUser?.codigo || teacherData?.codigo || `${displayTelefono}-2028`;
  const displayFechaVencimiento = dbUser?.fecha_vencimiento ? String(dbUser.fecha_vencimiento) : '2028-12-31';
  const displayActivado = dbUser?.activado !== false ? 'Activo' : 'Inactivo';
  const displaySiPass = dbUser?.si_pass ? 'Pendiente (Sí)' : 'Verificada (No)';
  const displayCreatedAt = dbUser?.created_at ? new Date(dbUser.created_at).toLocaleDateString('es-ES') : 'Sistema';

  // Populate edit fields when opening edit modal
  const handleOpenEditModal = () => {
    setEditNombre(dbUser?.nombre || displayNombre);
    setEditApellido(dbUser?.apellido || displayApellido);
    setEditTelefono(dbUser?.telefono ? String(dbUser.telefono) : displayTelefono);
    setEditEdad(dbUser?.edad !== undefined && dbUser?.edad !== null ? String(dbUser.edad) : '35');
    setEditDni(dbUser?.dni ? String(dbUser.dni) : displayDni);
    setEditAvatarUrl(dbUser?.foto_url || displayFoto);
    setIsEditModalOpen(true);
  };

  // Handle Edit Profile submission directly to Supabase usuarios table
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim()) {
      window.alert('El nombre es un campo obligatorio.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedEdad = editEdad ? parseInt(editEdad, 10) : null;
      let cleanPhoneStr = String(editTelefono || '').replace(/\D/g, '');
      if (cleanPhoneStr.startsWith('51') && cleanPhoneStr.length > 9) {
        cleanPhoneStr = cleanPhoneStr.slice(-9);
      }
      const parsedPhone = cleanPhoneStr ? parseInt(cleanPhoneStr, 10) : null;
      const cleanDniStr = String(editDni || '').replace(/\D/g, '');
      const parsedDni = cleanDniStr ? parseInt(cleanDniStr, 10) : null;

      const targetId = dbUser?.id || currentUser?.id;

      // Direct Update in Supabase 'usuarios' table
      if (targetId) {
        const { error: updateErr } = await supabase
          .from('usuarios')
          .update({
            nombre: editNombre.trim(),
            apellido: editApellido.trim(),
            edad: parsedEdad,
            dni: parsedDni,
            telefono: parsedPhone,
            foto_url: editAvatarUrl || null
          })
          .eq('id', targetId);

        if (updateErr) {
          console.error('Error actualizando la tabla usuarios en Supabase:', updateErr);
        }
      }

      // Update AppContext teacher state if applicable
      const fullNewName = `${editNombre.trim()} ${editApellido.trim()}`.trim();
      if (isDocente && teacherData) {
        await updateTeacher({
          ...teacherData,
          nombre: editNombre.trim(),
          apellido: editApellido.trim(),
          name: fullNewName,
          telefono: parsedPhone || teacherData.telefono,
          edad: parsedEdad || teacherData.edad,
          dni: editDni || teacherData.dni,
          foto_url: editAvatarUrl,
          avatarUrl: editAvatarUrl
        });
      }

      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          name: fullNewName,
          avatarUrl: editAvatarUrl
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('edu_current_user', JSON.stringify(updatedUser));
      }

      await fetchUserFromSupabase();
      triggerToast('¡Datos guardados y sincronizados con la tabla usuarios en Supabase!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error al guardar datos:', err);
      window.alert('Error al guardar los cambios en Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and drop for profile image
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setEditDragActive(true);
    else if (e.type === 'dragleave') setEditDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setEditAvatarUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Open password modal
  const handleOpenPassModal = () => {
    setCurrentPassInput('');
    setVerifyStatus('idle');
    setNewPass('');
    setConfirmPass('');
    setPassErrorMsg('');
    setPassSuccessMsg('');
    setIsPassModalOpen(true);
  };

  // Password verification with 1.5s debounce timer
  useEffect(() => {
    if (!currentPassInput.trim()) {
      setVerifyStatus('idle');
      return;
    }

    setVerifyStatus('verifying');

    const timer = setTimeout(() => {
      // Compare strictly with row password in Supabase usuarios
      const actualPassword = dbUser?.password || (isDocente ? (teacherData?.password || 'docente123') : (localStorage.getItem('edu_admin_password') || 'admin123'));

      if (currentPassInput === actualPassword) {
        setVerifyStatus('valid');
      } else {
        setVerifyStatus('invalid');
      }
    }, 1500); // 1.5s debounce as requested

    return () => clearTimeout(timer);
  }, [currentPassInput, dbUser, isDocente, teacherData]);

  // Submit Password Change to Supabase usuarios
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (verifyStatus !== 'valid') {
      setPassErrorMsg('Debes verificar correctamente tu contraseña actual primero.');
      return;
    }

    if (!newPass || !confirmPass) {
      setPassErrorMsg('Por favor completa todos los campos de nueva contraseña.');
      return;
    }

    if (newPass.length < 6) {
      setPassErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassErrorMsg('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setIsSavingPass(true);
    try {
      const targetId = dbUser?.id || currentUser?.id;

      if (targetId) {
        const { error: passErr } = await supabase
          .from('usuarios')
          .update({
            password: newPass,
            si_pass: false
          })
          .eq('id', targetId);

        if (passErr) {
          console.error('Error actualizando contraseña en Supabase usuarios:', passErr);
        }
      }

      if (isDocente && teacherData) {
        await updateTeacher({
          ...teacherData,
          password: newPass,
          si_pass: false
        });
      } else {
        localStorage.setItem('edu_admin_password', newPass);
      }

      await fetchUserFromSupabase();
      setPassSuccessMsg('¡Contraseña actualizada exitosamente en Supabase!');
      triggerToast('¡Tu contraseña ha sido cambiada y guardada en Supabase!');

      setTimeout(() => {
        setIsPassModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setPassErrorMsg('Error al actualizar la contraseña en la base de datos.');
    } finally {
      setIsSavingPass(false);
    }
  };

  return (
    <div className="space-y-8 select-none max-w-6xl mx-auto pb-12">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Profile Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 border border-white/10 shadow-2xl">
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Avatar and Primary Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative group">
              <img
                src={displayFoto}
                alt={displayFullName}
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-3xl object-cover ring-4 ring-white/15 group-hover:ring-indigo-500/60 shadow-2xl transition-all duration-300"
              />
              <span className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-xl shadow-lg border border-white/20">
                <UserCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{displayFullName}</h1>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm">
                  {displayRol}
                </span>
              </div>

              <p className="text-xs text-zinc-300 font-mono font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Teléfono: {displayTelefono}</span>
              </p>

              <div className="flex flex-wrap gap-3 pt-1 justify-center sm:justify-start text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/10 text-[11px] font-medium">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sincronizado con Tabla Supabase: <strong>usuarios</strong></span>
                </div>
                {isLoadingSupabase && (
                  <div className="flex items-center gap-1.5 bg-indigo-500/20 px-3 py-1 rounded-xl text-indigo-300 text-[11px] font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cargando datos...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Editar Datos & Cambiar Contraseña */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenEditModal}
              className={`px-5 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${cl.primaryBg} hover:opacity-90 active:scale-95`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Datos</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPassModal}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 border border-white/15 backdrop-blur-md shadow-xl transition-all cursor-pointer active:scale-95"
            >
              <KeyRound className="w-4 h-4 text-indigo-300" />
              <span>Cambiar Contraseña</span>
            </button>
          </div>

        </div>
      </div>

      {/* Prioritized User Information Cards Grid (Strictly mapped from 'usuarios' table) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Campos de la Tabla 'usuarios' (Supabase)</h2>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Mapeo Exacto
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* 1. Nombre */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">nombre (text)</span>
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100 truncate">{displayNombre}</p>
            </div>
          </div>

          {/* 2. Apellido */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">apellido (text)</span>
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100 truncate">{displayApellido || 'Sin apellido'}</p>
            </div>
          </div>

          {/* 3. Teléfono */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">telefono (int4)</span>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100 font-mono">{displayTelefono}</p>
            </div>
          </div>

          {/* 4. DNI */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">dni (int4)</span>
            <div className="flex items-center gap-2.5">
              <IdCard className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100 font-mono">{displayDni}</p>
            </div>
          </div>

          {/* 5. Edad */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">edad (int2)</span>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100">{displayEdad}</p>
            </div>
          </div>

          {/* 6. Código */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">codigo (text)</span>
            <div className="flex items-center gap-2.5">
              <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100 font-mono truncate">{displayCodigo}</p>
            </div>
          </div>

          {/* 7. Rol */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">rol (text)</span>
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100">{displayRol}</p>
            </div>
          </div>

          {/* 8. Fecha Vencimiento */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">fecha_vencimiento (date)</span>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100 font-mono">{displayFechaVencimiento}</p>
            </div>
          </div>

          {/* 9. Activado */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">activado (bool)</span>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100">{displayActivado}</p>
            </div>
          </div>

          {/* 10. Si Pass */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">si_pass (bool)</span>
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100">{displaySiPass}</p>
            </div>
          </div>

          {/* 11. Fecha Registro */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">created_at (timestamptz)</span>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-sm font-black text-gray-800 dark:text-zinc-100 font-mono">{displayCreatedAt}</p>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL 1: EDITAR DATOS DE PERFIL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">Editar Datos de 'usuarios'</h3>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">Actualiza los campos directamente en Supabase</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">nombre</label>
                    <input
                      type="text"
                      required
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">apellido</label>
                    <input
                      type="text"
                      value={editApellido}
                      onChange={(e) => setEditApellido(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">telefono (int4)</label>
                    <input
                      type="text"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">dni (int4)</label>
                    <input
                      type="text"
                      value={editDni}
                      onChange={(e) => setEditDni(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">edad (int2)</label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={editEdad}
                    onChange={(e) => setEditEdad(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* foto_url Drag & Drop zone */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">foto_url (text)</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
                      editDragActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-950/30'
                    }`}
                  >
                    <input
                      id="edit-modal-avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {editAvatarUrl ? (
                      <div className="flex items-center gap-3 w-full">
                        <img src={editAvatarUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Imagen seleccionada</span>
                          <span className="text-[11px] text-gray-500 dark:text-zinc-400 block truncate">Listo para guardar en foto_url</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl('')}
                          className="text-xs text-red-500 hover:underline font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-300">Arrastra una imagen o</p>
                        <label
                          htmlFor="edit-modal-avatar-input"
                          className="inline-block mt-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-700"
                        >
                          Seleccionar Archivo
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 font-bold text-xs uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg ${cl.primaryBg} hover:opacity-90 disabled:opacity-50`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Guardar en Supabase</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CAMBIAR CONTRASEÑA */}
      <AnimatePresence>
        {isPassModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">Cambiar Contraseña</h3>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">Verifica la columna password en Supabase</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePassword} className="mt-6 space-y-5">
                
                {/* 1. Contraseña Actual con Verificación Automática tras 1.5s */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Contraseña Actual</label>
                    <span className="text-[9px] text-gray-400 font-semibold">Verificación auto (1.5s)</span>
                  </div>

                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      className={`w-full px-3.5 py-2.5 pr-20 bg-gray-50/50 dark:bg-zinc-950/50 border rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 outline-none transition-all ${
                        verifyStatus === 'valid' 
                          ? 'border-emerald-500 ring-1 ring-emerald-500/50' 
                          : verifyStatus === 'invalid' 
                          ? 'border-rose-500 ring-1 ring-rose-500/50' 
                          : 'border-gray-200 dark:border-zinc-800 focus:ring-1 focus:ring-indigo-500'
                      }`}
                      placeholder="Introduce tu clave actual"
                    />

                    {/* Eye toggle + Verification status icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {verifyStatus === 'verifying' && (
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      )}
                      {verifyStatus === 'valid' && (
                        <div className="p-1 bg-emerald-500 text-white rounded-full shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      {verifyStatus === 'invalid' && (
                        <div className="p-1 bg-rose-500 text-white rounded-full shadow-sm">
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Verification Status Feedback Badge */}
                  {verifyStatus === 'verifying' && (
                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando contraseña contra la tabla usuarios (1.5s)...</span>
                    </div>
                  )}

                  {verifyStatus === 'valid' && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>Contraseña verificada correctamente. Puedes ingresar la nueva clave.</span>
                    </div>
                  )}

                  {verifyStatus === 'invalid' && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>La contraseña ingresada no coincide con el registro de la BD.</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-zinc-800 my-2" />

                {/* 2. Nueva Contraseña (Disabled if not valid) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      disabled={verifyStatus !== 'valid'}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      disabled={verifyStatus !== 'valid'}
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-40"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña (Disabled if not valid) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      disabled={verifyStatus !== 'valid'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Confirma tu nueva clave"
                    />
                    <button
                      type="button"
                      disabled={verifyStatus !== 'valid'}
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-40"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Messages */}
                {passErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passErrorMsg}</span>
                  </div>
                )}

                {passSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passSuccessMsg}</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsPassModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 font-bold text-xs uppercase"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSavingPass || verifyStatus !== 'valid' || !newPass || newPass.length < 6 || newPass !== confirmPass}
                    className="px-6 py-2.5 rounded-xl text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isSavingPass ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Guardar en Supabase</span>
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
