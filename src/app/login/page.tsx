import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 bg-white px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1E293B]">Selamat datang lagi!</h1>
        <p className="text-sm text-[#1E293B]/70">
          Masuk buat lihat catatan kasbon kamu.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="text-center text-sm text-[#1E293B]/70">
        Belum punya akun?{" "}
        <Link href="/signup" className="font-semibold text-[#1D4ED8]">
          Daftar dulu
        </Link>
      </p>
    </main>
  );
}
