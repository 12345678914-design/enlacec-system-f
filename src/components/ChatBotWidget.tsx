/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { getThemeClasses } from "../lib/themeUtils";
import { callGroqAIChatClient } from "../services/clientServices";
import { EnlaceCIcon } from "./EnlaceCIcon";
import { 
  Sparkles, 
  Send, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Bot, 
  User, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  HelpCircle,
  Home,
  Plus,
  Paperclip,
  Smile,
  Mic,
  ArrowUp,
  GripVertical,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SkeletonChatMessage } from "./Skeleton";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  action?: {
    type: string;
    title: string;
    payload: any;
  };
  actionStatus?: "pending" | "approved" | "rejected";
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const formatTimeAgo = (isoDateStr: string) => {
  if (!isoDateStr) return "";
  const date = new Date(isoDateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${diffWeeks}sem`;
};

export const ChatBotWidget: React.FC = () => {
  const { 
    currentUser, 
    theme, 
    students, 
    teachers, 
    balance, 
    news, 
    cursos,
    servicios,
    transactions,
    attendance,
    notas,
    addStudent, 
    updateStudent, 
    deleteStudent, 
    addTeacher, 
    updateTeacher, 
    deleteTeacher, 
    addTransaction, 
    addNews, 
    updateNews,
    deleteNews,
    updateTheme 
  } = useApp();

  const cl = getThemeClasses(theme.accentColor);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "messages" | "chat">("home");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);

  // Pagination / Partial Loading States for Performance Optimization
  const [visibleMessageCount, setVisibleMessageCount] = useState(20);
  const [visibleThreadCount, setVisibleThreadCount] = useState(12);

  // Reset message pagination window when switching active thread
  useEffect(() => {
    setVisibleMessageCount(20);
  }, [activeThreadId]);

  // Dock / Hide to the right states - default to true as requested (anclado)
  const [isDocked, setIsDocked] = useState<boolean>(() => {
    const saved = localStorage.getItem(`enlacec_chatbot_docked_${currentUser?.id}`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist docking position
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`enlacec_chatbot_docked_${currentUser?.id}`, JSON.stringify(isDocked));
    }
  }, [isDocked, currentUser?.id]);

  // Load chat threads from local storage on mount
  useEffect(() => {
    if (!currentUser?.id) return;

    const savedThreads = localStorage.getItem(`enlacec_chat_threads_${currentUser?.id}`);
    if (savedThreads) {
      try {
        const parsed: ChatThread[] = JSON.parse(savedThreads);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Error al cargar historial local de chats:", e);
      }
    }

    // Default initial thread if no stored history exists
    const roleName = currentUser?.role === "admin" ? "Director(a) / Administrador(a)" : "Docente";
    const defaultMsg: ChatMessage = {
      id: "msg-welcome-1",
      role: "model",
      text: `¡Hola, **${currentUser?.name || "colega"}**! 👋 Soy **Tesla AI**, tu asistente de gestión escolar.\n\nTengo acceso en tiempo real a alumnos, registros académicos y configuraciones.\n\n_¿En qué te puedo asesorar hoy?_`,
      timestamp: new Date().toISOString()
    };

    const initialThread: ChatThread = {
      id: `thread-init-${Date.now()}`,
      title: "Ubicación de archivos e información",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [defaultMsg]
    };

    setThreads([initialThread]);
    setActiveThreadId(initialThread.id);
    localStorage.setItem(`enlacec_chat_threads_${currentUser?.id}`, JSON.stringify([initialThread]));
  }, [currentUser]);

  // Auto-scroll inside chat view
  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [threads, activeThreadId, activeTab, isLoading]);

  const saveThreadsToLocal = (updatedThreads: ChatThread[]) => {
    setThreads(updatedThreads);
    if (currentUser?.id) {
      localStorage.setItem(`enlacec_chat_threads_${currentUser?.id}`, JSON.stringify(updatedThreads));
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0] || null;
  const activeMessages = activeThread ? activeThread.messages : [];
  const totalMessagesCount = activeMessages.length;
  const hasMoreMessages = totalMessagesCount > visibleMessageCount;
  const displayedMessages = hasMoreMessages
    ? activeMessages.slice(totalMessagesCount - visibleMessageCount)
    : activeMessages;

  const displayedThreads = threads.slice(0, visibleThreadCount);
  const hasMoreThreads = threads.length > visibleThreadCount;

  const handleStartNewThread = (initialQuestion?: string) => {
    const newId = `thread-${Date.now()}`;
    const initialMsg: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: "model",
      text: `¡Hola! 👋 Soy **Tesla AI**. ¿Qué consulta o tarea académica deseas que abordemos?`,
      timestamp: new Date().toISOString()
    };

    const titleText = initialQuestion 
      ? (initialQuestion.length > 32 ? initialQuestion.substring(0, 32) + "..." : initialQuestion) 
      : "Nueva consulta con Tesla AI";

    const newThread: ChatThread = {
      id: newId,
      title: titleText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [initialMsg]
    };

    const updatedThreads = [newThread, ...threads];
    saveThreadsToLocal(updatedThreads);
    setActiveThreadId(newId);
    setActiveTab("chat");

    if (initialQuestion) {
      setTimeout(() => {
        handleSendMessageInThread(newId, initialQuestion, [initialMsg], updatedThreads);
      }, 50);
    }
  };

  const handleDeleteThread = (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("¿Deseas eliminar esta conversación guardada de tu historial local?")) {
      const filtered = threads.filter(t => t.id !== threadId);
      saveThreadsToLocal(filtered);
      if (activeThreadId === threadId) {
        if (filtered.length > 0) {
          setActiveThreadId(filtered[0].id);
        } else {
          setActiveThreadId(null);
          setActiveTab("home");
        }
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = (textToSend || inputVal).trim();
    if (!finalMsg) return;

    if (!textToSend) {
      setInputVal("");
    }

    let targetThreadId = activeThreadId;
    let currentThreads = [...threads];
    let currentThread = currentThreads.find(t => t.id === targetThreadId);

    if (!currentThread) {
      const newId = `thread-${Date.now()}`;
      const initialMsg: ChatMessage = {
        id: `msg-welcome-${Date.now()}`,
        role: "model",
        text: `¡Hola! 👋 Soy **Tesla AI**. ¿Qué consulta deseas realizar?`,
        timestamp: new Date().toISOString()
      };
      currentThread = {
        id: newId,
        title: finalMsg.length > 30 ? finalMsg.substring(0, 30) + "..." : finalMsg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [initialMsg]
      };
      currentThreads = [currentThread, ...currentThreads];
      targetThreadId = newId;
      setActiveThreadId(newId);
    }

    await handleSendMessageInThread(targetThreadId!, finalMsg, currentThread.messages, currentThreads);
  };

  const handleSendMessageInThread = async (
    threadId: string,
    userText: string,
    existingMsgs: ChatMessage[],
    allThreads: ChatThread[]
  ) => {
    const newUserMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date().toISOString()
    };

    const updatedMsgs = [...existingMsgs, newUserMsg];

    const isFirstUserMsg = !existingMsgs.some(m => m.role === "user");
    const threadTitle = isFirstUserMsg 
      ? (userText.length > 32 ? userText.substring(0, 32) + "..." : userText) 
      : undefined;

    const updatedThreads = allThreads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          title: threadTitle || t.title,
          updatedAt: new Date().toISOString(),
          messages: updatedMsgs
        };
      }
      return t;
    });

    saveThreadsToLocal(updatedThreads);
    setIsLoading(true);

    try {
      const backendHistory = updatedMsgs.slice(0, -1).map(m => ({
        role: m.role,
        text: m.text
      }));

      const systemContext = {
        students,
        teachers,
        balance,
        news,
        cursos,
        servicios,
        transactions,
        attendance,
        notas,
        currentUser
      };

      const data = await callGroqAIChatClient(
        userText,
        backendHistory,
        systemContext
      );

      const newBotMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date().toISOString(),
        action: data.action || undefined,
        actionStatus: data.action ? "pending" : undefined
      };

      const finalWithBot = [...updatedMsgs, newBotMsg];
      const finalThreads = updatedThreads.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            messages: finalWithBot
          };
        }
        return t;
      });

      saveThreadsToLocal(finalThreads);
    } catch (err: any) {
      console.error(err);
      const newBotErr: ChatMessage = {
        id: `msg-bot-err-${Date.now()}`,
        role: "model",
        text: `❌ **Error de Conexión:** No se pudo completar la consulta en este momento. Inténtalo de nuevo.`,
        timestamp: new Date().toISOString()
      };

      const finalWithError = [...updatedMsgs, newBotErr];
      const finalThreads = updatedThreads.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            messages: finalWithError
          };
        }
        return t;
      });

      saveThreadsToLocal(finalThreads);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (msgId: string, action: any) => {
    try {
      const { type, payload } = action;

      switch (type) {
        case "ADD_STUDENT": addStudent(payload); break;
        case "UPDATE_STUDENT": updateStudent(payload); break;
        case "DELETE_STUDENT": deleteStudent(payload.id); break;
        case "ADD_TEACHER": addTeacher(payload); break;
        case "UPDATE_TEACHER": updateTeacher(payload); break;
        case "DELETE_TEACHER": deleteTeacher(payload.id); break;
        case "ADD_TRANSACTION": addTransaction(payload); break;
        case "ADD_NEWS": await addNews(payload); break;
        case "UPDATE_NEWS": await updateNews(payload); break;
        case "DELETE_NEWS": await deleteNews(payload.id); break;
        case "UPDATE_THEME": updateTheme(payload); break;
        case "ADD_TO_BOARD":
          window.dispatchEvent(new CustomEvent("add-to-ai-board", { detail: payload }));
          break;
        default:
          throw new Error("Tipo de acción no reconocido.");
      }

      if (!activeThread) return;

      const updatedMsgs = activeMessages.map(m => {
        if (m.id === msgId) {
          return { ...m, actionStatus: "approved" as const };
        }
        return m;
      });

      const confirmationMsg: ChatMessage = {
        id: `msg-confirm-${Date.now()}`,
        role: "model",
        text: `✅ **Operación Aplicada:** Se ejecutaron los cambios de **${action.title}** en el sistema.`,
        timestamp: new Date().toISOString()
      };

      const finalMsgs = [...updatedMsgs, confirmationMsg];
      const updatedThreads = threads.map(t => {
        if (t.id === activeThread.id) {
          return { ...t, updatedAt: new Date().toISOString(), messages: finalMsgs };
        }
        return t;
      });

      saveThreadsToLocal(updatedThreads);
    } catch (err: any) {
      console.error(err);
      alert(`Error al ejecutar acción: ${err.message || err}`);
    }
  };

  const handleRejectAction = (msgId: string) => {
    if (!activeThread) return;
    const updatedMsgs = activeMessages.map(m => {
      if (m.id === msgId) {
        return { ...m, actionStatus: "rejected" as const };
      }
      return m;
    });

    const updatedThreads = threads.map(t => {
      if (t.id === activeThread.id) {
        return { ...t, messages: updatedMsgs };
      }
      return t;
    });

    saveThreadsToLocal(updatedThreads);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => setIsCopiedId(null), 2000);
  };

  const renderMessageText = (text: string) => {
    if (!text) return null;
    const blocks = text.split(/\n/);
    
    return (
      <div className="space-y-1.5 text-xs md:text-sm leading-relaxed font-sans select-text whitespace-pre-wrap">
        {blocks.map((line, index) => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith("###")) {
            return (
              <h5 key={index} className="text-xs font-bold text-zinc-100 mt-2 mb-1">
                {trimmed.replace(/^###\s*/, "")}
              </h5>
            );
          }
          if (trimmed.startsWith("##")) {
            return (
              <h4 key={index} className="text-xs font-bold text-zinc-100 mt-2 mb-1 border-b border-zinc-800 pb-0.5">
                {trimmed.replace(/^##\s*/, "")}
              </h4>
            );
          }
          
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            return (
              <div key={index} className="flex items-start gap-1.5 pl-2 my-0.5">
                <span className="text-cyan-400 shrink-0 mt-1.5 text-[8px]">•</span>
                <span className="flex-1">{parseInlineStyles(trimmed.substring(2))}</span>
              </div>
            );
          }

          if (trimmed === "") return <div key={index} className="h-1" />;
          return <p key={index} className="my-0.5">{parseInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const parseInlineStyles = (partText: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(partText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(partText.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-bold text-white bg-indigo-500/20 px-1 rounded">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < partText.length) {
      parts.push(partText.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : partText;
  };

  const promptSuggestions = currentUser?.role === "admin" 
    ? [
        { label: "💡 Planificar taller docente", text: "Diséñame un taller de 2 horas para profesores sobre metodologías activas escolar." },
        { label: "📊 Formular observación docente", text: "Escribe una plantilla de observación de desempeño docente en el aula escolar." },
        { label: "📈 Presupuestos e incentivos", text: "Bríndame 5 ideas prácticas para incentivar el buen desempeño docente." }
      ]
    : [
        { label: "💡 Planeación de Clase", text: "Diséñame una secuencia de clase de 50 minutos para explicar ecuaciones de primer grado." },
        { label: "📝 Reporte de Conducta", text: "Redacta una nota cordial para un padre de familia cuyo hijo está distraído en clase." },
        { label: "🎯 Rúbrica de portafolio", text: "Diseña una rúbrica con niveles (Insuficiente, Básico, Excelente) para evaluar proyectos." }
      ];

  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "Usuario";
  const latestThread = threads.length > 0 ? threads[0] : null;

  return (
    <>
      {/* 1. Normal Floating Circular Trigger Button (Shown when NOT docked) */}
      <AnimatePresence>
        {!isDocked && (
          <motion.div
            key="floating-trigger-wrapper"
            drag="x"
            dragConstraints={{ left: -300, right: 10 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setTimeout(() => setIsDragging(false), 120);
              if (info.offset.x > 40) {
                setIsDocked(true);
              }
            }}
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-6 right-6 z-[9999] select-none touch-none group"
          >
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              whileHover={{ opacity: 1, y: -4 }}
              className="absolute -top-9 right-0 pointer-events-none whitespace-nowrap bg-zinc-900/95 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-lg border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5"
            >
              <span>Tesla AI</span>
              <span className="text-cyan-400 font-mono text-[9px]">► Arrastra a la derecha para anclar</span>
            </motion.div>

             <motion.button
              id="btn-chatbot-float-trigger"
              title="Tesla AI"
              type="button"
              onClick={() => {
                if (!isDragging) {
                  setIsOpen(!isOpen);
                }
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-indigo-500/30 transition-all cursor-grab active:cursor-grabbing bg-indigo-600 hover:bg-indigo-500"
            >
              {isOpen ? (
                <ChevronDown className="w-6 h-6" />
              ) : (
                <>
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-400 rounded-full border border-white flex items-center justify-center text-[8px] font-black text-white">
                    !
                  </span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Docked Anchored Bar ("Barra con Punta") on Right Edge */}
      <AnimatePresence>
        {isDocked && !isOpen && (
          <motion.div
            key="docked-bar-trigger"
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setTimeout(() => setIsDragging(false), 120);
              if (info.offset.x < -40) {
                setIsDocked(false);
              }
            }}
            onMouseEnter={() => setIsDockHovered(true)}
            onMouseLeave={() => setIsDockHovered(false)}
            onClick={() => {
              if (!isDragging) {
                setIsOpen(true);
              }
            }}
            initial={{ x: 120, opacity: 0 }}
            animate={{
              x: isDockHovered ? 0 : "calc(100% - 26px)",
              opacity: 1
            }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-28 right-0 z-[9999] cursor-pointer select-none group touch-none"
          >
            <div className={`flex items-center gap-2 pl-2.5 pr-4 py-3 rounded-l-2xl shadow-2xl border-y border-l bg-gradient-to-l ${cl.gradient} text-white border-white/20 backdrop-blur-xl transition-all hover:shadow-cyan-500/30 hover:border-white/40`}>
              <div className="flex items-center justify-center shrink-0">
                <ChevronLeft className="w-5 h-5 text-white animate-pulse" />
              </div>

              <div className="flex items-center gap-2.5 font-sans whitespace-nowrap">
                <div className="w-7 h-7 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-sm relative">
                  <Bot className="w-4 h-4 text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full border border-white animate-ping" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-wider leading-none flex items-center gap-1.5">
                    <span>TESLA AI</span>
                    <span className="px-1 py-0.2 rounded text-[7.5px] font-extrabold uppercase bg-cyan-500 text-white">
                      Anclado
                    </span>
                  </div>
                  <div className="text-[9.5px] text-white/85 font-medium mt-0.5">Click para abrir chat</div>
                </div>

                <div className="ml-2 pl-2 border-l border-white/20 flex items-center gap-1 text-[9px] font-bold text-white/80">
                  <GripVertical className="w-3.5 h-3.5 opacity-75" />
                  <span className="text-[9px] uppercase tracking-wider">Arrastra ⬅️ para desatar</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Expansion Chat Widget Modal Panel (Designs match uploaded images) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="panel-chatbot-expansion"
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
            className="fixed bottom-6 right-4 md:right-6 z-[9999] w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[calc(100vh-80px)] border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-[28px] overflow-hidden flex flex-col shadow-2xl transform-gpu will-change-transform"
          >
            <AnimatePresence mode="wait">
              {/* VIEW 1: HOME TAB SCREEN */}
              {activeTab === "home" && (
                <motion.div 
                  key="home-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900"
                >
                         {/* Header Section */}
                <div className="p-6 pb-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/10">
                        <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                      </div>
                      <span className="font-extrabold text-sm tracking-widest uppercase font-mono text-cyan-300">Tesla AI</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-6 text-left">
                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                      Hi {firstName} <span className="animate-bounce">👋</span>
                    </h2>
                  </div>
                </div>

                {/* Main Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-left min-h-0 bg-white dark:bg-zinc-900">
                  {/* Recent message card */}
                  {latestThread && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-0.5 font-mono">
                        Recent message
                      </span>
                      <div 
                        onClick={() => {
                          setActiveThreadId(latestThread.id);
                          setActiveTab("chat");
                        }}
                        className="p-4 rounded-[20px] bg-white hover:bg-gray-50 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-gray-150/80 dark:border-zinc-700/80 cursor-pointer transition-all flex items-center justify-between gap-3 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {latestThread.title}
                              </h4>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono shrink-0">
                                {formatTimeAgo(latestThread.updatedAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                              {latestThread.messages[latestThread.messages.length - 1]?.text.replace(/[*#]/g, '') || "Sin mensajes"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ask a Question card */}
                  <div 
                    onClick={() => handleStartNewThread()}
                    className="p-4 rounded-[20px] bg-white hover:bg-gray-50 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-gray-150/80 dark:border-zinc-700/80 cursor-pointer transition-all flex items-center justify-between gap-3 group shadow-sm hover:shadow-md"
                  >
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Escribe tu pregunta
                    </span>
                    <div className="w-10 h-10 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Submit Support Request card */}
                  <div 
                    onClick={() => handleStartNewThread("Submit Support Request")}
                    className="p-4 rounded-[20px] bg-white hover:bg-gray-50 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-gray-150/80 dark:border-zinc-700/80 cursor-pointer transition-all flex items-center justify-between gap-3 group shadow-sm hover:shadow-md"
                  >
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Submit Support Request
                    </span>
                    <div className="w-10 h-10 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                      <ExternalLink className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>

                  {/* Quick Suggestions */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-0.5 font-mono">
                      Consultas Frecuentes
                    </span>
                    <div className="space-y-2">
                      {promptSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStartNewThread(s.text)}
                          className="w-full p-3.5 rounded-2xl bg-white hover:bg-gray-50 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-gray-150/80 dark:border-zinc-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 text-left text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-2 cursor-pointer transition-all group shadow-sm"
                        >
                          <span className="truncate">{s.label}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Nav Bar */}
                <div className="p-2.5 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 backdrop-blur-md flex items-center justify-around shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("home")}
                    className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition-all cursor-pointer ${
                      activeTab === "home" 
                        ? "text-indigo-600 dark:text-indigo-400 font-black" 
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-bold"
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px]">Home</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("messages")}
                    className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition-all cursor-pointer ${
                      (activeTab as string) === "messages" 
                        ? "text-indigo-600 dark:text-indigo-400 font-black" 
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-bold"
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px]">Messages</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 2: MESSAGES TAB SCREEN */}
            {activeTab === "messages" && (
              <motion.div 
                key="messages-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-zinc-900 dark:text-white shrink-0">
                  <h3 className="text-base font-extrabold tracking-wide">Messages</h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Thread List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 relative min-h-0 text-left bg-white dark:bg-zinc-900">
                  {threads.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs font-bold">
                      No hay mensajes guardados en el historial local.
                    </div>
                  ) : (
                    <>
                      {displayedThreads.map((t) => {
                        const lastMsg = t.messages[t.messages.length - 1];
                        const isSelected = activeThreadId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setActiveThreadId(t.id);
                              setActiveTab("chat");
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                              isSelected 
                                ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm" 
                                : "bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 border-gray-200 dark:border-zinc-700 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 p-0.5 shrink-0 shadow-md flex items-center justify-center">
                                <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[10px] flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                  <Sparkles className="w-5 h-5" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {t.title}
                                  </h4>
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono shrink-0">
                                    {formatTimeAgo(t.updatedAt)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                                  {lastMsg?.text.replace(/[*#]/g, '') || "Sin mensajes"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteThread(t.id, e)}
                              title="Eliminar conversación"
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}

                      {hasMoreThreads && (
                        <div className="flex justify-center pt-1 pb-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisibleThreadCount(prev => prev + 12)}
                            className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[10.5px] border border-gray-300 dark:border-zinc-700 transition-all cursor-pointer active:scale-95 shadow-sm"
                          >
                            Ver más conversaciones ({threads.length - visibleThreadCount} más)
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Floating Pill Button "Ask a question ❓" as seen in Image 2 */}
                  <div className="sticky bottom-1 flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleStartNewThread()}
                      className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95"
                    >
                      <span>Ask a question</span>
                      <div className="w-4.5 h-4.5 rounded-full bg-white text-indigo-600 flex items-center justify-center font-black text-[11px] select-none shadow-sm">
                        ?
                      </div>
                    </button>
                  </div>
                </div>

                {/* Bottom Nav Bar */}
                <div className="p-2.5 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 backdrop-blur-md flex items-center justify-around shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("home")}
                    className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition-all cursor-pointer ${
                      (activeTab as string) === "home" 
                        ? "text-indigo-600 dark:text-indigo-400 font-black" 
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-bold"
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px]">Home</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("messages")}
                    className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition-all cursor-pointer ${
                      activeTab === "messages" 
                        ? "text-indigo-600 dark:text-indigo-400 font-black" 
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-bold"
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px]">Messages</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 3: ACTIVE CHAT SCREEN */}
            {activeTab === "chat" && (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900"
              >
                {/* Header */}
                <div className="py-3 px-4 border-b border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-zinc-950 dark:text-zinc-100 shrink-0 shadow-sm relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab("messages")}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    {/* Branded Blue Border Sparkle Icon matching Image 3 */}
                    <div className="w-9 h-9 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>

                    <div className="text-left min-w-0">
                      <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate tracking-wide leading-tight">
                        {activeThread?.title || "Ask Tesla AI"}
                      </h3>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">Asistente Tesla AI</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Three dots button and close button matching Image 3 */}
                    <button
                      type="button"
                      onClick={() => handleStartNewThread()}
                      title="Nueva conversación"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-black text-xs transition-all cursor-pointer"
                    >
                      •••
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gray-50/50 dark:bg-zinc-950/50 flex flex-col scroll-smooth">
                  {/* Partial Data Loading: Load earlier messages button */}
                  {hasMoreMessages && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="flex justify-center py-1.5 shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => setVisibleMessageCount(prev => prev + 25)}
                        className="px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10.5px] border border-indigo-200 dark:border-indigo-800/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Cargar mensajes anteriores ({totalMessagesCount - visibleMessageCount} más)</span>
                      </button>
                    </motion.div>
                  )}

                  {displayedMessages.map((msg) => {
                    const isBot = msg.role === "model";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isBot ? "items-start text-left" : "items-end text-right"}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs md:text-sm max-w-[88%] relative group border transition-all ${
                            isBot 
                              ? "bg-gray-100 text-zinc-900 border-gray-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 shadow-sm" 
                              : "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                          }`}
                        >
                          {renderMessageText(msg.text)}

                          {/* Action Card */}
                          {msg.action && (
                            <div className="mt-3 p-3 rounded-xl border border-dashed bg-white dark:bg-zinc-900 border-indigo-300 dark:border-indigo-800 text-left space-y-2 select-none shadow-sm">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Cambio sugerido</span>
                              </div>
                              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                {msg.action.title}
                              </div>
                              <div className="flex items-center gap-2 pt-1 font-sans">
                                {msg.actionStatus === "pending" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleExecuteAction(msg.id, msg.action)}
                                      className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                                    >
                                      Aplicar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectAction(msg.id)}
                                      className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                                    >
                                      Descartar
                                    </button>
                                  </>
                                ) : msg.actionStatus === "approved" ? (
                                  <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                                    ✓ Aplicado
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">
                                    ✕ Descartado
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {isBot && (
                            <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.text, msg.id)}
                                className="p-1 rounded bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 text-[9px] font-bold border border-gray-200 dark:border-zinc-700 shadow-sm"
                              >
                                {isCopiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>

                        {isBot ? (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 px-1 flex items-center gap-1">
                            <span>Tesla AI</span>
                            <span>•</span>
                            <span>Asistente AI</span>
                            <span>•</span>
                            <span className="lowercase font-mono">{formatTimeAgo(msg.timestamp) === "Ahora" ? "just now" : formatTimeAgo(msg.timestamp)}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 px-1 flex items-center gap-1 justify-end">
                            <span>Tú</span>
                            <span>•</span>
                            <span className="lowercase font-mono">{formatTimeAgo(msg.timestamp) === "Ahora" ? "just now" : formatTimeAgo(msg.timestamp)}</span>
                          </span>
                        )}
                      </motion.div>
                    );
                  })}

                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                      <SkeletonChatMessage isUser={false} />
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar (Image 3 style) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3.5 border-t border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0"
                >
                  <div className="relative flex flex-col bg-white dark:bg-zinc-800 rounded-[24px] border-2 border-gray-200 dark:border-zinc-700/80 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 transition-all p-3 space-y-2.5 shadow-sm">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      disabled={isLoading}
                      placeholder="Escribe tu pregunta..."
                      className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none px-1 font-semibold"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3.5 text-zinc-400 dark:text-zinc-400">
                        <button type="button" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5" title="Adjuntar">
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button type="button" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5" title="Emojis">
                          <Smile className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono text-zinc-300 dark:text-zinc-600 select-none">GIF</span>
                        <button type="button" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5" title="Dictado por voz">
                          <Mic className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !inputVal.trim()}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          !inputVal.trim() || isLoading
                            ? "bg-gray-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95"
                        }`}
                      >
                        <ArrowUp className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
