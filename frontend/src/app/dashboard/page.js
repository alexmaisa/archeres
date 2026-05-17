"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Authenticate session locally
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }
    setUser(JSON.parse(savedUser));
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/projects", { method: "GET" });
      setProjects(data || []);
    } catch (err) {
      setError(err.message || t("common.errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (lang) => {
    i18n.changeLanguage(lang);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setModalLoading(true);
    try {
      const newProj = await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
        }),
      });

      setNewTitle("");
      setNewDesc("");
      setShowModal(false);
      
      // Dynamic routing direct into workspace or reload
      router.push(`/project/${newProj.id}`);
    } catch (err) {
      alert(err.message || t("common.errorOccurred"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm(t("dashboard.deleteConfirm"))) return;

    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || t("common.errorOccurred"));
    }
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

  if (!user) return null;

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Background glowing ambient circles */}
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      {/* Navigation Header */}
      <header style={styles.navbar} className="glass-panel">
        <div style={styles.navBrand}>
          <span style={styles.logoText}>Arche</span>
          <span style={styles.badge} className="badge-primary">Workspace</span>
        </div>

        <div style={styles.navControls}>
          {user.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="btn btn-outline"
              style={styles.adminBtn}
            >
              🛠️ {t("common.admin")}
            </button>
          )}

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
            <h1 style={styles.welcomeTitle}>
              {i18n.language === "id" ? "Selamat datang," : "Welcome back,"} {user.name}!
            </h1>
            <p style={styles.welcomeSubtitle}>{t("dashboard.subtitle")}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={styles.newBtn}>
            ➕ {t("dashboard.createNew")}
          </button>
        </div>

        {/* Global metrics overview cards */}
        <section style={styles.statsGrid}>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statLabel}>{t("dashboard.totalProjects")}</span>
            <span style={styles.statVal}>{projects.length}</span>
          </div>
        </section>

        {/* Projects Listing */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : error ? (
          <div style={styles.errorAlert} className="badge-danger">{error}</div>
        ) : projects.length === 0 ? (
          <div style={styles.emptyState} className="glass-panel">
            <span style={styles.emptyIcon}>📂</span>
            <h2 style={styles.emptyTitle}>{t("dashboard.emptyTitle")}</h2>
            <p style={styles.emptyDesc}>{t("dashboard.emptyDesc")}</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={styles.emptyBtn}>
              ➕ {t("dashboard.createNew")}
            </button>
          </div>
        ) : (
          <div style={styles.projectsGrid}>
            {projects.map((proj) => (
              <div key={proj.id} style={styles.projectCard} className="glass-panel">
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{proj.title}</h3>
                  <span style={styles.cardDate}>
                    {t("dashboard.created")} {new Date(proj.createdAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                  </span>
                </div>
                
                <p style={styles.cardDesc}>
                  {proj.description
                    ? proj.description.length > 140
                      ? `${proj.description.substring(0, 140)}...`
                      : proj.description
                    : "No description provided."}
                </p>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => router.push(`/project/${proj.id}`)}
                    className="btn btn-primary"
                    style={styles.actionOpen}
                  >
                    📖 {t("dashboard.openWorkspace")}
                  </button>
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="btn btn-outline"
                    style={styles.actionDelete}
                  >
                    🗑️ {t("dashboard.deleteBtn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="glass-panel animate-fade-in">
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{t("dashboard.createNew")}</h2>
              <button onClick={() => setShowModal(false)} style={styles.modalClose}>✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">{t("dashboard.projectTitle")}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Impact of Social Media on Teenagers"
                  required
                  disabled={modalLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("dashboard.projectDesc")}</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="form-input"
                  rows={4}
                  placeholder="Enter context, research objectives, scope..."
                  style={{ resize: "none", fontFamily: "inherit" }}
                  disabled={modalLoading}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  disabled={modalLoading}
                >
                  {t("common.back")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalLoading}
                >
                  {modalLoading ? t("common.loading") : t("dashboard.createBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(0,0,0,0) 70%)",
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
    background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(0,0,0,0) 70%)",
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
    background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
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
  adminBtn: {
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
    background: "rgba(124, 58, 237, 0.15)",
    color: "#c084fc",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    borderColor: "rgba(239, 68, 68, 0.2)",
    color: "#fca5a5",
    "&:hover": {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderColor: "rgba(239, 68, 68, 0.5)",
    },
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
  newBtn: {
    padding: "0.8rem 1.5rem",
    fontSize: "0.95rem",
    boxShadow: "0 4px 15px rgba(124, 58, 237, 0.25)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  },
  statCard: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  statLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "#22d3ee",
    lineHeight: 1.1,
  },
  projectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "1.5rem",
  },
  projectCard: {
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    minHeight: "260px",
    justifyContent: "space-between",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 1.3,
  },
  cardDate: {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.4)",
  },
  cardDesc: {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.65)",
    lineHeight: 1.5,
    marginBottom: "1.5rem",
    flex: 1,
  },
  cardActions: {
    display: "flex",
    gap: "1rem",
    marginTop: "auto",
  },
  actionOpen: {
    flex: 1,
    padding: "0.6rem 1rem",
    fontSize: "0.85rem",
  },
  actionDelete: {
    padding: "0.6rem 1rem",
    fontSize: "0.85rem",
    borderColor: "rgba(239, 68, 68, 0.15)",
    color: "#fca5a5",
    "&:hover": {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderColor: "rgba(239, 68, 68, 0.4)",
    },
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 0",
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
  emptyState: {
    padding: "4rem 2rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "600px",
    margin: "3rem auto 0 auto",
  },
  emptyIcon: {
    fontSize: "3.5rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: "0.5rem",
  },
  emptyDesc: {
    fontSize: "0.95rem",
    color: "rgba(255, 255, 255, 0.55)",
    lineHeight: 1.5,
    marginBottom: "2rem",
  },
  emptyBtn: {
    padding: "0.75rem 1.5rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(3, 7, 18, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "1.5rem",
  },
  modalCard: {
    width: "100%",
    maxWidth: "540px",
    padding: "2.5rem",
    boxShadow: "var(--shadow-lg)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.9)",
  },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: "1.5rem",
    cursor: "pointer",
    lineHeight: 1,
    transition: "color 0.15s ease",
    "&:hover": {
      color: "white",
    },
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1rem",
  },
};
