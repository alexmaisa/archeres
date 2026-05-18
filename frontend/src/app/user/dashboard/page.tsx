"use client";

import React, { useEffect, useState } from "react";
import { IconWrench, IconPlus, IconFolder, IconBook, IconTrash, IconHelix } from "../../components/Icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";
import { User, Project } from "../../types";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [modalLoading, setModalLoading] = useState<boolean>(false);

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
      const data = await apiFetch<Project[]>("/api/projects", { method: "GET" });
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message || t("common.errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setModalLoading(true);
    try {
      const newProj = await apiFetch<Project>("/api/projects", {
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
    } catch (err: any) {
      alert(err.message || t("common.errorOccurred"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm(t("dashboard.deleteConfirm"))) return;

    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err: any) {
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
      <div className="glow-ambient-cyan"></div>
      <div className="glow-ambient-purple"></div>

      {/* Navigation Header */}
      <header className="fixed-header">
        <div className="nav-brand">
          <IconHelix size={22} className="nav-brand-logo" style={{ strokeWidth: 2.5 }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
          <span className="badge badge-primary">Workspace</span>
        </div>

        <div style={styles.navControls}>
          {user.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="btn btn-outline"
              style={styles.adminBtn}
            >
              <IconWrench size={13} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {t("common.admin")}
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
      <main className="main-container">
        <div className="welcome-section">
          <div>
            <h1 className="welcome-title">
              {i18n.language === "id" ? "Selamat datang," : "Welcome back,"} {user.name}!
            </h1>
            <p className="welcome-subtitle">{t("dashboard.subtitle")}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={styles.newBtn}>
            <IconPlus size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            {t("dashboard.createNew")}
          </button>
        </div>

        {/* Global metrics overview cards */}
        <section className="telemetry-grid">
          <div className="glass-panel telemetry-card">
            <span className="telemetry-label">{t("dashboard.totalProjects")}</span>
            <span className="telemetry-val" style={{ color: "#22d3ee" }}>{projects.length}</span>
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
          <div className="glass-panel dashboard-empty-state">
            <IconFolder size={48} style={{ color: "rgba(255, 255, 255, 0.2)", marginBottom: "1rem" }} />
            <h2 className="dashboard-empty-title">{t("dashboard.emptyTitle")}</h2>
            <p className="dashboard-empty-desc">{t("dashboard.emptyDesc")}</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={styles.emptyBtn}>
              <IconPlus size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {t("dashboard.createNew")}
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((proj) => (
              <div key={proj.id} className="glass-panel project-card">
                <div className="project-card-header">
                  <h3 className="project-card-title">{proj.title}</h3>
                  <span className="project-card-date">
                    {t("dashboard.created")} {new Date(proj.createdAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                  </span>
                </div>
                
                <p className="project-card-desc">
                  {proj.description
                    ? proj.description.length > 140
                      ? `${proj.description.substring(0, 140)}...`
                      : proj.description
                    : "No description provided."}
                </p>

                <div className="project-card-actions">
                  <button
                    onClick={() => router.push(`/user/project/${proj.id}`)}
                    className="btn btn-primary project-action-open"
                  >
                    <IconBook size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t("dashboard.openWorkspace")}
                  </button>
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="btn btn-outline project-action-delete"
                  >
                    <IconTrash size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t("dashboard.deleteBtn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 Benny Maisa. Arche: Empowering beginner researchers to structure sound methodologies. Powered by Next.js, Go Fiber, & SQLite.
        </p>
      </footer>

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
  },
  newBtn: {
    padding: "0.8rem 1.5rem",
    fontSize: "0.95rem",
    boxShadow: "0 4px 15px rgba(124, 58, 237, 0.25)",
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
