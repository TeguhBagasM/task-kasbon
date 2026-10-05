# Peta Belajar Next.js Lewat Repo Kasbon

Panduan untuk kamu yang junior dan belajar Next.js langsung dari proyek
ini. Urutannya mengikuti perjalanan satu request: dari browser mengetik
alamat sampai data tampil di layar. Semua rujukan memakai PATH FILE +
NAMA FUNGSI/KOMPONEN (bukan nomor baris, karena baris geser tiap edit).

Aturan main dokumen ini: tiap latihan dikerjakan di branch terpisah lalu
dibatalkan. Polanya selalu sama:

```bash
git switch -c latihan-saya
# ... ubah kode, jalankan, amati ...
git restore . && git switch - && git branch -D latihan-saya
```

## 0. Peta repo: pohon `src/` dan apa gunanya tiap file

```
src/
  proxy.ts                  # Gerbang semua request: refresh session + jaga halaman
  app/
    layout.tsx              # Bingkai semua halaman (font, bahasa, judul)
    page.tsx                # Fungsi Home: ambil email user, tampilkan Dashboard
    globals.css             # Palet warna + font + aturan fokus keyboard
    error.tsx               # Layar "Yah, ada yang rusak nih" saat halaman crash
    not-found.tsx           # Layar "Halaman ini nggak ada nih" (alamat salah)
    login/page.tsx          # Fungsi LoginPage: judul + AuthForm(mode="login")
    signup/page.tsx         # Fungsi SignupPage: judul + AuthForm(mode="signup")
    api/debts/route.ts      # Fungsi GET (daftar+filter) dan POST (tambah)
    api/debts/[id]/route.ts # Fungsi PATCH (ubah/lunasi) dan DELETE (hapus)
  components/
    Dashboard.tsx           # Fungsi Dashboard: filter + list + modal + toast
    AuthForm.tsx            # Fungsi AuthForm: form login/signup + pesan error BI
    LogoutButton.tsx        # Fungsi LogoutButton: keluar + kembali ke /login
    SummaryCards.tsx        # Fungsi SummaryCards: 3 angka ringkasan
    DebtFilters.tsx         # Fungsi DebtFilters: 2 dropdown + kolom cari
    DebtList.tsx            # Fungsi DebtList: daftar + tombol aksi per baris
    DebtRow.tsx             # Fungsi DebtRow: satu baris utang + badge + tanggal
    DebtModal.tsx           # Fungsi DebtModal: dialog tambah/ubah catatan
    states/Skeletons.tsx    # Fungsi SummarySkeleton, ListSkeleton, RefreshingNote
    states/Feedback.tsx     # Fungsi EmptyDebts (2 varian) dan LoadError
  hooks/
    useDebts.ts             # Fungsi useDebts: ambil data + lunas/hapus/ubah
  lib/
    supabase/client.ts      # Fungsi createClient: koneksi Supabase buat browser
    supabase/server.ts      # Fungsi createClient: koneksi Supabase buat server
    supabase/auth-errors.ts # Fungsi mapAuthErrorMessage: Inggris teknis -> BI santai
    api/auth.ts             # Fungsi requireUser: cek login di API
    api/respond.ts          # Fungsi jsonError, notFoundDebt, serverError
    api/debts.ts            # Daftar kolom + tipe DebtRow (sumber tunggal)
    validation/auth.ts      # Aturan Zod untuk email + password (authSchema)
    validation/debt.ts      # Aturan Zod untuk catatan (createDebtSchema, updateDebtSchema)
    utils/currency.ts       # Fungsi formatIDR dan parseIDRInput
    utils/date.ts           # Fungsi formatRelativeDate, parseCalendarDate, dll
    utils/search.ts         # Fungsi escapeLikePattern (amankan karakter % _ \)
  types/
    debt.ts                 # Tipe Debt, DebtSummary, DebtFilters, respons API
supabase/migrations/        # SQL pembuat tabel + aturan keamanan (RLS)
requests/api.rest           # Kumpulan request uji API buat ekstensi REST Client
```

