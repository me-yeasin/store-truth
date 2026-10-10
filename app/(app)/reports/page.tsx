"use client";

import { useMemo, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  EMPTY_BANK_SNAPSHOT,
  EMPTY_CASH_SNAPSHOT,
  EMPTY_DEMO_SNAPSHOT,
  EMPTY_EXPENSE_SNAPSHOT,
  EMPTY_INVENTORY_SNAPSHOT,
  EMPTY_SALES_SNAPSHOT,
  getBankSnapshotString,
  getCashSnapshotString,
  getDemoSnapshotString,
  getExpenseSnapshotString,
  getInventorySnapshotString,
  getSalesSnapshotString,
  inLocation,
  safeParse,
  subscribeToDemoChanges,
  type DemoBank,
  type DemoCash,
  type DemoExpense,
  type DemoInventory,
  type DemoSale,
  type DemoSnapshot,
} from "../../_lib/demo-store";
import { computeTruth } from "../../_lib/truth";

function formatMoney(amount: number, currency: string) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${Math.abs(amount).toFixed(2)}`;
}

function toCSV(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export default function ReportsPage() {
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const salesSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getSalesSnapshotString,
    () => EMPTY_SALES_SNAPSHOT
  );
  const cashSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getCashSnapshotString,
    () => EMPTY_CASH_SNAPSHOT
  );
  const bankSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getBankSnapshotString,
    () => EMPTY_BANK_SNAPSHOT
  );
  const inventorySnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getInventorySnapshotString,
    () => EMPTY_INVENTORY_SNAPSHOT
  );
  const expenseSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getExpenseSnapshotString,
    () => EMPTY_EXPENSE_SNAPSHOT
  );

  const { business, location } = useMemo(
    () =>
      safeParse<DemoSnapshot>(snapshotString, {
        email: null,
        business: null,
        location: null,
      }),
    [snapshotString]
  );
  const sales = useMemo(
    () => inLocation(safeParse<DemoSale[]>(salesSnapshotString, []), location?.id ?? null),
    [salesSnapshotString, location?.id]
  );
  const cashEntries = useMemo(
    () => inLocation(safeParse<DemoCash[]>(cashSnapshotString, []), location?.id ?? null),
    [cashSnapshotString, location?.id]
  );
  const bankEntries = useMemo(
    () => inLocation(safeParse<DemoBank[]>(bankSnapshotString, []), location?.id ?? null),
    [bankSnapshotString, location?.id]
  );
  const inventory = useMemo(
    () => inLocation(safeParse<DemoInventory[]>(inventorySnapshotString, []), location?.id ?? null),
    [inventorySnapshotString, location?.id]
  );
  const expenses = useMemo(
    () => inLocation(safeParse<DemoExpense[]>(expenseSnapshotString, []), location?.id ?? null),
    [expenseSnapshotString, location?.id]
  );

  const currency = business?.currency ?? "USD";
  const truth = computeTruth(sales, cashEntries, bankEntries, currency, inventory, expenses);
  const hasAnything =
    truth.hasSales || truth.hasCash || truth.hasBank || truth.hasInventory || truth.hasExpenses;

  const byDate = useMemo(() => {
    const map = new Map<string, { sales: number; counted: number; deposits: number }>();
    const row = (date: string) => {
      const existing = map.get(date) ?? { sales: 0, counted: 0, deposits: 0 };
      map.set(date, existing);
      return existing;
    };
    for (const s of sales) row(s.date).sales += s.amount;
    for (const c of cashEntries) {
      if (c.kind === "count") row(c.date).counted += c.amount;
    }
    for (const b of bankEntries) {
      if (b.kind === "deposit") row(b.date).deposits += b.amount;
    }
    return [...map.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  }, [sales, cashEntries, bankEntries]);

  function handleExport() {
    const rows: string[][] = [
      ["section", "date", "label", "amount", "detail", "by"],
      ...sales.map((s) => [
        "sales",
        s.date,
        s.method,
        s.amount.toFixed(2),
        s.note,
        s.ownerEmail,
      ]),
      ...cashEntries.map((c) => [
        "cash",
        c.date,
        c.kind,
        c.amount.toFixed(2),
        c.note,
        c.ownerEmail,
      ]),
      ...bankEntries.map((b) => [
        "bank",
        b.date,
        b.kind,
        b.amount.toFixed(2),
        b.note,
        b.ownerEmail,
      ]),
      ...inventory.map((i) => [
        "inventory",
        i.date,
        i.item,
        `expected ${i.expected}, counted ${i.counted}`,
        i.note,
        i.ownerEmail,
      ]),
      ...expenses.map((e) => [
        "expense",
        e.date,
        e.vendor,
        e.amount.toFixed(2),
        `${e.status}${e.note ? ` · ${e.note}` : ""}`,
        e.ownerEmail,
      ]),
    ];
    const blob = new Blob([toCSV(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `store-truth-report-${business?.name ?? "demo"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        explanation="Daily summaries in plain language, built from your real entries. Export to CSV when you need the numbers elsewhere."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          {business?.name ?? "Demo"} · {location?.name ?? "All locations"}
        </span>
        {hasAnything ? (
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Export CSV
          </button>
        ) : null}
      </PageHeader>

      {!hasAnything ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">No reports yet</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Daily close, sales vs bank vs cash, cash variance, bank match,
            inventory, and vendor reports generate from real data.
          </p>
          <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
            Next step: add sales, cash, or bank entries first.
          </p>
        </div>
      ) : (
        <>
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Total sales
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {formatMoney(truth.salesTotal, currency)}
              </p>
              <p className="mt-1 text-sm text-zinc-600">{truth.salesCount} sales.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Cash variance
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {truth.hasCash ? formatMoney(truth.cashVariance, currency) : "—"}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Counted {formatMoney(truth.counted, currency)} vs expected{" "}
                {formatMoney(truth.expectedCash, currency)}.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Bank gap
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {truth.hasBank ? formatMoney(truth.bankGap, currency) : "—"}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Deposits {formatMoney(truth.deposits, currency)} vs sales.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Open reviews
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {truth.stockGaps + truth.pendingReviews}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {truth.stockGaps} stock gaps, {truth.pendingReviews} expenses pending.
              </p>
            </div>
          </section>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold">Daily close</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Sales, drawer counts, and deposits grouped by date.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                    <th scope="col" className="py-2 pr-4 font-semibold">Date</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Sales</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Counted</th>
                    <th scope="col" className="py-2 font-semibold">Deposits</th>
                  </tr>
                </thead>
                <tbody>
                  {byDate.map(([date, totals]) => (
                    <tr key={date} className="border-b border-zinc-100 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{date}</td>
                      <td className="py-2.5 pr-4">{formatMoney(totals.sales, currency)}</td>
                      <td className="py-2.5 pr-4">{formatMoney(totals.counted, currency)}</td>
                      <td className="py-2.5">{formatMoney(totals.deposits, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
