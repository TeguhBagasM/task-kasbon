// Skeleton dengan dimensi menyerupai konten asli (hindari layout shift).
export function SummarySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat ringkasan"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="h-24 animate-pulse rounded-b-xl rounded-t-sm bg-white"
        />
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat catatan"
      className="flex flex-col"
    >
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="border-b border-tinta/10 py-4 last:border-b-0"
        >
          <div className="h-5 w-2/5 animate-pulse rounded bg-tinta/10" />
          <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-tinta/10" />
        </div>
      ))}
    </div>
  );
}

// Indikator ringan saat refetch: data lama tetap tampil.
export function RefreshingNote() {
  return (
    <p
      role="status"
      aria-live="polite"
      className="text-xs text-tinta/50"
    >
      Memuat ulang...
    </p>
  );
}
