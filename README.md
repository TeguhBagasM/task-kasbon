# Kasbon — Web App Tracker Utang Piutang

Catat siapa berhutang ke siapa, berapa nominalnya, dan kapan jatuh tempo —
santai, mobile-first, dan data tiap pengguna terisolasi penuh.

## Setup

**Prasyarat:** Node.js 18+ (disarankan 20+), npm atau pnpm.

**1. Clone dan install:**

```bash
git clone https://github.com/TeguhBagasM/task-kasbon.git
cd task-kasbon
npm install
```

**2. Isi `.env.local`** (copy dari `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Ambil nilainya dari dashboard Supabase → Project Settings → API.
Jangan pernah commit `.env.local`.

**3. Jalankan database migration:**

Buka file `supabase/migrations/20261005_init_debts.sql`, copy seluruh
isinya, paste di Supabase dashboard → SQL Editor → Run. Ini membuat tabel
`debts` beserta trigger `updated_at` dan kebijakan keamanan RLS.

**4. Jalankan aplikasi:**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), daftar akun baru,
dan mulai mencatat.

## Demo

- **Live Demo:** https://kasbon-teguh.vercel.app/
- **Repository:** https://github.com/TeguhBagasM/task-kasbon.git
- **Video Loom:** [Isi Link Loom Di Sini]

## Approach

Keputusan teknis yang paling dibanggakan adalah isolasi data berlapis:
Row Level Security (RLS) di Supabase menegakkan `auth.uid() = user_id` di
empat policy (SELECT, INSERT, UPDATE, DELETE) sehingga data antar pengguna
tidak bisa bocor lewat REST API, diperkuat `REVOKE ALL` untuk role anon
dan pengecekan kepemilikan di setiap API route; di atasnya berdiri Next.js
16 App Router dengan TypeScript strict dan Tailwind CSS v4, sehingga
aplikasinya cepat, aman dari sisi tipe, dan nyaman dipakai di layar HP.

## Trade-off

Jika ada waktu ekstra 1 hari, yang akan dipoles: pengelompokan transaksi
(grouping beberapa catatan utang per nama orang agar riwayat per relasi
terbaca sekali lihat), grafik perbandingan utang vs piutang (bar chart di
atas ringkasan angka), serta pencarian instan yang lebih responsif dengan
penyorotan kata kunci di hasil.

## Time Spent

Sekitar 6 - 8 jam pengerjaan end-to-end, dari perancangan database dan
RLS, setup Next.js + Auth, pembuatan API route, hingga deployment di
Vercel.
