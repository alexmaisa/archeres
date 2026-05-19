"use client";

import React, { useEffect, useState } from "react";
import { IconWrench, IconPlus, IconFolder, IconBook, IconTrash, IconHelix, IconRefresh, IconSearch, IconFilter, IconMenu, IconX } from "../../components/Icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api";
import { User, Project } from "../../types";
import { encryptText, decryptText } from "../../lib/crypto";
import { getMEK } from "../../lib/session";
import { clearMEK } from "../../lib/session";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
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

  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [approachFilter, setApproachFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"title" | "approach" | "createdAt" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const activeProjects = projects.filter((p) => !p.isArchived);
  const archivedProjects = projects.filter((p) => p.isArchived);

  const projectToDelete = projects.find((p) => p.id === projectIdToDelete);
  const isTargetAlreadyArchived = projectToDelete ? projectToDelete.isArchived : false;

  // Real-time Filtering & Sorting dynamic pipeline
  const processProjects = (list: Project[]) => {
    // 1. Filter by Search Query
    let result = list.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || descMatch;
    });

    // 2. Filter by Research Approach
    if (approachFilter !== "All") {
      result = result.filter((p) => p.approach === approachFilter);
    }

    // 3. Sort Results dynamically
    result.sort((a, b) => {
      let valA: any = a[sortBy] || "";
      let valB: any = b[sortBy] || "";

      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  };

  const displayedActive = processProjects(activeProjects);
  const displayedArchived = processProjects(archivedProjects);

  const handleHeaderClick = (field: "title" | "approach" | "createdAt" | "updatedAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const renderSortIndicator = (field: "title" | "approach" | "createdAt" | "updatedAt") => {
    if (sortBy !== field) return null;
    return (
      <span style={{ marginLeft: "6px", fontSize: "0.75rem", color: "#c084fc", display: "inline-block", verticalAlign: "middle" }}>
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  useEffect(() => {
    // Authenticate session locally
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }
    setUser(JSON.parse(savedUser));
    fetchProjects();

    setMounted(true);
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Project[]>("/api/projects", { method: "GET" });
      const mek = await getMEK();

      if (data && data.length > 0) {
        const processed = await Promise.all(
          data.map(async (p: any) => {
            const rd = p.researchDesign || {};
            const rawApproach = p.approach || rd.approach || "";
            const designVal = p.designType || rd.designType || "";

            let approachVal = rawApproach;
            const lowerApp = rawApproach.toLowerCase();
            if (lowerApp === "quant" || lowerApp === "quantitative" || lowerApp === "kuantitatif") {
              approachVal = "Kuantitatif";
            } else if (lowerApp === "qual" || lowerApp === "qualitative" || lowerApp === "kualitatif") {
              approachVal = "Kualitatif";
            } else if (lowerApp === "mixed" || lowerApp === "mixed methods" || lowerApp === "metode campuran" || lowerApp === "campuran") {
              approachVal = "Metode Campuran";
            }

            let titleDec = p.title;
            let descDec = p.description;

            if (mek) {
              titleDec = await decryptText(p.title, mek).catch(() => p.title);
              if (p.description) {
                descDec = await decryptText(p.description, mek).catch(() => p.description);
              }
            }

            return {
              ...p,
              title: titleDec,
              description: descDec,
              approach: approachVal,
              designType: designVal,
            };
          })
        );
        setProjects(processed);
      } else {
        setProjects([]);
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
      const mek = await getMEK();
      let payloadTitle = newTitle.trim();
      let payloadDesc = newDesc.trim();

      if (mek) {
        payloadTitle = await encryptText(payloadTitle, mek);
        if (payloadDesc) payloadDesc = await encryptText(payloadDesc, mek);
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
    clearMEK();
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      {/* Background glowing ambient circles */}
      <div className="glow-ambient-cyan"></div>
      <div className="glow-ambient-purple"></div>

      {/* Navigation Header */}
      <header className="fixed-header">
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          <img src="/Archeres.svg" alt="Archeres Logo" className="nav-brand-logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          <span className="nav-brand-name">{t("common.appName")}</span>
          <span className="badge badge-primary">Workspace</span>
        </div>

        {/* Desktop Navigation Controls */}
        <div className="nav-controls-desktop" style={styles.navControls}>
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

        {/* Mobile Hamburger Button */}
        <button
          className="burger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <IconX size={22} /> : <IconMenu size={22} />}
        </button>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-menu animate-fade-in">
            {user.role === "admin" && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/admin");
                }}
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <IconWrench size={14} />
                {t("common.admin")}
              </button>
            )}

            {/* Language Switcher inside Mobile Drawer */}
            <div style={{ ...styles.langBar, width: "100%", justifyContent: "center" }}>
              <button
                onClick={() => handleLanguageToggle("en")}
                style={{
                  ...styles.langBtn,
                  flex: 1,
                  textAlign: "center",
                  justifyContent: "center",
                  ...(i18n.language === "en" ? styles.langBtnActive : {}),
                }}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageToggle("id")}
                style={{
                  ...styles.langBtn,
                  flex: 1,
                  textAlign: "center",
                  justifyContent: "center",
                  ...(i18n.language === "id" ? styles.langBtnActive : {}),
                }}
              >
                ID
              </button>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="btn btn-outline btn-danger"
              style={{ width: "100%", justifyContent: "center", background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}
            >
              {t("common.logout")}
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="main-container animate-fade-in">
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



        {/* Projects Listing */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>{t("common.loading")}</p>
          </div>
        ) : error ? (
          <div style={styles.errorAlert} className="badge-danger">{error}</div>
        ) : (
          <div>
            {/* Toggle Tab Selector */}
            <div style={{ display: "inline-flex", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "10px", padding: "4px", marginBottom: "1.25rem", gap: "4px" }}>
              <button
                onClick={() => setActiveTab("active")}
                className="btn"
                style={{
                  background: activeTab === "active" ? "rgba(124, 58, 237, 0.15)" : "transparent",
                  color: activeTab === "active" ? "#c084fc" : "rgba(255, 255, 255, 0.5)",
                  border: "none",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
              >
                {t("dashboard.activeTitle")} ({activeProjects.length})
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className="btn"
                style={{
                  background: activeTab === "archived" ? "rgba(124, 58, 237, 0.15)" : "transparent",
                  color: activeTab === "archived" ? "#c084fc" : "rgba(255, 255, 255, 0.5)",
                  border: "none",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
              >
                {t("dashboard.archivedTitle")} ({archivedProjects.length})
              </button>
            </div>

            <div className="dashboard-search-bar">
              {/* Search Box */}
              <div className="dashboard-search-box">
                <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255, 255, 255, 0.35)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                  <IconSearch size={16} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("dashboard.searchPlaceholder")}
                  className="form-input"
                  style={{
                    paddingLeft: "2.4rem",
                    margin: 0,
                    fontSize: "0.88rem",
                    height: "38px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    color: "rgba(255, 255, 255, 0.9)",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Filters and Sorting dropdowns */}
              <div className="dashboard-filters">
                {/* Approach Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.4)", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {t("dashboard.filterLabel")}:
                  </span>
                  <select
                    value={approachFilter}
                    onChange={(e) => setApproachFilter(e.target.value)}
                    className="form-input"
                    style={{
                      width: isMobile ? "100%" : "160px",
                      height: "38px",
                      margin: 0,
                      padding: "0 0.75rem",
                      fontSize: "0.85rem",
                      borderRadius: "8px",
                      background: "rgba(3, 7, 18, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      color: "rgba(255, 255, 255, 0.8)",
                      cursor: "pointer",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="All">{t("dashboard.filterAll")}</option>
                    <option value="Kuantitatif">Kuantitatif</option>
                    <option value="Kualitatif">Kualitatif</option>
                    <option value="Metode Campuran">Metode Campuran</option>
                    <option value="R&D">R&D</option>
                  </select>
                </div>

                {/* Explicit Sorting Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.4)", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {t("dashboard.sortLabel")}:
                  </span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-") as [any, any];
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="form-input"
                    style={{
                      width: isMobile ? "100%" : "210px",
                      height: "38px",
                      margin: 0,
                      padding: "0 0.75rem",
                      fontSize: "0.85rem",
                      borderRadius: "8px",
                      background: "rgba(3, 7, 18, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      color: "rgba(255, 255, 255, 0.8)",
                      cursor: "pointer",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="title-asc">{t("dashboard.sortTitleAsc")}</option>
                    <option value="title-desc">{t("dashboard.sortTitleDesc")}</option>
                    <option value="approach-asc">{t("dashboard.sortApproachAsc")}</option>
                    <option value="approach-desc">{t("dashboard.sortApproachDesc")}</option>
                    <option value="createdAt-asc">{t("dashboard.sortCreatedAsc")}</option>
                    <option value="createdAt-desc">{t("dashboard.sortCreatedDesc")}</option>
                    <option value="updatedAt-asc">{t("dashboard.sortUpdatedAsc")}</option>
                    <option value="updatedAt-desc">{t("dashboard.sortUpdatedDesc")}</option>
                  </select>
                </div>
              </div>
            </div>

            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
                {activeTab === "active" ? (
                  activeProjects.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                        <IconFolder size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                        <span style={{ fontSize: "0.95rem" }}>
                          {i18n.language === "id" 
                            ? "Belum ada proyek penelitian aktif yang dibuat." 
                            : "No active research projects have been created yet."}
                        </span>
                      </div>
                    </div>
                  ) : displayedActive.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                        <IconFilter size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                        <span style={{ fontSize: "0.95rem" }}>
                          {t("dashboard.noMatchFound")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    displayedActive.map((proj) => (
                      <div key={proj.id} className="glass-panel animate-fade-in" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span className={`badge ${
                            proj.approach === "Kuantitatif" || proj.approach === "Quantitative"
                              ? "badge-primary"
                              : proj.approach === "Kualitatif" || proj.approach === "Qualitative"
                                ? "badge-cyan"
                                : "badge-success"
                          }`} style={{ fontSize: "0.75rem" }}>
                            {proj.approach === "Kuantitatif"
                              ? (i18n.language === "id" ? "Kuantitatif" : "Quantitative")
                              : proj.approach === "Kualitatif"
                                ? (i18n.language === "id" ? "Kualitatif" : "Qualitative")
                                : proj.approach === "Metode Campuran"
                                  ? (i18n.language === "id" ? "Metode Campuran" : "Mixed Methods")
                                  : proj.approach || "—"}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.3)" }}>
                            {new Date(proj.updatedAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                          </span>
                        </div>
                        <h3 
                          onClick={() => router.push(`/user/project?id=${proj.id}`)}
                          style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", cursor: "pointer", margin: 0, textDecoration: "none" }}
                          className="project-title-link"
                        >
                          {proj.title}
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: 1.4 }}>
                          {proj.description
                            ? proj.description.length > 120
                              ? `${proj.description.substring(0, 120)}...`
                              : proj.description
                            : "No description provided."}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                          <button
                            onClick={() => {
                              setProjectIdToDelete(proj.id);
                              setProjectTitleToDelete(proj.title);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-outline project-action-delete"
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px" }}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  archivedProjects.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                        <IconFolder size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                        <span style={{ fontSize: "0.95rem" }}>
                          {i18n.language === "id" 
                            ? "Belum ada proyek penelitian yang diarsipkan." 
                            : "No archived research projects found."}
                        </span>
                      </div>
                    </div>
                  ) : displayedArchived.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                        <IconFilter size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                        <span style={{ fontSize: "0.95rem" }}>
                          {t("dashboard.noMatchFound")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    displayedArchived.map((proj) => (
                      <div key={proj.id} className="glass-panel animate-fade-in" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.08)", opacity: 0.85 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span className="badge badge-secondary" style={{ fontSize: "0.75rem", backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.6)" }}>
                            {proj.approach === "Kuantitatif"
                              ? (i18n.language === "id" ? "Kuantitatif" : "Quantitative")
                              : proj.approach === "Kualitatif"
                                ? (i18n.language === "id" ? "Kualitatif" : "Qualitative")
                                : proj.approach === "Metode Campuran"
                                  ? (i18n.language === "id" ? "Metode Campuran" : "Mixed Methods")
                                  : proj.approach || "—"}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.3)" }}>
                            {new Date(proj.updatedAt).toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US")}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
                          {proj.title}
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.55)", margin: 0, lineHeight: 1.4 }}>
                          {proj.description
                            ? proj.description.length > 120
                              ? `${proj.description.substring(0, 120)}...`
                              : proj.description
                            : "No description provided."}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                          <button
                            onClick={() => handleUnarchiveProject(proj.id)}
                            className="btn btn-outline"
                            title={t("dashboard.unarchiveBtn")}
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px", color: "#22d3ee", borderColor: "rgba(34, 211, 238, 0.3)" }}
                          >
                            <IconRefresh size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setProjectIdToDelete(proj.id);
                              setProjectTitleToDelete(proj.title);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-outline project-action-delete"
                            title={t("dashboard.deletePermanent")}
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px" }}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            ) : (
              <div className="glass-panel arche-table-wrapper" style={{ overflowX: "auto" }}>
                <table className="arche-table table-compact">
                  <thead>
                    <tr>
                      <th style={{ width: "25%", cursor: "pointer", userSelect: "none" }} onClick={() => handleHeaderClick("title")}>
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          {t("dashboard.projectTitleColumn")}
                          {renderSortIndicator("title")}
                        </span>
                      </th>
                      <th style={{ width: "25%" }}>{t("dashboard.projectDescColumn")}</th>
                      <th style={{ width: "15%", cursor: "pointer", userSelect: "none" }} onClick={() => handleHeaderClick("approach")}>
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          {t("dashboard.projectApproachColumn")}
                          {renderSortIndicator("approach")}
                        </span>
                      </th>
                      <th style={{ width: "15%", cursor: "pointer", userSelect: "none" }} onClick={() => handleHeaderClick("createdAt")}>
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          {t("dashboard.createdAtColumn")}
                          {renderSortIndicator("createdAt")}
                        </span>
                      </th>
                      <th style={{ width: "15%", cursor: "pointer", userSelect: "none" }} onClick={() => handleHeaderClick("updatedAt")}>
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          {t("dashboard.updatedAtColumn")}
                          {renderSortIndicator("updatedAt")}
                        </span>
                      </th>
                      <th style={{ width: "5%", textAlign: "right" }}>{t("dashboard.actionsColumn")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "active" ? (
                      activeProjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "rgba(255, 255, 255, 0.4)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                              <IconFolder size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                              <span style={{ fontSize: "0.95rem" }}>
                                {i18n.language === "id" 
                                  ? "Belum ada proyek penelitian aktif yang dibuat." 
                                  : "No active research projects have been created yet."}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : displayedActive.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "rgba(255, 255, 255, 0.4)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                              <IconFilter size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                              <span style={{ fontSize: "0.95rem" }}>
                                {t("dashboard.noMatchFound")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayedActive.map((proj) => (
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
                                  {proj.approach === "Kuantitatif"
                                    ? (i18n.language === "id" ? "Kuantitatif" : "Quantitative")
                                    : proj.approach === "Kualitatif"
                                      ? (i18n.language === "id" ? "Kualitatif" : "Qualitative")
                                      : proj.approach === "Metode Campuran"
                                        ? (i18n.language === "id" ? "Metode Campuran" : "Mixed Methods")
                                        : proj.approach}
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
                        ))
                      )
                    ) : (
                      archivedProjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "rgba(255, 255, 255, 0.4)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                              <IconFolder size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                              <span style={{ fontSize: "0.95rem" }}>
                                {i18n.language === "id" 
                                  ? "Belum ada proyek penelitian yang diarsipkan." 
                                  : "No archived research projects found."}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : displayedArchived.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "rgba(255, 255, 255, 0.4)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                              <IconFilter size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                              <span style={{ fontSize: "0.95rem" }}>
                                {t("dashboard.noMatchFound")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayedArchived.map((proj) => (
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
                                  {proj.approach === "Kuantitatif"
                                    ? (i18n.language === "id" ? "Kuantitatif" : "Quantitative")
                                    : proj.approach === "Kualitatif"
                                      ? (i18n.language === "id" ? "Kualitatif" : "Qualitative")
                                      : proj.approach === "Metode Campuran"
                                        ? (i18n.language === "id" ? "Metode Campuran" : "Mixed Methods")
                                        : proj.approach}
                                </span>
                              ) : (
                                <span style={{ color: "rgba(255, 255, 255, 0.25)", fontSize: "0.85rem" }}>—</span>
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
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="fixed-footer">
        <p className="footer-text">
          &copy; 2026 Benny Maisa. Archeres: Empowering beginner researchers to structure sound methodologies. <span className="footer-powered">Powered by Next.js, Go Fiber, & SQLite.</span>
        </p>
      </footer>

      {/* Creation Modal */}
      {showModal && (
        <div className="arche-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="arche-modal-card glass-panel animate-fade-in"
            style={{ maxWidth: "460px", padding: "1.75rem", borderRadius: "12px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="arche-modal-header" style={{ marginBottom: "1.25rem" }}>
              <h2 className="arche-modal-title" style={{ fontSize: "1.35rem" }}>{t("dashboard.createNew")}</h2>
              <button onClick={() => setShowModal(false)} className="arche-modal-close">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="arche-modal-form" style={{ gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label className="form-label" style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>{t("dashboard.projectTitle")}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Impact of Social Media on Teenagers"
                  required
                  disabled={modalLoading}
                  style={{ fontSize: "0.88rem", padding: "0.6rem 0.85rem" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label className="form-label" style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>{t("dashboard.projectDesc")}</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="form-input"
                  rows={3}
                  placeholder="Enter context, research objectives, scope..."
                  style={{ resize: "none", fontFamily: "inherit", fontSize: "0.88rem", padding: "0.6rem 0.85rem" }}
                  disabled={modalLoading}
                />
              </div>

              <div className="arche-modal-actions" style={{ marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.65rem 1rem", fontSize: "0.9rem", fontWeight: 600 }}
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
          <div 
            className="arche-modal-card glass-panel animate-fade-in" 
            style={{ maxWidth: "420px", padding: "1.75rem", borderRadius: "12px" }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="arche-modal-header" style={{ marginBottom: "1rem" }}>
              <h2 className="arche-modal-title" style={{ fontSize: "1.25rem", color: "hsl(var(--destructive-color, #ef4444))" }}>
                {t("dashboard.deleteBtn")}
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectIdToDelete(null);
                  setProjectTitleToDelete("");
                }}
                className="arche-modal-close"
                style={{ fontSize: "1.25rem" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: "1.25rem", lineHeight: "1.5", color: "rgba(255, 255, 255, 0.75)", fontSize: "0.88rem" }}>
              {isTargetAlreadyArchived ? t("dashboard.deletePermanentConfirm") : t("dashboard.archiveConfirm")}
              <div style={{
                marginTop: "0.5rem",
                padding: "0.6rem 0.85rem",
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                border: "1px dashed rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: 600,
                fontSize: "0.88rem",
                wordBreak: "break-all"
              }}>
                "{projectTitleToDelete}"
              </div>
            </div>

            <div className="arche-modal-actions" style={{ marginTop: "1rem", gap: "0.75rem" }}>
              {!isTargetAlreadyArchived && (
                <button
                  type="button"
                  onClick={handleArchiveProject}
                  className="btn"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    color: "#fbbf24",
                    padding: "0.5rem 1.15rem",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    transition: "all 0.2s ease"
                  }}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? t("common.loading") : t("dashboard.archiveBtn")}
                </button>
              )}
              <button
                type="button"
                onClick={handleDeleteProject}
                className="btn"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  padding: "0.5rem 1.15rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.88rem",
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
