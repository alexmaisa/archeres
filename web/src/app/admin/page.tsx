"use client";

import React, { useEffect, useState } from "react";
import { IconFolder, IconRefresh, IconUsers, IconHelix } from "../components/Icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";
import { User } from "../types";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  projectCount: number;
  createdAt: string;
}

interface AdminStatsState {
  totalUsers: number;
  totalProjects: number;
  newUsers24h: number;
  dbSizeBytes: number;
  serverUptimeSecs: number;
  allocatedRamMb: number;
  approachStats: {
    kuantitatif: number;
    kualitatif: number;
    metodeCampuran: number;
    [key: string]: number;
  };
  users: AdminUser[];
  projects: any[];
}

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStatsState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Interactive Maintenance states
  const [vacuuming, setVacuuming] = useState<boolean>(false);
  const [vacuumSuccess, setVacuumSuccess] = useState<boolean>(false);
  
  // Real-time server Uptime increments locally
  const [uptimeSecs, setUptimeSecs] = useState<number>(0);

  // Secure On-Demand Lookup states
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>("");

  useEffect(() => {
    if (stats && stats.serverUptimeSecs) {
      setUptimeSecs(stats.serverUptimeSecs);
    }
  }, [stats]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVacuum = async () => {
    if (vacuuming) return;
    setVacuuming(true);
    setVacuumSuccess(false);
    try {
      const res = await apiFetch<{ dbSizeBytes: number }>("/api/admin/db/vacuum", { method: "POST" });
      if (stats) {
        setStats({
          ...stats,
          dbSizeBytes: res.dbSizeBytes
        });
      }
      setVacuumSuccess(true);
      setTimeout(() => setVacuumSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Gagal merapikan SQLite Database.");
    } finally {
      setVacuuming(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const getApproachCount = (type: string) => {
    if (!stats || !stats.approachStats) return 0;
    return stats.approachStats[type] || 0;
  };

  const getVacuumButtonStyle = (success: boolean): React.CSSProperties => {
    return {
      ...styles.vacuumBtn,
      borderColor: success ? "#10b981" : "rgba(239, 68, 68, 0.25)",
      background: success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.1)",
      color: success ? "#a7f3d0" : "#fca5a5"
    };
  };

  useEffect(() => {
    // Authenticate session & enforce admin role-based route guard
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }
    const parsed = JSON.parse(savedUser) as User;
    if (parsed.role !== "admin") {
      router.push("/user/dashboard");
      return;
    }
    setUser(parsed);
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const statsData = await apiFetch<any>("/api/admin/stats", { method: "GET" });
      
      setStats({
        ...statsData,
        users: [],
        projects: [],
      });
    } catch (err: any) {
      setError(err.message || t("common.errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // Continue cleanup
    }
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const handleSecureLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);
    setActionSuccess("");
    try {
      const data = await apiFetch<any>(`/api/admin/user/lookup?email=${encodeURIComponent(searchEmail.trim())}`, { method: "GET" });
      setSearchResult(data);
    } catch (err: any) {
      setSearchError(err.message || t("admin.lookupNotFound"));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdateRole = async (targetEmail: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(t("admin.actionChangeRoleConfirm"))) return;
    
    setActionLoading(true);
    setActionSuccess("");
    try {
      const res = await apiFetch<any>("/api/admin/user/role", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, role: newRole })
      });
      if (searchResult && searchResult.email === targetEmail) {
        setSearchResult({ ...searchResult, role: newRole });
      }
      setActionSuccess(res.message || "Peran berhasil diperbarui.");
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui peran.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (targetEmail: string) => {
    if (!window.confirm(t("admin.actionDeleteConfirm"))) return;
    
    setActionLoading(true);
    setActionSuccess("");
    try {
      const res = await apiFetch<any>("/api/admin/user/delete", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail })
      });
      if (searchResult && searchResult.email === targetEmail) {
        setSearchResult(null);
      }
      // Refresh global statistics
      fetchAdminStats();
      setActionSuccess(res.message || "Akun berhasil dihapus.");
    } catch (err: any) {
      alert(err.message || "Gagal menghapus akun.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Background glowing ambient circles */}
      <div className="glow-ambient-red"></div>
      <div className="glow-ambient-purple"></div>

      {/* Navigation Header */}
      <header className="fixed-header">
        <div className="nav-brand">
          <IconHelix size={22} className="nav-brand-logo" style={{ strokeWidth: 2.5 }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
          <span className="badge badge-danger">Admin Hub</span>
        </div>

        <div style={styles.navControls}>
          <button
            onClick={() => router.push("/user/dashboard")}
            className="btn btn-outline"
            style={styles.dashBtn}
          >
            <IconFolder size={13} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {t("common.dashboard")}
          </button>

          {/* Language Switcher Bar */}
          <div style={styles.langBar}>
            <button
              onClick={() => handleLanguageToggle("en")}
              style={{
                ...styles.langBtn,
                ...(i18n.language === "en" ? styles.langBtnActive : {}),
              }}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageToggle("id")}
              style={{
                ...styles.langBtn,
                ...(i18n.language === "id" ? styles.langBtnActive : {}),
              }}
            >
              ID
            </button>
          </div>

          <button onClick={handleLogout} className="btn-outline" style={styles.logoutBtn}>
            {t("common.logout")}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-container">
        <div className="welcome-section">
          <div>
            <h1 className="welcome-title">{t("admin.title")}</h1>
            <p className="welcome-subtitle">{t("admin.subtitle")}</p>
          </div>
          <button onClick={fetchAdminStats} className="btn btn-outline" style={styles.refreshBtn}>
            <IconRefresh size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {i18n.language === "id" ? "Segarkan Data" : "Refresh Telemetry"}
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : error ? (
          <div style={styles.errorAlert} className="badge-danger">{error}</div>
        ) : !stats ? null : (
          <>
            {/* Global Admin Telemetry summary cards */}
            <section className="admin-telemetry-grid">
              {/* Card 1: Registered Researchers */}
              <div className="glass-panel telemetry-card">
                <span className="telemetry-label">{t("admin.totalUsers")}</span>
                <span className="telemetry-val" style={{ color: "#e11d48" }}>
                  {stats.totalUsers}
                </span>
                <span className="telemetry-sub">
                  <strong style={{ color: stats.newUsers24h > 0 ? "#10b981" : "rgba(255, 255, 255, 0.4)" }}>
                    +{stats.newUsers24h || 0}
                  </strong>{" "}
                  {t("admin.newUsers24h")}
                </span>
              </div>

              {/* Card 2: Active Projects */}
              <div className="glass-panel telemetry-card">
                <span className="telemetry-label">{t("admin.activeProjects")}</span>
                <span className="telemetry-val" style={{ color: "#38bdf8" }}>
                  {stats.totalProjects}
                </span>
                <span className="telemetry-sub">
                  {i18n.language === "id" ? "Draf metodologi aktif" : "Active methodology drafts"}
                </span>
              </div>

              {/* Card 3: SQLite Storage / Optimizer defragmenter */}
              <div className="glass-panel telemetry-card">
                <span className="telemetry-label">{t("admin.dbSize")}</span>
                <span className={`telemetry-val ${vacuumSuccess ? "animate-pulse" : ""}`} style={{ color: vacuumSuccess ? "#10b981" : "#22d3ee" }}>
                  {formatBytes(stats.dbSizeBytes)}
                </span>
                <div className="vacuum-action-area">
                  <button
                    onClick={handleVacuum}
                    disabled={vacuuming}
                    className="vacuum-btn"
                    style={getVacuumButtonStyle(vacuumSuccess)}
                  >
                    {vacuuming ? (
                      <>
                        <div className="spinner-mini"></div>
                        Vacuuming...
                      </>
                    ) : vacuumSuccess ? (
                      "Defragmented! ✓"
                    ) : (
                      "Optimize SQLite"
                    )}
                  </button>
                </div>
              </div>

              {/* Card 4: Go Server Telemetry with Uptime and Heartbeat */}
              <div className="glass-panel telemetry-card">
                <span className="telemetry-label">
                  Go Server Telemetry
                  <span className="heartbeat-dot" style={{ marginLeft: "8px" }}></span>
                </span>
                <span className="telemetry-val" style={{ color: "#a78bfa" }}>
                  {stats.allocatedRamMb ? stats.allocatedRamMb.toFixed(2) + " MB RAM" : "1.25 MB RAM"}
                </span>
                <span className="telemetry-sub">
                  Uptime: <strong style={{ color: "white" }}>{formatUptime(uptimeSecs)}</strong>
                </span>
              </div>

              {/* Card 5: Research Methodology Approach Distribution */}
              <div className="glass-panel telemetry-card">
                <span className="telemetry-label" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {i18n.language === "id" ? "Distribusi Pendekatan Riset" : "Research Approach Distribution"}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                      <span>Kuantitatif</span>
                      <strong style={{ color: "#38bdf8" }}>{getApproachCount("kuantitatif")}</strong>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: stats.totalProjects > 0 ? `${(getApproachCount("kuantitatif") / stats.totalProjects) * 100}%` : "0%",
                        background: "linear-gradient(90deg, #0284c7, #38bdf8)",
                        borderRadius: "3px",
                        transition: "width 1s ease"
                      }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                      <span>Kualitatif</span>
                      <strong style={{ color: "#a78bfa" }}>{getApproachCount("kualitatif")}</strong>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: stats.totalProjects > 0 ? `${(getApproachCount("kualitatif") / stats.totalProjects) * 100}%` : "0%",
                        background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                        borderRadius: "3px",
                        transition: "width 1s ease"
                      }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                      <span>Metode Campuran</span>
                      <strong style={{ color: "#f472b6" }}>{getApproachCount("metodeCampuran")}</strong>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: stats.totalProjects > 0 ? `${(getApproachCount("metodeCampuran") / stats.totalProjects) * 100}%` : "0%",
                        background: "linear-gradient(90deg, #db2777, #f472b6)",
                        borderRadius: "3px",
                        transition: "width 1s ease"
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Secure On-Demand Lookup Section */}
            <div className="glass-panel" style={{ padding: "1.75rem 2rem", marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "white" }}>{t("admin.secureLookupTitle")}</h2>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>{t("admin.secureLookupDesc")}</p>
              </div>

              <form onSubmit={handleSecureLookup} style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder={t("admin.lookupPlaceholder")}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    padding: "0.6rem 1rem",
                    color: "white",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                  className="focus-ring"
                  required
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="btn btn-primary"
                  style={{ padding: "0.6rem 1.5rem" }}
                >
                  {searchLoading ? "..." : t("admin.lookupBtn")}
                </button>
              </form>

              {searchError && (
                <div style={{ color: "#f87171", fontSize: "0.85rem", fontWeight: 600 }}>{searchError}</div>
              )}

              {actionSuccess && (
                <div style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: 600 }}>{actionSuccess}</div>
              )}

              {searchResult && (
                <div style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  marginTop: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem"
                }} className="animate-fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 700 }}>{t("admin.thName")}</div>
                      <div style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", marginTop: "0.15rem" }}>{searchResult.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 700 }}>{t("admin.thEmail")}</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", marginTop: "0.15rem" }}>{searchResult.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 700 }}>{t("admin.thRole")}</div>
                      <div style={{ marginTop: "0.25rem" }}>
                        <span className={`badge ${searchResult.role === "admin" ? "badge-danger" : "badge-primary"}`}>
                          {searchResult.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 700 }}>{t("admin.thProjects")}</div>
                      <div style={{ color: "#38bdf8", fontWeight: 800, fontSize: "1.1rem", marginTop: "0.15rem" }}>{searchResult.projectCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 700 }}>{t("admin.thRegistered")}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                        {new Date(searchResult.createdAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "0.75rem",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "1rem",
                    marginTop: "0.5rem"
                  }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateRole(searchResult.email, searchResult.role)}
                      className="btn btn-outline"
                      style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                    >
                      {t("admin.actionChangeRole")} ({searchResult.role === "admin" ? "USER" : "ADMIN"})
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleDeleteUser(searchResult.email)}
                      className="btn-outline"
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.5rem 1rem",
                        borderColor: "rgba(239, 68, 68, 0.2)",
                        color: "#fca5a5"
                      }}
                    >
                      {t("admin.actionDelete")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 Benny Maisa. Archeres: Empowering beginner researchers to structure sound methodologies. Powered by Next.js, Go Fiber, & SQLite.
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "hsl(var(--bg-color))",
    color: "hsl(var(--foreground-color))",
    position: "relative",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  navControls: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  dashBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
  },
  langBar: {
    display: "flex",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
    padding: "2px",
  },
  langBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.5)",
    padding: "0.3rem 0.6rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 700,
    transition: "all 0.15s ease",
  },
  langBtnActive: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#fca5a5",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    borderColor: "rgba(239, 68, 68, 0.2)",
    color: "#fca5a5",
  },
  refreshBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 0",
    gap: "1rem",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(255, 255, 255, 0.08)",
    borderTopColor: "hsl(var(--primary-color))",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorAlert: {
    padding: "1rem",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: 600,
  },
  vacuumBtn: {
    marginTop: "0.5rem",
    padding: "0.4rem 0.8rem",
    fontSize: "0.8rem",
    border: "1px solid",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};
