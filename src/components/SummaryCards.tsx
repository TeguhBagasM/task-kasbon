import { TrendingDown, TrendingUp } from "lucide-react";
import { formatIDR } from "@/lib/utils/currency";
import type { DebtSummary } from "@/types/debt";

function CardShell({
  accent,
  children,
}: {
  accent: "daun" | "bata" | "netral";
  children: React.ReactNode;
}) {
  const accents = {
    daun: "border-t-daun",
    bata: "border-t-bata",
    netral: "border-t-kuning",
  } as const;
  return (
    <section
      className={`flex flex-col gap-1 rounded-b-xl rounded-t-sm border border-t-4 border-tinta/10 bg-white px-5 py-4 ${accents[accent]}`}
    >
      {children}
    </section>
  );
}

// Tiga kartu SELALU penuh di mobile (stack vertikal, tanpa scroll
// horizontal). Net paling besar + tanda +/- dan ikon — bukan warna saja.
export function SummaryCards({
  summary,
  loading,
}: {
  summary: DebtSummary;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Memuat ringkasan"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="h-24 animate-pulse rounded-b-xl rounded-t-sm bg-white"
          />
        ))}
      </div>
    );
  }

  const netPositive = summary.net >= 0;
  const NetIcon = netPositive ? TrendingUp : TrendingDown;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <CardShell accent="daun">
        <h2 className="text-sm text-tinta/70">Total dihutang ke saya</h2>
        <p className="font-angka text-2xl font-semibold text-daun">
          {formatIDR(summary.owed_to_me)}
        </p>
      </CardShell>

      <CardShell accent="bata">
        <h2 className="text-sm text-tinta/70">Total saya hutang</h2>
        <p className="font-angka text-2xl font-semibold text-bata">
          {formatIDR(summary.i_owe)}
        </p>
      </CardShell>

      <CardShell accent="netral">
        <h2 className="text-sm text-tinta/70">Sisa bersih</h2>
        <p
          aria-label={
            netPositive
              ? `Surplus ${formatIDR(summary.net)}`
              : `Minus ${formatIDR(Math.abs(summary.net))}`
          }
          className={`font-angka flex items-center gap-2 text-3xl font-bold ${
            netPositive ? "text-daun" : "text-bata"
          }`}
        >
          <NetIcon aria-hidden="true" className="h-6 w-6 shrink-0" />
          <span>
            {netPositive ? "+" : "-"}
            {formatIDR(Math.abs(summary.net))}
          </span>
        </p>
      </CardShell>
    </div>
  );
}
