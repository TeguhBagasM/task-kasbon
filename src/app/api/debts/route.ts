import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  DEBT_SELECT_COLUMNS,
  type DebtRow,
} from "@/lib/api/debts";
import { jsonError, serverError } from "@/lib/api/respond";
import { createDebtSchema } from "@/lib/validation/debt";
import { escapeLikePattern } from "@/lib/utils/search";

// GET /api/debts?status=all|unsettled|settled&type=all|owed_to_me|i_owe&search=
// Search hanya ke counterpart_name (ILIKE, escaped). Summary selalu dihitung
// dari SEMUA entry belum lunas — independen dari filter list.
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { supabase } = auth;

  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "all";
  const type = params.get("type") ?? "all";
  const search = (params.get("search") ?? "").trim();

  if (!["all", "unsettled", "settled"].includes(status)) {
    return jsonError("Filter status-nya nggak dikenal nih.", 400);
  }
  if (!["all", "owed_to_me", "i_owe"].includes(type)) {
    return jsonError("Filter tipe-nya nggak dikenal nih.", 400);
  }

  try {
    let query = supabase
      .from("debts")
      .select(DEBT_SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (status === "unsettled") query = query.is("settled_at", null);
    if (status === "settled") query = query.not("settled_at", "is", null);
    if (type === "owed_to_me" || type === "i_owe") query = query.eq("type", type);
    if (search !== "") {
      query = query.ilike("counterpart_name", `%${escapeLikePattern(search)}%`);
    }

    const [listResult, summaryResult] = await Promise.all([
      query,
      supabase.from("debts").select("type, amount").is("settled_at", null),
    ]);

    if (listResult.error) throw listResult.error;
    if (summaryResult.error) throw summaryResult.error;

    const rows = (summaryResult.data ?? []) as Pick<DebtRow, "type" | "amount">[];
    const owedToMe = rows
      .filter((row) => row.type === "owed_to_me")
      .reduce((sum, row) => sum + row.amount, 0);
    const iOwe = rows
      .filter((row) => row.type === "i_owe")
      .reduce((sum, row) => sum + row.amount, 0);

    return NextResponse.json({
      success: true,
      data: listResult.data,
      summary: { owed_to_me: owedToMe, i_owe: iOwe, net: owedToMe - iOwe },
    });
  } catch (error) {
    return serverError("[api/debts GET]", error);
  }
}

// POST /api/debts — user_id SELALU dari session, tidak pernah dari body
// (schema bahkan tidak punya field user_id).
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { supabase, userId } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Body-nya bukan JSON yang valid nih.", 400);
  }

  const parsed = createDebtSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datanya belum bener nih.",
      400,
    );
  }

  try {
    const { data, error } = await supabase
      .from("debts")
      .insert({
        user_id: userId,
        type: parsed.data.type,
        counterpart_name: parsed.data.counterpart_name,
        amount: parsed.data.amount,
        note:
          parsed.data.note === "" || !parsed.data.note
            ? null
            : parsed.data.note,
        due_date: parsed.data.due_date ?? null,
      })
      .select(DEBT_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return serverError("[api/debts POST]", error);
  }
}
