import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import {
  DEBT_SELECT_COLUMNS,
  type DebtRow,
} from "@/lib/api/debts";
import { jsonError, notFoundDebt, serverError } from "@/lib/api/respond";
import { updateDebtSchema } from "@/lib/validation/debt";

const idSchema = z.uuid("ID-nya bukan format yang valid nih.");

type PatchValue = string | number | null;

// PATCH /api/debts/[id] — edit parsial dan/atau toggle lunas.
// Urutan: (1) auth, (2) validasi id -> 404, (3) parse JSON -> 400,
// (4) validasi schema .strict -> 400.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { supabase, userId } = auth;

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFoundDebt();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Body-nya bukan JSON yang valid nih.", 400);
  }

  const parsed = updateDebtSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datanya belum bener nih.",
      400,
    );
  }

  try {
    // Ambil row lewat client user (RLS) + .eq user_id sebagai defense in
    // depth. Tidak ada -> 404 (jangan bocorkan apakah row milik orang lain).
    const { data: current, error: fetchError } = await supabase
      .from("debts")
      .select(DEBT_SELECT_COLUMNS)
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!current) return notFoundDebt();
    const row = current as DebtRow;

    // Hitung patch: hanya field yang benar-benar berubah.
    const patch: Record<string, PatchValue> = {};
    const input = parsed.data;
    if (input.type !== undefined && input.type !== row.type) {
      patch.type = input.type;
    }
    if (
      input.counterpart_name !== undefined &&
      input.counterpart_name !== row.counterpart_name
    ) {
      patch.counterpart_name = input.counterpart_name;
    }
    if (input.amount !== undefined && input.amount !== row.amount) {
      patch.amount = input.amount;
    }
    if (input.note !== undefined) {
      const note = input.note === "" ? null : (input.note ?? null);
      if (note !== row.note) patch.note = note;
    }
    if (input.due_date !== undefined && input.due_date !== row.due_date) {
      patch.due_date = input.due_date;
    }

    let settleTransition = false;
    if (input.is_settled === true) {
      if (row.settled_at === null) {
        patch.settled_at = new Date().toISOString();
        settleTransition = true;
      }
      // Sudah lunas: JANGAN tulis settled_at (idempoten, timestamp awet).
    } else if (input.is_settled === false) {
      if (row.settled_at !== null) patch.settled_at = null;
    }

    // Tanpa perubahan nyata -> lewati UPDATE (trigger updated_at bergerak
    // pada UPDATE apa pun walau no-op) dan kembalikan row apa adanya.
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: true, data: row });
    }

    // CATATAN RACE: antara select di atas dan update ini, request lain bisa
    // melunasi row yang sama. Untuk transisi settle, filter tambahan
    // .is('settled_at', null) membuat UPDATE kedua jadi no-op alih-alih
    // menimpa timestamp; bila no-op karena kalah race, baca ulang dan
    // kembalikan row terbaru (tetap sukses — idempoten).
    let updateQuery = supabase
      .from("debts")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (settleTransition) {
      updateQuery = updateQuery.is("settled_at", null);
    }
    const { data: updated, error: updateError } = await updateQuery
      .select(DEBT_SELECT_COLUMNS)
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) {
      if (settleTransition) {
        const { data: refetched, error: refetchError } = await supabase
          .from("debts")
          .select(DEBT_SELECT_COLUMNS)
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle();
        if (refetchError) throw refetchError;
        if (refetched) {
          return NextResponse.json({ success: true, data: refetched });
        }
      }
      return notFoundDebt();
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return serverError("[api/debts/[id] PATCH]", error);
  }
}

// DELETE /api/debts/[id] — hapus milik sendiri. Kosong -> 404.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { supabase, userId } = auth;

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFoundDebt();

  try {
    const { data, error } = await supabase
      .from("debts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) return notFoundDebt();
    return NextResponse.json({
      success: true,
      message: "Catatan utang berhasil dihapus.",
    });
  } catch (error) {
    return serverError("[api/debts/[id] DELETE]", error);
  }
}
