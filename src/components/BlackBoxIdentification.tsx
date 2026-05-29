/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Activity, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Waves,
  Gauge,
  TrendingUp,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

// --- Types ---

type ComponentType = 'resistor' | 'capacitor' | 'inductor';
type TerminalId = 
  | 'fg_pos' | 'fg_neg' 
  | 'v_pos' | 'v_neg' 
  | 'bb_x' | 'bb_y' | 'bb_z' | 'bb_c' 
  | 'am_pos' | 'am_neg';

interface Terminal {
  id: TerminalId;
  label: string;
  color: string;
  offsetX: number;
  offsetY: number;
}

type ComponentId = 'fg' | 'v' | 'bb' | 'am';

interface Connection {
  from: TerminalId;
  to: TerminalId;
}

// --- Constants ---

const FREQ_MIN = 1000;
const FREQ_MAX = 8000;
const V_RMS = 1.0;

// --- Sub-components ---

const DigitalDisplay = ({ value, unit, label }: { value: string | number, unit: string, label: string }) => (
  <div className="bg-zinc-900 border-2 border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center shadow-inner">
    <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-mono">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-mono font-bold text-emerald-500 tabular-nums tracking-tighter">
        {value}
      </span>
      <span className="text-sm font-mono text-emerald-700">{unit}</span>
    </div>
  </div>
);

function TerminalNode({ terminal, active, highlighted, isConnected, onClick }: { terminal: Terminal, active: boolean, highlighted: boolean, isConnected: boolean, onClick: () => void }) {
  return (
    <div 
      className="absolute flex flex-col items-center pointer-events-auto -translate-x-1/2 -translate-y-1/2 group z-30"
      style={{ left: terminal.offsetX, top: terminal.offsetY }}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[7px] font-black text-white uppercase tracking-widest font-mono bg-zinc-800 px-1.5 py-0.5 rounded-sm shadow-sm border border-zinc-700">
            {terminal.label}
          </span>
          {isConnected && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] border border-emerald-500"
            />
          )}
        </div>
        <button
          onClick={onClick}
          className={cn(
            "w-8 h-8 rounded-full border-4 transition-all duration-200 relative flex items-center justify-center shadow-xl cursor-pointer",
            terminal.color,
            active 
              ? "ring-4 ring-emerald-400 scale-125 border-white z-50" 
              : highlighted
                ? "ring-4 ring-emerald-400/40 border-white z-40 scale-110"
                : "border-zinc-700 hover:scale-115 hover:border-white hover:shadow-2xl hover:z-50",
          )}
        >
          {/* Physical terminal look */}
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/40 border border-white/10 shadow-inner" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]" />
          
          {/* Active pulse effect */}
          {active && (
            <motion.div 
              layoutId="active-ring"
              className="absolute -inset-3 border-2 border-emerald-400 rounded-full animate-pulse opacity-60"
            />
          )}

          {/* Highlight glow */}
          {highlighted && !active && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              className="absolute -inset-3 bg-emerald-400/30 rounded-full blur-md -z-10"
            />
          )}

          {/* Hit area expansion (invisible) */}
          <div className="absolute -inset-6 rounded-full cursor-pointer" />
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN EXPORT COMPONENT: BlackBoxIdentification
   ========================================================================== */
