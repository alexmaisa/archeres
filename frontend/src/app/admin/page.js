"use client";

import { useEffect, useState } from "react";
import { IconFolder, IconRefresh, IconUsers, IconHelix } from "../components/Icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tab controller (0: User Directory, 1: Projects Monitor)
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Authenticate session & enforce admin role-based route guard
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }
    const parsed = JSON.parse(savedUser);
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
      const data = await apiFetch("/api/admin/stats", { method: "GET" });
      setStats(data);
    } catch (err) {
      setError(err.message || t("common.errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (lang) => {
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
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      {/* Navigation Header */}
      <header style={styles.navbar} className="glass-panel">
        <div style={styles.navBrand}>
          <span style={styles.logoText}>Arche</span>
          <span style={styles.badge} className="badge-danger">Admin Hub</span>
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
      <main style={styles.mainContent}>
        <div style={styles.welcomeSection}>
          <div>
            <h1 style={styles.welcomeTitle}>{t("admin.title")}</h1>
            <p style={styles.welcomeSubtitle}>{t("admin.subtitle")}</p>
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
            <section style={styles.statsGrid}>
              <div className="glass-panel" style={styles.statCard}>
                <span style={styles.statLabel}>{t("admin.totalUsers")}</span>
                <span style={styles.statVal} style={{ color: "#a78bfa" }}>{stats.totalUsers}</span>
                <span style={styles.statSub}>Registered profiles</span>
              </div>
              <div className="glass-panel" style={styles.statCard}>
                <span style={styles.statLabel}>{t("admin.activeProjects")}</span>
                <span style={styles.statVal} style={{ color: "#38bdf8" }}>{stats.activeProjects}</span>
                <span style={styles.statSub}>Scientific study drafts</span>
              </div>
              <div className="glass-panel" style={styles.statCard}>
                <span style={styles.statLabel}>{t("admin.dbSize")}</span>
                <span style={styles.statVal} style={{ color: "#22d3ee" }}>{stats.dbSize}</span>
                <span style={styles.statSub}>SQLite physical storage</span>
              </div>
            </section>

            {/* Admin Hub Tab Controller */}
            <div style={styles.tabsBar}>
              <button
                onClick={() => setActiveTab(0)}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === 0 ? styles.tabBtnActive : {}),
                }}
              >
                <IconUsers size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {t("admin.userTitle")}
              </button>
              <button
                onClick={() => setActiveTab(1)}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === 1 ? styles.tabBtnActive : {}),
                }}
              >
                <IconHelix size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {t("admin.projTitle")}
              </button>
            </div>

            {/* TAB 0: User Directory */}
            {activeTab === 0 && (
              <div style={styles.tabContent} className="glass-panel animate-fade-in">
                {stats.users.length === 0 ? (
                  <p style={styles.emptyTableText}>{t("admin.noUsers")}</p>
                ) : (
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
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
                              <span
                                style={styles.roleTag}
                                className={u.role === "admin" ? "badge-danger" : "badge-primary"}
                              >
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
              <div style={styles.tabContent} className="glass-panel animate-fade-in">
                {stats.projects.length === 0 ? (
                  <p style={styles.emptyTableText}>{t("admin.noProjects")}</p>
                ) : (
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
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
                        {stats.projects.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td style={{ fontWeight: 700, color: "white" }}>{p.userName}</td>
                            <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.title}
                            </td>
                            <td>
                              <span style={styles.approachTag} className="badge-primary">
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
    </div>
  );
}

const styles = {
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
  glowCircle1: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "450px",
    height: "450px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, rgba(0,0,0,0) 70%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  glowCircle2: {
    position: "absolute",
    bottom: "10%",
    right: "-5%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, rgba(0,0,0,0) 70%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2.5rem",
    borderRadius: "0",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    zIndex: 10,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  logoText: {
    fontSize: "1.75rem",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    background: "linear-gradient(135deg, #f87171 0%, #38bdf8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  badge: {
    fontSize: "0.7rem",
    padding: "0.2rem 0.5rem",
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
  mainContent: {
    flex: 1,
    padding: "3rem 2.5rem",
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
    zIndex: 5,
  },
  welcomeSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2.5rem",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  welcomeTitle: {
    fontSize: "2.25rem",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: "0.25rem",
  },
  welcomeSubtitle: {
    fontSize: "0.95rem",
    color: "rgba(255, 255, 255, 0.6)",
  },
  refreshBtn: {
    padding: "0.6rem 1.25rem",
    fontSize: "0.88rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  },
  statCard: {
    padding: "1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  statLabel: {
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statVal: {
    fontSize: "2.75rem",
    fontWeight: 800,
    lineHeight: 1.1,
    margin: "0.25rem 0",
  },
  statSub: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.4)",
  },
  tabsBar: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: "0.75rem",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: "0.95rem",
    fontWeight: 700,
    padding: "0.5rem 1rem",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  tabBtnActive: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "white",
  },
  tabContent: {
    padding: "2rem",
    minHeight: "400px",
  },
  emptyTableText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    padding: "4rem 0",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.7)",
    "& th": {
      padding: "1rem",
      borderBottom: "2px solid rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.4)",
      fontWeight: 700,
      textTransform: "uppercase",
      fontSize: "0.75rem",
      letterSpacing: "0.05em",
    },
    "& td": {
      padding: "1rem",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
  },
  roleTag: {
    fontSize: "0.7rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    display: "inline-block",
  },
  approachTag: {
    fontSize: "0.7rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    display: "inline-block",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6rem 0",
    gap: "1rem",
  },
  spinner: {
    width: "40px",
    height: "40px",
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
};