Boleh abaikan dulu: `vitest.config.ts`, `*.test.ts` (belajar belakangan di
tahap j), `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`,
`tsconfig.json` (konfigurasi, bukan konsep), `public/` (gambar statis),
`docs/` selain file ini (catatan proyek, bukan materi belajar).

## 1. Jalur belajar bertahap

### Tahap A — App Router dasar (±3 jam)

Konsep: di Next.js App Router, folder = alamat URL dan file khusus
(`layout`, `page`, `error`, `not-found`) punya peran tetap.

Urutan baca: fungsi `RootLayout` di `src/app/layout.tsx` → fungsi `Home`
di `src/app/page.tsx` → fungsi `LoginPage` di `src/app/login/page.tsx` →
`src/app/error.tsx` → `src/app/not-found.tsx`.

Perhatikan: (1) `RootLayout` wajib mengembalikan `<html>` + `<body>` dan
menyuntik font lewat `variable` dari `next/font/google`; (2) `metadata`
(export biasa, bukan komponen) yang mengatur judul tab browser;
(3) `Home` itu `async` dan memanggil `createClient` dari
`src/lib/supabase/server.ts` — halaman boleh async karena dirender di
server; (4) `error.tsx` harus diawali `"use client"`.

Kata kunci pencarian: cari di nextjs.org/docs: "App Router project
structure", "Root Layout", "Metadata", "Error Handling error.js".

Tes diri: (1) Apa yang terjadi kalau `error.tsx` tidak pakai `"use
client"`? Jawaban: error boundary butuh state/event browser, jadi Next
menolaknya — boundary hanya bisa berupa Client Component. (2) Kenapa judul
tab berubah cukup dengan export `metadata`? Jawaban: Next membaca export
itu saat render server dan menyuntik `<title>` otomatis, tanpa kamu tulis
tag head manual.

Latihan: di branch, hapus `<html lang="id">` jadi `<div>` di `RootLayout`,
prediksi error-nya sebelum `npm run dev`, baca pesan error-nya, lalu
batalkan. [perlu cek docs Next 16]: tipe `LayoutProps<"/">` di tanda
tangan `RootLayout` berasal dari file tipe hasil generate Next
(`next-env.d.ts`) — jangan dihafal, cukup tahu ia mengetik props layout.

### Tahap B — Server Component vs Client Component (±3 jam)

Konsep: komponen server jalan di server (bisa akses database/cookie,
tidak bisa diklik), komponen `"use client"` jalan di browser (bisa diklik,
tidak boleh rahasia). Batasnya adalah file, bukan folder.

Urutan baca: fungsi `Home` (`src/app/page.tsx`, tipis: ambil email lalu
oper ke `Dashboard`) → fungsi `Dashboard` (`src/components/Dashboard.tsx`,
`"use client"`, semua interaksi) → fungsi `AuthForm`
(`src/components/AuthForm.tsx`, form + `useState` + `useRouter`).

Perhatikan: (1) `page.tsx` hanya 17 baris karena tugasnya cuma
"ambil data awal, oper ke komponen client"; (2) `email` lewat sebagai
props biasa dari server ke client; (3) `useSearchParams` di `Dashboard`
butuh dibungkus `<Suspense>` di `page.tsx`; (4) tidak ada `user_id`,
token, atau secret di props mana pun.

Kata kunci pencarian: cari di nextjs.org/docs: "Server and Client
Components", "useSearchParams Suspense boundary", "Passing props Server
to Client".

Tes diri: (1) Bolehkah `Dashboard` memanggil `cookies()` dari
`next/headers`? Jawaban: tidak — itu API server; di Client Component akan
error, data cookie hanya lewat API atau props. (2) Kenapa email user boleh
jadi props tapi token tidak? Jawaban: email bukan rahasia (tampil di UI),
token memberi akses — token hanya hidup di cookie httpOnly yang dibaca
server.

