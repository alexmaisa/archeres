"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";

interface ResetPasswordResponse {
  message: string;
}

export default function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [token, setToken] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("token") || "");
      setEmail(params.get("email") || "");
    }
  }, []);

  const handleLanguageToggle = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !email || !token) {
      setError(t("auth.invalidInput"));
      return;
    }

    setLoading(false);
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await apiFetch<ResetPasswordResponse>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      setSuccess(t("auth.resetSuccess"));
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
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
          <h2 style={styles.formTitle}>{t("auth.resetTitle")}</h2>
          <p style={styles.formDesc}>{t("auth.resetDesc")}</p>

          {error && <div style={styles.errorAlert} className="badge-danger">{error}</div>}
          {success && <div style={styles.successAlert} className="badge-success">{success}</div>}

          {!success && (
            <>
              <div className="form-group">
                <label className="form-label">{t("auth.newPasswordLabel")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: "2.5rem" }}
                    placeholder="••••••••"
                    required
                    disabled={loading || !token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "0.85rem",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255, 255, 255, 0.4)",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "color 0.2s ease"
                    }}
                    className="hover-white"
                    disabled={loading || !token}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1.1rem", height: "1.1rem" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1.1rem", height: "1.1rem" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={styles.submitBtn}
                disabled={loading || !token}
              >
                {loading ? t("common.loading") : t("auth.resetSubmit")}
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
