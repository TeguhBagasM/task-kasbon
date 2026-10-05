"use client";

import { Plus, RotateCcw } from "lucide-react";

// Dua kasus dibedakan: (a) belum ada data sama sekali -> ajak tambah;
// (b) filter/search tanpa hasil -> tawarkan reset filter.
export function EmptyDebts({
  variant,
  onAdd,
  onResetFilters,
}: {
  variant: "empty" | "noresult";
  onAdd: () => void;
  onResetFilters: () => void;
}) {
  if (variant === "noresult") {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-tinta/10 bg-white px-5 py-8">
        <p className="font-semibold">Nggak ketemu nih.</p>
        <p className="text-sm text-tinta/70">
          Coba kata kunci lain atau ubah filternya.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-1 flex h-11 items-center gap-1.5 rounded-lg border border-tinta/15 px-4 text-sm font-semibold"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Reset filter
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-tinta/10 bg-white px-5 py-8">
      <p className="font-semibold">Belum ada catatan utang nih.</p>
      <p className="text-sm text-tinta/70">
        Catat yang pertama, cuma butuh beberapa detik.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 flex h-11 items-center gap-1.5 rounded-lg bg-pulpen px-4 text-sm font-semibold text-white"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Tambah Catatan
      </button>
    </div>
  );
}

export function LoadError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-tinta/10 bg-white px-5 py-8">
      <p className="font-semibold">Gagal memuat catatan nih.</p>
      {message && <p className="text-sm text-tinta/70">{message}</p>}
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 h-11 rounded-lg bg-pulpen px-5 text-sm font-semibold text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
