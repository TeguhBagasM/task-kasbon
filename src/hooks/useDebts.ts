"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CreateDebtInput,
  UpdateDebtInput,
} from "@/lib/validation/debt";
import type {
  Debt,
  DebtFilters,
  DebtSummary,
  DebtsApiResponse,
  MutationApiResponse,
} from "@/types/debt";

export type DebtsStatus = "loading" | "ready" | "error";

export interface MutationResult {
  ok: boolean;
  message: string;
}

const EMPTY_SUMMARY: DebtSummary = { owed_to_me: 0, i_owe: 0, net: 0 };
const LOAD_ERROR = "Gagal memuat data nih, coba lagi ya.";
const NETWORK_ERROR = "Jaringan bermasalah nih, cek koneksi lalu coba lagi.";
const SESSION_EXPIRED = "Sesi kamu sudah berakhir. Silakan login kembali ya.";

export function useDebts(filters: DebtFilters) {
  const router = useRouter();
  const [data, setData] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary>(EMPTY_SUMMARY);
  const [status, setStatus] = useState<DebtsStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);

  // Debounce search 300ms DI DALAM hook (bukan komponen): komponen cukup
  // set filter apa adanya; hook yang mengatur ritme request di satu tempat.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const goLogin = useCallback(() => {
    router.push("/login");
    router.refresh();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    const id = ++requestId.current;

    async function load() {
      // Load awal -> skeleton penuh. Refetch (filter/mutasi) -> data lama
      // dipertahankan + indikator ringan via `refreshing`.
      if (hasLoaded.current) setRefreshing(true);
      else setStatus("loading");
      try {
        const params = new URLSearchParams({
          status: filters.status,
          type: filters.type,
          search: debouncedSearch,
        });
        const res = await fetch(`/api/debts?${params.toString()}`, {
          signal: controller.signal,
        });
        // 401: sesi habis -> ke /login, jangan tampilkan error generik.
        if (res.status === 401) {
          if (id === requestId.current) goLogin();
          return;
        }
        const json = (await res.json()) as DebtsApiResponse;
        // Respons lama yang datang belakangan diabaikan (anti race).
        if (id !== requestId.current) return;
        if (!json.success) {
          setStatus("error");
          setErrorMessage(json.error);
          setRefreshing(false);
          return;
        }
        setData(json.data);
        setSummary(json.summary);
        setStatus("ready");
        setErrorMessage(null);
        setRefreshing(false);
        hasLoaded.current = true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (id !== requestId.current) return;
        setStatus("error");
        setErrorMessage(LOAD_ERROR);
        setRefreshing(false);
      }
    }

    void load();
    // Ganti filter -> request lama dibatalkan, hasil lama tak menimpa baru.
    return () => controller.abort();
  }, [
    filters.status,
    filters.type,
    debouncedSearch,
    reloadToken,
    goLogin,
  ]);

  const mutate = useCallback(
    async (
      path: string,
      init: RequestInit,
      successMessage: string,
    ): Promise<MutationResult> => {
      try {
        const res = await fetch(path, init);
        if (res.status === 401) {
          goLogin();
          return { ok: false, message: SESSION_EXPIRED };
        }
        const json = (await res.json()) as MutationApiResponse;
        if (!json.success) return { ok: false, message: json.error };
        setReloadToken((token) => token + 1);
        return { ok: true, message: json.message ?? successMessage };
      } catch {
        return { ok: false, message: NETWORK_ERROR };
      }
    },
    [goLogin],
  );

  const createDebt = useCallback(
    (input: CreateDebtInput): Promise<MutationResult> =>
      mutate(
        "/api/debts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
        "Catatan tersimpan.",
      ),
    [mutate],
  );

  const updateDebt = useCallback(
    (id: string, input: UpdateDebtInput): Promise<MutationResult> =>
      mutate(
        `/api/debts/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
        "Perubahan tersimpan.",
      ),
    [mutate],
  );

  const settleDebt = useCallback(
    (id: string, settled: boolean): Promise<MutationResult> =>
      mutate(
        `/api/debts/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_settled: settled }),
        },
        settled ? "Dicatat lunas." : "Dibuka kembali.",
      ),
    [mutate],
  );

  const deleteDebt = useCallback(
    (id: string): Promise<MutationResult> =>
      mutate(
        `/api/debts/${id}`,
        { method: "DELETE" },
        "Catatan utang berhasil dihapus.",
      ),
    [mutate],
  );

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    data,
    summary,
    status,
    errorMessage,
    refreshing,
    refresh,
    createDebt,
    updateDebt,
    settleDebt,
    deleteDebt,
  };
}
