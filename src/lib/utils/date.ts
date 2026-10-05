// Tanggal relatif Bahasa Indonesia dengan zona Asia/Jakarta eksplisit.
//
// DILARANG new Date('YYYY-MM-DD'): string tanggal tanpa waktu diparse sebagai
// UTC, sehingga di server (Vercel, UTC) bisa mundur 1 hari dari maksud user.
// Semua path di sini parse manual jadi { year, month, day } kalender.

const TIME_ZONE = "Asia/Jakarta";
const DAY_MS = 86_400_000;
const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

// "Hari ini" menurut Asia/Jakarta sebagai YYYY-MM-DD.
// en-CA menghasilkan format YYYY-MM-DD langsung.
export function todayCalendarDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Parse manual YYYY-MM-DD. null bila format salah atau tanggal tak nyata
// (mis. 2026-02-30, bulan 13). Pengecekan via aritmetika UTC murni.
export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function toUtcDayNumber(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day) / DAY_MS;
}

// Selisih hari kalender (target - hari ini) dalam zona Asia/Jakarta.
// Negatif = masa lalu, positif = masa depan, null = input tak valid.
export function diffDaysFromToday(
  target: string,
  now: Date = new Date(),
): number | null {
  const parsedTarget = parseCalendarDate(target);
  const parsedToday = parseCalendarDate(todayCalendarDate(now));
  if (!parsedTarget || !parsedToday) return null;
  return toUtcDayNumber(parsedTarget) - toUtcDayNumber(parsedToday);
}

function formatAbsoluteDate(target: string): string {
  const parsed = parseCalendarDate(target);
  if (!parsed) return "Tanggal nggak valid";
  return `${parsed.day} ${MONTHS_ID[parsed.month - 1]} ${parsed.year}`;
}

// Relatif untuk due_date (mendukung masa lalu DAN masa depan).
export function formatRelativeDate(
  target: string | null,
  now: Date = new Date(),
): string {
  if (!target) return "Tanpa tenggat";
  const diff = diffDaysFromToday(target, now);
  if (diff === null) return "Tanggal nggak valid";
  if (diff === 0) return "Hari ini";
  if (diff === -1) return "Kemarin";
  if (diff === 1) return "Besok";
  if (diff < 0) {
    const days = Math.abs(diff);
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? "1 minggu lalu" : `${weeks} minggu lalu`;
    }
    return formatAbsoluteDate(target);
  }
  if (diff < 7) return `${diff} hari lagi`;
  if (diff < 30) {
    const weeks = Math.floor(diff / 7);
    return weeks === 1 ? "1 minggu lagi" : `${weeks} minggu lagi`;
  }
  return formatAbsoluteDate(target);
}

// Relatif untuk timestamp (created_at): "Baru aja" / "X jam lalu" bila
// masih hari ini (Jakarta), selebihnya ikut formatRelativeDate.
export function formatRelativeDateTime(
  value: string,
  now: Date = new Date(),
): string {
  const thenMs = new Date(value).getTime();
  if (Number.isNaN(thenMs)) return "Tanggal nggak valid";
  const thenDay = todayCalendarDate(new Date(thenMs));
  if (thenDay === todayCalendarDate(now)) {
    const diffMs = now.getTime() - thenMs;
    if (diffMs < 0) return "Hari ini";
    const hours = Math.floor(diffMs / 3_600_000);
    if (hours < 1) return "Baru aja";
    return `${hours} jam lalu`;
  }
  return formatRelativeDate(thenDay, now);
}
