/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimulationResult } from "../types";

// Physical Constants
const h_real = 6.626e-34; // J s
const e_real = 1.602e-19; // C
const c_real = 3e8;       // m/s
const k_B_eV = 8.6173e-5; // eV/K

// Helper to add minor physics-simulation fluctuations
const addNoise = (val: number, amp: number = 0.01) => {
  return val + (Math.random() - 0.5) * amp * val;
};

// 1. Black Box Impedance Simulation
export function simulateBlackBox(
  voltage: number,
  frequency: number,
  loadResistance: number
): { current: number; impedance: number; detectedComponents: string; graphData: SimulationResult[] } {
  // Let the hidden circuits inside the Black Box be:
  // A series Combination of R = 150 Ohm, L = 0.08 Henry, C = 4.7 uF
  const R_hidden = 150;
  const L_hidden = 0.08;
  const C_hidden = 4.7e-6;

  // Calculate impedance at user's current choice
  const w = 2 * Math.PI * frequency;
  const X_L = w * L_hidden;
  const X_C = 1 / (w * C_hidden || 1);
  const R_total = R_hidden + loadResistance;
  const reactance = X_L - X_C;

  const Z = Math.sqrt(R_total * R_total + reactance * reactance);
  // Current in mA (I = V / Z * 1000)
  const I = (voltage / Z) * 1000;

  // Generate graph data over frequency spectrum (50Hz to 2000Hz)
  const graphData: SimulationResult[] = [];
  for (let f = 50; f <= 2000; f += 50) {
    const w_g = 2 * Math.PI * f;
    const XL_g = w_g * L_hidden;
    const XC_g = 1 / (w_g * C_hidden);
    const Z_g = Math.sqrt((R_total) ** 2 + (XL_g - XC_g) ** 2);
    graphData.push({
      x: f,
      y: parseFloat((Z_g / 1000).toFixed(3)) // Express in k-ohms
    });
  }

  // Resonance calculation
  const f_res = 1 / (2 * Math.PI * Math.sqrt(L_hidden * C_hidden));

  return {
    current: parseFloat(addNoise(I, 0.005).toFixed(2)),
    impedance: parseFloat((Z / 1000).toFixed(3)),
    detectedComponents: `Resistive load + Reactance. Resonance occurs at ~${Math.round(f_res)} Hz. Series R-L-C configuration.`,
    graphData
  };
}

// 2. Laser Diffraction Intensity Profile Simulation
export function simulateLaserDiffraction(
  wavelength: number, // nm
  slitWidth: number,   // mm
  distance: number     // meters
): { centralWidth: number; graphData: SimulationResult[] } {
  const lambda = wavelength * 1e-9; // m
  const a_m = slitWidth * 1e-3;     // m
  const D_m = distance;             // m

  // Generate pattern from -15 mm to +15 mm screen coords
  const graphData: SimulationResult[] = [];
  const steps = 150;
  for (let i = -steps; i <= steps; i++) {
    const x_mm = (i * 15) / steps; // -15 mm to 15 mm
    const x_m = x_mm * 1e-3;

    // Angle of diffraction: theta approx x / D
    const theta = Math.atan(x_m / D_m);
    const alpha = (Math.PI * a_m * Math.sin(theta)) / lambda;

    let intensity = 1.0;
    if (Math.abs(alpha) > 1e-5) {
      intensity = (Math.sin(alpha) / alpha) ** 2;
    }

    graphData.push({
      x: parseFloat(x_mm.toFixed(2)),
      y: parseFloat((intensity * 100).toFixed(1)) // Express as % of peak
    });
  }

  // Width of central maximum (first minimum condition: a * sin(theta) = lambda)
  const x_min = (lambda * D_m) / a_m; // in meters (positive first minimum)
  const centralWidthMm = x_min * 1e3 * 2; // Full width is 2 * x_min

  return {
    centralWidth: parseFloat(centralWidthMm.toFixed(2)),
    graphData
  };
}

