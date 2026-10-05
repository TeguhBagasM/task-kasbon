# Spesifikasi Teknis: Kasbon Web Application

Dokumen spesifikasi teknis ini menjadi panduan arsitektur dan fungsionalitas aplikasi **Kasbon**, sebuah web app pencatat utang-piutang pribadi yang dikembangkan untuk hiring task Konten.com.

---

## 1. Arsitektur & Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript (Strict Mode, `no explicit any`)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React (`lucide-react`)
- **Backend as a Service (BaaS):** Supabase
  - **Database:** PostgreSQL
  - **Authentication:** Supabase Auth (Email + Password)
  - **Security:** Row Level Security (RLS) WAJIB aktif & tested
- **Deployment Platform:** Vercel (Free Tier)

---

## 2. Struktur Database & Skema SQL

### Tabel `debts`
```sql
-- Enums
CREATE TYPE debt_type AS ENUM ('owed_to_me', 'i_owe');

-- Table Definition
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type debt_type NOT NULL,
    counterpart_name TEXT NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    note TEXT CHECK (char_length(note) <= 200),
    due_date DATE,
    settled_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexing for performance and query optimization
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_status ON public.debts(user_id, settled_at);
CREATE INDEX idx_debts_type ON public.debts(user_id, type);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_debts_updated_at
BEFORE UPDATE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Kebijakan Keamanan (Row Level Security - RLS)

RLS diaktifkan untuk mencegah kebocoran data antar user via Supabase REST API / Client Client-side injection:

```sql
-- Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT (User hanya bisa membaca datanya sendiri)
CREATE POLICY "Users can view their own debts"
ON public.debts FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: INSERT (User hanya bisa memasukkan data dengan user_id miliknya)
CREATE POLICY "Users can create their own debts"
ON public.debts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE (User hanya bisa mengubah datanya sendiri)
CREATE POLICY "Users can update their own debts"
ON public.debts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE (User hanya bisa menghapus datanya sendiri)
CREATE POLICY "Users can delete their own debts"
ON public.debts FOR DELETE
USING (auth.uid() = user_id);
```

---

## 4. Spesifikasi Kontrak API Endpoint

Semua endpoint wajib memverifikasi autentikasi via Supabase Auth Session/Cookie. Tanggapan error menggunakan **Bahasa Indonesia** casual & komunikatif.

### GET `/api/debts`
- **Query Params:** `status` (`all` | `unsettled` | `settled`), `type` (`all` | `owed_to_me` | `i_owe`), `search` (opsional)
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "type": "owed_to_me",
        "counterpart_name": "Budi",
        "amount": 150000,
        "note": "Uang makan siang",
        "due_date": "2026-10-10",
        "settled_at": null,
        "created_at": "2026-10-02T10:00:00Z"
      }
    ]
  }
  ```
- **Response 401 Unauthorized:**
  ```json
  {
    "success": false,
    "error": "Sesi kamu sudah berakhir. Silakan login kembali ya."
  }
  ```

### POST `/api/debts`
- **Payload Request:**
  ```json
  {
    "type": "owed_to_me",
    "counterpart_name": "Budi",
    "amount": 150000,
    "note": "Uang makan siang",
    "due_date": "2026-10-10"
  }
  ```
- **Validation Rules:**
  - `type`: Wajib enum (`owed_to_me` atau `i_owe`)
  - `counterpart_name`: Wajib string, non-empty
  - `amount`: Wajib integer positif > 0
  - `note`: Opsional, maks 200 karakter

### PATCH `/api/debts/[id]`
- **Payload Request (Pelunasan / Edit):**
  ```json
  {
    "is_settled": true, // Toggle status lunas
    "counterpart_name": "Budi",
    "amount": 150000
  }
  ```
- **Catatan:** Jika `is_settled` bernilai `true`, atur `settled_at = NOW()`. Jika `false`, atur `settled_at = NULL`.

### DELETE `/api/debts/[id]`
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Catatan utang berhasil dihapus."
  }
  ```

---

## 5. Kebutuhan UI/UX & Antarmuka

1. **Format Mata Uang (Mandatory):**
   - Wajib menggunakan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })` -> Contoh: `Rp 1.234.000`.
2. **Format Tanggal Relatif:**
   - Wajib menggunakan format relatif Bahasa Indonesia (Contoh: *"Hari ini"*, *"Kemarin"*, *"3 hari lalu"*, *"2 minggu lalu"*).
3. **Copywriting UI:**
   - Menggunakan Bahasa Indonesia casual (Contoh: *"Belum ada catatan utang nih"*, *"Tambah Catatan"*, *"Tandai Lunas"*).
4. **Respon Komponen:**
   - Mobile-first design.
   - Sediakan komponen State: **Loading State (Skeleton)**, **Empty State**, dan **Error State**.