"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../i18n";
import { 
  IconHelix, 
  IconChart, 
  IconFileDown, 
  IconShield, 
  IconRocket, 
  IconKey,
  IconBook
} from "../components/Icons";

interface CardItem {
  icon: string;
  title: string;
  desc: string;
}

interface StepItem {
  number: string;
  title: string;
  desc: string;
}

interface SymbolItem {
  char: string;
  meaning: string;
}

interface MathFormula {
  id: string;
  name: string;
  context: string;
  useCase: string;
  symbols: SymbolItem[];
}

interface ScaleAdvice {
  scale: string;
  tests: string;
  context: string;
}

interface ChapterSection {
  title: string;
  desc: string;
}

interface AboutContent {
  metaTitle: string;
  title: string;
  subtitle: string;
  howItWorksTitle: string;
  howItWorksSteps: StepItem[];
  featuresTitle: string;
  featuresList: CardItem[];
  mathSectionTitle: string;
  mathSectionDesc: string;
  mathLegendTitle: string;
  mathFormulas: MathFormula[];
  scaleSectionTitle: string;
  scaleSectionDesc: string;
  scaleAdvices: ScaleAdvice[];
  chapterSectionTitle: string;
  chapterSectionDesc: string;
  chapterSections: ChapterSection[];
  stackTitle: string;
  stackDesc: string;
  ctaBack: string;
  ctaRegister: string;
}

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth <= 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted) return null;

  const currentLang = i18n.language || "en";

  const content: Record<string, AboutContent> = {
    en: {
      metaTitle: "About Archeres | Scientific Paradigm Planner",
      title: "Scientific Precision, Simplified",
      subtitle: "Archeres is an academic methodology companion designed to empower beginner researchers in structuring sound, mathematically backed, and privacy-respecting studies.",
      howItWorksTitle: "How It Works",
      howItWorksSteps: [
        {
          number: "01",
          title: "Math Estimators Engine",
          desc: "Calculate precise sample sizes using established formulas (Slovin, Cochran, Lemeshow, Yamane, Daniel) with strict float precision ceiling rounding."
        },
        {
          number: "02",
          title: "Operational Variables",
          desc: "Define your study's conceptual variables into Stevens' taxonomy scale levels (Nominal, Ordinal, Interval, Ratio) to receive smart statistical test advice."
        },
        {
          number: "03",
          title: "Structured Draft Compilation",
          desc: "Convert your operational variables and sample calculations into a clean, peer-reviewed standard Chapter III methodology draft in Indonesian and English."
        }
      ],
      featuresTitle: "Core Platform Pillars",
      featuresList: [
        {
          icon: "key",
          title: "Zero-Knowledge Privacy",
          desc: "Your intellectual property belongs entirely to you. Draft calculations are encrypted locally on your browser before being persisted, keeping your thoughts safe."
        },
        {
          icon: "shield",
          title: "Privacy-Preserving Telemetry",
          desc: "We prioritize user privacy. Platform audit metrics log absolute login occurrence stamps entirely decoupled from individual user IDs or email accounts."
        },
        {
          icon: "helix",
          title: "High-Precision Calculus",
          desc: "No more math errors. The backend Go parser handles formulas with high precision, giving peer-reviewed mathematical certainty to thesis boards."
        },
        {
          icon: "book",
          title: "Scholarly Pedagogy Module",
          desc: "Learn methodology concepts as you compile drafts. The app offers Stevens' scale definitions and dynamic formula guidance on every screen."
        }
      ],
      mathSectionTitle: "Mathematical Estimator Equations",
      mathSectionDesc: "Archeres performs real-time sampling size estimations using rigorous math models verified by senior academic examiners.",
      mathLegendTitle: "Symbols Legend",
      mathFormulas: [
        { 
          id: "slovin", 
          name: "Slovin Formula", 
          useCase: "Commonly used in social sciences for simple random sampling when the exact population size is known and finite. Best suited for basic survey research due to its mathematical simplicity.",
          context: "Used when N is known and you need a quick, highly generalizable estimation of n with a designated tolerance margin.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "N", meaning: "Total finite population size" },
            { char: "e", meaning: "Margin of error (e.g., 0.05 for 5%)" }
          ]
        },
        { 
          id: "cochran", 
          name: "Cochran Formula", 
          useCase: "Designed for infinite or extremely large populations where the total population size is unknown or hard to estimate. Ideal for broad demographic surveys.",
          context: "Used when the population size is practically infinite, leveraging a standardized critical confidence level.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "Z", meaning: "Standard normal deviation (typically 1.96 for 95% confidence)" },
            { char: "p", meaning: "Estimated proportion of attributes in population (default 0.5)" },
            { char: "q", meaning: "Inverse probability (1 - p)" },
            { char: "e", meaning: "Acceptable margin of error" }
          ]
        },
        { 
          id: "lemeshow", 
          name: "Lemeshow Equation", 
          useCase: "A specialized epidemiological formula developed by Stanley Lemeshow for clinical trials and healthcare studies where the total population is unknown but expected disease prevalence is anticipated.",
          context: "Used in clinical and medical settings with unknown population size to evaluate specific binary diagnostic attributes.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "Z", meaning: "Standard normal value (typically 1.96 for 95% confidence)" },
            { char: "P", meaning: "Anticipated population prevalence or expected proportion" },
            { char: "d", meaning: "Absolute precision limit required" }
          ]
        },
        { 
          id: "yamane", 
          name: "Yamane Formula", 
          useCase: "Introduced by Taro Yamane as an alternative for finite populations with a high degree of precision control. It calculates the necessary sample size based on total population size.",
          context: "A highly consistent and academically accepted estimator for finite, known administrative populations.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "N", meaning: "Total finite population size" },
            { char: "d", meaning: "Margin tolerance level of error" }
          ]
        },
        { 
          id: "daniel", 
          name: "Daniel Formula", 
          useCase: "Widely applied in medical diagnosis and prevalence research for assessing binary characteristics or characteristics of a specific subgroup.",
          context: "Determines the necessary sample size when studying the prevalence of specific diagnostic parameters.",
          symbols: [
            { char: "n", meaning: "Minimum sample size required" },
            { char: "Z", meaning: "Critical normal value based on confidence intervals" },
            { char: "P", meaning: "Anticipated population prevalence of the trait" },
            { char: "d", meaning: "Margin of precision desired" }
          ]
        }
      ],
      scaleSectionTitle: "Stevens' Scales & Statistical Advice",
      scaleSectionDesc: "Classifying study variables using Stevens' taxonomy of scales automatically triggers the appropriate statistical test recommendations.",
      scaleAdvices: [
        { scale: "Nominal & Ordinal Scales", tests: "Non-Parametric Tests", context: "Chi-Square, Wilcoxon, Mann-Whitney U, Spearman Rho correlation, and Kruskal-Wallis analysis." },
        { scale: "Interval & Ratio Scales", tests: "Parametric Tests", context: "Pearson Correlation, Independent/Paired t-Test, ANOVA, and Simple/Multiple Linear Regression models." }
      ],
      chapterSectionTitle: "Chapter III Thesis Blueprint Framework",
      chapterSectionDesc: "The generated Chapter 3 markdown draft is structured to conform strictly with international peer-reviewed thesis guidelines.",
      chapterSections: [
        { title: "Part A: Research Philosophy", desc: "Outlines the scientific paradigm, approach (quantitative/qualitative), and standard design rationale." },
        { title: "Part B: Variables Operationalization Matrix", desc: "A comprehensive table linking variables, conceptual definitions, operational indicators, and Stevens scales." },
        { title: "Part C: Population & Sampling Protocol", desc: "Documents the exact mathematical formula choice, variable parameters, and ceiling rounding justifications." },
        { title: "Part D: Statistical Hypothesis Strategy", desc: "Outlines the specific parametric or non-parametric test schedules chosen to verify the study's claims." }
      ],
      stackTitle: "Our Technology Stack",
      stackDesc: "Archeres is engineered with high-speed, lightweight components: Next.js App Router for dynamic glassmorphic rendering, Go Fiber for high-performance concurrent REST APIs, and SQLite with GORM for robust, isolated telemetry databases.",
      ctaBack: "Back to Home",
      ctaRegister: "Register Workspace"
    },
    id: {
      metaTitle: "Tentang Archeres | Asisten Perancangan Metodologi Penelitian",
      title: "Presisi Ilmiah, Dibuat Lebih Sederhana",
      subtitle: "Archeres adalah asisten perancangan metodologi akademik yang dirancang khusus untuk membantu peneliti pemula merumuskan rancangan penelitian yang valid, memiliki fondasi matematis yang kuat, serta menjamin privasi data secara mutlak.",
      howItWorksTitle: "Cara Kerja Platform",
      howItWorksSteps: [
        {
          number: "01",
          title: "Estimasi Ukuran Sampel yang Valid",
          desc: "Menentukan ukuran sampel minimal secara presisi menggunakan kalkulasi rumus ilmiah populer seperti Slovin, Lemeshow, Cochran, Yamane, dan Daniel dengan pembulatan ke atas secara otomatis."
        },
        {
          number: "02",
          title: "Operasionalisasi Variabel Penelitian",
          desc: "Memetakan variabel penelitian Anda ke dalam skala pengukuran Stevens (Nominal, Ordinal, Interval, atau Rasio) untuk mendapatkan rekomendasi uji statistik yang sesuai dengan konteks riset."
        },
        {
          number: "03",
          title: "Penyusunan Draf Metodologi Penelitian",
          desc: "Mengompilasi hasil kalkulasi sampel dan operasionalisasi variabel menjadi draf bab metodologi penelitian (BAB III) berstandar akademik dalam Bahasa Indonesia dan Inggris secara simultan."
        }
      ],
      featuresTitle: "Pilar Utama Keunggulan Platform",
      featuresList: [
        {
          icon: "key",
          title: "Kerahasiaan Draf (Zero-Knowledge)",
          desc: "Ide dan kekayaan intelektual Anda sepenuhnya terlindungi. Enkripsi data draf dilakukan secara lokal pada peramban Anda untuk mencegah potensi kebocoran gagasan ilmiah sebelum publikasi."
        },
        {
          icon: "shield",
          title: "Telemetri Sesi Tanpa Identitas",
          desc: "Jaminan privasi total melalui pencatatan telemetri aktivitas masuk secara agregat deret waktu (time-series), sepenuhnya terlepas dari identitas surel (email) atau ID unik pengguna."
        },
        {
          icon: "helix",
          title: "Kalkulasi Matematis Presisi Tinggi",
          desc: "Menghindari risiko kesalahan hitung manual. Mesin komputasi backend Go mengevaluasi rumus dengan pembulatan matematika yang ketat untuk menjamin validitas metodologi di hadapan dewan penguji."
        },
        {
          icon: "book",
          title: "Pusat Edukasi Metodologi Interaktif",
          desc: "Belajar secara aktif saat merancang draf penelitian. Pahami konsep dasar skala pengukuran Stevens, kegunaan setiap rumus sampel, serta konteks akademisnya langsung pada alur kerja Anda."
        }
      ],
      mathSectionTitle: "Formulasi Matematika Ukuran Sampel",
      mathSectionDesc: "Archeres melakukan estimasi ukuran sampel secara real-time menggunakan model matematika rigor yang teruji di hadapan penguji akademik.",
      mathLegendTitle: "Legenda Simbol",
      mathFormulas: [
        { 
          id: "slovin", 
          name: "Rumus Slovin", 
          useCase: "Paling sering digunakan dalam penelitian sosial untuk pengambilan sampel acak sederhana ketika ukuran populasi (N) diketahui secara pasti dan berjumlah terbatas (populasi terbatas). Sangat direkomendasikan karena kesederhanaan perhitungannya.",
          context: "Digunakan ketika total populasi (N) diketahui dan Anda membutuhkan estimasi ukuran sampel (n) secara cepat dengan tingkat batas kesalahan tertentu.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "N", meaning: "Ukuran total populasi penelitian" },
            { char: "e", meaning: "Margin toleransi kesalahan (misal: 0,05 untuk 5%)" }
          ]
        },
        { 
          id: "cochran", 
          name: "Rumus Cochran", 
          useCase: "Dirancang oleh ahli statistik William G. Cochran untuk pengambilan sampel pada populasi yang sangat besar atau tidak terbatas (tidak diketahui jumlah pastinya). Sangat ideal untuk survei demografi berskala luas.",
          context: "Digunakan ketika jumlah populasi dianggap tidak terbatas, memanfaatkan nilai deviasi standar normal kritis.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "Z", meaning: "Skor standar normal (biasanya 1,96 untuk tingkat kepercayaan 95%)" },
            { char: "p", meaning: "Estimasi proporsi populasi dengan karakteristik tertentu (default 0,5)" },
            { char: "q", meaning: "Peluang kebalikan proporsi populasi (1 - p)" },
            { char: "e", meaning: "Margin toleransi kesalahan yang diterima" }
          ]
        },
        { 
          id: "lemeshow", 
          name: "Persamaan Lemeshow", 
          useCase: "Persamaan epidemiologi khusus yang dikembangkan oleh Stanley Lemeshow untuk uji klinis, kedokteran, dan bidang kesehatan umum ketika jumlah total populasi tidak diketahui namun estimasi prevalensi penyakit dapat diantisipasi.",
          context: "Digunakan dalam latar medis/klinis dengan populasi tak terbatas untuk mengevaluasi karakteristik diagnosis biner.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "Z", meaning: "Skor standar normal kritis (biasanya 1,96 pada tingkat kepercayaan 95%)" },
            { char: "P", meaning: "Ekspektasi proporsi atau tingkat prevalensi penyakit dalam populasi" },
            { char: "d", meaning: "Batas presisi kesalahan absolut yang diinginkan" }
          ]
        },
        { 
          id: "yamane", 
          name: "Rumus Yamane", 
          useCase: "Diperkenalkan oleh Taro Yamane sebagai alternatif matematis yang konsisten untuk populasi terbatas yang diketahui jumlahnya. Rumus ini menghitung ukuran sampel berdasarkan total populasi dan batas toleransi.",
          context: "Estimator yang sangat andal dan diterima secara luas di ranah akademis untuk populasi terbatas administratif.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "N", meaning: "Ukuran total populasi penelitian" },
            { char: "d", meaning: "Toleransi batas kesalahan kesalahan presisi" }
          ]
        },
        { 
          id: "daniel", 
          name: "Rumus Daniel", 
          useCase: "Banyak diterapkan dalam diagnosis medis dan penelitian klinis untuk menguji prevalensi karakteristik biner (seperti keberadaan penyakit atau gejala khusus) pada populasi target.",
          context: "Menentukan ukuran sampel ketika peneliti berfokus pada pengujian proporsi diagnosis pada populasi tak terbatas.",
          symbols: [
            { char: "n", meaning: "Jumlah sampel minimal yang dibutuhkan" },
            { char: "Z", meaning: "Nilai kritis normal berdasarkan rentang tingkat kepercayaan" },
            { char: "P", meaning: "Antisipasi nilai prevalensi/proporsi fenomena di populasi" },
            { char: "d", meaning: "Margin presisi kesalahan toleransi" }
          ]
        }
      ],
      scaleSectionTitle: "Skala Pengukuran Stevens & Arahan Uji Statistik",
      scaleSectionDesc: "Pengelompokan variabel berdasarkan taksonomi Stevens secara otomatis mengarahkan peneliti pada rekomendasi uji hipotesis yang valid.",
      scaleAdvices: [
        { scale: "Skala Nominal & Ordinal", tests: "Uji Non-Parametris", context: "Uji Chi-Square, Wilcoxon Sign-Rank, Mann-Whitney U, korelasi Spearman Rank, dan Kruskal-Wallis." },
        { scale: "Skala Interval & Rasio", tests: "Uji Parametris", context: "Korelasi Pearson Product-Moment, t-Test (Independen/Berpasangan), ANOVA, dan Regresi Linear Sederhana/Berganda." }
      ],
      chapterSectionTitle: "Kerangka Blueprint Dokumen BAB III",
      chapterSectionDesc: "Draf berkas markdown BAB III yang dihasilkan disusun secara sistematis agar selaras dengan pedoman penulisan karya ilmiah universitas.",
      chapterSections: [
        { title: "Bagian A: Pendekatan & Desain Penelitian", desc: "Menguraikan paradigma keilmuan yang dipilih (kuantitatif/kualitatif) serta alasan ilmiah di balik desain studi." },
        { title: "Bagian B: Matriks Operasionalisasi Variabel", desc: "Tabel komprehensif yang menghubungkan variabel, definisi konseptual, indikator operasional, dan skala pengukuran Stevens." },
        { title: "Bagian C: Protokol Populasi & Perhitungan Sampel", desc: "Mendokumentasikan alasan pemilihan rumus sampel, parameter yang diinput, serta argumen matematis pembulatan ke atas." },
        { title: "Bagian D: Rencana Pengujian Hipotesis Statistik", desc: "Menyusun jadwal pengujian hipotesis (parametris/non-parametris) untuk menjawab seluruh rumusan masalah penelitian." }
      ],
      stackTitle: "Fondasi Teknologi Berkinerja Tinggi",
      stackDesc: "Archeres dirancang menggunakan arsitektur modern berkecepatan tinggi: Next.js App Router untuk antarmuka glassmorphic yang responsif, Go Fiber untuk kinerja konkurensi API backend yang efisien, serta basis data SQLite terisolasi via GORM untuk keandalan penyimpanan telemetri secara lokal.",
      ctaBack: "Kembali ke Beranda",
      ctaRegister: "Mulai Susun Metodologi Sekarang"
    }
  };

  const copy = content[currentLang] || content["en"];

  const getIcon = (type: string): React.JSX.Element | null => {
    switch (type) {
      case "helix":
        return <IconHelix size={24} style={{ color: "#c084fc", strokeWidth: 2 }} />;
      case "chart":
        return <IconChart size={24} style={{ color: "#38bdf8", strokeWidth: 2 }} />;
      case "fileDown":
        return <IconFileDown size={24} style={{ color: "#22d3ee", strokeWidth: 2 }} />;
      case "shield":
        return <IconShield size={24} style={{ color: "#a78bfa", strokeWidth: 2 }} />;
      case "key":
        return <IconKey size={24} style={{ color: "#34d399", strokeWidth: 2 }} />;
      case "book":
        return <IconBook size={24} style={{ color: "#fb7185", strokeWidth: 2 }} />;
      default:
        return null;
    }
  };

  const renderMathFormula = (id: string) => {
    switch (id) {
      case "slovin":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>N</span>
              <span style={styles.denominator}>1 + N(e<sup>2</sup>)</span>
            </div>
          </div>
        );
      case "cochran":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>Z<sup>2</sup> &bull; p &bull; q</span>
              <span style={styles.denominator}>e<sup>2</sup></span>
            </div>
          </div>
        );
      case "lemeshow":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>Z<sup>2</sup> &bull; P(1 - P)</span>
              <span style={styles.denominator}>d<sup>2</sup></span>
            </div>
          </div>
        );
      case "yamane":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>N</span>
              <span style={styles.denominator}>1 + N(d<sup>2</sup>)</span>
            </div>
          </div>
        );
      case "daniel":
        return (
          <div style={styles.mathExpr}>
            <span>n = </span>
            <div style={styles.fraction}>
              <span style={styles.numerator}>Z<sup>2</sup> &bull; P(1 - P)</span>
              <span style={styles.denominator}>d<sup>2</sup></span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const mainContainerStyle: React.CSSProperties = {
    ...styles.mainContainer,
    flexDirection: "column",
    marginTop: "80px",
    marginBottom: "80px",
    padding: isMobile ? "1rem" : "2rem 1.5rem",
    gap: "3.5rem"
  };

  return (
    <div style={styles.landingContainer}>
      {/* Background Decorative Ambient Neon Orbs */}
      <div style={styles.orbPurple}></div>
      <div style={styles.orbCyan}></div>

      {/* Header */}
      <header className="fixed-header">
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          <IconHelix size={22} className="nav-brand-logo" style={{ strokeWidth: 2.5 }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
        </div>

        <div style={styles.navLinks}>
          <span
            onClick={() => router.push("/")}
            style={styles.navLink}
            className="hover-bright"
          >
            {currentLang === "id" ? "Beranda" : "Home"}
          </span>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.langBar}>
            <button
              onClick={() => i18n.changeLanguage("en")}
              style={{
                ...styles.langBtn,
                ...(currentLang === "en" ? styles.langBtnActive : {})
              }}
            >
              EN
            </button>
            <button
              onClick={() => i18n.changeLanguage("id")}
              style={{
                ...styles.langBtn,
                ...(currentLang === "id" ? styles.langBtnActive : {})
              }}
            >
              ID
            </button>
          </div>

          <button onClick={() => router.push("/auth/login")} style={styles.signInHeaderBtn}>
            {t("auth.submitLogin")}
          </button>
        </div>
      </header>

      {/* Main Body content */}
      <main style={mainContainerStyle} className="animate-fade-in">
        
        {/* Section 1: Hero title */}
        <section style={{ textAlign: "center", maxWidth: "800px", alignSelf: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h1 style={styles.heroTitle}>{copy.title}</h1>
          <p style={styles.heroSubtitle}>{copy.subtitle}</p>
        </section>

        {/* Section 2: How it works step by step visual flow */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.howItWorksTitle}</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            gap: "1.5rem",
            marginTop: "1.5rem"
          }}>
            {copy.howItWorksSteps.map((step, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "rgba(124,58,237,0.3)" }}>{step.number}</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>{step.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.45 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Core Features list */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.featuresTitle}</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "1.5rem",
            marginTop: "1.5rem"
          }}>
            {copy.featuresList.map((f, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "10px", flexShrink: 0 }}>
                  {getIcon(f.icon)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>{f.title}</h3>
                  <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EXPLORATIVE SECTION A: Mathematical formulas detail */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.mathSectionTitle}</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {copy.mathSectionDesc}
          </p>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem"
          }}>
            {copy.mathFormulas.map((f, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: "2rem", alignItems: "stretch" }}>
                
                {/* Left Side: Equation and Title */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 850, color: "white", fontFamily: "'Outfit', sans-serif" }}>{f.name}</h3>
                    </div>
                    <p style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                      {f.useCase}
                    </p>
                  </div>
                  
                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem 1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {renderMathFormula(f.id)}
                  </div>
                </div>

                {/* Right Side: Usage & Symbols Legend */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "12px" }}>
                  <div>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                      {currentLang === "id" ? "Konteks Penggunaan" : "Application Context"}
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>
                      {f.context}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                      {copy.mathLegendTitle}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {f.symbols.map((sym, sIdx) => (
                        <div key={sIdx} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#c084fc", fontFamily: "monospace", width: "20px", textAlign: "center", display: "inline-block" }}>
                            {sym.char}
                          </span>
                          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.35, flex: 1 }}>
                            {sym.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        </section>

        {/* EXPLORATIVE SECTION B: Scale measurement guidelines advice */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.scaleSectionTitle}</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {copy.scaleSectionDesc}
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "1.5rem"
          }}>
            {copy.scaleAdvices.map((sa, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: idx === 0 ? "3px solid #38bdf8" : "3px solid #34d399" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white" }}>{sa.scale}</h3>
                  <span style={{ fontSize: "0.75rem", color: idx === 0 ? "#38bdf8" : "#34d399", fontWeight: 700 }}>
                    {sa.tests}
                  </span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p style={{ fontSize: "0.85rem", color: "white", fontWeight: 600, lineHeight: 1.4 }}>
                    {sa.context}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EXPLORATIVE SECTION C: Generated chapters outline blueprint */}
        <section style={{ width: "100%", maxWidth: "1000px", alignSelf: "center" }}>
          <h2 style={styles.sectionHeader}>{copy.chapterSectionTitle}</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {copy.chapterSectionDesc}
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
            gap: "1.5rem"
          }}>
            {copy.chapterSections.map((ch, idx) => (
              <React.Fragment key={idx}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a78bfa" }}></div>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>{ch.title}</h3>
                </div>
                <div className="glass-panel" style={{ padding: "1rem 1.25rem", borderRadius: "12px", display: "flex", alignItems: "center" }}>
                  <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                    {ch.desc}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Section 4: Technology Stack info */}
        <section className="glass-panel" style={{ width: "100%", maxWidth: "1000px", alignSelf: "center", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white" }}>{copy.stackTitle}</h2>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{copy.stackDesc}</p>
        </section>

        {/* Section 5: Dynamic CTA buttons group */}
        <section style={{ display: "flex", gap: "1rem", justifyContent: "center", width: "100%" }}>
          <button 
            onClick={() => router.push("/")}
            className="btn btn-outline"
            style={{ padding: "0.75rem 1.75rem", fontSize: "0.9rem" }}
          >
            {copy.ctaBack}
          </button>
          <button 
            onClick={() => router.push("/auth/register")}
            className="btn btn-primary"
            style={{ padding: "0.75rem 1.75rem", fontSize: "0.9rem" }}
          >
            <IconRocket size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {copy.ctaRegister}
          </button>
        </section>

      </main>

      {/* Footer */}
      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 Benny Maisa. Archeres: Empowering beginner researchers to structure sound methodologies. Powered by Next.js, Go Fiber, & SQLite.
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  landingContainer: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "hsl(var(--bg-color))",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    overflowX: "hidden",
    padding: "0 2rem",
    boxSizing: "border-box"
  },
  mainContainer: {
    width: "100%",
    maxWidth: "1000px",
    display: "flex",
    zIndex: 10,
    position: "relative",
    boxSizing: "border-box"
  },
  orbPurple: {
    position: "absolute",
    top: "5%",
    left: "10%",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(70px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  orbCyan: {
    position: "absolute",
    bottom: "10%",
    right: "10%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(70px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  langBar: {
    display: "flex",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    padding: "2px",
  },
  langBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    padding: "0.25rem 0.55rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: 700,
    transition: "all 0.2s ease",
  },
  langBtnActive: {
    background: "rgba(124, 58, 237, 0.15)",
    color: "#c084fc",
  },
  signInHeaderBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.75)",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "color 0.2s ease",
  },
  navLinks: {
    display: "flex",
    gap: "1.5rem",
    marginRight: "auto",
    marginLeft: "2rem",
  },
  navLink: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: 900,
    fontFamily: "'Outfit', sans-serif",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    color: "white",
  },
  heroSubtitle: {
    fontSize: "1rem",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.5,
    maxWidth: "680px",
    margin: "0 auto"
  },
  sectionHeader: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "white",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: "0.5rem"
  },
  // Beautiful fraction style classes
  mathExpr: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#38bdf8",
    gap: "0.5rem"
  },
  fraction: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle"
  },
  numerator: {
    borderBottom: "1.5px solid rgba(255,255,255,0.35)",
    padding: "0 0.5rem 2px 0.5rem",
    textAlign: "center",
    fontSize: "1.1rem"
  },
  denominator: {
    padding: "2px 0.5rem 0 0.5rem",
    textAlign: "center",
    fontSize: "1.1rem"
  }
};
