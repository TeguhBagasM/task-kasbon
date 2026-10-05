import { z } from "zod";
import { parseCalendarDate } from "@/lib/utils/date";

// Satu schema dipakai form client DAN route handler (single source of truth).
// Alasan (masuk README): validasi tidak ditulis dua kali di dua tempat yang
// bisa dryak — kontrak payload didefinisikan sekali di sini.

export const debtTypeSchema = z.enum(["owed_to_me", "i_owe"], {
  error: "Tipe-nya pilih salah satu ya: saya dihutang atau saya hutang.",
});

const counterpartNameSchema = z
  .string()
  .trim()
  .min(1, "Namanya diisi dulu ya.")
  .max(100, "Namanya kepanjangan, maksimal 100 karakter ya.");

const amountSchema = z
  .number({ error: "Jumlahnya harus angka ya." })
  .int("Jumlahnya harus bilangan bulat ya.")
  .positive("Jumlahnya harus lebih dari 0 ya.");

const noteSchema = z
  .string()
  .trim()
  .max(200, "Catatannya maksimal 200 karakter ya.")
  .optional();

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggalnya pakai format YYYY-MM-DD ya.")
  .refine(
    (value) => parseCalendarDate(value) !== null,
    "Tanggalnya nggak valid nih, cek lagi ya.",
  )
  .optional();

export const createDebtSchema = z.object({
  type: debtTypeSchema,
  counterpart_name: counterpartNameSchema,
  amount: amountSchema,
  note: noteSchema,
  due_date: dueDateSchema,
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
