"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";
import { IconHelix, IconMath, IconChart, IconFileDown, IconPlus, IconSave, IconCopy } from "../../components/Icons";

export default function WorkspaceClient() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Wizard active step (1: Paradigm, 2: Sample Size, 3: Variables, 4: Export)
  const [activeStep, setActiveStep] = useState(1);

  // Wizard states
  const [approach, setApproach] = useState("quant");
  const [design, setDesign] = useState("Experimental");
  const [formula, setFormula] = useState("slovin");
  const [popSize, setPopSize] = useState(1000);
  const [confLevel, setConfLevel] = useState(0.95);
  const [marginError, setMarginError] = useState(0.05);
  const [proportion, setProportion] = useState(0.5);
  const [variables, setVariables] = useState([
    { name: "X1 - Social Media Exposure", role: "Independent (Cause)", scale: "Interval (Ordered, Equal Distances)" },
    { name: "Y - Teen self-esteem score", role: "Dependent (Effect)", scale: "Ratio (Ordered, True Zero Point)" }
  ]);
  const [analysisMethod, setAnalysisMethod] = useState("Multiple Linear Regression");
  
  // Real-time calculated sample size
  const [sampleSize, setSampleSize] = useState(286);
  // Preview draft language ('id' or 'en')
  const [previewLang, setPreviewLang] = useState("id");

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
      const data = await apiFetch(`/api/projects/${projectId}`, { method: "GET" });
      setProject(data);
      
      // Load saved research design wizard state if present
      if (data.researchDesign) {
        const rd = data.researchDesign;
        if (rd.approach) setApproach(rd.approach);
        if (rd.designType) setDesign(rd.designType);
        if (rd.formula) setFormula(rd.formula);
        if (rd.populationSize) setPopSize(rd.populationSize);
        if (rd.confidenceLevel) setConfLevel(rd.confidenceLevel);
        if (rd.marginOfError) setMarginError(rd.marginOfError);
        if (rd.estimatedProportion) setProportion(rd.estimatedProportion);
        if (rd.analysisMethod) setAnalysisMethod(rd.analysisMethod);
        if (rd.variablesJson) {
          try {
            setVariables(JSON.parse(rd.variablesJson));
          } catch (e) {
            // Keep default
          }
        }
      }
    } catch (err) {
      alert(err.message || t("common.errorOccurred"));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
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

  const handleRemoveVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleVariableChange = (index, field, value) => {
    const updated = [...variables];
    updated[index][field] = value;
    setVariables(updated);

    // Auto-update analytical recommendations based on variable properties!
    generateAnalyticalAdvice(updated);
  };

  const generateAnalyticalAdvice = (vars) => {
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
    setSaveLoading(true);
    try {
      await apiFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          researchDesign: {
            approach,
            designType: design,
            formula,
            populationSize: Number(popSize),
            confidenceLevel: Number(confLevel),
            marginOfError: Number(marginError),
            estimatedProportion: Number(proportion),
            analysisMethod,
            variablesJson: JSON.stringify(variables),
            sampleSize: Number(sampleSize)
          }
        }),
      });
      alert(t("common.saved"));
    } catch (err) {
      alert(err.message || t("common.errorOccurred"));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadMd = () => {
    const markdown = generateMarkdownDraft(previewLang);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${project.title.replace(/\s+/g, "_")}_Bab_III.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownDraft(previewLang));
    alert(t("preview.copied"));
  };

  // Dynamic Markdown compiler
  const generateMarkdownDraft = (lang) => {
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

  const renderMarkdownToHtml = (md) => {
    let html = md
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

  if (loading || !project) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "1rem" }}>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div style={styles.workspaceGrid}>
      {/* 1. LEFT PANEL: Checklist & Navigation */}
      <aside style={styles.leftPanel} className="glass-panel">
        <div style={styles.leftHeader}>
          <button onClick={() => router.push("/dashboard")} style={styles.backLink}>
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
          {/* Centralized dynamic language switcher toggles entire UI */}
          <div style={styles.langSwitchWrap}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
              {t("common.language")}
            </span>
            <div style={styles.langBar}>
              <button
                onClick={() => i18n.changeLanguage("en")}
                style={{
                  ...styles.langBtn,
                  ...(i18n.language === "en" ? styles.langBtnActive : {}),
                }}
              >
                EN
              </button>
              <button
                onClick={() => i18n.changeLanguage("id")}
                style={{
                  ...styles.langBtn,
                  ...(i18n.language === "id" ? styles.langBtnActive : {}),
                }}
              >
                ID
              </button>
            </div>
          </div>

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
      <section style={styles.middlePanel}>
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
              <p style={styles.inputHelp} style={{ marginBottom: "1.5rem" }}>
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
            <div style={styles.stepForm} className="animate-fade-in" style={{ textAlign: "center", padding: "2rem" }}>
              <span style={{ fontSize: "4rem" }}>🎉</span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0", color: "white" }}>
                {i18n.language === "id" ? "Konfigurasi Metodologi Lengkap!" : "Methodology Structured!"}
              </h2>
              <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", maxWidth: "480px", margin: "0 auto 2.5rem auto" }}>
                {i18n.language === "id" 
                  ? "Seluruh parameter ilmiah, ukuran sampel minimal, dan indikabel variabel Anda telah diintegrasikan secara akademis ke Bab III draf metodologi Anda." 
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
            className="btn-outline"
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

      {/* 3. RIGHT PANEL: Real-time Markdown Thesis Preview */}
      <section style={styles.rightPanel} className="glass-panel">
        <div style={styles.rightHeader}>
          <div>
            <h2 style={styles.rightTitleText}>{t("preview.title")}</h2>
            <p style={styles.rightSubtitleText}>{t("preview.subtitle")}</p>
          </div>

          {/* Localized draft switcher: toggle translation of the academic draft itself! */}
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

        {/* Academic document display frame */}
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
          <button onClick={handleCopyMarkdown} className="btn-outline" style={styles.copyBtnRight}>
            <IconCopy size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {t("preview.copy")}
          </button>
        </div>
      </section>
    </div>
  );
}

const styles = {
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
    border: "1px solid rgba(255, 255, 255, 0.05)",
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
    border: "1px solid rgba(255, 255, 255, 0.05)",
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
