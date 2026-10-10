"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import { autoMapField, normalizeDate, parseCSV } from "../../_lib/csv";
import {
  addBank,
  addCash,
  addExpense,
  addImport,
  addInventory,
  addSale,
  EMPTY_DEMO_SNAPSHOT,
  EMPTY_IMPORTS_SNAPSHOT,
  getDemoSnapshotString,
  getImportsSnapshotString,
  inLocation,
  safeParse,
  subscribeToDemoChanges,
  type DemoImport,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

type SectionKey = "sales" | "cash" | "bank" | "inventory" | "expenses";

type FieldDef = {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
};

const SECTIONS: Record<
  SectionKey,
  { label: string; fields: FieldDef[]; template: string[][] }
> = {
  sales: {
    label: "Sales",
    fields: [
      { key: "amount", label: "Amount", required: true, synonyms: ["total", "sum", "price", "value"] },
      { key: "date", label: "Date", required: true, synonyms: ["day", "transaction date", "sale date"] },
      { key: "method", label: "Method (cash/card)", required: false, synonyms: ["type", "tender", "payment", "payment type"] },
      { key: "note", label: "Note", required: false, synonyms: ["notes", "memo", "description"] },
    ],
    template: [
      ["amount", "date", "method", "note"],
      ["650", "2026-10-10", "cash", "Lunch rush"],
      ["350", "2026-10-10", "card", "Terminal"],
    ],
  },
  cash: {
    label: "Cash",
    fields: [
      { key: "kind", label: "Type (count/in/out)", required: false, synonyms: ["type", "kind"] },
      { key: "amount", label: "Amount", required: true, synonyms: ["total", "sum", "value"] },
      { key: "date", label: "Date", required: true, synonyms: ["day", "count date"] },
      { key: "note", label: "Note", required: false, synonyms: ["notes", "memo", "description"] },
    ],
    template: [
      ["kind", "amount", "date", "note"],
      ["count", "450", "2026-10-10", "Night close"],
      ["out", "50", "2026-10-10", "Paid cleaner"],
    ],
  },
  bank: {
    label: "Bank",
    fields: [
      { key: "kind", label: "Type (deposit/withdrawal/transfer)", required: false, synonyms: ["type", "kind"] },
      { key: "amount", label: "Amount", required: true, synonyms: ["total", "sum", "value", "deposit amount"] },
      { key: "date", label: "Date", required: true, synonyms: ["day", "value date", "posting date"] },
      { key: "note", label: "Note", required: false, synonyms: ["notes", "memo", "description", "details"] },
    ],
    template: [
      ["kind", "amount", "date", "note"],
      ["deposit", "700", "2026-10-10", "Weekend takings"],
    ],
  },
  inventory: {
    label: "Inventory",
    fields: [
      { key: "item", label: "Item", required: true, synonyms: ["product", "sku", "name", "item name"] },
      { key: "expected", label: "Should have", required: true, synonyms: ["should", "expected qty", "system qty"] },
      { key: "counted", label: "Counted", required: true, synonyms: ["actual", "physical", "counted qty"] },
      { key: "date", label: "Date", required: true, synonyms: ["day", "count date"] },
      { key: "note", label: "Note", required: false, synonyms: ["notes", "memo", "description"] },
    ],
    template: [
      ["item", "expected", "counted", "date", "note"],
      ["Cola 500ml", "100", "95", "2026-10-10", ""],
      ["Bread Loaf", "50", "50", "2026-10-10", ""],
    ],
  },
  expenses: {
    label: "Vendors / expenses",
    fields: [
      { key: "vendor", label: "Vendor", required: true, synonyms: ["supplier", "payee", "expense", "bill", "vendor name"] },
      { key: "amount", label: "Amount", required: true, synonyms: ["total", "sum", "value", "invoice amount"] },
      { key: "date", label: "Date", required: true, synonyms: ["day", "invoice date"] },
      { key: "note", label: "Note", required: false, synonyms: ["notes", "memo", "description"] },
    ],
    template: [
      ["vendor", "amount", "date", "note"],
      ["Power bill", "120", "2026-10-10", "Monthly"],
    ],
  },
};

type ValidatedRow = { values: Record<string, string> };
type InvalidRow = { index: number; raw: string[]; errors: string[] };

function pick(map: Record<string, number>, row: string[], key: string): string {
  const i = map[key];
  return i === undefined || i < 0 ? "" : (row[i] ?? "");
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function matchOption(raw: string, options: Record<string, string[]>): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  for (const [canonical, variants] of Object.entries(options)) {
    if (canonical === v || variants.includes(v)) return canonical;
  }
  return null;
}

const METHOD_OPTIONS: Record<string, string[]> = {
  cash: ["cash"],
  card: ["card", "credit", "debit", "credit card"],
};
const CASH_KIND_OPTIONS: Record<string, string[]> = {
  count: ["count", "drawer", "counted", "drawer count"],
  in: ["in", "cash in", "cash-in"],
  out: ["out", "cash out", "cash-out"],
};
const BANK_KIND_OPTIONS: Record<string, string[]> = {
  deposit: ["deposit"],
  withdrawal: ["withdrawal", "withdraw", "debit"],
  transfer: ["transfer"],
};

function validateRow(
  section: SectionKey,
  map: Record<string, number>,
  row: string[],
  rowNumber: number
): { ok: true; values: Record<string, string> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const values: Record<string, string> = {};
  const get = (k: string) => pick(map, row, k);

  if (section === "sales" || section === "cash" || section === "bank" || section === "expenses") {
    const amount = parseAmount(get("amount"));
    if (amount === null || amount <= 0) errors.push(`Row ${rowNumber}: amount must be a number above zero.`);
    else values.amount = String(Math.round(amount * 100) / 100);
    const date = normalizeDate(get("date"));
    if (!date) errors.push(`Row ${rowNumber}: date must look like YYYY-MM-DD.`);
    else values.date = date;
    values.note = get("note").trim();
  }
  if (section === "sales") {
    const raw = get("method");
    values.method = raw.trim() === "" ? "cash" : (matchOption(raw, METHOD_OPTIONS) ?? "");
    if (raw.trim() !== "" && !values.method)
      errors.push(`Row ${rowNumber}: method must be cash or card.`);
  }
  if (section === "cash") {
    const raw = get("kind");
    values.kind = raw.trim() === "" ? "count" : (matchOption(raw, CASH_KIND_OPTIONS) ?? "");
    if (raw.trim() !== "" && !values.kind)
      errors.push(`Row ${rowNumber}: type must be count, in, or out.`);
  }
  if (section === "bank") {
    const raw = get("kind");
    values.kind = raw.trim() === "" ? "deposit" : (matchOption(raw, BANK_KIND_OPTIONS) ?? "");
    if (raw.trim() !== "" && !values.kind)
      errors.push(`Row ${rowNumber}: type must be deposit, withdrawal, or transfer.`);
  }
  if (section === "inventory") {
    const item = get("item").trim();
    if (!item) errors.push(`Row ${rowNumber}: item name is required.`);
    else values.item = item;
    for (const k of ["expected", "counted"] as const) {
      const n = parseAmount(get(k));
      if (n === null || n < 0 || !Number.isInteger(Math.round(n)))
        errors.push(`Row ${rowNumber}: ${k} must be zero or more.`);
      else values[k] = String(Math.round(n));
    }
    const date = normalizeDate(get("date"));
    if (!date) errors.push(`Row ${rowNumber}: date must look like YYYY-MM-DD.`);
    else values.date = date;
    values.note = get("note").trim();
  }
  if (section === "expenses") {
    const vendor = get("vendor").trim();
    if (!vendor) errors.push(`Row ${rowNumber}: vendor is required.`);
    else values.vendor = vendor;
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, values };
}

export default function ImportsPage() {
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const importsSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getImportsSnapshotString,
    () => EMPTY_IMPORTS_SNAPSHOT
  );
  const { email: sessionEmail, business, location } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );
  const history = useMemo(
    () => inLocation(safeParse<DemoImport[]>(importsSnapshotString, []), location?.id ?? null),
    [importsSnapshotString, location?.id]
  );

  const [section, setSection] = useState<SectionKey>("sales");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; rejected: number } | null>(null);

  const fields = SECTIONS[section].fields;
  const mapped = headers.length > 0;
  const requiredMapped = fields
    .filter((f) => f.required)
    .every((f) => (mapping[f.key] ?? -1) >= 0);

  const review = useMemo((): { valid: ValidatedRow[]; invalid: InvalidRow[] } => {
    if (!mapped || !requiredMapped) return { valid: [], invalid: [] };
    const valid: ValidatedRow[] = [];
    const invalid: InvalidRow[] = [];
    rows.forEach((row, i) => {
      const r = validateRow(section, mapping, row, i + 1);
      if (r.ok) valid.push({ values: r.values });
      else invalid.push({ index: i + 1, raw: row, errors: r.errors });
    });
    return { valid, invalid };
  }, [mapped, requiredMapped, rows, mapping, section]);

  function resetFile() {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setFileError(null);
    setResult(null);
  }

  async function handleFile(file: File) {
    resetFile();
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please choose a .csv file. POS and bank exports usually offer one.");
      return;
    }
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setFileError("No rows found. Check the file has a header row plus data rows.");
      return;
    }
    const map: Record<string, number> = {};
    for (const f of SECTIONS[section].fields) {
      map[f.key] = autoMapField(parsed.headers, f.key, f.synonyms);
    }
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(map);
  }

  function handleTemplate() {
    const csv = SECTIONS[section].template
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `store-truth-${section}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleConfirm() {
    const owner = sessionEmail ?? "demo-owner";
    let count = 0;
    for (const row of review.valid) {
      const v = row.values;
      if (section === "sales")
        addSale({ amount: Number(v.amount), date: v.date, method: v.method as "cash" | "card", note: v.note, ownerEmail: owner });
      else if (section === "cash")
        addCash({ kind: v.kind as "count" | "in" | "out", amount: Number(v.amount), date: v.date, note: v.note, ownerEmail: owner });
      else if (section === "bank")
        addBank({ kind: v.kind as "deposit" | "withdrawal" | "transfer", amount: Number(v.amount), date: v.date, note: v.note, ownerEmail: owner });
      else if (section === "inventory")
        addInventory({ item: v.item, expected: Number(v.expected), counted: Number(v.counted), date: v.date, note: v.note, ownerEmail: owner });
      else
        addExpense({ vendor: v.vendor, amount: Number(v.amount), date: v.date, note: v.note, ownerEmail: owner });
      count++;
    }
    addImport({
      locationId: location?.id ?? null,
      fileName,
      section: SECTIONS[section].label,
      total: rows.length,
      imported: count,
      rejected: review.invalid.length,
      ownerEmail: owner,
    });
    setResult({ imported: count, rejected: review.invalid.length });
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
  }

  return (
    <div>
      <PageHeader
        title="Imports"
        explanation="Bring in POS, bank, and inventory files. Nothing becomes truth until you review and confirm it."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {!sessionEmail ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">Sign in to import</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Imports are tagged to your demo account and the active location.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          {result ? (
            <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-900">
                Imported {result.imported} {result.imported === 1 ? "row" : "rows"}
                {result.rejected > 0 ? `, ${result.rejected} rejected` : ""}.
              </p>
              <p className="mt-1 text-sm text-green-800">
                Valid rows are now part of the truth for {location?.name ?? "this view"}.
                Rejected rows were left out — fix them in the file and import again.
              </p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="mt-3 rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-900 hover:bg-green-100"
              >
                Import another file
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2">
              <h2 className="text-sm font-semibold">1 · Choose file</h2>
              <label htmlFor="import-section" className="mb-1 mt-4 block text-sm font-semibold">
                Import into
              </label>
              <select
                id="import-section"
                value={section}
                onChange={(e) => {
                  setSection(e.target.value as SectionKey);
                  resetFile();
                }}
                className={inputClass}
              >
                {(Object.keys(SECTIONS) as SectionKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SECTIONS[k].label} {location ? `· ${location.name}` : ""}
                  </option>
                ))}
              </select>

              <label htmlFor="import-file" className="mb-1 mt-4 block text-sm font-semibold">
                CSV file
              </label>
              <input
                id="import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.target.value = "";
                }}
                className="w-full text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border file:border-zinc-200 file:bg-zinc-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-zinc-900 hover:file:bg-zinc-100"
              />
              {fileError ? (
                <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {fileError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleTemplate}
                className="mt-4 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Download {SECTIONS[section].label} template
              </button>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Currency: {business?.currency ?? "USD"}. Dates like YYYY-MM-DD work best;
                MM/DD/YYYY is accepted too.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-3">
              <h2 className="text-sm font-semibold">2 · Map columns</h2>
              {!mapped ? (
                <p className="mt-1 text-sm text-zinc-600">
                  Pick a file and each column will be matched automatically. Fix
                  any wrong guesses here.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-zinc-600">
                    {fileName} · {rows.length} {rows.length === 1 ? "row" : "rows"} found.
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    {fields.map((f) => (
                      <div key={f.key} className="grid items-center gap-2 sm:grid-cols-2">
                        <label htmlFor={`map-${f.key}`} className="text-sm font-semibold">
                          {f.label}{" "}
                          {f.required ? (
                            <span className="text-xs font-medium text-red-600">required</span>
                          ) : (
                            <span className="text-xs font-normal text-zinc-500">optional</span>
                          )}
                        </label>
                        <select
                          id={`map-${f.key}`}
                          value={mapping[f.key] ?? -1}
                          onChange={(e) =>
                            setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))
                          }
                          className={inputClass}
                        >
                          <option value={-1}>— ignore —</option>
                          {headers.map((h, i) => (
                            <option key={i} value={i}>
                              {h || `(column ${i + 1})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {!requiredMapped ? (
                    <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      Map every required column before reviewing.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {mapped && requiredMapped ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">3 · Review and confirm</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {review.valid.length} valid, {review.invalid.length} invalid. Only
                valid rows are imported — nothing bad gets in silently.
              </p>
              {review.invalid.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                        <th scope="col" className="py-2 pr-4 font-semibold">Row</th>
                        <th scope="col" className="py-2 pr-4 font-semibold">Content</th>
                        <th scope="col" className="py-2 font-semibold">Problem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {review.invalid.slice(0, 20).map((r) => (
                        <tr key={r.index} className="border-b border-zinc-100 last:border-0">
                          <td className="py-2.5 pr-4 font-medium">{r.index}</td>
                          <td className="max-w-[280px] truncate py-2.5 pr-4 text-zinc-600">
                            {r.raw.join(" · ")}
                          </td>
                          <td className="py-2.5 text-red-700">{r.errors.join(" ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {review.invalid.length > 20 ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      Showing 20 of {review.invalid.length} invalid rows.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={review.valid.length === 0}
                className="mt-4 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Import {review.valid.length} valid {review.valid.length === 1 ? "row" : "rows"}
              </button>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold">Import history</h2>
            {history.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-600">
                No imports yet for {location?.name ?? "this view"}. History appears
                here after each confirmed import.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {h.fileName}{" "}
                        <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                          {h.section}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {h.imported} of {h.total} rows in, {h.rejected} rejected · by {h.ownerEmail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
