"use client";

// Error boundary: tampil saat ada crash di halaman ini.
// Copy casual, tanpa detail internal, dengan aksi pemulihan.
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center gap-2 px-6 py-12">
      <h1 className="text-2xl font-bold">Yah, ada yang rusak nih.</h1>
      <p className="text-sm text-tinta/70">
        Coba muat ulang halamannya — biasanya langsung beres.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 h-12 rounded-lg bg-pulpen px-6 font-semibold text-white"
      >
        Muat ulang
      </button>
    </main>
  );
}
