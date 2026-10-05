"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { DebtFilters } from "@/components/DebtFilters";
import { DebtList } from "@/components/DebtList";
import { DebtModal } from "@/components/DebtModal";
import { LogoutButton } from "@/components/LogoutButton";
import { SummaryCards } from "@/components/SummaryCards";
import { useDebts } from "@/hooks/useDebts";
import type {
  CreateDebtInput,
  UpdateDebtInput,
} from "@/lib/validation/debt";
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
  const [modalOpen, setModalOpen] = useState(false);
  // Key berubah tiap dibuka -> DebtModal remount -> form selalu segar.
  const [modalKey, setModalKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data,
    summary,
    status,
    errorMessage,
    refresh,
    createDebt,
    updateDebt,
    settleDebt,
    deleteDebt,
  } = useDebts(filters);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  async function handleCreate(input: CreateDebtInput) {
    const result = await createDebt(input);
    if (result.ok) {
      setModalOpen(false);
      setEditingDebt(null);
      showToast(result.message);
    }
    return result;
  }

  async function handleUpdate(id: string, input: UpdateDebtInput) {
    const result = await updateDebt(id, input);
    if (result.ok) {
      setModalOpen(false);
      setEditingDebt(null);
      showToast(result.message);
    }
    return result;
  }

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
          <button
            type="button"
            onClick={() => {
              setEditingDebt(null);
              setModalKey((key) => key + 1);
              setModalOpen(true);
            }}
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
        onEdit={(debt) => {
          setEditingDebt(debt);
          setModalKey((key) => key + 1);
          setModalOpen(true);
        }}
        onDelete={(id) => deleteDebt(id)}
      />

      <DebtModal
        key={modalKey}
        open={modalOpen}
        mode={editingDebt ? "edit" : "create"}
        initial={editingDebt}
        onClose={() => {
          setModalOpen(false);
          setEditingDebt(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      {toast && (
        <p
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-tinta px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </p>
      )}
    </div>
  );
}