Latihan: di branch, tambahkan `"use client"` di baris 1 `src/app/page.tsx`,
prediksi error build/dev-nya, baca pesannya (petunjuk: `cookies()` dan
`async` component), lalu batalkan.

### Tahap C — Route Handlers: API buatan sendiri (±4 jam)

Konsep: file `route.ts` di dalam `app/api/...` adalah endpoint HTTP;
nama fungsi = method (`GET`, `POST`, `PATCH`, `DELETE`).

Urutan baca: fungsi `GET` lalu `POST` di `src/app/api/debts/route.ts` →
fungsi `PATCH` lalu `DELETE` di `src/app/api/debts/[id]/route.ts` →
fungsi `requireUser` di `src/lib/api/auth.ts` → fungsi `jsonError`,
`notFoundDebt`, `serverError` di `src/lib/api/respond.ts`.

Perhatikan: (1) urutan baku tiap handler: auth dulu (`requireUser`),
lalu validasi id/body, terakhir query — buktinya request tanpa cookie
selalu 401 walau bodinya ngaco; (2) `params` di Next 16 adalah Promise
sehingga kodenya `await params` (lihat tanda tangan fungsi `PATCH`/
`DELETE`); (3) status code disengaja: 201 saat buat, 400 validasi, 401
belum login, 404 saat id asing/tak ada (bukan 403 agar tak membocorkan
data orang); (4) `summary` dihitung dari query kedua tanpa filter.

Kata kunci pencarian: cari di nextjs.org/docs: "Route Handlers",
"Dynamic Routes params Promise", "Response status NextResponse.json".

Tes diri: (1) Apa akibat menukar urutan — validasi dulu, auth belakangan?
Jawaban: request anonim tanpa cookie bisa memancing pesan validasi dan
membocorkan aturan schema; selain itu buang sumber daya. (2) Kenapa id
bukan-uuid menghasilkan 404 bukan 500? Jawaban: `idSchema` (z.uuid)
menolaknya sebelum query menyentuh Postgres, jadi error 22P02 tak pernah
terjadi.

Latihan: di branch, pindahkan blok validasi `status`/`type` di fungsi
`GET` ke bawah (setelah query), prediksi respons `?status=ngawur` sebelum
mencoba via `requests/api.rest` (pakai request `getBadStatus`), amati,
lalu batalkan.

### Tahap D — `proxy.ts` pengganti `middleware.ts` (±2 jam)

Konsep: satu fungsi yang berjalan SEBELUM halaman/API — tugasnya di repo
ini dua: segarkan session Supabase dan usir yang belum login.

Urutan baca: fungsi `proxy` di `src/proxy.ts` dari atas ke bawah →
`redirectWithCookies` → dua blok `if` (`!user`, `user && isAuthPage`) →
`config` (`matcher`).

Perhatikan: (1) `getUser()` memvalidasi token ke server Auth (bukan baca
cookie mentah); (2) `setAll` menulis cookie refresh ke `supabaseResponse`,
makanya redirect harus menyalin cookie itu (`redirectWithCookies`) kalau
tidak session baru hilang; (3) `/login` dan `/signup` sengaja dikecualikan
agar tidak redirect loop; (4) `matcher` mengecualikan `api`, file statis,
dan favicon.

Kata kunci pencarian: cari di nextjs.org/docs: "Proxy proxy.ts",
"Middleware matcher", "NextResponse redirect cookies".
[perlu cek docs Next 16]: perilaku `proxy` saat redirect + `set-cookie`
ganda di CDN — di lokal terbukti jalan, di Vercel amati ulang.

Tes diri: (1) Apa jadinya jika `isAuthPage` tidak dikecualikan? Jawaban:
loop `/login` → `/login` selamanya karena user anonim selalu di-redirect.
(2) Kenapa `matcher` mengecualikan `_next/static`? Jawaban: tanpa itu CSS
dan JS ikut dicegat logika auth dan bisa gagal dimuat.

