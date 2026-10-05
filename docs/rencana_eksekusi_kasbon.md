# Rencana Eksekusi Pengerjaan (Implementation Plan): Kasbon

Dokumen ini berisi panduan langkah demi langkah (step-by-step tasks) untuk mengeksekusi pembuatan proyek **Kasbon** dari nol hingga deploy dan pembuatan video demo.

---

## Fase 1: Inisialisasi Proyek & Database Supabase

- [ ] **Task 1.1:** Setup Next.js 16 Project Baru
  - Jalankan `npx create-next-app@latest kasbon --typescript --tailwind --app --src-dir --import-alias "@/*"`
  - Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`
- [ ] **Task 1.2:** Konfigurasi Supabase Project
  - Buat project baru di dashboard Supabase (Free Tier).
  - Salin `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` ke `.env.local`.
- [ ] **Task 1.3:** Database Migration & RLS Setup
  - Buat file migration SQL di `supabase/migrations/20261005_init_debts.sql`.
  - Jalankan query pemuatan tabel `debts`, trigger `updated_at`, dan RLS policies (SELECT, INSERT, UPDATE, DELETE).
  - Uji RLS via SQL Editor Supabase untuk memastikan isolation data per `user_id`.

---

## Fase 2: Auth System (Email & Password)

- [ ] **Task 2.1:** Implementasi Supabase SSR Helper Client
  - Buat helper browser client & server client (`lib/supabase/client.ts` & `lib/supabase/server.ts`).
  - Buat Middleware Next.js (`middleware.ts`) untuk proteksi route aplikasi `/` (Dashboard) jika user belum login.
- [ ] **Task 2.2:** Halaman Login & Signup (`/login`, `/signup`)
  - Buat form login/signup dengan validasi client-side.
  - Implementasi fungsi sign in dan sign up email + password via Supabase Auth.
  - Tambahkan tombol Logout di header Dashboard.

---

## Fase 3: API Endpoints (App Router Routes)

- [ ] **Task 3.1:** Utilities Formatter & Helper
  - Buat utilitas format Rupiah (`lib/utils/currency.ts`) menggunakan `id-ID`.
  - Buat utilitas format tanggal relatif (`lib/utils/date.ts`) dalam Bahasa Indonesia.
- [ ] **Task 3.2:** Route Handlers (`src/app/api/debts/route.ts`)
  - **GET:** Verifikasi auth user, ambil daftar utang dengan filter query `status` dan `type`.
  - **POST:** Validasi payload (type, counterpart_name, amount, note, due_date), simpan ke Supabase.
- [ ] **Task 3.3:** Dynamic Route Handlers (`src/app/api/debts/[id]/route.ts`)
  - **PATCH:** Update data utang / toggle status `settled_at`.
  - **DELETE:** Hapus data utang berdasarkan ID.

---

## Fase 4: Frontend UI / Dashboard & Form Modal

- [ ] **Task 4.1:** Komponen Header & Cards Summary
  - Buat 3 Card Ringkasan di bagian atas Dashboard:
    1. *Total dihutang ke saya* (Warna Hijau/Netral)
    2. *Total saya hutang* (Warna Merah/Netral)
    3. *Net* ($X - Y$, Kasih warna Hijau jika $\ge 0$, Merah jika $< 0$)
- [ ] **Task 4.2:** Filter & List Entry Utang
  - Buat baris Filter: Dropdown Status (*semua / belum / lunas*) + Dropdown Tipe (*semua / dihutang / hutang*) + Search Input (Bonus).
  - Tampilkan list entry dengan detail: Nama, Tipe Badge, Jumlah (Rp), Tanggal Relatif, Status Badge, dan Tombol Aksi (*Tandai Lunas, Edit, Hapus*).
- [ ] **Task 4.3:** Modal Form Catat Baru / Edit Entry
  - Buat komponen Modal Dialog form penambahan & penyuntingan utang.
  - Radio button: *Saya dihutang* / *Saya hutang*.
  - Input field: Nama, Jumlah (Rupiah), Tanggal, Catatan.
  - Integrasi validasi client & server response handling.
- [ ] **Task 4.4:** Handling UI States
  - Tambahkan komponen Skeleton Loading saat data sedang dimuat.
  - Tambahkan Empty State kasual (*"Belum ada catatan utang nih"*) saat list kosong.

---

## Fase 5: Testing, Git Commits & Deployment

- [ ] **Task 5.1:** RLS & Security Leak Testing
  - Lakukan pengujian panggil Supabase REST API langsung via `curl` menggunakan Anon Key milik user B terhadap ID user A untuk memastikan RLS tidak bocor (Auto-Reject Prevention).
- [ ] **Task 5.2:** Git Commit Discipline
  - Buat minimal 5-10 commit bermakna (Contoh: `feat: add supabase auth and middleware protection`, `feat: implement RLS policies and migration`, `feat: build dashboard summary cards and currency formatter`).
- [ ] **Task 5.3:** Vercel Deployment & README Documentation
  - Deploy repository ke Vercel Free Tier.
  - Tulis file `README.md` mencakup: Setup Guide (env, migration, local execution), Link Vercel Demo, Approach (1 paragraf keputusan teknis), Trade-offs, dan Time Spent.

---