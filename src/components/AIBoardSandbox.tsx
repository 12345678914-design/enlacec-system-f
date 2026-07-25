import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Trash2, Plus, Move, HelpCircle, 
  Flame, Zap, ArrowUpRight, RotateCcw, FileText, CheckCircle,
  FlaskConical, Compass, Eye, Waves, Lightbulb, Play, Pause, Save, HelpCircle as HelpIcon, Trash,
  Pin, Send, MessageSquare, Bot, User, Loader2, X, ChevronLeft, ChevronRight, PenTool, Eraser,
  Circle, Ruler, Sliders, Layers, Maximize2, Minimize2, Edit2, Target, Spline, Minus, MousePointer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { callGroqAIChatClient } from '../services/clientServices';

export interface SingleBoard {
  id: string;
  name: string;
  items: BoardItem[];
  drawnLines: { id: string; points: { x: number; y: number }[]; color: string; width: number }[];
}

const generateLinePoints = (x0: number, y0: number, x1: number, y1: number) => {
  return [
    { x: x0, y: y0, command: 'M' as const },
    { x: x1, y: y1, command: 'L' as const }
  ];
};

const generateCirclePoints = (x0: number, y0: number, x1: number, y1: number) => {
  const points: { x: number; y: number; command?: 'M' | 'L' }[] = [];
  const radius = Math.hypot(x1 - x0, y1 - y0);
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    points.push({
      x: x0 + radius * Math.cos(angle),
      y: y0 + radius * Math.sin(angle),
      command: i === 0 ? 'M' : 'L'
    });
  }
  return points;
};

const generateHyperbolaPoints = (x0: number, y0: number, x1: number, y1: number) => {
  const points: { x: number; y: number; command?: 'M' | 'L' }[] = [];
  const a = Math.max(Math.abs(x1 - x0), 15);
  const b = Math.max(Math.abs(y1 - y0), 15);
  
  // Left branch (t from -2 to 2)
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = -2 + (4 * i) / steps;
    const px = x0 - a * Math.cosh(t);
    const py = y0 + b * Math.sinh(t);
    if (Math.abs(px - x0) < 600 && Math.abs(py - y0) < 600) {
      points.push({
        x: px,
        y: py,
        command: i === 0 ? 'M' : 'L'
      });
    }
  }
  
  // Right branch (t from -2 to 2)
  let firstRight = true;
  for (let i = 0; i <= steps; i++) {
    const t = -2 + (4 * i) / steps;
    const px = x0 + a * Math.cosh(t);
    const py = y0 + b * Math.sinh(t);
    if (Math.abs(px - x0) < 600 && Math.abs(py - y0) < 600) {
      points.push({
        x: px,
        y: py,
        command: firstRight ? 'M' : 'L'
      });
      firstRight = false;
    }
  }
  return points;
};

export interface BoardItem {
  id: string;
  type: 'text' | 'exercise' | 'plan' | 'physics_magnet' | 'physics_pendulum' | 'physics_force' | 'chemistry_beaker' | 'chemistry_tube' | 'chemistry_bunsen' | 'chemistry_molecule' | 'free_text' | 'shape_line' | 'shape_circle' | 'rule_angle' | 'rule_measure';
  title: string;
  x: number; // in pixels, relative to workspace
  y: number; // in pixels, relative to workspace
  subtitle?: string;
  content?: string;
  iconName?: string;
  payload: any; // dynamic parameters: e.g. fluidLevel, gravity, forceAngle, temp, moleculeType, or color details
  isPinned?: boolean; // pin/anchor status
}

export const MathExpression: React.FC<{ text: string; block?: boolean }> = ({ text, block = false }) => {
  const parseToJsx = (str: string): React.ReactNode => {
    if (!str) return '';

    // 1. Solve fractions: \frac{num}{den}
    const fracRegex = /\\frac\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}/;
    const fracMatch = str.match(fracRegex);
    if (fracMatch) {
      const before = str.substring(0, fracMatch.index);
      const num = fracMatch[1];
      const den = fracMatch[2];
      const after = str.substring((fracMatch.index || 0) + fracMatch[0].length);
      return (
        <>
          {parseToJsx(before)}
          <span className="inline-flex flex-col items-center align-middle mx-1.5 leading-none text-center">
            <span className="border-b border-current pb-0.5 px-0.5 text-[0.95em]">{parseToJsx(num)}</span>
            <span className="pt-0.5 px-0.5 text-[0.95em]">{parseToJsx(den)}</span>
          </span>
          {parseToJsx(after)}
        </>
      );
    }

    // 2. Solve square roots: \sqrt{inner}
    const sqrtRegex = /\\sqrt\{((?:[^{}]|\{[^{}]*\})*)\}/;
    const sqrtMatch = str.match(sqrtRegex);
    if (sqrtMatch) {
      const before = str.substring(0, sqrtMatch.index);
      const inner = sqrtMatch[1];
      const after = str.substring((sqrtMatch.index || 0) + sqrtMatch[0].length);
      return (
        <>
          {parseToJsx(before)}
          <span className="inline-flex items-center align-middle mx-1 font-serif">
            <span className="text-base leading-none select-none font-sans font-extrabold text-indigo-500">√</span>
            <span className="border-t border-indigo-400 dark:border-indigo-600 pt-0.5 px-1 text-[0.9em] bg-indigo-500/[0.03]">
              {parseToJsx(inner)}
            </span>
          </span>
          {parseToJsx(after)}
        </>
      );
    }

    // 3. Solve bracketed superscripts: ^{sup}
    const supBracketsRegex = /\^\{((?:[^{}]|\{[^{}]*\})*)\}/;
    const supBracketsMatch = str.match(supBracketsRegex);
    if (supBracketsMatch) {
      const before = str.substring(0, supBracketsMatch.index);
      const val = supBracketsMatch[1];
      const after = str.substring((supBracketsMatch.index || 0) + supBracketsMatch[0].length);
      return (
        <>
          {parseToJsx(before)}
          <sup className="text-[0.75em] align-super leading-none">{parseToJsx(val)}</sup>
          {parseToJsx(after)}
        </>
      );
    }

    // 4. Solve simple superscripts: ^x or ^2
    const supSimpleRegex = /\^([a-zA-Z0-9\+\-\=])/;
    const supSimpleMatch = str.match(supSimpleRegex);
    if (supSimpleMatch) {
      const before = str.substring(0, supSimpleMatch.index);
      const val = supSimpleMatch[1];
      const after = str.substring((supSimpleMatch.index || 0) + supSimpleMatch[0].length);
      return (
        <>
          {parseToJsx(before)}
          <sup className="text-[0.75em] align-super leading-none">{val}</sup>
          {parseToJsx(after)}
        </>
      );
    }

    // 5. Solve bracketed subscripts: _{sub}
    const subBracketsRegex = /_\{((?:[^{}]|\{[^{}]*\})*)\}/;
    const subBracketsMatch = str.match(subBracketsRegex);
    if (subBracketsMatch) {
      const before = str.substring(0, subBracketsMatch.index);
      const val = subBracketsMatch[1];
      const after = str.substring((subBracketsMatch.index || 0) + subBracketsMatch[0].length);
      return (
        <>
          {parseToJsx(before)}
          <sub className="text-[0.75em] align-sub leading-none">{parseToJsx(val)}</sub>
          {parseToJsx(after)}
        </>
      );
    }

    // 6. Solve simple subscripts: _x or _2
    const subSimpleRegex = /_([a-zA-Z0-9])/;
    const subSimpleMatch = str.match(subSimpleRegex);
    if (subSimpleMatch) {
      const before = str.substring(0, subSimpleMatch.index);
      const val = subSimpleMatch[1];
      const after = str.substring((subSimpleMatch.index || 0) + subSimpleMatch[0].length);
      return (
        <>
          {parseToJsx(before)}
          <sub className="text-[0.75em] align-sub leading-none">{val}</sub>
          {parseToJsx(after)}
        </>
      );
    }

    let currentPart = str;
    const mathSyms: Record<string, string> = {
      '\\pm': '±', '\\Delta': 'Δ', '\\delta': 'δ', '\\pi': 'π', '\\theta': 'θ',
      '\\int': '∫', '\\lambda': 'λ', '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\omega': 'ω',
      '\\infinity': '∞', '\\infty': '∞', '\\sigma': 'σ', '\\phi': 'φ', '\\mu': 'μ', '\\approx': '≈',
      '\\neq': '≠', '\\le': '≤', '\\ge': '≥', '\\cdot': '·', '\\times': '×', '\\div': '÷',
      '\\rightarrow': '➔', '\\to': '➔'
    };
    Object.entries(mathSyms).forEach(([k, v]) => {
      currentPart = currentPart.replaceAll(k, v);
    });

    const subTokens = currentPart.split(/([a-zA-Z]+|\d+)/g);
    return subTokens.map((tok, tIdx) => {
      if (/^[a-zA-Z]$/.test(tok)) {
        return <span key={tIdx} className="font-serif italic text-emerald-600 dark:text-cyan-400 font-bold px-0.5">{tok}</span>;
      }
      if (/^[a-zA-Z]{2,}$/.test(tok)) {
        const trigList = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lim', 'det'];
        const isTrig = trigList.includes(tok.toLowerCase());
        return <span key={tIdx} className={isTrig ? "font-sans font-medium text-slate-500/80" : "font-sans font-medium"}>{tok}</span>;
      }
      return <span key={tIdx} className="font-mono">{tok}</span>;
    });
  };

  let cleanText = text;
  if (cleanText.startsWith('$$') && cleanText.endsWith('$$')) {
    cleanText = cleanText.slice(2, -2);
  } else if (cleanText.startsWith('$') && cleanText.endsWith('$')) {
    cleanText = cleanText.slice(1, -1);
  }
  cleanText = cleanText.trim();

  return (
    <span className={`${block ? 'block py-2 my-1 text-center bg-zinc-950/20 dark:bg-zinc-950/40 rounded-2xl border border-dashed border-emerald-500/20 p-2 text-sm text-emerald-300 dark:text-cyan-400 font-bold' : 'inline-flex items-center align-middle font-semibold'}`}>
      {parseToJsx(cleanText)}
    </span>
  );
};

const parseMathAndBoldString = (text: string) => {
  const displayMathRegex = /(\$\$.*?\$\$)/g;
  const blocks = text.split(displayMathRegex);
  return blocks.map((blockVal, bIdx) => {
    if (blockVal.startsWith('$$') && blockVal.endsWith('$$')) {
      return <MathExpression key={bIdx} text={blockVal} block={true} />;
    }
    
    const inlineMathRegex = /(\$.*?\$)/g;
    const inlineParts = blockVal.split(inlineMathRegex);
    return (
      <span key={bIdx}>
        {inlineParts.map((partVal, iIdx) => {
          if (partVal.startsWith('$') && partVal.endsWith('$')) {
            return <MathExpression key={iIdx} text={partVal} block={false} />;
          }

          const boldRegex = /\*\*(.*?)\*\*/g;
          const boldParts = partVal.split(boldRegex);
          return boldParts.map((boldFragment, bfIdx) => {
            if (bfIdx % 2 === 1) {
              return <strong key={bfIdx} className="font-extrabold text-indigo-700 dark:text-indigo-400">{boldFragment}</strong>;
            }
            return boldFragment;
          });
        })}
      </span>
    );
  });
};

const renderFormattedMessageText = (text: string) => {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={idx} className="h-2" />;

    // Detect bullet points
    const isBullet = cleanLine.startsWith('- ') || cleanLine.startsWith('* ');
    if (isBullet) {
      cleanLine = cleanLine.substring(2);
    }

    const content = parseMathAndBoldString(cleanLine);

    if (isBullet) {
      return (
        <li key={idx} className="list-disc ml-3 text-xs text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed">
          {content}
        </li>
      );
    }

    return (
      <p key={idx} className="text-xs text-slate-700 dark:text-zinc-300 mt-1 first:mt-0 leading-relaxed">
        {content}
      </p>
    );
  });
};

