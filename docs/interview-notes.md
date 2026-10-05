# Interview Notes — Kasbon

20 pertanyaan paling mungkin ditanya tentang kode ini, beserta jawaban
singkat yang akurat dan penunjuk file. Semua jawaban bisa dibuktikan
dengan membaca file yang dirujuk.

## Auth & session

1. **Kenapa `getUser()`, bukan `getSession()`?**
   `getSession()` hanya membaca cookie tanpa verifikasi — token palsu atau
   kedaluwarsa lolos. `getUser()` memvalidasi token ke Auth server.
   → `src/proxy.ts`, `src/lib/api/auth.ts`

2. **Kenapa `proxy.ts`, bukan `middleware.ts`?**
   Next 16 me-rename konvensi `middleware` menjadi `proxy` (deprecated);
   fungsi yang diekspor pun bernama `proxy`. Isi logika sama.
   → `src/proxy.ts`, docs Next di `node_modules/next/dist/docs/.../proxy.md`

3. **Kenapa redirect di proxy harus membawa cookie?**
   `getUser()` bisa me-refresh session via `setAll`, dan cookie hasil
   refresh hanya hidup di `supabaseResponse`. Redirect fresh tanpa salinan
   cookie = refresh hilang = user mental ke `/login` walau token baru saja
   diperbarui. → `src/proxy.ts` (`redirectWithCookies`)

4. **Service role key dipakai di mana?**
   Tidak dipakai di mana pun. Semua akses server memakai publishable key +
   session user sehingga RLS selalu berlaku.

## Database & RLS

5. **Kenapa `(select auth.uid())`, bukan `auth.uid()` langsung?**
   Bentuk subquery menjadi initPlan: dievaluasi sekali per statement, bukan
   per baris. Jauh lebih cepat di tabel besar.
   → `supabase/migrations/20261005_init_debts.sql`

6. **Apa gunanya `REVOKE ALL ... FROM anon`?**
   Anon key tanpa JWT tidak boleh menyentuh tabel sama sekali, bahkan jika
   suatu hari ada celah di policy. Tidak mengganggu karena user login
   memakai role `authenticated` yang di-`GRANT` eksplisit.

7. **Kenapa function trigger memakai `SET search_path = ''`?**
   Mengunci function dari search_path hijacking: tanpa ini, attacker bisa
   menaruh tabel/function palsu di schema yang lebih dulu di search_path.
   `NOW()` tetap jalan karena built-in. → migration, bagian 4

8. **Kenapa duplikat `LANGUAGE plpgsql` ditolak Postgres?**
   Parser menganggap opsi ganda sebagai konflik/redundan (SQLSTATE 42601).
   Ini bug yang sempat masuk lewat edit header tanpa hapus footer, lalu
   diperbaiki. → commit `b2e5b33`

## API design

9. **Kenapa 404, bukan 403, untuk row milik user lain?**
   403 membocorkan bahwa row itu ada. 404 tidak membedakan "tidak ada" vs
   "bukan milikmu". → `src/app/api/debts/[id]/route.ts`

10. **Bagaimana PATCH idempoten?**
    `is_settled=true` saat `settled_at` sudah terisi tidak menulis ulang
    timestamp; `false` selalu mengeset NULL; tanpa perubahan nyata UPDATE
    dilewati total (trigger `updated_at` bergerak walau no-op).
    → `src/app/api/debts/[id]/route.ts`

11. **Bagaimana mitigasi race dua request melunasi bersamaan?**
    Transisi settle difilter `.is('settled_at', null)` sehingga UPDATE kedua
    jadi no-op, bukan menimpa timestamp; bila no-op karena kalah race,
    handler baca ulang dan kembalikan row terbaru (tetap sukses).
    Race-nya didokumentasikan di komentar kode.

12. **Kenapa `user_id`/`settled_at` dari body ditolak?**
    Schema PATCH `.strict()` menolak kunci asing; `user_id` selalu diambil
    dari `getUser()` dan di-override. Client tidak pernah dipercaya untuk
    kepemilikan. → `src/lib/validation/debt.ts`, `[id]/route.ts`

13. **Kenapa `maybeSingle()`, bukan `single()`?**
    `single()` melempar error saat 0 baris (harus dibedakan dari error DB
    betulan). `maybeSingle()` mengembalikan null — "tidak ada" vs "gagal"
    terpisah bersih, 404 akurat.

14. **Kenapa search di-escape manual padahal query sudah parameterized?**
    Parameterisasi mencegah SQL injection, tapi `%` dan `_` tetap wildcard
    di level LIKE. Escape menutup probing wildcard.
    → `src/lib/utils/search.ts`

15. **Kenapa summary independen dari filter?**
    Spesifikasi: ringkasan mencerminkan total posisi (semua yang belum
    lunas), bukan irisan filter. Server menghitungnya dari query terpisah
    tanpa filter; hook selalu membaca `summary` dari respons yang sama.
    → `src/app/api/debts/route.ts`, `src/hooks/useDebts.ts`

## Frontend & tanggal

16. **Kenapa `new Date('YYYY-MM-DD')` dilarang?**
    String tanggal tanpa zona di-parse sebagai 00:00 UTC. Server Vercel
    berjalan di UTC sementara user di Jakarta (UTC+7, 7 jam lebih maju),
    jadi selama 00:00–07:00 WIB tanggal "hari ini" versi server tertinggal
    sehari — label relatif dan perbandingan due_date meleset. Kode parse
    manual + batas hari eksplisit Asia/Jakarta.
    → `src/lib/utils/date.ts`, test batas UTC di `date.test.ts`

17. **Kenapa schema Zod dipakai di client DAN server?**
    Satu sumber kebenaran (`src/lib/validation/debt.ts`): kontrak payload
    didefinisikan sekali, tidak ditulis dua kali di dua tempat yang bisa
    dryak. Alasan ini juga dicatat untuk README.

18. **Kenapa `AbortController` + request-id di hook?**
    Filter diketik cepat = banyak request tumpang tindih. Abort membatalkan
    yang lama; request-id mengabaikan respons basi yang telanjur datang —
    hasil lama tidak menimpa hasil baru.
    → `src/hooks/useDebts.ts`

19. **Kenapa debounce 300ms di dalam hook, bukan komponen?**
    Komponen cukup set filter apa adanya; ritme request diatur di satu
    tempat. Komponen tetap dungu, logika timing terpusat dan teruji polanya.

20. **Kenapa status lunas tidak disimpan di state lokal?**
    Tombol hanya memicu PATCH; yang dirender selalu hasil refetch dari
    server. State lokal tidak pernah jadi sumber kebenaran status — refresh
    browser pasti konsisten. → `DebtList.tsx` + `useDebts.ts` (`reloadToken`)
