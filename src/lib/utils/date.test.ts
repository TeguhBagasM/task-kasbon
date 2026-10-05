import { describe, expect, it } from "vitest";
import {
  diffDaysFromToday,
  formatRelativeDate,
  formatRelativeDateTime,
  parseCalendarDate,
  todayCalendarDate,
} from "./date";

// 2026-10-04T18:00:00Z = 2026-10-05 01:00 di Asia/Jakarta.
// Kasus batas: server UTC masih "4 Okt", user sudah "5 Okt".
const NOW_JAKARTA_OCT5 = new Date("2026-10-04T18:00:00Z");

describe("todayCalendarDate", () => {
  it("mengembalikan tanggal Jakarta, bukan UTC server", () => {
    expect(todayCalendarDate(NOW_JAKARTA_OCT5)).toBe("2026-10-05");
  });
});

describe("parseCalendarDate", () => {
  it("menerima tanggal nyata dan menolak yang mustahil", () => {
    expect(parseCalendarDate("2026-10-05")).toEqual({
      year: 2026,
      month: 10,
      day: 5,
    });
    expect(parseCalendarDate("2026-02-30")).toBeNull();
    expect(parseCalendarDate("2026-13-01")).toBeNull();
    expect(parseCalendarDate("05-10-2026")).toBeNull();
    expect(parseCalendarDate("besok")).toBeNull();
  });

  it("menerima 29 Feb di tahun kabisat", () => {
    expect(parseCalendarDate("2024-02-29")).not.toBeNull();
  });
});

describe("formatRelativeDate", () => {
  it("kemarin, hari ini, besok", () => {
    expect(formatRelativeDate("2026-10-04", NOW_JAKARTA_OCT5)).toBe("Kemarin");
    expect(formatRelativeDate("2026-10-05", NOW_JAKARTA_OCT5)).toBe("Hari ini");
    expect(formatRelativeDate("2026-10-06", NOW_JAKARTA_OCT5)).toBe("Besok");
  });

  it("6/7/14 hari lalu dan lagi", () => {
    expect(formatRelativeDate("2026-09-29", NOW_JAKARTA_OCT5)).toBe("6 hari lalu");
    expect(formatRelativeDate("2026-09-28", NOW_JAKARTA_OCT5)).toBe("1 minggu lalu");
    expect(formatRelativeDate("2026-09-21", NOW_JAKARTA_OCT5)).toBe("2 minggu lalu");
    expect(formatRelativeDate("2026-10-11", NOW_JAKARTA_OCT5)).toBe("6 hari lagi");
    expect(formatRelativeDate("2026-10-12", NOW_JAKARTA_OCT5)).toBe("1 minggu lagi");
    expect(formatRelativeDate("2026-10-19", NOW_JAKARTA_OCT5)).toBe("2 minggu lagi");
  });

  it("lintas bulan dan lintas tahun jadi tanggal absolut", () => {
    expect(formatRelativeDate("2026-09-20", NOW_JAKARTA_OCT5)).toBe("2 minggu lalu");
    expect(formatRelativeDate("2026-08-01", NOW_JAKARTA_OCT5)).toBe("1 Agu 2026");
    expect(formatRelativeDate("2025-12-31", NOW_JAKARTA_OCT5)).toBe("31 Des 2025");
    expect(formatRelativeDate("2026-12-25", NOW_JAKARTA_OCT5)).toBe("25 Des 2026");
  });

  it("null dan format salah", () => {
    expect(formatRelativeDate(null, NOW_JAKARTA_OCT5)).toBe("Tanpa tenggat");
    expect(formatRelativeDate("2026-02-30", NOW_JAKARTA_OCT5)).toBe(
      "Tanggal nggak valid",
    );
  });
});

describe("diffDaysFromToday", () => {
  it("negatif untuk lalu, positif untuk depan", () => {
    expect(diffDaysFromToday("2026-10-04", NOW_JAKARTA_OCT5)).toBe(-1);
    expect(diffDaysFromToday("2026-10-06", NOW_JAKARTA_OCT5)).toBe(1);
    expect(diffDaysFromToday("ngaco", NOW_JAKARTA_OCT5)).toBeNull();
  });
});

describe("formatRelativeDateTime", () => {
  it("baru aja, jam lalu, dan kemarin untuk timestamp", () => {
    const now = new Date("2026-10-05T02:00:00Z"); // 09:00 Jakarta
    expect(
      formatRelativeDateTime("2026-10-05T01:50:00Z", now),
    ).toBe("Baru aja");
    expect(
      formatRelativeDateTime("2026-10-04T23:00:00Z", now),
    ).toBe("3 jam lalu");
    expect(
      formatRelativeDateTime("2026-10-04T10:00:00Z", now),
    ).toBe("Kemarin");
    expect(formatRelativeDateTime("ngaco", now)).toBe("Tanggal nggak valid");
  });
});
