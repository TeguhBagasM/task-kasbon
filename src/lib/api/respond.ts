import { NextResponse } from "next/server";

// Format error seragam { success: false, error: string } di semua handler.
// Pesan mentah/internal tidak pernah keluar — hanya ke console server.
export function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export function notFoundDebt() {
  return jsonError("Catatan utang-nya nggak ketemu nih.", 404);
}

export function serverError(scope: string, error: unknown) {
  console.error(scope, error);
  return jsonError("Ada yang salah di server nih, coba lagi ya.", 500);
}
