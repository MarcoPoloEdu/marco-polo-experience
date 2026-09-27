"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  ADMIN_ALLOWLIST,
  getClientAuth,
  isAdminEmail,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

type AdminSchool = {
  id: string;
  name: string;
  email: string;
  destinationId: string;
  complete: boolean;
  enabled: boolean;
};

type AdminProgram = {
  id: string;
  title: string;
  schoolId: string;
  schoolName: string;
  weeklyPriceUsd: number;
  kind: string;
  destinationId: string;
  complete: boolean;
  enabled: boolean;
};

type CatalogPayload = {
  source: string;
  sourceLabel: string;
  metaNote?: string;
  edvisorApiConfigured?: boolean;
  schools: AdminSchool[];
  programs: AdminProgram[];
  stats?: {
    schoolsTotal: number;
    schoolsComplete: number;
    programsTotal: number;
    programsComplete: number;
  };
  curation: {
    schools: Record<string, boolean>;
    programs: Record<string, boolean>;
    updatedAt?: string;
    updatedBy?: string;
  };
};

export function AdminPanel() {
  const firebaseReady = isFirebaseClientConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rejectedEmail, setRejectedEmail] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    const auth = getClientAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      setAuthError(null);
      if (!u) {
        setUser(null);
        setRejectedEmail(null);
        setCatalog(null);
        return;
      }
      if (!isAdminEmail(u.email)) {
        setRejectedEmail(u.email ?? "(sin email)");
        await signOut(auth);
        setUser(null);
        setCatalog(null);
        return;
      }
      setRejectedEmail(null);
      setUser(u);
    });
  }, [firebaseReady]);

  const loadCatalog = useCallback(async () => {
    if (!user) return;
    setLoadError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/catalog", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await res.text();
      let data: { error?: string } & Partial<CatalogPayload> = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setLoadError(
          raw
            ? `Respuesta inválida del servidor (${res.status})`
            : `El servidor no respondió JSON (${res.status}). Revisa Firebase Admin en Vercel.`
        );
        return;
      }
      if (!res.ok) {
        setLoadError(data.error || `Error ${res.status}`);
        return;
      }
      setCatalog(data as CatalogPayload);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No se pudo cargar el catálogo");
    }
  }, [user]);

  const syncEdvisor = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    setSyncMessage(null);
    setLoadError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/sync-edvisor", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await res.text();
      let data: {
        error?: string;
        sync?: {
          error?: string;
          languageSchools?: number;
          programs?: number;
          schoolCompanies?: number;
        };
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setLoadError(
          raw
            ? `Sync: respuesta inválida (${res.status})`
            : `Sync: el servidor no respondió JSON (${res.status})`
        );
        setSyncMessage(null);
        return;
      }
      if (!res.ok) {
        setLoadError(data.sync?.error || data.error || `Sync error ${res.status}`);
        setSyncMessage(null);
        return;
      }
      const s = data.sync;
      setSyncMessage(
        `Sync OK: ${s?.languageSchools ?? 0} escuelas de idiomas · ${s?.programs ?? 0} programas · ${s?.schoolCompanies ?? 0} school companies`
      );
      await loadCatalog();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Sync falló");
    } finally {
      setSyncing(false);
    }
  }, [user, loadCatalog]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const signIn = async () => {
    setAuthError(null);
    setRejectedEmail(null);
    const auth = getClientAuth();
    if (!auth) {
      setAuthError("Firebase client no configurado");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de Google Sign-In";
      setAuthError(msg);
    }
  };

  const handleSignOut = async () => {
    const auth = getClientAuth();
    if (auth) await signOut(auth);
  };

  const toggle = async (kind: "school" | "program", id: string, enabled: boolean) => {
    if (!user) return;
    setBusyId(`${kind}:${id}`);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kind, id, enabled }),
      });
      const raw = await res.text();
      let data: { error?: string } & Partial<CatalogPayload> = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setLoadError(
          raw
            ? `Respuesta inválida al guardar (${res.status})`
            : `El servidor no respondió JSON al guardar (${res.status})`
        );
        return;
      }
      if (!res.ok) {
        setLoadError(data.error || `Error ${res.status}`);
        return;
      }
      setCatalog(data as CatalogPayload);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusyId(null);
    }
  };

  const schoolsById = useMemo(() => {
    const map = new Map<string, AdminSchool>();
    catalog?.schools.forEach((s) => map.set(s.id, s));
    return map;
  }, [catalog]);

  if (!firebaseReady) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo">Admin</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">
          Configura Firebase
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Faltan variables <code className="rounded bg-sand px-1">NEXT_PUBLIC_FIREBASE_*</code>.
          No inventamos un Project ID de producción. Pide al equipo un proyecto existente o
          confirmación para crear uno nuevo, luego completa{" "}
          <code className="rounded bg-sand px-1">.env.local</code> (ver README y{" "}
          <code className="rounded bg-sand px-1">.env.example</code>).
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink/70">
          <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
          <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
          <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
          <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
        </ul>
        <p className="mt-4 text-xs text-ink/50">
          Allowlist: {ADMIN_ALLOWLIST.join(", ")}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo">Admin</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">
          Marco Polo Experience
        </h1>
        <p className="mt-3 text-sm text-ink/70">
          Solo <strong>{ADMIN_ALLOWLIST[0]}</strong> puede curar escuelas y programas Edvisor
          (enable/disable). Precios vienen de Edvisor; aquí no se inventan.
        </p>
        {rejectedEmail && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Acceso denegado para {rejectedEmail}. No está en la allowlist.
          </p>
        )}
        {authError && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {authError}
          </p>
        )}
        <Button className="mt-6 w-full bg-indigo text-white hover:bg-indigo/90" onClick={signIn}>
          Continuar con Google
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo">Admin</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-ink">
            Curación Edvisor
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Sesión: {user.email}. Solo productos <em>complete</em> se pueden activar en el cotizador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-indigo text-white hover:bg-indigo/90"
            disabled={syncing}
            onClick={() => void syncEdvisor()}
          >
            {syncing ? "Sincronizando…" : "Sincronizar escuelas Edvisor"}
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      {catalog && (
        <div className="rounded-xl border border-mint/40 bg-mint/10 px-4 py-3 text-sm text-ink">
          Fuente catálogo: <strong>{catalog.sourceLabel}</strong> ({catalog.source})
          {catalog.stats ? (
            <span className="mt-1 block text-ink/70">
              Escuelas {catalog.stats.schoolsTotal} ({catalog.stats.schoolsComplete} complete) ·
              Programas {catalog.stats.programsTotal} ({catalog.stats.programsComplete} complete)
            </span>
          ) : null}
          {catalog.edvisorApiConfigured === false ? (
            <span className="mt-1 block text-amber-800">
              Falta <code className="rounded bg-white/80 px-1">EDVISOR_API_KEY</code> en el entorno
              para traer TODAS las escuelas conectadas vía GraphQL (
              <code className="rounded bg-white/80 px-1">schoolCompanyConnectedList</code>).
            </span>
          ) : (
            <span className="mt-1 block text-ink/60">
              API Edvisor configurada — usa “Sincronizar” para refrescar el inventario live.
            </span>
          )}
          {catalog.metaNote ? <span className="mt-1 block text-ink/60">{catalog.metaNote}</span> : null}
          {catalog.curation.updatedAt ? (
            <span className="mt-1 block text-xs text-ink/50">
              Última curación: {catalog.curation.updatedAt}
              {catalog.curation.updatedBy ? ` · ${catalog.curation.updatedBy}` : ""}
            </span>
          ) : null}
        </div>
      )}

      {syncMessage && (
        <p className="rounded-lg bg-mint/20 px-3 py-2 text-sm text-ink">{syncMessage}</p>
      )}

      {loadError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      )}

      {!catalog && !loadError && (
        <p className="text-sm text-ink/50">Cargando catálogo Edvisor…</p>
      )}

      {catalog && (
        <>
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
              Escuelas ({catalog.schools.length})
            </h2>
            <ul className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
              {catalog.schools.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {s.name}{" "}
                      {!s.complete ? (
                        <span className="text-xs font-normal text-amber-700">(incomplete)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-ink/50">
                      {s.id} · {s.email} · dest {s.destinationId}
                    </p>
                  </div>
                  <Button
                    variant={s.enabled ? "outline" : "default"}
                    disabled={busyId === `school:${s.id}` || (!s.complete && !s.enabled)}
                    className={s.enabled ? "" : "bg-ink text-white"}
                    onClick={() => void toggle("school", s.id, !s.enabled)}
                  >
                    {s.enabled ? "Desactivar" : "Activar"}
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
              Programas ({catalog.programs.length})
            </h2>
            <ul className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
              {catalog.programs.map((p) => {
                const school = schoolsById.get(p.schoolId);
                return (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {p.title}{" "}
                        {!p.complete ? (
                          <span className="text-xs font-normal text-amber-700">(incomplete)</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-ink/50">
                        {p.schoolName || school?.name} · ${p.weeklyPriceUsd}/sem · {p.kind} ·{" "}
                        {p.id}
                      </p>
                    </div>
                    <Button
                      variant={p.enabled ? "outline" : "default"}
                      disabled={
                        busyId === `program:${p.id}` ||
                        school?.enabled === false ||
                        (!p.complete && !p.enabled)
                      }
                      className={p.enabled ? "" : "bg-ink text-white"}
                      onClick={() => void toggle("program", p.id, !p.enabled)}
                    >
                      {p.enabled ? "Desactivar" : "Activar"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
