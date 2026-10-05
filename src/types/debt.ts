// Tipe response API — satu definisi dipakai hook dan komponen.
// Cerminkan kontrak server (kolom eksplisit, tanpa user_id).
export type DebtType = "owed_to_me" | "i_owe";

export interface Debt {
  id: string;
  type: DebtType;
  counterpart_name: string;
  amount: number;
  note: string | null;
  due_date: string | null;
  settled_at: string | null;
  created_at: string;
}

export interface DebtSummary {
  owed_to_me: number;
  i_owe: number;
  net: number;
}

export type DebtStatusFilter = "all" | "unsettled" | "settled";
export type DebtTypeFilter = "all" | DebtType;

export interface DebtFilters {
  status: DebtStatusFilter;
  type: DebtTypeFilter;
  search: string;
}

export type DebtsApiResponse =
  | { success: true; data: Debt[]; summary: DebtSummary }
  | { success: false; error: string };

export type MutationApiResponse =
  | { success: true; data?: Debt; message?: string }
  | { success: false; error: string };
