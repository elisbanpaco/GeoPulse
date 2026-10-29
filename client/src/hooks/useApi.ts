"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";
import type { ApiStatus } from "@/lib/types";

/** Requests are keyed by URL; old data is hidden immediately and obsolete work is aborted. */
export function useApi<T>(url: string | null) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    key: string | null;
    revision: number;
    data: T | null;
    status: ApiStatus;
    error: string | null;
  }>({ key: null, revision: -1, data: null, status: "idle", error: null });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetchJson<T>(url, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({
            key: url,
            revision,
            data,
            status: "success",
            error: null,
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key: url,
            revision,
            data: null,
            status: "error",
            error: error instanceof Error ? error.message : "Error de conexión",
          });
      });
    return () => controller.abort();
  }, [url, revision]);
  const current = state.key === url && state.revision === revision;
  const refetch = useCallback(() => setRevision((value) => value + 1), []);
  return {
    data: current ? state.data : null,
    status: url
      ? current
        ? state.status
        : ("loading" as ApiStatus)
      : ("idle" as ApiStatus),
    error: current ? state.error : null,
    refetch,
  };
}