Latihan: di branch, kembalikan `return NextResponse.redirect(url)` polos
(hapus `redirectWithCookies`), prediksi dari komentar di kode apa yang
rusak (petunjuk: baca komentar di atas `redirectWithCookies`), lalu
batalkan tanpa perlu benar-benar logout.

### Tahap E — Supabase SSR: dua client (±3 jam)

Konsep: browser dan server butuh "koneksi" Supabase yang berbeda karena
cara membaca cookie-nya beda.

Urutan baca: fungsi `createClient` di `src/lib/supabase/client.ts`
(browser, simpel) → fungsi `createClient` di `src/lib/supabase/server.ts`
(server, `getAll`/`setAll` + `try/catch`) → fungsi `handleSubmit` di
`src/components/AuthForm.tsx` → fungsi `LogoutButton` di
`src/components/LogoutButton.tsx`.

Perhatikan: (1) `cookies()` di `server.ts` itu `async` (harus `await`);
(2) `try/catch` di `setAll` karena Server Component read-only — refresh
cookie di sana diserahkan ke `proxy.ts`; (3) setelah login/logout selalu
ada pasangan `router.push` + `router.refresh()` agar komponen server
membaca ulang cookie sesi baru; (4) `mapAuthErrorMessage`
(`src/lib/supabase/auth-errors.ts`) tidak pernah menampilkan pesan mentah.

Kata kunci pencarian: cari di supabase docs: "SSR createBrowserClient
createServerClient", "getUser vs getSession", "cookies setAll try catch
Server Component".

Tes diri: (1) Kenapa `router.refresh()` wajib setelah login? Jawaban:
tanpa itu, Server Component `/` dirender dari cache router lama tanpa
cookie sesi sehingga dikira belum login. (2) Apa isi `catch` kosong di
`server.ts`? Jawaban: menelan error tulis-cookie saat dipanggil dari
Server Component — aman karena `proxy.ts` yang menangani refresh.

Latihan: di branch, hapus `router.refresh()` di `handleSubmit` sesudah
login, prediksi apa yang terlihat di browser (petunjuk: proxy vs cache),
coba, lalu batalkan.

### Tahap F — Validasi Zod di dua sisi (±2 jam)

Konsep: satu schema dipakai form browser DAN API server — kontrak payload
ditulis sekali.

Urutan baca: `createDebtSchema` dan `updateDebtSchema` di
`src/lib/validation/debt.ts` → pemakaian di `handleSubmit`
(`src/components/DebtModal.tsx`) → pemakaian di fungsi `POST`
(`src/app/api/debts/route.ts`) dan `PATCH`
(`src/app/api/debts/[id]/route.ts`).

Perhatikan: (1) `.strict()` di `updateDebtSchema` menolak `user_id` dan
`settled_at` dari client; schema create sengaja tidak strict (kelebihan
field di-strip diam-diam); (2) pesan error Indonesia ditulis di schema,
jadi server otomatis berbahasa santai; (3) `z.infer` melahirkan tipe
`CreateDebtInput`/`UpdateDebtInput` — tipe selalu sinkron dengan aturan;
(4) pesan pertama (`issues[0]`) yang dikirim ke client.

Kata kunci pencarian: cari di zod docs (v4): "strict objects
unrecognized keys", "z.infer", "safeParse error issues".

Tes diri: (1) Apa risiko validasi hanya di browser? Jawaban: request
buatan (curl/REST Client) melewatinya — server tanpa validasi menerima
sampah. (2) Kenapa `updateDebtSchema` menolak body `{}`? Jawaban: ada
`refine` jumlah key > 0 agar PATCH kosong tidak menyentuh database.

Latihan: di branch, ubah `amountSchema` jadi `.max(1000)`, prediksi: form
tambah 1500000 menampilkan apa, dan POST via REST Client mengembalikan
apa — keduanya harus berubah bersamaan karena satu schema. Buktikan, lalu
batalkan.

### Tahap G — Hook `useDebts` (±4 jam, bagian tersulit)

