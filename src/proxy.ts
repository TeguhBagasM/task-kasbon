import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16: `middleware.ts` deprecated, diganti `src/proxy.ts` (export `proxy`).
// Tugas file ini: refresh session Supabase + proteksi route.
// WAJIB pakai getUser() (validasi token ke server), BUKAN getSession()
// yang hanya baca cookie tanpa verifikasi.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // Belum login dan buka halaman proteksi (/) -> ke /login.
  // Halaman /login dan /signup sendiri tetap boleh dibuka agar tidak loop.
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Sudah login tapi buka /login atau /signup -> ke /.
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Semua route kecuali API, file statis, optimasi image, dan favicon.
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
