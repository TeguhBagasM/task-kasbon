import { LogoutButton } from "@/components/LogoutButton";

// Halaman dashboard penuh dibangun di T8. Sementara: placeholder + logout
// agar alur auth (T4) bisa diuji end-to-end.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center gap-4 bg-white px-6 py-12">
      <h1 className="text-2xl font-bold text-[#1E293B]">Kasbon</h1>
      <p className="text-sm text-[#1E293B]/70">
        Kamu udah masuk. Dashboard-nya nyusul di T8 ya.
      </p>
      <LogoutButton />
    </main>
  );
}
