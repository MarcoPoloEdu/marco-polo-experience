/**
 * Catalog version persistence — Firestore when configured.
 * Local JSON only with ALLOW_LOCAL_PERSISTENCE=1 (non-production).
 * Incomplete sync never activates as the live catalog.
 */

import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { EdvisorCatalog } from "@marco-polo/experience-edvisor";
import { allowLocalPersistence, firestoreConfigured } from "@/lib/persistence";

const LOCAL_PATH = path.join(process.cwd(), "data", "edvisor-live-catalog.json");

export type CatalogVersionStatus = "preparing" | "validated" | "active" | "failed";

export type CatalogVersionRecord = {
  versionId: string;
  status: CatalogVersionStatus;
  createdAt: string;
  activatedAt?: string;
  catalog: EdvisorCatalog;
  error?: string;
};

export async function readActiveCatalog(): Promise<EdvisorCatalog | null> {
  if (firestoreConfigured()) {
    try {
      const { getAdminDb } = await import("@/lib/firebase/admin");
      const db = await getAdminDb();
      if (db) {
        const active = await db.collection("catalogMeta").doc("active").get();
        if (active.exists) {
          const versionId = (active.data() as { versionId?: string }).versionId;
          if (versionId) {
            const ver = await db.collection("catalogVersions").doc(versionId).get();
            if (ver.exists) {
              const data = ver.data() as CatalogVersionRecord;
              if (data.status === "active") return data.catalog;
            }
          }
        }
      }
    } catch (err) {
      console.warn("[catalog-store] Firestore read failed", err);
    }
  }

  if (!allowLocalPersistence()) return null;
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    return JSON.parse(raw) as EdvisorCatalog;
  } catch {
    return null;
  }
}

export async function activateCatalogVersion(
  catalog: EdvisorCatalog
): Promise<{ versionId: string }> {
  const versionId = `cat_${catalog.meta.version}_${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  // Firestore rejects `undefined` field values — strip via JSON round-trip.
  const catalogClean = JSON.parse(JSON.stringify(catalog)) as EdvisorCatalog;
  const record: CatalogVersionRecord = {
    versionId,
    status: "active",
    createdAt: now,
    activatedAt: now,
    catalog: catalogClean,
  };

  if (firestoreConfigured()) {
    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = await getAdminDb();
    if (db) {
      const batch = db.batch();
      batch.set(db.collection("catalogVersions").doc(versionId), record);
      batch.set(db.collection("catalogMeta").doc("active"), {
        versionId,
        activatedAt: now,
        source: catalog.meta.source,
        note: catalog.meta.note ?? null,
      });
      await batch.commit();
      return { versionId };
    }
  }

  if (!allowLocalPersistence()) {
    throw new Error(
      "Cannot persist catalog: Firestore not configured and local persistence disabled."
    );
  }

  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(catalog, null, 2), "utf8");
  return { versionId };
}