export const AIBoardSandbox: React.FC = () => {
  const { theme, students, teachers, balance, news, currentUser } = useApp();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  // --- SECCIONES INTERCONECTADAS STATE ---
  const [activeLabTab, setActiveLabTab] = useState<'pizarra' | 'fisica' | 'quimica'>('pizarra');

  // --- PIZARRA CLASSIC HAND DRAWING AND ERASER ---
  const [drawTool, setDrawTool] = useState<'select' | 'pencil' | 'eraser' | 'pointer' | 'line' | 'circle' | 'hyperbola'>('select');
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [laserPointerPos, setLaserPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [pencilColor, setPencilColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);

  // --- MULTI-BOARD STATE & PERSISTENCE ---
  const [boards, setBoards] = useState<SingleBoard[]>(() => {
    const saved = localStorage.getItem('enlacec_multiboards_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Backward compatibility load
    const legacySaved = localStorage.getItem('edu_ai_board_items_v2');
    let legacyItems: BoardItem[] = [];
    if (legacySaved) {
      try {
        legacyItems = JSON.parse(legacySaved);
      } catch (e) {}
    }
    return [
      {
        id: 'board-1',
        name: 'Pizarra Principal',
        items: legacyItems,
        drawnLines: []
      }
    ];
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    const saved = localStorage.getItem('enlacec_active_board_id_v1');
    return saved || 'board-1';
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state with native browser fullscreen event (e.g. if the user hits ESC to exit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!boardContainerRef.current) return;

    try {
      const doc = document as any;
      const elem = boardContainerRef.current as any;
      const isCurrentlyFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Native fullscreen failed, falling back to CSS overlay mode:", err);
      // Toggle state directly to use the absolute fixed viewport CSS class
      setIsFullscreen(!isFullscreen);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingNameVal, setEditingNameVal] = useState('');

  const [items, setItems] = useState<BoardItem[]>(() => {
    const savedBoards = localStorage.getItem('enlacec_multiboards_v1');
    let loadedBoards = boards;
    if (savedBoards) {
      try {
        loadedBoards = JSON.parse(savedBoards);
      } catch (e) {}
    }
    const savedActiveId = localStorage.getItem('enlacec_active_board_id_v1') || 'board-1';
    const active = loadedBoards.find(b => b.id === savedActiveId) || loadedBoards[0];
    return active.items || [];
  });

  const [drawnLines, setDrawnLines] = useState<{ id: string; points: { x: number; y: number }[]; color: string; width: number }[]>(() => {
    const savedBoards = localStorage.getItem('enlacec_multiboards_v1');
    let loadedBoards = boards;
    if (savedBoards) {
      try {
        loadedBoards = JSON.parse(savedBoards);
      } catch (e) {}
    }
    const savedActiveId = localStorage.getItem('enlacec_active_board_id_v1') || 'board-1';
    const active = loadedBoards.find(b => b.id === savedActiveId) || loadedBoards[0];
    return active.drawnLines || [];
  });

  const [currentLinePoints, setCurrentLinePoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [eraserCursorPos, setEraserCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [chalkCursorPos, setChalkCursorPos] = useState<{ x: number; y: number } | null>(null);

  const handleSwitchBoard = (newBoardId: string) => {
    // 1. Explicitly save current state to activeBoardId
    const updatedBoards = boards.map(b => {
      if (b.id === activeBoardId) {
        return { ...b, items, drawnLines };
      }
      return b;
    });
    setBoards(updatedBoards);
    localStorage.setItem('enlacec_multiboards_v1', JSON.stringify(updatedBoards));

    // 2. Load the target board's values
    const targetBoard = updatedBoards.find(b => b.id === newBoardId);
    if (targetBoard) {
      setItems(targetBoard.items || []);
      setDrawnLines(targetBoard.drawnLines || []);
      setActiveBoardId(newBoardId);
      localStorage.setItem('enlacec_active_board_id_v1', newBoardId);
      showToast(`Cargada: ${targetBoard.name}`);
    }
  };

  const handleCreateBoard = () => {
    const nextNum = boards.length + 1;
    const newBoard: SingleBoard = {
      id: `board-${Date.now()}`,
      name: `Pizarra ${nextNum}`,
      items: [],
      drawnLines: []
    };
    
    const updatedWithCurrent = boards.map(b => {
      if (b.id === activeBoardId) {
        return { ...b, items, drawnLines };
      }
      return b;
    });

    const finalBoards = [...updatedWithCurrent, newBoard];
    setBoards(finalBoards);
    localStorage.setItem('enlacec_multiboards_v1', JSON.stringify(finalBoards));

    setItems([]);
    setDrawnLines([]);
    setActiveBoardId(newBoard.id);
    localStorage.setItem('enlacec_active_board_id_v1', newBoard.id);
    
    showToast(`Pizarra "${newBoard.name}" creada`);
  };

  const handleDeleteBoard = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (boards.length <= 1) {
      showToast("Debes mantener al menos una pizarra.");
      return;
    }

    const remainingBoards = boards.filter(b => b.id !== boardId);
    setBoards(remainingBoards);
    localStorage.setItem('enlacec_multiboards_v1', JSON.stringify(remainingBoards));

    if (activeBoardId === boardId) {
      const nextActive = remainingBoards[0];
      setItems(nextActive.items || []);
      setDrawnLines(nextActive.drawnLines || []);
      setActiveBoardId(nextActive.id);
      localStorage.setItem('enlacec_active_board_id_v1', nextActive.id);
    }
    showToast("Pizarra eliminada");
  };

  const startRenameBoard = (boardId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoardId(boardId);
    setEditingNameVal(currentName);
  };

  const saveRenameBoard = (boardId: string) => {
    if (!editingNameVal.trim()) return;
    const updated = boards.map(b => b.id === boardId ? { ...b, name: editingNameVal.trim() } : b);
    setBoards(updated);
    localStorage.setItem('enlacec_multiboards_v1', JSON.stringify(updated));
    setEditingBoardId(null);
    showToast("Pizarra renombrada");
  };

  // --- FISICA STATE ---
  const [physSelectedSim, setPhysSelectedSim] = useState<'pendulum' | 'vectors'>('pendulum');
  const [physMass, setPhysMass] = useState(5.0); // kg
  const [physLength, setPhysLength] = useState(100); // cm
  const [physGravity, setPhysGravity] = useState(9.8); // m/s²
  const [physAngle, setPhysAngle] = useState(30); // grados de oscilación
  const [physIsRunning, setPhysIsRunning] = useState(true);

  const [physForceN, setPhysForceN] = useState(80); // Newtons
  const [physFrictionCoeff, setPhysFrictionCoeff] = useState(0.20); // coeficiente de roce
  const [physForceBoxX, setPhysForceBoxX] = useState(0); // posición x del bloque
  const [physForceIsRunning, setPhysForceIsRunning] = useState(false);
  const [physForceVelocity, setPhysForceVelocity] = useState(0);

  // --- QUIMICA STATE ---
  const [chemReactantA, setChemReactantA] = useState('HCl');
  const [chemReactantB, setChemReactantB] = useState('NaOH');
  const [chemReactionOutput, setChemReactionOutput] = useState({
    equation: 'HCl + NaOH ➔ NaCl + H₂O',
    details: 'Reacción de neutralización ácido-base clásica. El ácido clorhídrico reacciona con hidróxido de sodio para formar cloruro de sodio (sal común) y agua neutra.',
    safety: 'Seguro (pH Neutro 7.0)',
    safetyColor: 'emerald'
  });

  const [chemSelectedElement, setChemSelectedElement] = useState<any>({
    symbol: 'H',
    name: 'Hidrógeno',
    z: 1,
    mass: 1.008,
    group: 'No metales',
    valency: 1,
    description: 'El elemento químico más ligero y abundante del cosmos. Compone más del 75% de la masa de la materia elemental.'
  });



  // Track the ID of the item currently being dragged to apply highlight styles and handle trash states
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);

  // State elements for trash can feedback
  const [trashScale, setTrashScale] = useState(1);
  const [isTrashEating, setIsTrashEating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isWidgetsPanelOpen, setIsWidgetsPanelOpen] = useState(true);
  const [showBoardWidgets, setShowBoardWidgets] = useState(true);

  // Beautiful Start Page Loading Overlay States
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingText, setLoadingText] = useState('Iniciando laboratorios virtuales...');
  const [loadingProgress, setLoadingProgress] = useState(5);

  // Dedicated Whiteboard AI Assistant States
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>(() => {
    return [
      {
        id: 'msg-init',
        role: 'model',
        text: '¡Hola! Soy **Tesla, el asistente de IA de ENLACEC** 🪐🔬\n\nEstoy conectado directamente a esta pizarra. Puedes pedirme crear experimentos, simulaciones o resolver dudas particulares de Física y Química.\n\nPrueba pidiéndome:\n- _"Coloca un mecherobunsen a 1000 grados y un tubo de ensayo de cloruro de sodio."_\n- _"Crea un simulador de péndulo con gravedad lunar de 1.62 m/s²"_ \n- _"Plantea un ejercicio de fuerzas dinámicas."_\n\n¡Cosas geniales ocurrirán de inmediato en la pizarra!',
        timestamp: new Date()
      }
    ];
  });
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Scroll ref for chat messages log
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Start Load sequence
  useEffect(() => {
    const steps = [
      { text: 'Conectando servomotores virtuales...', progress: 20 },
      { text: 'Sincronizando modelos de gravedad Newtoniana...', progress: 45 },
      { text: 'Calibrando matraces de Erlenmeyer y ph-metros...', progress: 72 },
      { text: 'Iniciando Tutor Científico de IA...', progress: 95 },
      { text: '¡Laboratorio listo para experimentar!', progress: 100 }
    ];
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingText(steps[currentStep].text);
        setLoadingProgress(steps[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setLoadingBoard(false);
        }, 350);
      }
    }, 320);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of chat automatically on content changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isAssistantLoading]);

  // Handler for sending messages to the dedicated assistant
  const handleSendAssistantMessage = async () => {
    if (!assistantInput.trim() || isAssistantLoading) return;
    
    const userMsgText = assistantInput;
    setAssistantInput('');
    
    const userMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: userMsgText,
      timestamp: new Date()
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setIsAssistantLoading(true);

    try {
      // Map history to simple text structure for stateless back-end compatibility
      const backendHistory = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        text: m.text
      }));

      const sysContext = {
        students,
        teachers,
        balance,
        news,
        currentUser
      };

      // Injected directive so Groq is compelled to output ADD_TO_BOARD actions on science creations
      const customBoardContext = 
        `ALERTA DE SEGURIDAD/ROL DE LA PIZARRA CIENTÍFICA:\n` +
        `¡TIENES PODER ABSOLUTO PARA CREAR, AGREGAR O SIMULAR DE INMEDIATO LO QUE PIDA EL USUARIO EN EL PIZARRÓN! No te limites a simples explicaciones en texto ni respondas con evasivas.\n\n` +
        `Es fundamental que elijas el 'elementType' que MEJOR represente la solicitud del usuario, y adaptes el contenido escribiendo datos reales, ecuaciones o fórmulas detalladas dentro de él. NO crees simples tarjetas de anotación genéricas si el usuario te pidió algo práctico o un simulador concreto.\n\n` +
        `GUÍA DE ELECCIÓN DE ELEMENTOS (Elige sabiamente según lo solicitado):\n` +
        `1. 'free_text' (Texto Libre): Úsalo si el usuario quiere que escribas fórmulas, leyes físicas, apuntes directos, conclusiones o títulos en el pizarrón de forma directa de puño y letra sin bordes de tarjeta ni fondos. Es escritura manuscrita libre. El 'description'/content debe tener la lección, ecuación o dibujo textual en fuente manuscrita. Su payload debe llevar { "color": "#6366f1" | "#10b981" | "#ec4899" | "#0ea5e9" | "#f59e0b" | "currentColor" }.\n` +
        `2. 'chemistry_beaker' (Vaso de Precipitados): Úsalo si piden mezclar, diluir, medir pH o líquidos. Inicializa el payload con valores precisos:\n` +
        `   * pH real (0-14, ej: HCl es acido de pH 1.5, NaOH es alcalino pH 13, agua neutra es pH 7)\n` +
        `   * fluidColor en formato Hexadecimal (ácido=rojo #f43f5e o amarillo #eab308, base/alcali=azul/violeta #8b5cf6, agua=celeste #3b82f6 o verde #10b981)\n` +
        `   * fluidLevel (0-100% de llenado)\n` +
        `   * compoundName (ej: 'HCl (Cloruro de Hidrógeno)', 'NaOH', 'Solución buffer')\n` +
        `3. 'chemistry_tube' (Tubo de Ensayo): Úsalo para reacciones rápidas, muestras de laboratorio o calentamiento. Igual que el vaso, configura:\n` +
        `   * { fluidLevel (0-100), fluidColor (hex), compoundName (string), phValue (0-14) }\n` +
        `4. 'chemistry_bunsen' (Mechero de Bunsen): Úsalo si piden fuego, calentar elementos o reacciones térmicas. Configura:\n` +
        `   * { gasFlow: 0-100, airSetting: 0-100, temp: 25 a 1000 grados Celsius, isBurning: true/false }\n` +
        `5. 'chemistry_molecule' (Estructura Molecular): Úsalo si piden visualizar moléculas 3D de elementos químicos. Parámetros:\n` +
        `   * type: 'H2O' | 'CO2' | 'NH3' | 'CH4' | 'O2'\n` +
        `   * name: 'Agua', 'Dióxido de Carbono', 'Amoníaco', 'Metano', 'Oxígeno molecular'\n` +
        `   * formula: 'H₂O', 'CO₂', 'NH₃', 'CH₄', 'O₂'\n` +
        `6. 'physics_pendulum' (Péndulo): Úsalo si piden gravedad lunar, oscilaciones, experimentos de periodos, MAS o gravedad en planetas. Configura:\n` +
        `   * length (50-180 de longitud de la cuerda)\n` +
        `   * gravity (ej: Tierra 9.8, Luna 1.62, Marte 3.7, Júpiter 24.8)\n` +
        `   * angle (10 a 60 grados de desviación inicial)\n` +
        `   * isRunning: true/false\n` +
        `7. 'physics_magnet' (Campo Magnético / Imán): Úsalo si piden electromagnetismo, magnetismo de barra o polos magnéticos. Configura:\n` +
        `   * { strength: 1-100 de fuerza magnética, showLines: true/false para ver flujo }\n` +
        `8. 'physics_force' (Vectores de Fuerza / Planos Inclinados): Úsalo para dinámicas, descomposición de fuerzas, empuje o poleas. Configura:\n` +
        `   * { forceA: number en Newtons, forceB: number en Newtons, angle: ángulo 0-360 del vector resultante }\n` +
        `9. 'exercise' (Problemas / Desafíos Interactivos): Úsalo para redactar retos prácticos de ciencias o exámenes breves con su enunciado, preguntas de opción múltiple u orientación en ciencias. Escribe siempre el enunciado completo en 'description'.\n` +
        `10. 'plan' (Guías de Clases / Hoja de Laboratorio): Úsalo para secuencias instruccionales didácticas, experimentos descritos paso a paso o marcos teóricos.\n` +
        `11. 'text' (Tarjeta de Anotación Estándar): Para explicaciones conceptuales breves, resúmenes históricos o notas estructuradas.\n\n` +
        `EJEMPLO DE ESCRITO LIBRE (free_text): Si el usuario te pide: "Escribe la ecuación de la fotosíntesis con marcador verde", debes responder con:\n` +
        `- elementType: "free_text"\n` +
        `- label: "Fórmula de la Fotosíntesis"\n` +
        `- description: "6CO₂ + 6H₂O + Luz ➔ C₆H₁₂O₆ + 6O₂\\n\\n¡La luz solar excita la clorofila!"\n` +
        `- payload: { "color": "#10b981" }\n\n` +
        `EJEMPLO DE EXPERIMENTO DE FÍSICA: Si te pide "Pon un péndulo oscilando en Júpiter", debes responder con:\n` +
        `- elementType: "physics_pendulum"\n` +
        `- label: "MAS en Júpiter"\n` +
        `- description: "Demostración de oscilación armónica simple bajo una fuerza de gravedad extrema de 24.8 m/s²."\n` +
        `- payload: { "length": 120, "gravity": 24.8, "angle": 45, "isRunning": true }\n\n` +
        `Nunca limites tu respuesta de acción a un rol pasivo de texto. ¡Sé interactivo, crea y escribe precisamente los contenidos según las peticiones!`;

      const data = await callGroqAIChatClient(
        `${userMsgText} [Directiva: ${customBoardContext}]`,
        backendHistory,
        sysContext
      );

      const botMessage: any = {
        id: `msg-bot-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date(),
        action: data.action || undefined,
        actionStatus: data.action ? "pending" : undefined
      };

      // Check if we can automatically deploy the created block right on the canvas!
      if (data.action && data.action.type === "ADD_TO_BOARD") {
        const actionPayload = data.action.payload;
        if (actionPayload) {
          const safetyOffset = Math.random() * 80;
          
          // Highly robust field extractions for varied LLM generations
          const elementRawType = actionPayload.elementType || 
                                 actionPayload.type || 
                                 actionPayload.payload?.elementType || 
                                 actionPayload.payload?.type || 
                                 'text';
                                 
          const elementTitle = actionPayload.label || 
                               actionPayload.title || 
                               actionPayload.name || 
                               actionPayload.payload?.label || 
                               actionPayload.payload?.title || 
                               actionPayload.payload?.name || 
                               data.action.title || 
                               'Módulo Generado';
                               
          const elementSubtitle = actionPayload.subtitle || 
                                  actionPayload.payload?.subtitle || 
                                  'Creado por EnlaceC IA';

          const actionObj = data.action as any;
          const elementContent = actionPayload.description || 
                                 actionPayload.content || 
                                 actionPayload.text || 
                                 actionPayload.body ||
                                 actionPayload.payload?.description || 
                                 actionPayload.payload?.content || 
                                 actionPayload.payload?.text || 
                                 actionPayload.payload?.body ||
                                 actionObj?.description ||
                                 actionObj?.content ||
                                 actionObj?.text ||
                                 '';

          const newItem: BoardItem = {
            id: `item-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: elementRawType as any,
            title: elementTitle,
            subtitle: elementSubtitle,
            content: elementContent,
            x: 120 + safetyOffset,
            y: 90 + safetyOffset,
            payload: elementRawType === 'free_text'
              ? { color: actionPayload.payload?.color || actionPayload.color || '#6366f1', fontSize: 18, ...(actionPayload.payload || {}) }
              : (actionPayload.payload || actionPayload || {}),
            isPinned: false
          };
          
          setItems(prev => [...prev, newItem]);
          botMessage.text += `\n\n✨ _**[Asistente]** He colocado el módulo **"${newItem.title}"** directamente en la pizarra para ti._`;
        }
      }

      setChatMessages(prev => [...prev, botMessage]);

    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        id: `msg-error-${Date.now()}`,
        role: "model",
        text: `⚠️ **Error de conexión:** No se pudo procesar tu instrucción. ${err.message || ''}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  // Synchronize changes of the active board to the main boards state
  useEffect(() => {
    setBoards(prev => {
      const updated = prev.map(b => {
        if (b.id === activeBoardId) {
          return { ...b, items, drawnLines };
        }
        return b;
      });
      localStorage.setItem('enlacec_multiboards_v1', JSON.stringify(updated));
      return updated;
    });
  }, [items, drawnLines]);

  // Listen to remote events from chatbot widget ("add-to-ai-board")
  useEffect(() => {
    const handleAddFromAI = (event: CustomEvent) => {
      const data = event.detail;
      if (!data) return;

      // Safe coordinate positioning to make sure they do not stack directly
      const safetyOffset = Math.random() * 120;
      const newItem: BoardItem = {
        id: `item-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: data.elementType || 'text',
        title: data.label || data.title || 'Elemento de IA',
        subtitle: data.category || data.subtitle || 'Asistente de EnlaceC',
        content: data.description || data.content || '',
        x: 100 + safetyOffset,
        y: 80 + safetyOffset,
        payload: data.payload || data.details || {},
        isPinned: false
      };

      setItems((prev) => [...prev, newItem]);
    };

    window.addEventListener('add-to-ai-board', handleAddFromAI as EventListener);
    return () => {
      window.removeEventListener('add-to-ai-board', handleAddFromAI as EventListener);
    };
  }, []);

  const clearCanvas = () => {
    if (window.confirm('¿Seguro que deseas vaciar toda la pizarra?')) {
      setItems([]);
    }
  };

  // 100% smooth Pointer-based dragging mechanism utilizing pixel deltas to avoid any jumping, compounding transforms, or lag.
  const startDrag = (e: React.PointerEvent<HTMLDivElement>, item: BoardItem) => {
    // If anchored/pinned, do not allow drag
    if (item.isPinned) return;

    // Only drag with main mouse click (left click/touch point)
    if (e.button !== 0) return;

    // Filter out interactive actions so elements still respond to clicks/toggles
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'BUTTON' || 
      target.tagName === 'SELECT' || 
      target.tagName === 'OPTION' ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('input')
    ) {
      return;
    }

    e.preventDefault();
    
    const cardId = item.id;
    const startX = item.x;
    const startY = item.y;
    const startPageX = e.pageX;
    const startPageY = e.pageY;

    setActiveDraggingId(cardId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.pageX - startPageX;
      const deltaY = moveEvent.pageY - startPageY;

      let nextX = startX + deltaX;
      let nextY = startY + deltaY;

      const currentWorkspace = workspaceRef.current;
      if (currentWorkspace) {
        const rect = currentWorkspace.getBoundingClientRect();
        
        // Solid boundary constraints
        if (nextX < 10) nextX = 10;
        if (nextY < 10) nextY = 10;
        if (nextX > rect.width - 256) nextX = rect.width - 256; // 256px card width
        if (nextY > rect.height - 200) nextY = rect.height - 200;
      }

      setItems((prev) => prev.map((img) => {
        if (img.id === cardId) {
          return { ...img, x: nextX, y: nextY };
        }
        return img;
      }));

      // Garbage bin hover check using viewport client position
      const hoverElement = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const isOverTrash = hoverElement?.closest('#trash-bin');
      if (isOverTrash) {
        setTrashScale(1.3);
      } else {
        setTrashScale(1.0);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      setActiveDraggingId(null);
      setTrashScale(1.0);

      // Final garbage check
      const dropElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const droppedInTrash = dropElement?.closest('#trash-bin');

      if (droppedInTrash) {
        setIsTrashEating(true);
        setTimeout(() => setIsTrashEating(false), 800);
        setItems((prev) => prev.filter((i) => i.id !== cardId));
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const togglePinItem = (id: string) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          isPinned: !item.isPinned
        };
      }
      return item;
    }));
  };

  // Preset additions
  const addPreset = (type: BoardItem['type']) => {
    const safetyOffset = Math.random() * 100;
    let newItem: BoardItem;

    switch (type) {
      case 'text':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'text',
          title: 'Anotación Libre',
          subtitle: 'Docente',
          x: 100 + safetyOffset,
          y: 80 + safetyOffset,
          content: 'Escribe aquí dudas, fórmulas o notas para la siguiente clase.',
          payload: {}
        };
        break;
      case 'physics_magnet':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'physics_magnet',
          title: 'Imán de Barra',
          subtitle: 'Campo Magnético',
          x: 120 + safetyOffset,
          y: 120 + safetyOffset,
          payload: {
            fieldLines: true,
            polarization: 'NS',
            strength: 'Alta'
          }
        };
        break;
      case 'physics_pendulum':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'physics_pendulum',
          title: 'Simulador de Péndulo',
          subtitle: 'Movimiento Armónico Simple (MAS)',
          x: 140 + safetyOffset,
          y: 140 + safetyOffset,
          payload: {
            length: 120,
            gravity: 9.8,
            angle: 30,
            isRunning: true
          }
        };
        break;
      case 'physics_force':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'physics_force',
          title: 'Vectores de Fuerza',
          subtitle: 'Dinámica de Newton',
          x: 160 + safetyOffset,
          y: 160 + safetyOffset,
          payload: {
            forceN: 50,
            angleDeg: 45,
            massKg: 5
          }
        };
        break;
      case 'chemistry_beaker':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'chemistry_beaker',
          title: 'Vaso de Precipitado',
          subtitle: 'Reactores',
          x: 180 + safetyOffset,
          y: 180 + safetyOffset,
          payload: {
            fluidLevel: 50,
            fluidColor: '#10b981', // emerald green
            compoundName: 'H₂O + Clorófila',
            phValue: 7.0
          }
        };
        break;
      case 'chemistry_tube':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'chemistry_tube',
          title: 'Tubo de Ensayo',
          subtitle: 'Análisis colorimétrico',
          x: 200 + safetyOffset,
          y: 200 + safetyOffset,
          payload: {
            isBoiling: false,
            color: '#ec4899', // rose pink
            agent: 'Ácido Clorhídrico'
          }
        };
        break;
      case 'chemistry_bunsen':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'chemistry_bunsen',
          title: 'Mechero Bunsen',
          subtitle: 'Quemador de Gas',
          x: 220 + safetyOffset,
          y: 220 + safetyOffset,
          payload: {
            gasFlow: 50,
            airSetting: 30,
            temp: 450
          }
        };
        break;
      case 'chemistry_molecule':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'chemistry_molecule',
          title: 'Molécula Química',
          subtitle: 'Estructura Covalente',
          x: 150 + safetyOffset,
          y: 150 + safetyOffset,
          payload: {
            moleculeName: 'H₂O',
            geometry: 'Angular'
          }
        };
        break;
      case 'free_text':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'free_text',
          title: 'Escritura Libre',
          subtitle: 'Anotación sin Bordes',
          x: 100 + safetyOffset,
          y: 80 + safetyOffset,
          content: 'Escribe libremente aquí tu duda, ecuación o nota...',
          payload: {
            color: '#6366f1',
            fontSize: 18
          }
        };
        break;
      case 'shape_line':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'shape_line',
          title: 'Línea Geométrica',
          subtitle: 'Herramientas de Pizarra',
          x: 150 + safetyOffset,
          y: 150 + safetyOffset,
          payload: { length: 150, angle: 0, color: '#10b981', thickness: 4 }
        };
        break;
      case 'shape_circle':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'shape_circle',
          title: 'Círculo de Precisión',
          subtitle: 'Herramientas de Pizarra',
          x: 150 + safetyOffset,
          y: 150 + safetyOffset,
          payload: { radius: 45, color: '#ec4899', filled: false, thickness: 3 }
        };
        break;
      case 'rule_angle':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'rule_angle',
          title: 'Regla de Ángulos',
          subtitle: 'Instrumental',
          x: 180 + safetyOffset,
          y: 180 + safetyOffset,
          payload: { angle: 45 }
        };
        break;
      case 'rule_measure':
        newItem = {
          id: `item-user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          type: 'rule_measure',
          title: 'Regla de Escala',
          subtitle: 'Instrumental',
          x: 200 + safetyOffset,
          y: 200 + safetyOffset,
          payload: { angle: 0 }
        };
        break;
      default:
        return;
    }

    setItems((prev) => [...prev, newItem]);
  };

  // Helper inside card to update its parameters reactively
  const updateItemPayload = (id: string, updatedParams: any) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          payload: {
            ...item.payload,
            ...updatedParams
          }
        };
      }
      return item;
    }));
  };

  // Helper inside card to update raw texts (for text elements or titles)
  const updateItemText = (id: string, field: 'title' | 'subtitle' | 'content', nextVal: string) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: nextVal
        };
      }
      return item;
    }));
  };

  // Force close/delete action directly by button
  const deleteItemDirect = (id: string) => {
    setIsTrashEating(true);
    setTimeout(() => setIsTrashEating(false), 800);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // --- ANIMATION LOOP FOR FRICTION FORCE BLOCK SLIDERS ---
  useEffect(() => {
    if (!physForceIsRunning) return;
    const interval = setInterval(() => {
      // Net force = Applied Force - Friction force
      // Friction force = Coeff * mass * gravity (9.8)
      const frictionForce = physFrictionCoeff * physMass * 9.8;
      const netForce = physForceN - frictionForce;
      
      let acceleration = netForce / physMass;
      if (physForceN <= frictionForce) {
        acceleration = 0; // cannot overcome static coefficient
      }
      
      setPhysForceVelocity((prevVel) => {
        let nextVel = prevVel + acceleration * 0.05;
        // Friction dampening when not applying enough force
        if (physForceN <= frictionForce && nextVel > 0) {
          nextVel = Math.max(0, nextVel - (frictionForce / physMass) * 0.05);
        }
        
        setPhysForceBoxX((prevX) => {
          let nextX = prevX + nextVel * 3;
          if (nextX > 250) {
            nextX = 0; // loop back
            setPhysForceVelocity(0);
          }
          return nextX;
        });
        
        return nextVel;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [physForceIsRunning, physForceN, physFrictionCoeff, physMass]);

  // --- DUAL DRAW DRAWING AND MOTION EVENTS ---
  const handleWhiteboardPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drawTool === 'select') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawTool === 'pointer') {
      setLaserPointerPos({ x, y });
      return;
    }

    setIsDrawing(true);
    setShapeStart({ x, y });
    
    if (drawTool === 'eraser') {
      setEraserCursorPos({ x, y });
      eraseLinesAtPoint(x, y);
    } else if (drawTool === 'pencil') {
      setCurrentLinePoints([{ x, y }]);
      setChalkCursorPos({ x, y });
    } else if (drawTool === 'line') {
      setCurrentLinePoints(generateLinePoints(x, y, x, y));
      setChalkCursorPos({ x, y });
    } else if (drawTool === 'circle') {
      setCurrentLinePoints(generateCirclePoints(x, y, x, y));
      setChalkCursorPos({ x, y });
    } else if (drawTool === 'hyperbola') {
      setCurrentLinePoints(generateHyperbolaPoints(x, y, x, y));
      setChalkCursorPos({ x, y });
    }
  };

  const handleWhiteboardPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawTool === 'pointer') {
      setLaserPointerPos({ x, y });
      setEraserCursorPos(null);
      setChalkCursorPos(null);
      return;
    } else {
      setLaserPointerPos(null);
    }

    if (drawTool === 'eraser') {
      setEraserCursorPos({ x, y });
    } else {
      setEraserCursorPos(null);
    }

    if (drawTool === 'pencil' || drawTool === 'line' || drawTool === 'circle' || drawTool === 'hyperbola') {
      setChalkCursorPos({ x, y });
    } else {
      setChalkCursorPos(null);
    }

    if (!isDrawing) return;

    if (drawTool === 'pencil') {
      setCurrentLinePoints((prev) => [...prev, { x, y }]);
    } else if (drawTool === 'eraser') {
      eraseLinesAtPoint(x, y);
    } else if (drawTool === 'line' && shapeStart) {
      setCurrentLinePoints(generateLinePoints(shapeStart.x, shapeStart.y, x, y));
    } else if (drawTool === 'circle' && shapeStart) {
      setCurrentLinePoints(generateCirclePoints(shapeStart.x, shapeStart.y, x, y));
    } else if (drawTool === 'hyperbola' && shapeStart) {
      setCurrentLinePoints(generateHyperbolaPoints(shapeStart.x, shapeStart.y, x, y));
    }
  };

  const handleWhiteboardPointerUp = () => {
    if (isDrawing && currentLinePoints.length > 1) {
      setDrawnLines((prev) => [
        ...prev,
        {
          id: `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          points: currentLinePoints,
          color: pencilColor,
          width: brushSize
        }
      ]);
    }
    setCurrentLinePoints([]);
    setIsDrawing(false);
    setShapeStart(null);
  };

  const handleWhiteboardPointerLeave = () => {
    handleWhiteboardPointerUp();
    setEraserCursorPos(null);
    setChalkCursorPos(null);
    setLaserPointerPos(null);
  };

  const eraseLinesAtPoint = (x: number, y: number) => {
    setDrawnLines((prev) =>
      prev.filter((line) => {
        const hasAdjacentPoint = line.points.some((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          return dx * dx + dy * dy < 25 * 25; // 25px brush radius duster
        });
        return !hasAdjacentPoint;
      })
    );
  };

  const clearChalkboardDrawings = () => {
    setDrawnLines([]);
    setCurrentLinePoints([]);
  };

  // --- CHEMISTRY COMBINATION CALCULATOR ---
  const runChemistryReaction = (reactantA: string, reactantB: string) => {
    let equation = '';
    let details = '';
    let safety = '';
    let safetyColor = '';
    
    if (reactantA === 'HCl' && reactantB === 'NaOH') {
      equation = 'HCl + NaOH ➔ NaCl + H₂O';
      details = 'Neutralización Clásica Ácido-Base. El pH converge a un nivel neutro de 7.0 de manera estable. Se forma agua y cloruro de sodio disuelto (sal común).';
      safety = 'Estable / Reacción Segura';
      safetyColor = 'emerald';
    } else if (reactantA === 'HCl' && reactantB === 'NaHCO3') {
      equation = 'HCl + NaHCO₃ ➔ NaCl + H₂O + CO₂ ↑';
      details = 'Reacción de descomposición con fuerte liberación de gas dióxido de carbono. Se observa una efervescencia burbujeante de inmediato.';
      safety = 'Liberación rápida de Gas CO₂';
      safetyColor = 'amber';
    } else if (reactantA === 'NaHCO3' && reactantB === 'CH3COOH') {
      equation = 'NaHCO₃ + CH₃COOH ➔ CH₃COONa + H₂O + CO₂ ↑';
      details = 'Bicarbonato con ácido acético (vinagre). Clásico experimento de volcán químico casero, produciendo acetato de sodio y espuma efervescente.';
      safety = 'Espumante / Reacción Inocua';
      safetyColor = 'emerald';
    } else if (reactantA === 'H2' && reactantB === 'O2') {
      equation = '2H₂ + O₂ ➔ 2H₂O';
      details = 'Combustión térmica del hidrógeno. Al aplicar una pequeña chispa, el hidrógeno reacciona violentamente con el oxígeno liberando energía y vapor de agua pura.';
      safety = 'Alto Riesgo de Detonación Exotérmica';
      safetyColor = 'rose';
    } else {
      equation = `${reactantA} + ${reactantB} ➔ Disolución acuosa / Suspensión`;
      details = 'Sin reacción covalente específica registrada. Probable mezcla homogénea física o dilución molecular simple sin desprendimiento de energía.';
      safety = 'Estable / Neutro';
      safetyColor = 'teal';
    }
    
    setChemReactionOutput({ equation, details, safety, safetyColor });
  };

  // --- CONEXIÓN DE PIZARRA EXPORT CARDS ---
  const exportElementToBoard = (el: any) => {
    const newItem: BoardItem = {
      id: `item-element-${Date.now()}`,
      type: 'text',
      title: `Elemento: ${el.name} (${el.symbol})`,
      subtitle: `Química • Grupo: ${el.group}`,
      x: 100 + Math.random() * 80,
      y: 100 + Math.random() * 80,
      content: `Ficha Técnica Química:\n• Símbolo: ${el.symbol}\n• Número Atómico Z: ${el.z}\n• Masa Atómica: ${el.mass} u\n• Grupo de Tabla: ${el.group}\n• Valencia principal: ${el.valency}\n\nDescripción del Elemento:\n${el.description}`,
      payload: {}
    };
    setItems((prev) => [...prev, newItem]);
  };

  const exportPhysicsToBoard = (simType: 'pendulum' | 'vector') => {
    let title = '';
    let subtitle = '';
    let content = '';
    
    if (simType === 'pendulum') {
      const period = (Math.PI * 2 * Math.sqrt((physLength / 100) / physGravity)).toFixed(2);
      title = 'Ficha Péndulo: Ley del MAS';
      subtitle = 'Física Teórica • Oscilación';
      content = `Análisis de la oscilación armónica simple:\n• Longitud de la cuerda (L): ${physLength} cm\n• Gravedad seleccionada (g): ${physGravity} m/s²\n• Ángulo inicial (θ): ${physAngle}°\n\nFórmula Comprobada:\n  T = 2π * √(L / g)\n• Periodo Experimental (T): ${period} segundos.`;
    } else {
      const friction = physFrictionCoeff * physMass * 9.8;
      const netForce = physForceN - friction;
      const acc = netForce > 0 ? (netForce / physMass).toFixed(2) : '0.00';
      title = 'Ficha Dinámica: Leyes de Newton';
      subtitle = 'Física Teórica • Dinámica';
      content = `Análisis de fuerzas de rozamiento y empuje:\n• Masa del bloque (m): ${physMass} kg\n• Fuerza aplicada (F): ${physForceN} N\n• Coeficiente de roce (μ): ${physFrictionCoeff}\n• Fuerza de Fricción F_fr (μ * m * g): ${friction.toFixed(1)} N\n\nFórmula Comprobada:\n  F_neta = F - F_fr = m * a\n• Aceleración resultante (a): ${acc} m/s².`;
    }
    
    const newItem: BoardItem = {
      id: `item-phys-${Date.now()}`,
      type: 'text',
      title,
      subtitle,
      x: 120 + Math.random() * 80,
      y: 120 + Math.random() * 80,
      content,
      payload: {}
    };
    setItems((prev) => [...prev, newItem]);
  };

  const exportReactionToBoard = () => {
    const newItem: BoardItem = {
      id: `item-react-${Date.now()}`,
      type: 'text',
      title: `Reacción: ${chemReactionOutput.equation}`,
      subtitle: 'Química Teórica • Reacción',
      x: 140 + Math.random() * 80,
      y: 140 + Math.random() * 80,
      content: `Estudio termoquímico de la combinación química:\n• Ecuación balanceada: ${chemReactionOutput.equation}\n• Estado de seguridad: ${chemReactionOutput.safety}\n\nExplicación fenomenológica de la reacción:\n${chemReactionOutput.details}`,
      payload: {}
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Drag and drop helper to place tool presets at precise coordinates
  const addPresetAtCoords = (type: BoardItem['type'], x: number, y: number) => {
    let newItem: BoardItem;
    const cleanX = Math.max(20, Math.min(x, 1200));
    const cleanY = Math.max(20, Math.min(y, 800));

    switch (type) {
      case 'text':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'text',
          title: 'Anotación Escrita',
          subtitle: 'Docente',
          x: cleanX,
          y: cleanY,
          content: 'Escribe aquí apuntes, fórmulas o notas para los estudiantes...',
          payload: {}
        };
        break;
      case 'physics_pendulum':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'physics_pendulum',
          title: 'Simulador de Péndulo',
          subtitle: 'Física Clásica',
          x: cleanX,
          y: cleanY,
          payload: { length: 110, gravity: 9.8, angle: 35, isRunning: true }
        };
        break;
      case 'physics_force':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'physics_force',
          title: 'Vectores de Fuerza',
          subtitle: 'Física Newtoniana',
          x: cleanX,
          y: cleanY,
          payload: { forceN: 70, angleDeg: 30, massKg: 6 }
        };
        break;
      case 'chemistry_beaker':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'chemistry_beaker',
          title: 'Vaso de Precipitado',
          subtitle: 'Reactores Químicos',
          x: cleanX,
          y: cleanY,
          payload: { fluidLevel: 55, fluidColor: '#3b82f6', compoundName: 'H₂O cristalina', phValue: 7.0 }
        };
        break;
      case 'chemistry_tube':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'chemistry_tube',
          title: 'Tubo de Ensayo',
          subtitle: 'Reactivo Color',
          x: cleanX,
          y: cleanY,
          payload: { isBoiling: false, color: '#ec4899', agent: 'Reactivo EnlaceC' }
        };
        break;
      case 'chemistry_bunsen':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'chemistry_bunsen',
          title: 'Mechero Bunsen',
          subtitle: 'Combustible',
          x: cleanX,
          y: cleanY,
          payload: { gasFlow: 60, airSetting: 40, temp: 480 }
        };
        break;
      case 'chemistry_molecule':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'chemistry_molecule',
          title: 'Molécula de Agua',
          subtitle: 'Visualizador 3D',
          x: cleanX,
          y: cleanY,
          payload: { moleculeName: 'H₂O', geometry: 'Angular' }
        };
        break;
      case 'free_text':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'free_text',
          title: 'Escritura Libre',
          subtitle: 'Fórmula',
          x: cleanX,
          y: cleanY,
          content: 'Muestras de texto y ecuaciones de pizarra...',
          payload: { color: '#ec4899' }
        };
        break;
      case 'shape_line':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'shape_line',
          title: 'Línea Geométrica',
          subtitle: 'Herramientas de Pizarra',
          x: cleanX,
          y: cleanY,
          payload: { length: 150, angle: 0, color: '#10b981', thickness: 4 }
        };
        break;
      case 'shape_circle':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'shape_circle',
          title: 'Círculo de Precisión',
          subtitle: 'Herramientas de Pizarra',
          x: cleanX,
          y: cleanY,
          payload: { radius: 45, color: '#ec4899', filled: false, thickness: 3 }
        };
        break;
      case 'rule_angle':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'rule_angle',
          title: 'Regla de Ángulos',
          subtitle: 'Instrumental',
          x: cleanX,
          y: cleanY,
          payload: { angle: 45 }
        };
        break;
      case 'rule_measure':
        newItem = {
          id: `item-drag-${Date.now()}`,
          type: 'rule_measure',
          title: 'Regla de Escala',
          subtitle: 'Instrumental',
          x: cleanX,
          y: cleanY,
          payload: { angle: 0 }
        };
        break;
      default:
        return;
    }
    setItems((prev) => [...prev, newItem]);
  };

  return (
    <div className="flex flex-col h-full flex-1 w-full text-slate-800 dark:text-zinc-200 select-none relative min-h-0">
      
      {/* Immersive calibration loader */}
      <AnimatePresence>
        {loadingBoard && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-slate-900/95 dark:bg-zinc-950/98 backdrop-blur-xl z-[999] flex flex-col items-center justify-center p-6 text-zinc-100 rounded-3xl select-none"
          >
            <div className="max-w-md w-full text-center space-y-6 relative">
              
              {/* Decorative background glow circles */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>

              {/* Orbital atoms loading animation */}
              <div className="relative flex justify-center py-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full flex items-center justify-center relative"
                >
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-10 h-10 border-2 border-indigo-400/20 border-b-cyan-400 rounded-full absolute"
                  ></motion.div>
                  <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Laboratorio Científico EnlaceC</span>
                <h3 className="text-xl font-extrabold tracking-tight text-white">Preparando Entorno e IA Científica</h3>
                <p className="text-xs text-zinc-400 px-8 leading-relaxed">
                  Calibrando matrices de gravedad Newtoniana, balanceando reactores químicos y sintonizando tutor inteligente...
                </p>
              </div>

              {/* Loader Steps and Loading Percentage */}
              <div className="space-y-2.5 pt-4">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.1 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                  ></motion.div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold px-1">
                  <motion.span 
                    key={loadingText}
                    initial={{ opacity: 0, y: 7 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-indigo-300"
                  >
                    {loadingText}
                  </motion.span>
                  <span>{loadingProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visual Instruction Banner & Sandbox Controls Header */}
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md p-4 rounded-3xl border border-gray-200/50 dark:border-zinc-800/60 shadow flex flex-col xl:flex-row xl:items-center justify-between gap-4 select-none shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-0.5 text-left">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
              Laboratorio de Ciencia e IA
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Explora laboratorios de física y química, escribe en la pizarra o interactúa con Tesla.
            </p>
          </div>
        </div>

        {/* 3 SECCIONES INTERCONECTADAS TAB SELECTOR */}
        <div className="flex bg-gray-150/80 dark:bg-zinc-850 p-1 rounded-2xl border border-gray-200/50 dark:border-zinc-700/60 shadow-inner max-w-full overflow-x-auto self-center lg:self-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setActiveLabTab('pizarra')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeLabTab === 'pizarra'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-650 text-white shadow'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            📋 Pizarra de Tiza
          </button>
          <button
            type="button"
            onClick={() => setActiveLabTab('fisica')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeLabTab === 'fisica'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-650 text-white shadow'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            ⚙️ Lab. de Física Clásica
          </button>
          <button
            type="button"
            onClick={() => setActiveLabTab('quimica')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeLabTab === 'quimica'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-650 text-white shadow'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            🧪 Lab. de Química Activa
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-board-widgets-toggle"
            type="button"
            onClick={() => setIsWidgetsPanelOpen(!isWidgetsPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl transition-all cursor-pointer font-bold border ${
              isWidgetsPanelOpen 
                ? 'bg-emerald-600 dark:bg-zinc-800 text-white dark:text-zinc-250 hover:bg-emerald-700 dark:hover:bg-zinc-750 shadow-md border-transparent dark:border-zinc-700 shadow-emerald-500/10 dark:shadow-none' 
                : 'bg-white hover:bg-gray-50 border-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-350'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            {isWidgetsPanelOpen ? 'Ocultar Herramientas' : 'Mostrar Herramientas'}
          </button>

          <button
            id="btn-board-widgets-visibility"
            type="button"
            onClick={() => setShowBoardWidgets(!showBoardWidgets)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl transition-all cursor-pointer font-bold border ${
              showBoardWidgets 
                ? 'bg-amber-600 dark:bg-zinc-800 text-white dark:text-zinc-250 hover:bg-amber-700 dark:hover:bg-zinc-750 shadow-md border-transparent dark:border-zinc-700 shadow-amber-500/10 dark:shadow-none' 
                : 'bg-white hover:bg-gray-50 border-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-350'
            }`}
            title="Mostrar u ocultar los elementos de la pizarra"
          >
            <Layers className="w-4 h-4 shrink-0" />
            {showBoardWidgets ? 'Ocultar Widgets' : 'Mostrar Widgets'}
          </button>

          <button
            id="btn-board-assistant-toggle"
            type="button"
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl transition-all cursor-pointer font-bold border ${
              isAssistantOpen 
                ? 'bg-indigo-600 dark:bg-zinc-800 text-white dark:text-zinc-250 hover:bg-indigo-700 dark:hover:bg-zinc-750 shadow-md border-transparent dark:border-zinc-700 shadow-indigo-500/10 dark:shadow-none' 
                : 'bg-white hover:bg-gray-50 border-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-350'
            }`}
          >
            <MessageSquare className="w-4 h-4 animate-pulse shrink-0" />
            {isAssistantOpen ? 'Ocultar Chat' : 'Chat Científico'}
          </button>

          <button
            id="btn-board-help"
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-150 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-250 border border-transparent dark:border-zinc-800 rounded-xl transition-all cursor-pointer font-semibold"
          >
            <HelpIcon className="w-4 h-4" />
            {showHelp ? 'Ocultar Guía' : 'Guía Operativa'}
          </button>
          
          <button
            id="btn-board-clear"
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer font-bold border border-rose-200/30 dark:border-rose-900/30"
          >
            <Trash2 className="w-4 h-4" />
            Vaciar Todo
          </button>
        </div>
      </div>

      {/* Guide Banner overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4 shrink-0"
          >
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-zinc-900/90 dark:to-zinc-950/80 p-4 rounded-2xl border border-indigo-100/40 dark:border-zinc-800 text-left text-xs space-y-2 leading-relaxed">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">💡 ¿Cómo funciona el Laboratorio Escolar e IA?</span>
              <p>1. **EnlaceC-Bot Integrado**: Desde el chat flotante en la esquina de la pantalla, pídele cosas como: <span className="font-mono text-indigo-600 dark:text-indigo-400">"Genera un ejercicio de física en la pizarra"</span>, <span className="font-mono text-indigo-600 dark:text-indigo-400">"Agrega un plan de clase de química sobre el PH"</span>. El robot depositará el simulador de inmediato.</p>
              <p>2. **Interactúa y Modifica**: Modifica los deslizadores de agua en el vaso de precipitado, cambia la temperatura de la flama del mechero Bunsen, cambia la gravedad del péndulo o reescribe los textos con total libertad.</p>
              <p>3. **Movimiento y Eliminación**: Mantén presionado y arrastra cualquier tarjeta para ubicarla en la pizarra virtual. **Para eliminar un elemento**, arrástralo directamente encima del tacho de basura en la esquina inferior derecha; verás cómo el tacho se infla y "se come" el elemento.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sandbox Interactive Split Workspace */}
      <div className="flex-1 flex min-h-0 relative select-none">
        
        {/* Left Floating Toolbar / Element Drawer superimposed on top of the chalkboard */}
        <AnimatePresence>
          {isWidgetsPanelOpen && (
            <motion.div
              initial={{ opacity: 0, x: -60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-4 top-4 bottom-4 w-56 z-30 bg-white/80 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800 rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden text-left select-none shadow-2xl"
            >
              {/* Section: Annotations */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Documental</span>
                <button
                  id="sidebar-add-note"
                  type="button"
                  onClick={() => addPreset('text')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white/70 hover:bg-indigo-50 dark:bg-zinc-850 dark:hover:bg-indigo-950/30 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer group"
                >
                  <div className="p-1 px-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>Anotación con Tarjeta</span>
                </button>
                <button
                  id="sidebar-add-free-text"
                  type="button"
                  onClick={() => addPreset('free_text')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white/70 hover:bg-violet-50 dark:bg-zinc-850 dark:hover:bg-violet-950/30 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer group animate-shine"
                  title="Crea texto flotante transparente sin bordes ni estilo de tarjeta"
                >
                  <div className="p-1 px-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-violet-600 dark:text-violet-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-left leading-tight">Texto Libre (Sin Card)</span>
                </button>
              </div>

          {/* Section: Physics Modules */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Módulos de Física</span>
            <button
              id="sidebar-add-physics-pendulum"
              type="button"
              onClick={() => addPreset('physics_pendulum')}
              className="w-full flex items-center gap-2 group px-3 py-2 bg-white/70 hover:bg-amber-50 dark:bg-zinc-850 dark:hover:bg-amber-950/20 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60 shrink-0">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Simular Péndulo</span>
            </button>

            <button
              id="sidebar-add-physics-force"
              type="button"
              onClick={() => addPreset('physics_force')}
              className="w-full flex items-center gap-2 group px-3 py-2 bg-white/70 hover:bg-sky-50 dark:bg-zinc-850 dark:hover:bg-sky-950/20 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/60 shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Vectores de Fuerza</span>
            </button>

            <button
              id="sidebar-add-physics-magnet"
              type="button"
              onClick={() => addPreset('physics_magnet')}
              className="w-full flex items-center gap-2 group px-3 py-2 bg-white/70 hover:bg-rose-50 dark:bg-zinc-850 dark:hover:bg-rose-950/20 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Imán Magnético</span>
            </button>
          </div>

          {/* Section: Chemistry Modules */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Módulos de Química</span>
            <button
              id="sidebar-add-chemistry-beaker"
              type="button"
              onClick={() => addPreset('chemistry_beaker')}
              className="w-full flex items-center gap-2 group px-3 py-2 bg-white/70 hover:bg-teal-50 dark:bg-zinc-850 dark:hover:bg-teal-950/20 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60 shrink-0">
                <FlaskConical className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Vaso de Precipitado</span>
            </button>

            <button
              id="sidebar-add-chemistry-tube"
              type="button"
              onClick={() => addPreset('chemistry_tube')}
              className="w-full flex items-center gap-2 group px-3 py-2 bg-white/70 hover:bg-fuchsia-50 dark:bg-zinc-850 dark:hover:bg-fuchsia-950/20 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/60 shrink-0">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Tubo de Ensayo</span>
            </button>

            <button
              id="sidebar-add-chemistry-bunsen"
              type="button"
              onClick={() => addPreset('chemistry_bunsen')}
              className="w-full flex items-center gap-2 group px-3 py-2 bg-white/70 hover:bg-orange-50 dark:bg-zinc-850 dark:hover:bg-orange-950/20 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/60 shrink-0">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="truncate">Mechero Bunsen</span>
            </button>

            <button
              id="sidebar-add-chemistry-molecule"
              type="button"
              onClick={() => addPreset('chemistry_molecule')}
              className="w-full flex items-center gap-2 group px-3 py-2 bg-white/70 hover:bg-indigo-50 dark:bg-zinc-850 dark:hover:bg-indigo-950/20 border border-gray-150 dark:border-zinc-800 rounded-2xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 shrink-0">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Molécula Química</span>
            </button>
          </div>

          {/* Section: Geometric Shapes & Instrumental */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Figuras e Instrumental</span>
            <button
              id="sidebar-add-shape-line"
              type="button"
              onClick={() => addPreset('shape_line')}
              className="w-full flex items-center gap-2 group px-3 py-1.5 bg-white/70 hover:bg-emerald-50 dark:bg-zinc-850 dark:hover:bg-emerald-950/20 border border-gray-150 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 shrink-0">
                <PenTool className="w-3 h-3" />
              </div>
              <span className="truncate">Línea Geométrica</span>
            </button>

            <button
              id="sidebar-add-shape-circle"
              type="button"
              onClick={() => addPreset('shape_circle')}
              className="w-full flex items-center gap-2 group px-3 py-1.5 bg-white/70 hover:bg-rose-50 dark:bg-zinc-850 dark:hover:bg-rose-950/20 border border-gray-150 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-600 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 shrink-0">
                <Circle className="w-3 h-3 text-rose-500" />
              </div>
              <span className="truncate">Círculo Precisión</span>
            </button>

            <button
              id="sidebar-add-rule-angle"
              type="button"
              onClick={() => addPreset('rule_angle')}
              className="w-full flex items-center gap-2 group px-3 py-1.5 bg-white/70 hover:bg-cyan-50 dark:bg-zinc-850 dark:hover:bg-cyan-950/20 border border-gray-150 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-md bg-cyan-100/50 dark:bg-cyan-950/30 text-cyan-600 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/60 shrink-0">
                <Compass className="w-3 h-3" />
              </div>
              <span className="truncate">Regla de Ángulos</span>
            </button>

            <button
              id="sidebar-add-rule-measure"
              type="button"
              onClick={() => addPreset('rule_measure')}
              className="w-full flex items-center gap-2 group px-3 py-1.5 bg-white/70 hover:bg-amber-50 dark:bg-zinc-850 dark:hover:bg-amber-950/20 border border-gray-150 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-600 group-hover:bg-amber-105 dark:group-hover:bg-amber-900/60 shrink-0">
                <Ruler className="w-3 h-3" />
              </div>
              <span className="truncate">Regla Escala</span>
            </button>
          </div>

          {/* Quick Stats of Board */}
          <div className="mt-auto pt-4 border-t border-gray-150 dark:border-zinc-800/80 select-none">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
              <span>Elementos En Pizarra</span>
              <span className="bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 py-0.5 px-2 rounded-full">{items.length}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

        {/* Right Content Area: Board Selector & Canvas Frame */}
        <div 
          ref={boardContainerRef}
          className={`flex-1 flex flex-col min-h-0 gap-2 relative ${
            isFullscreen 
              ? 'fixed inset-0 z-[99999] bg-slate-100 dark:bg-zinc-950 p-4 md:p-6' 
              : ''
          }`}
        >
          
          {/* MULTI-BOARD TABS BAR & FULLSCREEN TOGGLE */}
          <div className="flex items-center justify-between gap-4 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-md p-2.5 rounded-2xl border border-gray-200/50 dark:border-zinc-800/65 shadow-sm select-none shrink-0">
            {/* Left side: Tabs List */}
            <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1 pr-2 scrollbar-none">
              {boards.map((board) => {
                const isActive = board.id === activeBoardId;
                const isEditing = board.id === editingBoardId;
                
                return (
                  <div
                    key={board.id}
                    onClick={() => !isActive && handleSwitchBoard(board.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none shrink-0 group ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-gray-100/60 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800/70 border-gray-200/50 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingNameVal}
                        onChange={(e) => setEditingNameVal(e.target.value)}
                        onBlur={() => saveRenameBoard(board.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRenameBoard(board.id);
                          if (e.key === 'Escape') setEditingBoardId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-white outline-none font-bold text-xs border-b border-white/50 w-24 px-0.5"
                      />
                    ) : (
                      <span className="truncate max-w-28">
                        {board.name}
                      </span>
                    )}

                    {/* Quick rename trigger */}
                    {!isEditing && isActive && (
                      <button
                        type="button"
                        onClick={(e) => startRenameBoard(board.id, board.name, e)}
                        className={`p-0.5 rounded hover:bg-indigo-700 text-indigo-200 hover:text-white transition-colors cursor-pointer`}
                        title="Renombrar pizarra"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}

                    {/* Delete button (only show if more than 1 board exists) */}
                    {boards.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteBoard(board.id, e)}
                        className={`p-0.5 rounded hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-slate-400 group-hover:opacity-100 ${
                          isActive ? 'text-indigo-200' : 'opacity-0 focus:opacity-100'
                        }`}
                        title="Eliminar pizarra"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add New Board Button */}
              <button
                type="button"
                onClick={handleCreateBoard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer shrink-0 active:scale-95"
                title="Añadir nueva pizarra"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Pizarra</span>
              </button>
            </div>

            {/* Right side: Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm shrink-0 active:scale-95 ${
                isFullscreen
                  ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                  : 'bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 border-gray-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Salir Pantalla Completa</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Pantalla Completa</span>
                </>
              )}
            </button>
          </div>

          {/* Toast Notification Container inside Board */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-[50] px-4 py-2 bg-zinc-900/90 dark:bg-zinc-950/95 text-white border border-zinc-800 text-xs font-black rounded-xl shadow-2xl pointer-events-none flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Whiteboard Interactive Canvas Frame */}
          <div 
            ref={workspaceRef}
            className={`flex-1 relative rounded-3xl overflow-hidden shadow-inner p-4 select-none ${
              activeLabTab === 'pizarra'
                ? 'bg-[#122e1f] text-[#f1fbf6] border-8 border-amber-900/80 shadow-2xl transition-all duration-300'
                : 'bg-slate-50 dark:bg-zinc-950 border border-gray-250/60 dark:border-zinc-800 transition-all duration-300'
            }`}
          style={activeLabTab === 'pizarra' ? {
            backgroundImage: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.05) 0%, rgba(0, 0, 0, 0) 80%), linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '100%, 35px 35px, 35px 35px'
          } : {
            backgroundImage: 'radial-gradient(ellipse at center, rgba(129, 140, 248, 0.08) 0%, rgba(255, 255, 255, 0) 70%), linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)',
            backgroundSize: '100%, 30px 30px, 30px 30px'
          }}
        >
          {/* Floating trigger to restore widgets drawer if closed */}
          {!isWidgetsPanelOpen && (
            <button
              type="button"
              onClick={() => setIsWidgetsPanelOpen(true)}
              className="absolute left-4 top-4 z-40 px-3 py-2 bg-zinc-900/95 hover:bg-zinc-850 dark:bg-zinc-950/95 border border-zinc-800 text-white rounded-2xl shadow-2xl transition-all cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 group"
              title="Mostrar Panel de Herramientas"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-[10px] font-black tracking-wider uppercase">Herramientas</span>
            </button>
          )}

          {/* ========================================================= */}
          {/* TAB OVERLAYS & CONTROLS FOR DRAWING HANDS (PIZARRA TIZA) */}
          {/* ========================================================= */}
          {activeLabTab === 'pizarra' && (
            <>
              {/* SVG Drawing Chalkboard Stroke Canvas */}
              <svg
                onPointerDown={handleWhiteboardPointerDown}
                onPointerMove={handleWhiteboardPointerMove}
                onPointerUp={handleWhiteboardPointerUp}
                onPointerLeave={handleWhiteboardPointerLeave}
                className={`absolute inset-0 w-full h-full z-10 select-none ${
                  drawTool === 'select' ? 'pointer-events-none' : 'cursor-none'
                }`}
              >
                {/* Drawn strokes list */}
                {drawnLines.map((line) => {
                  const dAttr = line.points.map((p, i) => `${i === 0 || (p as any).command === 'M' ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                  return (
                    <path
                      key={line.id}
                      d={dAttr}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={line.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.88}
                      className="pointer-events-none"
                    />
                  );
                })}
                {/* Active stroke */}
                {currentLinePoints.length > 1 && (
                  <path
                    d={currentLinePoints.map((p, i) => `${i === 0 || (p as any).command === 'M' ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke={pencilColor}
                    strokeWidth={brushSize}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.88}
                    className="pointer-events-none"
                  />
                )}
              </svg>

              {/* Wooden felt chalk eraser cursor (Mota) */}
              {drawTool === 'eraser' && eraserCursorPos && (
                <div
                  className="absolute pointer-events-none z-50 border-2 border-white/60 bg-amber-600 rounded-lg p-0.5 shadow-2xl flex flex-col justify-between"
                  style={{
                    left: `${eraserCursorPos.x - 22}px`,
                    top: `${eraserCursorPos.y - 22}px`,
                    width: '44px',
                    height: '44px',
                    borderRadius: '5px',
                    boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div className="w-full h-full bg-zinc-800 rounded border border-amber-500/50 flex flex-col justify-between py-0.5 px-0.5 text-center">
                    <div className="w-full h-1 bg-amber-500/30 rounded-full"></div>
                    <span className="text-[8px] font-black tracking-widest text-amber-500 scale-75 block">MOTA</span>
                    <div className="w-full h-1 bg-amber-500/30 rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Realistic writing chalk stick cursor */}
              {drawTool === 'pencil' && chalkCursorPos && (
                <div
                  className="absolute pointer-events-none z-50 select-none transition-transform duration-75"
                  style={{
                    left: `${chalkCursorPos.x}px`,
                    top: `${chalkCursorPos.y - 32}px`,
                    width: '10px',
                    height: '32px',
                    transform: 'rotate(25deg)',
                    transformOrigin: 'bottom left',
                  }}
                >
                  {/* Chalk body with visual 3D volume & texture */}
                  <div 
                    className="w-full h-full rounded-t-sm rounded-b shadow-[3px_5px_10px_rgba(0,0,0,0.55)] border border-white/10 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, ${pencilColor}dd, ${pencilColor}ff, #ffffffaa)`,
                    }}
                  >
                    {/* Retro Chalk paper sleeve or grip line */}
                    <div className="absolute inset-x-0 top-[40%] bottom-[30%] bg-black/15 border-y border-white/10 flex items-center justify-center">
                      <div className="w-[1px] h-full bg-white/20 mx-[1px]" />
                      <div className="w-[1px] h-full bg-white/20 mx-[1px]" />
                    </div>
                    {/* Chalk dusty base overlay */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-t from-black/25 to-transparent" />
                  </div>
                  {/* Subtle chalk dust highlight under the tip */}
                  <div 
                    className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full blur-[1px] -mb-1 -ml-1 transition-colors duration-150 animate-pulse"
                    style={{ backgroundColor: pencilColor, opacity: isDrawing ? 0.9 : 0.4 }}
                  />
                </div>
              )}

              {/* Presentation laser pointer */}
              {drawTool === 'pointer' && laserPointerPos && (
                <div
                  className="absolute pointer-events-none z-50 transition-all duration-75 select-none"
                  style={{
                    left: `${laserPointerPos.x}px`,
                    top: `${laserPointerPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="absolute w-12 h-12 rounded-full border-2 border-red-500/50 bg-red-500/10 animate-ping -left-4 -top-4 pointer-events-none" />
                  <div className="absolute w-8 h-8 rounded-full bg-red-600/30 blur-md -left-2 -top-2 pointer-events-none animate-pulse" />
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-amber-400 border border-white shadow-[0_0_15px_#ef4444,0_0_30px_#f97316]" />
                </div>
              )}

              {/* Helper shape cursor */}
              {(drawTool === 'line' || drawTool === 'circle' || drawTool === 'hyperbola') && chalkCursorPos && (
                <div
                  className="absolute pointer-events-none z-50 select-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    left: `${chalkCursorPos.x}px`,
                    top: `${chalkCursorPos.y}px`,
                    width: '24px',
                    height: '24px',
                  }}
                >
                  <div className="absolute w-5 h-5 rounded-full border border-dashed animate-spin" style={{ borderColor: pencilColor }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pencilColor }} />
                </div>
              )}

              {/* Chalk color and tools selection rack tray */}
              <div className="absolute bottom-4 left-4 z-40 bg-zinc-900/90 dark:bg-zinc-950/95 border border-zinc-800 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 select-none text-white pointer-events-auto max-w-[95%] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDrawTool('select')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    drawTool === 'select' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Mover Tarjetas"
                >
                  <Move className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('pointer')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    drawTool === 'pointer' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Puntero Láser"
                >
                  <MousePointer className="w-4 h-4 text-red-500 fill-red-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('pencil')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    drawTool === 'pencil' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Tiza Escrita"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('line')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    drawTool === 'line' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Línea Recta"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('circle')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    drawTool === 'circle' ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Círculo"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('hyperbola')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    drawTool === 'hyperbola' ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Hipérbola"
                >
                  <Spline className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('eraser')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    drawTool === 'eraser' ? 'bg-amber-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Mota Borradora"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                {drawTool !== 'select' && drawTool !== 'eraser' && drawTool !== 'pointer' && (
                  <div className="flex gap-1 border-l border-zinc-800 pl-1.5 ml-1 shrink-0">
                    {[
                      { hex: '#ffffff', name: 'Blanco' },
                      { hex: '#fef08a', name: 'Amarilla' },
                      { hex: '#67e8f9', name: 'Celeste' },
                      { hex: '#f472b6', name: 'Rosada' }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setPencilColor(c.hex)}
                        className={`w-4 h-4 rounded-full border border-white/20 transition-all ${
                          pencilColor === c.hex ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={`Tiza ${c.name}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty board watermark */}
          {items.length === 0 && activeLabTab === 'pizarra' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-20 dark:opacity-10 text-center px-4">
              <Sparkles className="w-16 h-16 text-emerald-400 animate-pulse mb-3" />
              <p className="font-extrabold text-sm uppercase tracking-widest text-[#ebf5f0]">Pizarra de Tiza en Blanco</p>
              <p className="text-xs text-[#ebf5f0]/80 mt-1">Saca herramientas del menú izquierdo, escribe a mano alzada o dibuja con tizas.</p>
            </div>
          )}

          {/* Draggable Active Elements List inside bounds */}
          <AnimatePresence>
            {showBoardWidgets && items.map((item) => (
              <motion.div
                key={item.id}
                onPointerDown={(e) => startDrag(e, item)}
                style={{ left: `${item.x}px`, top: `${item.y}px` }}
                className={`absolute w-64 select-none transition-all duration-75 z-20 hover:z-30 group ${
                  item.type === 'free_text'
                    ? `bg-transparent border ${
                        activeDraggingId === item.id 
                          ? 'border-indigo-400 dark:border-indigo-500 scale-[1.02] bg-indigo-500/[0.04] shadow-md' 
                          : item.isPinned
                          ? 'border-dashed border-amber-400/20 bg-amber-500/[0.01]'
                          : 'border-transparent hover:border-dashed hover:border-indigo-400/30 hover:bg-indigo-500/[0.02]'
                      } p-3 rounded-2xl`
                    : `bg-white/95 dark:bg-zinc-900/95 backdrop-blur border rounded-2xl p-4 shadow-xl ${
                        activeDraggingId === item.id 
                          ? 'cursor-grabbing border-indigo-400 dark:border-indigo-500 shadow-2xl ring-2 ring-indigo-400/20 scale-[1.02]' 
                          : item.isPinned
                          ? 'cursor-default border-amber-300/80 dark:border-amber-900/50 shadow-md ring-1 ring-amber-400/10 bg-amber-50/20 dark:bg-amber-950/5'
                          : 'cursor-grab border-gray-200 dark:border-zinc-850 hover:border-indigo-300 dark:hover:border-zinc-750'
                      }`
                }`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 18 }}
              >
                {/* Custom Card Header bar with Drag Grab handle and manual delete action */}
                <div className={`flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-zinc-800/85 ${
                  item.type === 'free_text' ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-200' : ''
                }`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Move className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider truncate">
                      {item.subtitle || 'Simulador'}
                    </span>
                    {item.isPinned && (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[8px] px-1 rounded font-black uppercase">
                        Anclado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Botón de anclar / desanclar */}
                    <button
                      id={`btn-manual-pin-${item.id}`}
                      type="button"
                      onClick={() => togglePinItem(item.id)}
                      className={`p-1 rounded-lg cursor-pointer transition-colors ${
                        item.isPinned 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' 
                          : 'text-slate-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-amber-500'
                      }`}
                      title={item.isPinned ? 'Desanclar elemento (Habilitar movimiento)' : 'Anclar elemento (Bloquear posición)'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      id={`btn-manual-delete-${item.id}`}
                      type="button"
                      onClick={() => deleteItemDirect(item.id)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                      title="Eliminar elemento"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Title (Editable inline by clicking on it) */}
                {item.type !== 'free_text' && (
                  <input
                    id={`input-card-title-${item.id}`}
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItemText(item.id, 'title', e.target.value)}
                    className="w-full bg-transparent hover:bg-gray-100/40 dark:hover:bg-zinc-850/40 focus:bg-white dark:focus:bg-zinc-950 px-1 py-0.5 rounded text-xs font-extrabold text-slate-800 dark:text-zinc-100 border-none outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                )}

                {/* Custom layout representation according to BoardItem Type */}
                <div className="mt-3 text-xs text-left">
                  
                  {/* ====== CASE: TEXT CONTENT NOTE ====== */}
                  {(item.type === 'text' || item.type === 'plan' || item.type === 'exercise') && (
                    <div className="space-y-2 select-text text-slate-700 dark:text-zinc-300">
                      <textarea
                        id={`textarea-card-content-${item.id}`}
                        value={item.content || ''}
                        onChange={(e) => updateItemText(item.id, 'content', e.target.value)}
                        placeholder="Contenido de la nota..."
                        rows={5}
                        className="w-full text-xs bg-gray-50/50 dark:bg-zinc-950/40 hover:bg-gray-50 dark:hover:bg-zinc-950/80 focus:bg-white dark:focus:bg-zinc-950 p-2 rounded-xl outline-none resize-none border border-gray-150 dark:border-zinc-800 focus:border-indigo-400 text-left font-mono"
                      />
                    </div>
                  )}

                  {/* ====== CASE: FREE TEXT WRITING (NO CARDS) ====== */}
                  {item.type === 'free_text' && (
                    <div className="space-y-1.5 select-text -mt-2">
                      {/* Interactive Marker Color Palette Selector (visible on mouse hover) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 bg-white/90 dark:bg-zinc-850 p-1 rounded-lg border border-gray-150 dark:border-zinc-800 w-fit shadow-md select-none">
                        <span className="text-[8px] font-black tracking-wider text-gray-400 dark:text-zinc-500 uppercase px-1">Tinta:</span>
                        {[
                          { color: '#6366f1', name: 'Indigo' },
                          { color: '#10b981', name: 'Emerald' },
                          { color: '#ec4899', name: 'Rose' },
                          { color: '#0ea5e9', name: 'Cyan' },
                          { color: '#f59e0b', name: 'Amber' },
                          { color: 'currentColor', name: 'Contraste' }
                        ].map((ink) => (
                          <button
                            key={ink.color}
                            type="button"
                            onClick={() => updateItemPayload(item.id, { color: ink.color })}
                            className={`w-3.5 h-3.5 rounded-full cursor-pointer border transition-transform hover:scale-125 ${
                              item.payload.color === ink.color ? 'border-zinc-500 dark:border-zinc-200 ring-1 ring-zinc-500/20 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: ink.color === 'currentColor' ? '#6b7280' : ink.color }}
                            title={ink.name}
                          />
                        ))}
                      </div>

                      <textarea
                        id={`textarea-free-content-${item.id}`}
                        value={item.content || ''}
                        onChange={(e) => updateItemText(item.id, 'content', e.target.value)}
                        placeholder="Escribe libremente aquí (como tiza/marcador)..."
                        rows={4}
                        style={{ 
                          color: item.payload.color || '#6366f1',
                          textShadow: item.payload.color === 'currentColor' ? 'none' : '0 1px 2px rgba(99, 102, 241, 0.05)'
                        }}
                        className="w-full bg-transparent border-none outline-none resize-none font-handwritten text-2xl font-semibold tracking-wide leading-relaxed p-1 placeholder:opacity-30 placeholder:text-zinc-400 select-text"
                      />
                    </div>
                  )}

                  {/* ====== CASE: PHYSICS MAGNET SIMULATOR ====== */}
                  {item.type === 'physics_magnet' && (
                    <div className="space-y-3">
                      <div className="flex justify-center py-2 bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-extrabold text-sm rounded-xl tracking-widest leading-none select-none">
                        <span className="flex-1 text-center py-1">N</span>
                        <div className="w-[1.5px] h-6 bg-white/40"></div>
                        <span className="flex-1 text-center py-1">S</span>
                      </div>
                      
                      {/* Interactive toggle for Magnet Field Lines */}
                      <div className="space-y-2 font-medium">
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Líneas de campo:</span>
                          <button
                            id={`btn-magnet-lines-${item.id}`}
                            type="button"
                            onClick={() => updateItemPayload(item.id, { fieldLines: !item.payload.fieldLines })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.payload.fieldLines ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800'
                            }`}
                          >
                            {item.payload.fieldLines ? 'Activado' : 'Silenciado'}
                          </button>
                        </div>

                        {/* Animated simulated Magnetic Wave Ring Ripple */}
                        {item.payload.fieldLines && (
                          <div className="flex justify-center gap-2 overflow-hidden py-1">
                            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="w-4 h-4 rounded-full border border-dashed border-indigo-400"></motion.div>
                            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="w-4 h-4 rounded-full border border-dashed border-indigo-400"></motion.div>
                            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} className="w-4 h-4 rounded-full border border-dashed border-indigo-400"></motion.div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span>Fuerza de atracción:</span>
                          <select
                            id={`select-magnet-strength-${item.id}`}
                            value={item.payload.strength || 'Alta'}
                            onChange={(e) => updateItemPayload(item.id, { strength: e.target.value })}
                            className="bg-transparent text-xs rounded border border-gray-200 dark:border-zinc-800 px-1 py-0.5 text-zinc-700 dark:text-zinc-300 outline-none"
                          >
                            <option value="Baja">Baja (0.1T)</option>
                            <option value="Media">Media (0.5T)</option>
                            <option value="Alta">Alta (1.2T)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: PHYSICS PENDULUM SIMULATOR ====== */}
                  {item.type === 'physics_pendulum' && (
                    <div className="space-y-3 text-center">
                      {/* Realistic CSS Keyframe animated physical string pendulum swing */}
                      <div className="h-32 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800 rounded-xl relative overflow-hidden flex items-start justify-center">
                        <div className="absolute top-0 w-2.5 h-2.5 bg-zinc-600 rounded-full z-10"></div>
                        
                        {/* Interactive anim string oscillation */}
                        <motion.div
                          animate={item.payload.isRunning ? {
                            rotate: [-item.payload.angle, item.payload.angle, -item.payload.angle]
                          } : { rotate: 0 }}
                          transition={{
                            repeat: Infinity,
                            duration: Math.PI * 2 * Math.sqrt((item.payload.length / 100) / item.payload.gravity),
                            ease: "easeInOut"
                          }}
                          className="origin-top flex flex-col items-center"
                          style={{ height: `${item.payload.length}px` }}
                        >
                          {/* Pendulum Thread Line wire */}
                          <div className="w-0.5 bg-gray-400 dark:bg-zinc-600 h-full"></div>
                          {/* Heavy Mass Bob Sphere */}
                          <div className="w-5 h-5 bg-amber-500 rounded-full border border-amber-600 select-none shadow-md -mt-1 flex items-center justify-center text-[8px] font-bold text-white relative">
                            m
                          </div>
                        </motion.div>
                      </div>

                      {/* Gravity and Length adjust Controls */}
                      <div className="text-left space-y-1.5 text-[11px] font-semibold">
                        <div className="flex justify-between">
                          <span>Gravedad: {item.payload.gravity} m/s²</span>
                          <span className="text-amber-600 dark:text-amber-400 text-[10px]">T ≈ {(Math.PI * 2 * Math.sqrt((item.payload.length / 100) / item.payload.gravity)).toFixed(2)}s</span>
                        </div>
                        <input
                          id={`input-pendulum-gravity-${item.id}`}
                          type="range"
                          min="1"
                          max="25"
                          step="0.5"
                          value={item.payload.gravity}
                          onChange={(e) => updateItemPayload(item.id, { gravity: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500"
                        />

                        <div className="flex justify-between pt-1">
                          <span>Longitud hilo: {item.payload.length}px</span>
                        </div>
                        <input
                          id={`input-pendulum-len-${item.id}`}
                          type="range"
                          min="50"
                          max="115"
                          step="5"
                          value={item.payload.length}
                          onChange={(e) => updateItemPayload(item.id, { length: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />

                        <div className="pt-2 flex gap-1">
                          <button
                            id={`btn-pendulum-play-${item.id}`}
                            type="button"
                            onClick={() => updateItemPayload(item.id, { isRunning: !item.payload.isRunning })}
                            className="flex-1 py-1 rounded bg-amber-500 text-white text-[10px] font-black uppercase text-center hover:bg-amber-600 cursor-pointer flex items-center justify-center gap-1"
                          >
                            {item.payload.isRunning ? (
                              <>
                                <Pause className="w-3 h-3" /> Pausar
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 text-white fill-white" /> Iniciar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: PHYSICS FORCE VECTOR SIMULATOR ====== */}
                  {item.type === 'physics_force' && (
                    <div className="space-y-3 font-semibold">
                      {/* Angle Knob and Vector arrow layout */}
                      <div className="h-28 bg-slate-100 dark:bg-zinc-950 rounded-xl relative flex items-center justify-center">
                        <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-full flex items-center justify-center relative">
                          {/* Target Mass Square Box */}
                          <div className="w-8 h-8 bg-sky-500 text-white border border-sky-600 rounded flex items-center justify-center font-bold text-xs select-none">
                            {item.payload.massKg}kg
                          </div>
                          
                          {/* Action Arrow Vector pointing out */}
                          <div 
                            className="absolute origin-left h-0.5 bg-rose-500 w-12"
                            style={{ 
                              transform: `rotate(${-item.payload.angleDeg}deg)`,
                              left: '50%'
                            }}
                          >
                            <div className="absolute right-0 -top-1 w-2 h-2 border-r-2 border-t-2 border-rose-500 rotate-45"></div>
                          </div>
                        </div>

                        {/* Force Magnitude vector label */}
                        <span className="absolute bottom-1 right-2 text-[10px] font-bold text-rose-500">
                          {item.payload.forceN} Newtons (F)
                        </span>
                      </div>

                      {/* Range Controls */}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span>Magnitud Fuerza: {item.payload.forceN} N</span>
                        </div>
                        <input
                          id={`input-force-n-${item.id}`}
                          type="range"
                          min="10"
                          max="150"
                          value={item.payload.forceN}
                          onChange={(e) => updateItemPayload(item.id, { forceN: parseInt(e.target.value) })}
                          className="w-full accent-sky-500"
                        />

                        <div className="flex justify-between pt-1">
                          <span>Ángulo de empuje: {item.payload.angleDeg}°</span>
                          <span>Acl: {(item.payload.forceN / item.payload.massKg).toFixed(1)} m/s²</span>
                        </div>
                        <input
                          id={`input-force-angle-${item.id}`}
                          type="range"
                          min="0"
                          max="360"
                          value={item.payload.angleDeg}
                          onChange={(e) => updateItemPayload(item.id, { angleDeg: parseInt(e.target.value) })}
                          className="w-full accent-sky-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: CHEMISTRY BEAKER FLUID EXPERIMENT ====== */}
                  {item.type === 'chemistry_beaker' && (
                    <div className="space-y-3">
                      {/* Vaso beaker chemical container drawing */}
                      <div className="flex justify-center items-end h-28 relative">
                        <div className="w-20 h-24 border-3 border-t-0 border-zinc-400 dark:border-zinc-500 rounded-b-2xl relative overflow-hidden flex items-end">
                          
                          {/* Liquid element filled */}
                          <motion.div 
                            style={{ 
                              height: `${item.payload.fluidLevel}%`,
                              backgroundColor: item.payload.fluidColor 
                            }}
                            animate={{ height: `${item.payload.fluidLevel}%` }}
                            className="w-full select-none relative"
                          >
                            {/* Water surface ripples */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 select-none animate-pulse"></div>
                          </motion.div>

                          {/* Graduation markings on beaker */}
                          <div className="absolute left-2 inset-y-2 flex flex-col justify-between text-[7px] text-zinc-500 font-bold select-none pointer-events-none">
                            <span>150 ml</span>
                            <span>100 ml</span>
                            <span>50 ml</span>
                            <span>25 ml</span>
                          </div>
                        </div>
                      </div>

                      {/* Chemical Details & Acid pH Selector */}
                      <div className="space-y-2 text-[11px] font-semibold">
                        <div className="flex items-center justify-between">
                          <span>Compuesto:</span>
                          <input
                            id={`input-beaker-compound-${item.id}`}
                            type="text"
                            value={item.payload.compoundName}
                            onChange={(e) => updateItemPayload(item.id, { compoundName: e.target.value })}
                            className="bg-transparent border-b border-gray-200 dark:border-zinc-800 w-28 text-right font-bold text-zinc-700 dark:text-zinc-200 focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span>pH Compuesto: {item.payload.phValue}</span>
                          <span 
                            className="py-0.5 px-2 rounded font-black text-[9px] uppercase tracking-wide text-white"
                            style={{ 
                              backgroundColor: item.payload.phValue < 6 ? '#ef4444' : item.payload.phValue > 8 ? '#8b5cf6' : '#10b981' 
                            }}
                          >
                            {item.payload.phValue < 6 ? 'Ácido' : item.payload.phValue > 8 ? 'Alcalino' : 'Neutro'}
                          </span>
                        </div>
                        <input
                          id={`input-beaker-ph-${item.id}`}
                          type="range"
                          min="0"
                          max="14"
                          step="0.5"
                          value={item.payload.phValue}
                          onChange={(e) => {
                            const ph = parseFloat(e.target.value);
                            // Auto change fluid color based on pH color scale indicating spectrum
                            let col = '#10b981'; // green for neuter
                            if (ph < 4) col = '#b91c1c'; // strong red
                            else if (ph < 6) col = '#eb5757'; // light orange-red
                            else if (ph < 7) col = '#f2c94c'; // yellow
                            else if (ph > 11) col = '#4c1d95'; // dark violet
                            else if (ph > 8) col = '#6366f1'; // blue-purple
                            updateItemPayload(item.id, { phValue: ph, fluidColor: col });
                          }}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-green-500 to-purple-600"
                        />

                        {/* Liquid height Slider */}
                        <div className="flex justify-between pt-1">
                          <span>Volumen Líquido: {item.payload.fluidLevel}%</span>
                        </div>
                        <input
                          id={`input-beaker-volume-${item.id}`}
                          type="range"
                          min="5"
                          max="95"
                          value={item.payload.fluidLevel}
                          onChange={(e) => updateItemPayload(item.id, { fluidLevel: parseInt(e.target.value) })}
                          className="w-full accent-teal-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: CHEMISTRY TUBE EXPERIMENT ====== */}
                  {item.type === 'chemistry_tube' && (
                    <div className="space-y-3 font-semibold">
                      <div className="flex justify-center items-end h-28">
                        <div className="w-10 h-24 border-3 border-t-0 border-zinc-400 dark:border-zinc-500 rounded-b-full relative overflow-hidden flex items-end">
                          <motion.div 
                            style={{ 
                              height: `${item.payload.isBoiling ? '65%' : '50%'}`,
                              backgroundColor: item.payload.color 
                            }}
                            animate={item.payload.isBoiling ? {
                              height: ['60%', '64%', '60%'],
                            } : { height: '50%' }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-full select-none relative"
                          >
                            {/* Animated boiling bubbles inside test tube compound */}
                            {item.payload.isBoiling && (
                              <div className="absolute inset-0 overflow-hidden">
                                <motion.div animate={{ y: [-10, -50], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-white/40"></motion.div>
                                <motion.div animate={{ y: [-10, -40], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-white/30"></motion.div>
                                <motion.div animate={{ y: [-10, -60], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="absolute bottom-3 left-4 w-1 h-1 rounded-full bg-white/50"></motion.div>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Agente:</span>
                          <input
                            id={`input-tube-agent-${item.id}`}
                            type="text"
                            value={item.payload.agent}
                            onChange={(e) => updateItemPayload(item.id, { agent: e.target.value })}
                            className="bg-transparent border-b border-gray-200 dark:border-zinc-800 w-28 text-right font-bold text-zinc-700 dark:text-zinc-200 focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span>Ebullición:</span>
                          <button
                            id={`btn-tube-boiling-${item.id}`}
                            type="button"
                            onClick={() => updateItemPayload(item.id, { isBoiling: !item.payload.isBoiling })}
                            className={`px-3 py-1 rounded text-[10px] uppercase font-black tracking-wide ${
                              item.payload.isBoiling ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-150 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {item.payload.isBoiling ? 'Hirviendo 🔥' : 'Fresco ❄️'}
                          </button>
                        </div>

                        {/* Liquid Color select buttons */}
                        <div className="flex justify-between items-center pt-1">
                          <span>Color reactivo:</span>
                          <div className="flex gap-1">
                            {['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((col) => (
                              <button
                                key={col}
                                type="button"
                                style={{ backgroundColor: col }}
                                onClick={() => updateItemPayload(item.id, { color: col })}
                                className={`w-3.5 h-3.5 rounded-full border ${
                                  item.payload.color === col ? 'border-black dark:border-white scale-125' : 'border-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: CHEMISTRY BUNSEN BURNER SIMULATOR ====== */}
                  {item.type === 'chemistry_bunsen' && (
                    <div className="space-y-3">
                      {/* Realistic CSS Bunsen Flame animation box */}
                      <div className="h-28 bg-zinc-950 rounded-xl relative flex flex-col justify-end items-center pb-2">
                        {/* Interactive dynamic Flame */}
                        <motion.div
                          animate={item.payload.gasFlow > 10 ? {
                            height: [`${item.payload.gasFlow / 2}px`, `${item.payload.gasFlow / 2 + 5}px`, `${item.payload.gasFlow / 2}px`],
                            scaleX: [1, 1.05, 1],
                            opacity: [0.9, 1, 0.9]
                          } : { height: '0px', opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 0.15 }}
                          className="w-4 rounded-b-none rounded-t-full origin-bottom"
                          style={{
                            // Flame shifts color based on temperature value
                            background: item.payload.temp > 700 
                              ? 'radial-gradient(circle, #38bdf8 0%, #2563eb 60%, rgba(37,99,235,0) 100%)' // super hot brilliant blue flame
                              : 'radial-gradient(circle, #f59e0b 0%, #ef4444 60%, rgba(239,68,68,0) 100%)', // lower temperature orange flame
                            marginBottom: '16px' // offset from base burner pipe
                          }}
                        />

                        {/* Metallic Burner Pipe body */}
                        <div className="w-6 h-12 bg-gradient-to-r from-zinc-500 to-zinc-600 rounded-md relative flex items-center justify-center">
                          {/* Gas air collar holes */}
                          <div className="absolute top-2 w-full h-1 bg-zinc-800"></div>
                          {/* Metal stand support lines */}
                          <div className="absolute bottom-0 w-12 h-1 bg-zinc-700"></div>
                        </div>
                      </div>

                      {/* Temperature output and Gas Sliders */}
                      <div className="space-y-2 text-[11px] font-semibold">
                        <div className="flex justify-between items-center text-[10px]">
                          <span>Temperatura:</span>
                          <span className={`font-black uppercase ${item.payload.temp > 700 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                            {item.payload.temp} °C
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Suministro Gas: {item.payload.gasFlow}%</span>
                        </div>
                        <input
                          id={`input-bunsen-gas-${item.id}`}
                          type="range"
                          min="0"
                          max="100"
                          value={item.payload.gasFlow}
                          onChange={(e) => {
                            const flow = parseInt(e.target.value);
                            // formula to approximate temp: max temp based on gas flow
                            const computedTemp = Math.round((flow / 100) * 1100);
                            updateItemPayload(item.id, { gasFlow: flow, temp: computedTemp });
                          }}
                          className="w-full accent-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: CHEMISTRY COVALENT MOLECULE COMPOSER ====== */}
                  {item.type === 'chemistry_molecule' && (
                    <div className="space-y-3 font-semibold">
                      {/* Visual molecule balls model representation */}
                      <div className="h-28 bg-slate-50 dark:bg-zinc-950/40 rounded-xl flex items-center justify-center relative overflow-hidden">
                        {item.payload.moleculeName === 'H₂O' ? (
                          <div className="flex items-center justify-center gap-1.5 relative">
                            {/* Oxygen Central sphere node */}
                            <div className="w-10 h-10 rounded-full bg-red-500 text-white font-bold flex items-center justify-center text-xs shadow">O</div>
                            
                            {/* Hydrogen bond lines with chemical structure angles */}
                            <div className="absolute top-0 -left-6 flex flex-col items-center select-none">
                              <div className="w-7 h-0.5 bg-gray-300 dark:bg-zinc-700 rotate-45 origin-right"></div>
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center text-[10px] shadow mt-1">H</div>
                            </div>

                            <div className="absolute top-0 -right-6 flex flex-col items-center select-none">
                              <div className="w-7 h-0.5 bg-gray-300 dark:bg-zinc-700 -rotate-45 origin-left"></div>
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center text-[10px] shadow mt-1">H</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-zinc-700 text-white font-extrabold flex items-center justify-center text-xs shadow-md">C</div>
                            <div className="w-6 h-0.5 bg-gray-400"></div>
                            <div className="w-9 h-9 rounded-full bg-red-500 text-white font-extrabold flex items-center justify-center text-[10px] shadow">O</div>
                            <div className="w-9 h-9 rounded-full bg-red-500 text-white font-extrabold flex items-center justify-center text-[10px] shadow">O</div>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Fórmula:</span>
                          <select
                            id={`select-molecule-type-${item.id}`}
                            value={item.payload.moleculeName || 'H₂O'}
                            onChange={(e) => {
                              const formula = e.target.value;
                              const geometry = formula === 'H₂O' ? 'Angular' : 'Lineal';
                              updateItemPayload(item.id, { moleculeName: formula, geometry });
                            }}
                            className="bg-transparent border border-gray-200 dark:border-zinc-800 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="H₂O">Agua (H₂O)</option>
                            <option value="CO₂">Dióxido de Carbono (CO₂)</option>
                          </select>
                        </div>

                        <div className="flex justify-between text-[10px] pt-1">
                          <span>Estructura Geométrica:</span>
                          <span className="text-zinc-500 font-black uppercase">{item.payload.geometry}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: GEOMETRIC LINE SHAPE ====== */}
                  {item.type === 'shape_line' && (
                    <div className="space-y-3">
                      <div className="flex justify-center p-2.5 bg-zinc-950/20 dark:bg-zinc-950/50 rounded-xl mb-1.5 border border-zinc-500/10 h-24 items-center">
                        <svg className="w-full h-full" viewBox="0 0 200 80">
                          <line 
                            x1="100" 
                            y1="40" 
                            x2={100 + Math.cos((item.payload.angle || 0) * Math.PI / 180) * (item.payload.length || 100) / 2} 
                            y2={40 + Math.sin((item.payload.angle || 0) * Math.PI / 180) * (item.payload.length || 100) / 2} 
                            stroke={item.payload.color || '#10b981'} 
                            strokeWidth={item.payload.thickness || 4} 
                            strokeLinecap="round" 
                          />
                          <line 
                            x1="100" 
                            y1="40" 
                            x2={100 - Math.cos((item.payload.angle || 0) * Math.PI / 180) * (item.payload.length || 100) / 2} 
                            y2={40 - Math.sin((item.payload.angle || 0) * Math.PI / 180) * (item.payload.length || 100) / 2} 
                            stroke={item.payload.color || '#10b981'} 
                            strokeWidth={item.payload.thickness || 4} 
                            strokeLinecap="round" 
                          />
                          {/* Center node */}
                          <circle cx="100" cy="40" r="3.5" fill="#ffffff" />
                        </svg>
                      </div>
                      
                      <div className="space-y-2 text-[11px] font-semibold">
                        <div className="flex justify-between">
                          <span>Longitud: {item.payload.length || 150} px</span>
                        </div>
                        <input 
                          type="range"
                          min="30"
                          max="250"
                          value={item.payload.length || 150}
                          onChange={(e) => updateItemPayload(item.id, { length: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />

                        <div className="flex justify-between">
                          <span>Ángulo: {item.payload.angle || 0}°</span>
                        </div>
                        <input 
                          type="range"
                          min="-180"
                          max="180"
                          value={item.payload.angle || 0}
                          onChange={(e) => updateItemPayload(item.id, { angle: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />

                        <div className="flex justify-between">
                          <span>Grosor: {item.payload.thickness || 4} px</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="12"
                          value={item.payload.thickness || 4}
                          onChange={(e) => updateItemPayload(item.id, { thickness: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />

                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span>Color Tinta:</span>
                          <div className="flex gap-1.5 justify-end">
                            {['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#ffffff'].map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => updateItemPayload(item.id, { color: col })}
                                className={`w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 ${item.payload.color === col ? 'ring-2 ring-indigo-500 scale-125' : ''}`}
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: GEOMETRIC CIRCLE SHAPE ====== */}
                  {item.type === 'shape_circle' && (
                    <div className="space-y-3">
                      <div className="flex justify-center p-2 bg-zinc-950/20 dark:bg-zinc-950/50 rounded-xl mb-1.5 border border-zinc-500/10 h-24 items-center">
                        <svg className="w-20 h-20" viewBox="0 0 100 100">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r={Math.min(45, (item.payload.radius || 35))} 
                            fill={item.payload.filled ? `${item.payload.color}33` : 'none'} 
                            stroke={item.payload.color || '#ec4899'} 
                            strokeWidth={item.payload.thickness || 3} 
                          />
                          {/* Center Dot */}
                          <circle cx="50" cy="50" r="2.5" fill="#ffffff" />
                        </svg>
                      </div>

                      <div className="space-y-2 text-[11px] font-semibold">
                        <div className="flex justify-between">
                          <span>Radio: {item.payload.radius || 45} px</span>
                        </div>
                        <input 
                          type="range"
                          min="15"
                          max="80"
                          value={item.payload.radius || 45}
                          onChange={(e) => updateItemPayload(item.id, { radius: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />

                        <div className="flex justify-between">
                          <span>Grosor Borde: {item.payload.thickness || 3} px</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={item.payload.thickness || 3}
                          onChange={(e) => updateItemPayload(item.id, { thickness: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />

                        <div className="flex justify-between items-center pt-1">
                          <span>Relleno Sólido:</span>
                          <button
                            type="button"
                            onClick={() => updateItemPayload(item.id, { filled: !item.payload.filled })}
                            className={`px-2 py-0.5 text-[9px] rounded font-black uppercase tracking-wider ${item.payload.filled ? 'bg-indigo-600 text-white' : 'bg-gray-150 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                          >
                            {item.payload.filled ? 'Sólido 30%' : 'Contorno'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span>Color Círculo:</span>
                          <div className="flex gap-1.5 justify-end">
                            {['#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ffffff'].map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => updateItemPayload(item.id, { color: col })}
                                className={`w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 ${item.payload.color === col ? 'ring-2 ring-indigo-500 scale-125' : ''}`}
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: PROTRACTOR ANGLE RULE ====== */}
                  {item.type === 'rule_angle' && (
                    <div className="space-y-3 font-semibold">
                      <div className="relative flex flex-col items-center bg-zinc-950/80 text-white rounded-xl p-2.5 border border-zinc-800/80 select-none shadow">
                        <div className="relative w-48 h-20 overflow-hidden flex items-end justify-center select-none pointer-events-none">
                          {/* Semi-circular protractor contour */}
                          <div className="absolute bottom-0 w-44 h-22 rounded-t-full border-2 border-dashed border-cyan-400/50 bg-cyan-500/5 flex items-end justify-center">
                            {/* Graduate marks around the semicircular arc */}
                            <span className="absolute bottom-0.5 left-1.5 text-[8px] font-bold text-cyan-300">180°</span>
                            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-cyan-300">90°</span>
                            <span className="absolute bottom-0.5 right-1.5 text-[8px] font-bold text-cyan-300">0°</span>
                          </div>
                          
                          {/* Center dot */}
                          <div className="w-2 h-2 rounded-full bg-cyan-400 z-10"></div>
                          
                          {/* Needle indicator line based on item.payload.angle */}
                          <div 
                            className="absolute bottom-1 w-20 h-0.5 origin-left bg-gradient-to-r from-cyan-400 to-transparent transition-transform duration-75 animate-pulse"
                            style={{
                              transform: `rotate(${-(item.payload.angle || 45)}deg)`,
                              left: '96px', // aligned to center
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                          <span>Ángulo de Regla:</span>
                          <span className="text-cyan-500 font-extrabold">{item.payload.angle || 45}°</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="180"
                          value={item.payload.angle || 45}
                          onChange={(e) => updateItemPayload(item.id, { angle: parseInt(e.target.value) })}
                          className="w-full accent-cyan-500 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg outline-none"
                        />
                        <p className="text-[10px] text-zinc-500 leading-normal font-medium max-h-12 overflow-y-auto">
                          Arrastra esta escuadra medidora encima de vectores o péndulos para calibrar sus valores de gravedad.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ====== CASE: SCALE RULER INSTRUMENT ====== */}
                  {item.type === 'rule_measure' && (
                    <div className="space-y-3 font-semibold">
                      <div className="relative flex flex-col items-center bg-amber-500/5 text-amber-100 rounded-xl p-2 border border-amber-500/20 select-none shadow">
                        {/* The virtual ruler itself */}
                        <div 
                          className="relative w-full h-10 bg-gradient-to-b from-amber-400/10 to-amber-500/25 border border-amber-400/40 rounded flex items-start px-2 py-1 select-none"
                        >
                          {/* Graduations list loop */}
                          <div className="w-full h-3 flex justify-between border-b border-amber-400/30 select-none pointer-events-none">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="flex flex-col items-center h-full">
                                <div className="w-0.5 h-1.5 bg-amber-400/80"></div>
                                <span className="text-[6px] text-amber-400/80 font-bold font-mono mt-0.5">{i}cm</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                          <span>Inclinación de Regla:</span>
                          <span className="text-amber-500 font-extrabold">{item.payload.angle || 0}°</span>
                        </div>
                        <input 
                          type="range"
                          min="-180"
                          max="180"
                          value={item.payload.angle || 0}
                          onChange={(e) => updateItemPayload(item.id, { angle: parseInt(e.target.value) })}
                          className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg outline-none"
                        />
                        <p className="text-[10px] text-zinc-500 leading-normal font-medium max-h-12 overflow-y-auto">
                          Usa esta regla interactiva para corroborar amplitudes de oscilación de péndulos.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ========================================================= */}
          {/* TAB 2: INTERACTIVE PHYSICS LABORATORY (Newton / Pendulum) */}
          {/* ========================================================= */}
          {activeLabTab === 'fisica' && (
            <div className="absolute inset-0 bg-slate-950 text-white p-6 overflow-y-auto z-40 flex flex-col gap-5 font-semibold">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-3 gap-3">
                <div>
                  <h3 className="text-base font-black text-cyan-400 flex items-center gap-1.5">🪐 Laboratorio de Física Clásica e Inercia</h3>
                  <p className="text-[11px] text-zinc-400">Prueba leyes de gravedad, oscilación armónica y vectores de fuerza con datos específicos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => exportPhysicsToBoard(physSelectedSim === 'pendulum' ? 'pendulum' : 'vector')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black py-2 px-4 rounded-xl shadow cursor-pointer transition-all active:scale-95"
                >
                  📥 Exportar datos a Pizarrón
                </button>
              </div>

              {/* Simulation Selector Pills */}
              <div className="flex bg-zinc-900 p-1 rounded-xl self-start border border-zinc-800/80 text-xs shadow-inner select-none pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setPhysSelectedSim('pendulum')}
                  className={`px-3.5 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                    physSelectedSim === 'pendulum' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ⏳ Movimiento de Péndulo (MAS)
                </button>
                <button
                  type="button"
                  onClick={() => setPhysSelectedSim('vectors')}
                  className={`px-3.5 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                    physSelectedSim === 'vectors' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  📦 Masa, Fuerza y Rozamiento
                </button>
              </div>

              {physSelectedSim === 'pendulum' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {/* Visual canvas animation pendulum */}
                  <div className="bg-zinc-900/60 rounded-2xl h-80 border border-zinc-800 relative flex flex-col items-center justify-start pt-12 overflow-hidden shadow-inner">
                    <div className="w-4 h-4 bg-zinc-700 rounded-full z-10 border border-zinc-500"></div>
                    
                    {/* Cord bob wire */}
                    <motion.div
                      animate={physIsRunning ? {
                        rotate: [-physAngle, physAngle, -physAngle]
                      } : { rotate: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: Math.max(1, Math.PI * 2 * Math.sqrt((physLength / 100) / physGravity)),
                        ease: "easeInOut"
                      }}
                      className="origin-top flex flex-col items-center"
                      style={{ height: `${physLength * 1.3}px` }}
                    >
                      <div className="w-1 bg-zinc-500 h-full"></div>
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-full border border-cyan-300 -mt-0.5 flex items-center justify-center text-[9px] font-black text-white shadow-2xl relative animate-pulse">
                        {physMass}kg
                      </div>
                    </motion.div>

                    {/* Vector guide annotations */}
                    <div className="absolute bottom-3 left-4 text-left text-[11px] text-zinc-500 space-y-0.5">
                      <p className="font-mono text-cyan-500/80 font-bold">Fórmula: T = 2π * √(L/g)</p>
                      <p>Periodo de oscilación: <span className="text-cyan-400 font-extrabold">{(Math.PI * 2 * Math.sqrt((physLength / 100) / physGravity)).toFixed(2)} segundos</span></p>
                    </div>
                  </div>

                  {/* Scientific controls details */}
                  <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80 space-y-4 text-left pointer-events-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-805/40">
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">Controles de Gravedad y Cuerda</h4>
                      <span className="text-[10px] bg-cyan-950 font-black text-cyan-400 border border-cyan-900 px-2 py-0.5 rounded-full">Probeta Virtual</span>
                    </div>
                    
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Gravedad Simulada: <span className="text-cyan-400">{physGravity} m/s²</span></span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setPhysGravity(1.62)} className="px-1.5 py-0.5 bg-zinc-850 rounded hover:bg-zinc-750 text-[8px] font-black">Luna</button>
                          <button type="button" onClick={() => setPhysGravity(9.8)} className="px-1.5 py-0.5 bg-zinc-850 rounded hover:bg-zinc-750 text-[8px] font-black">Tierra</button>
                          <button type="button" onClick={() => setPhysGravity(24.8)} className="px-1.5 py-0.5 bg-zinc-850 rounded hover:bg-zinc-750 text-[8px] font-black">Júpiter</button>
                        </div>
                      </div>
                      <input
                        type="range" min="1" max="25" step="0.5" value={physGravity}
                        onChange={(e) => setPhysGravity(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Poliéster Cuerda (L): <span className="text-cyan-400">{physLength} cm</span></span>
                      </div>
                      <input
                        type="range" min="50" max="150" step="5" value={physLength}
                        onChange={(e) => setPhysLength(parseInt(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Masa de Esfera (M): <span className="text-cyan-400">{physMass} kg</span></span>
                      </div>
                      <input
                        type="range" min="1" max="15" step="0.5" value={physMass}
                        onChange={(e) => setPhysMass(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPhysIsRunning(!physIsRunning)}
                        className={`flex-1 py-2 rounded-xl text-xs uppercase font-black tracking-wide text-center cursor-pointer transition-all active:scale-95 ${
                          physIsRunning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg'
                        }`}
                      >
                        {physIsRunning ? '❚❚ Pausar péndulo' : '▶ Activar oscilación'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {/* Sliding friction box representation */}
                  <div className="bg-zinc-900/60 rounded-2xl h-80 border border-zinc-800 relative flex flex-col justify-between p-4 overflow-hidden shadow-inner">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest text-left font-black block">Plano de Fuerzas Newtonianas</span>
                    
                    {/* Visual Floor and Sliding block */}
                    <div className="relative w-full h-28 border-b border-zinc-800 mt-2 flex items-end">
                      <motion.div
                        className="w-16 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded border border-indigo-500 flex flex-col items-center justify-center text-[10px] absolute z-10 font-bold shadow-2xl"
                        style={{ left: `${Math.min(220, physForceBoxX)}px` }}
                      >
                        <span className="text-[8px] text-zinc-400 uppercase tracking-wide">Masa</span>
                        <span className="font-extrabold">{physMass} kg</span>
                        
                        {/* Dynamic Force Arrow direction */}
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center">
                          <div className="w-8 h-1 bg-rose-500"></div>
                          <div className="w-1.5 h-1.5 border-t-2 border-r-2 border-rose-500 rotate-45 -ml-1"></div>
                        </div>
                      </motion.div>

                      {/* Spark particles for sliding blocks */}
                      {physForceVelocity > 1 && (
                        <span className="absolute bottom-1 w-2 h-2 text-yellow-400 text-xs animate-bounce" style={{ left: `${physForceBoxX + 10}px` }}>✨</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-zinc-400 mt-2 font-mono">
                      <div className="text-left">
                        <p>Fuerza Aplicada: <span className="text-rose-400 font-extrabold">{physForceN} N</span></p>
                        <p>Coef. de Roce (μ): <span className="text-zinc-300 font-extrabold">{physFrictionCoeff}</span></p>
                      </div>
                      <div className="text-right">
                        <p>Fuerza Fricción: <span className="text-amber-500 font-extrabold">{(physFrictionCoeff * physMass * 9.8).toFixed(1)} N</span></p>
                        <p>Aceleración: <span className="text-cyan-400 font-extrabold">
                          {physForceN > (physFrictionCoeff * physMass * 9.8) 
                            ? ((physForceN - (physFrictionCoeff * physMass * 9.8)) / physMass).toFixed(2) 
                            : '0.00'
                          } m/s²
                        </span></p>
                      </div>
                    </div>
                  </div>

                  {/* Newtonian controls */}
                  <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 space-y-4 text-left pointer-events-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-805/40">
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">Valores del Vector de Fuerza</h4>
                      <span className="text-[10px] bg-cyan-950 font-black text-cyan-400 border border-cyan-900 px-2 py-0.5 rounded-full">Inercia</span>
                    </div>
                    
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Fuerza Aplicada (Newtons): <span className="text-cyan-400">{physForceN} N</span></span>
                      </div>
                      <input
                        type="range" min="10" max="150" step="5" value={physForceN}
                        onChange={(e) => setPhysForceN(parseInt(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Masa del Bloque (M): <span className="text-cyan-400">{physMass} kg</span></span>
                      </div>
                      <input
                        type="range" min="2" max="15" step="0.5" value={physMass}
                        onChange={(e) => setPhysMass(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Coeficiente de Fricción (μ): <span className="text-cyan-400">{physFrictionCoeff}</span></span>
                      </div>
                      <input
                        type="range" min="0.05" max="0.60" step="0.05" value={physFrictionCoeff}
                        onChange={(e) => setPhysFrictionCoeff(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPhysForceIsRunning(!physForceIsRunning);
                          if (!physForceIsRunning) setPhysForceBoxX(0);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs uppercase font-black tracking-wide text-center cursor-pointer transition-all active:scale-95 ${
                          physForceIsRunning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg'
                        }`}
                      >
                        {physForceIsRunning ? '❚❚ Pausar bloque' : '▶ Aplicar Fuerza de Empuje'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: INTERACTIVE CHEMISTRY LABORATORY (Blender & Periodic) */}
          {/* ========================================================= */}
          {activeLabTab === 'quimica' && (
            <div className="absolute inset-0 bg-slate-950 text-white p-6 overflow-y-auto z-40 flex flex-col gap-5 font-semibold">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-3 gap-3">
                <div>
                  <h3 className="text-base font-black text-fuchsia-400 flex items-center gap-1.5 font-sans">🧪 Laboratorio de Reacciones Químicas Activas</h3>
                  <p className="text-[11px] text-zinc-400">Mezcla compuestos reactivos y consulta la información esencial de cada elemento.</p>
                </div>
                <button
                  type="button"
                  onClick={exportReactionToBoard}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-black py-2 px-4 rounded-xl shadow cursor-pointer transition-all active:scale-95"
                >
                  📥 Exportar ecuación a Pizarrón
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start text-left">
                {/* Panel 1: Reactivos Combustor */}
                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-805/85 space-y-4 shadow-sm">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-fuchsia-400">Mezclador Atómico de Reactivos</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pointer-events-auto">
                    <div className="space-y-1">
                      <span className="text-zinc-400">Compuesto Reactante A:</span>
                      <select
                        value={chemReactantA}
                        onChange={(e) => {
                          setChemReactantA(e.target.value);
                          runChemistryReaction(e.target.value, chemReactantB);
                        }}
                        className="w-full bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-lg p-2 text-white text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="HCl">Ácido Clorhídrico (HCl)</option>
                        <option value="H2">Hidrógeno (H₂)</option>
                        <option value="NaHCO3">Bicarbonato de Sodio (NaHCO₃)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400">Compuesto Reactante B:</span>
                      <select
                        value={chemReactantB}
                        onChange={(e) => {
                          setChemReactantB(e.target.value);
                          runChemistryReaction(chemReactantA, e.target.value);
                        }}
                        className="w-full bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-lg p-2 text-white text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="NaOH">Hidróxido de Sodio (NaOH)</option>
                        <option value="O2">Oxígeno (O₂)</option>
                        <option value="CH3COOH">Ácido Acético / Vinagre (CH₃COOH)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reaction Result Banner */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Ecuación de Combustión resultante</span>
                      <span className={`text-[8px] uppercase px-2 py-0.5 rounded font-black text-white ${
                        chemReactionOutput.safetyColor === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}>
                        {chemReactionOutput.safety}
                      </span>
                    </div>
                    <p className="text-base font-black tracking-tight text-fuchsia-300 font-mono">{chemReactionOutput.equation}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{chemReactionOutput.details}</p>
                  </div>
                </div>

                {/* Panel 2: Tabla periódica y detalles */}
                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-805/85 space-y-4">
                  <div className="flex justify-between items-center pointer-events-auto">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-fuchsia-400">Elementos Relevantes</h4>
                    <button
                      type="button"
                      onClick={() => exportElementToBoard(chemSelectedElement)}
                      className="bg-fuchsia-950 hover:bg-fuchsia-900 text-fuchsia-400 text-[10px] py-1 px-3 rounded border border-fuchsia-800 cursor-pointer"
                    >
                      Exportar Elemento {chemSelectedElement.symbol}
                    </button>
                  </div>

                  {/* Mini Grid of Elements */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pointer-events-auto">
                    {[
                      { symbol: 'H', name: 'Hidrógeno', z: 1, mass: 1.008, group: 'No metales', valency: 1, description: 'Es el elemento más liviano y abundante en el universo.' },
                      { symbol: 'He', name: 'Helio', z: 2, mass: 4.002, group: 'Gases nobles', valency: 0, description: 'Gas inerte ideal para globos, creado por fusión estelar.' },
                      { symbol: 'Li', name: 'Litio', z: 3, mass: 6.94, group: 'Alcalino', valency: 1, description: 'Metal alcalino muy ligero empleado en acumuladores de energía.' },
                      { symbol: 'C', name: 'Carbono', z: 6, mass: 12.011, group: 'No metales', valency: 4, description: 'Base fundamental de toda la vida orgánica planetaria.' },
                      { symbol: 'N', name: 'Nitrógeno', z: 7, mass: 14.007, group: 'No metales', valency: 3, description: 'Gas abundante que compone más del 78% del aire terrestre.' },
                      { symbol: 'O', name: 'Oxígeno', z: 8, mass: 15.999, group: 'Calcógeno', valency: 2, description: 'Agente vital para la respiración aeróbica animal.' },
                      { symbol: 'Na', name: 'Sodio', z: 11, mass: 22.99, group: 'Alcalino', valency: 1, description: 'Elemento inflamable en contacto físico con agua líquida.' },
                      { symbol: 'Fe', name: 'Hierro', z: 26, mass: 55.845, group: 'Transición', valency: '2,3', description: 'Metal tenaz estructural presente en el núcleo y hemoglobina.' },
                      { symbol: 'Cu', name: 'Cobre', z: 29, mass: 63.546, group: 'Transición', valency: '1,2', description: 'Excelente transmisor dúctil de señales electrodinámicas.' },
                      { symbol: 'Ag', name: 'Plata', z: 47, mass: 107.87, group: 'Transición', valency: 1, description: 'Noble conductor idóneo para orfebrería y electrónica.' },
                      { symbol: 'Au', name: 'Oro', z: 79, mass: 196.97, group: 'Transición', valency: '1,3', description: 'Metal noble inoxidable codiciado por su belleza estelar.' },
                      { symbol: 'U', name: 'Uranio', z: 92, mass: 238.03, group: 'Actínidos', valency: '3,4,5,6', description: 'Pesado actínido radioactivo combustible para fisión nuclear.' }
                    ].map((el) => (
                      <button
                        key={el.symbol}
                        type="button"
                        onClick={() => setChemSelectedElement(el)}
                        className={`p-1.5 rounded-lg border text-center flex flex-col justify-between cursor-pointer transition-all ${
                          chemSelectedElement?.symbol === el.symbol 
                            ? 'bg-fuchsia-600 border-white text-white shadow' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-[7px] text-zinc-500 block text-left font-bold">{el.z}</span>
                        <span className="text-xs font-black tracking-tighter leading-none">{el.symbol}</span>
                        <span className="text-[7px] opacity-75 truncate">{el.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Element Specs Card */}
                  {chemSelectedElement && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <p className="text-[8px] text-zinc-500 uppercase font-black">Ficha elemento químico</p>
                        <p className="text-xs font-black text-fuchsia-300">{chemSelectedElement.name} ({chemSelectedElement.symbol})</p>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{chemSelectedElement.description}</p>
                      </div>
                      <div className="border-l border-zinc-800 pl-3 space-y-0.5 leading-tight font-mono text-zinc-300">
                        <p>⚛️ Número Atómico Z: <span className="font-extrabold text-white">{chemSelectedElement.z}</span></p>
                        <p>⚖️ Peso Atómico: <span className="font-extrabold text-white">{chemSelectedElement.mass} u</span></p>
                        <p>🏷️ Clasificación: <span className="font-extrabold text-white">{chemSelectedElement.group}</span></p>
                        <p>🧪 Valencia: <span className="font-extrabold text-white">{chemSelectedElement.valency}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Animated "Tacho de Basura / Trash bin" situate in bottom right corner */}
          <div className="absolute bottom-4 right-4 z-40 select-none">
            <motion.div
              id="trash-bin"
              animate={{ 
                scale: trashScale,
                y: isTrashEating ? [0, -15, 10, 0] : 0, 
                rotate: isTrashEating ? [0, -10, 10, 0] : 0 
              }}
              transition={{
                scale: { type: "spring", damping: 10, stiffness: 200 },
                y: { type: "tween", duration: 0.8, ease: "easeInOut" },
                rotate: { type: "tween", duration: 0.8, ease: "easeInOut" }
              }}
              className={`p-5 rounded-3xl transition-transform ${
                trashScale > 1.1 
                  ? 'bg-rose-500 text-white shadow-xl scale-125 border-4 border-white' 
                  : 'bg-zinc-800 text-gray-400 dark:bg-zinc-900 border border-zinc-700/50 shadow'
              } flex flex-col items-center justify-center select-none w-20 h-20 shrink-0 select-none pointer-events-auto shadow-2xl relative`}
            >
              <Trash2 className={`w-8 h-8 ${trashScale > 1.1 ? 'animate-bounce text-white' : 'text-gray-400'}`} />
              
              {/* Little cute indicators for eats */}
              {trashScale > 1.1 ? (
                <span className="absolute -top-6 bg-rose-600 text-white text-[9px] font-black uppercase py-0.5 px-2 rounded-full border border-white tracking-wide animate-pulse">
                  ¡Sifón!
                </span>
              ) : (
                <span className="text-[9px] font-bold mt-1 uppercase tracking-wider text-gray-500">Tacho</span>
              )}
            </motion.div>
          </div>

        </div>

      </div>

        {/* Dedicated Whiteboard AI Assistant Chat Panel */}
        <AnimatePresence>
          {isAssistantOpen && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0.9, x: 50 }}
              animate={{ opacity: 1, scaleX: 1, x: 0 }}
              exit={{ opacity: 0, scaleX: 0.9, x: 50 }}
              transition={{ type: 'spring', damping: 24, stiffness: 170 }}
              className="absolute right-4 top-4 bottom-4 w-[335px] z-30 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-zinc-800 rounded-3xl flex flex-col min-h-0 select-none shadow-2xl overflow-hidden"
            >
              <div className="p-3.5 border-b border-gray-150 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white/0 dark:from-zinc-950/20 dark:to-transparent shrink-0">
                <div className="flex items-center gap-2 text-left">
                  <div className="p-1.5 rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/10 shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-zinc-100">
                      Asistente Científico IA
                    </h4>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Conectado a la Pizarra</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 z-10 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Deseas iniciar una nueva conversación de laboratorio? Se borrarán los mensajes actuales de esta pizarra.")) {
                        setChatMessages([
                          {
                            id: `msg-init-new-${Date.now()}`,
                            role: 'model',
                            text: '¡Sesión de chat de pizarra reseteada! 🪐🔬\n\n¿En qué experimento o simulación de Física/Química te asisto ahora?',
                            timestamp: new Date()
                          }
                        ]);
                      }
                    }}
                    title="Nuevo Chat de Pizarra (Limpiar conversación)"
                    className="p-1 px-1.5 text-slate-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-indigo-500 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-gray-200/40 dark:border-zinc-800 text-[9px] font-black uppercase tracking-wider"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Nuevo Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAssistantOpen(false)}
                    className="p-1 text-slate-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Cerrar panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Message Logs Area */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left custom-scrollbar scroll-smooth">
                {chatMessages.map((msg, index) => {
                  const isBot = msg.role === 'model';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2.5 items-start max-w-[85%] ${
                        isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl shrink-0 ${
                        isBot 
                          ? 'bg-indigo-50 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-indigo-600 text-white shadow'
                      }`}>
                        {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`space-y-1 ${isBot ? '' : 'text-right'}`}>
                        <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                          isBot 
                            ? 'bg-gray-50/70 dark:bg-zinc-850/60 text-slate-700 dark:text-zinc-300 border border-gray-100 dark:border-zinc-800' 
                            : 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-none'
                        }`}>
                          {renderFormattedMessageText(msg.text)}
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold px-1 block">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Bouncing Loader animation for wait state */}
                {isAssistantLoading && (
                  <div className="flex gap-2.5 items-start mr-auto max-w-[85%]">
                    <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-855/60 rounded-2xl p-3 border border-gray-100 dark:border-zinc-800 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 animate-bounce delay-0"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 animate-bounce delay-150"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 animate-bounce delay-300"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Pills Suggestion Desk */}
              <div className="px-3 pt-2 shrink-0 border-t border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/60">
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar-thin select-none">
                  {[
                    { text: '🌡️ Péndulo en Luna', input: 'Crea un simulador de péndulo con la gravedad lunar' },
                    { text: '🧪 Vaso con Ácido', input: 'Agrega un vaso de precipitado con compuesto ácido de pH y nivel de agua altos' },
                    { text: '🔥 Mechero Caliente', input: 'Agrega un mechero de Bunsen encendido al máximo de suministro de gas' },
                    { text: '⚛️ Masa e Inercia', input: 'Plantea un ejercicio de Ley de Gravitación en la pizarra' }
                  ].map((pill, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setAssistantInput(pill.input);
                      }}
                      className="shrink-0 px-2.5 py-1 text-[10px] bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-750 rounded-lg text-slate-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-zinc-700 transition-all font-semibold cursor-pointer active:scale-95"
                    >
                      {pill.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer Footer form */}
              <div className="p-3 border-t border-gray-150 dark:border-zinc-800 bg-gradient-to-b from-gray-50/20 to-gray-50 dark:from-transparent dark:to-zinc-900 shrink-0">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAssistantMessage();
                  }}
                  className="flex gap-1.5 relative"
                >
                  <input
                    id="input-board-assistant-msg"
                    type="text"
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    placeholder="Escribe lo que quieres en la pizarra..."
                    disabled={isAssistantLoading}
                    className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-750 text-xs rounded-2xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-zinc-100 disabled:opacity-60"
                  />
                  <button
                    id="btn-board-assistant-send"
                    type="submit"
                    disabled={!assistantInput.trim() || isAssistantLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 text-white disabled:bg-gray-100 dark:disabled:bg-zinc-800 text-xs disabled:text-slate-400 hover:bg-indigo-700 cursor-pointer active:scale-95 transition-all shadow-sm flex items-center justify-center"
                  >
                    {isAssistantLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
                  </button>
                </form>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
};
