# API Testing — requests/api.rest

1. Copy `requests/.env.rest.example` menjadi `requests/.env`, isi cookie
   (DevTools → Application → Cookies, gabung `sb-*-auth-token` dengan
   `"; "`) dan kredensial Supabase. File `.env` tidak ter-commit.
2. Jalankan `npm run dev`, kirim request dari atas ke bawah (ada yang
   merantai id via `{{nama.response.body.$.data.id}}`).
3. Cookie kedaluwarsa ±1 jam: jika tiba-tiba 401 semua, login ulang dan
   copy cookie baru.

Paling penting untuk demo interview: 2a (summary independen filter),
3a→4a→4b (idempoten `settled_at` sama), 4g (strict tolak `user_id`),
6b–6d (lintas user 404), 7b (RLS di database).

PERINGATAN: file ini menguji API app, BUKAN RLS. Bukti RLS yang sah
hanya `scripts/rls-test.sh` (curl langsung ke Supabase REST dengan JWT
asli dua user + anon tanpa JWT).
