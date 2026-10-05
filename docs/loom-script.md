# Loom Script — Demo Kasbon (3 menit)

## Menit 1 — Demo (urutan klik)

1. Buka `/signup`, daftar email baru → langsung masuk `/` (Confirm email
   OFF, tanpa inbox).
2. Klik **Tambah Catatan** → isi Nama "Budi", Jumlah `1500000` (tampil
   `1.500.000` otomatis), Jatuh tempo besok, Catatan "makan siang" →
   Simpan → toast "Catatan tersimpan." + baris muncul + ringkasan berubah.
3. Ubah filter Status ke Lunas → empty state "Nggak ketemu nih." → Reset
   filter mengembalikan list.
4. Klik **Tandai Lunas** di baris Budi → badge jadi Lunas → refresh
   browser → tetap Lunas (status dari server).
5. Klik **Hapus** → konfirmasi "Yakin hapus?" → Ya → baris hilang.
6. Klik **Keluar** → kembali ke `/login`.

## Menit 2 — Satu keputusan yang dibanggakan

**PATCH pelunasan yang idempoten, dijaga sampai level database.**

Bukti di `src/app/api/debts/[id]/route.ts`: melunasi yang sudah lunas
tidak menimpa `settled_at`; tanpa perubahan nyata UPDATE dilewati total
(karena trigger `updated_at` bergerak walau no-op); dan untuk race dua
request bersamaan, transisi settle difilter `.is('settled_at', null)`
sehingga pemenang kedua jadi no-op + baca ulang — tetap sukses, timestamp
pemenang pertama awet. Buktinya bisa diklik: lunas dua kali via Console,
`settled_at` panggilan kedua identik dengan pertama.

## Menit 3 — Satu hal yang masih kurang (jujur)

**List memuat semua baris tanpa pagination.** Untuk ratusan catatan masih
aman, tapi di atas itu memori browser dan waktu query membengkak, dan
`summary` dihitung dari query kedua penuh. Rencana perbaikan: paginasi
cursor (`created_at` + `id`, limit 20) untuk list, dan agregasi summary
dipindah ke database function `SECURITY DEFINER` yang tetap menghormati
`auth.uid()` — satu round-trip, tetap RLS-aman.
