"use client";

import React, { useEffect, useState } from "react";
import { IconWrench, IconPlus, IconFolder, IconBook, IconTrash, IconHelix, IconRefresh } from "../../components/Icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";
import { User, Project } from "../../types";
import { getActiveSessionKey, encryptData, decryptData } from "../../utils/crypto";

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

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [projectIdToDelete, setProjectIdToDelete] = useState<string | null>(null);
  const [projectTitleToDelete, setProjectTitleToDelete] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const activeProjects = projects.filter((p) => !p.isArchived);
  const archivedProjects = projects.filter((p) => p.isArchived);

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
      const vaultKey = await getActiveSessionKey();
      
      if (vaultKey && data && data.length > 0) {
        const decryptedProjects = await Promise.all(
          data.map(async (p) => ({
            ...p,
            title: await decryptData(p.title, vaultKey),
            description: await decryptData(p.description, vaultKey),
          }))
        );
        setProjects(decryptedProjects);
      } else {
        setProjects(data || []);
      }
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
      const vaultKey = await getActiveSessionKey();
      let payloadTitle = newTitle.trim();
      let payloadDesc = newDesc.trim();

      if (vaultKey) {
        payloadTitle = await encryptData(payloadTitle, vaultKey);
        payloadDesc = await encryptData(payloadDesc, vaultKey);
      }

      const newProj = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: payloadTitle,
          description: payloadDesc,
        }),
      });

      setNewTitle("");
      setNewDesc("");
      setShowModal(false);
      
      // Dynamic routing direct into user workspace
      router.push(`/user/project?id=${newProj.id}`);
    } catch (err: any) {
      alert(err.message || t("common.errorOccurred"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectIdToDelete) return;

    setDeleteLoading(true);
    try {
      await apiFetch(`/api/projects/${projectIdToDelete}`, { method: "DELETE" });
      setProjects(projects.filter((p) => p.id !== projectIdToDelete));
      setShowDeleteModal(false);
      setProjectIdToDelete(null);
      setProjectTitleToDelete("");
    } catch (err: any) {
      alert(err.message || t("common.errorOccurred"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!projectIdToDelete) return;

    setDeleteLoading(true);
    try {
      await apiFetch(`/api/projects/${projectIdToDelete}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      setProjects(projects.map((p) => (p.id === projectIdToDelete ? { ...p, isArchived: true } : p)));
      setShowDeleteModal(false);
      setProjectIdToDelete(null);
      setProjectTitleToDelete("");
    } catch (err: any) {
      alert(err.message || t("common.errorOccurred"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUnarchiveProject = async (id: string) => {
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      setProjects(projects.map((p) => (p.id === id ? { ...p, isArchived: false } : p)));
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
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => router.push("/user/dashboard")}>
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

          <button onClick={handleLogout} className="btn btn-outline" style={styles.logoutBtn}>
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

        <section className="telemetry-grid">
          <div className="glass-panel telemetry-card">
            <span className="telemetry-label">
              <IconFolder size={12} style={{ marginRight: "6px" }} />
              {t("dashboard.totalProjects")}
            </span>
            <span className="telemetry-val" style={{ color: "#22d3ee" }}>{activeProjects.length}</span>
            <span className="telemetry-sub">
              {i18n.language === "id" ? "Proyek penelitian aktif Anda" : "Your active research projects"}
            </span>
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
        ) : activeProjects.length === 0 ? (
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
          <div className="glass-panel arche-table-wrapper" style={{ overflow: "hidden" }}>
            <table className="arche-table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>{t("dashboard.projectTitleColumn")}</th>
                  <th style={{ width: "25%" }}>{t("dashboard.projectDescColumn")}</th>
                  <th style={{ width: "15%" }}>{t("dashboard.projectApproachColumn")}</th>
                  <th style={{ width: "15%" }}>{t("dashboard.createdAtColumn")}</th>
                  <th style={{ width: "15%" }}>{t("dashboard.updatedAtColumn")}</th>
                  <th style={{ width: "5%", textAlign: "right" }}>{t("dashboard.actionsColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((proj) => (
                  <tr key={proj.id}>
                    <td style={{ verticalAlign: "middle" }}>
                      <div
                        onClick={() => router.push(`/user/project?id=${proj.id}`)}
                        className="project-title-link"
                      >
                        {proj.title}
                      </div>
                    </td>
                    <td style={{ verticalAlign: "middle", color: "rgba(255, 255, 255, 0.6)", fontSize: "0.88rem" }}>
                      {proj.description
                        ? proj.description.length > 80
                          ? `${proj.description.substring(0, 80)}...`
                          : proj.description
                        : "No description provided."}
                    </td>
                    <td style={{ verticalAlign: "middle" }}>
                      {proj.approach ? (
                        <span className={`badge ${
                          proj.approach === "Kuantitatif" || proj.approach === "Quantitative"
                            ? "badge-primary"
                            : proj.approach === "Kualitatif" || proj.approach === "Qualitative"
                              ? "badge-cyan"
                              : "badge-success"
                        }`}>
                          {proj.approach}
                        </span>
                      ) : (
                        <span style={{ color: "rgba(255, 255, 255, 0.25)", fontSize: "0.85rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ verticalAlign: "middle", color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem" }}>
                      {new Date(proj.createdAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                    </td>
                    <td style={{ verticalAlign: "middle", color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem" }}>
                      {new Date(proj.updatedAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                    </td>
                    <td style={{ verticalAlign: "middle", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setProjectIdToDelete(proj.id);
                          setProjectTitleToDelete(proj.title);
                          setShowDeleteModal(true);
                        }}
                        className="btn btn-outline project-action-delete"
                        style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", borderRadius: "8px" }}
                      >
                        <IconTrash size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Archived Projects Listing */}
        {archivedProjects.length > 0 && (
          <div style={{ marginTop: "3rem" }}>
            <h2 className="welcome-title" style={{ fontSize: "1.35rem", marginBottom: "1rem" }}>
              {t("dashboard.archivedTitle")}
            </h2>
            <div className="glass-panel arche-table-wrapper" style={{ overflow: "hidden", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
              <table className="arche-table">
                <thead>
                  <tr style={{ backgroundColor: "rgba(3, 7, 18, 0.25)" }}>
                    <th style={{ width: "25%" }}>{t("dashboard.projectTitleColumn")}</th>
                    <th style={{ width: "25%" }}>{t("dashboard.projectDescColumn")}</th>
                    <th style={{ width: "15%" }}>{t("dashboard.projectApproachColumn")}</th>
                    <th style={{ width: "15%" }}>{t("dashboard.createdAtColumn")}</th>
                    <th style={{ width: "15%" }}>{t("dashboard.updatedAtColumn")}</th>
                    <th style={{ width: "5%", textAlign: "right" }}>{t("dashboard.actionsColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedProjects.map((proj) => (
                    <tr key={proj.id} style={{ opacity: 0.8 }}>
                      <td style={{ verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", fontSize: "1.05rem" }}>
                          {proj.title}
                        </div>
                      </td>
                      <td style={{ verticalAlign: "middle", color: "rgba(255, 255, 255, 0.55)", fontSize: "0.88rem" }}>
                        {proj.description
                          ? proj.description.length > 80
                            ? `${proj.description.substring(0, 80)}...`
                            : proj.description
                          : "No description provided."}
                      </td>
                      <td style={{ verticalAlign: "middle" }}>
                        {proj.approach ? (
                          <span className="badge badge-secondary" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.6)" }}>
                            {proj.approach}
                          </span>
                        ) : (
                          <span style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: "0.85rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ verticalAlign: "middle", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem" }}>
                        {new Date(proj.createdAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                      </td>
                      <td style={{ verticalAlign: "middle", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem" }}>
                        {new Date(proj.updatedAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                      </td>
                      <td style={{ verticalAlign: "middle", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleUnarchiveProject(proj.id)}
                            className="btn btn-outline"
                            title={t("dashboard.unarchiveBtn")}
                            style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", borderRadius: "8px", color: "#22d3ee", borderColor: "rgba(34, 211, 238, 0.3)" }}
                          >
                            <IconRefresh size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setProjectIdToDelete(proj.id);
                              setProjectTitleToDelete(proj.title);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-outline project-action-delete"
                            title={t("dashboard.deletePermanent")}
                            style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", borderRadius: "8px" }}
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 Benny Maisa. Archeres: Empowering beginner researchers to structure sound methodologies. Powered by Next.js, Go Fiber, & SQLite.
        </p>
      </footer>

      {/* Creation Modal */}
      {showModal && (
        <div className="arche-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="arche-modal-card glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="arche-modal-header">
              <h2 className="arche-modal-title">{t("dashboard.createNew")}</h2>
              <button onClick={() => setShowModal(false)} className="arche-modal-close">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="arche-modal-form">
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

              <div className="arche-modal-actions">
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="arche-modal-overlay" onClick={() => {
          setShowDeleteModal(false);
          setProjectIdToDelete(null);
          setProjectTitleToDelete("");
        }}>
          <div className="arche-modal-card glass-panel animate-fade-in" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="arche-modal-header">
              <h2 className="arche-modal-title" style={{ color: "hsl(var(--destructive-color, #ef4444))" }}>
                {t("dashboard.deleteBtn")}
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectIdToDelete(null);
                  setProjectTitleToDelete("");
                }}
                className="arche-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: "1.75rem", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.75)", fontSize: "0.95rem" }}>
              {t("dashboard.archiveConfirm")}
              <div style={{
                marginTop: "0.75rem",
                padding: "0.85rem 1rem",
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                border: "1px dashed rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: 600,
                fontSize: "0.95rem",
                wordBreak: "break-all"
              }}>
                "{projectTitleToDelete}"
              </div>
            </div>

            <div className="arche-modal-actions">
              <button
                type="button"
                onClick={handleArchiveProject}
                className="btn"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#fbbf24",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? t("common.loading") : t("dashboard.archiveBtn")}
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="btn"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? t("common.loading") : t("dashboard.deletePermanent")}
              </button>
            </div>
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
};
