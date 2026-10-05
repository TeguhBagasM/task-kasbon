import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 bg-white px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1E293B]">Bikin akun dulu yuk</h1>
        <p className="text-sm text-[#1E293B]/70">
          Gratis, cuma butuh email sama password.
        </p>
      </div>
      <AuthForm mode="signup" />
      <p className="text-center text-sm text-[#1E293B]/70">
        Udah punya akun?{" "}
        <Link href="/login" className="font-semibold text-[#1D4ED8]">
          Masuk aja
        </Link>
      </p>
    </main>
  );
}
