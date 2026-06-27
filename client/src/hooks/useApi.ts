"use client";
// ============================================
// GeoPulse — Custom API Hook
// ============================================

import { useState, useEffect, useCallback } from "react";
import type { ApiStatus } from "@/lib/types";

interface UseApiResult<T> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook with loading/error states.
 * Automatically re-fetches when deps change.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ApiStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, status, error, refetch: execute };
}
