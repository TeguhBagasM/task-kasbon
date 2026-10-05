import type { AuthError } from "@supabase/supabase-js";

// Pesan mentah Supabase (Inggris/teknis) JANGAN pernah ditampilkan ke user.
// Petakan ke Bahasa Indonesia casual berdasarkan substring pesan asli.
export function mapAuthErrorMessage(error: AuthError | Error): string {
  const raw = error.message.toLowerCase();

  if (raw.includes("invalid login credentials")) {
    return "Email atau password-nya salah nih, coba lagi ya.";
  }
  if (raw.includes("user already registered")) {
    return "Email ini udah terdaftar, langsung masuk aja.";
  }
  if (
    raw.includes("password should be") ||
    raw.includes("password is too") ||
    raw.includes("weak password")
  ) {
    return "Password-nya kurang kuat, minimal 6 karakter ya.";
  }
  if (raw.includes("email not confirmed")) {
    return "Email-nya belum dikonfirmasi, cek inbox kamu ya.";
  }
  if (
    raw.includes("failed to fetch") ||
    raw.includes("network") ||
    raw.includes("fetch failed")
  ) {
    return "Jaringan bermasalah nih, cek koneksi lalu coba lagi.";
  }
  return "Ada yang salah nih, coba lagi ya.";
}
