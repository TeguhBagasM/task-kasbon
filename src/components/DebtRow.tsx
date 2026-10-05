"use client";

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { formatIDR } from "@/lib/utils/currency";
import {
  diffDaysFromToday,
  formatRelativeDate,
  formatRelativeDateTime,
} from "@/lib/utils/date";
import type { Debt } from "@/types/debt";

function TypeBadge({ type }: { type: Debt["type"] }) {
  const owed = type === "owed_to_me";
  const Icon = owed ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        owed ? "bg-daun/10 text-daun" : "bg-bata/10 text-bata"
      }`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {owed ? "Dihutang ke saya" : "Saya hutang"}
    </span>
  );
}

function StatusBadge({ settled }: { settled: boolean }) {
  return settled ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-daun/10 px-2.5 py-1 text-xs font-semibold text-daun">
      <Check aria-hidden="true" className="h-3.5 w-3.5" />
      Lunas
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-kuning/15 px-2.5 py-1 text-xs font-semibold text-tinta">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-kuning" />
      Belum lunas
    </span>
  );
}

// Satu baris ledger: divider antar baris, bukan kartu.
// busy = mutasi baris ini berjalan (tombol disabled, cegah double click).
export function DebtRow({
  debt,
  busy,
  confirmDelete,
  onSettle,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  debt: Debt;
  busy: boolean;
  confirmDelete: boolean;
  onSettle: () => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const settled = debt.settled_at !== null;
  const overdueDays =
    !settled && debt.due_date ? diffDaysFromToday(debt.due_date) : null;
  const overdue = overdueDays !== null && overdueDays < 0;
  const overdueLabel =
    overdueDays === -1
      ? "kemarin"
      : debt.due_date
        ? formatRelativeDate(debt.due_date)
        : "";

  return (
    <article
      aria-label={`Catatan ${debt.counterpart_name}`}
      className={`flex flex-col gap-2 border-b border-tinta/10 py-4 last:border-b-0 ${
        settled ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-base font-semibold">{debt.counterpart_name}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={debt.type} />
            <StatusBadge settled={settled} />
          </div>
        </div>
        <p className="font-angka min-w-0 break-words text-right text-lg font-semibold">
          {formatIDR(debt.amount)}
        </p>
      </div>

      {debt.note && (
        <p className="line-clamp-2 text-sm text-tinta/70">{debt.note}</p>
      )}

      <div className="flex flex-col gap-0.5 text-sm text-tinta/70">
        {debt.due_date ? (
          overdue ? (
            <p className="inline-flex items-center gap-1 font-medium text-bata">
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
              Lewat tempo {overdueLabel}
            </p>
          ) : (
            <p>Jatuh tempo: {formatRelativeDate(debt.due_date)}</p>
          )
        ) : (
          <p>Dicatat {formatRelativeDateTime(debt.created_at)}</p>
        )}
      </div>

      {confirmDelete ? (
        <div
          role="alertdialog"
          aria-label="Konfirmasi hapus"
          className="flex items-center gap-2 rounded-lg bg-bata/10 px-3 py-2"
        >
          <p className="flex-1 text-sm font-medium">Yakin hapus catatan ini?</p>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirmDelete}
            aria-label={`Ya, hapus catatan ${debt.counterpart_name}`}
            className="h-11 rounded-lg bg-bata px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Ya, hapus
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancelDelete}
            className="h-11 rounded-lg border border-tinta/15 px-4 text-sm font-semibold disabled:opacity-60"
          >
            Batal
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onSettle}
            aria-label={
              settled
                ? `Batalkan lunas catatan ${debt.counterpart_name}`
                : `Tandai lunas catatan ${debt.counterpart_name}`
            }
            className="flex h-11 items-center gap-1.5 rounded-lg bg-daun px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {settled ? (
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Check aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "Sebentar..." : settled ? "Batal Lunas" : "Tandai Lunas"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onEdit}
            aria-label={`Ubah catatan ${debt.counterpart_name}`}
            className="flex h-11 items-center gap-1.5 rounded-lg border border-tinta/15 px-4 text-sm font-semibold disabled:opacity-60"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onAskDelete}
            aria-label={`Hapus catatan ${debt.counterpart_name}`}
            className="flex h-11 items-center gap-1.5 rounded-lg border border-tinta/15 px-4 text-sm font-semibold text-bata disabled:opacity-60"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Hapus
          </button>
        </div>
      )}
    </article>
  );
}
