import { describe, expect, it } from "vitest";
import { formatIDR, parseIDRInput } from "./currency";

// Intl id-ID menyisipkan NBSP (U+00A0) setelah "Rp".
// Normalisasi HANYA di sisi assertion — kode produksi tidak diubah.
function assertIDR(amount: number, expected: string) {
  expect(formatIDR(amount).replace(/\u00a0/g, " ")).toBe(expected);
}

describe("formatIDR", () => {
  it("memformat 0, jutaan, dan angka acak", () => {
    assertIDR(0, "Rp 0");
    assertIDR(1500000, "Rp 1.500.000");
    assertIDR(1234000, "Rp 1.234.000");
  });
});

describe("parseIDRInput", () => {
  it("menerima format Rupiah dan angka polos", () => {
    expect(parseIDRInput("Rp 1.500.000")).toBe(1500000);
    expect(parseIDRInput("1500000")).toBe(1500000);
  });

  it("menolak string kosong, non-angka, nol, dan di atas safe integer", () => {
    expect(parseIDRInput("")).toBeNull();
    expect(parseIDRInput("abc")).toBeNull();
    expect(parseIDRInput("Rp 0")).toBeNull();
    expect(parseIDRInput("9".repeat(20))).toBeNull();
  });
});