// 3. Optical Fiber Characteristics Simulation
export function simulateOpticalFiber(
  screenDist: number, // mm
  launchForce: number, // mW
  bendRadius: number   // mm
): { projectedRadius: number; numericalAperture: number; powerOut: number; attenDb: number; graphData: SimulationResult[] } {
  // Let indices: Core n1=1.492, Cladding n2=1.450
  const n1 = 1.492;
  const n2 = 1.450;
  const NA = Math.sqrt(n1 * n1 - n2 * n2); // ~0.3516

  // Projected cone radius: r = d * tan(theta_acceptance)
  // sin(theta_a) = NA => tan(theta_a) = NA / sqrt(1 - NA^2)
  const tanTheta = NA / Math.sqrt(1 - NA * NA);
  const r = screenDist * tanTheta;

  // Attenuation due to macro-bending (empirical curve)
  // Bending loss increases exponentially as bend radius decreases
  const criticalRadius = 8; // mm (at which leakage skyrockets)
  let lossCoefficient = 0.0;
  if (bendRadius > criticalRadius) {
    lossCoefficient = 30 * Math.exp(-0.16 * bendRadius);
  } else {
    // Severe micro/macro loss below critical limits
    lossCoefficient = 30 * Math.exp(-0.16 * bendRadius) + (criticalRadius - bendRadius) * 2;
  }

  const attenuationDb = parseFloat(lossCoefficient.toFixed(2));
  // P_out = P_in * 10^(-L/10)
  const pOut = launchForce * 10 ** (-attenuationDb / 10);

  // Generate data showing ring radius versus screen distance
  const graphData: SimulationResult[] = [];
  for (let d = 10; d <= 100; d += 10) {
    graphData.push({
      x: d,
      y: parseFloat((d * tanTheta).toFixed(1))
    });
  }

  return {
    projectedRadius: parseFloat(r.toFixed(2)),
    numericalAperture: parseFloat(NA.toFixed(4)),
    powerOut: parseFloat(Math.max(0, pOut).toFixed(3)),
    attenDb: attenuationDb,
    graphData
  };
}

// 4. Transistor Common Emitter characteristics Simulation
export function simulateTransistor(
  vbb: number,      // Base supply voltage, V
  vcc: number,      // Collector supply voltage, V
  baseResistKey: number // Base series resistance (k-ohms)
): { ibMicroAmps: number; icMilliAmps: number; graphData: SimulationResult[] } {
  const beta = 135;
  const V_be_on = 0.68; // turn on voltage

  // Calculate base current
  let ib = 0;
  if (vbb > V_be_on) {
    ib = (vbb - V_be_on) / (baseResistKey); // mA
  }

  const ibMicro = ib * 1000; // microAmps

  // Collector load resistor is say 1.2 kOhm
  const RL = 1.2; // k-ohm
  const icActive = (beta * ibMicro) / 1000; // mA
  const icSat = vcc / RL; // max possible current

  // Active current is constrained by saturation
  const actualIc = Math.min(icActive, icSat);

  // Generate output curve data: Ic (mA) vs V_CE (V) from 0V to 15V for this active Ib
  const graphData: SimulationResult[] = [];
  for (let vce = 0; vce <= 12; vce += 0.5) {
    // Smooth transition from saturation into active region using exponential model
    const saturationFactor = 1 - Math.exp(-vce / 0.7);
    const simulatedIc = Math.min(icActive * saturationFactor, vcc / RL);
    graphData.push({
      x: vce,
      y: parseFloat(simulatedIc.toFixed(2))
    });
  }

  return {
    ibMicroAmps: parseFloat(ibMicro.toFixed(1)),
    icMilliAmps: parseFloat(actualIc.toFixed(2)),
    graphData
  };
}

// 5. Planck's Constant using LED
export function simulatePlanckLed(
  biasVoltage: number,
  wavelength: number, // nm
  temperature: number  // degrees C
): { forwardCurrent: number; kneeVoltage: number; graphData: SimulationResult[] } {
  // Convert wavelength nm to knee turn-on voltage
  // Eg = h * c / lambda => V_knee = h_eV * c / lambda_m
  const h_eV = 4.135667e-15;
  const lambda_m = wavelength * 1e-9;
  const idealVknee = (h_eV * c_real) / lambda_m;

  // Apply minor thermal variation to the knee voltage
  const tempK = temperature + 273.15;
  const thermalShift = (tempK - 298.15) * -0.002; // -2mV per degree C
  const kneeVoltage = idealVknee + thermalShift;

  // I-V forward curve calculation: Shockley Diode equation approximation
  const nUt = 2 * 0.0259 * (tempK / 298.15); // emission coeff * thermal voltage
  let forwardCurrent = 0;
  if (biasVoltage > 0) {
    // Simple scaled exponential model for lab LED bias scale
    forwardCurrent = 0.01 * (Math.exp((biasVoltage - kneeVoltage) / 0.08) - 1);
    if (forwardCurrent < 0) forwardCurrent = 0;
    // Cap output safe level
    if (forwardCurrent > 50) forwardCurrent = 50;
  }

  // Generate dynamic V-I curve data for graph
  const graphData: SimulationResult[] = [];
  for (let v = 0; v <= 3.5; v += 0.1) {
    let curr = 0;
    if (v > 0) {
      curr = 0.01 * (Math.exp((v - kneeVoltage) / 0.08) - 1);
    }
    graphData.push({
      x: parseFloat(v.toFixed(1)),
      y: parseFloat(Math.max(0, Math.min(50, curr)).toFixed(2))
    });
  }

  return {
    forwardCurrent: parseFloat(forwardCurrent.toFixed(2)),
    kneeVoltage: parseFloat(kneeVoltage.toFixed(3)),
    graphData
  };
}

