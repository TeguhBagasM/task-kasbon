import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDebtSchema } from "@/lib/validation/debt";

const UNAUTHENTICATED = "Sesi kamu sudah berakhir. Silakan login kembali ya.";
const SERVER_ERROR = "Ada yang salah di server nih, coba lagi ya.";

interface DebtRow {
  id: string;
  type: "owed_to_me" | "i_owe";
  counterpart_name: string;
  amount: number;
  note: string | null;
  due_date: string | null;
  settled_at: string | null;
  created_at: string;
}

// Escape karakter spesial LIKE (Postgres: backslash adalah escape default).
// Tanpa ini, % dan _ dari input user jadi wildcard + vektor probing data.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function unauthorized() {
  return NextResponse.json(
    { success: false, error: UNAUTHENTICATED },
    { status: 401 },
  );
}

// GET /api/debts?status=all|unsettled|settled&type=all|owed_to_me|i_owe&search=
// Search hanya ke counterpart_name (ILIKE, escaped). Summary selalu dihitung
// dari SEMUA entry belum lunas — independen dari filter list.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "all";
  const type = params.get("type") ?? "all";
  const search = (params.get("search") ?? "").trim();

  if (!["all", "unsettled", "settled"].includes(status)) {
    return NextResponse.json(
      { success: false, error: "Filter status-nya nggak dikenal nih." },
      { status: 400 },
    );
  }
  if (!["all", "owed_to_me", "i_owe"].includes(type)) {
    return NextResponse.json(
      { success: false, error: "Filter tipe-nya nggak dikenal nih." },
      { status: 400 },
    );
  }

  try {
    let query = supabase
      .from("debts")
      .select(
        "id, type, counterpart_name, amount, note, due_date, settled_at, created_at",
      )
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
    console.error("[api/debts GET]", error);
    return NextResponse.json(
      { success: false, error: SERVER_ERROR },
      { status: 500 },
    );
  }
}

// POST /api/debts — user_id SELALU dari session, tidak pernah dari body
// (schema bahkan tidak punya field user_id).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Body-nya bukan JSON yang valid nih." },
      { status: 400 },
    );
  }

  const parsed = createDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datanya belum bener nih.",
      },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("debts")
      .insert({
        user_id: user.id,
        type: parsed.data.type,
        counterpart_name: parsed.data.counterpart_name,
        amount: parsed.data.amount,
        note: parsed.data.note === "" || !parsed.data.note ? null : parsed.data.note,
        due_date: parsed.data.due_date ?? null,
      })
      .select(
        "id, type, counterpart_name, amount, note, due_date, settled_at, created_at",
      )
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[api/debts POST]", error);
    return NextResponse.json(
      { success: false, error: SERVER_ERROR },
      { status: 500 },
    );
  }
}
