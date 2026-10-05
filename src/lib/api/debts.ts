// Kolom eksplisit untuk semua SELECT debts — jangan select('*'),
// jangan kembalikan user_id ke client.
export const DEBT_SELECT_COLUMNS =
  "id, type, counterpart_name, amount, note, due_date, settled_at, created_at";

export interface DebtRow {
  id: string;
  type: "owed_to_me" | "i_owe";
  counterpart_name: string;
  amount: number;
  note: string | null;
  due_date: string | null;
  settled_at: string | null;
  created_at: string;
}
