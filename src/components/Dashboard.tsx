"use client";

import { Plus } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { SummaryCards } from "@/components/SummaryCards";
import { useDebts } from "@/hooks/useDebts";

// Filter default T8: semua data. Kontrol filter (status/tipe/search) + list
// dibangun di T9 — hook sudah siap menerima filter berubah.
export function Dashboard({ email }: { email: string | null }) {
  const { summary, status } = useDebts({
    status: "all",
    type: "all",
    search: "",
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-5 py-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-angka text-xl font-bold tracking-tight">Kasbon</p>
          {email && (
            <p className="truncate text-sm text-tinta/60">{email}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* TODO(T10): aktifkan saat modal tambah/edit selesai. */}
          <button
            type="button"
            disabled
            title="Segera hadir"
            className="flex h-11 items-center gap-1.5 rounded-lg bg-pulpen px-4 font-semibold text-white disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Tambah Catatan
          </button>
          <LogoutButton />
        </div>
      </header>

      <SummaryCards summary={summary} loading={status === "loading"} />

      {/* TODO(T9): filter + list entry utang di sini. */}
    </div>
  );
}
