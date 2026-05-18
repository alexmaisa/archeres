"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../../api";
import { IconHelix, IconMath, IconChart, IconFileDown, IconPlus, IconSave, IconCopy, IconWrench, IconBook } from "../../../components/Icons";
import { User } from "../../../types";
import { getActiveSessionKey, encryptData, decryptData } from "../../../utils/crypto";

interface VariableDefinition {
  name: string;
  role: string;
  scale: string;
}

interface ResearchDesign {
  approach?: string;
  designType?: string;
  formula?: string;
  populationSize?: number;
  confidenceLevel?: number;
  marginOfError?: number;
  estimatedProportion?: number;
  analysisMethod?: string;
  variablesJson?: string;
  sampleSize?: number;
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
  const params = useParams();
  const projectId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Wizard active step (1: Paradigm, 2: Sample Size, 3: Variables, 4: Export)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Wizard states
  const [approach, setApproach] = useState<string>("quant");
  const [design, setDesign] = useState<string>("Experimental");
  const [formula, setFormula] = useState<string>("slovin");
  const [popSize, setPopSize] = useState<number>(1000);
  const [confLevel, setConfLevel] = useState<number>(0.95);
  const [marginError, setMarginError] = useState<number>(0.05);
  const [proportion, setProportion] = useState<number>(0.5);
  const [variables, setVariables] = useState<VariableDefinition[]>([
    { name: "X1 - Social Media Exposure", role: "Independent (Cause)", scale: "Interval (Ordered, Equal Distances)" },
    { name: "Y - Teen self-esteem score", role: "Dependent (Effect)", scale: "Ratio (Ordered, True Zero Point)" }
  ]);
  const [analysisMethod, setAnalysisMethod] = useState<string>("Multiple Linear Regression");
  
