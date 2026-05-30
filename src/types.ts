/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VivaMessage {
  role: "user" | "model";
  text: string;
  isSimplified?: boolean;
}

export interface VivaQuestion {
  question: string;
  type: "open" | "mcq";
  options?: string[];
  feedback?: string;
  explanation?: string;
  score?: number;
  correct?: boolean;
}

export interface OceanQuestion {
  id: string;
  aspect: "o" | "c" | "e" | "a" | "n";
  aspectName: string;
  statement: string;
}

export interface SimulationResult {
  x: number;
  y: number;
  label?: string;
}

export interface Experiment {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  theory: string;
  parameters: {
    name: string;
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    defaultValue: number;
  }[];
  graphXLabel: string;
  graphYLabel: string;
}

export interface LabStats {
  experimentsCompletedCount: number;
  totalQuestionsAttempted: number;
  averageVivaScore: number;
  totalSkips: number;
  totalSimplifications: number;
  sessionTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  timerUrgentSeconds?: number;
  timerExpirationsCount?: number;
}

export interface OceanResult {
  scores: { o: number; c: number; e: number; a: number; n: number };
  traits: Record<
    "o" | "c" | "e" | "a" | "n",
    { label: string; val: number; desc: string }
  >;
  archetype: string;
  archetypeSubtitle: string;
  natureDescription: string;
  studyAdvice: {
    strengths: string[];
    weaknesses: string[];
    preparationTips: string[];
    examStrategy: string;
  };
}

export const OCEAN_QUESTIONNAIRE: OceanQuestion[] = [
  {
    id: "o1",
    aspect: "o",
    aspectName: "Openness",
    statement: "I love understanding the deep theoretical reasons behind physical equations rather than just memorizing them."
  },
  {
    id: "o2",
    aspect: "o",
    aspectName: "Openness",
    statement: "I enjoy modifying laboratory parameters in the virtual lab aggressively just to see what kind of chaotic outcomes might happen."
  },
  {
    id: "o3",
    aspect: "o",
    aspectName: "Openness",
    statement: "I am highly intrigued by advanced physics research topics (like quantum computing or photonics) beyond my regular syllabus."
  },
  {
    id: "c1",
    aspect: "c",
    aspectName: "Conscientiousness",
    statement: "I consistently double-check circuit connections and mathematical calculations to avoid simple measurement errors."
  },
  {
    id: "c2",
    aspect: "c",
    aspectName: "Conscientiousness",
    statement: "I prefer to organize my laboratory reports and notebook values meticulously with proper headings and fully labeled axes."
  },
  {
    id: "c3",
    aspect: "c",
    aspectName: "Conscientiousness",
    statement: "I am highly structured in my revision and always create a study checklist before commencing exam preparation."
  },
  {
    id: "e1",
    aspect: "e",
    aspectName: "Extraversion",
    statement: "In a laboratory team project, I prefer taking the lead to explain findings to visiting examiners or professors."
  },
  {
    id: "e2",
    aspect: "e",
    aspectName: "Extraversion",
    statement: "I perform considerably better when discussing tough numerical formulas or complex diagrams within a group study circle."
  },
  {
    id: "e3",
    aspect: "e",
    aspectName: "Extraversion",
    statement: "During oral exams (vivas), I feel confident expressing answers verbally, even if I have only partial knowledge of the question."
  },
  {
    id: "a1",
    aspect: "a",
    aspectName: "Agreeableness",
    statement: "I appreciate highly critical feedback on my mistakes from laboratory professors and try to study better without getting discouraged."
  },
  {
    id: "a2",
    aspect: "a",
    aspectName: "Agreeableness",
    statement: "I am genuinely eager to help a struggling lab colleague align their laser prism or explain a tricky slope calculation."
  },
  {
    id: "a3",
    aspect: "a",
    aspectName: "Agreeableness",
    statement: "I find rigorous laboratory guidelines, safety instructions, and attendance mandates entirely reasonable and vital."
  },
  {
    id: "n1",
    aspect: "n",
    aspectName: "Neuroticism",
    statement: "I experience quite high anxiety or heartbeat levels when a course supervisor stands directly over my stool inspecting my work."
  },
  {
    id: "n2",
    aspect: "n",
    aspectName: "Neuroticism",
    statement: "I worry intensely about getting unexpected results (such as curved characteristics, noise, or negative slopes) in lab reports."
  },
  {
    id: "n3",
    aspect: "n",
    aspectName: "Neuroticism",
    statement: "Under exam situations, I frequently undergo mental blockages where simple formulas suddenly slip out of my head."
  }
];