Konsep: custom hook = logika data yang bisa dipakai ulang; di dalamnya
ada tiga teknik anti-kacau: debounce, abort, dan request-id.

Urutan baca: fungsi `useDebts` di `src/hooks/useDebts.ts` dari state
(`data`, `summary`, `status`, `refreshing`) → effect debounce 300ms →
effect `load` (AbortController + `requestId`) → fungsi `mutate` →
`createDebt`/`updateDebt`/`settleDebt`/`deleteDebt`/`refresh`.

Perhatikan: (1) debounce di DALAM hook agar komponen tetap dungu;
(2) cleanup effect memanggil `controller.abort()` — request lama dibunuh
saat filter berubah; (3) `if (id !== requestId.current) return`
membuang respons basi yang telanjur datang; (4) `refreshing` vs `status`:
load awal tampil skeleton, refetch mempertahankan data lama + note
ringan; (5) `reloadToken` memicu effect yang sama — mutasi tidak fetch
ganda; (6) 401 langsung `goLogin`, bukan error generik.

Kata kunci pencarian: cari di react.dev: "useEffect cleanup
AbortController", "You Might Not Need an Effect", "useRef latest request
race condition".

Tes diri: (1) Apa yang rusak jika cleanup `abort()` dihapus? Jawaban:
ketik cepat di search — respons lambat menimpa hasil terbaru (tampilan
berkedip/salah). (2) Kenapa `setStatus("loading")` tidak boleh di body
effect? Jawaban: memicu render beruntun; repo ini memindahkannya ke dalam
fungsi `load` async (pelajaran dari error lint tahap B/C).

Latihan: di branch, naikkan debounce 300 → 2000ms, prediksi rasanya
mengetik di kolom cari sebelum mencoba, amati, lalu batalkan.

### Tahap H — Komponen UI (±3 jam)

Konsep: komponen kecil yang masing-masing satu tugas; input terkontrol;
modal yang ramah keyboard dan screen reader.

Urutan baca: fungsi `DebtFilters` → fungsi `DebtRow`
(`src/components/DebtRow.tsx`, badge + tanggal + tombol aksi) → fungsi
`DebtList` (`src/components/DebtList.tsx`, `runMutation`, `pendingId`,
hapus dua langkah) → fungsi `DebtModal` (`src/components/DebtModal.tsx`,
trap fokus + `requestClose`) → fungsi `EmptyDebts`/`LoadError`
(`src/components/states/Feedback.tsx`).

Perhatikan: (1) semua input controlled (`value` + `onChange`) sehingga
`dirty` di modal bisa dihitung; (2) `DebtModal` me-remount via `key` dari
`Dashboard` (fungsi `onEdit` dan tombol Tambah) agar form selalu segar
tanpa effect sinkronisasi; (3) error tiap field memakai `aria-describedby`
+ `role="alert"`; (4) empty dibedakan dua varian (`empty` vs `noresult`).

Kata kunci pencarian: cari di react.dev: "controlled inputs",
"lifting state up"; cari di MDN: "focus trap dialog", "aria-describedby",
"role alertdialog".

Tes diri: (1) Kenapa modal di-remount pakai `key`, bukan di-reset manual?
Jawaban: reset manual butuh effect setState yang dilarang aturan lint dan
rawan lupa field — remount memberi state awal gratis dan benar. (2) Apa
yang terjadi jika `pendingId` dihapus dari `DebtList`? Jawaban: klik ganda
" Tandai Lunas" mengirim dua PATCH balapan.

Latihan: di branch, hapus `key={modalKey}` di `Dashboard`, prediksi: buka
modal tambah, isi nama, tutup, buka lagi — apa yang terlihat? Buktikan
(form kotor!), lalu batalkan.

### Tahap I — Tailwind v4 (±2 jam)

Konsep: token desain di `@theme`, class utility di markup, mobile-first
( lively default = layar kecil, `sm:` untuk besar).