export default function BlackBoxIdentification() {
  // State
  const [frequency, setFrequency] = useState(1000);
  const [amplitude, setAmplitude] = useState(1.0);
  const [resValue, setResValue] = useState(1000); // Ohms
  const [capValue, setCapValue] = useState(0.1); // uF
  const [indValue, setIndValue] = useState(100); // mH
  const [isPowered, setIsPowered] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dragStart, setDragStart] = useState<TerminalId | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Component positions
  const [compPos] = useState<Record<ComponentId, { x: number, y: number }>>({
    fg: { x: 30, y: 30 },
    v: { x: 230, y: 340 },
    bb: { x: 230, y: 50 },
    am: { x: 550, y: 30 }
  });

  // Mapping of X, Y, Z to components
  const [componentMap, setComponentMap] = useState<Record<'bb_x' | 'bb_y' | 'bb_z', ComponentType>>({
    bb_x: 'resistor',
    bb_y: 'capacitor',
    bb_z: 'inductor'
  });

  // User's guesses for each terminal
  const [guesses, setGuesses] = useState<Record<'bb_x' | 'bb_y' | 'bb_z', ComponentType | null>>({
    bb_x: null,
    bb_y: null,
    bb_z: null
  });
  
  const [showResult, setShowResult] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize random mapping
  const randomizeComponents = () => {
    const types: ComponentType[] = ['resistor', 'capacitor', 'inductor'];
    const shuffled = [...types].sort(() => Math.random() - 0.5);
    setComponentMap({
      bb_x: shuffled[0],
      bb_y: shuffled[1],
      bb_z: shuffled[2]
    });
  };

  useEffect(() => {
    randomizeComponents();
  }, []);

  // Terminal definitions with relative offsets
  const terminalDefinitions: Record<TerminalId, Omit<Terminal, 'x' | 'y'>> = {
    fg_pos: { id: 'fg_pos', label: 'OUT +', color: 'bg-red-600', offsetX: 176, offsetY: 80 },
    fg_neg: { id: 'fg_neg', label: 'OUT -', color: 'bg-zinc-900', offsetX: 176, offsetY: 160 },
    
    v_pos: { id: 'v_pos', label: 'V +', color: 'bg-red-600', offsetX: 224, offsetY: 40 },
    v_neg: { id: 'v_neg', label: 'V -', color: 'bg-zinc-900', offsetX: 224, offsetY: 90 },

    bb_c: { id: 'bb_c', label: 'C', color: 'bg-zinc-500', offsetX: 128, offsetY: 0 },
    bb_x: { id: 'bb_x', label: 'X', color: 'bg-zinc-700', offsetX: 50, offsetY: 256 },
    bb_y: { id: 'bb_y', label: 'Y', color: 'bg-zinc-700', offsetX: 128, offsetY: 256 },
    bb_z: { id: 'bb_z', label: 'Z', color: 'bg-zinc-700', offsetX: 206, offsetY: 256 },
    
    am_pos: { id: 'am_pos', label: 'mA +', color: 'bg-red-600', offsetX: 0, offsetY: 80 },
    am_neg: { id: 'am_neg', label: 'mA -', color: 'bg-zinc-900', offsetX: 0, offsetY: 160 },
  };

  // Calculate absolute terminal positions based on component positions
  const terminals = useMemo(() => {
    const result: Record<TerminalId, Terminal> = {} as any;
    
    (Object.keys(terminalDefinitions) as TerminalId[]).forEach(id => {
      const def = terminalDefinitions[id];
      let parentPos = { x: 0, y: 0 };
      
      if (id.startsWith('fg')) parentPos = compPos.fg;
      else if (id.startsWith('v')) parentPos = compPos.v;
      else if (id.startsWith('bb')) parentPos = compPos.bb;
      else if (id.startsWith('am')) parentPos = compPos.am;
      
      result[id] = {
        ...def,
        x: parentPos.x + def.offsetX,
        y: parentPos.y + def.offsetY
      } as Terminal;
    });
    
    return result;
  }, [compPos]);

  const areConnected = (start: TerminalId, end: TerminalId, visited = new Set<TerminalId>()): boolean => {
    if (start === end) return true;
    visited.add(start);
    
    const neighbors = connections
      .filter(c => c.from === start || c.to === start)
      .map(c => c.from === start ? c.to : c.from);
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor) && areConnected(neighbor, end, visited)) {
        return true;
      }
    }
    return false;
  };

  // Check which component is active in the circuit
  const activeComponent = useMemo(() => {
    if (!isPowered) return null;
    
    // Find which FG terminal is connected to the commutator (BB_C)
    const fgForC = areConnected('fg_pos', 'bb_c') ? 'fg_pos' : (areConnected('fg_neg', 'bb_c') ? 'fg_neg' : null);
    if (!fgForC) return null;

    const otherFG = fgForC === 'fg_pos' ? 'fg_neg' : 'fg_pos';

    // Find which AM terminal is connected to the other FG terminal
    const amForFG = areConnected(otherFG, 'am_pos') ? 'am_pos' : (areConnected(otherFG, 'am_neg') ? 'am_neg' : null);
    if (!amForFG) return null;

    const otherAM = amForFG === 'am_pos' ? 'am_neg' : 'am_pos';

    // Check if the other AM terminal is connected to any of the component terminals
    if (areConnected(otherAM, 'bb_x')) return componentMap.bb_x;
    if (areConnected(otherAM, 'bb_y')) return componentMap.bb_y;
    if (areConnected(otherAM, 'bb_z')) return componentMap.bb_z;

    return null;
  }, [connections, isPowered, componentMap]);

  const isVoltmeterConnected = useMemo(() => {
    const vPosToFGPos = areConnected('v_pos', 'fg_pos');
    const vPosToFGNeg = areConnected('v_pos', 'fg_neg');
    const vNegToFGPos = areConnected('v_neg', 'fg_pos');
    const vNegToFGNeg = areConnected('v_neg', 'fg_neg');

    const hasCorrectPath = (vPosToFGPos && vNegToFGNeg) || (vPosToFGNeg && vNegToFGPos);
    const isShorted = areConnected('v_pos', 'v_neg');
    
    return hasCorrectPath && !isShorted;
  }, [connections]);

  // Calculate Current (mA)
  const current = useMemo(() => {
    if (!isPowered || !activeComponent) return 0;

    let impedance = 0;
    const f = frequency;

    if (activeComponent === 'resistor') {
      impedance = resValue;
    } else if (activeComponent === 'capacitor') {
      impedance = 1 / (2 * Math.PI * f * (capValue * 1e-6));
    } else if (activeComponent === 'inductor') {
      impedance = 2 * Math.PI * f * (indValue * 1e-3);
    }

    const totalImpedance = impedance + 10;
    const i_rms = (V_RMS * amplitude) / totalImpedance;
    const noise = 1 + (Math.random() - 0.5) * 0.01;
    return i_rms * 1000 * noise;
  }, [isPowered, activeComponent, frequency, amplitude, resValue, capValue, indValue]);

  // Generate data for the frequency response chart
  const chartData = useMemo(() => {
    const data = [];
    const steps = 20;
    const stepSize = (FREQ_MAX - FREQ_MIN) / steps;

    for (let i = 0; i <= steps; i++) {
      const f = FREQ_MIN + i * stepSize;
      let impedance = 0;
      let currentVal = 0;

      if (activeComponent && isPowered) {
        if (activeComponent === 'resistor') {
          impedance = resValue;
        } else if (activeComponent === 'capacitor') {
          impedance = 1 / (2 * Math.PI * f * (capValue * 1e-6));
        } else if (activeComponent === 'inductor') {
          impedance = 2 * Math.PI * f * (indValue * 1e-3);
        }
        const totalImpedance = impedance + 10;
        currentVal = ((V_RMS * amplitude) / totalImpedance) * 1000;
      }

      data.push({
        frequency: f / 1000,
        current: parseFloat((currentVal || 0).toFixed(3))
      });
    }
    return data;
  }, [activeComponent, isPowered, amplitude, resValue, capValue, indValue]);

  const connectedTerminals = useMemo(() => {
    const set = new Set<TerminalId>();
    connections.forEach(c => {
      set.add(c.from);
      set.add(c.to);
    });
    return set;
  }, [connections]);

  // Handlers
  const handleTerminalClick = (id: TerminalId) => {
    if (dragStart === null) {
      setDragStart(id);
    } else if (dragStart === id) {
      setDragStart(null);
    } else {
      if (!connections.some(c => (c.from === dragStart && c.to === id) || (c.from === id && c.to === dragStart))) {
        setConnections([...connections, { from: dragStart, to: id }]);
      }
      setDragStart(null);
    }
  };

  const removeConnection = (index: number) => {
    setConnections(connections.filter((_, i) => i !== index));
  };

  const resetLab = () => {
    randomizeComponents();
    setConnections([]);
    setIsPowered(false);
    setGuesses({ bb_x: null, bb_y: null, bb_z: null });
    setShowResult(false);
    toast.info("Lab reset. Components X, Y, Z have been reshuffled.");
  };

  const checkResults = () => {
    const isXCorrect = guesses.bb_x === componentMap.bb_x;
    const isYCorrect = guesses.bb_y === componentMap.bb_y;
    const isZCorrect = guesses.bb_z === componentMap.bb_z;

    if (isXCorrect && isYCorrect && isZCorrect) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      toast.success("Perfect! All components correctly identified.");
    } else {
      toast.error("Some identifications are incorrect. Keep analyzing!");
    }
    setShowResult(true);
  };

  const exportToExcel = () => {
    const getParamValue = (type: ComponentType) => {
      if (type === 'resistor') return `${resValue} Ω`;
      if (type === 'capacitor') return `${capValue} µF`;
      if (type === 'inductor') return `${indValue} mH`;
      return '';
    };

    const calculateCurrent = (type: ComponentType, f: number) => {
      let impedance = 0;
      if (type === 'resistor') {
        impedance = resValue;
      } else if (type === 'capacitor') {
        impedance = 1 / (2 * Math.PI * f * (capValue * 1e-6));
      } else if (type === 'inductor') {
        impedance = 2 * Math.PI * f * (indValue * 1e-3);
      }
      const totalImpedance = impedance + 10;
      return ((V_RMS * amplitude) / totalImpedance) * 1000;
    };

    const frequencies = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000];

    const data = [
      ['Terminal Identification Results'],
      ['Terminal', 'Actual Component', 'User Guess', 'Status', 'Parameter Value'],
      ['X', componentMap.bb_x, guesses.bb_x, guesses.bb_x === componentMap.bb_x ? 'Correct' : 'Incorrect', getParamValue(componentMap.bb_x)],
      ['Y', componentMap.bb_y, guesses.bb_y, guesses.bb_y === componentMap.bb_y ? 'Correct' : 'Incorrect', getParamValue(componentMap.bb_y)],
      ['Z', componentMap.bb_z, guesses.bb_z, guesses.bb_z === componentMap.bb_z ? 'Correct' : 'Incorrect', getParamValue(componentMap.bb_z)],
      [],
      ['Frequency Response Data (mA)'],
      ['Frequency (kHz)', 'Terminal X', 'Terminal Y', 'Terminal Z'],
      ...frequencies.map(f => [
        f / 1000,
        (calculateCurrent(componentMap.bb_x, f) || 0).toFixed(3),
        (calculateCurrent(componentMap.bb_y, f) || 0).toFixed(3),
        (calculateCurrent(componentMap.bb_z, f) || 0).toFixed(3)
      ]),
      [],
      ['Test Metadata'],
      ['Current Frequency Setting', `${((frequency || 0) / 1000).toFixed(2)} kHz`],
      ['Amplitude Setting', `${(amplitude || 0).toFixed(2)} Vrms`],
      ['Timestamp', new Date().toLocaleString()]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lab Results");
    XLSX.writeFile(wb, "BlackBox_Lab_Results.xlsx");
    toast.success("Results exported to Excel!");
  };

  // Mouse tracking for drawing the active wire
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 font-sans selection:bg-emerald-100 pb-20">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider text-[10px]">Virtual Lab</Badge>
              <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 uppercase tracking-wider text-[10px]">Physics 101</Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Black Box Identification</h1>
            <p className="text-zinc-500 mt-1 max-w-xl text-xs italic leading-snug">
              Conceptualized by Dr. Abhiram J, Assistant Professor, Department of Physics, Sir M. Visvesvaraya Institute of Technology, Bengaluru - 562 157
            </p>
            <p className="text-zinc-600 mt-3 max-w-xl text-sm leading-relaxed">
              The Black Box contains a Resistor, a Capacitor, and an Inductor connected to a common terminal <strong>C</strong>. 
              Identify which terminal (<strong>X, Y, Z</strong>) corresponds to which component.
            </p>
          </div>
          <Button variant="outline" onClick={resetLab} className="group cursor-pointer">
            <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-[-120deg] transition-transform" />
            Reset Experiment
          </Button>
        </header>

        {/* Wiring Guide */}
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-xs font-bold uppercase tracking-wider">Wiring Guide</AlertTitle>
          <AlertDescription className="text-[11px] leading-relaxed">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Voltmeter:</strong> Connect end-to-end directly to the Function Generator (FG+ to V+, FG- to V-).</li>
              <li><strong>Series Loop:</strong> Connect one FG terminal to Black Box <strong>C</strong> (Commutator).</li>
              <li>Connect Black Box <strong>X, Y, or Z</strong> to one Ammeter terminal.</li>
              <li>Connect the other Ammeter terminal back to the remaining FG terminal to complete the circuit.</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Lab Area */}
          <Card className="lg:col-span-8 overflow-hidden border-zinc-200 shadow-sm bg-white">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Circuit Workbench
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold text-zinc-400 hover:text-red-500 cursor-pointer"
                    onClick={() => setConnections([])}
                  >
                    Clear All Wires
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", isPowered ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-zinc-300")} />
                    <span className="text-[10px] font-mono uppercase text-zinc-500">{isPowered ? "System Live" : "System Standby"}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative h-[500px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]" ref={containerRef}>
              
              {/* SVG Layer for Wires */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {connections.map((conn, idx) => {
                  const from = terminals[conn.from];
                  const to = terminals[conn.to];
                  return (
                    <g key={`${conn.from}-${conn.to}-${idx}`} className="group pointer-events-auto cursor-pointer" onClick={() => removeConnection(idx)}>
                      <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        d={`M ${from.x} ${from.y} C ${from.x} ${from.y + 80}, ${to.x} ${to.y + 80}, ${to.x} ${to.y}`}
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="16"
                        fill="none"
                        className="hover:stroke-red-100 transition-colors"
                      />
                      <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        d={`M ${from.x} ${from.y} C ${from.x} ${from.y + 80}, ${to.x} ${to.y + 80}, ${to.x} ${to.y}`}
                        stroke={conn.from.includes('pos') || conn.to.includes('pos') ? "#ef4444" : "#27272a"}
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        className="group-hover:stroke-red-500 transition-colors"
                      />
                    </g>
                  );
                })}

                {/* Active Dragging Wire */}
                {dragStart && (
                  <path
                    d={`M ${terminals[dragStart].x} ${terminals[dragStart].y} C ${terminals[dragStart].x} ${terminals[dragStart].y + 80}, ${mousePos.x} ${mousePos.y + 80}, ${mousePos.x} ${mousePos.y}`}
                    stroke="#a1a1aa"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    fill="none"
                  />
                )}
              </svg>

              {/* Components Visualization */}
              <div className="absolute inset-0 p-8 pointer-events-none">
                
                {/* Function Generator */}
                <motion.div 
                  style={{ x: compPos.fg.x, y: compPos.fg.y }}
                  className="absolute w-44 h-56 bg-zinc-800 rounded-xl border-4 border-zinc-700 shadow-2xl flex flex-col pointer-events-auto z-20 overflow-hidden group/fg transition-transform"
                >
                  <div className="bg-zinc-700 p-2 text-[10px] font-mono text-zinc-400 flex justify-between items-center">
                    <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> FG-8000</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[8px] font-bold uppercase", isPowered ? "text-emerald-400" : "text-zinc-500")}>
                        {isPowered ? "ON" : "OFF"}
                      </span>
                      <button 
                        onClick={() => setIsPowered(!isPowered)}
                        className={cn(
                          "w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none cursor-pointer",
                          isPowered ? "bg-emerald-600" : "bg-zinc-600"
                        )}
                      >
                        <motion.div 
                          animate={{ x: isPowered ? 16 : 2 }}
                          className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="space-y-3">
                      <div className="bg-black/60 rounded-lg p-3 border border-zinc-700/50 shadow-inner">
                        <div className="text-[8px] text-zinc-500 uppercase mb-1 font-mono tracking-wider">Output Voltage</div>
                        <div className="text-xl font-mono font-bold text-emerald-400 flex items-baseline gap-1">
                          {(amplitude || 0).toFixed(2)} <span className="text-[10px] text-emerald-600">Vrms</span>
                        </div>
                      </div>
                      <div className="bg-black/60 rounded-lg p-3 border border-zinc-700/50 shadow-inner">
                        <div className="text-[8px] text-zinc-500 uppercase mb-1 font-mono tracking-wider">Frequency</div>
                        <div className="text-xl font-mono font-bold text-amber-400 flex items-baseline gap-1">
                          {((frequency || 0) / 1000).toFixed(2)} <span className="text-[10px] text-amber-600">kHz</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Terminals */}
                  <TerminalNode 
                    terminal={terminals.fg_pos} 
                    active={dragStart === 'fg_pos'} 
                    highlighted={!!dragStart && dragStart !== 'fg_pos'}
                    isConnected={connectedTerminals.has('fg_pos')}
                    onClick={() => handleTerminalClick('fg_pos')} 
                  />
                  <TerminalNode 
                    terminal={terminals.fg_neg} 
                    active={dragStart === 'fg_neg'} 
                    highlighted={!!dragStart && dragStart !== 'fg_neg'}
                    isConnected={connectedTerminals.has('fg_neg')}
                    onClick={() => handleTerminalClick('fg_neg')} 
                  />
                </motion.div>

                {/* Voltmeter */}
                <motion.div 
                  style={{ x: compPos.v.x, y: compPos.v.y }}
                  className="absolute w-56 h-32 bg-zinc-100 rounded-xl border-4 border-zinc-200 shadow-xl flex flex-col pointer-events-auto z-20 overflow-hidden transition-transform"
                >
                  <div className="bg-zinc-200 p-2 text-[10px] font-mono text-zinc-500 flex justify-between items-center">
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> VOLTMETER</span>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center">
                    <div className="bg-zinc-900 rounded-xl p-4 border-2 border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex-1">
                      <div className="text-[8px] text-zinc-500 uppercase mb-1 font-mono tracking-widest text-center">Vrms</div>
                      <div className="text-3xl font-mono font-bold text-emerald-500 tabular-nums text-center tracking-tighter">
                        {isPowered ? (isVoltmeterConnected ? (amplitude || 0).toFixed(3) : "N/A") : "0.000"}
                      </div>
                    </div>
                  </div>
                  {/* Terminals */}
                  <TerminalNode 
                    terminal={terminals.v_pos} 
                    active={dragStart === 'v_pos'} 
                    highlighted={!!dragStart && dragStart !== 'v_pos'}
                    isConnected={connectedTerminals.has('v_pos')}
                    onClick={() => handleTerminalClick('v_pos')} 
                  />
                  <TerminalNode 
                    terminal={terminals.v_neg} 
                    active={dragStart === 'v_neg'} 
                    highlighted={!!dragStart && dragStart !== 'v_neg'}
                    isConnected={connectedTerminals.has('v_neg')}
                    onClick={() => handleTerminalClick('v_neg')} 
                  />
                </motion.div>

                {/* Black Box / Commutator Unit */}
                <motion.div 
                  style={{ x: compPos.bb.x, y: compPos.bb.y }}
                  className="absolute w-64 h-64 bg-zinc-900 rounded-3xl border-8 border-zinc-800 shadow-2xl flex flex-col items-center justify-center pointer-events-auto z-20 group/bb transition-transform"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                  <div className="relative mb-4">
                    <HelpCircle className="w-16 h-16 text-zinc-800 relative z-10" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-mono text-[10px] text-zinc-500 tracking-[0.4em] uppercase">Black Box Unit</span>
                    <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-600">4-TERMINAL SETUP</Badge>
                  </div>
                  
                  {/* Terminals */}
                  <TerminalNode 
                    terminal={terminals.bb_c} 
                    active={dragStart === 'bb_c'} 
                    highlighted={!!dragStart && dragStart !== 'bb_c'}
                    isConnected={connectedTerminals.has('bb_c')}
                    onClick={() => handleTerminalClick('bb_c')} 
                  />
                  <TerminalNode 
                    terminal={terminals.bb_x} 
                    active={dragStart === 'bb_x'} 
                    highlighted={!!dragStart && dragStart !== 'bb_x'}
                    isConnected={connectedTerminals.has('bb_x')}
                    onClick={() => handleTerminalClick('bb_x')} 
                  />
                  <TerminalNode 
                    terminal={terminals.bb_y} 
                    active={dragStart === 'bb_y'} 
                    highlighted={!!dragStart && dragStart !== 'bb_y'}
                    isConnected={connectedTerminals.has('bb_y')}
                    onClick={() => handleTerminalClick('bb_y')} 
                  />
                  <TerminalNode 
                    terminal={terminals.bb_z} 
                    active={dragStart === 'bb_z'} 
                    highlighted={!!dragStart && dragStart !== 'bb_z'}
                    isConnected={connectedTerminals.has('bb_z')}
                    onClick={() => handleTerminalClick('bb_z')} 
                  />
                </motion.div>

                {/* Ammeter Unit */}
                <motion.div 
                  style={{ x: compPos.am.x, y: compPos.am.y }}
                  className="absolute w-44 h-56 bg-zinc-100 rounded-xl border-4 border-zinc-200 shadow-xl flex flex-col pointer-events-auto z-20 overflow-hidden group/am transition-transform"
                >
                  <div className="bg-zinc-200 p-2 text-[10px] font-mono text-zinc-500 flex justify-between items-center">
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> AM-90D</span>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center gap-6">
                    <div className="bg-zinc-900 rounded-xl p-4 border-2 border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      <div className="text-[8px] text-zinc-500 uppercase mb-2 font-mono tracking-widest text-center">Current (mA)</div>
                      <div className="text-2xl font-mono font-bold text-emerald-500 tabular-nums text-center tracking-tighter">
                        {current && current > 0 ? current.toFixed(3) : "0.000"}
                      </div>
                    </div>
                  </div>
                  {/* Terminals */}
                  <TerminalNode 
                    terminal={terminals.am_pos} 
                    active={dragStart === 'am_pos'} 
                    highlighted={!!dragStart && dragStart !== 'am_pos'}
                    isConnected={connectedTerminals.has('am_pos')}
                    onClick={() => handleTerminalClick('am_pos')} 
                  />
                  <TerminalNode 
                    terminal={terminals.am_neg} 
                    active={dragStart === 'am_neg'} 
                    highlighted={!!dragStart && dragStart !== 'am_neg'}
                    isConnected={connectedTerminals.has('am_neg')}
                    onClick={() => handleTerminalClick('am_neg')} 
                  />
                </motion.div>

              </div>

              {/* Instructions Overlay */}
              <div className="absolute bottom-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-lg p-3 text-[11px] text-zinc-600 max-w-xs shadow-sm pointer-events-auto">
                  <p className="font-bold text-zinc-900 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Connection Guide:
                  </p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Connect <strong>FG</strong> to <strong>Voltmeter</strong> to verify 1V.</li>
                    <li>Connect <strong>FG+</strong> to <strong>C</strong> (Common).</li>
                    <li>Connect one of <strong>X, Y, Z</strong> to <strong>mA+</strong>.</li>
                    <li>Connect <strong>mA-</strong> to <strong>FG-</strong>.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls & Analysis */}
          <div className="lg:col-span-4 space-y-6">
            {/* Signal Control */}
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Signal Control</CardTitle>
                <CardDescription>Adjust generator parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  {/* Frequency */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Frequency</label>
                      <div className="text-2xl font-mono font-bold text-zinc-900">
                        {((frequency || 0) / 1000).toFixed(2)} <span className="text-sm font-normal text-zinc-400">kHz</span>
                      </div>
                    </div>
                    <Slider
                      value={[frequency]}
                      min={FREQ_MIN}
                      max={FREQ_MAX}
                      step={100}
                      onValueChange={(val) => {
                        const v = Array.isArray(val) ? val[0] : val;
                        if (typeof v === 'number') setFrequency(v);
                      }}
                      className="py-4 cursor-pointer"
                    />
                  </div>

                  {/* Amplitude */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amplitude (Vrms)</label>
                      <div className="text-2xl font-mono font-bold text-zinc-900">
                        {(amplitude || 0).toFixed(2)} <span className="text-sm font-normal text-zinc-400">V</span>
                      </div>
                    </div>
                    <Slider
                      value={[amplitude]}
                      min={0.1}
                      max={2.0}
                      step={0.05}
                      onValueChange={(val) => {
                        const v = Array.isArray(val) ? val[0] : val;
                        if (typeof v === 'number') setAmplitude(v);
                      }}
                      className="py-4 cursor-pointer"
                    />
                  </div>
                </div>

                <Alert className="bg-zinc-50 border-zinc-200">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-tight">Theory & Setup</AlertTitle>
                  <AlertDescription className="text-[11px] text-zinc-600 leading-relaxed">
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span><strong>Resistor:</strong> Constant current</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span><strong>Capacitor:</strong> Current ↑ with Freq</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span><strong>Inductor:</strong> Current ↓ with Freq</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Frequency Response Chart */}
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Frequency Response
                </CardTitle>
                <CardDescription className="text-[10px]">Current (mA) vs Frequency (kHz)</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="frequency" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#888' }}
                      unit="k"
                    />
                    <YAxis 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#888' }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label) => `${label} kHz`}
                      formatter={(value: number) => [`${value} mA`, 'Current']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 4, fill: '#10b981' }}
                      animationDuration={500}
                    />
                    {activeComponent && isPowered && (
                      <ReferenceDot 
                        x={frequency / 1000} 
                        y={current} 
                        r={5} 
                        fill="#ef4444" 
                        stroke="#fff" 
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Component Parameters */}
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Component Parameters
                </CardTitle>
                <CardDescription className="text-[10px]">Adjust internal component values</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Resistance (Ω)</label>
                    <span className="text-xs font-mono text-emerald-600 font-bold">{resValue || 0} Ω</span>
                  </div>
                  <Slider 
                    value={[resValue]} 
                    min={100} 
                    max={5000} 
                    step={100}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      if (typeof v === 'number') setResValue(v);
                    }}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Capacitance (µF)</label>
                    <span className="text-xs font-mono text-emerald-600 font-bold">{(capValue || 0).toFixed(2)} µF</span>
                  </div>
                  <Slider 
                    value={[capValue]} 
                    min={0.01} 
                    max={1.0} 
                    step={0.01}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      if (typeof v === 'number') setCapValue(v);
                    }}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Inductance (mH)</label>
                    <span className="text-xs font-mono text-emerald-600 font-bold">{indValue || 0} mH</span>
                  </div>
                  <Slider 
                    value={[indValue]} 
                    min={10} 
                    max={500} 
                    step={10}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      if (typeof v === 'number') setIndValue(v);
                    }}
                    className="cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Identification */}
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-zinc-900 text-white">
                <CardTitle className="text-lg">Identification</CardTitle>
                <CardDescription className="text-zinc-400">Map terminals to components</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {(['bb_x', 'bb_y', 'bb_z'] as const).map((terminal) => (
                  <div key={terminal} className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                      Terminal {terminal.split('_')[1].toUpperCase()}
                      {showResult && (
                        guesses[terminal] === componentMap[terminal] 
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          : <XCircle className="w-3 h-3 text-red-500" />
                      )}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['resistor', 'capacitor', 'inductor'] as const).map((type) => (
                        <Button
                          key={type}
                          variant={guesses[terminal] === type ? "default" : "outline"}
                          size="sm"
                          className="text-[10px] h-8 px-1 cursor-pointer"
                          onClick={() => setGuesses({ ...guesses, [terminal]: type })}
                          disabled={showResult}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}

                <Button 
                  className="w-full h-12 font-bold uppercase tracking-widest cursor-pointer"
                  onClick={checkResults}
                  disabled={showResult || !guesses.bb_x || !guesses.bb_y || !guesses.bb_z}
                >
                  Check Identification
                </Button>

                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-zinc-100"
                    >
                      <div className="bg-zinc-50 rounded-lg p-3 text-[11px] font-mono text-zinc-600 space-y-1">
                        <p className="font-bold text-zinc-900 mb-2">Correct Mapping:</p>
                        <p>X: {componentMap.bb_x}</p>
                        <p>Y: {componentMap.bb_y}</p>
                        <p>Z: {componentMap.bb_z}</p>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-200 gap-2 cursor-pointer"
                          onClick={exportToExcel}
                        >
                          <Download className="w-4 h-4" />
                          Export to Excel
                        </Button>

                        <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs font-bold underline cursor-pointer" onClick={resetLab}>
                          Reshuffle & Try Again
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Credentials */}
      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-zinc-200 pb-12">
        <div className="flex flex-col items-center text-center space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.2em]">Conceptualized & Developed By</p>
          <p className="text-sm font-bold text-zinc-800">Dr. Abhiram J</p>
          <p className="text-xs text-zinc-500">
            Assistant Professor, Department of Physics<br />
            Sir M. Visvesvaraya Institute of Technology, Bengaluru - 562 157
          </p>
        </div>
      </footer>
    </div>
  );
}
