"use client";

import { useEffect, useState } from "react";
import {
  fetchPublicCatalog,
  type PublicCatalog,
} from "@/lib/catalog/public-catalog";

type State =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; catalog: PublicCatalog };

export function usePublicCatalog(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchPublicCatalog()
      .then((catalog) => {
        if (!cancelled) setState({ status: "ready", catalog });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error: err instanceof Error ? err.message : "No se pudo cargar el catálogo",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
