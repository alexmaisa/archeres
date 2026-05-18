"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./i18n"; // register translation bundles

export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor screen resize for bulletproof responsive viewports
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

  // Academic Localizations Dictionary
  const content = {
    en: {
      title: "The Scientific Paradigm Planner for Academic Research",
      subtitle: "Formulate mathematically sound sample sizes, operationalize conceptual indicators, and compile structured Chapter III thesis drafts instantaneously.",
      ctaStart: "Get Started Free",
      ctaLogin: "Access Workspace",
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

  // Layout calculations dynamically adapting based on screen layout type
  const containerStyle = {
    ...styles.landingContainer,
    height: isMobile ? "auto" : "100vh",
    overflowY: isMobile ? "auto" : "hidden"
  };

  const mainContainerStyle = {
    ...styles.mainContainer,
    flexDirection: isMobile ? "column" : "row",
    height: isMobile ? "auto" : "calc(100vh - 105px)",
    marginTop: "60px",
    marginBottom: "45px",
    padding: isMobile ? "3rem 1rem" : "1.5rem 0",
    gap: isMobile ? "2.5rem" : "3.5rem"
  };

  const heroStyle = {
    ...styles.heroSection,
    alignItems: isMobile ? "center" : "flex-start",
    textAlign: isMobile ? "center" : "left",
    maxWidth: isMobile ? "600px" : "500px",
    padding: isMobile ? "1rem 0" : "0"
  };

  const gridStyle = {
    ...styles.featuresGrid,
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    maxWidth: isMobile ? "600px" : "620px"
  };

  return (
    <div style={containerStyle}>
      {/* Background Decorative Neon Orbs */}
      <div style={styles.orbPurple}></div>
      <div style={styles.orbCyan}></div>

      {/* 1. COMPACT FIXED HEADER */}
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

      {/* 2. DYNAMIC SPLIT-SCREEN WORKSPACE CONTAINER */}
      <main style={mainContainerStyle}>
        {/* Left Side: Hero Information */}
        <section style={heroStyle}>
          <span style={styles.badge}>🔬 PLATFORM v1.0 DELIVERED</span>
          <h1 style={styles.heroTitle}>{copy.title}</h1>
          <p style={styles.heroSubtitle}>{copy.subtitle}</p>

          <div style={styles.ctaButtonGroup}>
            <button 
              onClick={() => router.push("/auth/register")} 
              className="btn btn-primary" 
              style={styles.primaryCta}
            >
              🚀 {copy.ctaStart}
            </button>
            <button 
              onClick={() => router.push("/auth/login")} 
              className="btn btn-outline" 
              style={styles.secondaryCta}
            >
              🔑 {copy.ctaLogin}
            </button>
          </div>
        </section>

        {/* Right Side: Features 2x2 Translucent Layout */}
        <section style={gridStyle}>
          {copy.features.map((f, i) => (
            <div key={i} style={styles.featureCard} className="glass-panel">
              <div style={styles.cardHeader}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <h3 style={styles.featureName}>{f.name}</h3>
              </div>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      {/* 3. COMPACT FIXED FOOTER */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          &copy; 2026 Benny Maisa. Arche: Empowering beginner researchers to structure sound methodologies. Powered by Next.js, Go Fiber, & SQLite.
        </p>
      </footer>
    </div>
  );
}

const styles = {
  landingContainer: {
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
    maxWidth: "1200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    position: "relative",
    boxSizing: "border-box"
  },
  // Background Glows
  orbPurple: {
    position: "absolute",
    top: "10%",
    left: "15%",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(0,0,0,0) 70%)",
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
    background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(60px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  // Compact Fixed Header Style
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    background: "rgba(10, 10, 10, 0.75)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    zIndex: 100,
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  brandLogo: {
    fontSize: "1.3rem",
  },
  brandName: {
    fontSize: "1.3rem",
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
    ":hover": {
      color: "white",
    }
  },
  // Hero Styles
  heroSection: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
    zIndex: 10,
    position: "relative",
    boxSizing: "border-box"
  },
  badge: {
    fontSize: "0.7rem",
    fontWeight: 800,
    color: "#22d3ee",
    border: "1px solid rgba(34,211,238,0.2)",
    background: "rgba(34,211,238,0.03)",
    padding: "0.35rem 0.85rem",
    borderRadius: "50px",
    letterSpacing: "0.06em",
    marginBottom: "1rem",
    display: "inline-block",
  },
  heroTitle: {
    fontSize: "2.35rem",
    fontWeight: 900,
    fontFamily: "'Outfit', sans-serif",
    lineHeight: 1.18,
    letterSpacing: "-0.03em",
    color: "white",
    marginBottom: "1rem",
  },
  heroSubtitle: {
    fontSize: "0.95rem",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.45,
    marginBottom: "2rem",
    maxWidth: "460px"
  },
  ctaButtonGroup: {
    display: "flex",
    gap: "1rem",
    width: "100%",
  },
  primaryCta: {
    padding: "0.75rem 1.75rem",
    fontSize: "0.95rem",
    flex: 1,
    maxWidth: "200px"
  },
  secondaryCta: {
    padding: "0.75rem 1.75rem",
    fontSize: "0.95rem",
    flex: 1,
    maxWidth: "200px"
  },
  // Feature Matrix Section
  featuresGrid: {
    display: "grid",
    flex: 1.1,
    gap: "1rem",
    zIndex: 10,
    position: "relative",
    boxSizing: "border-box"
  },
  featureCard: {
    padding: "1.25rem",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    boxSizing: "border-box",
    transition: "transform 0.2s ease, border-color 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem"
  },
  featureIcon: {
    fontSize: "1.5rem",
    display: "block",
  },
  featureName: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "white",
  },
  featureDesc: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.35,
  },
  // Compact Fixed Footer Style
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45px",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 2rem",
    background: "rgba(10, 10, 10, 0.75)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    zIndex: 100,
    boxSizing: "border-box",
  },
  footerText: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    maxWidth: "1000px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  }
};
