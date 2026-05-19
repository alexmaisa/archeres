"use client";
 
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./i18n"; // register translation bundles
import { 
  IconHelix, 
  IconChart, 
  IconFileDown, 
  IconShield, 
  IconRocket, 
  IconKey,
  IconBook
} from "./components/Icons";
 
interface Feature {
  icon: string;
  name: string;
  desc: string;
}
 
interface LanguageContent {
  title: string;
  subtitle: string;
  ctaStart: string;
  ctaLogin: string;
  features: Feature[];
}
 
export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
 
  // Monitor screen resize for bulletproof responsive viewports
  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth <= 768);

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setIsLoggedIn(true);
        }
      } catch (e) {}
    }
 
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
 
  if (!mounted) return null;
 
  const currentLang = i18n.language || "en";
 
  // Academic Localizations Dictionary
  const content: Record<string, LanguageContent> = {
    en: {
      title: "The Scientific Paradigm Planner for Academic Research",
      subtitle: "Formulate mathematically sound sample sizes, operationalize conceptual indicators, and compile structured Chapter III thesis drafts instantaneously.",
      ctaStart: "Get Started Free",
      ctaLogin: "Access Workspace",
      features: [
        {
          icon: "helix",
          name: "Validated Math Estimators",
          desc: "Execute Cochran, Lemeshow, Daniel, Yamane, and Slovin calculations with strict float precision and ceiling rounding assertions."
        },
        {
          icon: "chart",
          name: "Variables Scale Planner",
          desc: "Map concepts into Nominal, Ordinal, Interval, or Ratio parameters, unlocking real-time Recommended Statistical Analysis Advice."
        },
        {
          icon: "fileDown",
          name: "Academic Draft Compiler",
          desc: "Generate complete, structured Chapter 3 methodology markdown files in both Indonesian and English concurrently."
        },
        {
          icon: "shield",
          name: "Anti-Spam Governance Shield",
          desc: "Armed with robust administrative controls and zero-dependency, privacy-first cryptographic SVG math captchas to block robotic spam sign-ups securely."
        },
        {
          icon: "key",
          name: "Zero-Knowledge E2EE",
          desc: "Your intellectual property, researcher identity, and thesis drafts are fully secured via client-side AES-GCM 256 End-to-End Encryption."
        },
        {
          icon: "book",
          name: "Scholarly Pedagogy Engine",
          desc: "Learn as you build with real-time academic methodology tutorials, Stevens' taxonomy guides, and formula context insights."
        }
      ]
    },
    id: {
      title: "Rancang Metodologi & BAB III Penelitian Anda Secara Ilmiah",
      subtitle: "Archeres membantu Anda menentukan ukuran sampel yang valid, memetakan skala variabel, dan menghasilkan draf BAB III (Metodologi Penelitian) yang siap pakai secara instan.",
      ctaStart: "Mulai Sekarang, Gratis",
      ctaLogin: "Masuk ke Workspace",
      features: [
        {
          icon: "helix",
          name: "Penghitung Ukuran Sampel",
          desc: "Hitung sampel minimal riset Anda secara akurat menggunakan rumus ilmiah populer seperti Slovin, Lemeshow, Cochran, dan Yamane."
        },
        {
          icon: "chart",
          name: "Pemetaan Variabel & Skala",
          desc: "Tentukan variabel Anda ke dalam skala Nominal, Ordinal, Interval, atau Rasio secara mudah, lengkap dengan rekomendasi uji statistik yang tepat."
        },
        {
          icon: "fileDown",
          name: "Penyusun Draf BAB III",
          desc: "Unduh hasil rancangan metodologi Anda menjadi draf BAB III berformat Markdown yang rapi dalam Bahasa Indonesia maupun Inggris sekaligus."
        },
        {
          icon: "shield",
          name: "Sistem Keamanan & Anti-Spam",
          desc: "Dilengkapi dashboard tata kelola administrator dan verifikasi captcha matematika SVG terenkripsi yang mandiri untuk mencegah spam tanpa pelacak."
        },
        {
          icon: "key",
          name: "Zero-Knowledge E2EE",
          desc: "Identitas peneliti, draf proposal, dan rancangan riset dilindungi enkripsi ujung-ke-ujung (E2EE) AES-GCM 256 secara langsung pada perangkat Anda."
        },
        {
          icon: "book",
          name: "Panduan Teoretis Interaktif",
          desc: "Belajar sambil menyusun draf. Pahami konsep metodologi, taksonomi variabel, dan logika pemilihan rumus secara langsung lewat modul tutorial interaktif."
        }
      ]
    }
  };
 
  const copy = content[currentLang] || content["en"];
 
  // Render SVG based on designated type key
  const getIcon = (type: string): React.JSX.Element | null => {
    switch (type) {
      case "helix":
        return <IconHelix size={32} style={{ color: "#c084fc", strokeWidth: 2 }} />;
      case "chart":
        return <IconChart size={32} style={{ color: "#38bdf8", strokeWidth: 2 }} />;
      case "fileDown":
        return <IconFileDown size={32} style={{ color: "#22d3ee", strokeWidth: 2 }} />;
      case "shield":
        return <IconShield size={32} style={{ color: "#a78bfa", strokeWidth: 2 }} />;
      case "key":
        return <IconKey size={32} style={{ color: "#34d399", strokeWidth: 2 }} />;
      case "book":
        return <IconBook size={32} style={{ color: "#fb7185", strokeWidth: 2 }} />;
      default:
        return null;
    }
  };
 
  // Layout calculations dynamically adapting based on screen layout type
  const containerStyle: React.CSSProperties = {
    ...styles.landingContainer,
    minHeight: "100vh",
    height: "auto",
    overflowY: "auto"
  };
 
  const mainContainerStyle: React.CSSProperties = {
    ...styles.mainContainer,
    flexDirection: isMobile ? "column" : "row",
    minHeight: isMobile ? "auto" : "calc(100vh - 140px)",
    height: "auto",
    marginTop: "80px",
    marginBottom: "60px",
    padding: "2rem 1rem",
    gap: isMobile ? "2.5rem" : "3.5rem"
  };
 
  const heroStyle: React.CSSProperties = {
    ...styles.heroSection,
    alignItems: isMobile ? "center" : "flex-start",
    textAlign: isMobile ? "center" : "left",
    maxWidth: isMobile ? "600px" : "500px",
    padding: isMobile ? "1rem 0" : "0"
  };
 
  const gridStyle: React.CSSProperties = {
    ...styles.featuresGrid,
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    maxWidth: isMobile ? "600px" : "620px"
  };

  const ctaButtonGroupStyle: React.CSSProperties = {
    ...styles.ctaButtonGroup,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    justifyContent: isMobile ? "center" : "flex-start",
    flexWrap: isMobile ? "wrap" : "nowrap",
    gap: "0.75rem",
  };
 
  const primaryCtaStyle: React.CSSProperties = {
    ...styles.primaryCta,
    padding: isMobile ? "0.75rem 1rem" : "0.75rem 1.75rem",
    fontSize: isMobile ? "0.85rem" : "0.95rem",
    width: isMobile ? "100%" : "auto",
    maxWidth: isMobile ? "100%" : "240px",
    whiteSpace: "nowrap",
    justifyContent: "center",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };
 
  const secondaryCtaStyle: React.CSSProperties = {
    ...styles.secondaryCta,
    padding: isMobile ? "0.75rem 1rem" : "0.75rem 1.75rem",
    fontSize: isMobile ? "0.85rem" : "0.95rem",
    width: isMobile ? "100%" : "auto",
    maxWidth: isMobile ? "100%" : "240px",
    whiteSpace: "nowrap",
    justifyContent: "center",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };

  const heroTitleStyle: React.CSSProperties = {
    ...styles.heroTitle,
    fontSize: isMobile ? "1.85rem" : "2.35rem",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    width: "100%"
  };

  const heroSubtitleStyle: React.CSSProperties = {
    ...styles.heroSubtitle,
    fontSize: isMobile ? "0.85rem" : "0.95rem",
    width: "100%",
    maxWidth: isMobile ? "100%" : "460px"
  };
 
  return (
    <div style={containerStyle}>
      {/* Background Decorative Neon Orbs */}
      <div style={styles.orbPurple}></div>
      <div style={styles.orbCyan}></div>
 
      {/* 1. COMPACT FIXED HEADER */}
      <header className="fixed-header">
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          <img src="/Archeres.svg" alt="Archeres Logo" className="nav-brand-logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
        </div>

        <div style={styles.navLinks}>
          <span
            onClick={() => router.push("/about")}
            style={styles.navLink}
            className="hover-bright"
          >
            {currentLang === "id" ? "Tentang" : "About"}
          </span>
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
 
          {isLoggedIn ? (
            <button 
              onClick={() => router.push("/user/dashboard")} 
              className="btn btn-primary" 
              style={{ 
                padding: isMobile ? "0.4rem 0.75rem" : "0.5rem 1rem", 
                fontSize: isMobile ? "0.75rem" : "0.85rem",
                whiteSpace: "nowrap"
              }}
            >
              {isMobile ? "Workspace" : (currentLang === "id" ? "Ke Workspace" : "Go to Workspace")}
            </button>
          ) : (
            <button onClick={() => router.push("/auth/login")} style={styles.signInHeaderBtn}>
              {t("auth.submitLogin")}
            </button>
          )}
        </div>
      </header>
 
      {/* 2. DYNAMIC SPLIT-SCREEN WORKSPACE CONTAINER */}
      <main style={mainContainerStyle}>
        {/* Left Side: Hero Information */}
        <section style={heroStyle}>
          <h1 style={heroTitleStyle}>{copy.title}</h1>
          <p style={heroSubtitleStyle}>{copy.subtitle}</p>
 
          <div style={ctaButtonGroupStyle}>
            {isLoggedIn ? (
              <button 
                onClick={() => router.push("/user/dashboard")} 
                className="btn btn-primary" 
                style={primaryCtaStyle}
              >
                <IconRocket size={16} strokeWidth={2.5} stroke="white" />
                {currentLang === "id" ? "Masuk ke Workspace Anda" : "Enter Your Workspace"}
              </button>
            ) : (
              <>
                <button 
                  onClick={() => router.push("/auth/register")} 
                  className="btn btn-primary" 
                  style={primaryCtaStyle}
                >
                  <IconRocket size={16} strokeWidth={2.5} stroke="white" />
                  {copy.ctaStart}
                </button>
                <button 
                  onClick={() => router.push("/auth/login")} 
                  className="btn btn-outline" 
                  style={secondaryCtaStyle}
                >
                  <IconKey size={16} strokeWidth={2.5} stroke="white" />
                  {copy.ctaLogin}
                </button>
              </>
            )}
          </div>
        </section>

        {/* Right Side: Features 2x2 Translucent Layout */}
        <section style={gridStyle}>
          {copy.features.map((f, i) => (
            <div key={i} style={styles.featureCard} className="glass-panel">
              <div style={styles.cardHeader}>
                {getIcon(f.icon)}
                <h3 style={styles.featureName}>{f.name}</h3>
              </div>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      {/* 3. COMPACT FIXED FOOTER */}
      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 <a href="https://repo.alexmaisa.my.id/alexmaisa" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}>Benny Maisa</a>. <a href="https://repo.alexmaisa.my.id/alexmaisa/archeres/src/branch/main/LICENSE" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}>Archeres is licensed under PolyForm Noncommercial 1.0.0</a>. <span className="footer-powered">Powered by Next.js, Go Fiber, & SQLite.</span>
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
};
