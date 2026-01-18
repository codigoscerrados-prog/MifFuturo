"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

import styles from "./SeccionPanel.module.css";

import { clearToken, getRoleFromToken, getToken, rutaPorRole } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

import PanelReservasPropietario from "./SeccionReservas";
import PanelCanchasPropietario from "./SeccionCanchas";

import SeccionPerfil from "./SeccionPerfil";
import SeccionComplejos from "./SeccionComplejos";

export type Role = "usuario" | "propietario" | "admin";

export type PlanActual = {
    plan_id: number;
    plan_name: string;
    status: "active" | "inactive" | "past_due" | "canceled";
    current_period_end?: string | null;
};

export type Perfil = {
    id: number;
    username: string;
    role: Role;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
    business_name?: string | null;
    jugador_categoria?: string | null;
    jugador_posicion?: string | null;
    avatar_url?: string | null;
};

export type SeccionPanelProps = {
    token?: string;
    role?: Role;
    perfil?: Perfil;
    onPerfilUpdated?: Dispatch<SetStateAction<Perfil | null>> | ((p: Perfil | null) => void);
    onLogout?: () => void;
};

function cn(...arr: Array<string | false | null | undefined>) {
    return arr.filter(Boolean).join(" ");
}

function normalizeStatus(st?: string | null) {
    return String(st || "active").toLowerCase();
}

const ICON_BY_TAB: Record<string, string> = {
    perfil: "bi-person",
    "mi-complejo": "bi-building",
    "mis-canchas": "bi-grid-1x2",
    reservas: "bi-calendar2-check",
    historial: "bi-clock-history",
    admin: "bi-shield-check",
};

