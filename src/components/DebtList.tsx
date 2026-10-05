"use client";

import { useState } from "react";
import { DebtRow } from "@/components/DebtRow";
import type { Debt } from "@/types/debt";
import type { DebtsStatus, MutationResult } from "@/hooks/useDebts";

function SkeletonRows() {
  return (
    <div aria-busy="true" aria-label="Memuat catatan" className="flex flex-col">
      {[0, 1, 2].map((key) => (
        <div key={key} className="border-b border-tinta/10 py-4 last:border-b-0">
          <div className="h-5 w-2/5 animate-pulse rounded bg-tinta/10" />
          <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-tinta/10" />
        </div>
      ))}
    </div>
  );
}

// Daftar ledger + orkestrasi aksi per baris: satu baris sibuk dalam satu
// waktu (cegah double click), error mutasi tampil di banner, hapus selalu
// dua langkah. Status lunas selalu dari respons server (via refetch hook).
export function DebtList({
  debts,
  status,
  errorMessage,
  searchActive,
  onRetry,
  onSettle,
  onEdit,
  onDelete,
}: {
  debts: Debt[];
  status: DebtsStatus;
  errorMessage: string | null;
  searchActive: boolean;
  onRetry: () => void;
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

  if (status === "loading") return <SkeletonRows />;

  if (status === "error") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-tinta/10 bg-white px-5 py-8">
        <p className="font-semibold">Gagal memuat catatan nih.</p>
        {errorMessage && (
          <p className="text-sm text-tinta/70">{errorMessage}</p>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="h-11 rounded-lg bg-pulpen px-5 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {mutationError && (
        <p
          role="alert"
          className="mb-2 rounded-lg bg-bata/10 px-4 py-3 text-sm text-bata"
        >
          {mutationError}
        </p>
      )}

      {debts.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-tinta/10 bg-white px-5 py-8">
          {searchActive ? (
            <>
              <p className="font-semibold">Nggak ketemu nih.</p>
              <p className="text-sm text-tinta/70">
                Coba kata kunci lain atau ubah filternya.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">Belum ada catatan utang nih.</p>
              <p className="text-sm text-tinta/70">
                Catat yang pertama lewat tombol Tambah Catatan.
              </p>
            </>
          )}
        </div>
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
