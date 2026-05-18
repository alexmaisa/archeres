"use client";

import React, { useEffect, useState } from "react";
import { IconFolder, IconRefresh, IconUsers, IconHelix } from "../components/Icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";
import { User } from "../types";

interface AdminProject {
  id: number;
  userName: string;
  title: string;
  approach: string;
  designType: string;
  formula: string;
  sampleSize: number;
  createdAt: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  projectCount: number;
  createdAt: string;
}

interface AdminStatsState {
  totalProjects: number;
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
  projects: AdminProject[];
}

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStatsState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  // Tab controller (0: User Directory, 1: Projects Monitor)
  const [activeTab, setActiveTab] = useState<number>(0);

  // Interactive Maintenance & Filter states
  const [vacuuming, setVacuuming] = useState<boolean>(false);
  const [vacuumSuccess, setVacuumSuccess] = useState<boolean>(false);
  const [approachFilter, setApproachFilter] = useState<string>("all");
  
  // Real-time server Uptime increments locally
  const [uptimeSecs, setUptimeSecs] = useState<number>(0);

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

  const handleApproachFilterClick = (filterType: string) => {
    setApproachFilter(filterType);
    setActiveTab(1); // Auto-focus master projects data grid
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

  const getApproachPillStyle = (type: string, isActive: boolean): React.CSSProperties => {
    let borderColor = "rgba(255, 255, 255, 0.08)";
    let color = "rgba(255, 255, 255, 0.5)";
    let background = "rgba(255, 255, 255, 0.02)";
    let fontWeight: "normal" | "bold" = "normal";

    if (isActive) {
      borderColor = "#38bdf8";
      color = "#38bdf8";
      background = "rgba(56, 189, 248, 0.15)";
      fontWeight = "bold";
    } else {
      if (type === "kuantitatif") borderColor = "rgba(56, 189, 248, 0.3)";
      if (type === "kualitatif") borderColor = "rgba(167, 139, 250, 0.3)";
      if (type === "metodeCampuran") borderColor = "rgba(244, 114, 182, 0.3)";
    }

    return {
      ...styles.approachPill,
      borderColor,
      color,
      background,
      fontWeight
    };
  };

  const getVacuumButtonStyle = (success: boolean): React.CSSProperties => {
    return {
      ...styles.vacuumBtn,
      borderColor: success ? "#10b981" : "rgba(239, 68, 68, 0.25)",
      background: success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.1)",
      color: success ? "#a7f3d0" : "#fca5a5"
    };
  };

  // Filter projects dynamically client-side
  const filteredProjects = stats && stats.projects ? stats.projects.filter((p) => {
    if (approachFilter === "all") return true;
    if (!p.approach) return false;
    
    const approachLower = p.approach.toLowerCase();
    if (approachFilter === "kuantitatif") return approachLower === "kuantitatif";
    if (approachFilter === "kualitatif") return approachLower === "kualitatif";
    if (approachFilter === "metodeCampuran") return approachLower === "metode campuran" || approachLower === "metodecampuran";
    return true;
  }) : [];

  useEffect(() => {
    // Authenticate session & enforce admin role-based route guard
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }
    const parsed = JSON.parse(savedUser) as User;
    if (parsed.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUser(parsed);
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const statsData = await apiFetch<any>("/api/admin/stats", { method: "GET" });
      const usersData = await apiFetch<AdminUser[]>("/api/admin/users", { method: "GET" });
      const projectsData = await apiFetch<any[]>("/api/admin/projects", { method: "GET" });
      
      setStats({
        ...statsData,
        users: usersData || [],
        projects: (projectsData || []).map((p) => ({
          id: p.id,
          userName: p.user ? p.user.name : "N/A",
          title: p.title,
          approach: p.researchDesign ? p.researchDesign.approach : "",
          designType: p.researchDesign ? p.researchDesign.designType : "",
          formula: p.researchDesign ? p.researchDesign.formulaType : "",
          sampleSize: p.researchDesign ? p.researchDesign.calculatedSample : 0,
          createdAt: p.createdAt,
        })),
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
      // Continue cleanup anyway
    }
    localStorage.removeItem("user");
    router.push("/auth/login");
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
            onClick={() => router.push("/dashboard")}
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
            <section className="telemetry-grid">
              {/* Card 1: Active Projects / Instant Filter */}
              <div className="glass-panel telemetry-card">
                <span className="telemetry-label">{t("admin.activeProjects")}</span>
                <span className="telemetry-val" style={{ color: "#38bdf8" }}>
                  {stats.totalProjects}
                </span>
                
                <div className="approach-pills-group">
                  <button
                    onClick={() => handleApproachFilterClick("all")}
                    className="approach-pill"
                    style={getApproachPillStyle("all", approachFilter === "all")}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => handleApproachFilterClick("kuantitatif")}
                    className="approach-pill"
                    style={getApproachPillStyle("kuantitatif", approachFilter === "kuantitatif")}
                  >
                    Quant ({getApproachCount("kuantitatif")})
                  </button>
                  <button
                    onClick={() => handleApproachFilterClick("kualitatif")}
                    className="approach-pill"
                    style={getApproachPillStyle("kualitatif", approachFilter === "kualitatif")}
                  >
                    Qual ({getApproachCount("kualitatif")})
                  </button>
                  <button
                    onClick={() => handleApproachFilterClick("metodeCampuran")}
                    className="approach-pill"
                    style={getApproachPillStyle("metodeCampuran", approachFilter === "metodeCampuran")}
                  >
                    Campuran ({getApproachCount("metodeCampuran")})
                  </button>
                </div>
              </div>

              {/* Card 2: SQLite Storage / Optimizer defragmenter */}
              <div className="glass-panel telemetry-card">
                <span className="telemetry-label">SQLite Storage</span>
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

              {/* Card 3: Go Server Telemetry with Uptime and Heartbeat */}
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
            </section>

            {/* Admin Hub Tab Controller */}
            <div className="tabs-bar">
              <button
                onClick={() => setActiveTab(0)}
                className={`tab-btn ${activeTab === 0 ? "active" : ""}`}
              >
                <IconUsers size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {t("admin.userTitle")}
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`tab-btn ${activeTab === 1 ? "active" : ""}`}
              >
                <IconHelix size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {t("admin.projTitle")}
              </button>
            </div>

            {/* TAB 0: User Directory */}
            {activeTab === 0 && (
              <div className="glass-panel tab-content animate-fade-in">
                {stats.users.length === 0 ? (
                  <p className="empty-table-text">{t("admin.noUsers")}</p>
                ) : (
                  <div className="arche-table-wrapper">
                    <table className="arche-table table-compact">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>{t("admin.thName")}</th>
                          <th>{t("admin.thEmail")}</th>
                          <th>{t("admin.thRole")}</th>
                          <th>{t("admin.thProjects")}</th>
                          <th>{t("admin.thRegistered")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td style={{ fontWeight: 700, color: "white" }}>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === "admin" ? "badge-danger" : "badge-primary"}`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: "#38bdf8" }}>{u.projectCount}</td>
                            <td>{new Date(u.createdAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Projects Monitor */}
            {activeTab === 1 && (
              <div className="glass-panel tab-content animate-fade-in">
                {stats.projects.length === 0 ? (
                  <p className="empty-table-text">{t("admin.noProjects")}</p>
                ) : (
                  <div className="arche-table-wrapper">
                    <table className="arche-table table-compact">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>{t("admin.thName")} (Author)</th>
                          <th>{t("dashboard.projectTitle")}</th>
                          <th>{t("admin.thApproach")}</th>
                          <th>{t("admin.thDesign")}</th>
                          <th>{t("admin.thFormula")}</th>
                          <th>{t("admin.thSample")}</th>
                          <th>{t("admin.thDate")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td style={{ fontWeight: 700, color: "white" }}>{p.userName}</td>
                            <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.title}
                            </td>
                            <td>
                              <span className="badge badge-primary">
                                {p.approach ? p.approach.toUpperCase() : "N/A"}
                              </span>
                            </td>
                            <td>{p.designType || "N/A"}</td>
                            <td style={{ fontFamily: "monospace", color: "#a78bfa" }}>
                              {p.formula ? p.formula.toUpperCase() : "N/A"}
                            </td>
                            <td style={{ fontWeight: 800, color: "#22d3ee" }}>
                              {p.sampleSize || "N/A"}
                            </td>
                            <td>{new Date(p.createdAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 Benny Maisa. Arche: Empowering beginner researchers to structure sound methodologies. Powered by Next.js, Go Fiber, & SQLite.
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
  }
};
