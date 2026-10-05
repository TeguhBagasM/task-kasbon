-- Migration: init debts table + RLS (Kasbon)
-- Jalankan di Supabase SQL Editor (atau via Supabase CLI / dashboard migration).
-- Idempoten: aman dijalankan ulang (DROP POLICY IF EXISTS sebelum CREATE).

-- 1. Enum tipe utang
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'debt_type') THEN
        CREATE TYPE debt_type AS ENUM ('owed_to_me', 'i_owe');
    END IF;
END
$$;

-- 2. Tabel debts
CREATE TABLE IF NOT EXISTS public.debts (
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

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(user_id, settled_at);
CREATE INDEX IF NOT EXISTS idx_debts_type ON public.debts(user_id, type);

-- 4. Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_debts_updated_at ON public.debts;
CREATE TRIGGER update_debts_updated_at
BEFORE UPDATE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS: aktif + hardening peran
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Anon (tanpa JWT) tidak boleh apa pun, meskipun RLS punya celah di masa depan.
-- Tidak mengganggu: user login memakai role `authenticated`, bukan `anon`.
REVOKE ALL ON TABLE public.debts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.debts TO authenticated;

-- 6. Policies: pakai (select auth.uid()) — subquery initPlan, bukan auth.uid()
-- langsung — agar Postgres tidak mengevaluasi auth.uid() per baris
-- (performa + pola yang direkomendasikan Supabase).
DROP POLICY IF EXISTS "Users can view their own debts" ON public.debts;
CREATE POLICY "Users can view their own debts"
ON public.debts FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own debts" ON public.debts;
CREATE POLICY "Users can create their own debts"
ON public.debts FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own debts" ON public.debts;
CREATE POLICY "Users can update their own debts"
ON public.debts FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own debts" ON public.debts;
CREATE POLICY "Users can delete their own debts"
ON public.debts FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);
