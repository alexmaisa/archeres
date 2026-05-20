"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";
import { IconHelix, IconMath, IconChart, IconFileDown, IconPlus, IconSave, IconCopy, IconWrench, IconBook, IconFileText, IconMerge, IconLightbulb, IconTrendingDown, IconLink, IconRuler, IconUsers, IconRefresh, IconFolder, IconMenu, IconX } from "../../components/Icons";
import { User } from "../../types";
import { encryptText, decryptText } from "../../lib/crypto";
import { getMEK, clearMEK } from "../../lib/session";

interface VariableDefinition {
  name: string;
  role: string;
  scale: string;
}

interface ResearchDesign {
  approach?: string;
  designType?: string;
  formulaType?: string;
  populationSize?: number;
  confidenceLevel?: number;
  marginOfError?: number;
  estimatedProportion?: number;
  analysisMethod?: string;
  variables?: string;
  calculatedSample?: number;
  samplingTechnique?: string;
  isPopulationKnown?: boolean;
}

interface WorkspaceProject {
  id: string;
  title: string;
  description: string;
  researchDesign?: ResearchDesign;
}

export default function WorkspaceClient() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") as string;

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [activeStep, setActiveStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(1);
  const [lastSavedState, setLastSavedState] = useState<{
    approach: string;
    design: string;
    formula: string;
    popSize: number;
    confLevel: number;
    marginError: number;
    samplingTechnique: string;
    isPopKnown: boolean;
    analysisMethod: string;
    variablesJson: string;
  } | null>(null);

  // Premium Custom Alert Dialog States
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertType, setAlertType] = useState<"info" | "warning" | "error" | "success">("warning");

  const triggerAlert = (message: string, title?: string, type: "info" | "warning" | "error" | "success" = "warning") => {
    setAlertMessage(message);
    setAlertTitle(title || t("common.notification"));
    setAlertType(type);
    setAlertOpen(true);
  };

  interface EduDetailContent {
    title: string;
    badge: string;
    definition: string;
    characteristics: string[];
    examples: string[];
    tips: string;
  }

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [eduPopupOpen, setEduPopupOpen] = useState<boolean>(false);
  const [eduPopupItemId, setEduPopupItemId] = useState<string | null>(null);

  // Wizard states
  const [approach, setApproach] = useState<string>("quant");
  const [design, setDesign] = useState<string>("Experimental");
  const [formula, setFormula] = useState<string>("slovin");
  const [popSize, setPopSize] = useState<number>(1000);
  const [confLevel, setConfLevel] = useState<number>(0.95);
  const [marginError, setMarginError] = useState<number>(0.05);
  const [proportion, setProportion] = useState<number>(0.5);
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  const [analysisMethod, setAnalysisMethod] = useState<string>("Multiple Linear Regression");
  const [samplingTechnique, setSamplingTechnique] = useState<string>("Simple Random Sampling");
  const [isPopKnown, setIsPopKnown] = useState<boolean>(true);
  
  // Real-time calculated sample size
  const [sampleSize, setSampleSize] = useState<number>(286);
  // Preview draft language ('id' or 'en')
  const [previewLang, setPreviewLang] = useState<string>("id");
  // Toggle visibility of Right Preview Panel as a sliding drawer
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Custom states for premium utilities
  const [codeTab, setCodeTab] = useState<"python" | "go">("python");
  const [showReliability, setShowReliability] = useState<boolean>(false);
  
  // Reliability States
  const [relType, setRelType] = useState<"cronbach" | "kr20">("cronbach");
  const [relK, setRelK] = useState<number>(5);
  const [relResp, setRelResp] = useState<number>(10);
  const [sumVariances, setSumVariances] = useState<string>("2.5");
  const [totVariance, setTotVariance] = useState<string>("12.4");
  const [sumSuccessProd, setSumSuccessProd] = useState<string>("1.8");
  const [relResult, setRelResult] = useState<number | null>(null);
  const [relStatusKey, setRelStatusKey] = useState<string>("");
  const [inputMode, setInputMode] = useState<"aggregate" | "grid">("aggregate");
  const [isReliabilityIntegrated, setIsReliabilityIntegrated] = useState<boolean>(false);
  
  const [relMatrix, setRelMatrix] = useState<number[][]>(() => 
    Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 4))
  );

  const calculateReliability = () => {
    if (relK <= 1 || relResp <= 1) {
      setRelResult(null);
      setRelStatusKey("error_insufficient");
      return;
    }

    let result = 0;
    if (inputMode === "aggregate") {
      const k = relK;
      const vt = parseFloat(totVariance) || 0;
      if (vt <= 0.0001) {
        setRelResult(null);
        setRelStatusKey("error_variance");
        return;
      }

      if (relType === "cronbach") {
        const viSum = parseFloat(sumVariances) || 0;
        result = (k / (k - 1)) * (1 - viSum / vt);
      } else {
        const pqSum = parseFloat(sumSuccessProd) || 0;
        result = (k / (k - 1)) * (1 - pqSum / vt);
      }
    } else {
      // Grid mode
      const k = relK;
      const N = relResp;

      // 1. Calculate item statistics
      let viSum = 0; // for Cronbach
      let pqSum = 0; // for KR-20

      for (let j = 0; j < k; j++) {
        const responses = [];
        for (let i = 0; i < N; i++) {
          const val = relMatrix[i]?.[j] !== undefined ? relMatrix[i][j] : (relType === "kr20" ? 1 : 4);
          responses.push(val);
        }

        // Calculate mean
        const mean = responses.reduce((acc, curr) => acc + curr, 0) / N;

        // Calculate variance (sample variance with N-1 in denominator)
        const squaredDiffs = responses.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / (N - 1);
        viSum += variance;

        // For KR-20
        if (relType === "kr20") {
          const p = responses.filter(v => v >= 0.5).length / N;
          const q = 1 - p;
          pqSum += p * q;
        }
      }

      // 2. Calculate total test scores for each respondent
      const totalScores = [];
      for (let i = 0; i < N; i++) {
        let sum = 0;
        for (let j = 0; j < k; j++) {
          const val = relMatrix[i]?.[j] !== undefined ? relMatrix[i][j] : (relType === "kr20" ? 1 : 4);
          sum += val;
        }
        totalScores.push(sum);
      }

      // Calculate mean of total scores
      const totalMean = totalScores.reduce((acc, curr) => acc + curr, 0) / N;

      // Calculate total variance (sample variance)
      const totalSquaredDiffs = totalScores.map(val => Math.pow(val - totalMean, 2));
      const vt = totalSquaredDiffs.reduce((acc, curr) => acc + curr, 0) / (N - 1);

      if (vt <= 0.0001) {
        setRelResult(null);
        setRelStatusKey("error_variance");
        return;
      }

      if (relType === "cronbach") {
        result = (k / (k - 1)) * (1 - viSum / vt);
      } else {
        result = (k / (k - 1)) * (1 - pqSum / vt);
      }
    }

    const rounded = Math.round(result * 10000) / 10000;
    setRelResult(rounded);

    if (rounded >= 0.90) setRelStatusKey("excellent");
    else if (rounded >= 0.80) setRelStatusKey("good");
    else if (rounded >= 0.70) setRelStatusKey("acceptable");
    else if (rounded >= 0.60) setRelStatusKey("minimum");
    else setRelStatusKey("unreliable");
  };

  useEffect(() => {
    // Authenticate session locally
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }
    setUser(JSON.parse(savedUser));
    fetchProjectDetails();

    setMounted(true);
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Whenever calculation variables change, execute calculator client-side immediately!
  useEffect(() => {
    calculateSample();
  }, [formula, popSize, confLevel, marginError, proportion]);

  // Automatically shut draft preview drawer if all variables are removed
  useEffect(() => {
    if (variables.length === 0) {
      setShowPreview(false);
    }
  }, [variables]);

  // Synchronize response grid matrix dimension when relK or relResp changes
  useEffect(() => {
    setRelMatrix(prev => {
      const defaultVal = relType === "kr20" ? 1 : 4;
      const newMatrix = Array.from({ length: relResp }, (_, r) => {
        const prevRow = prev[r] || [];
        return Array.from({ length: relK }, (_, c) => {
          if (prevRow[c] !== undefined) {
            // Keep existing cell value but clamp if metric type changes
            if (relType === "kr20") {
              return prevRow[c] > 0.5 ? 1 : 0;
            }
            return prevRow[c];
          }
          return defaultVal;
        });
      });
      return newMatrix;
    });
  }, [relK, relResp, relType]);

  // Execute reliability calculations client-side E2EE reactively
  useEffect(() => {
    calculateReliability();
  }, [relType, relK, relResp, sumVariances, totVariance, sumSuccessProd, inputMode, relMatrix]);
  const handleApproachChange = (apId: string) => {
    setApproach(apId);
    setMaxUnlockedStep(1); // Reset progression when paradigm changes
    if (apId === "quant") {
      setFormula("slovin");
      setSamplingTechnique("Simple Random Sampling");
      setDesign("Experimental");
      setIsPopKnown(true);
    } else if (apId === "qual") {
      setFormula("saturation");
      setSamplingTechnique("Purposive Sampling");
      setDesign("Case Study");
      setSampleSize(15); // Default qualitative target
    } else if (apId === "mixed") {
      setFormula("slovin");
      setSamplingTechnique("Sequential Mixed Sampling");
      setDesign("Convergent Parallel");
      setIsPopKnown(true);
    }
  };
  const handlePopKnownChange = (known: boolean) => {
    setIsPopKnown(known);
    if (known) {
      setFormula("slovin");
    } else {
      setFormula("cochran");
    }
  };
  const isStepUnlocked = (stepNum: number): boolean => {
    return stepNum <= maxUnlockedStep;
  };
  const isStepCompleted = (stepNum: number): boolean => {
    if (!lastSavedState) return false;

    if (stepNum === 1) {
      return (
        lastSavedState.approach === approach &&
        lastSavedState.design === design &&
        design !== "Undetermined"
      );
    }

    if (stepNum === 2) {
      return (
        lastSavedState.formula === formula &&
        lastSavedState.popSize === popSize &&
        lastSavedState.confLevel === confLevel &&
        lastSavedState.marginError === marginError &&
        lastSavedState.samplingTechnique === samplingTechnique &&
        lastSavedState.isPopKnown === isPopKnown &&
        !!lastSavedState.samplingTechnique
      );
    }

    if (stepNum === 3) {
      return (
        lastSavedState.analysisMethod === analysisMethod &&
        lastSavedState.variablesJson === JSON.stringify(variables) &&
        variables.length > 0
      );
    }

    if (stepNum === 4) {
      return isStepCompleted(3);
    }

    return false;
  };
  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<WorkspaceProject>(`/api/projects/${projectId}`, { method: "GET" });
      const mek = await getMEK();

      if (mek) {
        // Decrypt only sensitive content fields
        data.title = await decryptText(data.title, mek).catch(() => data.title);
        if (data.description) data.description = await decryptText(data.description, mek).catch(() => data.description);

        if (data.researchDesign) {
          const rd = data.researchDesign;
          // approach and designType are NOT encrypted (enum metadata for admin stats)
          if (rd.variables) {
            rd.variables = await decryptText(rd.variables, mek).catch(() => rd.variables);
          }
          if (rd.analysisMethod) {
            rd.analysisMethod = await decryptText(rd.analysisMethod, mek).catch(() => rd.analysisMethod);
          }
        }
      }

      setProject(data);

      // Load saved research design wizard state if present
      if (data.researchDesign) {
        const rd = data.researchDesign;
        if (rd.approach) setApproach(rd.approach);
        if (rd.designType) setDesign(rd.designType);
        if (rd.formulaType) setFormula(rd.formulaType);
        if (rd.populationSize !== undefined) setPopSize(rd.populationSize);
        if (rd.confidenceLevel !== undefined) setConfLevel(rd.confidenceLevel);
        if (rd.marginOfError !== undefined) setMarginError(rd.marginOfError);
        if (rd.estimatedProportion !== undefined) setProportion(rd.estimatedProportion);
        if (rd.analysisMethod) setAnalysisMethod(rd.analysisMethod);
        if (rd.samplingTechnique) setSamplingTechnique(rd.samplingTechnique);
        if (rd.isPopulationKnown !== undefined) setIsPopKnown(rd.isPopulationKnown);
        if (rd.calculatedSample !== undefined) setSampleSize(rd.calculatedSample);
        
        let loadedVariables: VariableDefinition[] = [];
        if (rd.variables) {
          try {
            loadedVariables = JSON.parse(rd.variables);
            setVariables(loadedVariables);
          } catch (e) {
            // Keep default
          }
        }

        // Determine highest step reached dynamically based on persisted database fields
        let initialMaxStep = 1;
        if (rd.designType && rd.designType !== "Undetermined") {
          initialMaxStep = 2;
          if (rd.samplingTechnique) {
            initialMaxStep = 3;
            if (loadedVariables.length > 0) {
              initialMaxStep = 4;
            }
          }
        }
        setMaxUnlockedStep(initialMaxStep);

        if (rd.designType && rd.designType !== "Undetermined") {
          setLastSavedState({
            approach: rd.approach || "quant",
            design: rd.designType || "Experimental",
            formula: rd.formulaType || "slovin",
            popSize: rd.populationSize !== undefined ? rd.populationSize : 1000,
            confLevel: rd.confidenceLevel !== undefined ? rd.confidenceLevel : 0.95,
            marginError: rd.marginOfError !== undefined ? rd.marginOfError : 0.05,
            samplingTechnique: rd.samplingTechnique || "Simple Random Sampling",
            isPopKnown: rd.isPopulationKnown !== undefined ? rd.isPopulationKnown : true,
            analysisMethod: rd.analysisMethod || "Multiple Linear Regression",
            variablesJson: rd.variables || "[]",
          });
        } else {
          setLastSavedState(null);
        }
      }
    } catch (err: any) {
      alert(err.message || t("common.errorOccurred"));
      router.push("/user/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // Continue cleanup anyway
    }
    clearMEK();
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const handleLanguageToggle = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // 6 Scientifically Validated Formulas client-side (matches Golang backend precision tests)
  const calculateSample = () => {
    if (formula === "saturation") {
      return;
    }
    const N = Number(popSize);
    const e = Number(marginError);
    const p = Number(proportion);
    const q = 1 - p;

    // Map confidence level Z-values
    let z = 1.96; // Default 95%
    if (confLevel === 0.90) z = 1.645;
    else if (confLevel === 0.99) z = 2.576;

    let n = 0;

    switch (formula) {
      case "slovin":
        // n = N / (1 + N * e^2)
        n = N / (1 + N * (e * e));
        break;

      case "cochran":
        // n_0 = (Z^2 * p * q) / e^2
        n = (z * z * p * q) / (e * e);
        break;

      case "lemeshow":
        // WHO finite correction: n_0 = (z^2 * p * q) / e^2, then n = n_0 / (1 + (n_0 - 1)/N)
        const n0Lemeshow = (z * z * p * q) / (e * e);
        n = n0Lemeshow / (1 + (n0Lemeshow - 1) / N);
        break;

      case "krejcie_morgan":
        // chi^2 (3.841 for 95%) * N * p * q / (e^2 * (N-1) + chi^2 * p * q)
        const chi2 = 3.841;
        const num = chi2 * N * p * q;
        const den = (e * e) * (N - 1) + chi2 * p * q;
        n = num / den;
        break;

      case "yamane":
        // Identical to Slovin
        n = N / (1 + N * (e * e));
        break;

      case "daniel":
        // Bio-statistical: (z^2 * p * q) / e^2
        n = (z * z * p * q) / (e * e);
        break;

      case "isaac_michael":
        let chi2IM = 3.841;
        if (e <= 0.01) chi2IM = 6.635;
        else if (e <= 0.05) chi2IM = 3.841;
        else chi2IM = 2.706;
        const numIM = chi2IM * N * p * q;
        const denIM = (e * e) * (N - 1) + chi2IM * p * q;
        n = numIM / denIM;
        break;

      case "arikunto":
        if (N < 100) n = N;
        else {
          let pct = e;
          if (pct <= 0 || pct > 1.0) pct = 0.10;
          n = N * pct;
        }
        break;

      case "gay_diehl":
        if (design === "Correlational") n = 30;
        else if (design === "Experimental" || design === "Quasi-Experimental" || design === "Causal-Comparative") n = 60;
        else if (design === "Survey / Descriptive") {
           if (N <= 0) {
             n = 100;
           } else {
             let calc = N * 0.10;
             if (N < 1000) calc = N * 0.20;
             n = calc > N ? N : calc;
           }
        } else {
           n = variables.length > 0 ? 10 * variables.length : 30;
        }
        break;

      case "kish_leslie":
        n = (z * z * p * q) / (e * e);
        break;

      default:
        n = N / (1 + N * (e * e));
    }

    // Mathematical scientific ceiling rounding
    const finalSize = Math.ceil(n);
    // Boundary check
    setSampleSize(finalSize > N ? N : finalSize < 1 ? 1 : finalSize);
  };

  const getSensitivityData = () => {
    const N = Number(popSize);
    const p = Number(proportion);
    const q = 1 - p;
    let z = 1.96;
    if (confLevel === 0.90) z = 1.645;
    else if (confLevel === 0.99) z = 2.576;

    const dataPoints: { e: number; n: number }[] = [];
    const minE = formula === "arikunto" ? 0.10 : 0.01;
    const maxE = formula === "arikunto" ? 0.25 : 0.20;
    const step = (maxE - minE) / 39; // exactly 40 points
    
    for (let i = 0; i < 40; i++) {
      const e = minE + i * step;
      let nVal = 0;
      switch (formula) {
        case "slovin":
        case "yamane":
          nVal = N / (1 + N * (e * e));
          break;
        case "cochran":
        case "kish_leslie":
          nVal = (z * z * p * q) / (e * e);
          break;
        case "lemeshow":
          const n0L = (z * z * p * q) / (e * e);
          nVal = n0L / (1 + (n0L - 1) / N);
          break;
        case "krejcie_morgan":
          const chi2 = 3.841;
          nVal = (chi2 * N * p * q) / ((e * e) * (N - 1) + chi2 * p * q);
          break;
        case "daniel":
          nVal = (z * z * p * q) / (e * e);
          break;
        case "isaac_michael":
          let chi2IM = 3.841;
          if (e <= 0.01) chi2IM = 6.635;
          else if (e <= 0.05) chi2IM = 3.841;
          else chi2IM = 2.706;
          nVal = (chi2IM * N * p * q) / ((e * e) * (N - 1) + chi2IM * p * q);
          break;
        case "arikunto":
          if (N < 100) nVal = N;
          else nVal = N * e;
          break;
        case "gay_diehl":
          if (design === "Survey / Descriptive") {
            if (N < 1000) nVal = N * 0.20;
            else nVal = N * 0.10;
          } else {
            if (design === "Correlational") nVal = 30;
            else if (design === "Experimental" || design === "Quasi-Experimental" || design === "Causal-Comparative") nVal = 60;
            else nVal = variables.length > 0 ? 10 * variables.length : 30;
          }
          break;
        default:
          nVal = N / (1 + N * (e * e));
      }

      let roundedN = Math.ceil(nVal);
      if (roundedN > N) roundedN = N;
      if (roundedN < 1) roundedN = 1;
      dataPoints.push({ e, n: roundedN });
    }
    return dataPoints;
  };

  const getStatisticalRecommendation = () => {
    if (variables.length === 0) {
      return {
        testNameId: "Statistik Deskriptif dan Inferensial",
        testNameEn: "Descriptive and Inferential Statistics",
        whyId: "Belum ada variabel yang didefinisikan. Tambahkan variabel di atas untuk mengaktifkan analisis otomatis.",
        whyEn: "No variables defined yet. Add variables above to enable automated advice.",
        codePython: "# Define variables first to see code generator",
        codeGo: "// Define variables first to see code generator"
      };
    }

    const ivs = variables.filter(v => v.role === "Independent (Cause)" || v.role === "Independent (Sebab)" || v.role === "Independent (Sebab)");
    const dvs = variables.filter(v => v.role === "Dependent (Effect)" || v.role === "Dependent (Akibat)");
    
    const isNominal = (scale: string) => scale.toLowerCase().includes("nominal");
    const isOrdinal = (scale: string) => scale.toLowerCase().includes("ordinal");
    const isIntervalOrRatio = (scale: string) => scale.toLowerCase().includes("interval") || scale.toLowerCase().includes("ratio") || scale.toLowerCase().includes("rasio");

    // 1. Nominal IV + 1 continuous DV -> Independent T-Test
    if (ivs.length === 1 && dvs.length === 1 && isNominal(ivs[0].scale) && isIntervalOrRatio(dvs[0].scale)) {
      const ivName = ivs[0].name || "IV";
      const dvName = dvs[0].name || "DV";
      return {
        testNameId: "Uji-t Dua Sampel Independen (Independent t-Test)",
        testNameEn: "Independent Samples t-Test",
        whyId: `Menganalisis perbedaan rata-rata variabel dependen '${dvName}' (rasio/interval) antara dua kelompok terpisah pada variabel bebas '${ivName}' (nominal).`,
        whyEn: `Compares the mean score of the interval/ratio dependent variable '${dvName}' across two distinct categories of the independent variable '${ivName}'.`,
        codePython: `import scipy.stats as stats
import pandas as pd

# Load dataset
df = pd.read_csv("research_data.csv")
# Group DV scores by IV categories
group1 = df[df['${ivName}'] == df['${ivName}'].unique()[0]]['${dvName}']
group2 = df[df['${ivName}'] == df['${ivName}'].unique()[1]]['${dvName}']

# Run Independent t-Test
t_stat, p_val = stats.ttest_ind(group1, group2, equal_var=False)
print(f"t-Statistic: {t_stat:.4f}, p-Value: {p_val:.4f}")
if p_val < 0.05:
    print("Significantly different (Reject H0)")`,
        codeGo: `package main

import (
	"fmt"
	"math"
)

// Simple t-test calculation logic
func runTTest(g1, g2 []float64) (float64, float64) {
	mean1, var1 := calcStats(g1)
	mean2, var2 := calcStats(g2)
	n1, n2 := float64(len(g1)), float64(len(g2))
	
	tStat := (mean1 - mean2) / math.Sqrt((var1/n1) + (var2/n2))
	df := n1 + n2 - 2
	fmt.Printf("Computed t: %f on %f DoF\\n", tStat, df)
	return tStat, df
}

func calcStats(data []float64) (float64, float64) {
	sum := 0.0
	for _, v := range data { sum += v }
	mean := sum / float64(len(data))
	vSum := 0.0
	for _, v := range data { vSum += math.Pow(v-mean, 2) }
	variance := vSum / float64(len(data)-1)
	return mean, variance
}`
      };
    }

    // 2. Nominal IV + Nominal DV -> Chi-Square Test
    if (ivs.length === 1 && dvs.length === 1 && isNominal(ivs[0].scale) && isNominal(dvs[0].scale)) {
      const ivName = ivs[0].name || "IV";
      const dvName = dvs[0].name || "DV";
      return {
        testNameId: "Uji Kai Kuadrat (Chi-Square Test of Independence)",
        testNameEn: "Chi-Square Test of Independence",
        whyId: `Menguji hubungan/asosiasi antara dua variabel kategorikal: '${ivName}' (nominal) dan '${dvName}' (nominal).`,
        whyEn: `Tests the association between two categorical variables: '${ivName}' (nominal) and '${dvName}' (nominal).`,
        codePython: `import scipy.stats as stats
import pandas as pd

# Load dataset
df = pd.read_csv("research_data.csv")
contingency_table = pd.crosstab(df['${ivName}'], df['${dvName}'])

# Run Chi-Square test
chi2, p_val, dof, expected = stats.chi2_contingency(contingency_table)
print(f"Chi2: {chi2:.4f}, p-Value: {p_val:.4f}, DoF: {dof}")
if p_val < 0.05:
    print("Variables are significantly associated (Reject H0)")`,
        codeGo: `package main

import "fmt"

func runChiSquare(observed [][]float64) {
	// Compute expected frequencies: E_ij = (RowTotal * ColTotal) / GrandTotal
	// Compute sum of (O_ij - E_ij)^2 / E_ij
	fmt.Println("Compute Chi-square statistic and look up critical p-value")
}`
      };
    }

    // 3. Ordinal IV + Ordinal DV -> Spearman Correlation
    if (ivs.length === 1 && dvs.length === 1 && (isOrdinal(ivs[0].scale) || isOrdinal(dvs[0].scale))) {
      const ivName = ivs[0].name || "IV";
      const dvName = dvs[0].name || "DV";
      return {
        testNameId: "Korelasi Peringkat Spearman (Spearman's Rank Correlation)",
        testNameEn: "Spearman's Rank Correlation",
        whyId: `Menguji tingkat kekuatan dan arah hubungan monotonik antara dua variabel berskala ordinal/peringkat: '${ivName}' dan '${dvName}'.`,
        whyEn: `Measures the strength and direction of monotonic association between ordinal/ranked variables: '${ivName}' and '${dvName}'.`,
        codePython: `import scipy.stats as stats
import pandas as pd

# Load dataset
df = pd.read_csv("research_data.csv")

# Run Spearman Correlation
rho, p_val = stats.spearmanr(df['${ivName}'], df['${dvName}'])
print(f"Spearman's rho: {rho:.4f}, p-Value: {p_val:.4f}")`,
        codeGo: `package main

import (
	"fmt"
)

// Calculate Spearman Rank Correlation coefficient
func runSpearman(x, y []float64) float64 {
	// 1. Convert raw values to ranks
	// 2. Compute Pearson correlation on the ranks
	fmt.Println("Rank values and compute Spearman rho")
	return 0.0
}`
      };
    }

    // 4. Multiple IVs + 1 continuous DV -> Multiple Linear Regression
    if (ivs.length >= 2 && dvs.length === 1 && isIntervalOrRatio(dvs[0].scale)) {
      const dvName = dvs[0].name || "DV";
      return {
        testNameId: "Regresi Linear Berganda (Multiple Linear Regression)",
        testNameEn: "Multiple Linear Regression",
        whyId: `Menguji pengaruh simultan dan parsial dari beberapa variabel bebas (${ivs.map(v => `'${v.name || "IV"}'`).join(", ")}) terhadap satu variabel terikat '${dvName}' (skala rasio/interval).`,
        whyEn: `Evaluates the simultaneous and partial relationships between multiple independent variables (${ivs.map(v => `'${v.name || "IV"}'`).join(", ")}) and a single metric dependent outcome '${dvName}'.`,
        codePython: `import statsmodels.api as sm
import pandas as pd

# Load dataset
df = pd.read_csv("research_data.csv")
X = df[[${ivs.map(v => `'${v.name || "IV"}'`).join(", ")}]]
y = df['${dvName}']

# Add intercept and fit OLS model
X = sm.add_constant(X)
model = sm.OLS(y, X).fit()
print(model.summary())`,
        codeGo: `package main

import "fmt"

func runMultipleRegression() {
	// Multiple linear regression estimates: Beta = (X^T * X)^(-1) * X^T * Y
	fmt.Println("Perform matrix multiplication, inversion, and solve for regression weights")
}`
      };
    }

    // 5. 1 continuous IV + 1 continuous DV -> Simple Linear Regression / Pearson
    if (ivs.length === 1 && dvs.length === 1 && isIntervalOrRatio(ivs[0].scale) && isIntervalOrRatio(dvs[0].scale)) {
      const ivName = ivs[0].name || "IV";
      const dvName = dvs[0].name || "DV";
      return {
        testNameId: "Regresi Linear Sederhana & Korelasi Pearson",
        testNameEn: "Simple Linear Regression & Pearson Correlation",
        whyId: `Mengukur keeratan hubungan linear dan memodelkan pengaruh variabel bebas '${ivName}' (rasio/interval) terhadap variabel terikat '${dvName}' (rasio/interval).`,
        whyEn: `Measures the strength of linear association (Pearson r) and models the effect of independent variable '${ivName}' on dependent outcome '${dvName}'.`,
        codePython: `import scipy.stats as stats
import pandas as pd

# Load dataset
df = pd.read_csv("research_data.csv")

# Pearson Correlation
r_val, p_val = stats.pearsonr(df['${ivName}'], df['${dvName}'])
print(f"Pearson Correlation r: {r_val:.4f}, p-Value: {p_val:.4f}")

# Simple Linear Regression
slope, intercept, r, p, se = stats.linregress(df['${ivName}'], df['${dvName}'])
print(f"Regression Equation: Y = {slope:.4f} * X + {intercept:.4f}")`,
        codeGo: `package main

import "fmt"

func runSimpleRegression(x, y []float64) (float64, float64) {
	// Compute Slope (Beta_1) = sum((x_i - meanX)*(y_i - meanY)) / sum((x_i - meanX)^2)
	// Compute Intercept (Beta_0) = meanY - Slope * meanX
	fmt.Println("Compute Simple Linear Regression parameters")
	return 0.0, 0.0
}`
      };
    }

    // Default Fallback
    return {
      testNameId: "Regresi Linear Berganda (Multiple Linear Regression)",
      testNameEn: "Multiple Linear Regression",
      whyId: "Sistem merekomendasikan Regresi Linear Berganda sebagai prosedur standar untuk menguji kontribusi variabel bebas terhadap variabel terikat.",
      whyEn: "System recommends Multiple Linear Regression as the general-purpose procedure to analyze independent contributions to the dependent outcome.",
      codePython: `import statsmodels.api as sm
import pandas as pd

df = pd.read_csv("research_data.csv")
X = df.iloc[:, :-1]
y = df.iloc[:, -1]
model = sm.OLS(y, sm.add_constant(X)).fit()
print(model.summary())`,
      codeGo: `package main

import "fmt"

func main() {
	fmt.Println("Descriptive and Inferential Statistics for E2EE variables")
}`
    };
  };

  const handleAddVariable = () => {
    setVariables([...variables, { name: "", role: "Independent (Cause)", scale: "Interval (Ordered, Equal Distances)" }]);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleVariableChange = (index: number, field: keyof VariableDefinition, value: string) => {
    const updated = [...variables];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setVariables(updated);

    // Auto-update analytical recommendations based on variable properties!
    generateAnalyticalAdvice(updated);
  };

  const generateAnalyticalAdvice = (vars: VariableDefinition[]) => {
    if (vars.length < 2) return;
    
    const scales = vars.map(v => v.scale);
    const hasNominal = scales.some(s => s.includes("Nominal"));
    const hasRatio = scales.some(s => s.includes("Ratio") || s.includes("Interval"));

    if (hasNominal && hasRatio) {
      setAnalysisMethod("Independent T-Test / ANOVA");
    } else if (hasRatio) {
      setAnalysisMethod("Multiple Linear Regression / Pearson Correlation");
    } else if (hasNominal) {
      setAnalysisMethod("Chi-Square Test of Independence");
    } else {
      setAnalysisMethod("Spearman Rank Correlation / Chi-Square");
    }
  };

  const handleSaveProgress = async () => {
    if (!project) return;
    setSaveLoading(true);
    try {
      const mek = await getMEK();
      let payloadAnalysis = analysisMethod;
      let payloadVariables = JSON.stringify(variables);

      if (mek) {
        payloadAnalysis = await encryptText(payloadAnalysis, mek);
        payloadVariables = await encryptText(payloadVariables, mek);
      }

      await apiFetch(`/api/projects/${projectId}/design`, {
        method: "PUT",
        body: JSON.stringify({
          approach,
          designType: design,
          formulaType: formula,
          populationSize: Number(popSize),
          confidenceLevel: Number(confLevel),
          marginOfError: Number(marginError),
          calculatedSample: Number(sampleSize),
          variables: payloadVariables,
          analysisMethod: payloadAnalysis,
          samplingTechnique,
          isPopulationKnown: isPopKnown
        }),
      });
      setLastSavedState({
        approach,
        design,
        formula,
        popSize,
        confLevel,
        marginError,
        samplingTechnique,
        isPopKnown,
        analysisMethod,
        variablesJson: JSON.stringify(variables),
      });
      triggerAlert(t("common.saved"), t("common.notification"), "success");
    } catch (err: any) {
      triggerAlert(err.message || t("common.errorOccurred"), t("common.notification"), "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadMd = () => {
    if (!project) return;
    const markdown = generateMarkdownDraft(previewLang);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${project.title.replace(/\s+/g, "_")}_BAB_III.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownDraft(previewLang));
    triggerAlert(t("preview.copied"), t("common.notification"), "success");
  };

  const handleExportBackupJson = () => {
    if (!project) return;
    const backupData = {
      app: "Archeres Research Methodology Planner",
      version: "1.0.0",
      backupDate: new Date().toISOString(),
      projectId: projectId,
      projectTitle: project.title,
      designData: {
        approach,
        design,
        formula,
        popSize,
        confLevel,
        marginError,
        sampleSize,
        variables,
        analysisMethod,
        samplingTechnique,
        isPopKnown,
        reliability: {
          relType,
          relK,
          relResp,
          sumVariances,
          totVariance,
          sumSuccessProd,
          relMatrix,
          isReliabilityIntegrated
        }
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${project.title.replace(/\s+/g, "_")}_workspace_backup.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert(i18n.language === "id" ? "Cadangan berhasil diunduh!" : "Backup downloaded successfully!", t("common.notification"), "success");
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.app !== "Archeres Research Methodology Planner" || !json.designData) {
          throw new Error(i18n.language === "id" ? "File cadangan tidak valid atau rusak." : "Invalid or corrupt backup file.");
        }

        const data = json.designData;
        
        // Restore step variables
        if (data.approach) setApproach(data.approach);
        if (data.design) setDesign(data.design);
        if (data.formula) setFormula(data.formula);
        if (data.popSize !== undefined) setPopSize(data.popSize);
        if (data.confLevel !== undefined) setConfLevel(data.confLevel);
        if (data.marginError !== undefined) setMarginError(data.marginError);
        if (data.sampleSize !== undefined) setSampleSize(data.sampleSize);
        if (data.variables) setVariables(data.variables);
        if (data.analysisMethod) setAnalysisMethod(data.analysisMethod);
        if (data.samplingTechnique) setSamplingTechnique(data.samplingTechnique);
        if (data.isPopKnown !== undefined) setIsPopKnown(data.isPopKnown);

        // Restore reliability data
        if (data.reliability) {
          const rel = data.reliability;
          if (rel.relType) setRelType(rel.relType);
          if (rel.relK !== undefined) setRelK(rel.relK);
          if (rel.relResp !== undefined) setRelResp(rel.relResp);
          if (rel.sumVariances !== undefined) setSumVariances(rel.sumVariances);
          if (rel.totVariance !== undefined) setTotVariance(rel.totVariance);
          if (rel.sumSuccessProd !== undefined) setSumSuccessProd(rel.sumSuccessProd);
          if (rel.relMatrix) setRelMatrix(rel.relMatrix);
          if (rel.isReliabilityIntegrated !== undefined) setIsReliabilityIntegrated(rel.isReliabilityIntegrated);
        }

        triggerAlert(
          i18n.language === "id" ? "Cadangan berhasil dipulihkan! Pastikan untuk menyimpan progres Anda." : "Backup restored successfully! Make sure to save your progress.",
          t("common.notification"),
          "success"
        );
      } catch (err: any) {
        triggerAlert(err.message || "Failed to parse backup file", t("common.notification"), "error");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  // Dynamic Markdown compiler
  const generateMarkdownDraft = (lang: string) => {
    const buildParamsId = () => {
      if (formula === "arikunto") return `* Persentase Pengambilan Sampel: **${(marginError * 100).toFixed(1)}%** dari total populasi sesuai pedoman Suharsimi Arikunto.`;
      if (formula === "gay_diehl") return `* Pedoman Ukuran Sampel: Mengikuti standar Gay & Diehl (1992) untuk penelitian jenis **${design}**.`;
      if (formula === "isaac_michael") return `* Tingkat Signifikansi ($e$): **${marginError * 100}%**\n* Proporsi Atribut Estimasi ($p$): **${proportion}**`;
      if (formula === "kish_leslie") return `* Batas Toleransi Kesalahan ($e$): **${marginError * 100}%**\n* Tingkat Kepercayaan ($Z$): **${confLevel * 100}%**\n* Proporsi Asumsi ($p$): **${proportion}**`;
      return `* Batas Toleransi Kesalahan ($e$): **${marginError * 100}%**\n* Tingkat Kepercayaan ($1-\\alpha$): **${confLevel * 100}%**\n* Proporsi Atribut Estimasi ($p$): **${proportion}**`;
    };

    const buildParamsEn = () => {
      if (formula === "arikunto") return `* Target Sampling Percentage: **${(marginError * 100).toFixed(1)}%** of the total population based on Suharsimi Arikunto's guideline.`;
      if (formula === "gay_diehl") return `* Sample Size Guideline: Adhering to Gay & Diehl's (1992) standards for **${design}** research designs.`;
      if (formula === "isaac_michael") return `* Significance Level ($e$): **${marginError * 100}%**\n* Estimated Attribute Proportion ($p$): **${proportion}**`;
      if (formula === "kish_leslie") return `* Margin of Error ($e$): **${marginError * 100}%**\n* Confidence Level ($Z$): **${confLevel * 100}%**\n* Estimated Proportion ($p$): **${proportion}**`;
      return `* Margin of Error ($e$): **${marginError * 100}%**\n* Confidence Level ($1-\\alpha$): **${confLevel * 100}%**\n* Estimated Attribute Proportion ($p$): **${proportion}**`;
    };

    if (lang === "id") {
      let approachText = "Kuantitatif";
      if (approach === "qual") approachText = "Kualitatif";
      else if (approach === "mixed") approachText = "Metode Campuran (Mixed Methods)";

      let introSection = `Penelitian ini menggunakan pendekatan ilmiah **${approachText}** dengan desain penelitian **${design}**. Kerangka kerja ini dipilih secara sistematis untuk menjawab rumusan masalah dengan mengumpulkan serta menganalisis data secara objektif.`;

      let popSamplingSection = "";
      if (approach === "quant") {
        let popContext = isPopKnown ? `sebesar **${popSize}** unit` : `yang ukurannya tidak terbatas (infinite)`;
        popSamplingSection = `Populasi sasaran dalam penelitian ini didefinisikan ${popContext}. Mengingat keterbatasan waktu, tenaga, dan finansial, penentuan ukuran sampel minimal dilakukan dengan menerapkan formula **${formula.toUpperCase().replace("_", " ")}** dengan pedoman pengujian:
${buildParamsId()}

Berdasarkan rumus tersebut, diperoleh ukuran sampel minimal yang representatif sebanyak **${sampleSize}** subjek penelitian.

Pengambilan sampel dilakukan secara operasional menggunakan teknik **${samplingTechnique}**. Penggunaan teknik ini bertujuan untuk menjamin sifat representatif sampel dari populasi target sehingga kesimpulan hasil pengujian hipotesis memiliki validitas eksternal yang tinggi.`;
      } else if (approach === "qual") {
        popSamplingSection = `Penelitian kualitatif ini tidak bertujuan untuk melakukan generalisasi statistik terhadap populasi yang luas, melainkan untuk mendalami makna, pola interaksi, dan mendapatkan pemahaman mendalam secara kontekstual. Oleh karena itu, penentuan subjek penelitian/informan dilakukan dengan menggunakan teknik **Non-Probability Sampling**, khususnya **${samplingTechnique}** berdasarkan kriteria inklusi dan eksklusi yang telah ditetapkan secara ketat.

Ukuran sampel atau jumlah informan dalam penelitian ini tidak ditentukan oleh rumus estimasi probabilitas numerik, melainkan didasarkan pada prinsip ilmiah **Saturasi Data (Data Saturation)**. Pengumpulan data akan dihentikan ketika data yang diperoleh telah jenuh, yaitu saat tidak ada informasi baru, variasi tema, atau pola narasi baru yang ditemukan dari informan tambahan. Target awal informan yang direncanakan untuk wawancara mendalam/satuan kajian adalah sebanyak **${sampleSize}** responden yang dianggap representatif.`;
      } else if (approach === "mixed") {
        let mixedDesignExplanation = "";
        if (design === "Convergent Parallel") {
          mixedDesignExplanation = `Penelitian ini menggunakan Desain Paralel Konvergen (Convergent Parallel Design), di mana data kuantitatif dan kualitatif dikumpulkan secara bersamaan dalam periode yang sama namun dianalisis secara terpisah sebelum diintegrasikan pada tahap interpretasi akhir.`;
        } else if (design === "Explanatory Sequential") {
          mixedDesignExplanation = `Penelitian ini menggunakan Desain Sekuensial Eksplanatori (Explanatory Sequential Design), yang diawali dengan pengumpulan dan analisis data kuantitatif (Fase Pertama) untuk menguji hipotesis secara luas, dilanjutkan dengan pengumpulan data kualitatif (Fase Kedua) untuk memperdalam dan menjelaskan temuan statistik.`;
        } else if (design === "Exploratory Sequential") {
          mixedDesignExplanation = `Penelitian ini menggunakan Desain Sekuensial Eksploratori (Exploratory Sequential Design), yang diawali dengan pengumpulan dan analisis data kualitatif (Fase Pertama) untuk mengeksplorasi fenomena secara kontekstual, dilanjutkan dengan pengumpulan data kuantitatif (Fase Kedua) untuk menguji dan memperluas temuan kualitatif tersebut pada populasi yang lebih luas.`;
        }

        popSamplingSection = `${mixedDesignExplanation} Oleh karena itu, penentuan sampel menggunakan strategi **${samplingTechnique}** yang terbagi atas dua fase:

1. **Fase Kuantitatif:** Populasi diidentifikasi ${isPopKnown ? `sebesar **${popSize}** unit` : `tidak terbatas`}. Ukuran sampel minimal dihitung menggunakan formula **${formula.toUpperCase().replace("_", " ")}**, menghasilkan sampel minimal sebanyak **${sampleSize}** responden. Pengambilan sampel fase ini menggunakan teknik Probability Sampling yang relevan.
2. **Fase Kualitatif:** Penentuan subjek dilakukan secara purposif (*Non-Probability*) dengan prinsip **Saturasi Data (Data Saturation)** guna memperoleh kedalaman wawasan kualitatif.`;
      }

      // Recommender justification
      let recJustification = "";
      if (variables.length > 0) {
        const rec = getStatisticalRecommendation();
        if (analysisMethod === rec.testNameId || analysisMethod === rec.testNameEn) {
          recJustification = `\n\n**Justifikasi Metodologis Pemilihan Uji:**\n${rec.whyId}`;
        }
      }

      // Reliability subsection
      let reliabilitySection = "";
      if (isReliabilityIntegrated && relResult !== null) {
        reliabilitySection = `\n\n## 3.5 Validitas dan Reliabilitas Instrumen\nAkurasi dan konsistensi instrumen penelitian diuji secara ilmiah melalui pengujian validitas dan reliabilitas. Uji coba instrumen (pilot study) dilakukan terhadap **${relResp}** responden di luar sampel penelitian namun memiliki karakteristik populasi yang sama.\n\n### 3.5.1 Uji Validitas Instrumen\nPengujian validitas butir kuesioner dilakukan menggunakan teknik korelasi Product Moment Pearson. Butir pertanyaan dinyatakan valid apabila nilai koefisien korelasi ($r_{hitung}$) lebih besar dari tabel distribusi nilai $r$ ($r_{tabel}$) pada tingkat signifikansi $5\\%$. Hanya butir-butir pertanyaan yang terbukti valid yang akan digunakan dalam pengumpulan data penelitian yang sesungguhnya.\n\n### 3.5.2 Uji Reliabilitas Instrumen\nKonsistensi internal instrumen kuesioner diukur menggunakan koefisien **${relType === "cronbach" ? "Cronbach's Alpha" : "Kuder-Richardson 20 (KR-20)"}**. Uji reliabilitas dilakukan terhadap **${relK}** butir pertanyaan yang telah dinyatakan valid.\nBerdasarkan hasil analisis komputasi client-side (E2EE), diperoleh koefisien reliabilitas sebesar **${relResult.toFixed(4)}**. Berdasarkan kriteria teoretis ilmiah (Nunnally & Bernstein, 1994), instrumen dinyatakan **${relResult >= 0.60 ? "RELIABEL" : "TIDAK RELIABEL"}** karena nilai koefisien yang diperoleh **${relResult >= 0.60 ? "memenuhi batas ambang minimum (\\ge 0.60)" : "di bawah ambang batas minimum (< 0.60)"}**, yang menunjukkan tingkat keandalan instrumen masuk dalam kategori **${
          relStatusKey === "excellent" ? "Sangat Tinggi (Excellent)" :
          relStatusKey === "good" ? "Tinggi (Good)" :
          relStatusKey === "acceptable" ? "Sedang (Acceptable)" :
          relStatusKey === "minimum" ? "Cukup/Minimum (Acceptable)" :
          "Rendah/Tidak Reliabel (Unreliable)"
        }**.`;
      }

      return `# BAB III: METODOLOGI PENELITIAN

## 3.1 Pendekatan dan Desain Penelitian
${introSection}

## 3.2 Populasi dan Sampel
${popSamplingSection}

## 3.3 Variabel dan Indikator Penelitian
Variabel-variabel operasional yang dilibatkan dalam penelitian ini dikelompokkan berdasarkan peran metodologis beserta skala pengukuran statistiknya sebagai berikut:

| Indikator Variabel | Peran Metodologis | Skala Pengukuran |
| :--- | :--- | :--- |
${variables.length > 0 ? variables.map(v => `| ${v.name || "Unnamed"} | ${v.role} | ${v.scale} |`).join("\n") : "| Belum ada variabel | - | - |"}

## 3.4 Rencana Analisis Data
Berdasarkan jenis variabel dan skala data yang telah dipetakan, hipotesis penelitian ini akan diuji menggunakan instrumen statistik inferensial:
* **${analysisMethod || "Statistik Deskriptif dan Inferensial"}**${recJustification}${reliabilitySection}
`;
    } else {
      let approachText = "Quantitative";
      if (approach === "qual") approachText = "Qualitative";
      else if (approach === "mixed") approachText = "Mixed Methods";

      let introSection = `This study adopts a **${approachText}** research paradigm, utilizing an **${design}** research design framework. This framework is selected to systematically compile, analyze, and test data hypotheses.`;

      let popSamplingSection = "";
      if (approach === "quant") {
        let popContext = isPopKnown ? `at **${popSize}** individuals` : `as an infinite population`;
        popSamplingSection = `The target population for this study is identified ${popContext}. Due to resource constraints, the minimum statistically viable sample size is determined using the **${formula.toUpperCase().replace("_", " ")}** formula with the following parameters:
${buildParamsEn()}

Consequently, a calculated minimum sample size of **${sampleSize}** subjects is required to achieve high statistical power.

Subject selection is executed utilizing the **${samplingTechnique}** method. The selection of this technique is strictly aligned with ensuring random representativeness from the target population to guarantee high external validity.`;
      } else if (approach === "qual") {
        popSamplingSection = `This qualitative study does not aim to achieve statistical generalization across a broad population, but rather to obtain deep, contextual understanding of the investigated phenomenon. Consequently, participant selection is executed using **Non-Probability Sampling**, specifically **${samplingTechnique}** based on predefined inclusion and exclusion criteria.

The sample size is not determined by mathematical probability estimation formulas, but is strictly guided by the principle of **Data Saturation**. Data collection will proceed until saturation is achieved—the point at which subsequent interviews yield no new insights, thematic categories, or conceptual patterns. The initial target sample size is set at **${sampleSize}** participants who possess rich information relevant to the study's scope.`;
      } else if (approach === "mixed") {
        let mixedDesignExplanation = "";
        if (design === "Convergent Parallel") {
          mixedDesignExplanation = `This study employs a Convergent Parallel Design, where quantitative and qualitative data are collected concurrently during the same timeframe but analyzed independently before integrating during final interpretation.`;
        } else if (design === "Explanatory Sequential") {
          mixedDesignExplanation = `This study adopts an Explanatory Sequential Design, beginning with a quantitative phase (First Phase) to test broad hypotheses, followed by a qualitative phase (Second Phase) to explain and contextualize the statistical findings.`;
        } else if (design === "Exploratory Sequential") {
          mixedDesignExplanation = `This study utilizes an Exploratory Sequential Design, beginning with a qualitative phase (First Phase) to explore phenomena, followed by a quantitative phase (Second Phase) to test and generalize the findings on a wider population.`;
        }

        popSamplingSection = `${mixedDesignExplanation} Accordingly, the sampling strategy utilizes **${samplingTechnique}** divided across two distinct phases:

1. **Quantitative Strand:** The target population is defined ${isPopKnown ? `at **${popSize}** units` : `as infinite`}. The minimum sample size is calculated using the **${formula.toUpperCase().replace("_", " ")}** formula, requiring a minimum of **${sampleSize}** respondents.
2. **Qualitative Strand:** Participants are selected using purposive (*Non-Probability*) sampling, guided strictly by **Data Saturation** principles to yield rich qualitative depth.`;
      }

      // Recommender justification
      let recJustification = "";
      if (variables.length > 0) {
        const rec = getStatisticalRecommendation();
        if (analysisMethod === rec.testNameId || analysisMethod === rec.testNameEn) {
          recJustification = `\n\n**Methodological Justification for Test Selection:**\n${rec.whyEn}`;
        }
      }

      // Reliability subsection
      let reliabilitySection = "";
      if (isReliabilityIntegrated && relResult !== null) {
        reliabilitySection = `\n\n## 3.5 Instrument Validity and Reliability\nTo ensure accuracy and internal consistency, the research instrument underwent rigorous scientific validity and reliability pre-testing. A pilot study was conducted involving **${relResp}** respondents who share similar characteristic profiles with the target population but are excluded from the final research sample.\n\n### 3.5.1 Instrument Validity Testing\nItem validity was assessed using the Pearson Product-Moment Correlation Coefficient. An item is considered empirically valid if its correlation coefficient ($r_{calculated}$) exceeds the critical value from the $r$-table ($r_{table}$) at a $5\\%$ significance level. Only items that demonstrated statistical validity are retained for the final data collection instrument.\n\n### 3.5.2 Instrument Reliability Testing\nThe internal consistency of the questionnaire was calculated using the **${relType === "cronbach" ? "Cronbach's Alpha" : "Kuder-Richardson 20 (KR-20)"}** coefficient across **${relK}** validated items.\nBased on the client-side (E2EE) computational analysis, the calculated reliability coefficient is **${relResult.toFixed(4)}**. Under standard psychometric guidelines (Nunnally & Bernstein, 1994), an instrument is deemed **${relResult >= 0.60 ? "RELIABLE" : "UNRELIABLE"}** because the coefficient **${relResult >= 0.60 ? "exceeds the minimum academic threshold of \\ge 0.60" : "fails to meet the minimum threshold of < 0.60"}**, representing **${
          relStatusKey === "excellent" ? "Excellent" :
          relStatusKey === "good" ? "Good" :
          relStatusKey === "acceptable" ? "Acceptable" :
          relStatusKey === "minimum" ? "Questionable / Minimum" :
          "Unreliable"
        }** internal consistency.`;
      }

      return `# CHAPTER III: RESEARCH METHODOLOGY

## 3.1 Research Approach and Design
${introSection}

## 3.2 Population and Sampling
${popSamplingSection}

## 3.3 Research Variables and Measurement Scales
The research variables, along with their specific methodological roles and measurement scales, are mapped below:

| Variable Indicator | Methodological Role | Measurement Scale |
| :--- | :--- | :--- |
${variables.length > 0 ? variables.map(v => `| ${v.name || "Unnamed"} | ${v.role} | ${v.scale} |`).join("\n") : "| No variables added | - | - |"}

## 3.4 Data Analysis Plan
Aligned with the scale of measurements and variable distribution, statistical hypothesis testing will be executed using:
* **${analysisMethod || "Descriptive and Inferential Statistics"}**${recJustification}${reliabilitySection}
`;
    }
  };

  const renderMarkdownToHtml = (md: string): string => {
    // Secure input: Escape raw HTML tags to prevent XSS injection before parsing markdown syntax
    const escapedMd = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    let html = escapedMd
      .replace(/^# (.*$)/gim, '<h1 style="font-size:1.6rem; font-family:\'Outfit\', sans-serif; font-weight:800; border-bottom:1.5px solid rgba(255,255,255,0.08); padding-bottom:0.6rem; color:#c084fc; margin-bottom:1.25rem;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size:1.25rem; font-family:\'Outfit\', sans-serif; font-weight:700; color:#38bdf8; margin-top:1.5rem; margin-bottom:0.75rem;">$1</h2>')
      .replace(/^\* (.*$)/gim, '<li style="margin-left:1.5rem; list-style-type:square; font-size:0.92rem; color:rgba(255,255,255,0.85); margin-bottom:0.35rem;">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:white; font-weight:700;">$1</strong>')
      .replace(/\$(.*?)\$/g, '<code style="background:rgba(255,255,255,0.05); padding:2px 4px; borderRadius:4px; font-family:monospace; color:#38bdf8;">$1</code>');

    // Parse tables
    html = html.replace(/\| (.*) \|/g, (match, content) => {
      const cols = content.split(" | ");
      if (cols.join("").includes("---")) return "";
      
      const isHeader = cols.includes("Indikator Variabel") || cols.includes("Variable Indicator");
      const tag = isHeader ? "th" : "td";
      const style = isHeader 
        ? "background:rgba(124,58,237,0.1); color:#c084fc; font-weight:700; padding:0.6rem 0.8rem; border:1px solid rgba(255,255,255,0.08);" 
        : "padding:0.5rem 0.8rem; border:1px solid rgba(255,255,255,0.06); font-size:0.88rem; color:rgba(255,255,255,0.85);";
      
      return `<tr style="border-bottom:1px solid rgba(255,255,255,0.06);">${cols.map(c => `<${tag} style="${style}">${c.trim()}</${tag}>`).join("")}</tr>`;
    });

    html = html.replace(/(<tr style=[\s\S]*?<\/tr>)+/g, '<table style="width:100%; border-collapse:collapse; margin:1.25rem 0; border:1px solid rgba(255,255,255,0.08);">$1</table>');
    html = html.replace(/\n/g, "<br/>");

    return html;
  };

  const renderDesignExplanation = (designName: string, isId: boolean) => {
    switch (designName) {
      case "Experimental":
        return isId
          ? "Membangun hubungan sebab-akibat dengan memanipulasi variabel bebas untuk mengamati dampaknya terhadap variabel terikat di bawah kondisi yang dikendalikan secara ketat (Pre, True, atau Quasi-eksperimental)."
          : "Establishes causal relationships by manipulating an independent variable to observe its effect on a dependent variable under highly controlled conditions (Pre, True, or Quasi-experimental).";
      case "Correlational":
        return isId
          ? "Menyelidiki hubungan statistik, pola, serta tingkat asosiasi antara dua atau lebih variabel tanpa adanya manipulasi aktif atau pengendalian variabel."
          : "Investigates statistical relationships, patterns, and degree of association between two or more variables without active manipulation or control.";
      case "Survey / Descriptive":
        return isId
          ? "Memetakan karakteristik, tren, atau perilaku populasi tertentu secara kuantitatif dengan mengumpulkan data primer melalui kuesioner terstandardisasi."
          : "Profiles characteristics, trends, or behaviors of a specific population by gathering primary quantitative data through standardized questionnaires.";
      case "Case Study":
        return isId
          ? "Melakukan eksplorasi mendalam dan multifaset terhadap fenomena, organisasi, atau peristiwa kompleks dalam konteks dunia nyata menggunakan berbagai sumber data yang kaya."
          : "Conducts a deep, multi-faceted exploration of a complex phenomenon, organization, or event within its real-world context using multiple rich data sources.";
      case "Phenomenology":
        return isId
          ? "Mengeksplorasi pengalaman langsung (lived experiences) individu terkait suatu fenomena untuk mengungkap esensi universal yang dirasakan bersama."
          : "Explores the lived experiences of individuals regarding a specific phenomenon to uncover the core, shared universal essence of their perceptions.";
      case "Grounded Theory":
        return isId
          ? "Membangun teori atau kerangka konseptual baru secara sistematis dan induktif yang berakar langsung pada data empiris yang diperoleh dari partisipan."
          : "Develops a systematic, inductive theory or conceptual framework directly 'grounded' in empirical data gathered from research participants.";
      case "Convergent Parallel":
        return isId
          ? "Mengumpulkan dan menganalisis data kuantitatif dan kualitatif secara bersamaan, lalu menggabungkan hasilnya untuk membandingkan, memvalidasi, atau memperkaya temuan."
          : "Collects and analyzes quantitative and qualitative data simultaneously, then merges the results to compare, validate, or cross-reference findings.";
      case "Explanatory Sequential":
        return isId
          ? "Dimulai dengan studi kuantitatif untuk mengidentifikasi tren umum, dilanjutkan dengan fase kualitatif untuk memperjelas dan memberikan konteks pada hasil statistik tersebut."
          : "Starts with a quantitative study to establish general trends, followed by a qualitative phase to explain and contextualize those statistical results.";
      case "Exploratory Sequential":
        return isId
          ? "Dimulai dengan eksplorasi kualitatif untuk menemukan variabel, tema, atau instrumen, yang kemudian diuji dan diukur secara kuantitatif pada fase berikutnya."
          : "Begins with qualitative exploration to discover variables, themes, or instruments, which are then tested and measured in a subsequent quantitative phase.";
      default:
        return "";
    }
  };

  const getEduDetailContent = (itemId: string, lang: string): EduDetailContent => {
    const isId = lang === "id";
    switch (itemId) {
      case "quant_approach":
        return {
          title: isId ? "Pendekatan Kuantitatif" : "Quantitative Approach",
          badge: isId ? "Paradigma Riset" : "Research Paradigm",
          definition: isId
            ? "Berdasarkan filsafat Positivisme (Creswell, 2018), pendekatan kuantitatif berfokus pada pengujian teori secara deduktif melalui pengukuran objektif dan analisis statistik terhadap hubungan antarvariabel. Pendekatan ini berasumsi bahwa realitas sosial bersifat objektif, tunggal, dan dapat diukur menggunakan instrumen terstandardisasi untuk menghasilkan temuan yang dapat digeneralisasikan secara luas."
            : "Grounded in Positivist philosophy (Creswell, 2018), the quantitative approach focuses on testing objective theories deductively by examining relationships among measurable variables. It assumes that social reality is objective, singular, and independent of the researcher, using standardized instruments to gather numerical data that can be statistically analyzed and generalized.",
          characteristics: isId
            ? [
                "Logika Deduktif: Berawal dari teori, merumuskan hipotesis, mengumpulkan data lapangan, lalu menguji secara statistik untuk membuktikan/menolak hipotesis.",
                "Instrumen Terstandardisasi: Menggunakan kuesioner skala Likert tertutup, tes terstandar, atau instrumen pengukuran fisik.",
                "Analisis Statistik: Menggunakan statistik deskriptif dan inferensial (seperti korelasi, regresi berganda, t-test, ANOVA) untuk menarik generalisasi.",
                "Objektivitas Peneliti: Peneliti memposisikan diri secara independen dari subjek riset untuk menjamin reliabilitas dan replikabilitas."
              ]
            : [
                "Deductive Logic: Starts with an established theory, derives specific hypotheses, collects empirical data, and tests to confirm or reject the theory.",
                "Standardized Instruments: Relies on closed-ended Likert scales, structured questionnaires, tests, or hardware measurements.",
                "Statistical Analysis: Employs descriptive and inferential statistics (e.g., correlation, regression, t-tests, ANOVA) to analyze numerical data.",
                "Researcher Objectivity: The researcher maintains an independent stance from the subjects to prevent bias and ensure replicability."
              ],
          examples: isId
            ? [
                "Judul: 'Pengaruh Budaya Organisasi dan Kompensasi Kerja Terhadap Kinerja Karyawan Sektor Teknologi (Survei Regresi Berganda pada 250 Responden)'",
                "Judul: 'Uji Eksperimental Efektivitas Suplemen Omega-3 Terhadap Konsentrasi Belajar Siswa Sekolah Menengah Atas'"
              ]
            : [
                "Title: 'The Influence of Organizational Culture and Compensation on Employee Performance in the Tech Sector (A Multiple Regression Survey of 250 Respondents)'",
                "Title: 'An Experimental Trial of Omega-3 Supplementation on Cognitive Focus and Academic Performance in High School Students'"
              ],
          tips: isId
            ? "Selalu lakukan uji validitas (Construct/Content) dan reliabilitas (seperti nilai Alpha Cronbach > 0.60) pada instrumen kuesioner Anda melalui uji coba terbatas (pilot test) sebelum menyebarkan instrumen riset secara luas guna menjamin presisi data numerik Anda."
            : "Always conduct a pilot test to evaluate construct/content validity and verify scale reliability (e.g., Cronbach's Alpha > 0.60) on your closed-ended questionnaire before full-scale deployment to ensure robust numerical measurements."
        };
      case "qual_approach":
        return {
          title: isId ? "Pendekatan Kualitatif" : "Qualitative Approach",
          badge: isId ? "Paradigma Riset" : "Research Paradigm",
          definition: isId
            ? "Mengakar pada filsafat Konstruktivisme Sosial dan Interpretivisme (Patton, 2015), pendekatan kualitatif mengeksplorasi dan memahami makna subjektif yang dilekatkan oleh individu atau sekelompok orang pada masalah sosial atau kemanusiaan. Penelitian kualitatif bersifat induktif, di mana peneliti membangun pola, kategori, dan teori dari tingkat bawah ke atas dengan berinteraksi langsung dalam konteks alamiah subjek."
            : "Rooted in Social Constructivist and Interpretivist paradigms (Patton, 2015), the qualitative approach explores and understands the subjective meanings individuals or groups ascribe to social or human problems. It is deeply inductive, with the researcher functioning as the key instrument to build conceptual frameworks, themes, and deep insights directly from naturalistic field experiences.",
          characteristics: isId
            ? [
                "Setting Alamiah: Peneliti mengumpulkan informasi langsung di lapangan di mana partisipan mengalami masalah atau fenomena nyata.",
                "Peneliti sebagai Instrumen Utama: Mengumpulkan data sendiri melalui wawancara mendalam, observasi partisipatif, atau analisis dokumen.",
                "Logika Induktif: Membangun pola, kategori, dan tema dari bawah ke atas (bottom-up) dari data mentah hingga membentuk konsep abstrak.",
                "Perspektif Emik: Menekankan pada pemahaman makna terdalam yang diungkapkan langsung oleh partisipan (suara subjek)."
              ]
            : [
                "Natural Setting: Researchers collect data directly in the field where participants experience the issue or lived phenomenon.",
                "Researcher as Key Instrument: Data is gathered directly by the researcher via in-depth interviews, participant observations, or document analysis.",
                "Inductive Logic: Builds patterns, categories, and thematic units from the bottom up—from raw narratives to abstract conceptualizations.",
                "Emic Perspective: Prioritizes understanding the participants' authentic meanings, feelings, and contextual perspectives."
              ],
          examples: isId
            ? [
                "Judul: 'Studi Fenomenologi Pengalaman Koping Psikologis Penyintas Bencana Alam di Daerah Pesisir'",
                "Judul: 'Dinamika Adaptasi Sosial Suku Terasing dalam Menghadapi Digitalisasi Pendidikan (Studi Kasus Etnografi di Pedalaman Papua)'"
              ]
            : [
                "Title: 'A Phenomenological Study of the Psychological Coping Experiences of Inshore Natural Disaster Survivors'",
                "Title: 'The Dynamics of Social Adaptation of Indigenous Tribes Facing Educational Digitalization (An Ethnographic Case Study in Remote Papua)'"
              ],
          tips: isId
            ? "Untuk menjamin keabsahan data kualitatif, gunakan teknik Triangulasi (sumber data, peneliti, teori, atau metodologis) dan Lakukan Member Checking (mengembalikan transkrip wawancara kepada informan) guna memastikan transkrip bebas dari interpretasi bias peneliti."
            : "To ensure qualitative rigor, practice active Triangulation (of sources, methods, or investigators) and utilize Member Checking to verify that transcripts and thematic analyses accurately reflect the participants' true voices and are free of researcher bias."
        };
      case "mixed_approach":
        return {
          title: isId ? "Metode Campuran (Mixed Methods)" : "Mixed Methods Approach",
          badge: isId ? "Paradigma Riset" : "Research Paradigm",
          definition: isId
            ? "Berdasar pada filsafat Pragmatisme (Creswell, 2018), metode campuran mengintegrasikan pengumpulan dan analisis data kuantitatif serta kualitatif secara sistematis dalam satu studi tunggal. Asumsi dasarnya adalah bahwa penggabungan kedua jenis data memberikan pemahaman yang jauh lebih komprehensif terhadap masalah penelitian dibandingkan bila hanya menggunakan satu pendekatan saja."
            : "Grounded in Pragmatic philosophy (Creswell, 2018), mixed methods research systematically integrates both quantitative and qualitative data collection and analysis within a single study. The core premise is that combining numerical precision and narrative depth yields a richer, more comprehensive understanding of the research problem than either approach alone.",
          characteristics: isId
            ? [
                "Integrasi Data: Menggabungkan, menghubungkan, atau menyematkan data kuantitatif dan kualitatif pada fase analisis atau interpretasi.",
                "Pragmatisme: Memilih metode yang paling cocok dan praktis untuk memecahkan masalah penelitian tanpa terikat pada dikotomi paradigma.",
                "Desain Sistematis: Menggunakan salah satu dari 3 desain utama: Konvergen Paralel, Sekuensial Eksplanatori, atau Sekuensial Eksploratori.",
                "Fleksibilitas Riset: Mampu menjawab pertanyaan 'berapa banyak' (kuantitatif) sekaligus 'bagaimana dan mengapa' (kualitatif) secara sinergis."
              ]
            : [
                "Rigorous Data Integration: Merges, connects, or embeds quantitative and qualitative databases at specific analytical stages.",
                "Pragmatic Epistemology: Employs multiple methods to solve a single research question without being restricted by paradigms.",
                "Systematic Frameworks: Explicitly utilizes one of three main designs: Convergent Parallel, Explanatory Sequential, or Exploratory Sequential.",
                "Synergistic Inquiry: Uniquely equipped to answer both 'what/how much' (quantitative) and 'how/why' (qualitative) questions together."
              ],
          examples: isId
            ? [
                "Judul: 'Evaluasi Efektivitas Program Jaminan Kesehatan Nasional: Studi Sekuensial Eksplanatori Terhadap Kepuasan Pasien (Kuantitatif) dan Analisis Hambatan Pelayanan (Kualitatif)'",
                "Judul: 'Model Pengembangan Aplikasi E-learning Berbasis Kebutuhan Pengguna: Studi Eksploratori Sekuensial (Eksplorasi Wawancara dilanjutkan Uji Validasi Kuantitatif)'"
              ]
            : [
                "Title: 'Evaluating the Effectiveness of the National Health Insurance Program: An Explanatory Sequential Study of Patient Satisfaction Survey (Quant) and Quality Barrier Analysis (Qual)'",
                "Title: 'Designing a User-Centric E-learning Application: An Exploratory Sequential Study of User Experience Interviews (Qual) Followed by Quantitative Validation (Quant)'"
              ],
          tips: isId
            ? "Tantangan utama studi mixed methods adalah alokasi waktu dan keahlian ganda. Nyatakan secara eksplisit dalam bab metodologi Anda pada fase mana integrasi data terjadi (apakah pada saat pengumpulan, analisis, atau pada saat pembahasan temuan)."
            : "The primary challenge in mixed methods is double the labor and time. Explicitly state in your methodology chapter at which stage integration occurs—whether during data collection, analysis, or during final discussion and interpretation."
        };
      
      // Dynamic Research Designs
      case "Experimental":
        return {
          title: "Experimental Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Menurut John W. Creswell (2018), desain eksperimental digunakan ketika peneliti ingin menetapkan hubungan sebab-akibat yang jelas antara variabel bebas dan terikat dengan memberikan perlakuan khusus pada satu kelompok dan membandingkannya dengan kelompok lain yang tidak menerima perlakuan tersebut."
            : "According to John W. Creswell (2018), experimental designs aim to establish causal relationships between independent and dependent variables by introducing a specific treatment to an experimental group and comparing outcomes against a control group.",
          characteristics: isId
            ? [
                "Manipulasi Variabel: Peneliti mengendalikan pemberian variabel bebas secara aktif.",
                "Kontrol Variabel Luar: Menggunakan kelompok kontrol dan penugasan acak (random assignment) untuk mencegah variabel pengganggu.",
                "Pengukuran Pretest-Posttest: Melakukan pengukuran sebelum dan sesudah perlakuan untuk melihat selisih nilai."
              ]
            : [
                "Active Manipulation: The researcher controls and introduces the independent variable treatment.",
                "Extraneous Control: Employs a control group and random assignment (in True Experimental) to eliminate confounding factors.",
                "Pretest-Posttest Assessment: Measures the dependent variable before and after the experimental treatment."
              ],
          examples: isId
            ? [
                "Eksperimen Murni: Menguji efek obat baru dengan membagi 100 pasien secara acak ke kelompok obat nyata dan kelompok placebo.",
                "Quasi-Eksperimen: Pengaruh metode e-learning baru pada hasil belajar kelas A (eksperimen) dibanding kelas B (kontrol) tanpa merombak formasi kelas."
              ]
            : [
                "True Experimental: Evaluating a drug's efficacy by randomly assigning 100 patients to a treatment group or a placebo group.",
                "Quasi-Experimental: Assessing a new e-learning curriculum in Class A (experimental) vs Class B (control) without disrupting natural classroom assignments."
              ],
          tips: isId
            ? "Waspadai bias efek partisipan (Hawthorne Effect) di mana subjek merespons secara berbeda hanya karena mereka tahu mereka sedang diamati. Gunakan metode pembatasan informasi (blinding) bila memungkinkan."
            : "Guard against the Hawthorne Effect, where participants alter behavior simply because they know they are being studied. Use blinding protocols if feasible."
        };
      case "Correlational":
        return {
          title: "Correlational Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Berdasarkan Mark Saunders dkk. (2019), desain korelasional menguji kekuatan dan arah hubungan statistik antara dua atau lebih variabel tanpa memanipulasi variabel tersebut secara aktif. Desain ini sangat berguna ketika eksperimen tidak dapat dilakukan karena alasan etis atau praktis."
            : "According to Mark Saunders et al. (2019), correlational designs measure the statistical association, strength, and direction of relationships between two or more variables without active researcher manipulation.",
          characteristics: isId
            ? [
                "Non-Manipulatif: Data dikumpulkan dari variabel dalam kondisi alami tanpa intervensi lapangan.",
                "Koefisien Korelasi: Menggunakan koefisien Pearson (r) untuk data interval/rasio, Spearman untuk ordinal, atau regresi berganda.",
                "Hubungan Non-Kausal: Tidak dapat membuktikan hubungan sebab-akibat secara langsung (Korelasi tidak sama dengan Kausalitas)."
              ]
            : [
                "Non-Manipulative: Variables are measured in their natural states without intervention or active experimental change.",
                "Correlation Coefficients: Evaluated via Pearson's r, Spearman's rank, or multiple regression analyses.",
                "Non-Causal Associations: Identifies statistical links, but cannot prove causation directly (Correlation does not equal Causation)."
              ],
          examples: isId
            ? [
                "Korelasional Sederhana: Hubungan antara jumlah jam tidur harian dengan indeks prestasi kumulatif (IPK) mahasiswa.",
                "Prediktif: Analisis regresi linier berganda untuk memprediksi harga saham berdasarkan volume penjualan dan inflasi harian."
              ]
            : [
                "Simple Correlation: Exploring the relationship between nightly sleep duration and cumulative GPA in college students.",
                "Predictive Correlation: Utilizing multiple linear regression to predict stock prices based on quarterly sales volume and inflation."
              ],
          tips: isId
            ? "Meskipun korelasi terbukti signifikan secara statistik, selalu ingat untuk tidak menyimpulkan sebab-akibat secara mutlak. Selalu jelaskan variabel ketiga yang potensial (confounding variables) yang mungkin menghubungkan keduanya."
            : "Never equate correlation with absolute causation. Discuss potential confounding variables in your discussion chapter that might explain the statistical link between your observed variables."
        };
      case "Survey / Descriptive":
        return {
          title: "Survey / Descriptive Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Menerapkan kuesioner terstruktur atau jajak pendapat terstandardisasi pada sampel terpilih untuk menggambarkan, meringkas, dan melaporkan secara kuantitatif sikap, pendapat, tren, atau karakteristik populasi (Creswell, 2018)."
            : "Applies structured questionnaires or standardized polls to a selected sample to quantitatively profile, summarize, and report the attitudes, opinions, trends, or demographics of a broader population (Creswell, 2018).",
          characteristics: isId
            ? [
                "Standardisasi Tinggi: Setiap responden menerima pertanyaan yang sama persis dan pilihan jawaban terstruktur.",
                "Generalisasi Populasi: Menggunakan teknik probability sampling agar temuan sampel dapat ditarik ke populasi luas.",
                "Analisis Deskriptif: Menyajikan persentase, rata-rata (mean), median, modus, standar deviasi, dan grafik frekuensi."
              ]
            : [
                "High Standardization: Every participant is presented with identical questions and structured response options.",
                "Population Generalizability: Relies on representative probability sampling to infer sample findings onto the larger cohort.",
                "Descriptive Telemetry: Reports findings using percentages, means, medians, modes, standard deviations, and frequency charts."
              ],
          examples: isId
            ? [
                "Survei Sensus: Profil tingkat kesejahteraan rumah tangga di suatu kecamatan pasca-pandemi.",
                "Evaluatif: Survei indeks kepuasan pelanggan terhadap kualitas layanan perbankan digital."
              ]
            : [
                "Census Survey: Profiling the socioeconomic welfare index of households in a municipality post-pandemic.",
                "Evaluative Survey: Assessing customer satisfaction indexes toward digital banking application interfaces."
              ],
          tips: isId
            ? "Pertahankan tingkat respons (response rate) yang tinggi (di atas 60%) untuk menghindari bias non-respons. Susun kuesioner dengan bahasa yang lugas, tidak bertele-tele, dan hindari pertanyaan ganda (double-barreled questions)."
            : "Maintain a high response rate (above 60%) to prevent non-response bias. Keep your questionnaire items concise, clear, and completely free of double-barreled or leading questions."
        };
      case "Case Study":
        return {
          title: "Case Study Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Eksplorasi mendalam terhadap kasus tunggal atau ganda yang dibatasi oleh waktu, tempat, dan aktivitas secara menyeluruh menggunakan berbagai metode pengumpulan data yang kaya (wawancara, observasi, dokumen) dalam konteks aslinya (Yin, 2018)."
            : "A multi-faceted, in-depth exploration of a single or multiple bounded cases (individuals, organizations, programs, or events) over time using rich, triangulated data sources within their real-life contexts (Yin, 2018).",
          characteristics: isId
            ? [
                "Kasus Dibatasi (Bounded System): Fokus pada fenomena spesifik yang dibatasi oleh unit organisasi, waktu, atau batas geografis.",
                "Sumber Data Beragam: Mengintegrasikan hasil wawancara mendalam, catatan observasi lapangan, arsip dokumen resmi, hingga artefak fisik.",
                "Analisis Kontekstual: Mengutamakan kedalaman deskripsi konteks kasus daripada generalisasi statistik ke populasi luas."
              ]
            : [
                "Bounded System: Focuses on a specific phenomenon bounded by time, place, organizational constraints, or social groups.",
                "Triangulated Data: Synthesizes in-depth interview transcripts, participant observations, official archives, and physical artifacts.",
                "Contextual Depth: Prioritizes rich, thick description of the specific case over statistical generalizability."
              ],
          examples: isId
            ? [
                "Kasus Tunggal Mendalam: Studi kasus mengenai strategi bertahan hidup dan manajemen krisis di sebuah perusahaan startup yang hampir bangkrut.",
                "Kasus Ganda: Studi kasus komparatif mengenai proses integrasi budaya kerja digital di tiga sekolah dasar terpencil."
              ]
            : [
                "Single Case: A deep case study profiling the survival strategies and turnaround crisis management of a near-bankrupt tech startup.",
                "Multiple Case Study: A comparative study of the digital culture integration process across three remote primary schools."
              ],
          tips: isId
            ? "Tantangan utama studi kasus adalah batasan lingkup (scope creep). Tentukan batas kasus Anda dengan sangat jelas sejak awal (misalnya: 'Studi kasus dibatasi pada unit HRD PT X selama masa restrukturisasi tahun 2025')."
            : "The primary pitfall is scope creep. Clearly define your case boundaries in Step 1 (e.g., 'This study is strictly bounded to the HR division of PT X during the 2025 corporate restructuring phase')."
        };
      case "Phenomenology":
        return {
          title: "Phenomenology Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Menurut Michael Quinn Patton (2015), fenomenologi bertujuan mengeksplorasi dan mendeskripsikan struktur kesadaran terdalam dan esensi bersama dari pengalaman hidup (lived experiences) beberapa individu terkait fenomena sosial tertentu."
            : "According to Michael Quinn Patton (2015), phenomenological designs aim to explore and describe the psychological essence and core structure of lived experiences shared by several individuals regarding a specific social or medical phenomenon.",
          characteristics: isId
            ? [
                "Pengalaman Hidup (Lived Experiences): Meneliti makna subjektif yang dialami langsung oleh subjek riset secara intim.",
                "Prinsip Epoch / Bracketing: Peneliti secara aktif menangguhkan opini pribadi agar tidak membiaskan cerita asli subjek.",
                "Pernyataan Signifikan: Mengekstrak kutipan penting dari wawancara untuk membangun kluster tema konseptual."
              ]
            : [
                "Lived Experiences: Targets the authentic subjective meanings experienced firsthand by participants.",
                "Bracketing (Epoché): The researcher consciously suspends personal preconceptions to allow the phenomenon to speak for itself.",
                "Horizonalization & Themes: Extracts significant statements from transcripts to formulate shared, invariant universal essences."
              ],
          examples: isId
            ? [
                "Klinis: Pengalaman langsung pasien yang berhasil sembuh dari koma jangka panjang.",
                "Sosial: Pengalaman hidup imigran generasi pertama dalam mempertahankan identitas budaya di lingkungan baru."
              ]
            : [
                "Clinical: The lived experiences of patients recovering from long-term vegetative states or comas.",
                "Social: The lived experiences of first-generation immigrants maintaining cultural identities in highly dissimilar host societies."
              ],
          tips: isId
            ? "Lakukan bracketing (epoché) dengan rajin menulis jurnal refleksi pribadi selama riset. Ini membantu Anda memisahkan bias teoretis Anda dengan cerita murni dari pengalaman hidup informan Anda."
            : "Maintain a reflexive research journal to assist in bracketing. This helps you actively distinguish between your theoretical assumptions and the pure, authentic accounts of your participants."
        };
      case "Grounded Theory":
        return {
          title: "Grounded Theory framework",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Desain kualitatif sistematis di mana peneliti memformulasikan teori atau penjelasan konseptual tingkat abstrak mengenai suatu proses, aksi, atau interaksi sosial yang berakar langsung pada data empiris lapangan (Charmaz, 2014)."
            : "A systematic qualitative design where the researcher derives an abstract, conceptual theory explaining a process, action, or social interaction rooted directly ('grounded') in empirical field data (Charmaz, 2014).",
          characteristics: isId
            ? [
                "Theoretical Sampling: Pengumpulan data diarahkan secara dinamis oleh kebutuhan pengembangan teori yang sedang dibangun.",
                "Constant Comparative Analysis: Terus-menerus membandingkan data baru dengan kode lama untuk membangun kategori abstrak.",
                "Tiga Tahap Pengodean: Pengodean Terbuka (Open Coding), Pengodean Aksial (Axial Coding), dan Pengodean Selektif (Selective Coding)."
              ]
            : [
                "Theoretical Sampling: Participant selection is dynamically guided by the needs of the emerging conceptual framework.",
                "Constant Comparative Method: Continuously compares new data incidents with existing codes to refine abstract categories.",
                "Three-Tier Coding: Follows Open Coding (concept building), Axial Coding (relationship mapping), and Selective Coding (theory synthesis)."
              ],
          examples: isId
            ? [
                "Organisasional: Membangun teori baru mengenai proses adaptasi kepemimpinan karismatik dalam perusahaan merger lintas batas.",
                "Klinis: Model pengambilan keputusan pasien dalam memilih pengobatan alternatif dibanding kemoterapi."
              ]
            : [
                "Organizational: Formulating a theory of leadership adaptation processes in cross-border corporate mergers.",
                "Clinical: Constructing a conceptual model of patient decision-making processes when choosing alternative medicine over chemotherapy."
              ],
          tips: isId
            ? "Jangan tergesa-gesa memaksakan teori yang sudah ada ke data Anda. Biarkan konsep dan kategori teoritis muncul secara alami dari transkrip Anda melalui metode analisis perbandingan konstan."
            : "Do not pre-impose existing models onto your transcripts. Allow theoretical concepts to emerge organically from the narratives through constant comparison and theoretical saturation."
        };
      case "Convergent Parallel":
        return {
          title: "Convergent Parallel Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Desain mixed methods satu fase di mana peneliti mengumpulkan data kuantitatif dan data kualitatif secara bersamaan (paralel), menganalisis kedua basis data secara terpisah, dan kemudian membandingkan atau menggabungkan temuan tersebut untuk melihat apakah kedua data saling memperkuat atau bertentangan (Creswell, 2018)."
            : "A single-phase mixed methods design where the researcher collects and analyzes quantitative and qualitative databases concurrently (parallel), then merges or compares results to evaluate if findings corroborate or contradict each other (Creswell, 2018).",
          characteristics: isId
            ? [
                "Simultan / Paralel: Kedua jenis data dikumpulkan dalam satu periode waktu tunggal secara paralel.",
                "Bobot Setara (Equal Weight): Bobot kuantitatif dan kualitatif dianggap setara dalam menjawab pertanyaan riset.",
                "Analisis Konvergensi: Penggabungan data biasanya dilakukan pada tahap diskusi temuan dengan memetakan tabel matriks perbandingan."
              ]
            : [
                "Concurrent Collection: Both quantitative and qualitative datasets are gathered within the same timeframe.",
                "Equal Weighting: Both databases are prioritized equally in addressing the study's central research questions.",
                "Convergence Analysis: Merges databases during interpretation, often using side-by-side comparison matrix tables."
              ],
          examples: isId
            ? [
                "Studi Pendidikan: Menyebarkan kuesioner skala motivasi belajar kuantitatif ke 200 siswa bersamaan dengan melakukan Focus Group Discussion (FGD) dengan 15 guru.",
                "Studi Kesehatan: Mengukur data klinis tekanan darah pasien bersamaan dengan mewawancarai mereka mengenai kenyamanan psikologis di bangsal."
              ]
            : [
                "Education: Distributing quantitative academic motivation scales to 200 students while concurrently conducting FGDs with 15 teachers.",
                "Healthcare: Tracking quantitative clinical blood pressure data of patients while concurrently conducting qualitative interviews about psychological comfort."
              ],
          tips: isId
            ? "Tantangan terbesar adalah menangani temuan yang bertentangan (divergent findings) (misal: data survei menunjukkan kepuasan tinggi, tetapi wawancara menunjukkan ketidakpuasan mendalam). Laporkan kontradiksi ini secara jujur karena itulah letak nilai tambah mixed methods."
            : "Be prepared for divergent findings (e.g., survey scores indicate high satisfaction, but interviews yield deep complaints). Address these contradictions honestly in your discussion chapter; this divergence represents the true value of mixed methods."
        };
      case "Explanatory Sequential":
        return {
          title: "Explanatory Sequential Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Desain mixed methods dua fase di mana peneliti memulai dengan pengumpulan dan analisis data kuantitatif untuk melihat tren umum, lalu diikuti oleh fase kualitatif (wawancara mendalam) guna menjelaskan hasil statistik kuantitatif tersebut secara mendalam dan kontekstual (Creswell, 2018)."
            : "A two-phase mixed methods framework starting with the collection and analysis of quantitative data to identify broad trends, followed by a qualitative phase to explain and contextualize those statistical results (Creswell, 2018).",
          characteristics: isId
            ? [
                "Dua Fase Berurutan: Fase kuantitatif dilakukan terlebih dahulu, disusul penuh oleh fase kualitatif.",
                "Bobot Kuantitatif Dominan: Riset biasanya diutamakan pada hasil kuantitatif, kualitatif berfungsi sebagai penjelas.",
                "Sampling Terkoneksi: Informan kualitatif dipilih secara purposive langsung dari responden survei kuantitatif fase pertama."
              ]
            : [
                "Two-Phase Sequence: The quantitative study is executed first, directly informing the subsequent qualitative phase.",
                "Quantitative Priority: The study is typically driven by quantitative metrics, using qualitative findings as explanatory support.",
                "Connected Sampling: Qualitative informants are purposefully selected from the respondents who participated in the first phase."
              ],
          examples: isId
            ? [
                "Fase 1: Survei kuantitatif menemukan bahwa 80% karyawan mengalami penurunan kepuasan kerja pasca-merger. Fase 2: Wawancara mendalam dengan 10 karyawan untuk menggali 'mengapa' dan 'bagaimana' merger memicu penurunan tersebut.",
                "Fase 1: Uji statistik mendapati metode terapi X memiliki tingkat keberhasilan rendah. Fase 2: Wawancara klinis dengan pasien untuk memahami hambatan pemulihan."
              ]
            : [
                "Example: Phase 1: Survey finds that 80% of employees experienced low job satisfaction post-merger. Phase 2: In-depth interviews with 10 employees to explain exactly 'why' and 'how' the merger triggered this decrease.",
                "Example: Phase 1: Quantitative trial shows clinical Therapy X has an unexpectedly low recovery rate. Phase 2: Qualitative interviews to explain patients' underlying barriers."
              ],
          tips: isId
            ? "Dalam laporan riset Anda, nyatakan secara spesifik hasil kuantitatif mana (seperti outlier statistik atau hasil yang tidak signifikan) yang perlu ditindaklanjuti dan dijelaskan pada fase kualitatif kedua."
            : "In your methodology chapter, explicitly detail which quantitative results (such as statistical outliers or non-significant findings) required qualitative explanation in the second phase."
        };
      case "Exploratory Sequential":
        return {
          title: "Exploratory Sequential Design",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId
            ? "Desain mixed methods dua fase di mana peneliti memulai dengan eksplorasi kualitatif terlebih dahulu untuk memahami fenomena yang belum banyak diteliti, lalu menggunakan temuan tersebut (seperti variabel atau instrumen baru) untuk dirancang dan diuji secara kuantitatif pada fase kedua (Creswell, 2018)."
            : "A two-phase mixed methods design starting with qualitative exploration to understand an under-researched topic, then using those findings to construct variables, hypotheses, or scales that are tested quantitatively in the second phase (Creswell, 2018).",
          characteristics: isId
            ? [
                "Eksplorasi Awal: Mengumpulkan data kualitatif terlebih dahulu karena variabel atau teori belum diketahui.",
                "Pengembangan Kuesioner/Alat: Hasil wawancara kualitatif digunakan untuk merumuskan butir-butir pertanyaan instrumen kuesioner baru.",
                "Pengujian Kuantitatif: Menyebarkan instrumen baru tersebut ke sampel yang lebih luas untuk pengujian statistik."
              ]
            : [
                "Qualitative Priority: Initial exploratory qualitative database is gathered first because variables or theories are unknown.",
                "Scale/Instrument Development: Narrative themes from Phase 1 are translated directly into items of a new survey instrument.",
                "Quantitative Testing: Deploys and statistically validates the newly developed tool on a broader representative sample."
              ],
          examples: isId
            ? [
                "Fase 1: Wawancara mendalam dengan tetua adat untuk mengeksplorasi kearifan lokal mitigasi bencana. Fase 2: Menyusun skala kuesioner mitigasi bencana lokal dan mengujinya secara statistik pada 400 warga.",
                "Fase 1: Menggali perilaku belanja baru gen-Z di platform VR. Fase 2: Mengembangkan skala kuesioner belanja VR dan memvalidasinya secara kuantitatif."
              ]
            : [
                "Example: Phase 1: Interviews with tribal elders to explore indigenous disaster mitigation concepts. Phase 2: Formulating a standardized questionnaire based on those concepts and validating it statistically with 400 villagers.",
                "Example: Phase 1: In-depth interviews to discover gen-Z shopping behavior in virtual reality spaces. Phase 2: Constructing a scale based on Phase 1 themes and testing it on 500 respondents."
              ],
          tips: isId
            ? "Desain ini ideal untuk merancang kuesioner kustom yang sangat spesifik secara budaya atau kontekstual. Pastikan Anda menjelaskan secara runtut bagaimana tema kualitatif diterjemahkan menjadi butir kuesioner kuantitatif."
            : "This design is ideal for developing custom questionnaires that are highly localized or culturally sensitive. Clearly explain how qualitative themes were systematically converted into quantitative questionnaire scale items."
        };
      case "qual_purposive":
        return {
          title: isId ? "Purposive & Non-Probability Sampling" : "Purposive & Non-Probability Sampling",
          badge: isId ? "Teknik Sampling" : "Sampling Technique",
          definition: isId
            ? "Mengacu pada karya legendaris Michael Quinn Patton (2015) dan John Creswell (2018), purposive sampling adalah teknik non-probabilitas di mana subjek, informan, atau kasus dipilih secara sengaja berdasarkan kriteria tertentu (inclusion criteria) yang kaya akan informasi (information-rich). Tujuannya bukan untuk melakukan generalisasi statistik ke populasi luas, melainkan untuk mendalami fenomena secara mendalam dari sudut pandang informan yang paling menguasai masalah penelitian."
            : "Grounded in the authoritative scholarship of Michael Quinn Patton (2015) and John Creswell (2018), purposive sampling is a non-probability sampling technique where participants, cases, or sites are selected intentionally based on specific, information-rich criteria. The primary goal is not statistical generalization to a broad population, but rather to extract in-depth understanding from individuals who are highly knowledgeable about the research phenomenon.",
          characteristics: isId
            ? [
                "Kriteria Inklusi/Eksklusi: Peneliti merumuskan kriteria ketat untuk menentukan kelayakan subjek (misalnya masa kerja, pengalaman langsung).",
                "Kasus Kaya Informasi: Memilih kasus yang menawarkan pelajaran berharga mendalam terkait inti rumusan masalah.",
                "Pemilihan Non-Acak: Subjek dipilih secara subjektif oleh peneliti berdasarkan kapasitas akademis mereka untuk menerangkan fenomena.",
                "Fleksibilitas Desain: Ukuran sampel tidak kaku sejak awal studi dan dapat berkembang dinamis selama proses pengumpulan data."
              ]
            : [
                "Inclusion/Exclusion Criteria: Employs strict, predetermined criteria to identify eligible participants (e.g., tenure, direct lived experiences).",
                "Information-Rich Cases: Targets specific cases that yield high-quality, deep insights about the core of the research inquiry.",
                "Non-Random Selection: Relies on the researcher's subjective judgment rather than random probability formulas.",
                "Design Flexibility: Sample sizes are dynamic and can be adapted based on emergent findings in the field."
              ],
          examples: isId
            ? [
                "Judul: 'Analisis Strategi Bertahan Pelaku UMKM Mikro Perempuan Selama Krisis Ekonomi: Studi Kasus Purposive pada 15 Wirausaha dengan Kriteria Usaha > 5 Tahun.'",
                "Judul: 'Pengalaman Lived-Experience Dokter Spesialis Paru di Rumah Sakit Rujukan dalam Menangani Gelombang Pertama Pandemi COVID-19.'"
              ]
            : [
                "Title: 'Survival Strategies of Female Micro-Enterprise Owners During Economic Crises: A Purposive Study of 15 Entrepreneurs with >5 Years Tenure.'",
                "Title: 'The Lived Experiences of Pulmonary Specialists in Referral Hospitals During the Critical First Wave of COVID-19 Patients.'"
              ],
          tips: isId
            ? "Tuliskan kriteria inklusi dan eksklusi Anda secara eksplisit di Bab III. Jelaskan secara rasional mengapa subjek-subjek tersebut terpilih dan bagaimana mereka dapat menjawab pertanyaan penelitian Anda."
            : "Explicitly justify your inclusion and exclusion criteria in your Methodology chapter. Clearly explain why these specific participants are uniquely qualified to address your research questions."
        };
      case "qual_saturation":
        return {
          title: isId ? "Prinsip Kejenuhan Data (Data Saturation)" : "Data Saturation Principle",
          badge: isId ? "Ukuran Sampel" : "Sample Size",
          definition: isId
            ? "Merupakan standar emas (gold standard) penentuan ukuran sampel kualitatif berdasarkan pemikiran klasik Glaser & Strauss (1967) serta studi empiris modern Guest, Bunce, & Johnson (2006). Kejenuhan data tercapai ketika proses pengumpulan informasi baru dari partisipan tambahan tidak lagi menghasilkan kode baru, tema baru, atau wawasan teoretis baru. Peneliti kualitatif tidak dipandu oleh rumus matematis (seperti Slovin), melainkan oleh kelengkapan konseptual data."
            : "Coined by Glaser & Strauss (1967) and empirically validated by Guest, Bunce, & Johnson (2006), data saturation is the gold standard for sample size determination in qualitative inquiry. It is achieved when collecting data from subsequent participants yields no new codes, themes, categories, or conceptual insights. Qualitative researchers are guided not by mathematical formulas (like Slovin), but by conceptual density and depth.",
          characteristics: isId
            ? [
                "Kelengkapan Konseptual: Analisis data dilakukan secara simultan dengan pengumpulan data guna mengukur kejenuhan tema secara dinamis.",
                "Studi Homogen: Penelitian dengan kelompok homogen (karakteristik serupa) biasanya mencapai kejenuhan pada 12 hingga 20 wawancara.",
                "Tidak Ada Kode Baru: Indikator utama kejenuhan adalah ketika wawancara baru hanya mengulangi pola informasi dari subjek sebelumnya.",
                "Theoretical Saturation: Khusus Grounded Theory, pengumpulan data dihentikan setelah kategori teoretis terisi penuh dan solid."
              ]
            : [
                "Emergent Analysis: Data analysis is conducted simultaneously with collection to dynamically assess conceptual redundancy.",
                "Homogeneous Cohorts: For groups sharing similar backgrounds, saturation is commonly reached within 12 to 20 comprehensive interviews.",
                "No New Codes: The primary indicator is when subsequent transcript analyses yield zero new analytical codes.",
                "Theoretical Saturation: Particularly in Grounded Theory, sampling ends when theoretical categories are fully saturated and validated."
              ],
          examples: isId
            ? [
                "Kejenuhan data pada studi fenomenologi transisi kepemimpinan CEO baru dicapai setelah wawancara mendalam ke-14, di mana tidak ada lagi tema baru yang muncul.",
                "Kejenuhan tema dalam studi kasus adopsi kurikulum baru oleh guru sekolah dasar tercapai setelah wawancara mendalam dengan 16 informan kunci."
              ]
            : [
                "Example: Data saturation in a phenomenological study on CEO leadership transitions was reached at the 14th participant, as subsequent interviews yielded identical themes.",
                "Example: Thematic saturation in a case study of teacher adaptation to a new school curriculum was fully accomplished after interviewing 16 key informants."
              ],
          tips: isId
            ? "Dalam draf metodologi, sertakan kutipan akademis (seperti Guest et al., 2006) untuk mempertahankan rasionalitas penentuan jumlah sampel Anda. Tunjukkan bukti audit trail analisis data untuk membuktikan bahwa kejenuhan memang telah tercapai."
            : "In your methodology chapter, cite empirical benchmarks (e.g., Guest et al., 2006) to defend your target sample size. Provide an audit trail or saturation table indicating at which interview no new themes emerged."
        };
      case "qual_alternative":
        return {
          title: isId ? "Metode Penarikan Lainnya" : "Alternative Qualitative Methods",
          badge: isId ? "Teknik Sampling" : "Sampling Technique",
          definition: isId
            ? "Selain purposive dasar, terdapat variasi teknik sampling non-probabilitas yang sangat spesifik untuk tujuan teoretis tertentu. Di antaranya adalah Snowball Sampling (mengikuti pola rujukan berantai untuk populasi sensitif/tersembunyi) dan Theoretical Sampling (digunakan dalam Grounded Theory untuk merekrut informan baru guna memvalidasi teori yang sedang berkembang)."
            : "Qualitative inquiry offers specialized non-probability sampling strategies suited to unique field conditions and theoretical goals. This includes Snowball Sampling (chain-referral networks useful for hidden or sensitive populations) and Theoretical Sampling (primarily utilized in Grounded Theory, where new participants are recruited based on emergent conceptual categories to build a model).",
          characteristics: isId
            ? [
                "Snowball/Chain-Referral: Meminta partisipan saat ini merekomendasikan orang lain yang mereka kenal dengan kriteria serupa.",
                "Theoretical Sampling: Pengambilan sampel didikte oleh kebutuhan pengisian dan pengembangan konsep teori baru, bukan kriteria kaku sejak awal.",
                "Extreme/Deviant Case Sampling: Memilih kasus luar biasa (misal tingkat keberhasilan super tinggi atau kegagalan ekstrem) untuk dipelajari.",
                "Convenience Sampling: Mengambil sampel terdekat yang mudah dijangkau, namun memiliki tingkat kredibilitas ilmiah paling rendah."
              ]
            : [
                "Snowball/Chain-Referral: Asks current participants to nominate peers, mapping social networks to reach hidden cohorts.",
                "Theoretical Sampling: Sampling is driven strictly by emergent conceptual needs rather than predetermined demographic quotas.",
                "Extreme/Deviant Case Sampling: Selects highly unusual cases (e.g., outstanding successes or failures) to learn from extreme contexts.",
                "Convenience Sampling: Reaches nearby participants out of convenience; recognized as having the lowest scientific rigor and should be justified carefully."
              ],
          examples: isId
            ? [
                "Penggunaan Snowball Sampling untuk wawancara mendalam dengan penyintas KDRT yang enggan berbicara secara terbuka tanpa rujukan tepercaya.",
                "Penggunaan Theoretical Sampling dalam Grounded Theory untuk mewawancarai staf manajerial guna mengonfirmasi teori koordinasi konflik yang sedang dirumuskan."
              ]
            : [
                "Example: Using Snowball Sampling to perform semi-structured interviews with domestic abuse survivors who would not participate without a trusted introduction.",
                "Example: Using Theoretical Sampling in a Grounded Theory study to select senior managers to test and refine a newly emerging model."
              ],
          tips: isId
            ? "Jika menggunakan Snowball Sampling, jelaskan langkah mitigasi terhadap bias jaringan sosial yang homogen. Nyatakan secara transparan bagaimana mata rantai rujukan awal dibentuk."
            : "If employing Snowball Sampling, detail your mitigation steps against social network homogeneity bias. Transparently describe how the initial seed participants were selected."
        };
      case "quant_population":
        return {
          title: isId ? "Populasi Sasaran (N) vs. Sampel Penelitian (n)" : "Target Population (N) vs. Sample (n)",
          badge: isId ? "Batasan Populasi" : "Population Bounds",
          definition: isId
            ? "Berdasarkan pedoman teoretis dari Creswell & Creswell (2018) dan William M. K. Trochim (2020), Populasi Sasaran (N) mencakup seluruh kelompok subjek yang memiliki kriteria homogen dan menjadi target utama generalisasi kesimpulan riset Anda. Sementara Sampel Penelitian (n) adalah himpunan bagian (subset) representatif dari populasi sasaran tersebut yang direkrut secara empiris melalui prosedur sistematis guna mewakili karakteristik keseluruhan populasi."
            : "Grounded in the research methodologies of John W. Creswell (2018) and William M. K. Trochim (2020), the Target Population (N) represents the entire collective pool of subjects who meet specific criteria and to whom the final research conclusions are generalized. Conversely, the Sample (n) is a scientifically chosen, representative subset of this target population, selected through strict sampling methods to mirror the key characteristics of the whole group.",
          characteristics: isId
            ? [
                "Sifat Keterwakilan (Representativeness): Sampel harus mencerminkan struktur keragaman populasi sasaran (seperti gender, demografi, lokasi).",
                "Batas Populasi (Population Boundary): Populasi Terbatas (Finite) memiliki jumlah N yang tercatat jelas, sedangkan Populasi Tidak Terbatas (Infinite) tidak diketahui pasti jumlah anggotanya.",
                "Kerangka Sampel (Sampling Frame): Daftar fisik riil dari seluruh anggota populasi sasaran yang menjadi acuan pengundian acak.",
                "Generalisasi Statistik: Hasil temuan pada tingkat sampel (n) dapat dianggap valid untuk diterapkan pada tingkat populasi (N)."
              ]
            : [
                "Representativeness: The sample must accurately reflect the target population's diversity (e.g., demographics, socio-economic factors).",
                "Population Boundaries: Finite Populations have a known, precise pool size (N), whereas Infinite Populations are boundless or mathematically unquantifiable.",
                "Sampling Frame: A physical, comprehensive list of all members of the target population from which the random sample is drawn.",
                "Statistical Generalization: Statistical findings derived at the sample level (n) can be logically and mathematically inferred to the population level (N)."
              ],
          examples: isId
            ? [
                "Populasi Sasaran (N): 1.500 karyawan tetap di PT Telkom Jakarta. Sampel Penelitian (n): 316 karyawan yang dipilih secara acak menggunakan tabel acak.",
                "Populasi Sasaran (N): Seluruh ibu menyusui di Kota Bandung (Populasi Tak Terhingga / Infinite). Sampel Penelitian (n): 384 responden."
              ]
            : [
                "Example: Target Population (N): 1,500 permanent corporate employees at PT Telkom Jakarta. Sample (n): 316 employees selected via computerized random number generation.",
                "Example: Target Population (N): All nursing mothers currently living in Bandung City (Infinite Population). Sample (n): 384 respondents selected systematically."
              ],
          tips: isId
            ? "Pastikan Anda secara transparan membatasi populasi sasaran Anda di Bab III dengan kriteria inklusi (seperti domisili, usia, atau lama kerja) untuk mencegah ancaman validitas eksternal."
            : "Ensure you transparently outline your target population in your Methodology chapter using clear inclusion criteria (e.g., geography, age, or tenure) to safeguard external validity."
        };
      case "quant_moe":
        return {
          title: isId ? "Margin of Error & Tingkat Kepercayaan" : "Margin of Error (e) & Confidence Level",
          badge: isId ? "Validitas Statistik" : "Statistical Validity",
          definition: isId
            ? "Merupakan fondasi teoretis statistik inferensial untuk membatasi risiko kesalahan estimasi populasi dari data sampel. Margin of Error (e) mencerminkan rentang presisi toleransi kesalahan antara rata-rata sampel dan parameter populasi riil. Tingkat Kepercayaan (Confidence Level) mencerminkan probabilitas kebenaran parameter populasi berada dalam rentang estimasi tersebut (standar riset sosial adalah tingkat kepercayaan 95% dengan nilai z = 1,96)."
            : "These parameters form the mathematical core of inferential statistics to quantify sampling error. The Margin of Error (e) is the precision interval reflecting the maximum expected difference between the sample statistic and the true population parameter. The Confidence Level is the probability that the true population parameter falls within the confidence interval (the standard in social science is a 95% confidence level with a z-score of 1.96).",
          characteristics: isId
            ? [
                "Derajat Kesalahan (Margin of Error): Semakin kecil nilai e (misal 1% dibanding 5%), semakin besar sampel minimal yang diwajibkan.",
                "Derajat Keyakinan (Confidence Level): Standar riset ilmiah umumnya menggunakan 95% (kesalahan 5%) atau 99% (kesalahan 1% untuk medis).",
                "Distribusi Z-Score: Tingkat kepercayaan 95% bernilai z = 1,96; tingkat kepercayaan 99% bernilai z = 2,58.",
                "Trade-off Presisi: Presisi yang lebih tinggi membutuhkan jumlah sampel yang lebih besar untuk meminimalkan fluktuasi acak."
              ]
            : [
                "Margin of Error (e): A tighter error margin (e.g., 1% vs. 5%) dramatically increases the required minimum sample size.",
                "Confidence Levels: Social science defaults to 95% (5% significance), while medical research often demands 99% (1% significance) to ensure safety.",
                "Z-Score Distribution: A 95% confidence level corresponds to a z-score of 1.96; a 99% confidence level corresponds to a z-score of 2.58.",
                "Precision Trade-off: Achieving higher confidence and tighter error margins strictly demands larger sample sizes to minimize random sampling variance."
              ],
          examples: isId
            ? [
                "Pada tingkat kepercayaan 95% dengan e = 5% (z = 1,96), sampel minimal populasi 1.000 adalah 286 responden.",
                "Pada tingkat kepercayaan 99% dengan e = 1% (z = 2,58) dalam uji klinis obat baru, ukuran sampel minimal melonjak menjadi ribuan partisipan."
              ]
            : [
                "Example: At a 95% confidence level with e = 5% (z = 1.96), the minimum sample size for a population of 1,000 is 286 respondents.",
                "Example: At a 99% confidence level with e = 1% (z = 2.58) in clinical drug testing trials, the minimum sample size surges to thousands of participants."
              ],
          tips: isId
            ? "Untuk riset bisnis dan sosial umum, tingkat kepercayaan 95% dan margin of error 5% adalah batas ambang yang paling diterima dan dapat dipertahankan secara akademis."
            : "For general business and social sciences, a 95% confidence level paired with a 5% margin of error is the most universally accepted academic threshold."
        };
      case "quant_formula":
        return {
          title: isId ? "Formulasi & Teknik Pengambilan Sampel" : "Formulas & Sampling Techniques",
          badge: isId ? "Rumus Matematika" : "Mathematical Formula",
          definition: isId
            ? `Prosedur perhitungan matematis untuk menentukan ukuran sampel minimal yang sah secara akademis. Di aplikasi Archeres, sistem merekomendasikan Formula ${formula === "slovin" ? "Slovin" : "Lemeshow"} karena Anda memilih populasi ${formula === "slovin" ? "terbatas (finite)" : "tidak terbatas (infinite)"}.`
            : `The mathematical calculation procedures employed to establish a scientifically defensible minimum sample size. In Archeres, the system recommends the ${formula === "slovin" ? "Slovin Formula" : "Lemeshow Formula"} because you selected a ${formula === "slovin" ? "finite" : "infinite"} population type.`,
          characteristics: isId
            ? [
                formula === "slovin" ? "Rumus Slovin: n = N / (1 + N(e²)). Sangat sederhana dan praktis untuk populasi terbatas (finite) yang terdata rapi." : "Rumus Lemeshow: n = (z² * p * q) / d². Ideal untuk populasi tidak terbatas (infinite), sering digunakan dalam riset kesehatan masyarakat dengan estimasi proporsi p = 0.5.",
                "Probability Sampling: Perhitungan ini wajib dipadukan dengan pengambilan sampel probabilitas agar asas acak (randomness) terpenuhi.",
                "Simple Random Sampling: Setiap anggota populasi memiliki peluang acak yang sama persis untuk terpilih menjadi anggota sampel.",
                "Stratified Random Sampling: Membagi populasi ke dalam sub-kelompok homogen (strata) sebelum pengundian dilakukan guna menjamin presisi."
              ]
            : [
                formula === "slovin" ? "Slovin Formula: n = N / (1 + N(e²)). A widely accepted and simple equation specifically designed for finite populations." : "Lemeshow Formula: n = (z² * p * q) / d². Specially engineered for infinite or unknown populations, commonly adopting an estimated proportion p = 0.5.",
                "Probability Sampling Requirement: These formulas must be combined with random selection methods to satisfy core probability assumptions.",
                "Simple Random Sampling: Every single member of the population has an identical, non-zero probability of being selected.",
                "Stratified Random Sampling: Divides the population into homogeneous sub-groups (strata) before drawing, securing high statistical precision."
              ],
          examples: isId
            ? [
                formula === "slovin" ? "Dengan populasi N = 500 dan toleransi kesalahan e = 5%, ukuran sampel minimal adalah n = 500 / (1 + 500 * 0.0025) = 222 responden." : "Dengan tingkat kepercayaan 95% (z = 1,96), estimasi proporsi p = 0,5, dan presisi d = 5%, sampel minimal Lemeshow adalah n = (1,96² * 0,5 * 0,5) / 0,05² = 384 responden.",
                formula === "slovin" ? "Dengan populasi N = 10.000 dan e = 5%, ukuran sampel minimal adalah n = 10.000 / (1 + 10.000 * 0.0025) = 385 responden." : "Dengan tingkat kepercayaan 99% (z = 2,58), estimasi proporsi p = 0,5, dan presisi d = 5%, sampel minimal Lemeshow adalah n = (2,58² * 0,5 * 0,5) / 0,05² = 666 responden."
              ]
            : [
                formula === "slovin" ? "Example: With finite population N = 500 and margin of error e = 5%, the minimum sample size is n = 500 / (1 + 500 * 0.0025) = 222 respondents." : "Example: With a 95% confidence level (z = 1.96), proportion estimate p = 0.5, and precision d = 5%, the Lemeshow minimum sample size is n = (1.96² * 0.5 * 0.5) / 0.05² = 384 respondents.",
                formula === "slovin" ? "Example: With finite population N = 10,000 and margin of error e = 5%, the minimum sample size is n = 10,000 / (1 + 10,000 * 0.0025) = 385 respondents." : "Example: With a 99% confidence level (z = 2.58), proportion estimate p = 0.5, and precision d = 5%, the Lemeshow minimum sample size is n = (2.58² * 0.5 * 0.5) / 0.05² = 666 respondents."
              ],
          tips: isId
            ? (formula === "slovin" ? "Tuliskan nilai N rujukan secara pasti di laporan Anda. Jangan membulatkan angka desimal ke bawah saat menghitung jumlah minimum sampel (selalu bulatkan ke atas, misal 222.22 menjadi 223)." : "Jika Anda tidak memiliki data awal porsi prevalensi, gunakan p = 0,5 karena nilai ini menghasilkan varians maksimal dan ukuran sampel paling aman (maksimum).")
            : (formula === "slovin" ? "Ensure you declare a specific, verifiable value for N in your chapter. Never round down fractional sample calculations; always round up to the next integer (e.g., 222.12 rounds to 223)." : "If you have no prior data on the population proportion, adopt p = 0.5 as it maximizes mathematical variance and yields the most conservative (largest) minimum sample size.")
        };
      case "mixed_dual":
        return {
          title: isId ? "Desain Sampling Ganda (Dual-Strand)" : "Dual-Strand Sampling Design",
          badge: isId ? "Desain Sampling" : "Sampling Design",
          definition: isId
            ? "Mengacu pada pakar metodologi metode campuran terkemuka John W. Creswell (2018) dan Abbas Tashakkori & Charles Teddlie (2010), penelitian metode campuran menuntut penyusunan Desain Sampling Ganda (Dual-Strand). Karena riset ini memadukan untaian kuantitatif dan kualitatif, peneliti harus menyelaraskan dua logika sampling yang berbeda secara fundamental: sampel probabilitas acak berukuran besar untuk untaian kuantitatif demi kekuatan uji statistik, disandingkan dengan sampel non-probabilitas bertujuan berukuran kecil untuk untaian kualitatif guna mengeksplorasi makna mendalam."
            : "Grounded in the pioneering scholarship of John W. Creswell (2018) and Abbas Tashakkori & Charles Teddlie (2010), mixed methods research demands a Dual-Strand Sampling Design. Because this design integrates both quantitative and qualitative components, researchers must systematically align two fundamentally divergent sampling rationales: a large probability-based random sample for the quantitative strand to ensure statistical validity, and a small, non-probability purposive sample for the qualitative strand to explore deep personal lived experiences.",
          characteristics: isId
            ? [
                "Logika Ganda (Dual Rationale): Kuantitatif bertujuan untuk generalisasi luas (deduktif), sedangkan Kualitatif bertujuan untuk pemahaman kontekstual mendalam (induktif).",
                "Ukuran Sampel Asimetris: Ukuran sampel kuantitatif (n1) biasanya bernilai ratusan atau ribuan, sementara kualitatif (n2) bernilai sangat terbatas (contoh: 10–20 subjek).",
                "Kerangka Pengambilan Sampel Terpisah: Memiliki dua daftar subjek berbeda yang dipilih berdasarkan teknik sampling masing-masing untaian.",
                "Penyelarasan Desain: Pemilihan sampel kualitatif dapat berupa subset dari sampel kuantitatif, atau berupa sampel independen yang sepenuhnya terpisah."
              ]
            : [
                "Dual Rationale: The quantitative strand targets broad statistical generalization (deductive), while the qualitative strand focuses on contextual depth (inductive).",
                "Asymmetrical Sample Sizes: The quantitative sample size (n1) typically ranges in the hundreds, whereas the qualitative sample size (n2) remains highly focused (e.g., 10–20 participants).",
                "Distinct Sampling Frames: Employs separate lists or databases of participants, each matching the unique criteria of its respective strand.",
                "Design Alignment: The qualitative sample can be drawn directly as a subset of the larger quantitative pool, or as an independent, unrelated group."
              ],
          examples: isId
            ? [
                "Kuantitatif: Survei acak terstruktur ke 500 pengguna aplikasi edutech. Kualitatif: Wawancara mendalam bertujuan dengan 12 pengguna yang menunjukkan tingkat retensi paling ekstrem.",
                "Kuantitatif: Eksperimen kuasi efektivitas suplemen baru pada 100 pasien klinis. Kualitatif: Focus Group Discussion (FGD) dengan 8 perawat pelaksana."
              ]
            : [
                "Quantitative: Structured random survey distributed to 500 active users of an edutech application. Qualitative: In-depth purposive interviews with 12 users exhibiting extreme retention dropouts.",
                "Quantitative: Quasi-experiment assessing new supplement efficacy across 100 clinical patients. Qualitative: Focus Group Discussion (FGD) with 8 primary care nurses."
              ],
          tips: isId
            ? "Di Bab III, laporkan secara terpisah tabel ringkasan ukuran sampel, teknik sampling, dan tujuan pengambilan sampel untuk masing-masing untaian agar tidak membingungkan penguji."
            : "In your methodology chapter, present separate, clear tables detailing the sample size, technique, and conceptual purpose for each strand to ensure maximum clarity for reviewers."
        };
      case "mixed_integration":
        return {
          title: isId ? "Integrasi Sequential vs. Concurrent" : "Sequential vs. Concurrent Integration",
          badge: isId ? "Integrasi Metode" : "Methods Integration",
          definition: isId
            ? "Mengatur bagaimana hubungan waktu (timing) antara penarikan sampel kuantitatif dan kualitatif dilakukan sesuai desain riset yang dipilih. Dalam Desain Sekuensial, penarikan sampel fase kedua sangat dipengaruhi atau bergantung secara langsung pada data sampel fase pertama. Dalam Desain Konkuren (Satu Waktu), kedua sampel dipilih secara bersamaan dan independen guna menjawab pertanyaan penelitian yang sama dari dua sudut pandang berbeda."
            : "Governs the temporal relationship (timing) between the quantitative and qualitative sampling procedures according to your selected research design. In Sequential Designs, selecting participants for the second phase is directly informed by or derived from the first phase's sample data. In Concurrent Designs, both samples are drawn simultaneously and independently to address the same core inquiry from complementary perspectives.",
          characteristics: isId
            ? [
                "Hubungan Sekuensial Eksplanatori: Sampel kualitatif dipilih dari subjek kuantitatif yang menunjukkan pola statistik ganjil atau nilai ekstrem untuk didalami.",
                "Hubungan Sekuensial Eksploratori: Sampel kualitatif pertama-tama diwawancarai untuk merumuskan butir instrumen baru, yang kemudian diuji pada sampel kuantitatif luas.",
                "Hubungan Konkuren (Triangulasi): Pengambilan sampel paralel di mana kedua kelompok subjek tidak harus saling berinteraksi selama proses riset berlangsung.",
                "Dependensi Kasus: Hubungan sekuensial menuntut alur audit yang ketat untuk menerangkan transisi pemilihan subjek antar fase."
              ]
            : [
                "Explanatory Sequential Link: Qualitative participants are purposefully selected directly from the initial quantitative cohort to explain outlier statistics.",
                "Exploratory Sequential Link: The qualitative sample is first interviewed to yield constructs and items, which are then statistically tested on a broad quantitative pool.",
                "Concurrent Link (Triangulation): Parallel sampling where both groups of subjects are recruited simultaneously and operate independently throughout the research.",
                "Case Dependency: Sequential designs demand a strict, documented transition trail demonstrating how one phase's sample led to the next phase."
              ],
          examples: isId
            ? [
                "Sekuensial Eksplanatori: Mengambil 10 guru berkinerja terendah dari hasil survei evaluasi 200 guru untuk diwawancarai secara mendalam.",
                "Konkuren: Melakukan kuesioner acak kepada 300 siswa sekolah menengah, dan pada minggu yang sama mewawancarai 15 kepala sekolah."
              ]
            : [
                "Explanatory Sequential: Recruiting the 10 lowest-performing teachers from an initial survey of 200 educators for subsequent in-depth interviews.",
                "Concurrent: Distributing structured random questionnaires to 300 high school students while simultaneously interviewing 15 school principals."
              ],
          tips: isId
            ? "Jika Anda menggunakan desain Sekuensial Eksplanatori, pastikan sampel kualitatif Anda merupakan bagian (nested subset) dari sampel kuantitatif agar memiliki konsistensi konteks yang valid."
            : "If employing an Explanatory Sequential design, ensure your qualitative sample is a nested subset of the larger quantitative sample to preserve context validity."
        };
      case "mixed_consistency":
        return {
          title: isId ? "Konsistensi Alur Sampel" : "Sample Flow Consistency",
          badge: isId ? "Keabsahan Metodologis" : "Methodological Rigor",
          definition: isId
            ? "Menjamin transparansi pelaporan dan keabsahan (legitimacy) metodologi campuran Anda melalui penggambaran diagram alur visual sampling yang koheren. Berdasarkan pemikiran Onwuegbuzie & Collins (2007), inkonsistensi alur sampel (seperti hilangnya relevansi partisipan kualitatif dibanding kuantitatif) adalah ancaman utama terhadap kredibilitas penggabungan interpretasi data riset."
            : "Safeguards the transparency, replicability, and overall methodological legitimacy of your mixed methods study by depicting a coherent sampling workflow. Rooted in the framework of Onwuegbuzie & Collins (2007), sample flow inconsistency—such as a misalignment between quantitative survey topics and qualitative informant criteria—poses a significant threat to the validity of data integration.",
          characteristics: isId
            ? [
                "Matriks Sampling: Menyediakan tabel visual yang memetakan keterkaitan untaian (kuantitatif & kualitatif), teknik sampling, jumlah subjek, dan jenis data.",
                "Diagram Alir Alur: Menyertakan bagan alir visual (flowchart) dari fase satu ke fase berikutnya untuk memperlihatkan mata rantai data.",
                "Transparansi Attrisi (Penyusutan): Menjelaskan secara jujur apabila subjek menolak atau menyusut selama transisi pengumpulan data multi-fase.",
                "Validitas Integrasi: Kredibilitas temuan akhir sangat ditentukan oleh sejauh mana alur penarikan sampel didokumentasikan secara runtut."
              ]
            : [
                "Sampling Matrix: A highly structured visual table mapping strands, specific techniques, sample sizes, and corresponding data outputs.",
                "Procedural Flowchart: A sequential, step-by-step visual diagram illustrating how the study transitioned from one sampling phase to the next.",
                "Attrition Transparency: Frankly reporting and explaining any participant dropouts or non-responses during multi-phase transitions.",
                "Inference Quality: The ultimate credibility of your integrated findings depends heavily on a transparent, chronological sampling audit trail."
              ],
          examples: isId
            ? [
                "Menyajikan diagram alir prosedural di Bab III yang secara grafis memetakan transisi dari survei kuantitatif (n=300) ke wawancara kualitatif (n=12).",
                "Penerapan matriks sampling 2x2 Collins et al. untuk menerangkan rasional hubungan sampel dalam studi kepuasan nasabah bank."
              ]
            : [
                "Example: Presenting a clear procedural flowchart in Chapter III visually tracing the sampling path from a quantitative survey (n=300) to qualitative interviews (n=12).",
                "Example: Deploying a 2x2 Collins et al. sampling matrix to defend the conceptual relationship between strands in a banking customer satisfaction study."
              ],
          tips: isId
            ? "Gunakan model diagram alir prosedural standar dari Creswell di Bab III Anda. Ini adalah cara termudah dan paling elegan untuk memukau dosen penguji riset Anda."
            : "Integrate Creswell's standardized procedural flowchart template in your Methodology chapter. It is the most elegant and academically persuasive way to demonstrate rigorous design to examiners."
        };
      case "var_roles":
        return {
          title: isId ? "Peran Metodologis Variabel" : "Methodological Roles of Variables",
          badge: isId ? "Struktur Variabel" : "Structural Roles",
          definition: isId
            ? "Dalam menyusun model konseptual Bab II dan Bab III, variabel penelitian diklasifikasikan berdasarkan peranan fungsionalnya dalam hubungan sebab-akibat. Peneliti harus merinci dengan jelas bagaimana Variabel Independen (bebas/mempengaruhi) mempengaruhi Variabel Dependen (terikat/dipengaruhi), serta apakah terdapat variabel perantara seperti Mediator (menjelaskan mekanisme kausal) atau pengubah seperti Moderator (mengubah kekuatan atau arah hubungan)."
            : "When establishing a structural research framework, variables are strictly categorized based on their functional causal roles. Researchers must clearly specify how the Independent Variable (IV / X) (the cause or predictor) influences the Dependent Variable (DV / Y) (the effect or outcome), and define the roles of any secondary variables such as Mediators (M) (which explain the underlying causal mechanism) or Moderators (W) (which modify the strength or direction of the primary relationship).",
          characteristics: isId
            ? [
                "Variabel Independen (IV / X - Prediktor): Berperan sebagai penyebab utama atau stimulus yang dimanipulasi atau diukur untuk memprediksi perubahan pada output (contoh: Kualitas Layanan atau Beban Kerja).",
                "Variabel Dependen (DV / Y - Kriteria): Berperan sebagai konsekuensi atau efek yang diukur guna menilai hasil matematis dari pengaruh variabel independen (contoh: Loyalitas Nasabah atau Tingkat Stres Kerja).",
                "Variabel Mediator (M - Perantara): Berfungsi menjelaskan mekanisme internal bagaimana atau mengapa hubungan X berpengaruh terhadap Y, membentuk rantai kausalitas tidak langsung: X -> M -> Y (contoh: Kepuasan menjembatani Kualitas ke Loyalitas).",
                "Variabel Moderator (W - Konten): Berfungsi memodifikasi (memperkuat, memperlemah, atau membalikkan) arah atau kekuatan hubungan utama X ke Y berdasarkan variabel kontekstual (contoh: hubungan Beban Kerja ke Stres dilemahkan bila Dukungan Sosial tinggi).",
                "Validitas Kerangka Konseptual: Penentuan struktur jalur variabel harus didukung oleh landasan teori Bab II yang kokoh guna menghindari bias spesifikasi model (specification error)."
              ]
            : [
                "Independent Variable (IV / X - Predictor): The causal antecedent or predictor that is measured or manipulated to observe and forecast variations in the outcome (e.g., E-Service Quality or Job Demand).",
                "Dependent Variable (DV / Y - Outcome): The primary outcome of interest that is measured to quantify the mathematical effects of the predictor (e.g., Customer Loyalty or Employee Burnout).",
                "Mediator Variable (M - Intermediary): Clarifies the underlying causal mechanism of how or why X leads to Y, establishing an indirect path structure: X -> M -> Y (e.g., Customer Satisfaction bridging E-Service Quality to Loyalty).",
                "Moderator Variable (W - Contextual): Alters the strength or direction of the primary X -> Y path (strengthens, weakens, or buffers) based on contextual boundary conditions (e.g., Social Support buffering the negative impact of Job Demand on Burnout).",
                "Theoretical Foundation Requirement: The structural relations among variables must be rigorously supported by prior literature in Chapter 2 to prevent model specification errors."
              ],
          examples: [],
          tips: isId
            ? "Gunakan diagram jalur visual (path diagram) di Bab II dan Bab III Anda untuk menggambarkan hubungan kausal antar variabel ini secara grafis sebelum menulis teks penjelasan."
            : "Always present a professional path diagram (conceptual framework) in your literature and methodology chapters to visually clarify these causal structural relationships before diving into text."
        };
      case "var_scales":
        return {
          title: isId ? "Empat Tingkatan Skala Pengukuran (Taksonomi Stevens)" : "Four Measurement Scales (Stevens' Taxonomy)",
          badge: isId ? "Skala Pengukuran" : "Measurement Scales",
          definition: isId
            ? "Merupakan taksonomi tingkat presisi pengukuran data matematis yang dirumuskan oleh Stanley Smith Stevens (1946). Skala pengukuran ini menentukan jenis analisis statistik yang valid untuk digunakan. Mengelompokkan data ke dalam empat tingkat hierarki presisi: Nominal (kategori murni), Ordinal (tingkat/peringkat), Interval (jarak konstan tanpa nol mutlak), dan Rasio (memiliki nilai nol mutlak)."
            : "Originating from the seminal taxonomy developed by Stanley Smith Stevens (1946), measurement scales define the mathematical properties of your data and strictly dictate which statistical tests are valid. The scales represent a hierarchy of precision from lowest to highest: Nominal (categorical), Ordinal (ranked), Interval (equal intervals, arbitrary zero), and Ratio (absolute mathematical zero).",
          characteristics: isId
            ? [
                "Skala Nominal (Kualitatif/Kategorikal): Klasifikasi kategori murni tanpa tingkatan. Angka hanya simbol identitas kualitatif (contoh: Laki-laki = 1, Perempuan = 2; angka ini tidak dapat dijumlahkan atau dirata-ratakan).",
                "Skala Ordinal (Kategorikal Bertingkat): Klasifikasi bertingkat dengan urutan logis, namun jarak antarkategori tidak setara atau tidak dapat diukur secara eksak (contoh: Peringkat Militer, Jenjang Pendidikan, atau Skala Likert 1-5).",
                "Skala Interval (Metrik/Kuantitatif): Angka numerik dengan jarak antar nilai yang setara/konstan, namun tidak memiliki nol mutlak sehingga rasio perkalian tidak bermakna (contoh: Suhu Celsius atau Skor IQ; nol derajat bukan berarti tidak ada suhu).",
                "Skala Rasio (Metrik/Kuantitatif Lanjut): Angka numerik presisi tertinggi yang memiliki nol mutlak riil. Nilai nol berarti ketiadaan atribut secara total, memungkinkan operasi perkalian/pembagian (contoh: Pendapatan Rp0, Berat Badan, atau Usia).",
                "Implikasi Pengujian Statistik: Skala Nominal/Ordinal membatasi data pada analisis non-parametrik (seperti Chi-Square), sedangkan skala Interval/Rasio memenuhi prasyarat statistik parametrik yang lebih canggih (seperti Korelasi Pearson & Regresi)."
              ]
            : [
                "Nominal Scale (Qualitative/Categorical): Categorical classification with no intrinsic mathematical hierarchy. Numbers act purely as qualitative symbolic labels (e.g., Male = 1, Female = 2; calculating a mean is mathematically meaningless).",
                "Ordinal Scale (Ranked/Categorical): Ordered rank sequences where categories have logical sequence but mathematical distances between ranks are unequal or arbitrary (e.g., Academic Degrees, Job Seniority, or Likert Scales).",
                "Interval Scale (Metric/Quantitative): Numerical data with equal interval distances but lacks a true mathematical zero point. Zero is arbitrary, meaning ratios are invalid (e.g., Celsius Temperature or standardized IQ Scores).",
                "Ratio Scale (Metric/Quantitative Advanced): Numerical data with a true, absolute mathematical zero denoting the total absence of the attribute, making division/multiplication valid (e.g., Revenue, Weight, or Age).",
                "Statistical Method Implications: Nominal and Ordinal data generally require non-parametric statistical methods (e.g., Chi-Square), whereas Interval and Ratio data qualify for powerful parametric models (e.g., Pearson Correlation, Regression)."
              ],
          examples: [],
          tips: isId
            ? "Variabel berskala Nominal/Ordinal membutuhkan uji non-parametrik, sedangkan variabel berskala Interval/Rasio memenuhi syarat pengujian parametrik (seperti Regresi Linear) asalkan lolos uji asumsi klasik."
            : "Nominal and Ordinal variables typically require non-parametric statistical tests, while Interval and Ratio variables qualify for parametric methods (like Regression) provided assumptions are met."
        };
      case "var_testing":
        return {
          title: isId ? "Rekomendasi Analisis Statistik" : "Recommended Statistical Analysis",
          badge: isId ? "Metode Analisis" : "Analysis Method",
          definition: isId
            ? `Berdasarkan konfigurasi operasional variabel yang telah Anda tentukan, sistem merekomendasikan metode analisis '${analysisMethod}' sebagai prosedur statistik formal yang paling valid untuk menguji hipotesis penelitian.`
            : `Based on your variables' operational metrics, the system recommends '${analysisMethod}' as the most mathematically rigorous and academically valid statistical procedure to test your hypotheses.`,
          characteristics: isId
            ? [
                analysisMethod === "Multiple Linear Regression" ? "Regresi Linear Berganda: Menguji pengaruh beberapa variabel independen (skala metrik) terhadap satu variabel dependen (skala metrik)." : `Metode '${analysisMethod}': Dioptimalkan secara statistik berdasarkan jumlah variabel bebas dan terikat yang Anda definisikan.`,
                "Uji Asumsi Klasik: Analisis parametrik mewajibkan kelulusan pengujian Normalitas, Multikolinearitas, Heteroskedastisitas, dan Autokorelasi.",
                "Koefisien Determinasi (R²): Mengukur sejauh mana variasi dalam variabel dependen dapat dijelaskan oleh model regresi Anda.",
                "Signifikansi Uji (p-value): Menilai hipotesis dengan batas kritis p < 0,05 (tingkat kesalahan maksimal 5%) untuk menyatakan hubungan yang signifikan."
              ]
            : [
                analysisMethod === "Multiple Linear Regression" ? "Multiple Linear Regression: Evaluates the relationship between two or more metric independent variables and a single metric outcome variable." : `Method '${analysisMethod}': Statistically optimized based on the exact quantity and scaling of your defined independent and dependent variables.`,
                "Classical Assumptions Requirement: Parametric regression demands passing tests for Normality, Multicollinearity, Heteroskedasticity, and Autocorrelation.",
                "Coefficient of Determination (R²): Measures the percentage of variance in the dependent variable explained by your structural model.",
                "Hypothesis Significance (p-value): Employs a critical threshold of p < 0.05 (alpha = 5%) to declare a statistically significant relationship."
              ],
          examples: [],
          tips: isId
            ? "Sebelum melakukan pengujian regresi di program SPSS atau R, pastikan data Anda dibersihkan dari outlier ekstrem (pencilan) guna menghindari bias pada koefisien regresi Anda."
            : "Before executing statistical software computations (e.g., SPSS, R, or SmartPLS), scan and clean your data of extreme outliers to prevent regression coefficient bias."
        };
      default:
        return {
          title: "Research Concept",
          badge: isId ? "Desain Penelitian" : "Research Design",
          definition: isId ? "Pilih salah satu pendekatan dan desain riset di panel kiri untuk memetakan detail metodologis akademis Anda secara spesifik." : "Select a research paradigm and design type on the left panel to begin detailing your scientific research methodology.",
          characteristics: [],
          examples: [],
          tips: ""
        };
    }
  };

  const renderEducationalPanel = () => {
    const isId = i18n.language === "id";
    
    switch (activeStep) {
      case 1:
        return (
          <div className="animate-fade-in" style={styles.eduContainer}>
            <div style={styles.eduBadge}>
              <IconBook size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {isId ? "TUTORIAL: PARADIGMA PENELITIAN" : "TUTORIAL: RESEARCH PARADIGMS"}
            </div>
            <h3 style={styles.eduTitle}>{isId ? "Menentukan Pendekatan & Desain" : "Understanding Approach & Design"}</h3>
            <p style={styles.eduIntro}>
              {isId 
                ? "Langkah awal dalam merumuskan metodologi adalah menetapkan paradigma penelitian yang selaras dengan rumusan masalah serta tujuan ilmiah Anda." 
                : "The first step in methodology design is establishing the paradigm that aligns with your research questions and scientific objectives."}
            </p>

            <div
              className="arche-edu-card"
              style={{ ...styles.eduCard, cursor: "pointer" }}
              onClick={() => {
                setEduPopupItemId("quant_approach");
                setEduPopupOpen(true);
              }}
            >
              <h4 style={styles.eduCardTitle}>
                <IconChart size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "hsl(var(--primary-color))" }} />
                {isId ? "Pendekatan Kuantitatif" : "Quantitative Approach"}
              </h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Menitikberatkan pada pengujian teori secara deduktif melalui pengukuran numerik, analisis statistik, dan pembuktian empiris yang objektif." 
                  : "Focuses on testing theories deductively using numerical measurements, statistical analysis, and objective evidence."}
              </p>
            </div>

            <div
              className="arche-edu-card"
              style={{ ...styles.eduCard, cursor: "pointer" }}
              onClick={() => {
                setEduPopupItemId("qual_approach");
                setEduPopupOpen(true);
              }}
            >
              <h4 style={styles.eduCardTitle}>
                <IconFileText size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#22d3ee" }} />
                {isId ? "Pendekatan Kualitatif" : "Qualitative Approach"}
              </h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Mengeksplorasi makna deskriptif, pola naratif, serta pengalaman hidup manusia secara mendalam menggunakan logika induktif." 
                  : "Explores descriptive meanings, narrative patterns, human experiences, semi-structured interviews, and inductive analysis."}
              </p>
            </div>

            <div
              className="arche-edu-card"
              style={{ ...styles.eduCard, cursor: "pointer" }}
              onClick={() => {
                setEduPopupItemId("mixed_approach");
                setEduPopupOpen(true);
              }}
            >
              <h4 style={styles.eduCardTitle}>
                <IconMerge size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#34d399" }} />
                {isId ? "Metode Campuran (Mixed Methods)" : "Mixed Methods Approach"}
              </h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Mengintegrasikan presisi data kuantitatif dan kedalaman narasi kualitatif secara sinergis untuk memecahkan masalah penelitian yang kompleks." 
                  : "Synergistically combines numerical precision and narrative depth to address multi-layered research problems."}
              </p>
            </div>
            
            <div style={styles.eduTip}>
              <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <IconLightbulb size={16} style={{ color: "#fbbf24" }} />
                {isId ? "Wawasan Akademis:" : "Academic Insight:"}
              </strong>
              <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", lineHeight: 1.4 }}>
                {isId 
                  ? "Gunakan pendekatan Kuantitatif untuk menggeneralisasi temuan pada populasi yang luas. Sebaliknya, pilih pendekatan Kualitatif untuk mendalami dinamika fenomena sosial secara kontekstual." 
                  : "Choose Quantitative to generalize findings across large cohorts. Choose Qualitative to explore social contexts deeply."}
              </p>
            </div>

            {design !== "Undetermined" && (
              <div
                className="arche-edu-card arche-edu-card-active"
                style={{
                  ...styles.eduCard,
                  background: "rgba(168, 85, 247, 0.04)",
                  border: "1px solid rgba(168, 85, 247, 0.25)",
                  boxShadow: "0 0 10px rgba(168, 85, 247, 0.1)",
                  marginTop: "0.5rem",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setEduPopupItemId(design);
                  setEduPopupOpen(true);
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconWrench size={16} style={{ color: "#c084fc" }} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#c084fc" }}>
                    {isId ? "DESAIN PENELITIAN AKTIF" : "ACTIVE RESEARCH DESIGN"}
                  </span>
                </div>
                <h4 style={{ ...styles.eduCardTitle, color: "white", marginTop: "0.25rem" }}>
                  {design}
                </h4>
                <p style={styles.eduCardBody}>
                  {renderDesignExplanation(design, isId)}
                </p>
              </div>
            )}
          </div>
        );
      case 2:
        if (approach === "qual") {
          return (
            <div className="animate-fade-in" style={styles.eduContainer}>
              <div style={styles.eduBadge}>
                <IconBook size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {isId ? "TUTORIAL: SAMPLING KUALITATIF" : "TUTORIAL: QUALITATIVE SAMPLING"}
              </div>
              <h3 style={styles.eduTitle}>{isId ? "Saturasi Tematik & Purposive Sampling" : "Thematic Saturation & Purposive Sampling"}</h3>
              <p style={styles.eduIntro}>
                {isId 
                  ? "Mempelajari bagaimana informan kualitatif dipilih secara sengaja berdasarkan kedalaman informasi dan cara menentukan titik kejenuhan data." 
                  : "Learning how qualitative informants are purposefully selected based on information richness and identifying the data saturation point."}
              </p>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("qual_purposive");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconUsers size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#38bdf8" }} />
                  {isId ? "Purposive & Non-Probability Sampling" : "Purposive & Non-Probability Sampling"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Pemilihan informan didasarkan pada kriteria tertentu yang relevan dengan fokus riset (kriteria inklusi), bukan secara acak, guna menggali informasi terkaya dan terdalam." 
                    : "Informants are chosen intentionally based on specific relevant criteria (inclusion criteria) rather than randomly, to gather the richest qualitative insights."}
                </p>
              </div>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("qual_saturation");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconTrendingDown size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#34d399" }} />
                  {isId ? "Prinsip Kejenuhan Data (Data Saturation)" : "Data Saturation Principle"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Pengumpulan data dihentikan ketika wawancara baru tidak lagi menghasilkan kode, tema, atau wawasan konseptual baru (standar homogen berkisar antara 12-20 subjek)." 
                    : "Data collection stops when subsequent interviews yield no new codes, themes, or conceptual categories (typically 12-20 participants for homogeneous cohorts)."}
                </p>
              </div>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("qual_alternative");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconMath size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#a78bfa" }} />
                  {isId ? "Metode Penarikan Lainnya" : "Alternative Qualitative Methods"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Gunakan Snowball Sampling untuk populasi tersembunyi/sensitif dengan meminta referensi informan dari subjek sebelumnya, atau Theoretical Sampling untuk Grounded Theory." 
                    : "Utilize Snowball Sampling for hard-to-reach populations by seeking chain-referrals, or Theoretical Sampling to guide emergent Grounded Theory."}
                </p>
              </div>
            </div>
          );
        } else if (approach === "mixed") {
          return (
            <div className="animate-fade-in" style={styles.eduContainer}>
              <div style={styles.eduBadge}>
                <IconBook size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {isId ? "TUTORIAL: METODE CAMPURAN (MIXED)" : "TUTORIAL: MIXED METHODS SAMPLING"}
              </div>
              <h3 style={styles.eduTitle}>{isId ? "Sampling Multitahap & Integrasi Metode" : "Multi-Stage Sampling & Integration"}</h3>
              <p style={styles.eduIntro}>
                {isId 
                  ? "Menyelaraskan pengambilan sampel terpisah antara Fase Kuantitatif dan Fase Kualitatif dalam satu studi terpadu." 
                  : "Harmonizing the distinct sampling demands of both Quantitative and Qualitative strands in a unified study."}
              </p>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("mixed_dual");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconUsers size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#34d399" }} />
                  {isId ? "Desain Sampling Ganda (Dual-Strand)" : "Dual-Strand Sampling Design"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Fase Kuantitatif memerlukan ukuran responden besar (probabilitas) demi kekuatan statistik, sedangkan Fase Kualitatif berfokus pada kelompok kecil secara bertujuan." 
                    : "The Quantitative strand requires large probability samples for statistical power, while the Qualitative strand focuses on small, information-rich cohorts."}
                </p>
              </div>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("mixed_integration");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconTrendingDown size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#a78bfa" }} />
                  {isId ? "Integrasi Sequential vs. Concurrent" : "Sequential vs Concurrent Integration"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Dalam sekuensial eksplanatori, subjek kualitatif sering kali dipilih secara purposif dari responden fase pertama kuantitatif untuk menerangkan hasil angka ekstrem." 
                    : "In explanatory sequential designs, qualitative participants are often purposively selected from the initial quantitative sample to explain extreme statistical results."}
                </p>
              </div>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("mixed_consistency");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconMath size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#38bdf8" }} />
                  {isId ? "Konsistensi Alur Sampel" : "Sample Flow Consistency"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Pastikan integrasi teknik sampling dilaporkan secara transparan untuk menjaga keabsahan (legitimacy) validitas metode campuran Anda." 
                    : "Ensure the sampling integration steps are reported transparently to maintain the methodological legitimacy of your mixed methods study."}
                </p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="animate-fade-in" style={styles.eduContainer}>
              <div style={styles.eduBadge}>
                <IconBook size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {isId ? "TUTORIAL: PENENTUAN UKURAN SAMPEL" : "TUTORIAL: SAMPLE SIZE CALCULATION"}
              </div>
              <h3 style={styles.eduTitle}>{isId ? "Batasan Populasi & Validitas Statistik" : "Population Bounds & Statistical Power"}</h3>
              <p style={styles.eduIntro}>
                {isId 
                  ? "Menghitung batas minimum subjek sampel yang valid secara matematis agar hasil penelitian Anda memenuhi syarat kepercayaan statistik." 
                  : "Calculating the mathematically sound minimum subject size required for your study to attain valid statistical confidence."}
              </p>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("quant_population");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconUsers size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "hsl(var(--primary-color))" }} />
                  {isId ? "Populasi Sasaran (N) vs. Sampel Penelitian (n)" : "Target Population (N) vs Sample (n)"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Populasi (N) mencakup keseluruhan subjek penelitian yang menjadi target generalisasi, sedangkan Sampel (n) adalah representasi sebagian populasi yang dipilih secara metodologis." 
                    : "Population (N) is the entire subject pool under study. Sample (n) is the scientifically chosen subgroup representing them."}
                </p>
              </div>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("quant_moe");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconTrendingDown size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#fca5a5" }} />
                  {isId ? "Toleransi Kesalahan (Margin of Error) & Tingkat Kepercayaan" : "Margin of Error (e) & Confidence Level"}
                </h4>
                <p style={styles.eduCardBody}>
                  {isId 
                    ? "Margin of Error (e) mencerminkan batas toleransi kesalahan estimasi (contoh: 5%). Tingkat Kepercayaan (Confidence Level) menunjukkan derajat keyakinan bahwa karakteristik sampel mencerminkan populasi (standar akademis adalah 95%)." 
                    : "Margin of error (e) represents allowable estimation error (e.g., 5%). Confidence level shows study certainty (academic standard is 95%)."}
                </p>
              </div>

              <div
                className="arche-edu-card"
                style={{ ...styles.eduCard, cursor: "pointer" }}
                onClick={() => {
                  setEduPopupItemId("quant_formula");
                  setEduPopupOpen(true);
                }}
              >
                <h4 style={styles.eduCardTitle}>
                  <IconMath size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#38bdf8" }} />
                  {isId ? "Formulasi & Teknik Pengambilan Sampel" : "Formulas & Sampling Techniques"}
                </h4>
                <p style={styles.eduCardBody}>
                  {formula === "slovin" 
                    ? (isId 
                      ? "Formula Slovin: Diterapkan ketika jumlah populasi (N) terukur secara pasti, disandingkan dengan teknik Probability Sampling seperti Simple Random atau Stratified." 
                      : "Slovin Formula: Applied when population size (N) is finite and known, typically paired with probability methods like Simple or Stratified Random.")
                    : (isId 
                      ? "Formula Lemeshow: Ideal untuk populasi tak terhingga (seperti survei kesehatan umum), biasanya dipadukan dengan teknik penarikan sampel sistematis." 
                      : "Lemeshow Formula: Suited for infinite/unknown populations (e.g., epidemiological survey) and often paired with systematic sampling.")}
                </p>
              </div>
            </div>
          );
        }
      case 3:
        return (
          <div className="animate-fade-in" style={styles.eduContainer}>
            <div style={styles.eduBadge}>
              <IconBook size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {isId ? "TUTORIAL: OPERASIONALISASI VARIABEL" : "TUTORIAL: OPERATIONALIZING VARIABLES"}
            </div>
            <h3 style={styles.eduTitle}>{isId ? "Skala Pengukuran & Konstruk Variabel" : "Measurement Scales & Structural Roles"}</h3>
            <p style={styles.eduIntro}>
              {isId 
                ? "Merumuskan bagaimana indikator penelitian diidentifikasi, diukur, dan dihubungkan secara struktural untuk kebutuhan analisis data." 
                : "Defining how your research indicators are classified, measured, and structured for data analysis."}
            </p>

            <div
              className="arche-edu-card"
              style={{ ...styles.eduCard, cursor: "pointer" }}
              onClick={() => {
                setEduPopupItemId("var_roles");
                setEduPopupOpen(true);
              }}
            >
              <h4 style={styles.eduCardTitle}>
                <IconLink size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "hsl(var(--primary-color))" }} />
                {isId ? "Peran Metodologis Variabel" : "Methodological Roles"}
              </h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Variabel Independen (stimulus) mempengaruhi variabel Dependen (respons). Mediator menjembatani mata rantai kausalitas, sementara Moderator memodifikasi kekuatan pengaruh hubungan tersebut." 
                  : "Independent (cause) influences Dependent (effect). Mediator bridges the causal chain, whereas Moderator alters relationship strength."}
              </p>
            </div>

            <div
              className="arche-edu-card"
              style={{ ...styles.eduCard, cursor: "pointer" }}
              onClick={() => {
                setEduPopupItemId("var_scales");
                setEduPopupOpen(true);
              }}
            >
              <h4 style={styles.eduCardTitle}>
                <IconRuler size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#a78bfa" }} />
                {isId ? "Empat Tingkatan Skala Pengukuran (Taksonomi Stevens)" : "Four Measurement Scales"}
              </h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Nominal (klasifikasi kategori tanpa tingkatan), Ordinal (memiliki peringkat/urutan), Interval (jarak antar nilai setara namun tanpa nilai nol mutlak), dan Rasio (skala pengukuran paling presisi karena memiliki nilai nol mutlak)." 
                  : "Nominal (Categorical), Ordinal (Ranked), Interval (Equal distances, no true zero), and Ratio (Absolute zero point)."}
              </p>
            </div>

            <div
              className="arche-edu-card"
              style={{ ...styles.eduTip, cursor: "pointer" }}
              onClick={() => {
                setEduPopupItemId("var_testing");
                setEduPopupOpen(true);
              }}
            >
              <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <IconChart size={16} style={{ color: "#34d399" }} />
                {isId ? "Rekomendasi Pengujian Statistik:" : "Recommended Statistical Test:"}
              </strong>
              <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", lineHeight: 1.4 }}>
                {isId 
                  ? `Berdasarkan karakteristik variabel Anda, metode analisis '${analysisMethod}' merupakan pilihan statistik yang paling valid untuk menguji hipotesis penelitian.` 
                  : `Aligned with your variables, the '${analysisMethod}' method is the ideal statistical choice to test your hypotheses.`}
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in" style={styles.eduContainer}>
            <div style={styles.eduBadge}>
              <IconBook size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {isId ? "TUTORIAL: SISTEMATIKA METODOLOGI" : "TUTORIAL: METHODOLOGY SYSTEMATICS"}
            </div>
            <h3 style={styles.eduTitle}>{isId ? "Finalisasi Desain & Replikabilitas Riset" : "Finalizing Design & Replicability"}</h3>
            <p style={styles.eduIntro}>
              {isId 
                ? "Selamat! Draf akademik BAB III Anda kini telah tersusun secara sistematis dan siap diintegrasikan ke dalam naskah skripsi atau tesis Anda." 
                : "Congratulations! Your Chapter 3 academic draft is now structured and ready for inclusion in your thesis."}
            </p>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>
                <IconRefresh size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "#22d3ee" }} />
                {isId ? "Prinsip Replikabilitas Riset" : "Replicability Principle"}
              </h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Tujuan utama penulisan BAB III secara presisi dan ilmiah adalah memastikan langkah-langkah metodologi Anda diuraikan secara transparan agar peneliti masa depan dapat mereplikasi riset ini dengan hasil yang konsisten." 
                  : "The central goal of Chapter 3 is to state your procedures so clearly that any future researcher can duplicate your study easily."}
              </p>
            </div>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>
                <IconFolder size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "hsl(var(--primary-color))" }} />
                {isId ? "Pilihan Ekspor Naskah" : "Export Options"}
              </h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Anda dapat mengunduh draf dalam format Markdown (.md) yang dapat dibuka secara instan menggunakan Microsoft Word, Notion, Obsidian, atau aplikasi pengolah dokumen lainnya." 
                  : "Export your draft in Markdown format (.md) which can be directly opened in Microsoft Word, Notion, Obsidian, or text editors."}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading || !project) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "1rem" }}>{t("common.loading")}</p>
      </div>
    );
  }

  const eduPopupData = eduPopupItemId ? getEduDetailContent(eduPopupItemId, i18n.language) : null;

  return (
    <div style={styles.container}>
      {/* Ambient decorative background glow circles */}
      <div className="glow-ambient-cyan"></div>
      <div className="glow-ambient-purple"></div>

      {/* Navigation Header */}
      <header className="fixed-header">
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          <img src="/Archeres.svg" alt="Archeres Logo" className="nav-brand-logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
          <span className="badge badge-primary">Workspace</span>
        </div>

        {/* Desktop Navigation Controls */}
        <div className="nav-controls-desktop" style={styles.navControls}>
          {user && user.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="btn btn-outline"
              style={styles.adminBtn}
            >
              <IconWrench size={13} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {t("common.admin")}
            </button>
          )}

          <button
            onClick={() => router.push("/user/dashboard")}
            className="btn btn-outline"
            style={styles.dashBtn}
          >
            {t("common.dashboard")}
          </button>
          {/* Language Switcher Bar */}
          <div style={styles.langBar}>
            <button
              onClick={() => handleLanguageToggle("en")}
              style={{
                ...styles.langBtn,
                ...(i18n.language === "en" ? styles.langBtnActive : {}),
              }}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageToggle("id")}
              style={{
                ...styles.langBtn,
                ...(i18n.language === "id" ? styles.langBtnActive : {}),
              }}
            >
              ID
            </button>
          </div>

          <button onClick={handleLogout} className="btn btn-outline" style={styles.logoutBtn}>
            {t("common.logout")}
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="burger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <IconX size={22} /> : <IconMenu size={22} />}
        </button>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-menu animate-fade-in">
            {user && user.role === "admin" && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/admin");
                }}
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <IconWrench size={14} />
                {t("common.admin")}
              </button>
            )}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push("/user/dashboard");
              }}
              className="btn btn-outline"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <IconFolder size={14} />
              {t("common.dashboard")}
            </button>

            {/* Language Switcher inside Mobile Drawer */}
            <div style={{ ...styles.langBar, width: "100%", justifyContent: "center" }}>
              <button
                onClick={() => handleLanguageToggle("en")}
                style={{
                  ...styles.langBtn,
                  flex: 1,
                  textAlign: "center",
                  justifyContent: "center",
                  ...(i18n.language === "en" ? styles.langBtnActive : {}),
                }}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageToggle("id")}
                style={{
                  ...styles.langBtn,
                  flex: 1,
                  textAlign: "center",
                  justifyContent: "center",
                  ...(i18n.language === "id" ? styles.langBtnActive : {}),
                }}
              >
                ID
              </button>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="btn btn-outline btn-danger"
              style={{ width: "100%", justifyContent: "center", background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}
            >
              {t("common.logout")}
            </button>
          </div>
        )}
      </header>

      {/* 3-Panel Workspace between Header & Footer */}
      <div
        className="workspace-layout"
        style={{
          ...styles.workspaceWrapper,
          gridTemplateColumns: !mounted 
            ? "300px 1fr 500px" 
            : isMobile 
              ? "1fr" 
              : window.innerWidth <= 1200 
                ? "240px 1fr" 
                : "300px 1fr 500px",
          position: "relative",
        }}
      >
        {/* Drawer collapsible edge tab button - sits on the border, never clipped */}
        {variables.length > 0 && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? (i18n.language === "id" ? "Tampilkan Penjelasan Edukasi" : "Show Educational Explanation") : (i18n.language === "id" ? "Tampilkan Draf BAB III" : "Show Chapter 3 Draft")}
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              right: showPreview ? (isMobile ? "calc(100% - 25px)" : "487px") : "-1px",
              width: "26px",
              height: "50px",
              borderRadius: "8px 0 0 8px",
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              border: "1px solid rgba(124, 58, 237, 0.35)",
              borderRight: "none",
              color: "#c084fc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              boxShadow: "-4px 0 15px rgba(0, 0, 0, 0.5)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            className="drawer-toggle-tab"
          >
            {showPreview ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        )}
        {/* 1. LEFT PANEL: Checklist & Navigation */}
        <aside
          className="workspace-sidebar glass-panel"
          style={{
            ...styles.leftPanel,
            display: isMobile ? "none" : "flex"
          }}
        >
          <div style={styles.leftHeader}>
            <button onClick={() => router.push("/user/dashboard")} style={styles.backLink}>
              ← {t("common.dashboard")}
            </button>
            <h2 style={styles.projectTitleText}>{project.title}</h2>
            <p style={styles.projectSubtitleText}>{t("wizard.title")}</p>
          </div>

          <nav style={styles.stepsNav}>
            {[
              { step: 1, label: t("wizard.step1"), icon: <IconHelix size={16} /> },
              { step: 2, label: t("wizard.step2"), icon: <IconMath size={16} /> },
              { step: 3, label: t("wizard.step3"), icon: <IconChart size={16} /> },
              { step: 4, label: t("wizard.step4"), icon: <IconFileDown size={16} /> }
            ].map((s) => {
              const unlocked = isStepUnlocked(s.step);
              return (
                <button
                  key={s.step}
                  onClick={() => {
                    if (unlocked) {
                      setActiveStep(s.step);
                    } else {
                      triggerAlert(t("wizard.stepLockedAlert", { prevStep: s.step - 1 }), t("common.notification"), "warning");
                    }
                  }}
                  style={{
                    ...styles.stepBtn,
                    ...(activeStep === s.step ? styles.stepBtnActive : {}),
                    ...(!unlocked ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "auto" } : {})
                  }}
                >
                  <span style={styles.stepIcon}>{s.icon}</span>
                  <div style={styles.stepMeta}>
                    <span style={styles.stepNum}>Step {s.step}</span>
                    <span style={styles.stepLabel}>{s.label}</span>
                  </div>
                  {(isStepCompleted(s.step) || activeStep > s.step) && <span style={styles.stepCheck}>✓</span>}
                </button>
              );
            })}
          </nav>

          <div style={styles.leftFooter}>
            <button
              onClick={handleSaveProgress}
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem" }}
              disabled={saveLoading}
            >
              {saveLoading ? (
                t("common.loading")
              ) : (
                <>
                  <IconSave size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                  {t("common.save")}
                </>
              )}
            </button>

            {/* Offline Backup & Restore Section */}
            <div style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              paddingTop: "1rem",
              marginTop: "0.25rem"
            }}>
              <p style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
                textAlign: "center"
              }}>
                {i18n.language === "id" ? "Cadangan Offline" : "Offline Backup"}
              </p>
              <div style={{
                display: "flex",
                gap: "0.5rem",
                width: "100%"
              }}>
                <button
                  onClick={handleExportBackupJson}
                  className="btn btn-outline"
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.5rem",
                    fontSize: "0.72rem",
                    background: "rgba(167, 139, 250, 0.03)",
                    borderColor: "rgba(167, 139, 250, 0.2)",
                    color: "#c084fc",
                    cursor: "pointer",
                    fontWeight: 600,
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    transition: "all 0.2s ease",
                    borderWidth: "1px",
                    borderStyle: "solid"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(167, 139, 250, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(167, 139, 250, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.2)";
                  }}
                >
                  📤 {i18n.language === "id" ? "Ekspor" : "Export"}
                </button>
                <label
                  className="btn btn-outline"
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.5rem",
                    fontSize: "0.72rem",
                    background: "rgba(34, 211, 238, 0.03)",
                    borderColor: "rgba(34, 211, 238, 0.2)",
                    color: "#22d3ee",
                    cursor: "pointer",
                    fontWeight: 600,
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    transition: "all 0.2s ease",
                    borderWidth: "1px",
                    borderStyle: "solid"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(34, 211, 238, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(34, 211, 238, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.2)";
                  }}
                >
                  📥 {i18n.language === "id" ? "Impor" : "Import"}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackupJson}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* 2. MIDDLE PANEL: Interactive Forms & Calculators */}
        <section className="workspace-wizard" style={styles.middlePanel}>
          <div style={{
            ...styles.middleHeader,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "1rem"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={styles.middleStepIndicator}>
                {t("wizard.progress", { current: activeStep, total: 4 })}
              </span>
              <h1 style={styles.middleStepTitle}>
                {activeStep === 1 && t("wizard.step1")}
                {activeStep === 2 && t("wizard.step2")}
                {activeStep === 3 && t("wizard.step3")}
                {activeStep === 4 && t("wizard.step4")}
              </h1>
            </div>

            {isMobile && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => router.push("/user/dashboard")}
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>←</span> {t("common.dashboard")}
                </button>
                <button
                  onClick={handleSaveProgress}
                  className="btn btn-primary"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                  disabled={saveLoading}
                >
                  <IconSave size={12} />
                  {t("common.save")}
                </button>
              </div>
            )}
          </div>

          {isMobile && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "0.5rem 1rem",
              marginBottom: "1.25rem",
              gap: "0.5rem",
              backdropFilter: "blur(8px)",
              width: "100%",
              boxSizing: "border-box"
            }}>
              {[1, 2, 3, 4].map((stepNum) => {
                const unlocked = isStepUnlocked(stepNum);
                const completed = isStepCompleted(stepNum) || activeStep > stepNum;
                const isActive = activeStep === stepNum;

                return (
                  <button
                    key={stepNum}
                    onClick={() => {
                      if (unlocked) {
                        setActiveStep(stepNum);
                      } else {
                        triggerAlert(t("wizard.stepLockedAlert", { prevStep: stepNum - 1 }), t("common.notification"), "warning");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: isActive 
                        ? "2px solid #a78bfa" 
                        : unlocked 
                          ? "1px solid rgba(255, 255, 255, 0.2)" 
                          : "1px solid rgba(255, 255, 255, 0.05)",
                      background: isActive 
                        ? "rgba(167, 139, 250, 0.2)" 
                        : unlocked 
                          ? "rgba(255, 255, 255, 0.05)" 
                          : "transparent",
                      color: isActive 
                        ? "#c084fc" 
                        : unlocked 
                          ? "rgba(255, 255, 255, 0.8)" 
                          : "rgba(255, 255, 255, 0.2)",
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      cursor: unlocked ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                      position: "relative",
                      boxShadow: isActive ? "0 0 10px rgba(167, 139, 250, 0.3)" : "none",
                    }}
                  >
                    {completed && !isActive ? (
                      <span style={{ color: "#34d399", fontSize: "0.85rem" }}>✓</span>
                    ) : (
                      stepNum
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div style={styles.formContainer}>
            {/* STEP 1: Research Paradigm & Design Selector */}
            {activeStep === 1 && (
              <div style={styles.stepForm} className="animate-fade-in">
                <div className="form-group">
                  <label className="form-label">{t("wizard.approachLabel")}</label>
                  <p style={styles.inputHelp}>{t("wizard.approachDesc")}</p>
                  <div style={styles.radioGrid}>
                    {[
                      { id: "quant", label: t("wizard.quant"), desc: "Numerical data, tests, calculations" },
                      { id: "qual", label: t("wizard.qual"), desc: "Interviews, meanings, categories" },
                      { id: "mixed", label: t("wizard.mixed"), desc: "Quantitative and qualitative combined" }
                    ].map((ap) => (
                      <div
                        key={ap.id}
                        onClick={() => handleApproachChange(ap.id)}
                        style={{
                          ...styles.radioCard,
                          ...(approach === ap.id ? styles.radioCardActive : {}),
                        }}
                      >
                        <span style={styles.radioTitle}>{ap.label}</span>
                        <span style={styles.radioDesc}>{ap.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "1.5rem" }}>
                  <label className="form-label">{t("wizard.designLabel")}</label>
                  <p style={styles.inputHelp}>{t("wizard.designDesc")}</p>
                  <select
                    value={design}
                    onChange={(e) => setDesign(e.target.value)}
                    className="form-input"
                    style={styles.selectInput}
                  >
                    {approach === "quant" && (
                      <>
                        <option value="Experimental">Experimental (Pre, True, Quasi)</option>
                        <option value="Correlational">Correlational (Relationship Analysis)</option>
                        <option value="Survey / Descriptive">Descriptive Survey</option>
                      </>
                    )}
                    {approach === "qual" && (
                      <>
                        <option value="Case Study">Grounded Case Study</option>
                        <option value="Phenomenology">Phenomenology (Lived Experiences)</option>
                        <option value="Grounded Theory">Grounded Theory Framework</option>
                      </>
                    )}
                    {approach === "mixed" && (
                      <>
                        <option value="Convergent Parallel">Convergent Parallel Design</option>
                        <option value="Explanatory Sequential">Explanatory Sequential Design</option>
                        <option value="Exploratory Sequential">Exploratory Sequential Design</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Mathematical Sample Size & Sampling Technique */}
            {activeStep === 2 && (
              <div style={styles.stepForm} className="animate-fade-in">
                {/* Guided Target Population Status Question */}
                {approach !== "qual" && (
                  <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                    <label className="form-label">{t("wizard.popKnownLabel")}</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                      <div
                        onClick={() => handlePopKnownChange(true)}
                        style={{
                          padding: "1rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          background: isPopKnown ? "rgba(167, 139, 250, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          border: isPopKnown ? "1px solid #a78bfa" : "1px solid rgba(255, 255, 255, 0.08)",
                          boxShadow: isPopKnown ? "0 4px 15px rgba(167, 139, 250, 0.1)" : "none",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
                          <input
                            type="radio"
                            checked={isPopKnown}
                            onChange={() => {}}
                            style={{ marginRight: "0.5rem", accentColor: "#a78bfa" }}
                          />
                          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: isPopKnown ? "#c084fc" : "rgba(255, 255, 255, 0.9)" }}>
                            {t("wizard.popKnownYes")}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.45)", margin: 0, lineHeight: 1.35 }}>
                          {t("wizard.popKnownYesDesc")}
                        </p>
                      </div>

                      <div
                        onClick={() => handlePopKnownChange(false)}
                        style={{
                          padding: "1rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          background: !isPopKnown ? "rgba(167, 139, 250, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          border: !isPopKnown ? "1px solid #a78bfa" : "1px solid rgba(255, 255, 255, 0.08)",
                          boxShadow: !isPopKnown ? "0 4px 15px rgba(167, 139, 250, 0.1)" : "none",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
                          <input
                            type="radio"
                            checked={!isPopKnown}
                            onChange={() => {}}
                            style={{ marginRight: "0.5rem", accentColor: "#a78bfa" }}
                          />
                          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: !isPopKnown ? "#c084fc" : "rgba(255, 255, 255, 0.9)" }}>
                            {t("wizard.popKnownNo")}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.45)", margin: 0, lineHeight: 1.35 }}>
                          {t("wizard.popKnownNoDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t("wizard.formulaLabel")}</label>
                  <p style={styles.inputHelp}>{t("wizard.formulaDesc")}</p>
                  <select
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    className="form-input"
                    style={styles.selectInput}
                    disabled={approach === "qual"}
                  >
                    {approach === "qual" ? (
                      <option value="saturation">{t("wizard.formulaSaturation")}</option>
                    ) : isPopKnown ? (
                      <>
                        <option value="slovin">{t("wizard.formulaSlovin")}</option>
                        <option value="lemeshow">{t("wizard.formulaLemeshow")}</option>
                        <option value="krejcie_morgan">{t("wizard.formulaKrejcieMorgan")}</option>
                        <option value="yamane">{t("wizard.formulaYamane")}</option>
                        <option value="isaac_michael">{t("wizard.formulaIsaacMichael")}</option>
                        <option value="arikunto">{t("wizard.formulaArikunto")}</option>
                        <option value="gay_diehl">{t("wizard.formulaGayDiehl")}</option>
                      </>
                    ) : (
                      <>
                        <option value="cochran">{t("wizard.formulaCochran")}</option>
                        <option value="daniel">{t("wizard.formulaDaniel")}</option>
                        <option value="kish_leslie">{t("wizard.formulaKishLeslie")}</option>
                        <option value="gay_diehl">{t("wizard.formulaGayDiehl")}</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Sampling Technique Selector */}
                <div className="form-group" style={{ marginTop: "1.25rem" }}>
                  <label className="form-label">{t("wizard.samplingLabel")}</label>
                  <p style={styles.inputHelp}>{t("wizard.samplingDesc")}</p>
                  <select
                    value={samplingTechnique}
                    onChange={(e) => setSamplingTechnique(e.target.value)}
                    className="form-input"
                    style={styles.selectInput}
                  >
                    {approach === "quant" && (
                      <>
                        <option value="Simple Random Sampling">{t("wizard.samplingSimpleRandom")}</option>
                        <option value="Systematic Random Sampling">{t("wizard.samplingSystematicRandom")}</option>
                        <option value="Stratified Random Sampling">{t("wizard.samplingStratifiedRandom")}</option>
                        <option value="Cluster Random Sampling">{t("wizard.samplingClusterRandom")}</option>
                        <option value="Convenience Sampling">{t("wizard.samplingConvenience")}</option>
                      </>
                    )}
                    {approach === "qual" && (
                      <>
                        <option value="Purposive Sampling">{t("wizard.samplingPurposive")}</option>
                        <option value="Snowball Sampling">{t("wizard.samplingSnowball")}</option>
                        <option value="Criterion Sampling">{t("wizard.samplingCriterion")}</option>
                        <option value="Theoretical Sampling">{t("wizard.samplingTheoretical")}</option>
                      </>
                    )}
                    {approach === "mixed" && (
                      <>
                        <option value="Sequential Mixed Sampling">{t("wizard.samplingSequentialMixed")}</option>
                        <option value="Concurrent Mixed Sampling">{t("wizard.samplingConcurrentMixed")}</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Dynamic Parameter Sliders or Qualitative Saturation Warning */}
                {approach === "qual" ? (
                  <div style={styles.slidersCard} className="glass-panel">
                    <div style={styles.sliderGroup}>
                      <div style={styles.sliderHeader}>
                        <span style={styles.sliderLabel}>{t("wizard.targetParticipantsLabel")}</span>
                        <span style={styles.sliderVal}>{sampleSize}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="1"
                        value={sampleSize}
                        onChange={(e) => setSampleSize(Number(e.target.value))}
                        style={styles.rangeInput}
                      />
                      <p style={styles.sliderHelp}>{t("wizard.targetParticipantsDesc")}</p>
                    </div>
                    <div
                      style={{
                        background: "rgba(56, 189, 248, 0.05)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        padding: "1rem",
                        borderRadius: "10px",
                        marginTop: "1rem",
                      }}
                    >
                      <p style={{ fontSize: "0.85rem", color: "#38bdf8", lineHeight: 1.4, margin: 0 }}>
                        ℹ️ {t("wizard.qualitativeSaturationNotice")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={styles.slidersCard} className="glass-panel">
                    {/* 1. Population Size N (for finite formulas) */}
                    {(["slovin", "lemeshow", "krejcie_morgan", "yamane", "isaac_michael", "arikunto"].includes(formula) || (formula === "gay_diehl" && design === "Survey / Descriptive")) && (
                      <div style={styles.sliderGroup}>
                        <div style={styles.sliderHeader}>
                          <span style={styles.sliderLabel}>{t("wizard.popSizeLabel")}</span>
                          <span style={styles.sliderVal}>{popSize.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100000"
                          step="50"
                          value={popSize}
                          onChange={(e) => setPopSize(Number(e.target.value))}
                          style={styles.rangeInput}
                        />
                        <p style={styles.sliderHelp}>{t("wizard.popSizeDesc")}</p>
                      </div>
                    )}

                    {/* 2. Confidence Level Z */}
                    {["cochran", "lemeshow", "krejcie_morgan", "daniel", "kish_leslie"].includes(formula) && (
                      <div style={styles.sliderGroup}>
                        <div style={styles.sliderHeader}>
                          <span style={styles.sliderLabel}>{t("wizard.confLevelLabel")}</span>
                          <span style={styles.sliderVal}>{confLevel * 100}%</span>
                        </div>
                        <select
                          value={confLevel}
                          onChange={(e) => setConfLevel(Number(e.target.value))}
                          className="form-input"
                          style={styles.selectInputSmall}
                        >
                          <option value={0.90}>90% (Z = 1.645)</option>
                          <option value={0.95}>95% (Z = 1.96)</option>
                          <option value={0.99}>99% (Z = 2.576)</option>
                        </select>
                        <p style={styles.sliderHelp}>{t("wizard.confLevelDesc")}</p>
                      </div>
                    )}

                    {/* 3. Margin of Error e */}
                    {!["gay_diehl"].includes(formula) && (
                    <div style={styles.sliderGroup}>
                      <div style={styles.sliderHeader}>
                        <span style={styles.sliderLabel}>{formula === "arikunto" ? "Arikunto Percentage" : t("wizard.marginLabel")}</span>
                        <span style={styles.sliderVal}>{(marginError * 100).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min={formula === "arikunto" ? "0.10" : "0.01"}
                        max={formula === "arikunto" ? "0.25" : "0.20"}
                        step={formula === "arikunto" ? "0.01" : "0.005"}
                        value={marginError}
                        onChange={(e) => setMarginError(Number(e.target.value))}
                        style={styles.rangeInput}
                      />
                      <p style={styles.sliderHelp}>{formula === "arikunto" ? "Persentase sampel dari populasi (10-25%)" : t("wizard.marginDesc")}</p>
                    </div>
                    )}

                    {/* 4. Attribute Proportion p */}
                    {["cochran", "lemeshow", "krejcie_morgan", "daniel", "kish_leslie", "isaac_michael"].includes(formula) && (
                      <div style={styles.sliderGroup}>
                        <div style={styles.sliderHeader}>
                          <span style={styles.sliderLabel}>{t("wizard.propLabel")}</span>
                          <span style={styles.sliderVal}>{proportion}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.05"
                          value={proportion}
                          onChange={(e) => setProportion(Number(e.target.value))}
                          style={styles.rangeInput}
                        />
                        <p style={styles.sliderHelp}>{t("wizard.propDesc")}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Real-time Math Output box */}
                <div style={styles.calculatorOutput} className="glass-panel">
                  <span style={styles.outputLabel}>
                    {approach === "qual" ? t("wizard.targetParticipantsLabel") : t("wizard.sampleSizeResult")}
                  </span>
                  <span style={styles.outputVal}>{sampleSize}</span>
                  <p style={styles.outputHelp}>
                    {approach === "qual" ? t("wizard.targetParticipantsDesc") : t("wizard.sampleSizeDesc")}
                  </p>
                </div>

                {/* Component 1: Interactive Sampling Power & Sensitivity Visualizer */}
                {approach !== "qual" && formula !== "saturation" && (
                  <div style={{ marginTop: "1.5rem", padding: "1.25rem" }} className="glass-panel">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                        📈 {t("wizard.visualizerTitle")}
                      </span>
                      <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "20px", background: "rgba(167, 139, 250, 0.1)", color: "#c084fc", border: "1px solid rgba(167, 139, 250, 0.2)" }}>
                        {formula.toUpperCase().replace("_", " ")}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", margin: "0 0 1rem 0", lineHeight: 1.35 }}>
                      {t("wizard.visualizerDesc")}
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", position: "relative", padding: "0.5rem", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      {(() => {
                        const sensData = getSensitivityData();
                        const maxN = Math.max(...sensData.map(d => d.n), 50);
                        const minE = formula === "arikunto" ? 0.10 : 0.01;
                        const maxE = formula === "arikunto" ? 0.25 : 0.20;
                        
                        const points = sensData.map(d => {
                          const x = 35 + ((d.e - minE) / (maxE - minE)) * 330;
                          const y = 145 - (d.n / maxN) * 125;
                          return `${x},${y}`;
                        });
                        const pathD = points.length > 0 ? `M ${points.join(" L ")}` : "";

                        const currentX = 35 + ((marginError - minE) / (maxE - minE)) * 330;
                        const currentY = 145 - (sampleSize / maxN) * 125;

                        return (
                          <svg width="100%" height="175" viewBox="0 0 400 175" style={{ overflow: "visible" }}>
                            <defs>
                              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#22d3ee" />
                              </linearGradient>
                              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                              </linearGradient>
                              <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>

                            <line x1="35" y1="20" x2="365" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                            <line x1="35" y1="82.5" x2="365" y2="82.5" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                            <line x1="35" y1="145" x2="365" y2="145" stroke="rgba(255,255,255,0.15)" />
                            
                            <line x1="35" y1="20" x2="35" y2="145" stroke="rgba(255,255,255,0.15)" />
                            <line x1="200" y1="20" x2="200" y2="145" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                            <line x1="365" y1="20" x2="365" y2="145" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                            {points.length > 0 && (
                              <path
                                d={`${pathD} L 365,145 L 35,145 Z`}
                                fill="url(#areaGradient)"
                              />
                            )}

                            <path
                              d={pathD}
                              fill="none"
                              stroke="url(#curveGradient)"
                              strokeWidth="2.5"
                              filter="url(#glow)"
                              style={{ transition: "stroke 0.3s ease" }}
                            />

                            <text x="35" y="160" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
                              {(minE * 100).toFixed(0)}%
                            </text>
                            <text x="200" y="160" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
                              {t("wizard.visualizerXAxis")}
                            </text>
                            <text x="365" y="160" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
                              {(maxE * 100).toFixed(0)}%
                            </text>

                            <text x="27" y="148" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">
                              0
                            </text>
                            <text x="27" y="86" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">
                              {Math.ceil(maxN / 2)}
                            </text>
                            <text x="27" y="24" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">
                              {maxN}
                            </text>

                            <line x1={currentX} y1="145" x2={currentX} y2={currentY} stroke="rgba(167, 139, 250, 0.4)" strokeDasharray="2,2" />
                            <line x1="35" y1={currentY} x2={currentX} y2={currentY} stroke="rgba(167, 139, 250, 0.4)" strokeDasharray="2,2" />

                            <circle
                              cx={currentX}
                              cy={currentY}
                              r="6"
                              fill="#22d3ee"
                              stroke="#fff"
                              strokeWidth="2"
                              filter="url(#glow)"
                            />
                            
                            <g transform={`translate(${currentX > 250 ? currentX - 100 : currentX + 15}, ${currentY > 100 ? currentY - 35 : currentY + 10})`}>
                              <rect width="85" height="26" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.1)" />
                              <text x="8" y="16" fill="#fff" fontSize="8" fontWeight="bold">
                                e={(marginError * 100).toFixed(1)}%, n={sampleSize}
                              </text>
                            </g>
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Variable & Measurement Scale Planner */}
            {activeStep === 3 && (
              <div style={styles.stepForm} className="animate-fade-in">
                <div style={styles.varsHeaderRow}>
                  <label className="form-label">{t("wizard.varLabel")}</label>
                  <button onClick={handleAddVariable} className="btn btn-outline" style={styles.addVarBtn}>
                    <IconPlus size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                    {t("wizard.addVarBtn")}
                  </button>
                </div>
                <p style={{ ...styles.inputHelp, marginBottom: "1.5rem" }}>
                  {t("wizard.varDesc")}
                </p>

                <div style={styles.varsTable}>
                  {variables.map((v, index) => (
                    <div key={index} style={styles.varRow} className="glass-panel">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleVariableChange(index, "name", e.target.value)}
                        placeholder={t("wizard.varNameCol")}
                        className="form-input"
                        style={styles.varInput}
                      />

                      <select
                        value={v.role}
                        onChange={(e) => handleVariableChange(index, "role", e.target.value)}
                        className="form-input"
                        style={styles.varSelect}
                      >
                        <option value="Independent (Cause)">{t("wizard.roleInd")}</option>
                        <option value="Dependent (Effect)">{t("wizard.roleDep")}</option>
                        <option value="Moderator (Context)">{t("wizard.roleMod")}</option>
                        <option value="Mediator (Mechanism)">{t("wizard.roleMed")}</option>
                      </select>

                      <select
                        value={v.scale}
                        onChange={(e) => handleVariableChange(index, "scale", e.target.value)}
                        className="form-input"
                        style={styles.varSelect}
                      >
                        <option value="Nominal (Categories)">{t("wizard.scaleNom")}</option>
                        <option value="Ordinal (Ranked Categories)">{t("wizard.scaleOrd")}</option>
                        <option value="Interval (Ordered, Equal Distances)">{t("wizard.scaleInt")}</option>
                        <option value="Ratio (Ordered, True Zero Point)">{t("wizard.scaleRat")}</option>
                      </select>

                      <button onClick={() => handleRemoveVariable(index)} style={styles.varDelete}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Analytical Advice Panel */}
                <div style={styles.adviceCard} className="glass-panel">
                  <span style={styles.adviceLabel}>💡 {t("wizard.analysisLabel")}</span>
                  <p style={styles.inputHelp}>{t("wizard.analysisDesc")}</p>
                  
                  {/* Smart Advisor Recommendation Card */}
                  {variables.length > 0 && (
                    <div style={{
                      marginTop: "1.25rem",
                      padding: "1rem",
                      background: "rgba(124, 58, 237, 0.05)",
                      border: "1px solid rgba(124, 58, 237, 0.25)",
                      borderRadius: "10px",
                      textAlign: "left"
                    }} className="animate-fade-in">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 700, color: "#a78bfa" }}>
                          🧠 {t("wizard.advisorTitle")}
                        </span>
                        {analysisMethod === (i18n.language === "id" ? getStatisticalRecommendation().testNameId : getStatisticalRecommendation().testNameEn) && (
                          <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "10px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
                            ✓ Active
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem 0" }}>
                        {i18n.language === "id" ? getStatisticalRecommendation().testNameId : getStatisticalRecommendation().testNameEn}
                      </h4>
                      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", margin: "0 0 0.75rem 0", lineHeight: 1.4 }}>
                        <strong>{t("wizard.advisorWhy")}:</strong> {i18n.language === "id" ? getStatisticalRecommendation().whyId : getStatisticalRecommendation().whyEn}
                      </p>

                      <button
                        onClick={() => {
                          const rec = getStatisticalRecommendation();
                          setAnalysisMethod(i18n.language === "id" ? rec.testNameId : rec.testNameEn);
                        }}
                        className="btn btn-outline"
                        style={{
                          width: "100%",
                          padding: "0.45rem",
                          fontSize: "0.78rem",
                          borderColor: "rgba(167, 139, 250, 0.4)",
                          color: "#c084fc",
                          background: "rgba(167, 139, 250, 0.03)",
                          marginBottom: "1rem"
                        }}
                      >
                        ⚡ {t("wizard.advisorApplyBtn")}
                      </button>

                      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                          <button
                            onClick={() => setCodeTab("python")}
                            style={{
                              flex: 1,
                              padding: "0.4rem",
                              fontSize: "0.74rem",
                              background: codeTab === "python" ? "rgba(167, 139, 250, 0.15)" : "transparent",
                              color: codeTab === "python" ? "#c084fc" : "rgba(255,255,255,0.4)",
                              border: "none",
                              cursor: "pointer",
                              borderTopLeftRadius: "8px"
                            }}
                          >
                            Python (SciPy)
                          </button>
                          <button
                            onClick={() => setCodeTab("go")}
                            style={{
                              flex: 1,
                              padding: "0.4rem",
                              fontSize: "0.74rem",
                              background: codeTab === "go" ? "rgba(167, 139, 250, 0.15)" : "transparent",
                              color: codeTab === "go" ? "#c084fc" : "rgba(255,255,255,0.4)",
                              border: "none",
                              cursor: "pointer",
                              borderTopRightRadius: "8px"
                            }}
                          >
                            Go (Math)
                          </button>
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: "0.75rem",
                          fontSize: "0.68rem",
                          color: "#38bdf8",
                          fontFamily: "monospace",
                          overflowX: "auto",
                          maxHeight: "150px",
                          lineHeight: 1.35
                        }}>
                          <code>{codeTab === "python" ? getStatisticalRecommendation().codePython : getStatisticalRecommendation().codeGo}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "1rem", textAlign: "left" }}>
                    <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                      {i18n.language === "id" ? "Metode Terpilih (Kustomisasi Manual)" : "Selected Method (Manual Override)"}
                    </label>
                    <input
                      type="text"
                      value={analysisMethod}
                      onChange={(e) => setAnalysisMethod(e.target.value)}
                      className="form-input"
                      style={{ marginTop: "0.4rem" }}
                      placeholder={t("wizard.analysisPlaceholder")}
                    />
                  </div>
                </div>

                {/* E2EE Instrument Reliability Panel */}
                <div style={{
                  marginTop: "2rem",
                  padding: "1.5rem",
                  borderColor: "rgba(167, 139, 250, 0.2)",
                  background: "rgba(167, 139, 250, 0.02)",
                  borderRadius: "12px",
                  textAlign: "left"
                }} className="glass-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#a78bfa",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        🔒 {t("wizard.reliabilityTitle")} <span style={{
                          fontSize: "0.68rem",
                          background: "rgba(167, 139, 250, 0.15)",
                          color: "#c084fc",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          fontWeight: 600
                        }}>ZERO-KNOWLEDGE E2EE</span>
                      </span>
                      <p style={{ ...styles.inputHelp, marginTop: "0.25rem", marginBottom: 0 }}>
                        {t("wizard.reliabilityDesc")}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowReliability(!showReliability)}
                      className="btn btn-outline"
                      style={{
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.78rem",
                        borderColor: "rgba(167, 139, 250, 0.3)",
                        color: "#c084fc",
                        background: showReliability ? "rgba(167, 139, 250, 0.1)" : "transparent"
                      }}
                    >
                      {showReliability ? (i18n.language === "id" ? "Tutup" : "Hide") : (i18n.language === "id" ? "Buka Kalkulator" : "Open Calculator")}
                    </button>
                  </div>

                  {showReliability && (
                    <div style={{ marginTop: "1.5rem" }} className="animate-fade-in">
                      {/* Metric & Meta Row */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.9fr 0.9fr",
                        gap: "1rem",
                        marginBottom: "1.25rem"
                      }}>
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>
                            {t("wizard.reliabilityType")}
                          </label>
                          <div style={{
                            display: "flex",
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "6px",
                            padding: "2px"
                          }}>
                            <button
                              onClick={() => setRelType("cronbach")}
                              style={{
                                flex: 1,
                                padding: "0.35rem 0.5rem",
                                fontSize: "0.75rem",
                                background: relType === "cronbach" ? "rgba(167, 139, 250, 0.15)" : "transparent",
                                color: relType === "cronbach" ? "#c084fc" : "rgba(255,255,255,0.4)",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: 700
                              }}
                            >
                              Cronbach's Alpha (Likert)
                            </button>
                            <button
                              onClick={() => setRelType("kr20")}
                              style={{
                                flex: 1,
                                padding: "0.35rem 0.5rem",
                                fontSize: "0.75rem",
                                background: relType === "kr20" ? "rgba(167, 139, 250, 0.15)" : "transparent",
                                color: relType === "kr20" ? "#c084fc" : "rgba(255,255,255,0.4)",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: 700
                              }}
                            >
                              KR-20 (Dichotomous)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>
                            {t("wizard.reliabilityItems")}
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="50"
                            value={relK}
                            onChange={(e) => {
                              const v = Math.min(50, Math.max(2, parseInt(e.target.value) || 2));
                              setRelK(v);
                            }}
                            className="form-input"
                            style={{ height: "34px", fontSize: "0.85rem" }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>
                            {t("wizard.reliabilityResp")}
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="50"
                            value={relResp}
                            onChange={(e) => {
                              const v = Math.min(50, Math.max(2, parseInt(e.target.value) || 2));
                              setRelResp(v);
                            }}
                            className="form-input"
                            style={{ height: "34px", fontSize: "0.85rem" }}
                          />
                        </div>
                      </div>

                      {/* Input Mode Navigation Tabs */}
                      <div style={{
                        display: "flex",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        marginBottom: "1.25rem"
                      }}>
                        <button
                          onClick={() => setInputMode("aggregate")}
                          style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            background: "transparent",
                            color: inputMode === "aggregate" ? "#c084fc" : "rgba(255,255,255,0.45)",
                            border: "none",
                            borderBottom: inputMode === "aggregate" ? "2px solid #a78bfa" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          📊 {t("wizard.reliabilityAggregateTab")}
                        </button>
                        <button
                          onClick={() => setInputMode("grid")}
                          style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            background: "transparent",
                            color: inputMode === "grid" ? "#c084fc" : "rgba(255,255,255,0.45)",
                            border: "none",
                            borderBottom: inputMode === "grid" ? "2px solid #a78bfa" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          🎛️ {t("wizard.reliabilityMatrixTab")}
                        </button>
                      </div>

                      {/* Aggregate Inputs Panel */}
                      {inputMode === "aggregate" && (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                          gap: "1rem",
                          padding: "1rem",
                          background: "rgba(0,0,0,0.15)",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.04)"
                        }} className="animate-fade-in">
                          {relType === "cronbach" ? (
                            <div>
                              <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "0.3rem" }}>
                                {t("wizard.reliabilitySumVariances")} (Σ s_i²)
                              </label>
                              <input
                                type="text"
                                value={sumVariances}
                                onChange={(e) => setSumVariances(e.target.value)}
                                className="form-input"
                                placeholder="E.g., 2.5"
                                style={{ height: "32px", fontSize: "0.8rem" }}
                              />
                            </div>
                          ) : (
                            <div>
                              <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "0.3rem" }}>
                                {t("wizard.reliabilitySuccessProduct")} (Σ p_i q_i)
                              </label>
                              <input
                                type="text"
                                value={sumSuccessProd}
                                onChange={(e) => setSumSuccessProd(e.target.value)}
                                className="form-input"
                                placeholder="E.g., 1.8"
                                style={{ height: "32px", fontSize: "0.8rem" }}
                              />
                            </div>
                          )}

                          <div>
                            <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "0.3rem" }}>
                              {t("wizard.reliabilityTotalVariance")} (s_t²)
                            </label>
                            <input
                              type="text"
                              value={totVariance}
                              onChange={(e) => setTotVariance(e.target.value)}
                              className="form-input"
                              placeholder="E.g., 12.4"
                              style={{ height: "32px", fontSize: "0.8rem" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Interactive Simulation Grid Panel */}
                      {inputMode === "grid" && (
                        <div style={{
                          padding: "1rem",
                          background: "rgba(0,0,0,0.15)",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.04)"
                        }} className="animate-fade-in">
                          <p style={{ ...styles.inputHelp, fontSize: "0.7rem", color: "#38bdf8", marginBottom: "0.75rem" }}>
                            {relType === "cronbach"
                              ? (i18n.language === "id"
                                  ? "✍️ Masukkan nilai kuesioner Likert (skor 1-5). Variabel dihitung real-time secara lokal."
                                  : "✍️ Enter continuous Likert response values (scores 1-5). Math computes locally in real-time.")
                              : (i18n.language === "id"
                                  ? "⚡ Klik cell untuk toggle respon biner: 0 (Gagal/Salah) atau 1 (Sukses/Benar)."
                                  : "⚡ Click grid cells to toggle dichotomous response: 0 (Failure) or 1 (Success).")}
                          </p>

                          <div style={{
                            overflowX: "auto",
                            maxHeight: "260px",
                            overflowY: "auto",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "6px"
                          }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${relK * 60 + 80}px` }}>
                              <thead>
                                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                  <th style={{
                                    padding: "0.4rem",
                                    fontSize: "0.7rem",
                                    color: "rgba(255,255,255,0.4)",
                                    textAlign: "center",
                                    borderRight: "1px solid rgba(255,255,255,0.05)",
                                    width: "70px",
                                    position: "sticky",
                                    left: 0,
                                    background: "#0f172a",
                                    zIndex: 10
                                  }}>
                                    Resp
                                  </th>
                                  {Array.from({ length: relK }).map((_, colIdx) => (
                                    <th key={colIdx} style={{
                                      padding: "0.4rem",
                                      fontSize: "0.7rem",
                                      color: "#a78bfa",
                                      textAlign: "center"
                                    }}>
                                      Q{colIdx + 1}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from({ length: relResp }).map((_, rowIdx) => (
                                  <tr key={rowIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: rowIdx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                                    <td style={{
                                      padding: "0.3rem",
                                      fontSize: "0.7rem",
                                      color: "rgba(255,255,255,0.5)",
                                      textAlign: "center",
                                      fontWeight: 600,
                                      borderRight: "1px solid rgba(255,255,255,0.05)",
                                      position: "sticky",
                                      left: 0,
                                      background: rowIdx % 2 === 0 ? "#121a2e" : "#0f172a",
                                      zIndex: 1
                                    }}>
                                      R{rowIdx + 1}
                                    </td>
                                    {Array.from({ length: relK }).map((_, colIdx) => {
                                      const cellValue = relMatrix[rowIdx]?.[colIdx] !== undefined ? relMatrix[rowIdx][colIdx] : (relType === "kr20" ? 1 : 4);
                                      
                                      if (relType === "kr20") {
                                        return (
                                          <td key={colIdx} style={{ padding: "0.25rem", textAlign: "center" }}>
                                            <button
                                              onClick={() => {
                                                const nextMatrix = [...relMatrix];
                                                if (!nextMatrix[rowIdx]) nextMatrix[rowIdx] = [];
                                                nextMatrix[rowIdx][colIdx] = cellValue === 1 ? 0 : 1;
                                                setRelMatrix(nextMatrix);
                                              }}
                                              style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "4px",
                                                fontSize: "0.75rem",
                                                fontWeight: 800,
                                                background: cellValue === 1 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.1)",
                                                border: cellValue === 1 ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(239, 68, 68, 0.25)",
                                                color: cellValue === 1 ? "#4ade80" : "#ef4444",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                              }}
                                            >
                                              {cellValue}
                                            </button>
                                          </td>
                                        );
                                      } else {
                                        return (
                                          <td key={colIdx} style={{ padding: "0.25rem", textAlign: "center" }}>
                                            <input
                                              type="number"
                                              min="1"
                                              max="5"
                                              value={cellValue}
                                              onChange={(e) => {
                                                const val = Math.min(5, Math.max(1, parseInt(e.target.value) || 4));
                                                const nextMatrix = [...relMatrix];
                                                if (!nextMatrix[rowIdx]) nextMatrix[rowIdx] = [];
                                                nextMatrix[rowIdx][colIdx] = val;
                                                setRelMatrix(nextMatrix);
                                              }}
                                              className="form-input"
                                              style={{
                                                width: "36px",
                                                height: "28px",
                                                padding: "0 0.2rem",
                                                textAlign: "center",
                                                fontSize: "0.75rem",
                                                borderRadius: "4px",
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                color: "#fff"
                                              }}
                                            />
                                          </td>
                                        );
                                      }
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Error Warning Box */}
                      {relResult === null && relStatusKey !== "" && relStatusKey.startsWith("error_") && (
                        <div style={{
                          marginTop: "1.25rem",
                          padding: "1rem",
                          background: "rgba(239, 68, 68, 0.06)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          borderRadius: "10px",
                          color: "#f87171",
                          fontSize: "0.82rem",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }} className="animate-fade-in">
                          <span style={{ fontSize: "1rem" }}>⚠️</span>
                          <span>
                            {relStatusKey === "error_variance" 
                              ? (i18n.language === "id" ? "Kesalahan Perhitungan: Varians total bernilai nol. Responden memberikan skor yang identik pada semua item." : "Calculation Error: Total score variance is zero. Respondents gave identical scores across all items.") 
                              : relStatusKey === "error_insufficient"
                              ? (i18n.language === "id" ? "Data Tidak Cukup: Diperlukan minimal 2 butir pertanyaan dan 2 responden untuk pengujian." : "Insufficient Data: A minimum of 2 items and 2 respondents are required for evaluation.")
                              : (i18n.language === "id" ? "Terjadi kesalahan dalam pengolahan data." : "An error occurred during data processing.")}
                          </span>
                        </div>
                      )}

                      {/* Result Display Box */}
                      {relResult !== null && (
                        <div style={{
                          marginTop: "1.25rem",
                          padding: "1rem",
                          background: "rgba(167, 139, 250, 0.04)",
                          border: "1px solid rgba(167, 139, 250, 0.15)",
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem"
                        }} className="animate-fade-in">
                          <div>
                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                              {t("wizard.reliabilityResult")}
                            </span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.2rem" }}>
                              <span style={{
                                fontSize: "1.8rem",
                                fontWeight: 800,
                                color: relResult >= 0.60 ? "#4ade80" : "#f87171",
                                fontFamily: "monospace",
                                textShadow: relResult >= 0.60 ? "0 0 10px rgba(74,222,128,0.2)" : "0 0 10px rgba(248,113,113,0.2)"
                              }}>
                                {relResult.toFixed(4)}
                              </span>
                              <span style={{
                                fontSize: "0.72rem",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "10px",
                                fontWeight: 700,
                                background: relResult >= 0.60 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                border: relResult >= 0.60 ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                                color: relResult >= 0.60 ? "#4ade80" : "#f87171"
                              }}>
                                {relResult >= 0.60 
                                  ? (i18n.language === "id" ? "RELIABEL" : "RELIABLE") 
                                  : (i18n.language === "id" ? "TIDAK RELIABEL" : "UNRELIABLE")}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", display: "block", marginTop: "0.25rem" }}>
                              <strong>{t("wizard.reliabilityStatus")}:</strong> {
                                relStatusKey === "excellent" ? (i18n.language === "id" ? "Sangat Tinggi (Excellent)" : "Excellent") :
                                relStatusKey === "good" ? (i18n.language === "id" ? "Tinggi (Good)" : "Good") :
                                relStatusKey === "acceptable" ? (i18n.language === "id" ? "Sedang (Acceptable)" : "Acceptable") :
                                relStatusKey === "minimum" ? (i18n.language === "id" ? "Cukup/Minimum (Acceptable)" : "Questionable / Minimum") :
                                (i18n.language === "id" ? "Rendah/Tidak Reliabel (Unreliable)" : "Unreliable")
                              }
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setIsReliabilityIntegrated(true);
                              triggerAlert(t("wizard.reliabilityIntegrated"), t("common.notification"), "success");
                            }}
                            className="btn btn-primary"
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.8rem",
                              background: isReliabilityIntegrated ? "rgba(34, 197, 94, 0.15)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                              border: isReliabilityIntegrated ? "1px solid #22c55e" : "none",
                              color: isReliabilityIntegrated ? "#4ade80" : "#fff",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              cursor: "pointer"
                            }}
                          >
                            {isReliabilityIntegrated ? "✓ Integrated" : `⚡ ${t("wizard.reliabilityIntegrateBtn")}`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Exporter & Completion controls */}
            {activeStep === 4 && (
              <div className="animate-fade-in" style={{ ...styles.stepForm, textAlign: "center", padding: "2rem" }}>
                <span style={{ fontSize: "4rem" }}>🎉</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0", color: "white" }}>
                  {i18n.language === "id" ? "Konfigurasi Metodologi Lengkap!" : "Methodology Structured!"}
                </h2>
                <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", maxWidth: "480px", margin: "0 auto 2.5rem auto" }}>
                  {i18n.language === "id" 
                    ? "Seluruh parameter ilmiah, ukuran sampel minimal, dan indikabel variabel Anda telah diintegrasikan secara akademis ke BAB III draf metodologi Anda." 
                    : "All scientific variables, calculations, and paradigms have been successfully integrated into your Chapter 3 academic thesis draft."}
                </p>

                <div style={styles.exportControlsRow}>
                  <button onClick={handleDownloadMd} className="btn btn-primary" style={styles.exportBtn}>
                    <IconFileDown size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t("preview.download")}
                  </button>
                  <button onClick={handleCopyMarkdown} className="btn btn-outline" style={styles.exportBtn}>
                    <IconCopy size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t("preview.copy")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Footer step actions */}
          <footer style={styles.middleFooter}>
            <button
              onClick={() => setActiveStep(activeStep - 1)}
              className="btn btn-outline"
              style={{
                ...styles.navBtn,
                visibility: activeStep > 1 ? "visible" : "hidden",
              }}
            >
              ← {t("common.back")}
            </button>
            
            <button
              onClick={() => {
                if (activeStep < 4) {
                  if (activeStep === 1) {
                    if (design === "Undetermined") {
                      setDesign(approach === "quant" ? "Experimental" : approach === "qual" ? "Case Study" : "Convergent Parallel");
                    }
                    setMaxUnlockedStep(prev => Math.max(prev, 2));
                    setActiveStep(2);
                  } else if (activeStep === 2) {
                    setMaxUnlockedStep(prev => Math.max(prev, 3));
                    setActiveStep(3);
                  } else if (activeStep === 3) {
                    if (variables.length === 0) {
                      triggerAlert(t("wizard.step3RequiredAlert"), t("common.notification"), "warning");
                      return;
                    }
                    setMaxUnlockedStep(prev => Math.max(prev, 4));
                    setActiveStep(4);
                  }
                } else {
                  handleSaveProgress();
                }
              }}
              className="btn btn-primary"
              style={styles.navBtn}
            >
              {activeStep < 4 ? (
                `${t("common.next")} →`
              ) : (
                <>
                  <IconSave size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                  {t("common.save")}
                </>
              )}
            </button>
          </footer>
        </section>

        {/* 3. RIGHT PANEL: Real-time Markdown Thesis Preview & Educational Content */}
        <section
          className="workspace-preview glass-panel"
          style={{
            ...styles.rightPanel,
            width: isMobile ? "100%" : "500px",
            minWidth: isMobile ? "100%" : "500px",
            maxWidth: isMobile ? "100%" : "500px",
            opacity: 1,
            visibility: "visible",
            padding: "0px",
            borderLeft: "1px solid hsl(var(--card-border))",
            position: (!mounted || window.innerWidth > 1200) ? "relative" : "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 95,
            height: "100%",
            transform: (!mounted || window.innerWidth > 1200) 
              ? "none" 
              : showPreview ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            display: (!mounted || window.innerWidth > 1200) 
              ? "flex" 
              : showPreview ? "flex" : "none",
          }}
        >
          {/* STATIC BASE PANEL: Educational Concept Explainer */}
          <div
            style={{
              padding: "1.5rem",
              height: "100%",
              overflowY: "auto",
              width: "100%",
            }}
          >
            {renderEducationalPanel()}
          </div>

          {/* SLIDING OVERLAY DRAWER: Chapter 3 Draft Preview */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: isMobile ? "100%" : "500px",
              height: "100%",
              backgroundColor: "hsl(var(--card-bg))",
              borderLeft: "1px solid hsl(var(--card-border))",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 10,
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: showPreview ? "translateX(0)" : "translateX(100%)",
              pointerEvents: showPreview ? "auto" : "none",
            }}
          >
            {/* Academic Draft Content */}
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div style={styles.rightHeader}>
                <div>
                  <h2 style={styles.rightTitleText}>{t("preview.title")}</h2>
                  <p style={styles.rightSubtitleText}>{t("preview.subtitle")}</p>
                </div>

                <div style={styles.draftLangBar}>
                  <button
                    onClick={() => setPreviewLang("en")}
                    style={{
                      ...styles.draftLangBtn,
                      ...(previewLang === "en" ? styles.draftLangBtnActive : {}),
                    }}
                  >
                    🇺🇸 EN
                  </button>
                  <button
                    onClick={() => setPreviewLang("id")}
                    style={{
                      ...styles.draftLangBtn,
                      ...(previewLang === "id" ? styles.draftLangBtnActive : {}),
                    }}
                  >
                    🇮🇩 ID
                  </button>
                </div>
              </div>

              <div style={styles.documentContainer}>
                <div style={styles.academicPaper} className="academic-sheet">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownToHtml(generateMarkdownDraft(previewLang)),
                    }}
                  />
                </div>
              </div>

              <div style={styles.rightFooter}>
                <button onClick={handleCopyMarkdown} className="btn btn-outline" style={styles.copyBtnRight}>
                  <IconCopy size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                  {t("preview.copy")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 <a href="https://repo.alexmaisa.my.id/alexmaisa" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}>Benny Maisa</a>. <a href="https://repo.alexmaisa.my.id/alexmaisa/archeres/src/branch/main/LICENSE" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}>Archeres is licensed under PolyForm Noncommercial 1.0.0</a>. <span className="footer-powered">Powered by Next.js, Go Fiber, & SQLite.</span>
        </p>
      </footer>

      {/* Premium Custom Alert Modal */}
      {alertOpen && (
        <div className="arche-modal-overlay animate-fade-in" onClick={() => setAlertOpen(false)}>
          <div
            className="arche-modal-card glass-panel"
            style={{ maxWidth: "420px", padding: "1.75rem", borderRadius: "12px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="arche-modal-header" style={{ marginBottom: "1rem" }}>
              <h2 className="arche-modal-title" style={{ fontSize: "1.25rem", color: alertType === "error" ? "hsl(var(--danger-color))" : alertType === "success" ? "hsl(var(--success-color))" : "#c084fc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {alertType === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ verticalAlign: "middle", color: "hsl(var(--success-color))" }}
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : alertType === "error" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ verticalAlign: "middle", color: "hsl(var(--danger-color))" }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ verticalAlign: "middle", color: "#c084fc" }}
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {alertTitle}
              </h2>
              <button onClick={() => setAlertOpen(false)} className="arche-modal-close">✕</button>
            </div>
            
            <div style={{ marginBottom: "1.5rem", lineHeight: "1.5", color: "rgba(255, 255, 255, 0.75)", fontSize: "0.9rem" }}>
              {alertMessage}
            </div>

            <div className="arche-modal-actions" style={{ marginTop: "0" }}>
              <button
                onClick={() => setAlertOpen(false)}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.65rem 1.25rem", fontSize: "0.88rem" }}
              >
                {t("common.understand") || "Got It"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Educational Popup Modal */}
      {eduPopupOpen && eduPopupItemId && eduPopupData && (
        <div className="arche-modal-overlay animate-fade-in" onClick={() => { setEduPopupOpen(false); setEduPopupItemId(null); }}>
          <div
            className="arche-modal-card glass-panel"
            style={{
              maxWidth: "760px",
              padding: "2rem",
              borderRadius: "16px",
              maxHeight: "85vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="arche-modal-header" style={{ marginBottom: "0", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#c084fc", background: "rgba(168, 85, 247, 0.12)", padding: "0.3rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                  {eduPopupData.badge}
                </span>
                <h2 className="arche-modal-title" style={{ fontSize: "1.45rem", marginTop: "0.6rem", color: "white", fontWeight: 800 }}>
                  {eduPopupData.title}
                </h2>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {/* Bilingual Language Switcher Inside Modal */}
                <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "2px", borderRadius: "8px", gap: "2px" }}>
                  <button
                    onClick={() => handleLanguageToggle("en")}
                    style={{
                      background: i18n.language === "en" ? "rgba(168, 85, 247, 0.25)" : "transparent",
                      border: "none",
                      color: i18n.language === "en" ? "#c084fc" : "rgba(255, 255, 255, 0.4)",
                      boxShadow: i18n.language === "en" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                      borderRadius: "6px",
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => handleLanguageToggle("id")}
                    style={{
                      background: i18n.language === "id" ? "rgba(168, 85, 247, 0.25)" : "transparent",
                      border: "none",
                      color: i18n.language === "id" ? "#c084fc" : "rgba(255, 255, 255, 0.4)",
                      boxShadow: i18n.language === "id" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                      borderRadius: "6px",
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    ID
                  </button>
                </div>

                <button
                  onClick={() => { setEduPopupOpen(false); setEduPopupItemId(null); }}
                  className="arche-modal-close"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    transition: "color 0.2s",
                    lineHeight: "1"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)"}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", color: "rgba(255, 255, 255, 0.85)" }}>
              {/* Definition */}
              <div>
                <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.8)" }}>
                  {eduPopupData.definition}
                </p>
              </div>

              {/* Key Characteristics */}
              {eduPopupData.characteristics.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.98rem", fontWeight: 700, color: "white", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    📋 {i18n.language === "id" ? "Karakteristik Utama" : "Key Characteristics"}
                  </h4>
                  <ul style={{ paddingLeft: "1.2rem", fontSize: "0.88rem", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "0.4rem", color: "rgba(255, 255, 255, 0.7)" }}>
                    {eduPopupData.characteristics.map((c, i) => (
                      <li key={i} style={{ listStyleType: "disc" }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Research Examples */}
              {eduPopupData.examples.length > 0 && (
                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "1.2rem", borderRadius: "12px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}>
                  <h4 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#38bdf8", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <IconBook size={16} />
                    {eduPopupItemId === "var_testing"
                      ? (i18n.language === "id" ? "📊 Penerapan & Interpretasi" : "📊 Application & Interpretation")
                      : (i18n.language === "id" ? "🔍 Contoh Penelitian" : "🔍 Research Example")}
                  </h4>
                  <ul style={{ paddingLeft: "1.2rem", fontSize: "0.88rem", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "0.5rem", color: "rgba(255, 255, 255, 0.75)" }}>
                    {eduPopupData.examples.map((ex, i) => (
                      <li key={i} style={{ listStyleType: "circle", fontStyle: "italic" }}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Academic Tips */}
              {eduPopupData.tips && (
                <div style={{ background: "rgba(168, 85, 247, 0.05)", border: "1px dashed rgba(168, 85, 247, 0.3)", padding: "1.2rem", borderRadius: "12px" }}>
                  <h4 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#fbbf24", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <IconLightbulb size={16} />
                    {i18n.language === "id" ? "💡 Tips Akademis" : "💡 Academic Tips"}
                  </h4>
                  <p style={{ fontSize: "0.85rem", lineHeight: "1.5", color: "rgba(255, 255, 255, 0.75)" }}>
                    {eduPopupData.tips}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  eduContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    height: "auto",
    paddingRight: "0.25rem",
  },
  eduBadge: {
    alignSelf: "flex-start",
    fontSize: "0.65rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "0.35rem 0.65rem",
    borderRadius: "6px",
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#38bdf8",
  },
  eduTitle: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "white",
    lineHeight: 1.3,
  },
  eduIntro: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 1.5,
  },
  eduCard: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "1rem",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    flexShrink: 0,
  },
  eduCardTitle: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "white",
  },
  eduCardBody: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight: 1.4,
  },
  eduTip: {
    background: "rgba(168, 85, 247, 0.05)",
    border: "1px dashed rgba(168, 85, 247, 0.35)",
    padding: "1rem",
    borderRadius: "10px",
    color: "#c084fc",
    flexShrink: 0,
  },
  container: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "hsl(var(--bg-color))",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  workspaceWrapper: {
    marginTop: "60px",
    marginBottom: "45px",
    height: "calc(100vh - 105px)",
    gridTemplateColumns: "300px 1fr 500px",
    width: "100vw",
    overflow: "hidden",
    transition: "grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  navControls: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  adminBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
  },
  dashBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    borderColor: "rgba(239, 68, 68, 0.2)",
    color: "#fca5a5",
    cursor: "pointer",
  },
  workspaceGrid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr 500px",
    height: "100vh",
    width: "100vw",
    backgroundColor: "hsl(var(--bg-color))",
    overflow: "hidden",
    position: "relative",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
    backgroundColor: "hsl(var(--bg-color))",
    color: "white",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255, 255, 255, 0.08)",
    borderTopColor: "hsl(var(--primary-color))",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  // 1. LEFT PANEL STYLES
  leftPanel: {
    padding: "2rem 1.5rem",
    borderTop: "none",
    borderLeft: "none",
    borderBottom: "none",
    borderRadius: "0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  leftHeader: {
    marginBottom: "2rem",
  },
  backLink: {
    background: "transparent",
    border: "none",
    color: "#a78bfa",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    marginBottom: "1rem",
    display: "block",
  },
  projectTitleText: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "white",
    lineHeight: 1.3,
    marginBottom: "0.25rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  projectSubtitleText: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  stepsNav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    flex: 1,
  },
  stepBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255, 255, 255, 0.01)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    color: "rgba(255, 255, 255, 0.5)",
    transition: "all 0.2s ease",
    position: "relative",
  },
  stepBtnActive: {
    background: "rgba(124, 58, 237, 0.08)",
    borderColor: "rgba(124, 58, 237, 0.4)",
    color: "white",
    boxShadow: "0 4px 20px rgba(124, 58, 237, 0.1)",
  },
  stepIcon: {
    fontSize: "1.25rem",
  },
  stepMeta: {
    display: "flex",
    flexDirection: "column",
  },
  stepNum: {
    fontSize: "0.65rem",
    textTransform: "uppercase",
    fontWeight: 800,
    color: "rgba(255,255,255,0.3)",
  },
  stepLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  stepCheck: {
    position: "absolute",
    right: "1rem",
    color: "#22c55e",
    fontWeight: 700,
  },
  leftFooter: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    paddingTop: "1.5rem",
  },
  langSwitchWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langBar: {
    display: "flex",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
    padding: "2px",
  },
  langBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.5)",
    padding: "0.25rem 0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 700,
    transition: "all 0.15s ease",
  },
  langBtnActive: {
    background: "rgba(124, 58, 237, 0.15)",
    color: "#c084fc",
  },
  // 2. MIDDLE PANEL STYLES
  middlePanel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
    padding: "2.5rem 3rem",
    borderRight: "1px solid rgba(255, 255, 255, 0.06)",
  },
  middleHeader: {
    marginBottom: "2rem",
  },
  middleStepIndicator: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    fontWeight: 800,
    color: "#a78bfa",
    letterSpacing: "0.05em",
  },
  middleStepTitle: {
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "white",
    marginTop: "0.25rem",
  },
  formContainer: {
    flex: 1,
  },
  stepForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  inputHelp: {
    fontSize: "0.82rem",
    color: "rgba(255, 255, 255, 0.45)",
    lineHeight: 1.4,
    marginTop: "0.25rem",
  },
  radioGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
    marginTop: "1rem",
  },
  radioCard: {
    background: "rgba(255, 255, 255, 0.01)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: "1.25rem",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    transition: "all 0.2s ease",
  },
  radioCardActive: {
    borderColor: "#38bdf8",
    background: "rgba(56, 189, 248, 0.03)",
  },
  radioTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "white",
  },
  radioDesc: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.45)",
  },
  selectInput: {
    marginTop: "0.5rem",
    padding: "0.75rem",
  },
  slidersCard: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  sliderGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.85)",
  },
  sliderVal: {
    fontSize: "0.9rem",
    fontWeight: 800,
    color: "#22d3ee",
  },
  rangeInput: {
    width: "100%",
    cursor: "pointer",
    accentColor: "#38bdf8",
  },
  sliderHelp: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.4)",
    lineHeight: 1.3,
  },
  selectInputSmall: {
    padding: "0.5rem",
    fontSize: "0.85rem",
  },
  calculatorOutput: {
    marginTop: "1.5rem",
    padding: "1.75rem",
    textAlign: "center",
    background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(6,182,212,0.06) 100%)",
    borderColor: "rgba(124,58,237,0.2)",
  },
  outputLabel: {
    fontSize: "0.85rem",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.05em",
    display: "block",
  },
  outputVal: {
    fontSize: "3.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "block",
    lineHeight: 1.1,
    margin: "0.5rem 0",
  },
  outputHelp: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.3,
  },
  varsHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addVarBtn: {
    padding: "0.4rem 0.8rem",
    fontSize: "0.8rem",
  },
  varsTable: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  varRow: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    padding: "0.75rem",
    borderWidth: "1px",
  },
  varInput: {
    flex: 1.5,
    padding: "0.5rem",
    fontSize: "0.85rem",
  },
  varSelect: {
    flex: 1,
    padding: "0.5rem",
    fontSize: "0.85rem",
  },
  varDelete: {
    background: "transparent",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "1.1rem",
    padding: "0 0.5rem",
  },
  adviceCard: {
    marginTop: "2rem",
    padding: "1.5rem",
    borderColor: "rgba(34,211,238,0.2)",
    background: "rgba(34,211,238,0.02)",
  },
  adviceLabel: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#22d3ee",
    display: "block",
    marginBottom: "0.25rem",
  },
  exportControlsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
  },
  exportBtn: {
    padding: "0.85rem 1.75rem",
    fontSize: "1rem",
    minWidth: "180px",
  },
  middleFooter: {
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    paddingTop: "1.5rem",
    marginTop: "2.5rem",
    display: "flex",
    justifyContent: "space-between",
  },
  navBtn: {
    padding: "0.6rem 1.25rem",
    fontSize: "0.9rem",
  },
  // 3. RIGHT PANEL STYLES
  rightPanel: {
    borderTop: "none",
    borderRight: "none",
    borderBottom: "none",
    borderRadius: "0",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  rightHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  rightTitleText: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "white",
  },
  rightSubtitleText: {
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.45)",
    marginTop: "0.1rem",
  },
  draftLangBar: {
    display: "flex",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "6px",
    padding: "2px",
    alignSelf: "center",
  },
  draftLangBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    padding: "0.25rem 0.4rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: 700,
    transition: "all 0.15s ease",
  },
  draftLangBtnActive: {
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
  },
  documentContainer: {
    flex: 1,
    padding: "2rem 1.5rem",
    overflowY: "auto",
    background: "rgba(3,7,18,0.3)",
  },
  academicPaper: {
    background: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "2.5rem 2rem",
    borderRadius: "4px",
    minHeight: "100%",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    fontFamily: "'Plus Jakarta Sans', serif",
    color: "rgba(255,255,255,0.9)",
  },
  rightFooter: {
    padding: "1.25rem 1.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    gap: "1rem",
  },
  copyBtnRight: {
    width: "100%",
    padding: "0.6rem",
    fontSize: "0.85rem",
  },
};
