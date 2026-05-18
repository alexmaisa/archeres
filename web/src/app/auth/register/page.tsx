"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";
import {
  generateSalt,
  generateMasterKey,
  generateRecoveryKey,
  deriveWrappingKey,
  wrapMasterKey,
} from "../../lib/crypto";

interface RegisterResponse {
  message?: string;
  emailWarning?: string;
  error?: string;
}

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, textKey: "auth.strengthEmpty", color: "#6b7280", width: "0%" };

  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) {
    return { score: 1, textKey: "auth.strengthWeak", color: "#f87171", width: "25%" };
  } else if (score === 2) {
    return { score: 2, textKey: "auth.strengthMedium", color: "#fb923c", width: "50%" };
  } else if (score === 3) {
    return { score: 3, textKey: "auth.strengthGood", color: "#38bdf8", width: "75%" };
  } else {
    return { score: 4, textKey: "auth.strengthStrong", color: "#4ade80", width: "100%" };
  }
};

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [registeredKey, setRegisteredKey] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const handleLanguageToggle = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      // --- E2EE Key Generation (client-side only, before API call) ---
      const salt = generateSalt();
      const recoveryKey = generateRecoveryKey();
      const mek = await generateMasterKey();

      const passwordWrappingKey = await deriveWrappingKey(password, salt);
      const recoveryWrappingKey = await deriveWrappingKey(recoveryKey, salt);

      const passwordVault = await wrapMasterKey(mek, passwordWrappingKey);
      const recoveryVault = await wrapMasterKey(mek, recoveryWrappingKey);
      // ----------------------------------------------------------------

      const res = await apiFetch<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          passwordVault,
          recoveryVault,
          vaultSalt: salt,
          recoveryKey,
        }),
      });

      if (res.emailWarning) {
        setSuccess(t("auth.successRegister") + " " + res.emailWarning);
      } else {
        setSuccess(t("auth.successRegisterWithEmail"));
      }

      setRegisteredKey(recoveryKey);
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

        {registeredKey ? (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h2 style={{ ...styles.formTitle, color: "#a78bfa", marginBottom: "0.2rem" }}>
              {i18n.language === "id" ? "Simpan Kunci Pemulihan Anda" : "Save Your Recovery Key"}
            </h2>
            <p style={{ ...styles.formDesc, fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
              {i18n.language === "id"
                ? "Akun Anda dilindungi dengan enkripsi Zero-Knowledge End-to-End. Kunci ini adalah satu-satunya cara memulihkan data penelitian Anda jika lupa kata sandi."
                : "Your account is protected with Zero-Knowledge End-to-End encryption. This key is the only way to recover your research data if you forget your password."}
            </p>

            <div style={{
              background: "rgba(167, 139, 250, 0.06)",
              border: "1px solid rgba(167, 139, 250, 0.25)",
              borderRadius: "10px",
              padding: "1rem",
              position: "relative",
              marginTop: "0.5rem"
            }}>
              <p style={{
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.4)",
                margin: "0 0 0.5rem 0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600
              }}>
                {i18n.language === "id" ? "KUNCI PEMULIHAN ZERO-KNOWLEDGE" : "ZERO-KNOWLEDGE RECOVERY KEY"}
              </p>
              <code style={{
                display: "block",
                color: "#c084fc",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
                lineHeight: 1.5
              }}>
                {registeredKey}
              </code>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(registeredKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn btn-outline"
                style={{ flex: 1, padding: "0.6rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#4ade80" style={{ width: "1rem", height: "1rem" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span style={{ color: "#4ade80" }}>{i18n.language === "id" ? "Tersalin!" : "Copied!"}</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1rem", height: "1rem" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.375c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125v1.5a1.125 1.125 0 01-1.125 1.125H7.875a1.125 1.125 0 01-1.125-1.125v-1.5z" />
                    </svg>
                    <span>{i18n.language === "id" ? "Salin Kunci" : "Copy Key"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([
                    `ARCHERES ZERO-KNOWLEDGE MASTER RECOVERY KEY\n`,
                    `Generated at: ${new Date().toISOString()}\n`,
                    `Email: ${email}\n\n`,
                    `Recovery Key:\n${registeredKey}\n\n`,
                    `IMPORTANT: Keep this key safe. If you lose your password and this key, your data cannot be recovered.`
                  ], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `archeres-recovery-key-${email}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="btn btn-outline"
                style={{ flex: 1, padding: "0.6rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1rem", height: "1rem" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>{i18n.language === "id" ? "Unduh File" : "Download Key"}</span>
              </button>
            </div>

            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "8px",
              padding: "0.85rem",
              marginTop: "0.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "0.4rem"
            }}>
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>⚠️</span>
              <p style={{ color: "#fca5a5", fontSize: "0.8rem", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                {i18n.language === "id"
                  ? "JANGAN BAGIKAN kunci ini kepada siapapun. Tim Archeres tidak menyimpan cadangannya dan tidak dapat merestorasinya."
                  : "NEVER share this key. Archeres team does not keep a backup and cannot restore it."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="btn btn-primary"
              style={{ marginTop: "1rem", padding: "0.75rem", fontSize: "0.95rem", fontWeight: 700 }}
            >
              {i18n.language === "id" ? "Kunci Disimpan, Lanjut Masuk" : "Key Saved, Proceed to Login"}
            </button>
          </div>
        ) : (
          <>
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
                  placeholder="enter your name here"
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
                  placeholder="e.g., username@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("auth.passwordLabel")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: "2.5rem" }}
                    placeholder="••••••••"
                    required
                    disabled={loading}
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
                {password && (
                  <div style={{ marginTop: "0.4rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                        {t("auth.strengthLabel")}:
                      </span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: getPasswordStrength(password).color }}>
                        {t(getPasswordStrength(password).textKey)}
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: getPasswordStrength(password).width, height: "100%", backgroundColor: getPasswordStrength(password).color, transition: "all 0.3s ease" }}></div>
                    </div>
                  </div>
                )}
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
                className="btn btn-outline"
                style={styles.toggleBtn}
                disabled={loading}
              >
                {t("auth.hasAccount")}
              </button>
            </div>
          </>
        )}
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
    marginBottom: "0.25rem",
    color: "rgba(255, 255, 255, 0.9)",
  },
  errorAlert: {
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "0.25rem",
  },
  successAlert: {
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "0.25rem",
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
