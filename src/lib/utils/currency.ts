// Format Rupiah wajib: Intl id-ID, IDR, tanpa desimal. Contoh: Rp 1.234.000
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Parse input bebas ("Rp 1.500.000", "1500000") jadi integer rupiah.
// null = tidak valid (kosong, nol, negatif, atau di luar safe integer).
export function parseIDRInput(value: string): number | null {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits === "") return null;
  const amount = Number(digits);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  return amount;
}
