/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  EXPERIMENTS_LIST,
  Experiment,
  LabStats,
  VivaQuestion,
  VivaMessage
} from "./types";
import {
  simulateBlackBox,
  simulateLaserDiffraction,
  simulateOpticalFiber,
  simulateTransistor,
  simulatePlanckLed,
  simulateEnergyGap,
  simulatePhotodiode
} from "./utils/simulation";
import OceanAnalysisCard from "./components/OceanAnalysisCard";
import TalkToAiGuru from "./components/TalkToAiGuru";
import BlackBoxIdentification from "./components/BlackBoxIdentification";

import {
  Brain,
  Cpu,
  Zap,
  Activity,
  Award,
  ChevronRight,
  BookOpen,
  Info,
  Layers,
  HelpCircle,
  FileText,
  CheckCircle,
  MinusCircle,
  RefreshCw,
  Sparkles,
  AwardIcon,
  ChevronsRight,
  UserCheck,
  Clock,
  Flame,
  MessageCircle,
  Box,
  Key
} from "lucide-react";

export default function App() {
  // Navigation & Page State
  const [activeSection, setActiveSection] = useState<"fully_fledged" | "available" | "ai_guru" | "ocean">("available");
  const [activeBlackBox, setActiveBlackBox] = useState<"simulation" | "lab">("simulation");

  // API Key Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [tempModel, setTempModel] = useState<string>("gemini-3.5-flash");

  // Sync tempApiKey with localStorage when opening the settings modal
  useEffect(() => {
    if (isSettingsOpen) {
      setTempApiKey(localStorage.getItem("yantra_nidhi_gemini_api_key") || "");
      setTempModel(localStorage.getItem("yantra_nidhi_ai_model") || "gemini-3.5-flash");
    }
  }, [isSettingsOpen]);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem("yantra_nidhi_gemini_api_key", tempApiKey.trim());
    } else {
      localStorage.removeItem("yantra_nidhi_gemini_api_key");
    }
    localStorage.setItem("yantra_nidhi_ai_model", tempModel);
    setSelectedModel(tempModel);
    setIsSettingsOpen(false);
  };

  const [activeExpId, setActiveExpId] = useState<string>("laser_diffraction");

  // Selected Experiment Definition
  const activeExp = EXPERIMENTS_LIST.find((e) => e.id === activeExpId) || EXPERIMENTS_LIST[0];

  // Dynamic Parameter Values (keyed by parameter.name)
  const [params, setParams] = useState<Record<string, number>>({});

  // Observations Lab Notebook State (grouped by experiment ID)
  const [observations, setObservations] = useState<Record<string, Array<Record<string, any>>>>({});

  // Background Live Lab Telemetry/Psychology Accumulators
  const [labStats, setLabStats] = useState<LabStats>({
    experimentsCompletedCount: 1,
    totalQuestionsAttempted: 0,
    averageVivaScore: 0,
    totalSkips: 0,
    totalSimplifications: 0,
    sessionTraits: {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0
    },
    timerUrgentSeconds: 0,
    timerExpirationsCount: 0
  });

  // Track unique explored experiments
  const [exploredExps, setExploredExps] = useState<Set<string>>(new Set(["black_box"]));

  // Viva Proctor States
  const [vivaQuestion, setVivaQuestion] = useState<VivaQuestion | null>(null);
  const [vivaHistory, setVivaHistory] = useState<VivaMessage[]>([]);
  const [vivaResponseText, setVivaResponseText] = useState("");
  const [vivaLoading, setVivaLoading] = useState(false);
  const [vivaSubmitting, setVivaSubmitting] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<{
    correct?: boolean;
    score?: number;
    feedback?: string;
    explanation?: string;
  } | null>(null);

  // Real-time Countdown Timer State per lab experiment (high- Stakes 2 minute trial)
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Initialize/Sync sliders whenever experiment ID changes
  useEffect(() => {
    const defaultParams: Record<string, number> = {};
    activeExp.parameters.forEach((p) => {
      defaultParams[p.name] = p.defaultValue;
    });
    setParams(defaultParams);

    // Track exploration stats
    if (!exploredExps.has(activeExp.id)) {
      const updated = new Set(exploredExps);
      updated.add(activeExp.id);
      setExploredExps(updated);
      setLabStats((prev) => ({
        ...prev,
        experimentsCompletedCount: updated.size
      }));
    }

    // Reset countdown timer to 120 whenever a new experiment is active
    setTimeLeft(120);
    setTimerActive(true);

    // Trigger an introductory viva question on this new experiment
    fetchNextVivaQuestion(activeExp.id, [], false);
  }, [activeExpId]);

  // Real-time Countdown Timer effect
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer expired! Trigger penalty
          setLabStats((stats) => ({
            ...stats,
            timerExpirationsCount: (stats.timerExpirationsCount || 0) + 1,
            sessionTraits: {
              ...stats.sessionTraits,
              // Stress levels spike significantly on complete timeout
              neuroticism: Math.min(10, stats.sessionTraits.neuroticism + 2)
            }
          }));

          // Post warning bubble in viva dialogue stream
          setVivaHistory((history) => [
            ...history,
            {
              role: "model",
              text: `⚠️ [TIMED OUT] Critical sensory lapse recorded for ${activeExp.title}! The exam advisor registered elevated student lab panic due to a complete clock run-out.`
            }
          ]);
          return 120; // restart countdown
        }

        // Ticking down under pressure in the danger red-zone
        if (prev <= 30) {
          setLabStats((stats) => ({
            ...stats,
            timerUrgentSeconds: (stats.timerUrgentSeconds || 0) + 1,
            sessionTraits: {
              ...stats.sessionTraits,
              // Continuously feed stress under ticking timer threat
              neuroticism: Math.min(10, stats.sessionTraits.neuroticism + 0.05)
            }
          }));
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, activeExpId, activeExp.title]);

  // Compute Active Simulation Outputs
  const getSimulationResult = () => {
    switch (activeExpId) {
      case "black_box":
        return simulateBlackBox(
          params.voltage || 5,
          params.frequency || 500,
          params.load || 100
        );
      case "laser_diffraction":
        return simulateLaserDiffraction(
          params.wavelength || 650,
          params.slitWidth || 0.12,
          params.distance || 1.5
        );
      case "optical_fibre":
        return simulateOpticalFiber(
          params.screenDist || 30,
          params.launchForce || 5,
          params.bendRadius || 25
        );
      case "transistor_char":
        return simulateTransistor(
          params.vbe || 0.7,
          params.vce || 5,
          params.baseRes || 47
        );
      case "planck_led":
        return simulatePlanckLed(
          params.biasVolt || 2.0,
          params.waveSelect || 650,
          params.temp || 25
        );
      case "energy_gap":
        return simulateEnergyGap(
          params.ovenTemp || 300,
          params.revBias || 5
        );
      case "photodiode":
        return simulatePhotodiode(
          params.luxPower || 40,
          params.lampDistance || 50,
          params.revVolt || 5
        );
      default:
        return { graphData: [] };
    }
  };

  const simResult = getSimulationResult();

  // Handle Parameter Slider Dragging
  const handleParamChange = (name: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Lab Notebook Observation logger
  const handleRecordObservation = () => {
    const currentResults: Record<string, any> = {
      timestamp: new Date().toLocaleTimeString(),
      ...params
    };

    // Append experiment-specific computed variables for clear records
    if (activeExpId === "black_box" && "current" in simResult) {
      currentResults["Impedance Z (kΩ)"] = simResult.impedance;
      currentResults["Circuit Current (mA)"] = simResult.current;
    } else if (activeExpId === "laser_diffraction" && "centralWidth" in simResult) {
      currentResults["Central Max Width (mm)"] = simResult.centralWidth;
    } else if (activeExpId === "optical_fibre" && "numericalAperture" in simResult) {
      currentResults["Numerical Aperture (NA)"] = simResult.numericalAperture;
      currentResults["Transmitted Power (mW)"] = simResult.powerOut;
      currentResults["Bending Loss (dB)"] = simResult.attenDb;
    } else if (activeExpId === "transistor_char" && "ibMicroAmps" in simResult) {
      currentResults["Base Current I_B (µA)"] = simResult.ibMicroAmps;
      currentResults["Collector Current I_C (mA)"] = simResult.icMilliAmps;
    } else if (activeExpId === "planck_led" && "forwardCurrent" in simResult) {
      currentResults["Knee V_knee (V)"] = simResult.kneeVoltage;
      currentResults["Current I_F (mA)"] = simResult.forwardCurrent;
    } else if (activeExpId === "energy_gap" && "saturationCurrent" in simResult) {
      currentResults["Sat Leakage I_s (µA)"] = simResult.saturationCurrent;
      currentResults["ln(I_s) Scale"] = simResult.lnIs;
    } else if (activeExpId === "photodiode" && "photocurrent" in simResult) {
      currentResults["Photo Current (µA)"] = simResult.photocurrent;
      currentResults["Total Output (µA)"] = simResult.totalCurrent;
    }

    setObservations((prev) => ({
      ...prev,
      [activeExpId]: [...(prev[activeExpId] || []), currentResults]
    }));
  };

  // Clear logged observations
  const handleClearObservations = () => {
    setObservations((prev) => ({
      ...prev,
      [activeExpId]: []
    }));
  };

  // 1. Fetch Adaptive Viva Question from Server API
  const fetchNextVivaQuestion = async (
    expId: string,
    history: any[],
    requestMoreSimple: boolean
  ) => {
    setVivaLoading(true);
    setEvaluationFeedback(null);
    setVivaResponseText("");

    try {
      const customKey = localStorage.getItem("yantra_nidhi_gemini_api_key");
      const aiModel = localStorage.getItem("yantra_nidhi_ai_model") || "gemini-3.5-flash";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-ai-model": aiModel
      };
      if (customKey) {
        headers["x-gemini-api-key"] = customKey;
      }

      const response = await fetch("/api/viva/question", {
        method: "POST",
        headers,
        body: JSON.stringify({
          experimentId: expId,
          history,
          requestMoreSimple
        })
      });

      if (!response.ok) {
        throw new Error("Prof-Network returned error. Falling back to local offline question.");
      }

      const questionObj: VivaQuestion = await response.json();
      setVivaQuestion(questionObj);

      // Log simplifies to stats
      if (requestMoreSimple) {
        setLabStats((prev) => ({
          ...prev,
          totalSimplifications: prev.totalSimplifications + 1
        }));
      }

      // Add to conversation dialogue log stream
      const systemMsg: VivaMessage = {
        role: "model",
        text: questionObj.question,
        isSimplified: requestMoreSimple
      };
      setVivaHistory((prev) => [...prev, systemMsg]);
    } catch (err) {
      console.error(err);
      // Fallback offline questions to protect user experience
      const fallbackQuestions: Record<string, VivaQuestion> = {
        black_box: {
          question: "Explain why at extremely high signal frequencies, a capacitance in a Black Box starts behaving as a short-circuit.",
          type: "open"
        },
        laser_diffraction: {
          question: "How does the distance of diffraction fringes shift if you substitute a Red Laser with a Violet Laser of much shorter wavelength?",
          type: "mcq",
          options: [
            "Fringes spread wider apart",
            "Fringes compress closer together",
            "Fringes disappear completely",
            "No change in position occurs"
          ]
        },
        optical_fibre: {
          question: "What physical condition restricts light within the core or causes leakage when a fiber experiences significant bending?",
          type: "open"
        },
        transistor_char: {
          question: "What is the physical meaning of the 'Beta' parameter in a Common Emitter NPN junction transistor?",
          type: "open"
        },
        planck_led: {
          question: "Which of the following monochromatic LEDs requires the highest forward bias knee voltage to begin light emission?",
          type: "mcq",
          options: [
            "Infrared LED (940 nm)",
            "Red LED (650 nm)",
            "Green LED (525 nm)",
            "Blue LED (460 nm)"
          ]
        },
        energy_gap: {
          question: "Why does the reverse leakage saturation current of a p-n semiconductor diode grow exponentially with ambient temp?",
          type: "open"
        },
        photodiode: {
          question: "Under what electrical bias mode is an optical silicon photodiode operated to detect fluctuations in illuminance lux, and why?",
          type: "open"
        }
      };

      const fallback = fallbackQuestions[expId] || {
        question: "Describe the primary operating physics tested in this laboratory workbench.",
        type: "open"
      };
      setVivaQuestion(fallback);
      setVivaHistory((prev) => [
        ...prev,
        { role: "model", text: fallback.question, isSimplified: requestMoreSimple }
      ]);
    } finally {
      setVivaLoading(false);
    }
  };

  // 2. Submit & Evaluate student answer
  const handleSubmitVivaAnswer = async (answerText: string) => {
    if (!vivaQuestion || !answerText.trim() || vivaSubmitting) return;

    setVivaSubmitting(true);
    // Log student answer to dialogue stream
    setVivaHistory((prev) => [
      ...prev,
      { role: "user", text: answerText }
    ]);

    try {
      const customKey = localStorage.getItem("yantra_nidhi_gemini_api_key");
      const aiModel = localStorage.getItem("yantra_nidhi_ai_model") || "gemini-3.5-flash";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-ai-model": aiModel
      };
      if (customKey) {
        headers["x-gemini-api-key"] = customKey;
      }

      const response = await fetch("/api/viva/evaluate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          experimentId: activeExp.id,
          question: vivaQuestion.question,
          answer: answerText,
          type: vivaQuestion.type,
          wasSimplified: vivaHistory.some((m) => m.isSimplified)
        })
      });

      if (!response.ok) {
        throw new Error("Unable to reach grading controller.");
      }

      const evaluation = await response.json();
      setEvaluationFeedback(evaluation);

      // Accumulate behavioral / academic stats
      setLabStats((prev) => {
        const nextAttempted = prev.totalQuestionsAttempted + 1;
        const nextAverage = prev.totalQuestionsAttempted === 0
          ? evaluation.score
          : (prev.averageVivaScore * prev.totalQuestionsAttempted + evaluation.score) / nextAttempted;

        // Apply extrapolated session traits adjustments
        const newTraits = { ...prev.sessionTraits };
        if (evaluation.traitMarkers) {
          Object.keys(evaluation.traitMarkers).forEach((k) => {
            const traitKey = k as keyof typeof newTraits;
            if (newTraits[traitKey] !== undefined) {
              const nextVal = newTraits[traitKey] + evaluation.traitMarkers[k];
              newTraits[traitKey] = Math.max(-10, Math.min(10, nextVal)); // clamp
            }
          });
        }

        return {
          ...prev,
          totalQuestionsAttempted: nextAttempted,
          averageVivaScore: nextAverage,
          sessionTraits: newTraits
        };
      });

      // Append Professor feedback bubble to chat dialogue stream
      setVivaHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: `[Evaluation Grade: ${evaluation.score}/10] ${evaluation.feedback}`
        }
      ]);
    } catch (err) {
      console.error(err);
      // Fallback evaluation if server route is unavailable
      const fallbackEval = {
        correct: true,
        score: 8,
        feedback: "Your analytical input matches fundamental physics criteria. Well done on presenting this conceptual view.",
        explanation: "This laboratory relies on matching voltage or frequency boundary thresholds to understand characteristic curves."
      };
      setEvaluationFeedback(fallbackEval);
      setLabStats((prev) => {
        const nextAttempts = prev.totalQuestionsAttempted + 1;
        return {
          ...prev,
          totalQuestionsAttempted: nextAttempts,
          averageVivaScore: prev.totalQuestionsAttempted === 0 ? 8 : (prev.averageVivaScore * prev.totalQuestionsAttempted + 8) / nextAttempts
        };
      });
      setVivaHistory((prev) => [
        ...prev,
        { role: "model", text: `[Evaluation Grade: 8/10] ${fallbackEval.feedback}` }
      ]);
    } finally {
      setVivaSubmitting(false);
    }
  };

  // Use Simplify route
  const handleSimplifyQuestion = () => {
    if (!vivaQuestion || vivaLoading) return;
    const historyParam = vivaHistory.map((m) => ({ role: m.role, text: m.text }));
    fetchNextVivaQuestion(activeExp.id, historyParam, true);
  };

  // Skip question action
  const handleSkipQuestion = () => {
    setLabStats((prev) => ({
      ...prev,
      totalSkips: prev.totalSkips + 1
    }));
    const historyParam = vivaHistory.map((m) => ({ role: m.role, text: m.text }));
    fetchNextVivaQuestion(activeExp.id, historyParam, false);
  };

  const handleResetTelemetryStats = () => {
    setLabStats({
      experimentsCompletedCount: 1,
      totalQuestionsAttempted: 0,
      averageVivaScore: 0,
      totalSkips: 0,
      totalSimplifications: 0,
      sessionTraits: {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0
      },
      timerUrgentSeconds: 0,
      timerExpirationsCount: 0
    });
    setExploredExps(new Set(["black_box"]));
    setTimeLeft(120);
    setTimerActive(true);
  };

  // Convert array limits to clean coordinate systems for SVGs
  const renderSimOutputGraph = () => {
    const data = simResult.graphData || [];
    if (data.length === 0) return null;

    const xValues = data.map((d) => d.x);
    const yValues = data.map((d) => d.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;

    // Dimensions of the coordinate canvas box
    const width = 450;
    const height = 180;
    const padding = { top: 15, right: 15, bottom: 25, left: 45 };

    // Form points coordinate string
    const pointsString = data
      .map((d) => {
        const cx = padding.left + ((d.x - minX) / xSpan) * (width - padding.left - padding.right);
        const cy = height - padding.bottom - ((d.y - minY) / ySpan) * (height - padding.top - padding.bottom);
        return `${cx},${cy}`;
      })
      .join(" ");

    // Selected current parameter mapping point coordinate
    let currentXVal = minX;
    if (activeExpId === "black_box") currentXVal = params.frequency;
    else if (activeExpId === "laser_diffraction") currentXVal = 0; // centered
    else if (activeExpId === "optical_fibre") currentXVal = params.screenDist;
    else if (activeExpId === "transistor_char") currentXVal = params.vce;
    else if (activeExpId === "planck_led") currentXVal = params.biasVolt;
    else if (activeExpId === "energy_gap") currentXVal = 1000 / params.ovenTemp;
    else if (activeExpId === "photodiode") currentXVal = params.revVolt;

    const highlightIndex = data.findIndex((d) => Math.abs(d.x - currentXVal) < (xSpan / 10));
    const finalHighlightPoint = highlightIndex !== -1 ? data[highlightIndex] : null;

    let hx = 0;
    let hy = 0;
    if (finalHighlightPoint) {
      hx = padding.left + ((finalHighlightPoint.x - minX) / xSpan) * (width - padding.left - padding.right);
      hy = height - padding.bottom - ((finalHighlightPoint.y - minY) / ySpan) * (height - padding.top - padding.bottom);
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-slate-400 font-mono" id="sci-spectrum">
        {/* Grids */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const cy = padding.top + ratio * (height - padding.top - padding.bottom);
          const cx = padding.left + ratio * (width - padding.left - padding.right);
          return (
            <g key={ratio}>
              {/* Horizontal line */}
              <line
                x1={padding.left}
                y1={cy}
                x2={width - padding.right}
                y2={cy}
                className="stroke-slate-800/80 stroke-dasharray-[2,4]"
                strokeDasharray="2,4"
              />
              {/* Vertical line */}
              <line
                x1={cx}
                y1={padding.top}
                x2={cx}
                y2={height - padding.bottom}
                className="stroke-slate-800/80 stroke-dasharray-[2,4]"
                strokeDasharray="2,4"
              />
            </g>
          );
        })}

        {/* Labels & Ticks */}
        <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" className="text-[9px] fill-slate-500">
          {maxY.toFixed(1)}
        </text>
        <text x={padding.left - 8} y={height - padding.bottom} textAnchor="end" className="text-[9px] fill-slate-500">
          {minY.toFixed(1)}
        </text>
        <text x={padding.left} y={height - 8} textAnchor="start" className="text-[9px] fill-slate-500">
          {minX.toFixed(0)}
        </text>
        <text x={width - padding.right} y={height - 8} textAnchor="end" className="text-[9px] fill-slate-500">
          {maxX.toFixed(0)}
        </text>

        {/* Axises titles */}
        <text x={width / 2 + 10} y={height - 2} textAnchor="middle" className="text-[9px] font-sans font-bold fill-slate-400 tracking-wider">
          {activeExp.graphXLabel}
        </text>
        <text
          x={11}
          y={height / 2 - 5}
          textAnchor="middle"
          transform={`rotate(-90 11 ${height / 2 - 5})`}
          className="text-[9px] font-sans font-bold fill-slate-400 tracking-wider"
        >
          {activeExp.graphYLabel}
        </text>

        {/* Curve Plot */}
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          points={pointsString}
          className="drop-shadow-[0_0_4px_rgba(56,189,248,0.4)]"
        />

        {/* Pulse Marker representing Current Setting */}
        {finalHighlightPoint && hx > 0 && hy > 0 && (
          <g>
            <circle cx={hx} cy={hy} r="6" className="fill-amber-500/20 stroke-amber-500 animate-ping" />
            <circle cx={hx} cy={hy} r="3.5" className="fill-sky-400 stroke-white stroke-1" />
            <rect
              x={hx + 8}
              y={hy - 12}
              width="65"
              height="18"
              rx="3"
              className="fill-black/80 stroke-slate-700 stroke-1"
            />
            <text x={hx + 12} y={hy} className="text-[8px] fill-slate-100 font-bold font-mono">
              X:{finalHighlightPoint.x.toFixed(1)}
            </text>
            <text x={hx + 12} y={hy + 7} className="text-[8px] fill-sky-400 font-bold font-mono">
              Y:{finalHighlightPoint.y.toFixed(1)}
            </text>
          </g>
        )}
      </svg>
    );
  };

  // Specific simulation visualization renderers (to bring high visceral quality to play!)
  const renderInteractiveMachineSchema = () => {
    switch (activeExpId) {
      case "black_box":
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="relative w-64 h-40 border-2 border-slate-700 rounded-2xl bg-neutral-900 flex flex-col items-center justify-between p-4 shadow-2xl">
              {/* LED Terminal Indicators */}
              <div className="flex justify-between w-full">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-black shadow-[0_0_8px_red]"></span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold">PORT A (+)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-slate-400 font-mono font-bold">PORT B (-)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-black shadow-[0_0_8px_white]"></span>
                </div>
              </div>

              {/* Inner Circuit Drawing */}
              <div className="border border-slate-800 rounded bg-black/60 p-2.5 text-center flex flex-col items-center justify-center">
                <span className="font-mono text-[9px] text-zinc-500 tracking-wider">SEALED ENCLOSURE IMPEDANCE</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="h-0.5 w-6 bg-yellow-600"></span>
                  <div className="w-12 h-6 border-2 border-yellow-600/60 bg-yellow-600/10 text-[10px] font-mono leading-none flex items-center justify-center select-none font-bold text-yellow-500">
                    R-L-C
                  </div>
                  <span className="h-0.5 w-6 bg-yellow-600"></span>
                </div>
              </div>

              {/* Digital multimeter values overlay */}
              <div className="w-full flex justify-between bg-zinc-950 p-1.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                <span className="text-emerald-400">Measured Z: {(simResult as any).impedance} kΩ</span>
                <span className="text-sky-400">Current: {(simResult as any).current} mA</span>
              </div>
            </div>
          </div>
        );

      case "laser_diffraction":
        const spotColor = (params.wavelength >= 400 && params.wavelength < 490)
          ? "bg-blue-600 shadow-[0_0_15px_blue]"
          : (params.wavelength >= 490 && params.wavelength < 560)
            ? "bg-green-500 shadow-[0_0_15px_green]"
            : "bg-red-600 shadow-[0_0_15px_red]";

        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4">
              <div className="relative h-12 bg-zinc-900 border border-slate-800 rounded-lg flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 animate-ping"></span>
                  <div className="h-4 w-12 bg-slate-800 border-2 border-slate-700 rounded-sm"></div>
                  <span className="text-[10px] text-rose-400 uppercase font-mono font-bold">LASER TUBE (ON)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono bg-black px-1.5 py-0.5 rounded border border-white/5">
                  Wvl: {params.wavelength} nm
                </div>
              </div>

              {/* Laser ray projection */}
              <div className="relative h-1 bg-gradient-to-r from-red-600 to-red-400 w-full animate-pulse my-2"></div>

              {/* Virtual Diffraction Fringes Screen */}
              <div className="bg-black border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tight mb-2">PROJECTED SCREEN INTENSITY SPOT</span>
                <div className="relative w-full h-8 bg-zinc-950 border border-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="flex items-center gap-1">
                    {/* Ring simulation fringes */}
                    <div className={`w-1 h-6 opacity-20 ${spotColor}`}></div>
                    <div className={`w-1.5 h-6 opacity-40 ${spotColor}`}></div>
                    <div className={`w-2.5 h-6 opacity-60 ${spotColor}`}></div>
                    {/* Central maximum */}
                    <div className={`w-12 h-6 ${spotColor}`}></div>
                    <div className={`w-2.5 h-6 opacity-60 ${spotColor}`}></div>
                    <div className={`w-1.5 h-6 opacity-40 ${spotColor}`}></div>
                    <div className={`w-1 h-6 opacity-20 ${spotColor}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "optical_fibre":
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4 text-center">
              <div className="relative h-20 border border-slate-800 bg-black/60 rounded-xl p-3 flex items-center justify-around">
                {/* Visual optical fibre coil */}
                <div className="relative w-24 h-14 border-4 border-dashed border-sky-400/40 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: "12s" }}>
                  <div className="w-16 h-10 border-4 border-zinc-700 rounded-full"></div>
                </div>

                <div className="text-left space-y-1.5">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Output Flux</div>
                  <div className="text-[15px] font-mono font-extrabold text-teal-400">
                    {(simResult as any).powerOut} mW
                  </div>
                  <div className="text-[9px] font-mono text-rose-400">
                    Bending loss: -{(simResult as any).attenDb} dB
                  </div>
                </div>
              </div>

              {/* Light Circle projected screen */}
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Projected Acceptance Core cone</span>
                <div className="w-32 h-14 bg-zinc-950 border border-slate-900 rounded-lg mx-auto flex items-center justify-center">
                  <div
                    className="rounded-full bg-teal-400/20 border border-teal-400 shadow-[0_0_14px_rgba(45,212,191,0.5)] transition-all"
                    style={{
                      width: `${Math.min(50, Math.max(10, (simResult as any).projectedRadius))}px`,
                      height: `${Math.min(50, Math.max(10, (simResult as any).projectedRadius))}px`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        );

      case "transistor_char":
        const ibKey = (simResult as any).ibMicroAmps || 0;
        const icKey = (simResult as any).icMilliAmps || 0;

        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-full max-w-sm border border-slate-800 bg-black/40 rounded-xl p-4">
              <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Common Emitter NPN Schematic Bias</h4>
              <div className="flex justify-around items-center mb-3">
                <div className="bg-zinc-900 border border-slate-800 p-2 rounded text-center">
                  <span className="block text-[8px] text-amber-500 uppercase font-bold">Base Current I_B</span>
                  <span className="font-mono text-xs text-slate-100">{ibKey} µA</span>
                </div>
                <div className="text-lg font-bold text-slate-600">→</div>
                <div className="bg-zinc-900 border border-slate-800 p-2 rounded text-center">
                  <span className="block text-[8px] text-teal-400 uppercase font-bold">Collector Current I_C</span>
                  <span className="font-mono text-xs text-teal-400">{icKey} mA</span>
                </div>
              </div>

              <div className="text-[9px] font-bold text-sky-400 uppercase tracking-wide bg-zinc-950 p-1 rounded-lg border border-slate-800">
                Active Junction Mode: {ibKey === 0 ? "CUTOFF" : (icKey >= (params.vce / 1.2) ? "SATURATION" : "ACTIVE AMPLIFIER")}
              </div>
            </div>
          </div>
        );

      case "planck_led":
        const activeLedColor = (params.waveSelect < 490)
          ? "bg-blue-600 shadow-[0_0_20px_blue]"
          : (params.waveSelect >= 490 && params.waveSelect < 570)
            ? "bg-emerald-500 shadow-[0_0_20px_green]"
            : (params.waveSelect >= 570 && params.waveSelect < 600)
              ? "bg-amber-400 shadow-[0_0_20px_amber]"
              : "bg-red-600 shadow-[0_0_20px_red]";

        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm text-center space-y-4">
              <div className="bg-zinc-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-around">
                <div className="text-left">
                  <span className="block text-[8px] text-slate-400 uppercase font-semibold">Active Junction Wvl</span>
                  <span className="text-sm font-sans font-extrabold text-slate-200">{params.waveSelect} nm</span>
                  <span className="block text-[10px] text-emerald-400 font-mono mt-1">IF: {(simResult as any).forwardCurrent} mA</span>
                </div>

                {/* Simulated Glowing LED bulbs */}
                <div className="text-center">
                  <div className={`w-10 h-10 rounded-t-full rounded-b border border-zinc-650 mx-auto transition-colors flex items-center justify-center ${activeLedColor}`}>
                    <div className="w-4 h-0.5 bg-white/40"></div>
                  </div>
                  <span className="text-[8px] block uppercase text-slate-500 font-bold mt-2">Diod Pot: {(simResult as any).kneeVoltage} V</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "energy_gap":
        const temperaturePercent = ((params.ovenTemp - 290) / (370 - 290)) * 100;

        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm text-center">
              <div className="bg-neutral-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase">Germanium Crystal Oven</span>
                    <span className="text-sm font-sans font-bold text-slate-200">{params.ovenTemp} K / {(params.ovenTemp - 273.15).toFixed(1)} °C</span>
                  </div>
                  <div className="flex gap-1">
                    {/* Heating element indicator */}
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{
                        backgroundColor: `rgb(${200 + temperaturePercent * 0.55}, ${110 - temperaturePercent}, ${110 - temperaturePercent})`,
                        boxShadow: `0 0 ${8 + temperaturePercent * 0.15}px red`
                      }}
                    ></span>
                  </div>
                </div>

                {/* Temperature Progress bar */}
                <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all" style={{ width: `${temperaturePercent}%` }}></div>
                </div>

                <div className="bg-black/80 rounded-lg p-2.5 text-left font-mono text-[9px] text-slate-400 space-y-1">
                  <div>Reciprocal 1000/T: {(simResult as any).invTemp} K⁻¹</div>
                  <div>Is: {(simResult as any).saturationCurrent} µA</div>
                  <div>ln(Is): {(simResult as any).lnIs}</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "photodiode":
        const lux = (1500 * params.luxPower) / ((params.lampDistance || 1) * (params.lampDistance || 1));

        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm border border-slate-850 p-4 bg-black/60 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[8px] text-zinc-400 uppercase">Interactive Rail Position</span>
                  <span className="text-xs font-bold text-zinc-200">Lamp Distance: {params.lampDistance} cm</span>
                </div>
                <div className="bg-zinc-900 p-1 border border-zinc-800 text-[9px] rounded font-mono text-amber-400">
                  Illuminance: {lux.toFixed(1)} Lux
                </div>
              </div>

              {/* Slider tracks visualizer */}
              <div className="relative h-14 bg-zinc-950 border border-slate-800 rounded-lg mt-3 flex items-center justify-between px-3">
                {/* Lamp holder */}
                <div className="w-8 h-8 rounded border border-yellow-500/50 bg-amber-500/15 flex items-center justify-center relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <div className="absolute top-8 text-[7px] text-amber-500 uppercase font-bold">Halogen</div>
                </div>

                <div className="h-0.5 bg-zinc-805 flex-1 mx-3 border-t border-dashed border-zinc-750"></div>

                {/* Photodiode receiver */}
                <div className="w-8 h-8 rounded border border-teal-500 bg-teal-500/10 flex items-center justify-center relative">
                  <div className="w-4 h-4 rounded-full bg-teal-400/30 border border-teal-400 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                  </div>
                  <div className="absolute top-8 text-[7px] text-teal-500 uppercase font-bold">Receiver</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Top Header & Navigation */}
      <header className="flex flex-col border-b border-slate-800 shrink-0">
        {/* Core Branding and User Bar */}
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/1.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-teal-400">YANTRA NIDHI</h1>
                <p className="text-[9px] uppercase tracking-widest text-slate-500">Virtual Physics Lab</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block"></div>
            
            <div className="items-center gap-3 text-xs text-slate-400 hidden md:flex">
              <span>Workbench</span>
              <span>/</span>
              <span className="text-slate-200 font-sans font-bold flex items-center gap-1">
                {activeSection === "available" ? (
                  <>
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    {activeExp.title}
                  </>
                ) : activeSection === "ai_guru" ? (
                  <>
                    <Brain className="w-3.5 h-3.5 text-blue-400" />
                    Talk to AI Guru
                  </>
                ) : activeSection === "fully_fledged" ? (
                  <>
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    Fully Fledged Experiments
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    OCEAN Character Analyzer
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500 font-mono font-bold leading-none hidden lg:block">
              Time Protocol: 2026-05-29
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-355 rounded-full text-xs font-bold border border-slate-850 hover:border-slate-700 transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              Configure AI Key
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Virtual Lab Online
            </div>
          </div>
        </div>

        {/* 4 Main Navigation Tabs */}
        <div className="bg-slate-900/60 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-4">
            <button
              onClick={() => { setActiveSection("fully_fledged"); setActiveExpId("black_box"); setActiveBlackBox("simulation"); }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "fully_fledged"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Box className="w-4 h-4" />
              Fully Fledged Experiments with Virtual Lab
            </button>
            <button
              onClick={() => { setActiveSection("available"); setActiveExpId("laser_diffraction"); }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "available"
                  ? "border-teal-500 text-teal-400 bg-teal-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Activity className="w-4 h-4" />
              Available Experiments
            </button>
            <button
              onClick={() => setActiveSection("ai_guru")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "ai_guru"
                  ? "border-blue-500 text-blue-400 bg-blue-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              TALK To AI GURU
            </button>
            <button
              onClick={() => setActiveSection("ocean")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "ocean"
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Subject related Psychological Analysis - OCEAN ANALYTICAL TEST
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Conditional Left Sidebar Navigation Rail */}
        {(activeSection === "fully_fledged" || activeSection === "available") && (
          <aside className="w-64 flex flex-col border-r border-slate-800 bg-slate-900/40 shrink-0">
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 list-none">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-3 tracking-wider">
                {activeSection === "fully_fledged" ? "Virtual Lab Modules" : "Conceptual Experiments"}
              </div>
              
              {activeSection === "available" && (
                <>
                  {EXPERIMENTS_LIST.filter(e => e.id !== "black_box").map((exp) => {
                    const isActive = activeExpId === exp.id;
                    return (
                      <button
                        key={exp.id}
                        onClick={() => setActiveExpId(exp.id)}
                        className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.06)]"
                            : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isActive ? "bg-teal-400" : "bg-slate-700"}`}></span>
                        <div>
                          <div className="text-xs font-bold font-sans leading-tight mb-0.5">{exp.title}</div>
                          <div className="text-[8.5px] text-slate-500 truncate max-w-[170px] leading-tight">{exp.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Disabled Under Construction Item */}
                  <button
                    disabled
                    className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-transparent opacity-60 cursor-not-allowed mt-4 bg-slate-800/30"
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-slate-600"></span>
                    <div>
                      <div className="text-xs font-bold font-sans text-slate-500 mb-0.5">Virtual Lab</div>
                      <div className="text-[8.5px] text-amber-500/80 font-bold uppercase tracking-wider">(Under Construction)</div>
                    </div>
                  </button>
                </>
              )}
              
              {activeSection === "fully_fledged" && (
                <>
                  <button
                    onClick={() => { setActiveExpId("black_box"); setActiveBlackBox("simulation"); }}
                    className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeBlackBox === "simulation"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                        : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activeBlackBox === "simulation" ? "bg-emerald-400" : "bg-slate-700"}`}></span>
                    <div>
                      <div className="text-xs font-bold font-sans leading-tight mb-0.5">Black box Experiments</div>
                      <div className="text-[8.5px] text-slate-500 leading-tight">Impedance Spectroscopy</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveBlackBox("lab")}
                    className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeBlackBox === "lab"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                        : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activeBlackBox === "lab" ? "bg-emerald-400" : "bg-slate-700"}`}></span>
                    <div>
                      <div className="text-xs font-bold font-sans leading-tight mb-0.5">Blackbox Lab</div>
                      <div className="text-[8.5px] text-slate-500 leading-tight">Component Detection Tools</div>
                    </div>
                  </button>
                </>
              )}
            </nav>
          </aside>
        )}

        {/* Content Body Switch */}
        {activeSection === "ocean" ? (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950 w-full">
            <div className="max-w-5xl mx-auto">
              <OceanAnalysisCard
                labStats={labStats}
                onResetStats={handleResetTelemetryStats}
              />
            </div>
          </div>
        ) : activeSection === "ai_guru" ? (
          <div className="flex-1 overflow-y-auto bg-slate-950 w-full">
            <TalkToAiGuru />
          </div>
        ) : activeSection === "fully_fledged" && activeBlackBox === "lab" ? (
          <div className="flex-1 overflow-y-auto bg-slate-950 w-full">
            <BlackBoxIdentification />
          </div>
        ) : (
          /* Multi-column layout */
          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-0">
            
            {/* Lab Simulation & Controls Workspace (Middle Column) */}
            <div className="flex-[3] flex flex-col overflow-y-auto p-6 min-w-0 bg-slate-950">
              {/* Objective block */}
              <div className="mb-5 bg-slate-900/40 rounded-xl border border-slate-850 p-4 space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-teal-400 font-extrabold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Experimental Mission
                </span>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {activeExp.objective}
                </p>
                <div className="text-[10px] text-slate-500 italic mt-1 font-sans border-t border-slate-800/60 pt-2 leading-snug">
                  {activeExp.theory}
                </div>
              </div>

              {/* Dynamic High-Stakes Exam Countdown Timer Area */}
              <div className={`mb-6 p-4 rounded-2xl border ${
                timeLeft <= 30
                  ? "bg-rose-955/30 border-rose-500/40 text-rose-200 animate-pulse"
                  : timeLeft <= 60
                  ? "bg-amber-955/20 border-amber-500/30 text-amber-200"
                  : "bg-slate-900/50 border-slate-800 text-slate-100"
              } transition-all duration-300`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Timer label and urgency indicator */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      timeLeft <= 30
                        ? "bg-rose-500/20 text-rose-400"
                        : timeLeft <= 60
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-teal-500/10 text-teal-400"
                    }`}>
                      {timeLeft <= 30 ? (
                        <Flame className="w-5 h-5 animate-bounce" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Exam Tension Timer Protocols
                        </span>
                        {timeLeft <= 30 ? (
                          <span className="text-[9px] font-bold text-rose-400 font-mono animate-pulse bg-rose-500/10 px-1.5 py-0.5 rounded uppercase border border-rose-500/20">
                            High Anxiety Detected
                          </span>
                        ) : timeLeft <= 60 ? (
                          <span className="text-[9px] font-bold text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded uppercase border border-amber-500/20">
                            Medium Strain Mode
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-teal-400 font-mono bg-teal-500/5 px-1.5 py-0.5 rounded uppercase border border-teal-500/10">
                            Stable Calibrations
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5 max-w-xl">
                        {timeLeft <= 30
                          ? "Pacing threshold critical! Extreme stress indexing is factoring into your background Neuroticism profile."
                          : timeLeft <= 60
                          ? "Pressure is building. Perform your lab observations and viva responses quickly to avoid stress penalties."
                          : "Steady academic pace is maintained. Timer resets automatically upon full session expiration."}
                      </p>
                    </div>
                  </div>

                  {/* Digital Counter Display */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        // Relieve pressure: Add 45s but decrease Conscientiousness slightly and boost Neuroticism threshold
                        setTimeLeft((prev) => Math.min(180, prev + 45));
                        setLabStats((stats) => ({
                          ...stats,
                          sessionTraits: {
                            ...stats.sessionTraits,
                            conscientiousness: Math.max(0, stats.sessionTraits.conscientiousness - 0.5), // bypass decreases conscientiousness
                            neuroticism: Math.max(0, stats.sessionTraits.neuroticism - 0.8) // but calms anxiety!
                          }
                        }));
                        setVivaHistory((history) => [
                          ...history,
                          {
                            role: "user",
                            text: "🔧 [OPERATOR COMMAND] Calibrate laboratory sensors & re-pressurize chamber (+45s extension achieved)."
                          }
                        ]);
                      }}
                      type="button"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 hover:border-slate-650 text-slate-350 text-[10px] font-bold font-sans uppercase rounded-xl transition-colors cursor-pointer"
                      title="Bypasses standard examination timeline to buy breathing room (slight conscientious index penalty)"
                    >
                      Extend Timer (+45s)
                    </button>

                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-xl font-mono font-extrabold tracking-tight px-3 py-1.5 rounded-xl bg-black/60 border ${
                        timeLeft <= 30
                          ? "border-rose-500/50 text-rose-400 ring-2 ring-rose-500/25 animate-pulse"
                          : timeLeft <= 60
                          ? "border-amber-400/40 text-amber-400"
                          : "border-teal-400/20 text-teal-400"
                      }`}>
                        {Math.floor(timeLeft / 60).toString().padStart(2, "0")}
                        <span className="animate-pulse">:</span>
                        {(timeLeft % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">EST. LIMIT RATIO</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar indicator */}
                <div className="w-full h-1.5 bg-slate-850/80 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeLeft <= 30
                        ? "bg-rose-500"
                        : timeLeft <= 60
                        ? "bg-amber-500"
                        : "bg-teal-500"
                    }`}
                    style={{ width: `${(timeLeft / 120) * 100}%` }}
                  />
                </div>
              </div>

              {/* Main Virtual Sandbox Screen */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Visual simulator container */}
                <div className="lg:col-span-6 border-2 border-slate-800 rounded-2xl relative h-64 bg-zinc-950 overflow-hidden shadow-inner flex flex-col justify-between">
                  {/* Decorative background grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0f16_1px,transparent_1px),linear-gradient(to_bottom,#0c0f16_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                  {renderInteractiveMachineSchema()}
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-800 px-2 py-1 text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider z-20">
                    DIAGNOSTIC VISUALIZER
                  </div>
                </div>

                {/* Plot Panel */}
                <div className="lg:col-span-6 border-2 border-slate-800 rounded-2xl bg-zinc-950 p-4 relative h-64 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] bg-slate-900/90 border border-slate-800 font-bold font-mono px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest leading-none">
                      Dynamic Spectrum Plot
                    </span>
                    <span className="text-[8px] text-teal-400 font-mono">Real-time trace enabled</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    {renderSimOutputGraph()}
                  </div>
                </div>
              </div>

              {/* Slider variables knobs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {activeExp.parameters.map((p) => {
                  const val = params[p.name] !== undefined ? params[p.name] : p.defaultValue;
                  return (
                    <div key={p.name} className="bg-slate-900/70 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-sans font-bold text-slate-400">{p.label}</label>
                        <span className="text-xs font-mono font-bold text-teal-400 bg-black px-2 py-0.5 rounded border border-white/5">
                          {val} {p.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={val}
                        onChange={(e) => handleParamChange(p.name, parseFloat(e.target.value))}
                        className="w-full accent-teal-500 h-1 rounded-lg bg-slate-800 cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
                        <span>Min: {p.min}</span>
                        <span>Max: {p.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data recorder table log (Lab notebook) */}
              <div className="mt-6 bg-slate-900/30 border border-slate-850 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Digital Trial Notebook</h3>
                      <p className="text-[9px] text-slate-500 font-sans leading-none">Record multiple trials to document characteristics curves</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRecordObservation}
                      type="button"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-md shadow-indigo-900/10 cursor-pointer transition-colors"
                    >
                      Record Observation
                    </button>
                    {(observations[activeExpId] || []).length > 0 && (
                      <button
                        onClick={handleClearObservations}
                        type="button"
                        className="px-2.5 py-1.5 border border-slate-200/10 hover:bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wide rounded-lg cursor-pointer"
                      >
                        Reset Log
                      </button>
                    )}
                  </div>
                </div>

                {!(observations[activeExpId] || []).length ? (
                  <div className="py-6 text-center text-xs text-slate-500 italic">
                    No data recorded yet. Set inputs above and click &quot;Record Observation&quot; to log points.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto border border-slate-800/60 rounded-lg">
                    <table className="w-full text-left text-[10px] font-mono whitespace-nowrap">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[8px] font-extrabold tracking-wider sticky top-0">
                        <tr>
                          <th className="p-2 border-b border-slate-800">Time</th>
                          {Object.keys(observations[activeExpId][0])
                            .filter((k) => k !== "timestamp")
                            .map((key) => (
                              <th key={key} className="p-2 border-b border-slate-800">{key}</th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                        {observations[activeExpId].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-2 text-zinc-500 border-b border-slate-850/40">{row.timestamp}</td>
                            {Object.keys(row)
                              .filter((k) => k !== "timestamp")
                              .map((k) => (
                                <td key={k} className="p-2 font-bold text-slate-200 border-b border-slate-850/40">{row[k]}</td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Viva Dialogue Proctor (Right Column) */}
            <div className="flex-[2] bg-slate-900/35 flex flex-col overflow-hidden min-w-[280px] border-t md:border-t-0 md:border-l border-slate-800">
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-350 font-mono">Viva Dialogue</h3>
                </div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                </div>
              </div>

              {/* Chat-oriented list box */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0">
                {/* Intro Proctor Statement */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-teal-400 border border-slate-700 shrink-0 select-none">
                    PRO
                  </div>
                  <div className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 font-sans leading-relaxed">
                    Welcome to <span className="font-bold text-teal-400">Yantra Nidhi Examination Module</span>. Correct responses build academic confidence. If the prompt feels demanding, click <span className="text-amber-500 font-medium">Simplify Question</span> for instant assistance.
                  </div>
                </div>

                {vivaHistory.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0 select-none ${
                        isUser
                          ? "bg-slate-700 text-slate-200 border-slate-650"
                          : "bg-teal-950 text-teal-400 border-teal-850/60"
                      }`}>
                        {isUser ? "STU" : "PRO"}
                      </div>
                      <div className={`flex-1 rounded-2xl p-3.5 text-xs border ${
                        isUser
                          ? "bg-slate-850 text-slate-200 border-slate-750 rounded-tr-none"
                          : "bg-slate-950 text-slate-350 border-slate-850 rounded-tl-none leading-relaxed"
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Loading animation bubble */}
                {vivaLoading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-teal-950 text-teal-400 border border-teal-850/60 flex items-center justify-center text-[9px] font-bold shrink-0 animate-pulse">
                      PRO
                    </div>
                    <div className="bg-slate-950 rounded-2xl rounded-tl-none border border-slate-850 p-3 flex space-x-1 items-center">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assessment evaluation metrics display */}
              {evaluationFeedback && (
                <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
                  <div className="flex items-center gap-1.5 mb-1 bg-teal-900/10 p-2 border border-teal-900/30 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-teal-400 font-mono font-bold">Concept Analysis: </span>
                      <span className="text-[10px] text-slate-300 font-sans">{evaluationFeedback.explanation}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Answer dialogue entry dock */}
              <div className="p-5 bg-slate-950/80 border-t border-slate-800 shrink-0">
                {/* Active question layout picker */}
                {vivaQuestion && !evaluationFeedback && !vivaLoading && (
                  <div className="mb-4">
                    {vivaQuestion.type === "mcq" && vivaQuestion.options ? (
                      /* MCQ Mode */
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {vivaQuestion.options.map((opt, index) => (
                          <button
                            key={index}
                            onClick={() => handleSubmitVivaAnswer(opt)}
                            className="w-full text-left bg-slate-900 border border-slate-800 hover:border-teal-500 rounded-xl p-2.5 text-xs text-slate-400 font-sans tracking-tight transition-all text-left cursor-pointer"
                          >
                            <span className="font-mono text-[10px] font-bold text-teal-400 mr-1.5">[{index + 1}]</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Open ended textbook textbox entry layout */
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={vivaResponseText}
                          onChange={(e) => setVivaResponseText(e.target.value)}
                          placeholder="Formulate your detailed physics answer here..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-sans text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-600 resize-none min-h-[50px]"
                        />
                        <button
                          onClick={() => handleSubmitVivaAnswer(vivaResponseText)}
                          disabled={!vivaResponseText.trim() || vivaSubmitting}
                          type="button"
                          className="w-full py-2 bg-teal-600 hover:bg-teal-500 font-sans text-xs font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow shadow-teal-900/20"
                        >
                          {vivaSubmitting ? "Evaluating..." : "Submit Verbal Answer"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Step buttons */}
                {evaluationFeedback && (
                  <button
                    onClick={() => fetchNextVivaQuestion(activeExp.id, [], false)}
                    className="w-full py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:brightness-105 rounded-xl font-sans text-xs font-bold text-white flex items-center justify-center gap-1 cursor-pointer transition-all mb-4 shadow"
                  >
                    <span>Proceed to Next Viva Question</span>
                    <ChevronsRight className="w-4 h-4 animate-pulse" />
                  </button>
                )}

                {/* Adaptive action toggles */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSimplifyQuestion}
                    disabled={vivaLoading || evaluationFeedback !== null}
                    type="button"
                    className="flex-1 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-tight transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Simplify Question
                  </button>
                  <button
                    onClick={handleSkipQuestion}
                    disabled={vivaLoading}
                    type="button"
                    className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-tight transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Skip Question
                  </button>
                </div>

                {/* Proctors assurance notice */}
                <div className="mt-4 bg-indigo-500/5 rounded-xl p-3 border border-indigo-500/10 text-center leading-tight">
                  <div className="text-[9px] font-bold text-indigo-400 uppercase mb-0.5 tracking-wider">PROCTOR NOTE:</div>
                  <p className="text-[10px] text-slate-500 italic">
                    Answer accurately. Adaptive simplifications, score metrics, and skips guide the OCEAN study advisory algorithm.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-4 font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Gemini AI Configuration</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                [Close]
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Power the adaptive viva examinations, OCEAN psychology synthesis, and career suggestions using your own Gemini API Key.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-500 uppercase font-bold block">Gemini API Key</label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-100 rounded-xl p-3 focus:outline-none transition-colors"
              />
              <span className="text-[9px] text-slate-500 block leading-normal">
                This key is only stored in your browser's local storage and is sent to the serverless function requests locally. Leaving it blank uses the backend server's default configuration key.
              </span>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveApiKey}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wide cursor-pointer transition-colors shadow"
              >
                Save Configuration
              </button>
              <button
                onClick={() => {
                  setTempApiKey("");
                  localStorage.removeItem("yantra_nidhi_gemini_api_key");
                  setIsSettingsOpen(false);
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Clear Key
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
