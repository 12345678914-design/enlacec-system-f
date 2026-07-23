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
  Settings, 
  Trash2, 
  Key, 
  Copy, 
  Check, 
  Bot, 
  User, 
  ChevronRight, 
  MessageSquare,
  HelpCircle,
  Eye,
  EyeOff,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  action?: {
    type: string;
    title: string;
    payload: any;
  };
  actionStatus?: "pending" | "approved" | "rejected";
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Custom API key states
  const [customKey, setCustomKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom API key on mount and setup initial greeting
  useEffect(() => {
    setCustomKey("");

    const savedHistory = localStorage.getItem(`enlacec_chat_history_${currentUser?.id}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
        return;
      } catch (e) {
        console.error("Error reading saved chat history:", e);
      }
    }

    // Set first greeting
    const roleName = currentUser?.role === "admin" ? "Director(a) / Administrador(a)" : "Docente";
    setMessages([
      {
        id: "msg-welcome-1",
        role: "model",
        text: `¡Hola, **${currentUser?.name || "colega"}**! 👋 Eres bienvenido como **${roleName}** a **ENLACEC**.\n\nSoy **Tesla**, el asistente inteligente de **ENLACEC**, con capacidad para **realizar consultas de datos en tiempo real y ejecutar cambios en la plataforma** cuando tú lo apruebes.\n\nPuedo ayudarte a:\n* 📊 **Consultar o analizar estudiantes**: Pregúntame sobre el historial académico de Sofía Valentino, Mateo Quispe o cualquier alumno.\n* 🧑‍🤝‍🧑 **Ingresar o modificar datos**: Pídeme agregar un nuevo alumno, registrar profesores, cambiar calificaciones o publicar un nuevo boletín oficial.\n* 💰 **Finanzas y balances escolares**: Pregúntame sobre ingresos, egresos y balances financieros, o pídeme registrar transacciones.\n* 🎨 **Personalizar el sistema**: Indícame cambiar los acentos de la UI, colores (ej. *'cambia el tema a esmeralda'*) o cambiar a modo oscuro.\n\n_¿En qué te puedo asesorar hoy?_`,
        timestamp: new Date(),
      }
    ]);
  }, [currentUser]);

  // Auto-scroll to bottom whenever messages list grows
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Persist history values
  const saveChatToLocal = (updatedList: ChatMessage[]) => {
    localStorage.setItem(`enlacec_chat_history_${currentUser?.id}`, JSON.stringify(updatedList));
  };

  const handleSaveApiKey = (key: string) => {
    const cleaned = key.trim();
    setCustomKey(cleaned);
    if (cleaned) {
      localStorage.setItem("edu_groq_api_key_override", cleaned);
    } else {
      localStorage.removeItem("edu_groq_api_key_override");
    }
  };

  const handleClearHistory = () => {
    if (confirm("¿Estás seguro de que deseas borrar el historial de conversación actual?")) {
      const firstGreeting: ChatMessage = {
        id: "msg-welcome-reset",
        role: "model",
        text: `Historial borrado. ¡Empecemos de nuevo! 🌟 ¿Qué necesitas que analicemos hoy sobre tu labor educativa?`,
        timestamp: new Date(),
      };
      setMessages([firstGreeting]);
      localStorage.removeItem(`enlacec_chat_history_${currentUser?.id}`);
      setShowConfig(false);
    }
  };

  const handleStartNewChat = () => {
    if (confirm("¿Deseas iniciar una nueva conversación con Tesla? Se borrarán tus mensajes anteriores.")) {
      const roleName = currentUser?.role === "admin" ? "Director(a) / Administrador(a)" : "Docente";
      const freshGreeting: ChatMessage = {
        id: `msg-welcome-new-${Date.now()}`,
        role: "model",
        text: `¡Hola de nuevo, **${currentUser?.name || "colega"}**! 🌟 Acabamos de sintonizar una **nueva sesión de chat limpio con Tesla**.\n\nTengo acceso en vivo a la información de los estudiantes, profesores, balances y configuraciones de la plataforma.\n\n_¿En qué te puedo colaborar en este nuevo hilo?_`,
        timestamp: new Date()
      };
      setMessages([freshGreeting]);
      localStorage.removeItem(`enlacec_chat_history_${currentUser?.id}`);
      setShowConfig(false);
    }
  };

  const handleExecuteAction = async (msgId: string, action: any) => {
    try {
      const { type, payload } = action;

      switch (type) {
        case "ADD_STUDENT":
          addStudent(payload);
          break;
        case "UPDATE_STUDENT":
          updateStudent(payload);
          break;
        case "DELETE_STUDENT":
          deleteStudent(payload.id);
          break;
        case "ADD_TEACHER":
          addTeacher(payload);
          break;
        case "UPDATE_TEACHER":
          updateTeacher(payload);
          break;
        case "DELETE_TEACHER":
          deleteTeacher(payload.id);
          break;
        case "ADD_TRANSACTION":
          addTransaction(payload);
          break;
        case "ADD_NEWS":
          await addNews(payload);
          break;
        case "UPDATE_NEWS":
          await updateNews(payload);
          break;
        case "DELETE_NEWS":
          await deleteNews(payload.id);
          break;
        case "UPDATE_THEME":
          updateTheme(payload);
          break;
        case "ADD_TO_BOARD":
          const boardEvent = new CustomEvent("add-to-ai-board", { detail: payload });
          window.dispatchEvent(boardEvent);
          break;
        default:
          throw new Error("Tipo de acción no reconocido.");
      }

      // Update message status
      const updated = messages.map(m => {
        if (m.id === msgId) {
          return { ...m, actionStatus: "approved" as const };
        }
        return m;
      });
      setMessages(updated);
      saveChatToLocal(updated);

      // Append confirmation
      const confirmationMsg: ChatMessage = {
        id: `msg-confirm-${Date.now()}`,
        role: "model",
        text: `✅ **Operación Completada con Éxito:** He aplicado los cambios de **${action.title}** en el sistema en tiempo real. Ahora podrás visualizar los cambios reflejados de inmediato en tus paneles.`,
        timestamp: new Date()
      };
      
      const resList = [...updated, confirmationMsg];
      setMessages(resList);
      saveChatToLocal(resList);
    } catch (err: any) {
      console.error(err);
      alert(`Error al ejecutar acción: ${err.message || err}`);
    }
  };

  const handleRejectAction = (msgId: string) => {
    const updated = messages.map(m => {
      if (m.id === msgId) {
        return { ...m, actionStatus: "rejected" as const };
      }
      return m;
    });
    setMessages(updated);
    saveChatToLocal(updated);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = (textToSend || inputVal).trim();
    if (!finalMsg) return;

    if (!textToSend) {
      setInputVal("");
    }

    const newUserMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      text: finalMsg,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    saveChatToLocal(updatedMessages);
    setIsLoading(true);

    try {
      // Map to server payload model
      const backendHistory = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        text: m.text
      }));

      // Gather current system's context state (full access to all datasets)
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
        finalMsg,
        backendHistory,
        systemContext
      );

      const newBotMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date(),
        action: data.action || undefined,
        actionStatus: data.action ? "pending" : undefined
      };

      const finalWithBot = [...updatedMessages, newBotMsg];
      setMessages(finalWithBot);
      saveChatToLocal(finalWithBot);
    } catch (err: any) {
      console.error(err);
      const newBotErr: ChatMessage = {
        id: `msg-bot-err-${Date.now()}`,
        role: "model",
        text: `❌ **Error del Sistema:** ${err.message || "No pudimos conectarnos al motor de inteligencia artificial."}\n\nSi estás usando una API Key propia, por favor verifica que sea correcta en los ajustes del chatbot (icono de engranaje ⚙️). De lo contrario, contacta al administrador del sistema para revisar la API Key general del servidor.`,
        timestamp: new Date()
      };
      const finalWithError = [...updatedMessages, newBotErr];
      setMessages(finalWithError);
      saveChatToLocal(finalWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => {
      setIsCopiedId(null);
    }, 2000);
  };

  // Inline styling parser
  const renderMessageText = (text: string) => {
    if (!text) return null;
    const blocks = text.split(/\n/);
    
    return (
      <div className="space-y-1.5 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
        {blocks.map((line, index) => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith("###")) {
            return (
              <h5 key={index} className="text-xs md:text-sm font-bold text-gray-900 dark:text-white mt-2 mb-1">
                {trimmed.replace(/^###\s*/, "")}
              </h5>
            );
          }
          if (trimmed.startsWith("##")) {
            return (
              <h4 key={index} className="text-sm md:text-base font-bold text-gray-950 dark:text-white mt-3 mb-1.5 border-b border-gray-150 dark:border-zinc-800 pb-0.5">
                {trimmed.replace(/^##\s*/, "")}
              </h4>
            );
          }
          if (trimmed.startsWith("#")) {
            return (
              <h3 key={index} className="text-base md:text-lg font-black text-gray-950 dark:text-zinc-50 mt-3 mb-1.5">
                {trimmed.replace(/^#\s*/, "")}
              </h3>
            );
          }
          
          // Bullet list items
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            const content = trimmed.substring(2);
            return (
              <div key={index} className="flex items-start gap-1.5 pl-2 my-0.5">
                <span className="text-indigo-500 shrink-0 mt-1.5 text-[8px]">•</span>
                <span className="flex-1">{parseInlineStyles(content)}</span>
              </div>
            );
          }
          
          // Numbered lists
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            const num = numMatch[1];
            const content = numMatch[2];
            return (
              <div key={index} className="flex items-start gap-1.5 pl-2 my-0.5">
                <span className="text-indigo-500 dark:text-indigo-400 shrink-0 font-bold font-mono text-[11px] mt-0.5">{num}.</span>
                <span className="flex-1">{parseInlineStyles(content)}</span>
              </div>
            );
          }

          if (trimmed === "") return <div key={index} className="h-1.5" />;
          
          return <p key={index} className="my-1">{parseInlineStyles(line)}</p>;
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
        <strong key={match.index} className="font-bold text-gray-900 dark:text-zinc-50 bg-indigo-50/20 dark:bg-zinc-800/20 px-0.5 rounded">
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
        { label: "💡 Planificar taller docente", text: "Hola chatbot, por favor diséñame un taller de 2 horas para los profesores sobre metodologías activas y evaluación formativa escolar." },
        { label: "📊 Formular observación escolar", text: "Escribe una plantilla de observación de desempeño docente en el aula para evaluar clima escolar, uso del pizarrón y dinamismo." },
        { label: "📈 Presupuestos e incentivos", text: "Bríndame 5 ideas prácticas y creativas para incentivar el buen desempeño docente sin aumentar masivamente los costos presupuestales." }
      ]
    : [
        { label: "💡 Planeación Matemática", text: "Diséñame una secuencia de clase de 50 minutos para explicar 'ecuaciones de primer grado' usando dinámica interactiva para jóvenes." },
        { label: "📝 Reporte de Conducta", text: "Redacta una carta asertiva y cordial para un padre de familia cuyo hijo está distraído en clase constante, incentivándole a cooperar desde casa." },
        { label: "🎯 Rúbrica de portafolio", text: "Ayúdame a diseñar una rúbrica en tabla con niveles (Insuficiente, Básico, Excelente) para evaluar un proyecto de ciencias naturales escolar." }
      ];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-[9999] select-none">
        <motion.button
          id="btn-chatbot-float-trigger"
          title="Asistente EnlaceC AI"
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setShowConfig(false);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer bg-gradient-to-tr ${cl.gradient}`}
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-spin-once" />
          ) : (
            <>
              <Bot className="w-6 h-6" />
              {/* Pulse ripple indicator */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black animate-bounce text-white">
                !
              </span>
              <span className="absolute inset-x-0 -bottom-1 w-full flex justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              </span>
            </>
          )}
        </motion.button>
      </div>

      {/* Main Expansion Chat Widget Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="panel-chatbot-expansion"
            initial={{ opacity: 0, scale: 0.85, y: 70, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 70, x: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-24 right-4 md:right-6 z-[9999] w-[calc(100vw-32px)] sm:w-[370px] h-[480px] max-h-[calc(100vh-120px)] border border-gray-200/80 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-900/98 backdrop-blur-xl rounded-[30px] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header section with decorative accent strip */}
            <div className={`p-4 border-b border-gray-150 dark:border-zinc-850 flex items-center justify-between select-none shrink-0 relative bg-gradient-to-r ${cl.gradient} text-white`}>
              {/* Grid abstract background */}
              <div className="absolute inset-0 bg-grid-white/[0.04] mask-linear pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10 text-left">
                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/30 flex items-center justify-center shadow-md shrink-0 bg-white dark:bg-zinc-900 p-1 relative">
                  <EnlaceCIcon className="w-full h-full scale-105" />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 text-white font-black text-[7px] leading-none px-1 py-0.5 rounded-tl-md border-t border-l border-white/10 select-none uppercase tracking-wider">
                    AI
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm tracking-wide uppercase">TESLA AI</h3>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-cyan-500 border border-cyan-400 text-white animate-pulse">
                      LLaMA 3.3
                    </span>
                  </div>
                  <p className="text-[10px] text-white/80 font-medium">Asistente Humano de Gestión Escolar</p>
                </div>
              </div>

              <div className="flex items-center gap-1 relative z-10">
                <button
                  id="btn-chatbot-new-chat-trigger"
                  type="button"
                  onClick={handleStartNewChat}
                  title="Nuevo Chat de Tesla (Reiniciar conversación)"
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-white border border-white/5 bg-white/5 hover:bg-white/15"
                >
                  <RotateCcw className="w-3.5 h-3.5 animate-spin-hover" />
                  <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Nuevo Chat</span>
                </button>
                <button
                  id="btn-chatbot-toggle-settings"
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  title="Configurar API Key / Borrar Chat"
                  className={`p-2 rounded-xl transition-all ${showConfig ? "bg-white/20" : "hover:bg-white/10"} cursor-pointer`}
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>
                <button
                  id="btn-chatbot-header-close"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimizar panel"
                  className="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Config & Settings Panel View (Overlaps the messaging view smoothly) */}
            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-[72px] inset-x-0 bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 z-[9] p-5 shadow-lg space-y-4 text-left select-none"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      <label className="text-[10px] font-black text-gray-550 dark:text-zinc-300 uppercase tracking-widest">
                        ESTADO DE LA CONEXIÓN
                      </label>
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400 font-medium">
                      TESLA AI está conectado y operativo a nivel global utilizando la variable de entorno <code className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9.5px] font-mono border border-indigo-100 dark:border-indigo-900/30">GROQ_API_KEY</code> configurada de forma segura en el servidor escolar. No se requiere configuración manual.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-zinc-850 flex items-center justify-between">
                    <button
                      id="btn-chatbot-config-clear-chat"
                      type="button"
                      onClick={handleClearHistory}
                      className="px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-transparent rounded-xl flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Borrar Historial
                    </button>

                    <button
                      id="btn-chatbot-config-done"
                      type="button"
                      onClick={() => setShowConfig(false)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Guardar y Cerrar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages Body Panel */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 md:px-5 space-y-4 bg-gray-50/50 dark:bg-zinc-950/30 flex flex-col scroll-smooth">
              <div className="text-center py-2 shrink-0">
                <span className="text-[10px] font-bold font-mono tracking-widest text-gray-400 uppercase select-none">
                  Inicio del Chat • Tesla
                </span>
              </div>

              {messages.map((msg) => {
                const isBot = msg.role === "model";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 max-w-[88%] ${isBot ? "self-start text-left" : "self-end flex-row-reverse text-right"}`}
                  >
                    {/* Role Icon Shield */}
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm border ${
                      isBot 
                        ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                        : `${cl.lightBg} border-gray-200/50 dark:border-white/10`
                    }`}>
                      {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Chat Bubble Container */}
                    <div className="space-y-1">
                      <div
                        className={`rounded-2xl px-3.5 py-3 text-sm relative group overflow-hidden border ${
                          isBot 
                            ? "bg-white dark:bg-zinc-850 text-gray-800 dark:text-zinc-100 border-gray-150 dark:border-zinc-800 shadow-md shadow-gray-100/30 dark:shadow-none" 
                            : `${cl.primaryBg} text-white border-white/10 shadow-lg shadow-indigo-500/5`
                        }`}
                      >
                        {/* Custom Formatted Markdown Body */}
                        {renderMessageText(msg.text)}

                        {/* Suggested system modification action card */}
                        {msg.action && (
                          <div className="mt-3 p-3 rounded-xl border border-dashed bg-gray-50 dark:bg-zinc-900 border-indigo-200/60 dark:border-indigo-900/40 text-left space-y-2 select-none relative z-10 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-555 animate-pulse" />
                              <span>Cambio del Sistema sugerido</span>
                            </div>
                            <div className="text-xs font-bold text-gray-800 dark:text-zinc-200 leading-snug">
                              {msg.action.title}
                            </div>
                            <div className="text-[10px] text-zinc-500 max-h-24 overflow-y-auto font-mono bg-white dark:bg-zinc-950 p-2 rounded-lg border border-gray-150 dark:border-zinc-800">
                              {JSON.stringify(msg.action.payload, null, 2)}
                            </div>
                            
                            <div className="flex items-center gap-2 pt-1 font-sans">
                              {msg.actionStatus === "pending" ? (
                                <>
                                  <button
                                    id={`btn-action-confirm-${msg.id}`}
                                    type="button"
                                    onClick={() => handleExecuteAction(msg.id, msg.action)}
                                    className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-all active:scale-95 shadow"
                                  >
                                    Confirmar Cambios
                                  </button>
                                  <button
                                    id={`btn-action-reject-${msg.id}`}
                                    type="button"
                                    onClick={() => handleRejectAction(msg.id)}
                                    className="py-1.5 px-3 bg-gray-150 hover:bg-gray-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all"
                                  >
                                    Descartar
                                  </button>
                                </>
                              ) : msg.actionStatus === "approved" ? (
                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 py-1.5 px-3 rounded-lg border border-emerald-150 dark:border-emerald-900/30 w-full text-center">
                                  <Check className="w-3.5 h-3.5" />
                                  Acción Aplicada Correctamente
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-rose-500 dark:text-rose-450 flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 py-1.5 px-3 rounded-lg border border-rose-150 dark:border-rose-900/30 w-full text-center">
                                  <X className="w-3.5 h-3.5" />
                                  Acción Descartada
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Hover Quick actions (only for bots for copying) */}
                        {isBot && (
                          <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              id={`btn-chatbot-copy-${msg.id}`}
                              type="button"
                              onClick={() => copyToClipboard(msg.text, msg.id)}
                              title="Copiar texto de respuesta"
                              className="p-1 px-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-300 flex items-center gap-1 text-[9px] font-bold border border-gray-200/50 dark:border-zinc-750 transition-all cursor-pointer"
                            >
                              {isCopiedId === msg.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp labels */}
                      <span className="text-[9px] text-gray-400/80 dark:text-zinc-550 font-medium px-1 font-mono">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bot Loading/Thinking State Bubble Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5 max-w-[85%] self-start text-left">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 animate-spin-once" />
                  </div>
                  <div className="bg-white dark:bg-zinc-850 border border-gray-150 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <div className="flex items-center gap-1 select-none">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-gray-430 dark:text-zinc-400 font-bold font-mono pl-1 tracking-wider uppercase animate-pulse">
                      Generando asesoria...
                    </span>
                  </div>
                </div>
              )}

              {/* Suggestion prompt boxes container, displayed on empty or short chats */}
              {messages.length === 1 && !isLoading && (
                <div className="space-y-2 py-2 shrink-0 select-none text-left">
                  <div className="flex items-center gap-1 text-gray-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest px-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Sugerencias Rápidas
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {promptSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        id={`btn-chatbot-suggestion-${idx}`}
                        type="button"
                        onClick={() => handleSendMessage(s.text)}
                        className="p-2.5 border border-gray-200/70 hover:border-indigo-400/50 dark:border-zinc-800 dark:hover:border-indigo-500/50 bg-white/50 dark:bg-zinc-900/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 rounded-xl text-left transition-all group flex items-start gap-2 cursor-pointer text-xs font-semibold text-gray-650 dark:text-zinc-300"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-550 dark:text-indigo-400 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                        <span className="flex-1">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Chat input footer panel */}
            <form
              id="form-chatbot-input"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-gray-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex items-center gap-2 shrink-0"
            >
              <input
                id="input-chatbot-text-entry"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isLoading}
                placeholder="Pregúntale a Tesla..."
                className="flex-1 py-2.5 px-4 outline-none text-xs md:text-sm bg-gray-150/40 dark:bg-zinc-950/45 focus:bg-white dark:focus:bg-zinc-950 rounded-2xl border border-gray-200/50 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-sans text-gray-800 dark:text-zinc-100"
              />

              <button
                id="btn-chatbot-send"
                type="submit"
                disabled={isLoading || !inputVal.trim()}
                title="Enviar mensaje"
                className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center shrink-0 text-white transition-all cursor-pointer shadow-md active:scale-90 ${
                  !inputVal.trim() || isLoading
                    ? "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                    : `${cl.primaryBg} shadow-indigo-500/10`
                }`}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
