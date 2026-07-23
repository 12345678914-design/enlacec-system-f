/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { getThemeClasses } from "../../lib/themeUtils";
import { callGroqAIChatClient } from "../../services/clientServices";
import { EnlaceCIcon } from "../EnlaceCIcon";
import { 
  Sparkles, 
  Send, 
  Key, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  User, 
  Cpu, 
  ChevronRight, 
  ShieldCheck, 
  Compass, 
  Settings, 
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff
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

type PersonaType = "standard" | "analista" | "pedagogo" | "futurista";

export const TeslaAIChatView: React.FC = () => {
  const { 
    currentUser, 
    theme, 
    students, 
    teachers, 
    balance, 
    news,
    addStudent,
    updateStudent,
    deleteStudent,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addTransaction,
    addNews,
    updateTheme,
    showToast
  } = useApp();

  const cl = getThemeClasses(theme.accentColor);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [persona, setPersona] = useState<PersonaType>("standard");
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Voice Synthesis and Voice Input States
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [autoRead, setAutoRead] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load custom key, chat history, and autoRead preference on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("edu_groq_api_key_override") || "";
    setCustomKey(savedKey);

    const savedAutoRead = localStorage.getItem("enlacec_tesla_autoread") === "true";
    setAutoRead(savedAutoRead);

    const savedHistory = localStorage.getItem(`enlacec_tesla_fullscreen_history_${currentUser?.id}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (err) {
        setupDefaultGreeting();
      }
    } else {
      setupDefaultGreeting();
    }

    // Speech synthesis and recognition cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [currentUser]);

  const handleToggleSpeak = (text: string, msgId: string) => {
    if (!window.speechSynthesis) {
      showToast("La síntesis de voz no es soportada por este navegador.", "error");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    } else {
      window.speechSynthesis.cancel();
      
      // Clean up markdown syntax before speaking for a cleaner vocal experience
      const cleanText = text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/#[#]*\s/g, "")
        .replace(/- \s/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "es-MX";
      
      utterance.onend = () => {
        setSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setSpeakingMsgId(null);
      };
      
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleListen = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      showToast("El reconocimiento de voz no es soportado por este navegador.", "error");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      try {
        const recog = new SpeechRecognitionAPI();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = "es-MX";

        recog.onstart = () => {
          setIsListening(true);
          showToast("Micrófono activado. Te escucho...", "info");
        };

        recog.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            showToast("Acceso al micrófono denegado. Permítelo en tu navegador.", "error");
          } else {
            showToast(`Error de micrófono: ${event.error}`, "error");
          }
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputVal(prev => prev ? prev + " " + transcript : transcript);
            showToast("Mensaje dictado con éxito", "success");
          }
        };

        recognitionRef.current = recog;
        recog.start();
      } catch (error) {
        console.error("Failed to start SpeechRecognition:", error);
        setIsListening(false);
      }
    }
  };

  const handleToggleAutoRead = (enabled: boolean) => {
    setAutoRead(enabled);
    localStorage.setItem("enlacec_tesla_autoread", String(enabled));
    if (!enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
    showToast(enabled ? "Lectura automática activada" : "Lectura automática desactivada", "info");
  };

  // Save history to localStorage
  const saveChatToLocal = (historyList: ChatMessage[]) => {
    localStorage.setItem(`enlacec_tesla_fullscreen_history_${currentUser?.id}`, JSON.stringify(historyList));
  };

  const setupDefaultGreeting = () => {
    const defaultMsg: ChatMessage = {
      id: "msg-welcome",
      role: "model",
      text: `Hola ${currentUser?.name || "Docente"}. ¡Bienvenido al espacio interactivo de **TESLA AI**!\n\nSoy tu asistente de inteligencia artificial con apariencia humana, potenciado por **Groq y LLaMA 3.3**. Estoy aquí para guiarte en el control administrativo, académico, financiero y de planificación áulica de la institución.\n\nPuedes hacerme preguntas o pedirme directamente realizar cambios del sistema. ¿En qué puedo apoyarte hoy?`,
      timestamp: new Date()
    };
    setMessages([defaultMsg]);
  };

  // Scroll to bottom helper
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  const handleSaveApiKey = (key: string) => {
    const cleaned = key.trim();
    setCustomKey(cleaned);
    if (cleaned) {
      localStorage.setItem("edu_groq_api_key_override", cleaned);
    } else {
      localStorage.removeItem("edu_groq_api_key_override");
    }
    // Dispatch event to sync other widgets instantly
    window.dispatchEvent(new Event("sidebar-config-changed"));
  };

  const handleClearHistory = () => {
    if (window.confirm("¿Estás seguro de que deseas vaciar el historial de conversación con TESLA AI?")) {
      setupDefaultGreeting();
      localStorage.removeItem(`enlacec_tesla_fullscreen_history_${currentUser?.id}`);
      showToast("Historial de chat con Tesla AI borrado", "info");
    }
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
      const backendHistory = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        text: m.text
      }));

      const systemContext = {
        students,
        teachers,
        balance,
        news,
        currentUser
      };

      // Apply Persona Modifier Directives
      let personaInstruction = "";
      if (persona === "analista") {
        personaInstruction = "[MODO ANALISTA: Responde con enfoque de optimización financiera y de recursos, utiliza viñetas analíticas y mantén un tono de consultor experto]. ";
      } else if (persona === "pedagogo") {
        personaInstruction = "[MODO PEDAGOGO: Enfócate en el desarrollo cognitivo de los estudiantes, brinda ejemplos prácticos de planificación curricular, mantén un tono empático y motivacional]. ";
      } else if (persona === "futurista") {
        personaInstruction = "[MODO FUTURISTA CYBERPUNK: Utiliza metáforas de tecnología cuántica, hiper-conectividad escolar, redes neuronales y automatización avanzada]. ";
      }

      const data = await callGroqAIChatClient(
        personaInstruction + finalMsg,
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

      if (autoRead) {
        handleToggleSpeak(data.text, newBotMsg.id);
      }
    } catch (err: any) {
      console.error(err);
      const newBotErr: ChatMessage = {
        id: `msg-bot-err-${Date.now()}`,
        role: "model",
        text: `❌ **Error de Conexión:** ${err.message || "No se pudo conectar al motor de Groq."}\n\nPor favor verifica tu API Key de Groq en la barra lateral de configuración.`,
        timestamp: new Date()
      };
      const finalWithError = [...updatedMessages, newBotErr];
      setMessages(finalWithError);
      saveChatToLocal(finalWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (msgId: string, action: any) => {
    try {
      if (!action || !action.type || !action.payload) return;
      
      let success = false;
      const type = action.type;
      const p = action.payload;

      switch (type) {
        case "ADD_STUDENT":
          addStudent({
            nombre: p.nombre,
            grado: p.grado,
            seccion: p.seccion || "A",
            promedio: Number(p.promedio) || 10,
            asistencia: Number(p.asistencia) || 100,
            estadoPago: p.estadoPago || "Al Día"
          });
          success = true;
          break;
        case "UPDATE_STUDENT":
          if (p.id) {
            updateStudent(p.id, p);
            success = true;
          }
          break;
        case "DELETE_STUDENT":
          if (p.id) {
            deleteStudent(p.id);
            success = true;
          }
          break;
        case "ADD_TEACHER":
          addTeacher({
            nombre: p.nombre,
            materia: p.materia,
            grado: p.grado || "1° Primaria",
            estado: p.estado || "Activo"
          });
          success = true;
          break;
        case "UPDATE_TEACHER":
          if (p.id) {
            updateTeacher(p.id, p);
            success = true;
          }
          break;
        case "DELETE_TEACHER":
          if (p.id) {
            deleteTeacher(p.id);
            success = true;
          }
          break;
        case "ADD_TRANSACTION":
          addTransaction({
            descripcion: p.descripcion,
            monto: Number(p.monto) || 0,
            tipo: p.tipo === "ingreso" ? "ingreso" : "egreso",
            categoria: p.categoria || "Otros"
          });
          success = true;
          break;
        case "ADD_NEWS":
          addNews({
            titulo: p.titulo,
            contenido: p.contenido,
            categoria: p.categoria || "Aviso",
            prioridad: p.prioridad || "Media",
            fecha: new Date().toLocaleDateString("es-ES")
          });
          success = true;
          break;
        case "UPDATE_THEME":
          if (p.accentColor) {
            updateTheme({ accentColor: p.accentColor });
            success = true;
          }
          break;
        default:
          success = false;
      }

      if (success) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            return { ...m, actionStatus: "approved" };
          }
          return m;
        }));
        showToast(`Acción '${action.title}' ejecutada exitosamente`, "success");
      } else {
        throw new Error("No se pudo mapear la acción.");
      }
    } catch (error: any) {
      showToast(`Error al ejecutar acción: ${error.message || "Mapeo incorrecto"}`, "error");
    }
  };

  const handleRejectAction = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, actionStatus: "rejected" };
      }
      return m;
    }));
    showToast("Acción sugerida descartada", "info");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => {
      setIsCopiedId(null);
    }, 2000);
  };

  const parseInlineStyles = (line: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-extrabold text-indigo-900 dark:text-indigo-200">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return parts.length > 0 ? parts : line;
  };

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
            return (
              <div key={index} className="flex items-start gap-1.5 pl-2 my-0.5">
                <span className="text-indigo-550 dark:text-indigo-400 font-mono text-[10px] font-black">{numMatch[1]}.</span>
                <span className="flex-1">{parseInlineStyles(numMatch[2])}</span>
              </div>
            );
          }
          
          return <p key={index}>{parseInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  // Quick prompt presets for TESLA AI
  const prompts = [
    { label: "Análisis Financiero de la Caja", text: "Haz un análisis completo del flujo de efectivo actual, sumas totales de ingresos y egresos, y sugiereme 3 decisiones para optimizar costos." },
    { label: "Diseñar Planificación de Clases", text: "Redacta un plan de clases innovador de ciencias sobre electromagnetismo para 4° grado con 1 experimento casero y 2 preguntas de examen." },
    { label: "Auditoría de Alumnos con Bajo Rendimiento", text: "Identifica a los estudiantes con promedio menor a 7.5 y redacta una sugerencia de acción para citar a sus padres." },
    { label: "Idea Creativa para Evento Escolar", text: "Propón un festival escolar temático para recaudar fondos, detallando actividades sugeridas y una estimación de presupuesto." }
  ];

  return (
    <div className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-50/20 dark:bg-zinc-950/20 backdrop-blur-md relative">
      {/* TOP HEADER BLOCK with Connection Status & Settings Trigger */}
      <div className="px-4 py-3.5 border-b border-gray-200/50 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl border border-indigo-500/20 bg-white dark:bg-zinc-900 p-1 flex items-center justify-center shadow-inner relative">
            <EnlaceCIcon className="w-full h-full scale-105" />
            <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-650 text-white font-black text-[7px] leading-none px-1 py-0.5 rounded-tl-md border-t border-l border-white/10 select-none uppercase tracking-wider">
              AI
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs md:text-sm font-black text-gray-900 dark:text-zinc-50 uppercase tracking-tight">
                TESLA AI
              </h2>
              <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-cyan-500/10 border border-cyan-400/30 text-cyan-600 dark:text-cyan-400 animate-pulse">
                CONECTADO
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              Asistente Directivo & Pedagógico • Modo {persona.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="py-2 px-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-gray-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
            title="Configurar Personalidad de Tesla AI"
          >
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>
        </div>
      </div>

      {/* RIGHT WORKSPACE: Full Interactive Message Arena */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/10 dark:bg-zinc-900/10 backdrop-blur-sm relative">
        
        {/* Messages feed */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-4 scroll-smooth">
          <div className="text-center py-2 shrink-0 select-none">
            <span className="px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-bold font-mono tracking-widest text-zinc-400 uppercase">
              CONEXIÓN SEGURA CON TESLA AI • MODELO LLAMA 3.3 70B
            </span>
          </div>

          {messages.map((msg) => {
            const isBot = msg.role === "model";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-[85%] ${isBot ? "self-start text-left" : "self-end flex-row-reverse text-right ml-auto"}`}
              >
                {/* Role Icon Shield */}
                <div className={`w-9 h-9 rounded-xl shrink-0 overflow-hidden flex items-center justify-center shadow-sm border ${
                  isBot 
                    ? "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 relative" 
                    : `bg-indigo-600 border-indigo-500 text-white shadow`
                }`}>
                  {isBot ? (
                    <>
                      <EnlaceCIcon className="w-full h-full scale-105" />
                      <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 text-white font-black text-[6px] leading-none px-1 py-0.5 rounded-tl-sm border-t border-l border-white/10 select-none uppercase tracking-wider scale-90">
                        AI
                      </div>
                    </>
                  ) : <User className="w-4 h-4 text-white" />}
                </div>

                {/* Chat Bubble Container */}
                <div className="space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm relative group overflow-hidden border ${
                      isBot 
                        ? "bg-white/80 dark:bg-zinc-900/90 text-gray-800 dark:text-zinc-100 border-gray-200/50 dark:border-zinc-800/80 shadow-md" 
                        : `bg-indigo-600/95 dark:bg-indigo-600/90 text-white border-indigo-500 shadow-lg shadow-indigo-600/10`
                    }`}
                  >
                    {/* Custom Formatted Markdown Body */}
                    {renderMessageText(msg.text)}

                    {/* Suggested system modification action card */}
                    {msg.action && (
                      <div className="mt-3.5 p-3 rounded-xl border border-dashed bg-gray-50 dark:bg-zinc-950 border-indigo-200/60 dark:border-indigo-900/40 text-left space-y-2 select-none relative z-10 shadow-sm">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                          <span>Cambio del Sistema sugerido</span>
                        </div>
                        <div className="text-xs font-bold text-gray-800 dark:text-zinc-200 leading-snug">
                          {msg.action.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 max-h-32 overflow-y-auto font-mono bg-white dark:bg-zinc-900 p-2 rounded-lg border border-gray-150 dark:border-zinc-800/60">
                          {JSON.stringify(msg.action.payload, null, 2)}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-1 font-sans">
                          {msg.actionStatus === "pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleExecuteAction(msg.id, msg.action)}
                                className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-all active:scale-95 shadow"
                              >
                                Confirmar Cambios
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAction(msg.id)}
                                className="py-1.5 px-3 bg-gray-150 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-650 dark:text-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all"
                              >
                                Descartar
                              </button>
                            </>
                          ) : msg.actionStatus === "approved" ? (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 py-1.5 px-3 rounded-lg border border-emerald-150 dark:border-emerald-900/30 w-full text-center">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Acción Aplicada Correctamente
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-rose-500 dark:text-rose-450 flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 py-1.5 px-3 rounded-lg border border-rose-150 dark:border-rose-900/30 w-full text-center">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Acción Descartada
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions Tray: speak and copy */}
                    {isBot && (
                      <div className="absolute right-1 bottom-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 p-0.5 rounded-lg border border-gray-200/60 dark:border-zinc-800/60 shadow">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeak(msg.text, msg.id)}
                          title={speakingMsgId === msg.id ? "Detener voz" : "Escuchar en voz alta"}
                          className={`p-1 px-1.5 rounded-md flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer ${
                            speakingMsgId === msg.id
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                              : "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <VolumeX className="w-2.5 h-2.5 animate-pulse text-rose-500" />
                              <span>Detener</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-2.5 h-2.5" />
                              <span>Escuchar</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          title="Copiar texto de respuesta"
                          className="p-1 px-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-350 flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer"
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
                  
                  {/* Timestamp label */}
                  <span className="text-[9px] text-gray-400/80 dark:text-zinc-500 font-medium px-1.5 font-mono block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Bot Loading State */}
          {isLoading && (
            <div className="flex items-start gap-3 max-w-[80%] self-start text-left">
              <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden flex items-center justify-center shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 relative animate-pulse">
                <EnlaceCIcon className="w-full h-full scale-105" />
                <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 text-white font-black text-[6px] leading-none px-1 py-0.5 rounded-tl-sm border-t border-l border-white/10 select-none uppercase tracking-wider scale-90">
                  AI
                </div>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 border border-gray-150 dark:border-zinc-800/80 rounded-2xl px-4 py-3 shadow flex items-center gap-2">
                <div className="flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-gray-430 dark:text-zinc-400 font-bold font-mono pl-1.5 tracking-wider uppercase animate-pulse">
                  Tesla AI está formulando respuesta...
                </span>
              </div>
            </div>
          )}

          {/* Prompt preset boxes, shown on empty or short chat streams */}
          {messages.length === 1 && !isLoading && (
            <div className="space-y-3 pt-6 select-none text-left">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest px-1">
                <Compass className="w-4 h-4 text-indigo-555" />
                <span>¿De qué quieres hablar hoy con Tesla AI? (Presiona para iniciar)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p.text)}
                    className="p-3.5 border border-gray-200/50 hover:border-indigo-400/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/40 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/15 rounded-2xl text-left transition-all group flex items-start gap-3 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-indigo-550 dark:text-indigo-400 shrink-0 mt-0.5 group-hover:translate-x-1.5 transition-transform" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-150 block">{p.label}</span>
                      <span className="text-[10px] text-zinc-400 leading-relaxed block">{p.text.slice(0, 75)}...</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input sticky form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 border-t border-gray-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-900/25 flex items-center gap-3 shrink-0"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isLoading}
            placeholder={`Habla libremente con TESLA AI en modo ${persona.toUpperCase()}...`}
            className="flex-1 py-3 px-4 outline-none text-xs md:text-sm bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200/60 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-sans text-gray-800 dark:text-zinc-100 shadow-inner"
          />

          {/* Microphone Voice Input Toggle Button */}
          {!inputVal && (
            <button
              type="button"
              onClick={handleToggleListen}
              disabled={isLoading}
              title={isListening ? "Detener dictado por voz" : "Dictar mensaje por voz"}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 ${
                isListening
                  ? "bg-rose-500 text-white shadow-md shadow-rose-550/20"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-gray-200/50 dark:border-zinc-800/80"
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 animate-bounce" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className={`px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg active:scale-95 shrink-0 ${
              !inputVal.trim() || isLoading
                ? "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/15"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>

      {/* OVERLAY CONFIGURATION DIALOG / MODAL */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigOpen(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[85vh] text-left space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-zinc-100 uppercase tracking-wider">
                    Ajustes de Tesla AI
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-650 dark:hover:text-zinc-200 text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Identity & Portrait inside Settings */}
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-150 dark:border-zinc-850">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-indigo-500/30 bg-white dark:bg-zinc-900 p-2 flex items-center justify-center shadow shrink-0">
                  <EnlaceCIcon className="w-full h-full scale-105" />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 text-white font-black text-[6px] leading-none px-1 py-0.5 rounded-tl-md border-t border-l border-white/10 select-none uppercase tracking-wider">
                    AI
                  </div>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-black tracking-wider text-gray-900 dark:text-zinc-150 uppercase">TESLA AI</h4>
                  <p className="text-[9px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">Asistente Virtual Activo</p>
                  <p className="text-[10.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Tutor virtual para optimización directiva, finanzas y pedagogía.
                  </p>
                </div>
              </div>

              {/* Personality Modulator */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-550" />
                  Modulador de Personalidad
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "standard", label: "Normal", desc: "Balanceado y formal" },
                    { id: "analista", label: "Analista", desc: "Enfoque en métricas" },
                    { id: "pedagogo", label: "Pedagogo", desc: "Metodologías de clase" },
                    { id: "futurista", label: "Futurista", desc: "Sugerencias innovadoras" }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPersona(p.id as PersonaType)}
                      className={`p-2.5 rounded-2xl border text-left transition-all relative ${
                        persona === p.id 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10" 
                          : "bg-gray-50 hover:bg-gray-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border-gray-150 dark:border-zinc-850 text-gray-800 dark:text-zinc-300"
                      }`}
                    >
                      <div className="text-[11px] font-black uppercase tracking-wider">{p.label}</div>
                      <div className={`text-[9px] ${persona === p.id ? "text-indigo-100" : "text-zinc-450 dark:text-zinc-500"}`}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice / Audio Configuration Settings */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-550" />
                  Reproducción de Audio (TTS)
                </label>
                <div className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border border-gray-150 dark:border-zinc-850 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-zinc-200">
                      Lectura Automática
                    </div>
                    <div className="text-[10px] text-zinc-450 dark:text-zinc-500">
                      Leer respuestas nuevas en voz alta al llegar
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAutoRead(!autoRead)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-250 shrink-0 ${
                      autoRead ? "bg-indigo-600" : "bg-gray-200 dark:bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-250 ${
                        autoRead ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Security & Server Key Details */}
              <div className="p-4 bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-500/10 dark:border-indigo-900/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Conexión Segura con el Servidor
                </div>
                <p className="text-[10.5px] text-zinc-600 dark:text-zinc-300 leading-normal font-medium">
                  El asistente funciona exclusivamente utilizando la clave de entorno <code className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded text-[9.5px] border border-indigo-150/20">GROQ_API_KEY</code> provista en el servidor escolar de forma segura. No requiere ninguna configuración por parte del usuario.
                </p>
              </div>

              {/* Actions (Clear history) */}
              <div className="pt-4 border-t border-gray-150 dark:border-zinc-800 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleClearHistory();
                    setIsConfigOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-rose-500/5 hover:text-rose-600 text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar Chat
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
