"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { parseIDRInput, formatIDR } from "@/lib/utils/currency";
import { todayCalendarDate } from "@/lib/utils/date";
import {
  createDebtSchema,
  type CreateDebtInput,
  type UpdateDebtInput,
} from "@/lib/validation/debt";
import type { Debt, DebtType } from "@/types/debt";
import type { MutationResult } from "@/hooks/useDebts";

// Pilihan implementasi: div custom, BUKAN <dialog> native.
// <dialog>.showModal() memberi trap+Esc+backdrop gratis, tapi API-nya
// imperatif (ref.showModal/close, event close) sehingga sulit diselaraskan
// dengan state React, animasi bottom-sheet via ::backdrop terbatas, dan
// konfirmasi "tutup tanpa menyimpan" harus dikustom juga. Trap manual di
// bawah (~30 baris) memberi kontrol penuh dengan perilaku yang sama.
const GROUP_FORMATTER = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function formatThousands(digits: string): string {
  if (digits === "") return "";
  return GROUP_FORMATTER.format(Number(digits));
}

type FieldErrors = Partial<Record<"name" | "amount" | "note" | "dueDate", string>>;

export function DebtModal({
  open,
  mode,
  initial,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: Debt | null;
  onClose: () => void;
  onCreate: (input: CreateDebtInput) => Promise<MutationResult>;
  onUpdate: (id: string, input: UpdateDebtInput) => Promise<MutationResult>;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Form di-reset via `key` dari parent (remount tiap dibuka) — state awal
  // di bawah selalu segar, tanpa effect sinkronisasi.
  const [type, setType] = useState<DebtType>(initial?.type ?? "owed_to_me");
  const [name, setName] = useState(initial?.counterpart_name ?? "");
  const [amountText, setAmountText] = useState(
    initial ? formatThousands(String(initial.amount)) : "",
  );
  const [dueDate, setDueDate] = useState(
    initial?.due_date ?? todayCalendarDate(),
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [shown, setShown] = useState(false);

  const isEdit = mode === "edit" && initial !== null;

  const dirty =
    name.trim() !== (initial?.counterpart_name ?? "") ||
    amountText !== (initial ? formatThousands(String(initial.amount)) : "") ||
    dueDate !== (initial?.due_date ?? todayCalendarDate()) ||
    note !== (initial?.note ?? "") ||
    type !== (initial?.type ?? "owed_to_me");

  const requestClose = useCallback(() => {
    if (dirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [dirty, confirmDiscard, onClose]);

  // Fokus masuk, trap, Esc, kunci scroll, fokus kembali saat tutup.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const frame = requestAnimationFrame(() => {
      setShown(true);
      nameRef.current?.focus();
    });
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [open, requestClose]);

  if (!open) return null;

  function setIssue(path: string, message: string, errors: FieldErrors) {
    if (path === "counterpart_name") errors.name = message;
    else if (path === "amount") errors.amount = message;
    else if (path === "note") errors.note = message;
    else if (path === "due_date") errors.dueDate = message;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setFormError(null);

    const amount = parseIDRInput(amountText);
    const errors: FieldErrors = {};
    if (amount === null) {
      errors.amount = "Jumlahnya diisi dulu ya, harus lebih dari 0.";
    }

    const candidate = {
      type,
      counterpart_name: name,
      amount: amount ?? 0,
      note: note === "" ? undefined : note,
      due_date: dueDate === "" ? undefined : dueDate,
    };
    const parsed = createDebtSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = String(issue.path[0] ?? "");
        if (path === "amount" && errors.amount) continue;
        setIssue(path, issue.message, errors);
      }
    }
    // Pesan server (400/500) yang tak terpetakan ke field tampil di form.
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (amount === null) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (isEdit && initial) {
      const patch: UpdateDebtInput = {};
      if (type !== initial.type) patch.type = type;
      if (name.trim() !== initial.counterpart_name) {
        patch.counterpart_name = name.trim();
      }
      if (amount !== initial.amount) patch.amount = amount;
      if (note.trim() !== (initial.note ?? "")) patch.note = note.trim();
      if (dueDate !== (initial.due_date ?? "")) patch.due_date = dueDate;
      // Tanpa perubahan -> tutup tanpa request.
      if (Object.keys(patch).length === 0) {
        onClose();
        return;
      }
      setSaving(true);
      try {
        const result = await onUpdate(initial.id, patch);
        if (!result.ok) {
          setFormError(result.message);
          return;
        }
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        const result = await onCreate({
          type,
          counterpart_name: name.trim(),
          amount,
          note: note === "" ? undefined : note,
          due_date: dueDate === "" ? undefined : dueDate,
        });
        if (!result.ok) {
          setFormError(result.message);
          return;
        }
      } finally {
        setSaving(false);
      }
    }
    onClose();
  }

  const nameErrorId = `${titleId}-name-error`;
  const amountErrorId = `${titleId}-amount-error`;
  const dueDateErrorId = `${titleId}-duedate-error`;
  const noteErrorId = `${titleId}-note-error`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[90dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-2xl bg-kertas px-5 py-6 transition-all duration-200 sm:max-w-md sm:rounded-2xl ${
          shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold">
            {isEdit ? "Ubah catatan" : "Catat baru"}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Tutup dialog"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-tinta/15"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-1 text-sm font-medium">Tipe catatan</legend>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                  type === "owed_to_me"
                    ? "border-daun bg-daun/10 text-daun"
                    : "border-tinta/15"
                }`}
              >
                <input
                  type="radio"
                  name="debt-type"
                  value="owed_to_me"
                  checked={type === "owed_to_me"}
                  onChange={() => setType("owed_to_me")}
                  className="accent-daun"
                />
                Saya dihutang
              </label>
              <label
                className={`flex h-12 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 text-sm font-semibold ${
                  type === "i_owe"
                    ? "border-bata bg-bata/10 text-bata"
                    : "border-tinta/15"
                }`}
              >
                <input
                  type="radio"
                  name="debt-type"
                  value="i_owe"
                  checked={type === "i_owe"}
                  onChange={() => setType("i_owe")}
                  className="accent-bata"
                />
                Saya hutang
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-name`} className="text-sm font-medium">
              Nama
            </label>
            <input
              ref={nameRef}
              id={`${titleId}-name`}
              type="text"
              autoComplete="off"
              placeholder="Siapa?"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-describedby={fieldErrors.name ? nameErrorId : undefined}
              aria-invalid={fieldErrors.name ? true : undefined}
              className="h-12 rounded-lg border border-tinta/15 bg-white px-4 outline-none placeholder:text-tinta/40 focus:border-pulpen"
            />
            {fieldErrors.name && (
              <p id={nameErrorId} role="alert" className="text-sm text-bata">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-amount`} className="text-sm font-medium">
              Jumlah (Rupiah)
            </label>
            <input
              id={`${titleId}-amount`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="150.000"
              value={amountText}
              onChange={(event) =>
                setAmountText(
                  formatThousands(event.target.value.replace(/[^0-9]/g, "")),
                )
              }
              aria-describedby={fieldErrors.amount ? amountErrorId : undefined}
              aria-invalid={fieldErrors.amount ? true : undefined}
              className="font-angka h-12 rounded-lg border border-tinta/15 bg-white px-4 outline-none placeholder:text-tinta/40 focus:border-pulpen"
            />
            {fieldErrors.amount && (
              <p id={amountErrorId} role="alert" className="text-sm text-bata">
                {fieldErrors.amount}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${titleId}-duedate`}
              className="text-sm font-medium"
            >
              Jatuh tempo
            </label>
            <input
              id={`${titleId}-duedate`}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-describedby={fieldErrors.dueDate ? dueDateErrorId : undefined}
              aria-invalid={fieldErrors.dueDate ? true : undefined}
              className="h-12 rounded-lg border border-tinta/15 bg-white px-4 outline-none focus:border-pulpen"
            />
            {fieldErrors.dueDate && (
              <p id={dueDateErrorId} role="alert" className="text-sm text-bata">
                {fieldErrors.dueDate}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor={`${titleId}-note`}
                className="text-sm font-medium"
              >
                Catatan
              </label>
              <span className="text-xs text-tinta/60" aria-live="polite">
                {note.length}/200
              </span>
            </div>
            <textarea
              id={`${titleId}-note`}
              rows={3}
              maxLength={200}
              placeholder="Buat apa? (opsional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-describedby={fieldErrors.note ? noteErrorId : undefined}
              aria-invalid={fieldErrors.note ? true : undefined}
              className="rounded-lg border border-tinta/15 bg-white px-4 py-3 outline-none placeholder:text-tinta/40 focus:border-pulpen"
            />
            {fieldErrors.note && (
              <p id={noteErrorId} role="alert" className="text-sm text-bata">
                {fieldErrors.note}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="rounded-lg bg-bata/10 px-4 py-3 text-sm text-bata">
              {formError}
            </p>
          )}

          {confirmDiscard && (
            <div
              role="alertdialog"
              aria-label="Konfirmasi tutup"
              className="flex items-center gap-2 rounded-lg bg-kuning/15 px-3 py-2"
            >
              <p className="flex-1 text-sm font-medium">
                Tutup tanpa menyimpan?
              </p>
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-lg bg-bata px-4 text-sm font-semibold text-white"
              >
                Ya, tutup
              </button>
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="h-11 rounded-lg border border-tinta/15 px-4 text-sm font-semibold"
              >
                Lanjut isi
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-lg bg-pulpen font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Simpan catatan"}
          </button>
        </form>

        <p className="text-xs text-tinta/50">
          Nilai Rupiah: {amountText === "" ? "-" : formatIDR(parseIDRInput(amountText) ?? 0)}
        </p>
      </div>
    </div>
  );
}