Urutan baca: `src/app/globals.css` (`@theme`, `@utility font-angka`,
`:focus-visible`, blok reduced-motion) → pemakaian `font-angka`,
`text-daun`/`text-bata`, `grid-cols-1 sm:grid-cols-3` di
`src/components/SummaryCards.tsx` (fungsi `SummaryCards`, `CardShell`).

Perhatikan: (1) `--color-*` melahirkan class `text-*`/`bg-*`/`border-*`
otomatis; (2) `font-angka` = family angka + `tabular-nums` agar kolom
Rupiah rata; (3) kuning hanya non-teks (border/garis) karena kontras teks
kurang; (4) `sm:` selalu berarti "layar besar ke atas", bukan sebaliknya.

Kata kunci pencarian: cari di tailwindcss docs v4: "@theme",
"@utility", "responsive sm: breakpoint", "tabular-nums".

Tes diri: (1) Dari mana class `text-daun` berasal? Jawaban: dari
`--color-daun` di `@theme` — Tailwind v4 men-generate-nya. (2) Kenapa
grid ringkasan `grid-cols-1 sm:grid-cols-3`? Jawaban: mobile-first —
satu kolom (penuh, tanpa scroll horizontal) adalah default; tiga kolom
hanya di layar besar.

Latihan: di branch, tukar `grid-cols-1 sm:grid-cols-3` jadi
`grid-cols-3`, prediksi tampilan 375px sebelum membuka DevTools
(petunjuk: ukur lebar kartu), lalu batalkan.

### Tahap J — Utilitas murni + testing (±2 jam)

Konsep: fungsi tanpa efek samping (input sama → output sama) paling mudah
diuji; aturan tanggal hanya boleh dibuktikan test, bukan keyakinan.

Urutan baca: fungsi `formatIDR`/`parseIDRInput`
(`src/lib/utils/currency.ts`) → fungsi `todayCalendarDate`,
`parseCalendarDate`, `diffDaysFromToday`, `formatRelativeDate`
(`src/lib/utils/date.ts`) → fungsi `escapeLikePattern`
(`src/lib/utils/search.ts`) → file `*.test.ts` + `vitest.config.ts`.

Perhatikan: (1) `Intl.NumberFormat('id-ID', ...)` menyisipkan NBSP
(U+00A0) — test menormalkannya HANYA di assertion; (2) parse tanggal
manual + batas hari eksplisit Asia/Jakarta, tidak pernah
`new Date('YYYY-MM-DD')` (di-parse sebagai 00:00 UTC → geser sehari di
server UTC pada 00:00–07:00 WIB); (3) test kasus batas
`2026-10-04T18:00Z` (= 5 Okt Jakarta) membuktikan poin 2; (4) escape LIKE
menutup `%`/`_` sebagai wildcard.

Kata kunci pencarian: cari di MDN: "Date parse YYYY-MM-DD UTC",
"Intl.NumberFormat id-ID currency"; cari di vitest docs: "vitest run",
"describe it expect".

Tes diri: (1) Kenapa jam 03:00 WIB tanggal server UTC tertinggal sehari?
Jawaban: 03:00 WIB = 20:00 UTC hari sebelumnya — kalender UTC belum
ganti. (2) Apa beda `formatRelativeDate` dan `formatRelativeDateTime`?
Jawaban: yang pertama untuk tanggal kalender (`due_date`, ada masa
depan), yang kedua untuk timestamp (`created_at`, "Baru aja"/"X jam lalu"
bila masih hari ini).

Latihan: di branch, tambahkan test `formatRelativeDate("2026-10-05")`
dengan `now` = `2026-10-04T16:59:59Z`, prediksi hasilnya sebelum `npm
test` (petunjuk: jam Jakarta-nya 23:59 atau 00:00?), amati, lalu batalkan.

### Tahap K — Database + RLS dari sisi aplikasi (±2 jam)

Konsep: keamanan datanya di database (RLS), tapi kode aplikasi harus
bekerja sama: selalu kirim identitas dari session, tak pernah dari body.

