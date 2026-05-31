/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { OCEAN_QUESTIONNAIRE, LabStats, OceanResult } from "../types";
import { Brain, Sparkles, UserCheck, TrendingUp, Compass, Award, ShieldAlert, BookOpen, RefreshCw, Download } from "lucide-react";
import * as jsPDFModule from "jspdf";
// @ts-ignore
import domtoimage from "dom-to-image-more";

interface OceanAnalysisCardProps {
  labStats: LabStats;
  onResetStats: () => void;
}

export default function OceanAnalysisCard({ labStats, onResetStats }: OceanAnalysisCardProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<OceanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Divide 15 questions into steps of 5 for a clean wizard feel
  const questionsPerPage = 5;
  const totalSteps = Math.ceil(OCEAN_QUESTIONNAIRE.length / questionsPerPage);

  const handleSelectScore = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const isCurrentStepComplete = () => {
    const startIndex = currentStep * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const stepQuestions = OCEAN_QUESTIONNAIRE.slice(startIndex, endIndex);
    return stepQuestions.every((q) => answers[q.id] !== undefined);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    setResult(null);

    const formattedAnswers = OCEAN_QUESTIONNAIRE.map((q) => ({
      id: q.id,
      aspectName: q.aspectName,
      value: answers[q.id] || 3,
      questionText: q.statement,
    }));

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

      const response = await fetch("/api/ocean/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          quizAnswers: formattedAnswers,
          labStats,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile profile analysis. Please ensure API key is active.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred while compiling your psychological report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetTest = () => {
    setAnswers({});
    setResult(null);
    setCurrentStep(0);
    setErrorMsg("");
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      setIsGeneratingPdf(true);
      
      // Delay slightly so UI state can update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const el = reportRef.current;
      const imgData = await domtoimage.toPng(el, {
        bgcolor: "#ffffff",
        quality: 1.0,
        width: el.offsetWidth,
        height: el.offsetHeight
      });
      
      // Bulletproof jsPDF constructor lookup
      const JsPDFConstructor = (jsPDFModule as any).default?.jsPDF || (jsPDFModule as any).default || (jsPDFModule as any).jsPDF || jsPDFModule;
      
      const pdf = new JsPDFConstructor({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      pdf.save(`OCEAN_Profile_Report_${timestamp}.pdf`);
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      setErrorMsg("Failed to generate PDF report.");
      alert(`PDF Generation Error: ${error?.message || error}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Trait color guides
  const TRAIT_COLORS: Record<string, { bg: string; bar: string; border: string; text: string }> = {
    o: { bg: "bg-blue-50", bar: "bg-blue-600", border: "border-blue-200", text: "text-blue-700" },
    c: { bg: "bg-emerald-50", bar: "bg-emerald-600", border: "border-emerald-200", text: "text-emerald-700" },
    e: { bg: "bg-purple-50", bar: "bg-purple-600", border: "border-purple-200", text: "text-purple-700" },
    a: { bg: "bg-teal-50", bar: "bg-teal-600", border: "border-teal-200", text: "text-teal-700" },
    n: { bg: "bg-rose-50", bar: "bg-rose-600", border: "border-rose-200", text: "text-rose-700" },
  };

  return (
    <div className="w-full">
      <div className="mb-6 p-5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-blue-500/10 border border-teal-500/20 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-sans font-bold text-slate-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-teal-600" />
              Yantra Nidhi: Personality-Adaptive Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              This intelligence pipeline monitors your simulation behavior (patience thresholds, skip telemetry, and accuracy ratings) and blends them with a focused psychological scale to synthesize your Big Five profile. It produces highly customized advice to conquer your university laboratory examinations.
            </p>
          </div>
          <button
            onClick={onResetStats}
            type="button"
            className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Lab Sessions Stats
          </button>
        </div>

        {/* Lab behavior mini telemetry values */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Played Labs</span>
            <span className="text-sm font-sans font-bold text-slate-800">{labStats.experimentsCompletedCount}</span>
          </div>
          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Viva Queries</span>
            <span className="text-sm font-sans font-bold text-slate-800">{labStats.totalQuestionsAttempted}</span>
          </div>
          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Mean Score</span>
            <span className="text-sm font-sans font-bold text-slate-800">
              {labStats.totalQuestionsAttempted > 0
                ? `${labStats.averageVivaScore.toFixed(1)}/10`
                : "N/A"}
            </span>
          </div>
          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Skips</span>
            <span className="text-sm font-sans font-bold text-slate-800">{labStats.totalSkips}</span>
          </div>
          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Simplifications</span>
            <span className="text-sm font-sans font-bold text-slate-800">{labStats.totalSimplifications}</span>
          </div>
          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-150 text-center">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Pressure (Red)</span>
            <span className="text-sm font-sans font-bold text-rose-600">{labStats.timerUrgentSeconds || 0}s</span>
          </div>
          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-150 text-center">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Timeouts</span>
            <span className="text-sm font-sans font-bold text-rose-600">{labStats.timerExpirationsCount || 0}</span>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
          {isSubmitting ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-teal-100 animate-pulse"></div>
                <div className="absolute inset-x-0 top-0 bottom-0 m-auto w-10 h-10 rounded-full border-4 border-t-teal-600 border-r-teal-600 border-b-transparent border-l-transparent animate-spin"></div>
              </div>
              <h3 className="font-sans font-semibold text-slate-800 text-base flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-5 h-5 text-teal-500" />
                Compiling Personality Profile...
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                Gemini 3.5 is reading your lab session activity records, mapping survey weights, and formulating your scientific examination strategy.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="font-sans font-bold text-slate-800 text-sm">
                    Student Big Five Survey (Step {currentStep + 1} of {totalSteps})
                  </h3>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg font-medium">
                  {Object.keys(answers).length} / {OCEAN_QUESTIONNAIRE.length} Answered
                </span>
              </div>

              {/* Step Questions list */}
              <div className="space-y-4">
                {OCEAN_QUESTIONNAIRE.slice(
                  currentStep * questionsPerPage,
                  currentStep * questionsPerPage + questionsPerPage
                ).map((q) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {q.statement}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold bg-white border border-slate-200 text-slate-500 shrink-0">
                        {q.aspectName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-rose-500 font-medium shrink-0">Disagree Strongly</span>
                      <div className="flex items-center justify-center gap-1.5 flex-1 max-w-md">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleSelectScore(q.id, val)}
                            type="button"
                            className={`w-9 h-9 text-xs font-semibold rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              answers[q.id] === val
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-500/20 scale-105"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-teal-600 font-medium shrink-0">Agree Strongly</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Wizard navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  type="button"
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {currentStep < totalSteps - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!isCurrentStepComplete()}
                    type="button"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 font-sans text-xs font-medium text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < OCEAN_QUESTIONNAIRE.length}
                    type="button"
                    className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-105 font-sans text-xs font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Submit & Generate Synthesis
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Render scientific OCEAN personality report dashboard */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div ref={reportRef} className="space-y-6 bg-slate-50/20 p-1 md:p-2 -mx-1 md:-mx-2 rounded-2xl">
          {/* Header section with Dynamic Archetype */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/6 translate-y-1/6">
              <Compass className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10">
              <span className="text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 font-bold uppercase text-slate-900 px-3 py-1 rounded-full tracking-wider flex items-center gap-1 w-max">
                <Award className="w-3 h-3" />
                Synthesized Personality Archetype
              </span>
              <h1 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight mt-3">
                {result.archetype}
              </h1>
              <p className="text-sm font-sans font-medium text-amber-300 italic mt-1 font-mono">
                &ldquo;{result.archetypeSubtitle}&rdquo;
              </p>
              <div className="text-xs text-slate-350 leading-relaxed mt-4 max-w-4xl border-t border-white/10 pt-4">
                {result.natureDescription}
              </div>
            </div>
          </div>

          {/* Big Five Meter Charting Rows */}
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
            <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Big Five Dimensions Score Breakdown
            </h3>

            <div className="space-y-6">
              {(Object.keys(result.scores) as Array<"o" | "c" | "e" | "a" | "n">).map((traitKey) => {
                const score = result.scores[traitKey];
                const info = result.traits[traitKey];
                const colors = TRAIT_COLORS[traitKey];

                return (
                  <div key={traitKey} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pb-5 last:pb-0 border-b last:border-0 border-slate-100">
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-sans font-bold text-xs text-slate-800">{info.label}</span>
                        <span className={`text-xs font-mono font-bold ${colors.text}`}>{score}%</span>
                      </div>
                      {/* Meter Bar */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${colors.bar}`}
                        ></motion.div>
                      </div>
                    </div>
                    <div className="md:col-span-9 p-3 bg-slate-50/50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                      {info.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Weaknesses Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
              <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 text-emerald-700">
                <Compass className="w-5 h-5 text-emerald-600" />
                Your Study Strengths
              </h3>
              <ul className="space-y-2.5">
                {result.studyAdvice.strengths.map((str, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
              <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 text-rose-700">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Academic Vulnerabilities (Struggle Points)
              </h3>
              <ul className="space-y-2.5">
                {result.studyAdvice.weaknesses.map((weak, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Preparation tips and strategy guidance */}
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-teal-600" />
                Targeted Academic Preparation Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.studyAdvice.preparationTips.map((tip, index) => (
                  <div key={index} className="p-4 bg-teal-50/40 rounded-xl border border-teal-50 text-xs text-slate-700 leading-relaxed font-sans font-medium">
                    <span className="block font-mono text-xs text-teal-600 font-bold mb-1.5">Rule 0{index + 1}</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider mb-2.5">
                Optimal Exam-Hall Strategy Protocol
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
                {result.studyAdvice.examStrategy}
              </p>
            </div>
          </div>
          </div>

          <div className="flex justify-center pt-2 gap-4 flex-wrap">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              type="button"
              className="px-6 py-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:brightness-110 rounded-xl text-xs font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isGeneratingPdf ? "Generating PDF..." : "Download PDF Report"}
            </button>
            <button
              onClick={handleResetTest}
              type="button"
              className="px-6 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-600 bg-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake OCEAN Test
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
