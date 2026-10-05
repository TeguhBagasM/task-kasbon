import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center gap-2 px-6 py-12">
      <h1 className="text-2xl font-bold">Halaman ini nggak ada nih.</h1>
      <p className="text-sm text-tinta/70">
        Mungkin salah ketik alamat, atau halamannya sudah pindah.
      </p>
      <Link
        href="/"
        className="mt-2 flex h-12 items-center rounded-lg bg-pulpen px-6 font-semibold text-white"
      >
        Balik ke beranda
      </Link>
    </main>
  );
}
