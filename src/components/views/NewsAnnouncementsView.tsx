import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolNews } from '../../types';
import { 
  Megaphone, 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  Filter,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NewsAnnouncementsView: React.FC = () => {
  const { 
    news, 
    addNews, 
    updateNews, 
    deleteNews, 
    uploadNewsImage, 
    currentUser,
    theme 
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Modal and editing states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolNews | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'evento' | 'noticia'>('noticia');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAuthor, setFormAuthor] = useState('');

  // Local image file upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items
  const filteredNews = news.filter(item => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'todos') return matchesSearch;
    return item.category === selectedCategory && matchesSearch;
  });

  // Helper to get active user full name for author field
  const getLoggedInAuthorName = () => {
    if (!currentUser) return 'Administración';
    if (currentUser.nombre) {
      return `${currentUser.nombre} ${currentUser.apellido || ''}`.trim();
    }
    return currentUser.name || (currentUser.role === 'admin' ? 'Director General' : 'Docente');
  };

  // Handle open modal for create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('noticia');
    setFormImageUrl('');
    setFormAuthor(getLoggedInAuthorName());
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEdit = (item: SchoolNews) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormCategory(item.category);
    setFormImageUrl(item.imageUrl || '');
    setFormAuthor(item.author || getLoggedInAuthorName());
    setSelectedFile(null);
    setPreviewUrl(item.imageUrl || null);
    setIsModalOpen(true);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    let finalImageUrl = formImageUrl;

    // Handle file upload to Cloudinary (folder: enlacec_eventos_noticias)
    if (previewUrl && (selectedFile || previewUrl.startsWith('data:'))) {
      const fileName = selectedFile?.name || `evento_noticia_${Date.now()}.png`;
      const uploadedUrl = await uploadNewsImage('enlacec_eventos_noticias', fileName, previewUrl);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    const finalAuthor = formAuthor.trim() || getLoggedInAuthorName();

    if (editingItem) {
      // Update
      const updated: SchoolNews = {
        ...editingItem,
        title: formTitle,
        content: formContent,
        category: formCategory,
        imageUrl: finalImageUrl,
        author: finalAuthor
      };
      await updateNews(updated);
    } else {
      // Create
      const newItem: Omit<SchoolNews, 'id' | 'date'> = {
        title: formTitle,
        content: formContent,
        category: formCategory,
        imageUrl: finalImageUrl,
        author: finalAuthor
      };
      await addNews(newItem);
    }

    setIsModalOpen(false);
  };

  // Get color styles for category badge
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'evento':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'urgente':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      case 'académico':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
      case 'administrativo':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30';
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Header section with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Muro de Avisos y Noticias
          </h2>
          <p className="text-xs text-gray-450 dark:text-zinc-500">
            Mantente al día con los comunicados y eventos importantes de la institución.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publicar Aviso / Evento
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-gray-200/40 dark:border-zinc-800/60">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por título, contenido o autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/60 dark:bg-zinc-950/60 border border-gray-200/50 dark:border-zinc-800 rounded-xl text-xs text-gray-800 dark:text-zinc-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category filtering tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 hidden md:inline mr-1">
            Filtrar:
          </span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'evento', label: 'Eventos' },
            { id: 'noticia', label: 'Noticias' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'bg-gray-100 hover:bg-gray-200/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-gray-500 dark:text-zinc-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-16 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
          <Megaphone className="w-10 h-10 mx-auto text-gray-400 dark:text-zinc-600 mb-3 opacity-40 animate-pulse" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300">No se encontraron comunicados</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Prueba a usar otros filtros o buscar un término diferente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredNews.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25 }}
                className="group relative flex flex-col bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/[0.02] dark:hover:shadow-black/[0.2] transition-all duration-350"
              >
                {/* News Image Preview with fallbacks */}
                {item.imageUrl ? (
                  <div className="relative w-full h-44 overflow-hidden bg-gray-100 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 flex items-center justify-center border-b border-gray-100 dark:border-zinc-800/60 shrink-0">
                    <Megaphone className="w-8 h-8 text-indigo-400/40 dark:text-indigo-600/30" />
                  </div>
                )}

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Category tag */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getCategoryStyles(item.category)}`}>
                        {item.category === 'aviso' ? 'Aviso' : item.category === 'evento' ? 'Evento' : item.category}
                      </span>
                      
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-extrabold text-gray-800 dark:text-zinc-200 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-500 dark:text-zinc-450 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Footer metadata of Card */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 dark:border-zinc-800/60 text-[10px] text-gray-400 dark:text-zinc-500">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] font-black shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                        {(item.author || 'A').charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">{item.author || 'Administración'}</span>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-cyan-400 transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Estás seguro de que deseas eliminar este comunicado?')) {
                              deleteNews(item.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Elegant Edit / Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden flex flex-col my-8"
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-zinc-100">
                  {editingItem ? '✏️ Editar Comunicado' : '📢 Publicar Nuevo Comunicado'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Título del Comunicado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Convocatoria a reunión de padres"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50/40 dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                      Tipo / Categoría
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl text-xs text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="evento">Evento</option>
                      <option value="noticia">Noticia</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                      Autor de la Publicación
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Dirección Escolar"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/40 dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Content Description */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Descripción / Contenido <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Escribe el contenido detallado del comunicado o evento..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50/40 dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Upload Image Section */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Imagen Adjunta (Opcional - Subida a Cloudinary en carpeta enlacec_eventos_noticias)
                  </label>
                  
                  {/* File Drag and Drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : previewUrl 
                        ? 'border-gray-200 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/20' 
                        : 'border-gray-300 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-800 bg-gray-50/50 dark:bg-zinc-950/30'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {previewUrl ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800">
                        <img
                          src={previewUrl}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            setFormImageUrl('');
                          }}
                          className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 dark:text-zinc-600" />
                        <div className="text-center">
                          <p className="text-[11px] font-bold text-gray-650 dark:text-zinc-300">Arrastra una imagen aquí o haz clic para subir</p>
                          <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-normal mt-0.5">Soporta PNG, JPG, JPEG (Máx. 5MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit area */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-gray-500 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    {editingItem ? 'Guardar Cambios' : 'Publicar Comunicado'}
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
