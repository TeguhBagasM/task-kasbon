"use client";

import { useState } from "react";
import { DebtRow } from "@/components/DebtRow";
import { EmptyDebts, LoadError } from "@/components/states/Feedback";
import {
  ListSkeleton,
  RefreshingNote,
} from "@/components/states/Skeletons";
import type { Debt } from "@/types/debt";
import type { DebtsStatus, MutationResult } from "@/hooks/useDebts";

// Daftar ledger + orkestrasi aksi per baris: satu baris sibuk dalam satu
// waktu (cegah double click), error mutasi tampil di banner, hapus selalu
// dua langkah. Status lunas selalu dari respons server (via refetch hook).
export function DebtList({
  debts,
  status,
  errorMessage,
  refreshing,
  searchActive,
  onRetry,
  onAdd,
  onResetFilters,
  onSettle,
  onEdit,
  onDelete,
}: {
  debts: Debt[];
  status: DebtsStatus;
  errorMessage: string | null;
  refreshing: boolean;
  searchActive: boolean;
  onRetry: () => void;
  onAdd: () => void;
  onResetFilters: () => void;
  onSettle: (id: string, settled: boolean) => Promise<MutationResult>;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => Promise<MutationResult>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  async function runMutation(id: string, action: () => Promise<MutationResult>) {
    if (pendingId !== null) return;
    setPendingId(id);
    setMutationError(null);
    try {
      const result = await action();
      if (!result.ok) setMutationError(result.message);
    } finally {
      setPendingId(null);
    }
  }

  // Load awal (belum ada data): skeleton penuh. Refetch: data lama + note.
  if (status === "loading" && !refreshing) return <ListSkeleton />;

  if (status === "error" && debts.length === 0) {
    return <LoadError message={errorMessage} onRetry={onRetry} />;
  }

  return (
    <div className="flex flex-col">
      {refreshing && <RefreshingNote />}
      {status === "error" && debts.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-bata/10 px-4 py-3">
          <p role="alert" className="flex-1 text-sm text-bata">
            {errorMessage ?? "Gagal memuat ulang nih."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="h-11 rounded-lg bg-bata px-4 text-sm font-semibold text-white"
          >
            Coba lagi
          </button>
        </div>
      )}
      {mutationError && (
        <p
          role="alert"
          className="mb-2 rounded-lg bg-bata/10 px-4 py-3 text-sm text-bata"
        >
          {mutationError}
        </p>
      )}

      {debts.length === 0 ? (
        <EmptyDebts
          variant={searchActive ? "noresult" : "empty"}
          onAdd={onAdd}
          onResetFilters={onResetFilters}
        />
      ) : (
        debts.map((debt) => (
          <DebtRow
            key={debt.id}
            debt={debt}
            busy={pendingId === debt.id}
            confirmDelete={confirmDeleteId === debt.id}
            onSettle={() =>
              runMutation(debt.id, () =>
                onSettle(debt.id, debt.settled_at === null),
              )
            }
            onEdit={() => onEdit(debt)}
            onAskDelete={() => setConfirmDeleteId(debt.id)}
            onCancelDelete={() => setConfirmDeleteId(null)}
            onConfirmDelete={() =>
              runMutation(debt.id, async () => {
                const result = await onDelete(debt.id);
                if (result.ok) setConfirmDeleteId(null);
                return result;
              })
            }
          />
        ))
      )}
    </div>
  );
}
