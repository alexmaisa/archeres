"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./i18n"; // register translation bundles

export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Set mounted flag to prevent React SSR hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentLang = i18n.language || "en";

  // Academic Localizations Dictionary
  const content = {
    en: {
      title: "The Scientific Paradigm Planner for Academic Research",
      subtitle: "Formulate mathematically sound sample sizes, operationalize conceptual indicators, and compile structured Chapter III thesis drafts instantaneously.",
      ctaStart: "Get Started Free",
      ctaLogin: "Access Workspace",
      featTitle: "Engineered for Scientific Precision",
      featSubtitle: "Empowering students and professional researchers with rigorous mathematical and methodological paradigms.",
      features: [
        {
          icon: "🧬",
          name: "Validated Math Estimators",
          desc: "Execute Cochran, Lemeshow, Daniel, Yamane, and Slovin calculations with strict float precision and ceiling rounding assertions."
        },
        {
          icon: "📊",
          name: "Variables Scale Planner",
          desc: "Map concepts into Nominal, Ordinal, Interval, or Ratio parameters, unlocking real-time Recommended Statistical Analysis Advice."
        },
        {
          icon: "📥",
          name: "Academic Draft Compiler",
          desc: "Generate complete, structured Chapter 3 methodology markdown files in both Indonesian and English concurrently."
        },
        {
          icon: "🛡️",
          name: "Role-Based Governance Shield",
          desc: "Strict administrative guards (RBAC) protecting backend telemetries, database sizes, and active studies counts."
        }
      ]
    },
    id: {
      title: "Perencana Paradigma Ilmiah untuk Penelitian Akademik",
      subtitle: "Rumuskan ukuran sampel minimal secara matematis, petakan skala indikator variabel konsep Anda, dan susun draf Bab III metodologi secara instan.",
      ctaStart: "Mulai Sekarang Gratis",
      ctaLogin: "Akses Workspace",
      featTitle: "Dirancang untuk Presisi Ilmiah",
      featSubtitle: "Membantu mahasiswa dan peneliti profesional merumuskan desain metodologi dengan metodologis yang ketat.",
      features: [
        {
          icon: "🧬",
          name: "Kalkulator Sampel Valid",
          desc: "Jalankan perhitungan Cochran, Lemeshow WHO finite, Daniel, Yamane, dan Slovin dengan presisi batas atas yang akurat."
        },
        {
          icon: "📊",
          name: "Rencana Skala Variabel",
          desc: "Petakan variabel penelitian ke dalam skala Nominal, Ordinal, Interval, atau Rasio beserta saran uji hipotesis (ANOVA, Regresi)."
        },
        {
          icon: "📥",
          name: "Penyusun Bab Metodologi",
          desc: "Susun draf Bab 3 metodologi riset secara instan dalam bahasa Indonesia dan Inggris secara simultan."
        },
        {
          icon: "🛡️",
          name: "Proteksi Kontrol Admin",
          desc: "Hak akses administrator otomatis bagi pendaftar pertama (first signup), lengkap dengan audit ukuran database SQLite."
        }
      ]
    }
  };

  const copy = content[currentLang] || content["en"];

  return (
    <div style={styles.landingContainer}>
      {/* Background Decorative Neon Orbs */}
      <div style={styles.orbPurple}></div>
      <div style={styles.orbCyan}></div>

      {/* 1. HEADER SECTION */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.brandLogo}>🧬</span>
          <span style={styles.brandName}>{t("common.appName")}</span>
        </div>

        <div style={styles.headerActions}>
          {/* Dynamic Language Switcher */}
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

      {/* 2. HERO SECTION */}
      <section style={styles.heroSection}>
        <span style={styles.badge}>🔬 PLATFORM v1.0 DELIVERED</span>
        <h1 style={styles.heroTitle}>{copy.title}</h1>
        <p style={styles.heroSubtitle}>{copy.subtitle}</p>

        <div style={styles.ctaButtonGroup}>
          <button onClick={() => router.push("/auth/register")} className="btn btn-primary" style={styles.primaryCta}>
            🚀 {copy.ctaStart}
          </button>
          <button onClick={() => router.push("/auth/login")} className="btn btn-outline" style={styles.secondaryCta}>
            🔑 {copy.ctaLogin}
          </button>
        </div>
      </section>

      {/* 3. FEATURE MATRIX */}
      <section style={styles.featureSection}>
        <div style={styles.featureHeader}>
          <h2 style={styles.featureSectionTitle}>{copy.featTitle}</h2>
          <p style={styles.featureSectionSubtitle}>{copy.featSubtitle}</p>
        </div>

        <div style={styles.featuresGrid}>
          {copy.features.map((f, i) => (
            <div key={i} style={styles.featureCard} className="glass-panel">
              <span style={styles.featureIcon}>{f.icon}</span>
              <h3 style={styles.featureName}>{f.name}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          &copy; {new Date().getFullYear()} {t("common.appName")} Inc. {t("common.tagline")}
        </p>
      </footer>
    </div>
  );
}

const styles = {
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
  },
  // Background Glows
  orbPurple: {
    position: "absolute",
    top: "10%",
    left: "15%",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(60px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  orbCyan: {
    position: "absolute",
    bottom: "20%",
    right: "15%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(60px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  // Header Style
  header: {
    width: "100%",
    maxWidth: "1200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.75rem 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    zIndex: 10,
    position: "relative",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  brandLogo: {
    fontSize: "1.5rem",
  },
  brandName: {
    fontSize: "1.5rem",
    fontWeight: 850,
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg, #ffffff 60%, #c084fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
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
    padding: "0.35rem 0.65rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.75rem",
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
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
    transition: "color 0.2s ease",
    ":hover": {
      color: "white",
    }
  },
  // Hero Styles
  heroSection: {
    width: "100%",
    maxWidth: "850px",
    textAlign: "center",
    padding: "7.5rem 0 5rem 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 10,
    position: "relative",
  },
  badge: {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#22d3ee",
    border: "1px solid rgba(34,211,238,0.25)",
    background: "rgba(34,211,238,0.04)",
    padding: "0.4rem 1rem",
    borderRadius: "50px",
    letterSpacing: "0.08em",
    marginBottom: "1.75rem",
    display: "inline-block",
  },
  heroTitle: {
    fontSize: "3.2rem",
    fontWeight: 900,
    fontFamily: "'Outfit', sans-serif",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    color: "white",
    marginBottom: "1.5rem",
  },
  heroSubtitle: {
    fontSize: "1.15rem",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.5,
    maxWidth: "680px",
    marginBottom: "3rem",
  },
  ctaButtonGroup: {
    display: "flex",
    gap: "1.25rem",
    width: "100%",
    justifyContent: "center",
  },
  primaryCta: {
    padding: "0.95rem 2.25rem",
    fontSize: "1.05rem",
    minWidth: "200px",
  },
  secondaryCta: {
    padding: "0.95rem 2.25rem",
    fontSize: "1.05rem",
    minWidth: "200px",
  },
  // Feature Matrix Section
  featureSection: {
    width: "100%",
    maxWidth: "1200px",
    padding: "5rem 0 8rem 0",
    zIndex: 10,
    position: "relative",
  },
  featureHeader: {
    textAlign: "center",
    marginBottom: "4rem",
  },
  featureSectionTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "white",
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: "-0.01em",
  },
  featureSectionSubtitle: {
    fontSize: "0.95rem",
    color: "rgba(255,255,255,0.45)",
    marginTop: "0.5rem",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.5rem",
  },
  featureCard: {
    padding: "2rem 1.75rem",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "transform 0.2s ease, border-color 0.2s ease",
    ":hover": {
      transform: "translateY(-4px)",
      borderColor: "rgba(124,58,237,0.3)",
    }
  },
  featureIcon: {
    fontSize: "2rem",
    display: "block",
    marginBottom: "0.25rem",
  },
  featureName: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "white",
  },
  featureDesc: {
    fontSize: "0.88rem",
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.45,
  },
  // Footer
  footer: {
    width: "100%",
    maxWidth: "1200px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "2.5rem 0",
    textAlign: "center",
    zIndex: 10,
    marginTop: "auto",
  },
  footerText: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.35)",
  }
};
