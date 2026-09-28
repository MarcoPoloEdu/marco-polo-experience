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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type AdminSchool = {
  id: string;
  name: string;
  email: string;
  destinationId: string;
  complete: boolean;
  edvisorProviderId?: string;
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

type AdminDestination = {
  id: string;
  country: string;
  city: string;
  countryCode: string;
  languageCodes: string[];
  fromWeeklyUsd: number;
  schoolCount: number;
  programCount: number;
};

type AdminService = {
  id: string;
  title: string;
  kind: string;
  schoolId: string;
  schoolName: string;
  destinationId: string;
  offeringTypeCode?: string;
  complete: boolean;
  priceHintUsd?: number;
  checkoutEligible: boolean;
};

type CatalogPayload = {
  source: string;
  sourceLabel: string;
  metaNote?: string;
  edvisorApiConfigured?: boolean;
  destinations?: AdminDestination[];
  schools: AdminSchool[];
  programs: AdminProgram[];
  services?: AdminService[];
  stats?: {
    destinationsTotal?: number;
    schoolsTotal: number;
    schoolsComplete: number;
    programsTotal: number;
    programsComplete: number;
    servicesTotal?: number;
    servicesComplete?: number;
  };
  curation: {
    schools: Record<string, boolean>;
    programs: Record<string, boolean>;
    updatedAt?: string;
    updatedBy?: string;
  };
};

type SchoolFilter = "all" | "on" | "off" | "incomplete";

export function AdminPanel() {
  const firebaseReady = isFirebaseClientConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rejectedEmail, setRejectedEmail] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [applyingInitial, setApplyingInitial] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<SchoolFilter>("all");

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
          destinations?: number;
          services?: number;
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
        `Sync OK: ${s?.languageSchools ?? 0} escuelas · ${s?.programs ?? 0} programas · ${s?.destinations ?? 0} destinos · ${s?.services ?? 0} servicios · ${s?.schoolCompanies ?? 0} school companies`
      );
      await loadCatalog();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Sync falló");
    } finally {
      setSyncing(false);
    }
  }, [user, loadCatalog]);

  const applyInitialCuration = useCallback(async () => {
    if (!user) return;
    setApplyingInitial(true);
    setLoadError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/curation/apply-initial", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await res.text();
      let data: {
        error?: string;
        matched?: Array<{
          schoolName: string;
          label: string;
          enabled: boolean;
          edvisorProviderId: string;
        }>;
        unmatchedTargets?: string[];
        schoolsEnabled?: number;
        programsEnabled?: number;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setLoadError(`Curación inicial: respuesta inválida (${res.status})`);
        return;
      }
      if (!res.ok) {
        setLoadError(data.error || `Curación inicial error ${res.status}`);
        return;
      }
      const names = (data.matched ?? [])
        .map((m) => `${m.label}${m.enabled ? "" : " (incomplete)"}`)
        .join(" · ");
      const missing = (data.unmatchedTargets ?? []).join(" · ");
      setSyncMessage(
        `Set inicial: ${data.schoolsEnabled ?? 0} escuelas · ${data.programsEnabled ?? 0} programas activados.${names ? ` Match: ${names}.` : ""}${missing ? ` Sin match: ${missing}.` : ""}`
      );
      await loadCatalog();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Curación inicial falló");
    } finally {
      setApplyingInitial(false);
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

  const destById = useMemo(() => {
    const map = new Map<string, AdminDestination>();
    catalog?.destinations?.forEach((d) => map.set(d.id, d));
    return map;
  }, [catalog]);

  const enabledSchoolCount = catalog?.schools.filter((s) => s.enabled).length ?? 0;

  const filteredSchools = useMemo(() => {
    if (!catalog) return [];
    const q = schoolQuery.trim().toLowerCase();
    return catalog.schools
      .filter((s) => {
        if (schoolFilter === "on" && !s.enabled) return false;
        if (schoolFilter === "off" && s.enabled) return false;
        if (schoolFilter === "incomplete" && s.complete) return false;
        if (!q) return true;
        const dest = destById.get(s.destinationId);
        const blob = [
          s.name,
          s.id,
          s.email,
          s.edvisorProviderId,
          s.destinationId,
          dest?.city,
          dest?.country,
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [catalog, schoolQuery, schoolFilter, destById]);

  if (!firebaseReady) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo">Admin</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">
          Configura Firebase
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Faltan variables <code className="rounded bg-sand px-1">NEXT_PUBLIC_FIREBASE_*</code>.
        </p>
        <p className="mt-4 text-xs text-ink/50">Allowlist: {ADMIN_ALLOWLIST.join(", ")}</p>
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
          Solo <strong>{ADMIN_ALLOWLIST[0]}</strong> puede activar/desactivar campus Edvisor en el
          cotizador (como la asesoría). Defaults off.
        </p>
        {rejectedEmail && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Acceso denegado para {rejectedEmail}.
          </p>
        )}
        {authError && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{authError}</p>
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
            Escuelas Edvisor
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Sesión: {user.email}. Activa campus como en la asesoría — por defecto{" "}
            <em>todas off</em>. Solo <em>complete</em> se pueden prender.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-indigo text-white hover:bg-indigo/90"
            disabled={syncing}
            onClick={() => void syncEdvisor()}
          >
            {syncing ? "Sincronizando…" : "Sincronizar Edvisor"}
          </Button>
          <Button
            variant="outline"
            disabled={applyingInitial || !catalog}
            onClick={() => void applyInitialCuration()}
          >
            {applyingInitial ? "Aplicando…" : "Set inicial ILSC+Gateway"}
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      {catalog && (
        <div className="rounded-xl border border-mint/40 bg-mint/10 px-4 py-3 text-sm text-ink">
          Fuente: <strong>{catalog.sourceLabel}</strong> ({catalog.source})
          {catalog.stats ? (
            <span className="mt-1 block text-ink/70">
              Activas {enabledSchoolCount}/{catalog.stats.schoolsTotal} · Destinos{" "}
              {catalog.stats.destinationsTotal ?? catalog.destinations?.length ?? 0} · Programas{" "}
              {catalog.stats.programsTotal} ({catalog.stats.programsComplete} complete) · Servicios{" "}
              {catalog.stats.servicesTotal ?? catalog.services?.length ?? 0} (checkout off)
            </span>
          ) : null}
          {catalog.edvisorApiConfigured === false ? (
            <span className="mt-1 block text-amber-800">
              Falta <code className="rounded bg-white/80 px-1">EDVISOR_API_KEY</code> en el entorno.
            </span>
          ) : (
            <span className="mt-1 block text-ink/60">
              API lista. Sync trae inventario live; “Set inicial” prende solo ILSC Vancouver /
              Toronto / Montreal + Gateway St. Julians (no ILAC).
            </span>
          )}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
                  Campus / escuelas ({filteredSchools.length}
                  {filteredSchools.length !== catalog.schools.length
                    ? ` de ${catalog.schools.length}`
                    : ""}
                  )
                </h2>
                <p className="mt-1 text-xs text-ink/50">
                  Toggle = visible en cotizador Experience. Defaults off hasta que actives.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={schoolQuery}
                onChange={(e) => setSchoolQuery(e.target.value)}
                placeholder="Buscar escuela, ciudad, Edvisor ID…"
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none ring-indigo/30 placeholder:text-ink/40 focus:ring-2 sm:max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Todas"],
                    ["on", "Activas"],
                    ["off", "Off"],
                    ["incomplete", "Incomplete"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSchoolFilter(id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      schoolFilter === id
                        ? "bg-ink text-white"
                        : "bg-sand text-ink/70 hover:bg-ink/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
              {filteredSchools.map((s) => {
                const dest = destById.get(s.destinationId);
                const busy = busyId === `school:${s.id}`;
                return (
                  <li
                    key={s.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {s.name}{" "}
                        {!s.complete ? (
                          <Badge variant="secondary" className="ml-1 align-middle text-amber-800">
                            incomplete
                          </Badge>
                        ) : null}
                        {s.enabled ? (
                          <Badge className="ml-1 align-middle bg-mint/40 text-ink">activa</Badge>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-ink/50">
                        {dest ? `${dest.city}, ${dest.country}` : s.destinationId}
                        {s.edvisorProviderId ? ` · Edvisor #${s.edvisorProviderId}` : ""} · {s.id}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-ink/50">
                        {s.enabled ? "On" : "Off"}
                      </span>
                      <Switch
                        checked={s.enabled}
                        disabled={busy || (!s.complete && !s.enabled)}
                        onCheckedChange={(next) => {
                          void toggle("school", s.id, Boolean(next));
                        }}
                        aria-label={`Activar ${s.name}`}
                      />
                    </div>
                  </li>
                );
              })}
              {filteredSchools.length === 0 ? (
                <li className="px-4 py-6 text-sm text-ink/50">
                  Sin escuelas con este filtro. Corre sync o limpia la búsqueda.
                </li>
              ) : null}
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
              Destinos ({catalog.destinations?.length ?? 0})
            </h2>
            <p className="mt-1 text-xs text-ink/50">
              Derivados del sync. El cotizador solo muestra destinos con escuelas activas.
            </p>
            <ul className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
              {(catalog.destinations ?? []).map((d) => {
                const activeHere = catalog.schools.filter(
                  (s) => s.destinationId === d.id && s.enabled
                ).length;
                return (
                  <li key={d.id} className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {d.city}, {d.country}{" "}
                      <span className="text-xs font-normal text-ink/50">({d.countryCode})</span>
                      {activeHere > 0 ? (
                        <Badge className="ml-2 bg-mint/40 text-ink">{activeHere} activas</Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-ink/50">
                      {d.schoolCount} escuelas · {d.programCount} programas
                      {d.fromWeeklyUsd > 0 ? ` · desde $${d.fromWeeklyUsd}/sem` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
              Programas ({catalog.programs.length})
            </h2>
            <ul className="mt-4 max-h-[28rem] divide-y divide-ink/10 overflow-y-auto rounded-xl border border-ink/10 bg-white">
              {catalog.programs.map((p) => {
                const school = schoolsById.get(p.schoolId);
                const busy = busyId === `program:${p.id}`;
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
                        {p.schoolName || school?.name} · ${p.weeklyPriceUsd}/sem · {p.kind}
                      </p>
                    </div>
                    <Switch
                      checked={p.enabled}
                      disabled={
                        busy ||
                        school?.enabled === false ||
                        (!p.complete && !p.enabled)
                      }
                      onCheckedChange={(next) => {
                        void toggle("program", p.id, Boolean(next));
                      }}
                      aria-label={`Activar ${p.title}`}
                    />
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
              Servicios / extras ({catalog.services?.length ?? 0})
            </h2>
            <p className="mt-1 text-xs text-ink/50">
              Inventario informativo — no se cobran hasta exact-quote live.
            </p>
            <ul className="mt-4 max-h-64 divide-y divide-ink/10 overflow-y-auto rounded-xl border border-ink/10 bg-white">
              {(catalog.services ?? []).slice(0, 100).map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <p className="font-medium text-ink">
                    {s.title}{" "}
                    <span className="text-xs font-normal text-ink/50">({s.kind})</span>
                  </p>
                  <p className="text-xs text-ink/50">
                    {s.schoolName || s.schoolId}
                    {s.priceHintUsd != null ? ` · hint $${s.priceHintUsd}` : ""} · checkout off
                  </p>
                </li>
              ))}
              {(catalog.services?.length ?? 0) === 0 ? (
                <li className="px-4 py-3 text-sm text-ink/50">
                  Sin servicios hasta sync live.
                </li>
              ) : null}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
