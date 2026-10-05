"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { DebtFilters } from "@/components/DebtFilters";
import { DebtList } from "@/components/DebtList";
import { LogoutButton } from "@/components/LogoutButton";
import { SummaryCards } from "@/components/SummaryCards";
import { useDebts } from "@/hooks/useDebts";
import type {
  Debt,
  DebtFilters as DebtFiltersState,
  DebtStatusFilter,
  DebtTypeFilter,
} from "@/types/debt";

function parseStatus(value: string | null): DebtStatusFilter {
  return value === "unsettled" || value === "settled" ? value : "all";
}

function parseType(value: string | null): DebtTypeFilter {
  return value === "owed_to_me" || value === "i_owe" ? value : "all";
}

// Sinkron filter <-> URL dipilih karena sederhana: baca dari URL saat
// render awal, tulis via history.replaceState (tanpa navigasi / loop).
// Hasil: filter bisa di-share lewat link.
export function Dashboard({ email }: { email: string | null }) {
  const searchParams = useSearchParams();
  // State awal dari URL saat render (bukan effect) — server tahu URL
  // request sehingga tidak ada hydration mismatch.
  const [filters, setFilters] = useState<DebtFiltersState>(() => ({
    status: parseStatus(searchParams.get("status")),
    type: parseType(searchParams.get("type")),
    search: searchParams.get("q") ?? "",
  }));
  // Disambungkan ke modal edit di T10.
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const {
    data,
    summary,
    status,
    errorMessage,
    refresh,
    settleDebt,
    deleteDebt,
  } = useDebts(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.type !== "all") params.set("type", filters.type);
    if (filters.search.trim() !== "") params.set("q", filters.search.trim());
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }, [filters]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-5 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-angka text-xl font-bold tracking-tight">Kasbon</p>
          {email && (
            <p className="truncate text-sm text-tinta/60">{email}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* TODO(T10): aktifkan saat modal tambah/edit selesai. */}
          <button
            type="button"
            disabled
            title="Segera hadir"
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-pulpen px-4 font-semibold text-white disabled:opacity-40 sm:flex-none"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Tambah Catatan
          </button>
          <LogoutButton />
        </div>
      </header>

      <SummaryCards summary={summary} loading={status === "loading"} />

      <DebtFilters filters={filters} onChange={setFilters} />

      <DebtList
        debts={data}
        status={status}
        errorMessage={errorMessage}
        searchActive={
          filters.search.trim() !== "" ||
          filters.status !== "all" ||
          filters.type !== "all"
        }
        onRetry={refresh}
        onSettle={(id, settled) => settleDebt(id, settled)}
        onEdit={(debt) => setEditingDebt(debt)}
        onDelete={(id) => deleteDebt(id)}
      />

      {editingDebt && (
        <p className="text-sm text-tinta/60">
          Mode ubah untuk {editingDebt.counterpart_name} nyusul di T10 ya.
        </p>
      )}
    </div>
  );
}