// 6. Energy Gap of Semiconductor Simulation
export function simulateEnergyGap(
  ovenTempK: number,
  reverseBias: number
): { saturationCurrent: number; invTemp: number; lnIs: number; graphData: SimulationResult[] } {
  // For Germanium, Eg = 0.67 eV. Silicon is ~1.12 eV.
  // Let's model a Germanium diode typically used in this thermal experiment
  const Eg_eV = 0.72;
  const k_B = 8.6173e-5; // eV/K

  // Is(T) = I_0 * exp(-Eg / (2 * k_B * T))
  const I_0 = 8.5e4; // scaling constant for microAmps
  const isCurrent = I_0 * Math.exp(-Eg_eV / (2 * k_B * ovenTempK));

  // Add small reverse bias voltage helper (leakage scales slightly with V_reverse)
  const isVoltCorrected = isCurrent * (1 + 0.03 * reverseBias);

  const invT = 1000 / ovenTempK;
  const lnIsValue = Math.log(isVoltCorrected);

  // Generate standard graph coordinates: ln(Is) vs 1000/T (Reciprocal Kelvin)
  const graphData: SimulationResult[] = [];
  // Oven temp varies from 290K to 370K
  for (let t = 290; t <= 370; t += 5) {
    const isVal = I_0 * Math.exp(-Eg_eV / (2 * k_B * t)) * (1 + 0.03 * reverseBias);
    graphData.push({
      x: parseFloat((1000 / t).toFixed(4)),
      y: parseFloat(Math.log(isVal).toFixed(3))
    });
  }

  return {
    saturationCurrent: parseFloat(isVoltCorrected.toFixed(4)),
    invTemp: parseFloat(invT.toFixed(4)),
    lnIs: parseFloat(lnIsValue.toFixed(3)),
    graphData
  };
}

// 7. Characteristics of Photodiode Simulation
export function simulatePhotodiode(
  lampPower: number,      // W
  lampDistance: number,   // cm
  reverseVoltage: number  // V
): { photocurrent: number; darkCurrent: number; totalCurrent: number; graphData: SimulationResult[] } {
  // Illuminance decreases via Inverse Square Law: Lux = C * Power / d^2
  const distanceFactor = Math.max(5, lampDistance); // prevent division by zero
  const lux = (1500 * lampPower) / (distanceFactor * distanceFactor); // Lux estimate

  // Photocurrent relates linearly with Lux
  const sensitivity = 0.18; // microAmps / Lux
  const maxIph = lux * sensitivity;

  // Dark current is minimal (nA) but scales slightly with temp/voltage
  const darkCurrentMicro = 0.02 * (1 + 0.15 * reverseVoltage);

  // Total current scales with applied Reverse Voltage up to saturation
  const totalCurrentMicro = darkCurrentMicro + maxIph * (1 - Math.exp(-reverseVoltage / 0.8));

  // Generate photodiode reverse characteristics plot: I_R (uA) vs V_R (V)
  const graphData: SimulationResult[] = [];
  for (let vr = 0; vr <= 15; vr += 0.5) {
    const cur = darkCurrentMicro + maxIph * (1 - Math.exp(-vr / 0.8));
    graphData.push({
      x: vr,
      y: parseFloat(cur.toFixed(2))
    });
  }

  return {
    photocurrent: parseFloat(maxIph.toFixed(2)),
    darkCurrent: parseFloat(darkCurrentMicro.toFixed(3)),
    totalCurrent: parseFloat(totalCurrentMicro.toFixed(2)),
    graphData
  };
}
