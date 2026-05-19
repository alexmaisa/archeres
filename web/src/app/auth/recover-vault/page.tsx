"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";
import { deriveWrappingKey, unwrapMasterKey, wrapMasterKey, generateSalt } from "../../lib/crypto";
import { storeMEK } from "../../lib/session";

interface RecoveryVaultResponse {
  recoveryVault: string;
  vaultSalt: string;
  message?: string;
  error?: string;
}

interface ResetVaultResponse {
  message?: string;
  error?: string;
}

function RecoverVaultContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const newPassword = searchParams.get("newPassword") || "";

  const [recoveryKey, setRecoveryKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryKey.trim()) {
      setError("Please enter your recovery key.");
      return;
    }
    if (!email || !newPassword) {
      setError("Session expired. Please start the password reset process again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Fetch the user's recovery vault from sessionStorage or backend
      let recoveryVault = sessionStorage.getItem("temp_recovery_vault");
      let vaultSalt = sessionStorage.getItem("temp_vault_salt");

      if (!recoveryVault || !vaultSalt) {
        const userData = await apiFetch<RecoveryVaultResponse>("/api/auth/me", {
          method: "GET",
        });
        recoveryVault = userData.recoveryVault;
        vaultSalt = userData.vaultSalt;
      }

      if (!recoveryVault || !vaultSalt) {
        setError("Vault data missing. Please try the password reset process again.");
        setLoading(false);
        return;
      }

      // 2. Derive wrapping key from recovery key + existing salt
      const recoveryWrappingKey = await deriveWrappingKey(recoveryKey.trim(), vaultSalt);

      // 3. Unwrap MEK using recovery vault
      let mek: CryptoKey;
      try {
        mek = await unwrapMasterKey(recoveryVault, recoveryWrappingKey);
      } catch {
        setError("Invalid recovery key. Please check and try again.");
        setLoading(false);
        return;
      }

      // 4. Generate new salt + re-wrap MEK with new password
      const newSalt = generateSalt();
      const newPasswordWrappingKey = await deriveWrappingKey(newPassword, newSalt);
      const newPasswordVault = await wrapMasterKey(mek, newPasswordWrappingKey);

      // 5. Update the password vault on the server
      await apiFetch<ResetVaultResponse>("/api/auth/reset-vault", {
        method: "POST",
        body: JSON.stringify({
          email,
          newPasswordVault,
          newVaultSalt: newSalt,
        }),
      });

      // 6. Clean up temporary sessionStorage vault data
      sessionStorage.removeItem("temp_recovery_vault");
      sessionStorage.removeItem("temp_vault_salt");

      // 7. Store MEK in session and redirect
      await storeMEK(mek);
      setSuccess(t("auth.recoverVaultSuccess"));
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.glowCircle1} />
      <div style={styles.glowCircle2} />

      {/* Language switcher */}
      <div className="auth-lang-bar">
        <button
          onClick={() => i18n.changeLanguage("en")}
          style={{ ...styles.langBtn, ...(i18n.language === "en" ? styles.langBtnActive : {}) }}
        >
          🇬🇧 EN
        </button>
        <button
          onClick={() => i18n.changeLanguage("id")}
          style={{ ...styles.langBtn, ...(i18n.language === "id" ? styles.langBtnActive : {}) }}
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
          <h2 style={styles.formTitle}>{t("auth.recoverVaultTitle")}</h2>
          <p style={styles.formDesc}>{t("auth.recoverVaultDesc")}</p>

          {error && <div style={styles.errorAlert} className="badge-danger">{error}</div>}
          {success && <div style={styles.successAlert} className="badge-success">{success}</div>}

          <div className="form-group">
            <label className="form-label">{t("auth.recoverVaultLabel")}</label>
            <textarea
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
              className="form-input"
              placeholder={t("auth.recoverVaultPlaceholder")}
              rows={3}
              style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }}
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
            {loading ? t("common.loading") : t("auth.recoverVaultSubmit")}
          </button>
        </form>

        <div style={styles.footer}>
          <button
            onClick={() => router.push("/auth/login")}
            className="btn btn-outline"
            style={styles.toggleBtn}
            disabled={loading}
          >
            {t("auth.backToLogin") || "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecoverVaultPage() {
  return (
    <Suspense fallback={<div style={{ color: "white", textAlign: "center", marginTop: "20vh" }}>Loading...</div>}>
      <RecoverVaultContent />
    </Suspense>
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
    maxWidth: "420px",
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
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "0.1rem",
    color: "rgba(255, 255, 255, 0.9)",
  },
  formDesc: {
    fontSize: "0.82rem",
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.5,
    marginBottom: "0.25rem",
  },
  errorAlert: {
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  successAlert: {
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.3)",
    color: "#34d399",
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
