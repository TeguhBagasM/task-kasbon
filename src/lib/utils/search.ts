// Escape karakter spesial LIKE (Postgres: backslash adalah escape default).
// Tanpa ini, % dan _ dari input user jadi wildcard + vektor probing data.
// Dipakai untuk filter search counterpart_name — JANGAN digabung .or()
// dengan string interpolation.
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