export const EXPERIMENTS_LIST: Experiment[] = [
  {
    id: "black_box",
    title: "Black Box Experiment",
    subtitle: "Impedance Spectroscopy & Component Detection",
    objective: "To apply an AC sinusoidal voltage across an unknown passive network contained in a sealed enclosure, analyze frequency response, and determine the exact passive elements and configuration.",
    theory: "A simple Black Box contains a combination of Resistance (R), Capacitance (C), or Inductance (L). By varying the source frequency (f) and measuring current (I) at constant voltage (V), we calculate the total Impedance Z = V/I. For a series R-C, Z increases as frequency decreases. For series R-L, Z increases with frequency. At resonance in R-L-C circuits, the impedance acts purely resistive, and current flow is minimized (parallel resonance) or maximized (series resonance).",
    parameters: [
      { name: "voltage", label: "Source Voltage", min: 1, max: 10, step: 0.5, unit: "V", defaultValue: 5 },
      { name: "frequency", label: "AC Frequency", min: 10, max: 2000, step: 50, unit: "Hz", defaultValue: 500 },
      { name: "load", label: "Series Parasitic R", min: 10, max: 500, step: 10, unit: "Ω", defaultValue: 100 }
    ],
    graphXLabel: "Frequency (Hz)",
    graphYLabel: "Impedance Z (kΩ)"
  },
  {
    id: "laser_diffraction",
    title: "Laser Diffraction",
    subtitle: "Single Slit & Grating Fringes Profile",
    objective: "To investigate the diffraction of monochromatic red/green laser light when passing through a single thin slit, plot screen intensity, and evaluate the slit width.",
    theory: "When a laser of wavelength \u03bb passes through a slit of width 'a', spherical wavelets interfere. The conditions for minima are given by: a * sin(\u03b8) = m * \u03bb, for integers m \u2260 0. For small angles, sin(\u03b8) \u2248 x / D, where 'x' is the distance of the m-th minimum from the central peak, and D is the screen distance. Hence x = m * \u03bb * D / a. The intensity profile follows I(\u03b8) = I_0 * [sin(\u03b1) / \u03b1]^2 where \u03b1 = (\u03c0 * a * sin(\u03b8)) / \u03bb.",
    parameters: [
      { name: "wavelength", label: "Laser Wavelength", min: 400, max: 700, step: 10, unit: "nm", defaultValue: 650 },
      { name: "slitWidth", label: "Slit Width (a)", min: 0.05, max: 0.5, step: 0.01, unit: "mm", defaultValue: 0.12 },
      { name: "distance", label: "Screen Distance (D)", min: 0.5, max: 2.5, step: 0.1, unit: "m", defaultValue: 1.5 }
    ],
    graphXLabel: "Screen Coordinates (mm)",
    graphYLabel: "Relative Light Intensity"
  },
  {
    id: "optical_fibre",
    title: "Optical Fibre Characteristics",
    subtitle: "Numerical Aperture & Bending Loss Analysis",
    objective: "To calculate the Numerical Aperture of a plastic optical fiber using cone projection and quantify optical attenuation due to macro-bending.",
    theory: "Numerical Aperture (NA) measures the fiber's light-gathering capacity: NA = sin(\u03b8_a) = \u221a(n_1^2 - n_2^2) where \u03b8_a is the acceptance angle. In the experiment, laser light projects a circular cone of radius 'r' on a screen at distance 'd', giving NA = r / \u221a(r^2 + d^2). Separately, macro-bending introduces leakage of evanescent modes leading to power drop P_out = P_in * exp(- \u03b1_bend / R_bend).",
    parameters: [
      { name: "screenDist", label: "Screen Distance (d)", min: 10, max: 100, step: 5, unit: "mm", defaultValue: 30 },
      { name: "launchForce", label: "Laser Input Power", min: 1, max: 10, step: 0.5, unit: "mW", defaultValue: 5 },
      { name: "bendRadius", label: "Bending Radius (R)", min: 5, max: 50, step: 1, unit: "mm", defaultValue: 25 }
    ],
    graphXLabel: "Screen Distance d (mm)",
    graphYLabel: "Projected Ring Radius r (mm)"
  },
  {
    id: "transistor_char",
    title: "Transistor Characteristics",
    subtitle: "NPN Common Emitter input & Output characteristics",
    objective: "To trace the Input (I_B vs V_BE) and Output (I_C vs V_CE) current-voltage characteristics of an NPN junction transistor in CE configuration.",
    theory: "In common-emitter configuration, input characteristics show base current I_B versus base-emitter voltage V_BE at fixed collector-emitter voltage V_CE. The behavior mimics a forward-biased diode with a threshold knee (0.7V for Silcon). Output characteristics trace I_C versus V_CE at fixed base currents I_B. This shows three modes: Saturation (where both junctions are forward biased, current jumps), Active (collector current is stable, I_C = \u03b2 * I_B), and Cutoff (where input base current is zero).",
    parameters: [
      { name: "vbe", label: "Base Supply Volt (V_BB)", min: 0, max: 3, step: 0.1, unit: "V", defaultValue: 0.7 },
      { name: "vce", label: "Collector Supply Volt (V_CC)", min: 0, max: 12, step: 0.5, unit: "V", defaultValue: 5 },
      { name: "baseRes", label: "Base series R_B", min: 10, max: 100, step: 5, unit: "k\u03a9", defaultValue: 47 }
    ],
    graphXLabel: "Collector-Emitter Voltage V_CE (V)",
    graphYLabel: "Collector Current I_C (mA)"
  },
  {
    id: "planck_led",
    title: "Planck's Constant using LED",
    subtitle: "Turn-on Junction Threshold Energy Profile",
    objective: "To measure the knee (turn-on) voltage for different colored LEDs, correlate barrier potentials to photon frequencies, and estimate Planck's Constant.",
    theory: "Monochromatic LEDs light up when the applied voltage overcomes the semiconductor's energy bandgap E_g. In emitting light, the electric energy e * V_knee \u2248 E_g \u2248 h * \u03bd = h * c / \u03bb, where h is Planck's constant, c is light speed, \u03bb is wavelength, and e is electron charge. Thus, the slope of the knee voltage V_knee vs frequency (c/\u03bb) is h/e from which Planck's constant is directly extracted.",
    parameters: [
      { name: "biasVolt", label: "Forward Bias Voltage", min: 0, max: 4, step: 0.05, unit: "V", defaultValue: 2.0 },
      { name: "waveSelect", label: "Wavelength Wylie (\u03bb)", min: 460, max: 650, step: 5, unit: "nm", defaultValue: 650 },
      { name: "temp", label: "Junction Temperature", min: 20, max: 100, step: 5, unit: "\u00b0C", defaultValue: 25 }
    ],
    graphXLabel: "Bias Voltage V_F (V)",
    graphYLabel: "Forward Current I_F (mA)"
  },
  {
    id: "energy_gap",
    title: "Energy Gap of Semiconductor",
    subtitle: "Temperature Derivation of p-n Reverse Saturation Current",
    objective: "To monitor the reverse saturation leakage current of a diode as a function of temperature inside an oven and compute the bandgap energy (Eg).",
    theory: "In a reverse-biased semiconductor diode, charge flow is dominated by minority carriers, resulting in reverse saturation current: I_s(T) \u221d T^3 * exp(-E_g / (2 * k_B * T)) or approximately ln(I_s) = C - E_g / (2 * k_B * T). Working under a semi-log scale, we plot ln(I_s) vs 1000/T (where T is absolute temperature in Kelvin). The resulting straight line has a slope m = -E_g / (2 * k_B * 1000), allowing Eg calculation.",
    parameters: [
      { name: "ovenTemp", label: "Diode Oven Temp (K)", min: 290, max: 370, step: 2, unit: "K", defaultValue: 300 },
      { name: "revBias", label: "Reverse Bias Voltage", min: 1, max: 10, step: 0.5, unit: "V", defaultValue: 5 },
      { name: "doping", label: "Doping density marker", min: 1, max: 10, step: 1, unit: "index", defaultValue: 5 }
    ],
    graphXLabel: "Reciprocal Temperature 1000/T (K\u207b\u00b9)",
    graphYLabel: "Saturation Current ln(I_s) (\u03bcA)"
  },
  {
    id: "photodiode",
    title: "Characteristics of Phododiode (For Viva, Conceptual)",
    subtitle: "Photon Absorption Current vs Distal Illumination",
    objective: "To investigate reverse bias photo currents of a Silicon photodiode under various radiant flux densities and calculate responsive levels.",
    theory: "A photodiode operates in reverse bias. When light of matching energy falls on the depletion zone, it creates electron-hole pairs. The reverse photocurrent I_p is directly proportional to illumination intensity: I_total = I_dark + I_photo where I_photo \u221d \u03a6 (lux). Since intensity from a source drops with distance 'd' via inverse square law (\u03a6 \u221d 1/d\u00b2), photocurrent rises linearly with light level or inversely with square distance.",
    parameters: [
      { name: "luxPower", label: "Source Lamp Power", min: 10, max: 100, step: 5, unit: "W", defaultValue: 40 },
      { name: "lampDistance", label: "Lamp Distance (d)", min: 10, max: 100, step: 5, unit: "cm", defaultValue: 50 },
      { name: "revVolt", label: "Reverse Voltage (V_R)", min: 0, max: 15, step: 0.5, unit: "V", defaultValue: 5 }
    ],
    graphXLabel: "Applied Reverse Voltage V_R (V)",
    graphYLabel: "Total Current I_R (\u03bca)"
  }
];

export type OceanTrait = 'Openness' | 'Conscientiousness' | 'Extraversion' | 'Agreeableness' | 'Neuroticism';

export interface Question {
  id: number;
  text: string;
  trait: OceanTrait;
  isReversed: boolean;
}

export interface OceanScores {
  Openness: number;
  Conscientiousness: number;
  Extraversion: number;
  Agreeableness: number;
  Neuroticism: number;
}

export interface IdeaSuggestion {
  title: string;
  description: string;
  reason: string;
  category: 'Project' | 'Career' | 'Hobby';
}

