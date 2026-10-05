"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authSchema } from "@/lib/validation/auth";
import { mapAuthErrorMessage } from "@/lib/supabase/auth-errors";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Isi form-nya belum bener nih.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (signUpError) {
          setError(mapAuthErrorMessage(signUpError));
          return;
        }
        // Confirm email masih ON -> tidak ada session, JANGAN redirect.
        if (!data.session) {
          setInfo(
            "Akun dibuat! Tapi email-nya belum dikonfirmasi — cek inbox kamu dulu, lalu masuk dari halaman login.",
          );
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (signInError) {
          setError(mapAuthErrorMessage(signInError));
          return;
        }
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? mapAuthErrorMessage(err)
          : "Ada yang salah nih, coba lagi ya.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          className="h-12 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[#1E293B] outline-none placeholder:text-[#1E293B]/40 focus:border-[#1D4ED8] disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-[#1E293B]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="Minimal 6 karakter"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          className="h-12 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[#1E293B] outline-none placeholder:text-[#1E293B]/40 focus:border-[#1D4ED8] disabled:opacity-60"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-[#B91C1C]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="rounded-lg bg-[#15803D]/10 px-4 py-3 text-sm text-[#15803D]">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-12 rounded-lg bg-[#1D4ED8] font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {loading ? "Sebentar ya..." : isSignup ? "Daftar" : "Masuk"}
      </button>
    </form>
  );
}
