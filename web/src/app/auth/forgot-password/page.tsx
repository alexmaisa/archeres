"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";

interface ForgotPasswordResponse {
  message: string;
  devToken?: string;
}

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [devToken, setDevToken] = useState<string>("");

  const handleLanguageToggle = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t("auth.invalidInput"));
      return;
    }

    setLoading(false);
    setError("");
    setSuccess("");
    setDevToken("");
    setLoading(true);

    try {
      const res = await apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setSuccess(res.message);
      if (res.devToken) {
        setDevToken(res.devToken);
      }
    } catch (err: any) {
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
          <h1 style={styles.logoText}>Archeres</h1>
          <p style={styles.subtitle}>{t("common.tagline")}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>{t("auth.forgotTitle")}</h2>
          <p style={styles.formDesc}>{t("auth.forgotDesc")}</p>

          {error && <div style={styles.errorAlert} className="badge-danger">{error}</div>}
          {success && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={styles.successAlert} className="badge-success">{success}</div>
              {devToken && (
                <div style={{
                  background: "rgba(167, 139, 250, 0.08)",
                  border: "1px solid rgba(167, 139, 250, 0.25)",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginTop: "0.5rem",
                  textAlign: "center"
                }} className="animate-pulse">
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", margin: "0 0 0.5rem 0", fontWeight: 700 }}>
                    🔧 [DEVELOPER RESET LINK]
                  </p>
                  <a
                    href={`/auth/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}
                    style={{ color: "#a78bfa", fontSize: "0.85rem", fontWeight: 700, textDecoration: "underline", wordBreak: "break-all" }}
                    id="dev-reset-link"
                  >
                    Click Here to Reset Password
                  </a>
                </div>
              )}
            </div>
          )}

          {!success && (
            <>
              <div className="form-group">
                <label className="form-label">{t("auth.emailLabel")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="e.g., username@example.com"
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
                {loading ? t("common.loading") : t("auth.forgotSubmit")}
              </button>
            </>
          )}
        </form>

        <div style={styles.footer}>
          <button
            onClick={() => router.push("/auth/login")}
            className="btn btn-outline"
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

const styles: Record<string, React.CSSProperties> = {
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
    maxWidth: "400px",
    padding: "1.75rem 2rem",
    zIndex: 5,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
  },
  header: {
    textAlign: "center",
    marginBottom: "1.25rem",
  },
  logoText: {
    fontSize: "2.25rem",
    fontWeight: 800,
    letterSpacing: "-0.05em",
    background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.25rem",
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 1.35,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
  },
  formTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    marginBottom: "0.1rem",
    color: "rgba(255, 255, 255, 0.9)",
  },
  formDesc: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight: 1.4,
    marginBottom: "0.5rem",
  },
  errorAlert: {
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "0.25rem",
  },
  successAlert: {
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: 600,
    lineHeight: 1.5,
    textAlign: "center",
  },
  submitBtn: {
    marginTop: "0.25rem",
    padding: "0.7rem",
    fontSize: "0.95rem",
  },
  footer: {
    marginTop: "1.25rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    paddingTop: "1rem",
    textAlign: "center",
  },
  toggleBtn: {
    width: "100%",
    padding: "0.6rem",
    fontSize: "0.85rem",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    cursor: "pointer",
    color: "rgba(255, 255, 255, 0.6)",
    transition: "all 0.2s ease",
  },
};