export default function SeccionPanel({
    token: tokenProp,
    role: roleProp,
    perfil: perfilProp,
    onPerfilUpdated,
    onLogout,
}: SeccionPanelProps) {
    const router = useRouter();

    const [token, setToken] = useState<string | null>(() => tokenProp ?? null);

    useEffect(() => {
        setToken(tokenProp ?? getToken());
    }, [tokenProp]);

    const role = useMemo<Role>(() => {
        if (roleProp) return roleProp;
        const r = getRoleFromToken(token || "");
        return (r as Role) || "usuario";
    }, [roleProp, token]);

    // ✅ Siempre iniciar en Perfil
    const initialTabSet = useRef(false);
    const [tab, setTab] = useState<string>("perfil");
    useEffect(() => {
        if (initialTabSet.current) return;
        initialTabSet.current = true;
        setTab("perfil");
    }, []);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [perfil, setPerfil] = useState<Perfil | null>(() => perfilProp ?? null);
    const [plan, setPlan] = useState<PlanActual | null>(null);
    const [planLoading, setPlanLoading] = useState(true);

    useEffect(() => {
        if (perfilProp) setPerfil(perfilProp);
    }, [perfilProp]);

    const isPro = useMemo(() => {
        if (!plan) return false;

        const planId = Number((plan as any).plan_id);
        const st = normalizeStatus((plan as any).status);
        const name = String((plan as any).plan_name || "").toLowerCase();

        if (planId === 2) return st === "active" || st === "" || st === "null";
        if (name.includes("pro")) return true;

        return false;
    }, [plan]);

    const nombreCompleto = useMemo(() => {
        const first = (perfil?.first_name || "").trim();
        const last = (perfil?.last_name || "").trim();
        return [first, last].filter(Boolean).join(" ");
    }, [perfil?.first_name, perfil?.last_name]);

    const displayName = useMemo(() => {
        return (
            nombreCompleto ||
            (perfil?.business_name || "").trim() ||
            (perfil?.username || "").trim() ||
            (perfil?.email || "").trim() ||
            "-"
        );
    }, [nombreCompleto, perfil?.business_name, perfil?.username, perfil?.email]);

    const planLabel = useMemo(() => {
        if (planLoading) return "...";
        return isPro ? "PRO" : "FREE";
    }, [isPro, planLoading]);

    useEffect(() => {
        if (!token) {
            setCargando(false);
            return;
        }

        (async () => {
            try {
                setError(null);
                setCargando(true);
                setPlanLoading(true);

                const me = await apiFetch<Perfil>("/perfil/me", { token });
                setPerfil(me);

                try {
                    const p = await apiFetch<PlanActual>("/perfil/plan", { token });
                    setPlan(p);
                } catch {
                    setPlan(null);
                } finally {
                    setPlanLoading(false);
                }
            } catch (e: any) {
                setError(e?.message || "No se pudo cargar el panel.");
                setPlanLoading(false);
            } finally {
                setCargando(false);
            }
        })();
    }, [token]);

    function cerrarSesion() {
        if (onLogout) return onLogout();
        clearToken();
        router.push("/");
    }

    function handleSelectTab(nextTab: string) {
        if (role === "propietario" && !isPro && (nextTab === "mis-canchas" || nextTab === "reservas")) {
            router.push("/plan-premium");
            return;
        }
        setTab(nextTab);
    }

    const tabs = useMemo(() => {
        if (role === "propietario") {
            return [
                { key: "perfil", label: "Perfil", locked: false },
                { key: "mi-complejo", label: "Mi Complejo", locked: false },
                { key: "mis-canchas", label: "Mis Canchas", locked: !isPro },
                { key: "reservas", label: "Reservas", locked: !isPro },
            ];
        }
        if (role === "usuario") {
            return [
                { key: "perfil", label: "Perfil", locked: false },
                { key: "historial", label: "Mis Reservas", locked: false },
            ];
        }
        return [{ key: "admin", label: "Admin", locked: false }];
    }, [role, isPro]);

    // ✅ Si el tab actual no existe, volver a Perfil
    useEffect(() => {
        if (!tabs.some((t) => t.key === tab)) setTab("perfil");
    }, [tabs, tab]);

    if (!token) {
        return (
            <section className={styles.seccion}>
                <div className={styles.contenedor}>
                    <div className={`tarjeta ${styles.tarjeta}`}>
                        <h2 className={styles.titulo}>Panel</h2>
                        <p className={styles.muted}>Debes iniciar sesión para ver tu panel.</p>
                        <div className={styles.filaBtns}>
                            <button className="boton botonPrimario" onClick={() => router.push("/auth/login")}>
                                Ir a Login
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.seccion}>
            <div className={styles.contenedor}>
                <div className={styles.layout}>
                    <aside className={styles.sidebar}>
                        <div className={styles.sidebarCard}>
                            <Link className={styles.brandLink} href="/" aria-label="Ir al inicio">
                                <div className={styles.brand}>
                                    <div className={styles.brandIcon} aria-hidden="true">
                                        <i className="bi bi-building"></i>
                                    </div>
                                    <div>
                                        <p className={styles.kicker}>Proyecto Canchas</p>
                                        <p className={styles.brandTitle}>Panel</p>
                                    </div>
                                </div>
                            </Link>

                            <div className={styles.userCard}>
                                <div className={styles.avatar}>
                                    {perfil?.avatar_url ? (
                                        <img src={perfil.avatar_url} alt={displayName} className={styles.avatarImg} />
                                    ) : (
                                        <span className={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className={styles.userInfo}>
                                    <p className={styles.userName}>{displayName}</p>
                                    {perfil?.email ? <p className={styles.userMeta}>{perfil.email}</p> : null}
                                </div>
                            </div>

                            <details className={styles.sidebarNav} open>
                                <summary className={styles.sidebarSummary}>
                                    <i className="bi bi-list" aria-hidden="true"></i>
                                    Panel
                                </summary>
                                <nav className={styles.tabs}>
                                    {tabs.map((t) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            className={cn(styles.tab, tab === t.key && styles.tabActiva, t.locked && styles.tabLocked)}
                                            onClick={() => handleSelectTab(t.key)}
                                            title={t.locked ? "Disponible solo en PRO" : t.label}
                                        >
                                            <span className={styles.tabLeft}>
                                                <i className={`bi ${ICON_BY_TAB[t.key] || "bi-grid"} ${styles.tabIcon}`} aria-hidden="true"></i>
                                                <span>{t.label}</span>
                                            </span>
                                            {t.locked ? <span className={styles.lockBadge}>PRO</span> : null}
                                        </button>
                                    ))}
                                </nav>
                            </details>

                            <div id="panel-reservas-calendar-slot" className={styles.sidebarCalendarSlot} />

                            <div className={styles.sidebarFooter}>
                                <button type="button" className={styles.sidebarLogout} onClick={cerrarSesion}>
                                    Cerrar sesion
                                </button>
                            </div>
                        </div>
                    </aside>

                    <div className={styles.main}>
                        <div className={styles.header}>
                            

                            <div className={styles.headerBtns}>
                                <div className={styles.planWrap}>
                                    <div
                                        className={cn(
                                            styles.planChip,
                                            planLoading && styles.planChipLoading,
                                            !planLoading && (isPro ? styles.planChipPro : styles.planChipFree)
                                        )}
                                    >
                                        <span className={styles.planChipLabel}>Plan</span>
                                        <span className={styles.planChipValue}>{planLabel}</span>
                                    </div>

                                    <span className={styles.planHint}>
                                        {planLoading
                                            ? "Verificando tu plan..."
                                            : isPro
                                                ? "Acceso completo a canchas y reservas."
                                                : "Desbloquea Mis Canchas y Reservas con PRO."}
                                    </span>
                                </div>

                                {role === "propietario" && !planLoading && !isPro ? (
                                    <Link href="/plan-premium" className="boton botonPrimario">
                                        Subir a PRO
                                    </Link>
                                ) : null}
                            </div>
                        </div>

                        {error ? <div className={styles.alertError}>{error}</div> : null}

                        {cargando ? (
                            <div className={`tarjeta ${styles.tarjeta}`}>
                                <p className={styles.muted}>Cargando...</p>
                            </div>
                        ) : (
                            <>
                                {role === "propietario" && tab === "mi-complejo" ? <SeccionComplejos token={token} /> : null}
                                {role === "propietario" && tab === "mis-canchas" ? <PanelCanchasPropietario token={token} /> : null}
                                {role === "propietario" && tab === "reservas" ? <PanelReservasPropietario token={token} /> : null}

                                {tab === "perfil" ? (
                                    perfil ? (
                                        <SeccionPerfil
                                            token={token}
                                            role={role}
                                            perfil={perfil}
                                            onPerfilUpdated={(p: any) => {
                                                setPerfil(p);
                                                if (typeof onPerfilUpdated === "function") onPerfilUpdated(p);
                                            }}
                                            onLogout={cerrarSesion}
                                        />
                                    ) : (
                                        <div className={`tarjeta ${styles.tarjeta}`}>
                                            <p className={styles.muted}>
                                                No se pudo cargar tu perfil.{" "}
                                                <button className="boton" type="button" onClick={() => window.location.reload()}>
                                                    Recargar
                                                </button>
                                            </p>
                                        </div>
                                    )
                                ) : null}

                                {role === "usuario" && tab === "historial" ? (
                                    <div className={`tarjeta ${styles.tarjeta}`}>
                                        <p className={styles.muted}>Aqui va tu historial (tu componente actual).</p>
                                    </div>
                                ) : null}

                                {role === "admin" && tab === "admin" ? (
                                    <div className={`tarjeta ${styles.tarjeta}`}>
                                        <p className={styles.muted}>Admin: usa la ruta {rutaPorRole("admin")} para tus modulos.</p>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
