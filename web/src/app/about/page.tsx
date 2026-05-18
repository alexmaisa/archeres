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

interface MathFormula {
  id: string;
  name: string;
  context: string;
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
      mathFormulas: [
        { id: "slovin", name: "Slovin Formula", context: "Ideal for basic research with known, finite populations under general margin of error." },
        { id: "cochran", name: "Cochran Formula", context: "Designed for infinite or extremely large populations where proportion parameters are estimated." },
        { id: "lemeshow", name: "Lemeshow Equation", context: "The standard for epidemiological, healthcare, and clinical studies with unknown population sizes." },
        { id: "yamane", name: "Yamane Formula", context: "A highly consistent estimator for finite populations based on rigorous confidence intervals." },
        { id: "daniel", name: "Daniel Formula", context: "Used for estimating binary prevalence stats with high confidence tolerance controls." }
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
      mathFormulas: [
        { id: "slovin", name: "Rumus Slovin", context: "Sangat ideal untuk penelitian umum dengan populasi terbatas yang diketahui ukuran pastinya." },
        { id: "cochran", name: "Rumus Cochran", context: "Dikhususkan bagi populasi besar tak terbatas dengan estimasi proporsi parameter tertentu." },
        { id: "lemeshow", name: "Persamaan Lemeshow", context: "Standar baku riset klinis, kedokteran, dan epidemiologi kesehatan dengan jumlah populasi tidak diketahui." },
        { id: "yamane", name: "Rumus Yamane", context: "Estimator konsisten untuk populasi terbatas dengan basis tingkat kepercayaan presisi tinggi." },
        { id: "daniel", name: "Rumus Daniel", context: "Digunakan untuk estimasi prevalensi biner pada studi diagnosis dengan toleransi margin terkendali." }
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
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "1.5rem"
          }}>
            {copy.mathFormulas.map((f, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>{f.name}</h3>
                  <span style={{ fontSize: "0.72rem", color: "#c084fc", background: "rgba(192,132,252,0.1)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontFamily: "monospace" }}>Formula</span>
                </div>
                <div style={{ background: "rgba(0,0,0,0.15)", padding: "1.25rem 0.75rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "center" }}>
                  {renderMathFormula(f.id)}
                </div>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                  {f.context}
                </p>
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