  // Real-time calculated sample size
  const [sampleSize, setSampleSize] = useState<number>(286);
  // Preview draft language ('id' or 'en')
  const [previewLang, setPreviewLang] = useState<string>("id");
  // Toggle visibility of Right Preview Panel as a sliding drawer
  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    // Authenticate session locally
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }
    setUser(JSON.parse(savedUser));
    fetchProjectDetails();
  }, []);

  // Whenever calculation variables change, execute calculator client-side immediately!
  useEffect(() => {
    calculateSample();
  }, [formula, popSize, confLevel, marginError, proportion]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<WorkspaceProject>(`/api/projects/${projectId}`, { method: "GET" });
      const vaultKey = await getActiveSessionKey();
      
      if (vaultKey) {
        data.title = await decryptData(data.title, vaultKey);
        data.description = await decryptData(data.description, vaultKey);
        
        if (data.researchDesign) {
          const rd = data.researchDesign;
          if (rd.variablesJson) {
            rd.variablesJson = await decryptData(rd.variablesJson, vaultKey);
          }
          if (rd.analysisMethod) {
            rd.analysisMethod = await decryptData(rd.analysisMethod, vaultKey);
          }
          if (rd.approach) {
            rd.approach = await decryptData(rd.approach, vaultKey);
          }
          if (rd.designType) {
            rd.designType = await decryptData(rd.designType, vaultKey);
          }
        }
      }

      setProject(data);
      
      // Load saved research design wizard state if present
      if (data.researchDesign) {
        const rd = data.researchDesign;
        if (rd.approach) setApproach(rd.approach);
        if (rd.designType) setDesign(rd.designType);
        if (rd.formula) setFormula(rd.formula);
        if (rd.populationSize !== undefined) setPopSize(rd.populationSize);
        if (rd.confidenceLevel !== undefined) setConfLevel(rd.confidenceLevel);
        if (rd.marginOfError !== undefined) setMarginError(rd.marginOfError);
        if (rd.estimatedProportion !== undefined) setProportion(rd.estimatedProportion);
        if (rd.analysisMethod) setAnalysisMethod(rd.analysisMethod);
        if (rd.variablesJson) {
          try {
            setVariables(JSON.parse(rd.variablesJson));
          } catch (e) {
            // Keep default
          }
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
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const handleLanguageToggle = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // 6 Scientifically Validated Formulas client-side (matches Golang backend precision tests)
  const calculateSample = () => {
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

      default:
        n = N / (1 + N * (e * e));
    }

    // Mathematical scientific ceiling rounding
    const finalSize = Math.ceil(n);
    // Boundary check
    setSampleSize(finalSize > N ? N : finalSize < 1 ? 1 : finalSize);
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
      const vaultKey = await getActiveSessionKey();
      let payloadTitle = project.title;
      let payloadDesc = project.description;
      let payloadApproach = approach;
      let payloadDesign = design;
      let payloadAnalysis = analysisMethod;
      let payloadVariables = JSON.stringify(variables);

      if (vaultKey) {
        payloadTitle = await encryptData(payloadTitle, vaultKey);
        payloadDesc = await encryptData(payloadDesc, vaultKey);
        payloadApproach = await encryptData(payloadApproach, vaultKey);
        payloadDesign = await encryptData(payloadDesign, vaultKey);
        payloadAnalysis = await encryptData(payloadAnalysis, vaultKey);
        payloadVariables = await encryptData(payloadVariables, vaultKey);
      }

      await apiFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: payloadTitle,
          description: payloadDesc,
          researchDesign: {
            approach: payloadApproach,
            designType: payloadDesign,
            formula,
            populationSize: Number(popSize),
            confidenceLevel: Number(confLevel),
            marginOfError: Number(marginError),
            estimatedProportion: Number(proportion),
            analysisMethod: payloadAnalysis,
            variablesJson: payloadVariables,
            sampleSize: Number(sampleSize)
          }
        }),
      });
      alert(t("common.saved"));
    } catch (err: any) {
      alert(err.message || t("common.errorOccurred"));
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
    alert(t("preview.copied"));
  };

  // Dynamic Markdown compiler
  const generateMarkdownDraft = (lang: string) => {
    if (lang === "id") {
      return `# BAB III: METODOLOGI PENELITIAN

## 3.1 Pendekatan dan Desain Penelitian
Penelitian ini menggunakan pendekatan ilmiah **${approach === "quant" ? "Kuantitatif" : approach === "qual" ? "Kualitatif" : "Metode Campuran (Mixed)"}** dengan desain penelitian **${design}**. Kerangka kerja ini dipilih secara sistematis untuk menjawab rumusan masalah dengan mengumpulkan serta menganalisis data secara objektif.

## 3.2 Populasi dan Sampel
Populasi sasaran dalam penelitian ini didefinisikan sebesar **${popSize}** unit. Mengingat keterbatasan waktu, tenaga, dan finansial, penentuan ukuran sampel minimal dilakukan dengan menerapkan formula **${formula.toUpperCase()}**.
Parameter pengujian yang dikonfigurasi:
* Batas Toleransi Kesalahan ($e$ / $d$): **${marginError * 100}%**
* Tingkat Kepercayaan ($1-\\alpha$): **${confLevel * 100}%**
* Proporsi Atribut Estimasi ($p$): **${proportion}**

Berdasarkan rumus tersebut, diperoleh ukuran sampel minimal yang representatif sebanyak **${sampleSize}** subjek penelitian.

## 3.3 Variabel dan Indikator Penelitian
Variabel-variabel operasional yang dilibatkan dalam penelitian ini dikelompokkan berdasarkan peran metodologis beserta skala pengukuran statistiknya sebagai berikut:

| Indikator Variabel | Peran Metodologis | Skala Pengukuran |
| :--- | :--- | :--- |
${variables.map(v => `| ${v.name || "Unnamed"} | ${v.role} | ${v.scale} |`).join("\n")}

## 3.4 Rencana Analisis Data
Berdasarkan jenis variabel dan skala data yang telah dipetakan, hipotesis penelitian ini akan diuji menggunakan instrumen statistik inferensial:
* **${analysisMethod || "Statistik Deskriptif dan Inferensial"}**
`;
    } else {
      return `# CHAPTER III: RESEARCH METHODOLOGY

## 3.1 Research Approach and Design
This study adopts a **${approach === "quant" ? "Quantitative" : approach === "qual" ? "Quantitative (Survey)" : "Mixed Methods"}** research paradigm, utilizing an **${design}** research design framework. This framework is selected to systematically compile, analyze, and test data hypotheses.

## 3.2 Population and Sampling
The target population for this study is identified at **${popSize}** individuals. Due to resource constraints, the minimum statistically viable sample size is determined using the **${formula.toUpperCase()}** equation.
Configured testing parameters:
* Margin of Error ($e$): **${marginError * 100}%**
* Confidence Level ($1-\\alpha$): **${confLevel * 100}%**
* Estimated Attribute Proportion ($p$): **${proportion}**

Consequently, a calculated minimum sample size of **${sampleSize}** subjects is required to achieve high statistical power.

## 3.3 Research Variables and Measurement Scales
The research variables, along with their specific methodological roles and measurement scales, are mapped below:

| Variable Indicator | Methodological Role | Measurement Scale |
| :--- | :--- | :--- |
${variables.map(v => `| ${v.name || "Unnamed"} | ${v.role} | ${v.scale} |`).join("\n")}

## 3.4 Data Analysis Plan
Aligned with the scale of measurements and variable distributions, statistical hypothesis testing will be executed using:
* **${analysisMethod || "Descriptive and Inferential Statistics"}**
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

  const renderEducationalPanel = () => {
    const isId = i18n.language === "id";
    
    switch (activeStep) {
      case 1:
        return (
          <div className="animate-fade-in" style={styles.eduContainer}>
            <div style={styles.eduBadge}>📖 {isId ? "TUTORIAL: PARADIGMA PENELITIAN" : "TUTORIAL: RESEARCH PARADIGMS"}</div>
            <h3 style={styles.eduTitle}>{isId ? "Menentukan Pendekatan & Desain" : "Understanding Approach & Design"}</h3>
            <p style={styles.eduIntro}>
              {isId 
                ? "Langkah awal dalam merumuskan metodologi adalah menetapkan paradigma penelitian yang selaras dengan rumusan masalah serta tujuan ilmiah Anda." 
                : "The first step in methodology design is establishing the paradigm that aligns with your research questions and scientific objectives."}
            </p>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>📊 {isId ? "Pendekatan Kuantitatif" : "Quantitative Approach"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Menitikberatkan pada pengujian teori secara deduktif melalui pengukuran numerik, analisis statistik, dan pembuktian empiris yang objektif." 
                  : "Focuses on testing theories deductively using numerical measurements, statistical analysis, and objective evidence."}
              </p>
            </div>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>📝 {isId ? "Pendekatan Kualitatif" : "Qualitative Approach"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Mengeksplorasi makna deskriptif, pola naratif, serta pengalaman hidup manusia secara mendalam menggunakan logika induktif." 
                  : "Explores descriptive meanings, narrative patterns, human experiences, semi-structured interviews, and inductive analysis."}
              </p>
            </div>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>🔀 {isId ? "Metode Campuran (Mixed Methods)" : "Mixed Methods Approach"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Mengintegrasikan presisi data kuantitatif dan kedalaman narasi kualitatif secara sinergis untuk memecahkan masalah penelitian yang kompleks." 
                  : "Synergistically combines numerical precision and narrative depth to address multi-layered research problems."}
              </p>
            </div>
            
            <div style={styles.eduTip}>
              <strong>💡 {isId ? "Wawasan Akademis:" : "Academic Insight:"}</strong>
              <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", lineHeight: 1.4 }}>
                {isId 
                  ? "Gunakan pendekatan Kuantitatif untuk menggeneralisasi temuan pada populasi yang luas. Sebaliknya, pilih pendekatan Kualitatif untuk mendalami dinamika fenomena sosial secara kontekstual." 
                  : "Choose Quantitative to generalize findings across large cohorts. Choose Qualitative to explore social contexts deeply."}
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in" style={styles.eduContainer}>
            <div style={styles.eduBadge}>📖 {isId ? "TUTORIAL: PENENTUAN UKURAN SAMPEL" : "TUTORIAL: SAMPLE SIZE CALCULATION"}</div>
            <h3 style={styles.eduTitle}>{isId ? "Batasan Populasi & Validitas Statistik" : "Population Bounds & Statistical Power"}</h3>
            <p style={styles.eduIntro}>
              {isId 
                ? "Menghitung batas minimum subjek sampel yang valid secara matematis agar hasil penelitian Anda memenuhi syarat kepercayaan statistik." 
                : "Calculating the mathematically sound minimum subject size required for your study to attain valid statistical confidence."}
            </p>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>👥 {isId ? "Populasi Sasaran (N) vs. Sampel Penelitian (n)" : "Target Population (N) vs Sample (n)"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Populasi (N) mencakup keseluruhan subjek penelitian yang menjadi target generalisasi, sedangkan Sampel (n) adalah representasi sebagian populasi yang dipilih secara metodologis." 
                  : "Population (N) is the entire subject pool under study. Sample (n) is the scientifically chosen subgroup representing them."}
              </p>
            </div>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>📉 {isId ? "Toleransi Kesalahan (Margin of Error) & Tingkat Kepercayaan" : "Margin of Error (e) & Confidence Level"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Margin of Error (e) mencerminkan batas toleransi kesalahan estimasi (contoh: 5%). Tingkat Kepercayaan (Confidence Level) menunjukkan derajat keyakinan bahwa karakteristik sampel mencerminkan populasi (standar akademis adalah 95%)." 
                  : "Margin of error (e) represents allowable estimation error (e.g., 5%). Confidence level shows study certainty (academic standard is 95%)."}
              </p>
            </div>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>📐 {isId ? "Formulasi Matematis yang Sah" : "Validated Mathematical Formulas"}</h4>
              <p style={styles.eduCardBody}>
                {formula === "slovin" 
                  ? (isId 
                    ? "Formula Slovin: Diterapkan secara praktis ketika jumlah populasi (N) terukur secara pasti, namun proporsi karakteristik populasinya belum diketahui secara spesifik." 
                    : "Slovin Formula: Applied practically when population size (N) is finite and known, but attribute proportions are unknown.")
                  : (isId 
                    ? "Formula Lemeshow: Sangat ideal untuk populasi yang berukuran besar atau tidak terhingga (seperti pasien rumah sakit) dengan mengacu pada proporsi prevalensi tertentu." 
                    : "Lemeshow Formula: Highly suited for infinite or unknown population sizes (e.g., clinical trials) with estimated prevalence.")}
              </p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in" style={styles.eduContainer}>
            <div style={styles.eduBadge}>📖 {isId ? "TUTORIAL: OPERASIONALISASI VARIABEL" : "TUTORIAL: OPERATIONALIZING VARIABLES"}</div>
            <h3 style={styles.eduTitle}>{isId ? "Skala Pengukuran & Konstruk Variabel" : "Measurement Scales & Structural Roles"}</h3>
            <p style={styles.eduIntro}>
              {isId 
                ? "Merumuskan bagaimana indikator penelitian diidentifikasi, diukur, dan dihubungkan secara struktural untuk kebutuhan analisis data." 
                : "Defining how your research indicators are classified, measured, and structurally structured for data analysis."}
            </p>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>⛓️ {isId ? "Peran Metodologis Variabel" : "Methodological Roles"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Variabel Independen (stimulus) mempengaruhi variabel Dependen (respons). Mediator menjembatani mata rantai kausalitas, sementara Moderator memodifikasi kekuatan pengaruh hubungan tersebut." 
                  : "Independent (cause) influences Dependent (effect). Mediator bridges the causal chain, whereas Moderator alters relationship strength."}
              </p>
            </div>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>📏 {isId ? "Empat Tingkatan Skala Pengukuran (Taksonomi Stevens)" : "Four Measurement Scales"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Nominal (klasifikasi kategori tanpa tingkatan), Ordinal (memiliki peringkat/urutan), Interval (jarak antar nilai setara namun tanpa nilai nol mutlak), dan Rasio (skala pengukuran paling presisi karena memiliki nilai nol mutlak)." 
                  : "Nominal (Categorical), Ordinal (Ranked), Interval (Equal distances, no true zero), and Ratio (Absolute zero point)."}
              </p>
            </div>

            <div style={styles.eduTip}>
              <strong>📊 {isId ? "Rekomendasi Pengujian Statistik:" : "Recommended Statistical Test:"}</strong>
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
            <div style={styles.eduBadge}>📖 {isId ? "TUTORIAL: SISTEMATIKA METODOLOGI" : "TUTORIAL: METHODOLOGY SYSTEMATICS"}</div>
            <h3 style={styles.eduTitle}>{isId ? "Finalisasi Desain & Replikabilitas Riset" : "Finalizing Design & Replicability"}</h3>
            <p style={styles.eduIntro}>
              {isId 
                ? "Selamat! Draf akademik BAB III Anda kini telah tersusun secara sistematis dan siap diintegrasikan ke dalam naskah skripsi atau tesis Anda." 
                : "Congratulations! Your Chapter 3 academic draft is now structured and ready for inclusion in your thesis."}
            </p>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>🔁 {isId ? "Prinsip Replikabilitas Riset" : "Replicability Principle"}</h4>
              <p style={styles.eduCardBody}>
                {isId 
                  ? "Tujuan utama penulisan BAB III secara presisi dan ilmiah adalah memastikan langkah-langkah metodologi Anda diuraikan secara transparan agar peneliti masa depan dapat mereplikasi riset ini dengan hasil yang konsisten." 
                  : "The central goal of Chapter 3 is to state your procedures so clearly that any future researcher can duplicate your study easily."}
              </p>
            </div>

            <div style={styles.eduCard}>
              <h4 style={styles.eduCardTitle}>📁 {isId ? "Pilihan Ekspor Naskah" : "Export Options"}</h4>
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

  return (
    <div style={styles.container}>
      {/* Ambient decorative background glow circles */}
      <div className="glow-ambient-cyan"></div>
      <div className="glow-ambient-purple"></div>

      {/* Navigation Header */}
      <header className="fixed-header">
        <div className="nav-brand">
          <IconHelix size={22} className="nav-brand-logo" style={{ strokeWidth: 2.5 }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
          <span className="badge badge-primary">Workspace</span>
        </div>

        <div style={styles.navControls}>
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
      </header>

      {/* 3-Panel Workspace between Header & Footer */}
      <div
        className="workspace-layout"
        style={{
          ...styles.workspaceWrapper,
          gridTemplateColumns: "300px 1fr 500px",
          position: "relative",
        }}
      >
        {/* Drawer collapsible edge tab button - sits on the border, never clipped */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? (i18n.language === "id" ? "Tampilkan Penjelasan Edukasi" : "Show Educational Explanation") : (i18n.language === "id" ? "Tampilkan Draf BAB III" : "Show Chapter 3 Draft")}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            right: showPreview ? "487px" : "-1px",
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
        {/* 1. LEFT PANEL: Checklist & Navigation */}
        <aside className="workspace-sidebar glass-panel" style={styles.leftPanel}>
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
            ].map((s) => (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                style={{
                  ...styles.stepBtn,
                  ...(activeStep === s.step ? styles.stepBtnActive : {}),
                }}
              >
                <span style={styles.stepIcon}>{s.icon}</span>
                <div style={styles.stepMeta}>
                  <span style={styles.stepNum}>Step {s.step}</span>
                  <span style={styles.stepLabel}>{s.label}</span>
                </div>
                {activeStep > s.step && <span style={styles.stepCheck}>✓</span>}
              </button>
            ))}
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
          </div>
        </aside>

        {/* 2. MIDDLE PANEL: Interactive Forms & Calculators */}
        <section className="workspace-wizard" style={styles.middlePanel}>
          <div style={styles.middleHeader}>
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
                        onClick={() => setApproach(ap.id)}
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

            {/* STEP 2: Mathematical Sample Size Calculator */}
            {activeStep === 2 && (
              <div style={styles.stepForm} className="animate-fade-in">
                <div className="form-group">
                  <label className="form-label">{t("wizard.formulaLabel")}</label>
                  <p style={styles.inputHelp}>{t("wizard.formulaDesc")}</p>
                  <select
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    className="form-input"
                    style={styles.selectInput}
                  >
                    <option value="slovin">Slovin Formula (General finite populational)</option>
                    <option value="cochran">Cochran Formula (Infinite populations / proportion)</option>
                    <option value="lemeshow">Lemeshow WHO Formula (Finite correction for surveys)</option>
                    <option value="krejcie_morgan">Krejcie & Morgan Table (Scientific estimation)</option>
                    <option value="yamane">Yamane (Precision sampling limit)</option>
                    <option value="daniel">Daniel Formula (Bio-statistical/health attributes)</option>
                  </select>
                </div>

                {/* Dynamic Parameter Sliders */}
                <div style={styles.slidersCard} className="glass-panel">
                  {/* 1. Population Size N (for finite formulas) */}
                  {["slovin", "lemeshow", "krejcie_morgan", "yamane"].includes(formula) && (
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
                  {["cochran", "lemeshow", "krejcie_morgan", "daniel"].includes(formula) && (
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
                  <div style={styles.sliderGroup}>
                    <div style={styles.sliderHeader}>
                      <span style={styles.sliderLabel}>{t("wizard.marginLabel")}</span>
                      <span style={styles.sliderVal}>{(marginError * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.20"
                      step="0.005"
                      value={marginError}
                      onChange={(e) => setMarginError(Number(e.target.value))}
                      style={styles.rangeInput}
                    />
                    <p style={styles.sliderHelp}>{t("wizard.marginDesc")}</p>
                  </div>

                  {/* 4. Attribute Proportion p */}
                  {["cochran", "lemeshow", "krejcie_morgan", "daniel"].includes(formula) && (
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

                {/* Real-time Math Output box */}
                <div style={styles.calculatorOutput} className="glass-panel">
                  <span style={styles.outputLabel}>{t("wizard.sampleSizeResult")}</span>
                  <span style={styles.outputVal}>{sampleSize}</span>
                  <p style={styles.outputHelp}>{t("wizard.sampleSizeDesc")}</p>
                </div>
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
                  <input
                    type="text"
                    value={analysisMethod}
                    onChange={(e) => setAnalysisMethod(e.target.value)}
                    className="form-input"
                    style={{ marginTop: "1rem" }}
                    placeholder={t("wizard.analysisPlaceholder")}
                  />
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
                  setActiveStep(activeStep + 1);
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
            width: "500px",
            minWidth: "500px",
            maxWidth: "500px",
            opacity: 1,
            visibility: "visible",
            padding: "0px",
            borderLeft: "1px solid hsl(var(--card-border))",
            position: "relative",
            overflow: "hidden",
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
              width: "500px",
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
          &copy; 2026 Benny Maisa. Archeres: Empowering beginner researchers to structure sound methodologies. Powered by Next.js, Go Fiber, & SQLite.
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  eduContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    height: "100%",
    overflowY: "auto",
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
