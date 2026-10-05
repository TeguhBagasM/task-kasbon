import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Body: Plus Jakarta Sans — dirancang untuk Bahasa Indonesia, casual,
// sangat terbaca di layar kecil. Angka: Space Grotesk + tabular-nums —
// geometris dan jelas beda dari body, angka rata kanan di kolom ledger.
const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const angkaFont = Space_Grotesk({
  variable: "--font-angka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kasbon",
  description: "Catat utang-piutang kamu dengan santai.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${bodyFont.variable} ${angkaFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
