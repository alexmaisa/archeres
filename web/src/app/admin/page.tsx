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
  formulaStats: {
    slovin: number;
    cochran: number;
    lemeshow: number;
    krejcieMorgan: number;
    yamane: number;
    daniel: number;
    [key: string]: number;
  };
  trends: {
    months: string[];
    projects: number[];
    users: number[];
    logins: number[];
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

  // --- SVG Charts Calculations & Renders ---

  const formulaKeys = ["slovin", "cochran", "lemeshow", "krejcieMorgan", "yamane", "daniel"];
  const formulaColors: Record<string, string> = {
    slovin: "#38bdf8",
    cochran: "#f472b6",
    lemeshow: "#a78bfa",
    krejcieMorgan: "#34d399",
    yamane: "#fb7185",
    daniel: "#fbbf24"
  };
  const formulaLabels: Record<string, string> = {
    slovin: "Slovin",
    cochran: "Cochran",
    lemeshow: "Lemeshow",
    krejcieMorgan: "Krejcie-M.",
    yamane: "Yamane",
    daniel: "Daniel"
  };

  const getFormulaData = () => {
    if (!stats || !stats.formulaStats) return { items: [], total: 0 };
    let total = 0;
    const items = formulaKeys.map((key) => {
      const val = stats.formulaStats[key] || 0;
      total += val;
      return { key, val, color: formulaColors[key], label: formulaLabels[key] };
    });
    return { items, total };
  };

  const renderDonutChart = () => {
    const { items, total } = getFormulaData();
    const r = 110;
    const circ = 2 * Math.PI * r; 
    const svgSize = 260;
    const center = svgSize / 2;
    
    if (total === 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", height: "300px" }}>
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <circle cx={center} cy={center} r={r} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
          </svg>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
            {i18n.language === "id" ? "Belum ada data formula" : "No formula data yet"}
          </div>
        </div>
      );
    }

    let currentOffset = 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3rem", marginTop: "2rem", flex: 1 }} className="animate-fade-in">
        <div style={{ position: "relative", width: `${svgSize}px`, height: `${svgSize}px`, margin: "0 auto" }}>
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ transform: "rotate(-90deg)" }}>
            {items.map((item) => {
              if (item.val === 0) return null;
              const pct = (item.val / total) * 100;
              const strokeLength = (pct / 100) * circ;
              const dashOffset = circ - strokeLength + currentOffset;
              currentOffset -= strokeLength;

              return (
                <circle
                  key={item.key}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={`${circ} ${circ}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              );
            })}
          </svg>
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center"
          }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", display: "block", lineHeight: 1.1 }}>{total}</span>
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
          </div>
        </div>

        {/* Dynamic Legends Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 2rem", width: "100%" }}>
          {items.map((item) => {
            const pct = total > 0 ? ((item.val / total) * 100).toFixed(0) : "0";
            return (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", opacity: item.val > 0 ? 1 : 0.35 }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }}></span>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>{item.label}</span>
                <strong style={{ color: "white", marginLeft: "auto" }}>{pct}%</strong>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (!stats || !stats.trends || !stats.trends.months) return null;
    const months = stats.trends.months;
    const projects = stats.trends.projects;
    const maxVal = Math.max(...projects, 4); // Scale nicely

    const width = 500;
    const height = 150;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const colWidth = chartWidth / (months.length || 1);

    const getMonthLabel = (mStr: string) => {
      const [year, month] = mStr.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US", { month: "short" });
    };

    return (
      <div style={{ marginTop: "1rem", position: "relative" }} className="animate-fade-in">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            return (
              <line
                key={idx}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
            );
          })}

          {/* Bars */}
          {months.map((mStr, idx) => {
            const val = projects[idx] || 0;
            const barHeight = (val / maxVal) * chartHeight;
            const x = paddingLeft + idx * colWidth + colWidth * 0.15;
            const y = paddingTop + chartHeight - barHeight;
            const barW = colWidth * 0.7;

            return (
              <g key={mStr}>
                {/* Rect with gradient fill */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barHeight}
                  fill="url(#barGradient)"
                  rx="3.5"
                  style={{ transition: "all 0.5s ease" }}
                />
              </g>
            );
          })}

          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y Axis Grid Labels (Native HTML Overlays) */}
        <div style={{
          position: "absolute",
          left: "0",
          top: "0",
          height: `${height}px`,
          width: `${paddingLeft - 4}px`,
          pointerEvents: "none"
        }}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const gridLabel = Math.round(maxVal * ratio);
            const topPct = ((paddingTop + chartHeight * (1 - ratio)) / height) * 100;
            return (
              <span key={idx} style={{
                position: "absolute",
                top: `${topPct}%`,
                right: "0",
                transform: "translateY(-50%)",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 600,
                lineHeight: 1
              }}>
                {gridLabel}
              </span>
            );
          })}
        </div>

        {/* X Axis Month Labels (Native HTML Overlays) */}
        <div style={{
          position: "absolute",
          left: "0",
          bottom: "3px",
          width: "100%",
          height: `${paddingBottom}px`,
          pointerEvents: "none"
        }}>
          {months.map((mStr, idx) => {
            const xVal = paddingLeft + idx * colWidth + colWidth * 0.15;
            const barW = colWidth * 0.7;
            const leftPct = ((xVal + barW / 2) / width) * 100;
            return (
              <span key={mStr} style={{
                position: "absolute",
                left: `${leftPct}%`,
                transform: "translateX(-50%)",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 600,
                whiteSpace: "nowrap"
              }}>
                {getMonthLabel(mStr)}
              </span>
            );
          })}
        </div>

        {/* Bar Value Labels (Native HTML Overlays) */}
        <div style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "100%",
          height: `${height}px`,
          pointerEvents: "none"
        }}>
          {months.map((mStr, idx) => {
            const val = projects[idx] || 0;
            if (val === 0) return null;
            const barHeight = (val / maxVal) * chartHeight;
            const xVal = paddingLeft + idx * colWidth + colWidth * 0.15;
            const barW = colWidth * 0.7;
            const yVal = paddingTop + chartHeight - barHeight;

            const leftPct = ((xVal + barW / 2) / width) * 100;
            const topPct = (yVal / height) * 100;

            return (
              <span key={`val-${idx}`} style={{
                position: "absolute",
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: "translate(-50%, -120%)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: "var(--font-outfit), sans-serif",
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                lineHeight: 1
              }}>
                {val}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    if (!stats || !stats.trends || !stats.trends.months) return null;
    const months = stats.trends.months;
    const users = stats.trends.users;
    const logins = stats.trends.logins;
    const maxVal = Math.max(...users, ...logins, 4);

    const width = 800;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getMonthLabel = (mStr: string) => {
      const [year, month] = mStr.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString(i18n.language === "id" ? "id-ID" : "en-US", { month: "short" });
    };

    const getCoordinates = (data: number[]) => {
      return data.map((val, idx) => {
        const x = paddingLeft + idx * (chartWidth / (months.length - 1 || 1));
        const y = paddingTop + chartHeight * (1 - val / maxVal);
        return { x, y, val };
      });
    };

    const userPoints = getCoordinates(users);
    const loginPoints = getCoordinates(logins);

    const buildPathString = (points: { x: number; y: number }[]) => {
      return points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    };

    const buildAreaString = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return "";
      const path = buildPathString(points);
      return `${path} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    };

    const userPath = buildPathString(userPoints);
    const loginPath = buildPathString(loginPoints);

    const userArea = buildAreaString(userPoints);
    const loginArea = buildAreaString(loginPoints);

    return (
      <div style={{ marginTop: "1rem", position: "relative" }} className="animate-fade-in">
        {/* Dynamic legends block */}
        <div style={{ display: "flex", gap: "1.5rem", justifyContent: "flex-end", marginBottom: "0.5rem", fontSize: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "3px", backgroundColor: "#f43f5e", borderRadius: "1.5px" }}></span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>{t("admin.chartLegendRegistrations")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "3px", backgroundColor: "#10b981", borderRadius: "1.5px" }}></span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>{t("admin.chartLegendLogins")}</span>
          </div>
        </div>

        {/* SVG Canvas and HTML Overlay Sub-Container */}
        <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + chartHeight * (1 - ratio);
              return (
                <line
                  key={idx}
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area gradients under curves */}
            <path d={userArea} fill="url(#userAreaGrad)" style={{ transition: "all 0.5s ease" }} />
            <path d={loginArea} fill="url(#loginAreaGrad)" style={{ transition: "all 0.5s ease" }} />

            {/* Draw lines */}
            <path
              d={userPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "all 0.5s ease" }}
            />
            <path
              d={loginPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "all 0.5s ease" }}
            />

            {/* User registration data points dots */}
            {userPoints.map((p, idx) => (
              <g key={`u-${idx}`}>
                <circle cx={p.x} cy={p.y} r="5" fill="#f43f5e" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                <circle cx={p.x} cy={p.y} r="9" fill="transparent" stroke="#f43f5e" strokeWidth="1" opacity="0.2" />
              </g>
            ))}

            {/* Login session data points dots */}
            {loginPoints.map((p, idx) => (
              <g key={`l-${idx}`}>
                <circle cx={p.x} cy={p.y} r="5" fill="#10b981" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                <circle cx={p.x} cy={p.y} r="9" fill="transparent" stroke="#10b981" strokeWidth="1" opacity="0.2" />
              </g>
            ))}

            <defs>
              <linearGradient id="userAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="loginAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Y Axis Grid Labels (Native HTML Overlays) */}
          <div style={{
            position: "absolute",
            left: "0",
            top: "0",
            height: `${height}px`,
            width: `${paddingLeft - 4}px`,
            pointerEvents: "none"
          }}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const gridLabel = Math.round(maxVal * ratio);
              const topPct = ((paddingTop + chartHeight * (1 - ratio)) / height) * 100;
              return (
                <span key={idx} style={{
                  position: "absolute",
                  top: `${topPct}%`,
                  right: "0",
                  transform: "translateY(-50%)",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 600,
                  lineHeight: 1
                }}>
                  {gridLabel}
                </span>
              );
            })}
          </div>

          {/* X Axis Month Labels (Native HTML Overlays) */}
          <div style={{
            position: "absolute",
            left: "0",
            bottom: "-10px",
            width: "100%",
            height: `${paddingBottom}px`,
            pointerEvents: "none"
          }}>
            {months.map((mStr, idx) => {
              const xVal = paddingLeft + idx * (chartWidth / (months.length - 1 || 1));
              const leftPct = (xVal / width) * 100;
              return (
                <span key={mStr} style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  transform: "translateX(-50%)",
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 600,
                  whiteSpace: "nowrap"
                }}>
                  {getMonthLabel(mStr)}
                </span>
              );
            })}
          </div>

          {/* User Registration Point Value Labels (Native HTML Overlays) */}
          <div style={{
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: `${height}px`,
            pointerEvents: "none"
          }}>
            {userPoints.map((p, idx) => {
              if (p.val === 0) return null;
              const leftPct = (p.x / width) * 100;
              return (
                <span key={`uval-${idx}`} style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  top: `${p.y - 14}px`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#f43f5e",
                  fontFamily: "var(--font-outfit), sans-serif",
                  textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                  lineHeight: 1
                }}>
                  {p.val}
                </span>
              );
            })}
          </div>

          {/* Login Session Point Value Labels (Native HTML Overlays) */}
          <div style={{
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: `${height}px`,
            pointerEvents: "none"
          }}>
            {loginPoints.map((p, idx) => {
              if (p.val === 0) return null;
              const leftPct = (p.x / width) * 100;
              return (
                <span key={`lval-${idx}`} style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  top: `${p.y - 14}px`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#10b981",
                  fontFamily: "var(--font-outfit), sans-serif",
                  textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                  lineHeight: 1
                }}>
                  {p.val}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
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

          <button onClick={handleLogout} className="btn btn-outline" style={styles.logoutBtn}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                  {/* Single Stacked Progress Bar */}
                  <div style={{ display: "flex", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: stats.totalProjects > 0 ? `${(getApproachCount("kuantitatif") / stats.totalProjects) * 100}%` : "0%",
                      background: "linear-gradient(90deg, #0284c7, #38bdf8)",
                      transition: "width 1s ease"
                    }}></div>
                    <div style={{
                      height: "100%",
                      width: stats.totalProjects > 0 ? `${(getApproachCount("kualitatif") / stats.totalProjects) * 100}%` : "0%",
                      background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                      transition: "width 1s ease"
                    }}></div>
                    <div style={{
                      height: "100%",
                      width: stats.totalProjects > 0 ? `${(getApproachCount("metodeCampuran") / stats.totalProjects) * 100}%` : "0%",
                      background: "linear-gradient(90deg, #db2777, #f472b6)",
                      transition: "width 1s ease"
                    }}></div>
                  </div>

                  {/* Compact Inline Legend */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1.25rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#38bdf8" }}></span>
                      <span>Kuantitatif ({getApproachCount("kuantitatif")})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#a78bfa" }}></span>
                      <span>Kualitatif ({getApproachCount("kualitatif")})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f472b6" }}></span>
                      <span>Campuran ({getApproachCount("metodeCampuran")})</span>
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
                      className="btn btn-outline"
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

            {/* Visual Charts Analytics Section */}
            <div style={{ marginTop: "2.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", marginBottom: "1rem" }}>
                {t("admin.chartSectionTitle")}
              </h2>
              
              {/* Visual Charts Analytics Section - 2 Columns */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem"
              }}>
                {/* Left Column: Donut Chart */}
                <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {t("admin.chartFormulaTitle")}
                  </h3>
                  {renderDonutChart()}
                </div>

                {/* Right Column: Bar Chart & Line Chart */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="glass-panel" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {t("admin.chartProjectsTitle")}
                    </h3>
                    {renderBarChart()}
                  </div>

                  <div className="glass-panel" style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {t("admin.chartActivityTitle")}
                    </h3>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      {renderLineChart()}
                    </div>
                  </div>
                </div>
              </div>
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
