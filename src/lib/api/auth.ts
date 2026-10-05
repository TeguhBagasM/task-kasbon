import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type RequireUserResult =
  | { supabase: ServerClient; userId: string; errorResponse: null }
  | { supabase: null; userId: null; errorResponse: NextResponse };

// Guard auth untuk semua route /api/debts: user_id SELALU dari getUser(),
// tidak pernah dari body. Gagal -> 401 BI.
export async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      supabase: null,
      userId: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Sesi kamu sudah berakhir. Silakan login kembali ya.",
        },
        { status: 401 },
      ),
    };
  }
  return { supabase, userId: user.id, errorResponse: null };
}
