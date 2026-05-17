"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLanguageToggle = (lang) => {
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError(t("auth.invalidInput"));
      return;
    }

    setLoading(false);
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      setSuccess(t("auth.successRegister"));
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (err) {
      setError(err.message || t("common.errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Background glowing ambient circles */}
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      {/* Language Switcher Bar */}
      <div style={styles.langBar}>
        <button
          onClick={() => handleLanguageToggle("en")}
          style={{
            ...styles.langBtn,
            ...(i18n.language === "en" ? styles.langBtnActive : {}),
          }}
        >
          🇬🇧 EN
        </button>
        <button
          onClick={() => handleLanguageToggle("id")}
          style={{
            ...styles.langBtn,
            ...(i18n.language === "id" ? styles.langBtnActive : {}),
          }}
        >
          🇮🇩 ID
        </button>
      </div>

      <div style={styles.card} className="glass-panel">
        <div style={styles.header}>
          <h1 style={styles.logoText}>Arche</h1>
          <p style={styles.subtitle}>{t("common.tagline")}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>{t("auth.registerTitle")}</h2>

          {error && <div style={styles.errorAlert} className="badge-danger">{error}</div>}
          {success && <div style={styles.successAlert} className="badge-success">{success}</div>}

          <div className="form-group">
            <label className="form-label">{t("auth.nameLabel")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="e.g., Prof. Alex Maisa"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("auth.emailLabel")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="e.g., researcher@arche.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("auth.passwordLabel")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? t("common.loading") : t("auth.submitRegister")}
          </button>
        </form>

        <div style={styles.footer}>
          <button
            onClick={() => router.push("/auth/login")}
            className="btn-outline"
            style={styles.toggleBtn}
            disabled={loading}
          >
            {t("auth.hasAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100vw",
    position: "relative",
    overflow: "hidden",
  },
  glowCircle1: {
    position: "absolute",
    top: "20%",
    left: "15%",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(0,0,0,0) 70%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  glowCircle2: {
    position: "absolute",
    bottom: "15%",
    right: "10%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  langBar: {
    position: "absolute",
    top: "1.5rem",
    right: "2rem",
    display: "flex",
    gap: "0.75rem",
    zIndex: 10,
  },
  langBtn: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.6)",
    padding: "0.4rem 0.8rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  langBtnActive: {
    background: "rgba(124, 58, 237, 0.15)",
    border: "1px solid rgba(124, 58, 237, 0.4)",
    color: "#c084fc",
    boxShadow: "0 0 10px rgba(124, 58, 237, 0.2)",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "2.5rem",
    zIndex: 5,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoText: {
    fontSize: "2.75rem",
    fontWeight: 800,
    letterSpacing: "-0.05em",
    background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 1.4,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  formTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
    color: "rgba(255, 255, 255, 0.9)",
  },
  errorAlert: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  successAlert: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  submitBtn: {
    marginTop: "0.5rem",
    padding: "0.85rem",
    fontSize: "1rem",
  },
  footer: {
    marginTop: "2rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    paddingTop: "1.5rem",
    textAlign: "center",
  },
  toggleBtn: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "0.9rem",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    cursor: "pointer",
    color: "rgba(255, 255, 255, 0.6)",
    transition: "all 0.2s ease",
  },
};
