// Minimal client-side CSV parsing + header auto-mapping.
// No dependencies; handles quoted fields, commas inside quotes, and CRLF.

export type ParsedCSV = {
  headers: string[];
  rows: string[][];
};

export function parseCSV(text: string): ParsedCSV {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip fully empty lines.
    if (current.length > 1 || current[0].trim() !== "" || field.trim() !== "") {
      pushField();
      rows.push(current);
    } else {
      field = "";
    }
    current = [];
  };

  const clean = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n") {
      pushRow();
    } else if (ch === "\r") {
      // Handled with the following \n; lone \r also ends the row.
      if (clean[i + 1] !== "\n") pushRow();
    } else {
      field += ch;
    }
  }
  if (field !== "" || current.length > 0) {
    pushField();
    rows.push(current);
  }

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim());
  const data = rows
    .slice(1)
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));
  return { headers, rows: data };
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Best index in headers for a field, or -1. Matches exact names first, then synonyms. */
export function autoMapField(headers: string[], key: string, synonyms: string[]): number {
  const Wanted = [key, ...synonyms].map(norm);
  const have = headers.map(norm);
  for (let i = 0; i < have.length; i++) {
    if (Wanted.includes(have[i])) return i;
  }
  // Partial contains match as a fallback (e.g. "total amount" for amount).
  for (let i = 0; i < have.length; i++) {
    if (Wanted.some((w) => w && (have[i].includes(w) || w.includes(have[i])))) return i;
  }
  return -1;
}

/** Accepts YYYY-MM-DD (stored as-is) and MM/DD/YYYY or DD-MM-YYYY; returns ISO date or null. */
export function normalizeDate(raw: string): string | null {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return validYMD(y, m, d) ? v : null;
  }
  let m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    const year = Number(m[3]);
    return validYMD(year, month, day) ? toISO(year, month, day) : null;
  }
  m = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    return validYMD(year, month, day) ? toISO(year, month, day) : null;
  }
  return null;
}

function validYMD(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
