"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getApiErrorMessage,
  request,
  type Utensilio,
} from "@/lib/api";
import Link from "next/link";

export function useGameData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    request<T>(url).then(
      (result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      },
      (error) => {
        if (active) {
          setError(error);
          setData(null);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [url, attempt]);
  const refresh = useCallback(() => setAttempt((current) => current + 1), []);
  function retry() {
    setData(null);
    setError(null);
    refresh();
  }
  return { data, setData, error, retry, refresh };
}

export function useCatalogoUtensilios() {
  const catalogo = useGameData<Utensilio[]>("/api/jogo/utensilio");
  const { refresh } = catalogo;
  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);
  return catalogo;
}

export function GameError({ error }: { error: unknown }) {
  return (
    <p role="alert" className="hub-feedback error">
      {getApiErrorMessage(error)}
      {error instanceof ApiError && error.status === 401 && (
        <>
          {" "}
          <Link
            href={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
          >
            Entrar novamente
          </Link>
        </>
      )}
    </p>
  );
}
