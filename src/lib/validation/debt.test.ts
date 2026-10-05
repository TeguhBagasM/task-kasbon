import { describe, expect, it } from "vitest";
import { createDebtSchema, updateDebtSchema } from "./debt";

const VALID_CREATE = {
  type: "owed_to_me",
  counterpart_name: "Budi",
  amount: 150000,
  note: "Uang makan siang",
  due_date: "2026-10-10",
} as const;

describe("createDebtSchema", () => {
  it("menerima payload valid", () => {
    expect(createDebtSchema.safeParse(VALID_CREATE).success).toBe(true);
  });

  it("menerima payload minimal tanpa note dan due_date", () => {
    expect(
      createDebtSchema.safeParse({
        type: "i_owe",
        counterpart_name: "Siti",
        amount: 50000,
      }).success,
    ).toBe(true);
  });

  it("menolak tipe salah, nama kosong, dan amount tak positif", () => {
    expect(
      createDebtSchema.safeParse({ ...VALID_CREATE, type: "hutang" }).success,
    ).toBe(false);
    expect(
      createDebtSchema.safeParse({ ...VALID_CREATE, counterpart_name: "  " })
        .success,
    ).toBe(false);
    for (const amount of [0, -5, 1.5]) {
      expect(
        createDebtSchema.safeParse({ ...VALID_CREATE, amount }).success,
      ).toBe(false);
    }
  });

  it("menolak note > 200 karakter dan tanggal mustahil", () => {
    expect(
      createDebtSchema.safeParse({ ...VALID_CREATE, note: "x".repeat(201) })
        .success,
    ).toBe(false);
    expect(
      createDebtSchema.safeParse({ ...VALID_CREATE, due_date: "2026-02-30" })
        .success,
    ).toBe(false);
    expect(
      createDebtSchema.safeParse({ ...VALID_CREATE, due_date: "10-10-2026" })
        .success,
    ).toBe(false);
  });
});

describe("updateDebtSchema", () => {
  it("menerima patch parsial dan is_settled saja", () => {
    expect(
      updateDebtSchema.safeParse({ amount: 200000 }).success,
    ).toBe(true);
    expect(updateDebtSchema.safeParse({ is_settled: true }).success).toBe(true);
  });

  it("menolak body kosong", () => {
    const result = updateDebtSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("menolak user_id dan settled_at (.strict)", () => {
    expect(
      updateDebtSchema.safeParse({ user_id: "some-id" }).success,
    ).toBe(false);
    expect(
      updateDebtSchema.safeParse({ settled_at: "2026-10-05T00:00:00Z" })
        .success,
    ).toBe(false);
  });

  it("menolak nilai field yang tak valid", () => {
    expect(updateDebtSchema.safeParse({ amount: -5 }).success).toBe(false);
    expect(
      updateDebtSchema.safeParse({ due_date: "2026-02-30" }).success,
    ).toBe(false);
  });
});