Urutan baca: migration `20261005_init_debts.sql` (tabel → trigger →
`REVOKE`/`GRANT` → 4 policy) → fungsi `requireUser`
(`src/lib/api/auth.ts`) → pemakaian `.eq("user_id", userId)` di fungsi
`PATCH`/`DELETE` (`src/app/api/debts/[id]/route.ts`).

Perhatikan: (1) policy memakai `(select auth.uid())` (initPlan, sekali
per statement); (2) `REVOKE ALL ... FROM anon` + policy `TO
authenticated` = tanpa JWT tidak ada akses; (3) function trigger dikunci
`SET search_path = ''`; (4) kode tetap `.eq("user_id")` sebagai defense
in depth walau RLS sudah menjaga; (5) 404 untuk milik orang lain agar tak
membocorkan keberadaan data.

Kata kunci pencarian: cari di supabase docs: "Row Level Security
policies", "auth.uid() select performance initPlan", "REVOKE anon".

Tes diri: (1) Jika RLS dimatikan, apa yang masih melindungimu? Jawaban:
`.eq("user_id", userId)` + `user_id` dari session — tapi ini lapis kedua,
bukan pengganti RLS. (2) Kenapa `user_id` dari body diabaikan, bukan
ditolak, saat POST? Jawaban: schema create tidak `.strict` — kunci asing
di-strip diam-diam dan `user_id` session yang dipakai (perilaku ini
tercatat di `requests/api.rest` bagian 3o).

Latihan: di branch, hapus `.eq("user_id", userId)` di fungsi `DELETE`,
prediksi hasil request `deleteWithB` di `requests/api.rest` (petunjuk:
RLS masih aktif — siapa yang menolak?), jalankan, lalu batalkan.

## 2. Perbedaan Next 16 vs tutorial lama (yang terlihat di repo ini)

1. `middleware.ts` → `src/proxy.ts` + `export function proxy` (lihat
   `src/proxy.ts`). Tutorial lama yang menulis `middleware.ts` +
   `export function middleware` sudah kedaluwarsa.
2. `params` adalah Promise: `const { id } = await params` (lihat tanda
   tangan `PATCH`/`DELETE` di `src/app/api/debts/[id]/route.ts`).
   Tutorial lama menulis `params.id` langsung.
3. `cookies()` itu async: `await cookies()` (lihat
   `src/lib/supabase/server.ts`). Tutorial lama tanpa `await`.
4. Tidak ada `pages/` — semuanya App Router (`src/app/...`). Tutorial
   `getServerSideProps` tidak berlaku di sini.
5. Key Supabase baru bernama publishable (`sb_publishable_...`), bukan
   "anon key" JWT (lihat `src/lib/supabase/client.ts` dan
   `requests/.env.rest.example`). [perlu cek docs Next 16]: tidak ada
   yang berubah di sisi Next, ini perubahan dashboard Supabase.

## 3. Jika ditanya X, buka file Y

| Pertanyaan | Buka file → fungsi |
|---|---|
| Kenapa harus login dulu? | `src/proxy.ts` → `proxy` (dua blok `if`) |
| Auth aman dari token palsu? | `src/proxy.ts` → `proxy` (`getUser`, bukan `getSession`) |
| Data user A bocor ke B? | `supabase/migrations/...sql` (4 policy) + `[id]/route.ts` → `PATCH` (404, bukan 403) |
| Lunas dua kali aman? | `[id]/route.ts` → `PATCH` (lewati tulis + filter `.is('settled_at', null)`) |
| Tanggal tidak geser sehari? | `src/lib/utils/date.ts` → `parseCalendarDate`, `todayCalendarDate` (+ test batas UTC) |
| Search `%` tidak jadi wildcard? | `src/lib/utils/search.ts` → `escapeLikePattern` |
| Validasi client = server? | `src/lib/validation/debt.ts` → `createDebtSchema`, `updateDebtSchema` |
| Ringkasan tak ikut filter? | `src/app/api/debts/route.ts` → `GET` (query kedua tanpa filter) |
| Ketik cepat tidak kacau? | `src/hooks/useDebts.ts` → `useDebts` (debounce + AbortController + requestId) |
| Modal ramah keyboard? | `src/components/DebtModal.tsx` → `DebtModal` (trap Tab, Esc, `requestClose`) |
| Form tambah tidak kotor saat dibuka ulang? | `src/components/Dashboard.tsx` → `Dashboard` (`key={modalKey}`) |
| Angka Rupiah rata kolom? | `src/app/globals.css` (`@utility font-angka`) + `src/lib/utils/currency.ts` → `formatIDR` |
| Error BI dari mana? | `src/lib/supabase/auth-errors.ts` → `mapAuthErrorMessage` |
| Klik ganda tidak dobel request? | `src/components/DebtList.tsx` → `runMutation` (`pendingId`) |
| Hapus tak sengaja? | `src/components/DebtRow.tsx` → `DebtRow` (dialog konfirmasi dua langkah) |

## 4. Yang sengaja belum saya pahami (pelajari dulu yang atas)

1. **Anti-race di `useDebts`** (`useDebts.ts` → `useDebts`): tiga mekanisme
   (debounce, abort, request-id) berinteraksi — paling berisiko dijelaskan
   salah. Kuasai ini dulu.
2. **Idempoten + race di `PATCH`** (`[id]/route.ts` → `PATCH`): bedakan
   "lewati UPDATE" vs "filter `.is('settled_at', null)`" vs "refetch
   fallback" — tiga lapis untuk tiga kasus beda.
3. **Aliran cookie proxy → redirect** (`proxy.ts` → `redirectWithCookies`):
   siapa menulis cookie, di objek respons mana ia hidup, kapan ia hilang.
4. **Trap fokus modal** (`DebtModal.tsx` → effect keydown): urutan
   first/last, kenapa capture phase (`true`), kenapa fokus dikembalikan.
5. **`useSearchParams` + `Suspense`** (`page.tsx` → `Home`,
   `Dashboard.tsx` → `Dashboard`): kenapa tanpa Suspense bisa error saat
   prerender, kenapa baca saat render (bukan effect) cegah mismatch.
6. **Peran ganda `.eq('user_id')` vs RLS** (`[id]/route.ts`): mana lapis
   utama, mana cadangan, dan apa yang terjadi jika salah satunya hilang
   (latihan tahap K membuktikannya).
7. **Zod `.strict()` vs non-strict** (`validation/debt.ts`): kenapa create
   meloloskan `user_id` diam-diam sementara update menolaknya — dan kenapa
   itu disengaja, bukan lupa.
8. **`getAll`/`setAll` + `try/catch`** (`supabase/server.ts` →
   `createClient`): kapan cookie read-only dan siapa yang mengambil alih
   (proxy).

## 5. Rencana 5 hari

- **Hari 1 — Tahap A+B.** Target cek: bisa menggambar pohon route
  (`/`, `/login`, `/signup`, `/api/...`) dan menjelaskan beda Server vs
  Client Component tanpa melihat kode.
- **Hari 2 — Tahap C+D.** Target cek: bisa menjelaskan alur satu request
  `GET /api/debts` tanpa cookie (proxy → 307? atau API → 401?) tanpa
  melihat kode. (Jawaban: API langsung 401 karena matcher proxy
  mengecualikan `api`.)
- **Hari 3 — Tahap E+F+G.** Target cek: bisa menjelaskan kenapa login
  butuh `router.refresh()` dan apa yang terjadi jika dua filter diketik
  cepat.
- **Hari 4 — Tahap H+I+J.** Target cek: bisa demo Tab-trap modal dan
  menjelaskan kenapa `new Date('2026-10-05')` dilarang, dengan contoh jam.
- **Hari 5 — Tahap K + simulasi.** Target cek: jawab 15 pertanyaan bagian
  3 dengan membuka file yang tepat dalam <30 detik per pertanyaan, lalu
  jalankan `requests/api.rest` bagian 4a–4b sebagai demo idempoten.
