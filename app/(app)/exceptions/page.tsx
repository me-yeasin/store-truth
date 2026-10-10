"use client";

import Link from "next/link";
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

const TONE_STYLES: Record<string, string> = {
  bad: "border-red-200 bg-red-50",
  warn: "border-amber-200 bg-amber-50",
  info: "border-zinc-200 bg-zinc-50",
};

const TONE_TEXT: Record<string, string> = {
  bad: "text-red-800",
  warn: "text-amber-900",
  info: "text-zinc-700",
};

export default function ExceptionsPage() {
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
  const expenseSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getExpenseSnapshotString,
    () => EMPTY_EXPENSE_SNAPSHOT
  );
  const expenses = useMemo(
    () => inLocation(safeParse<DemoExpense[]>(expenseSnapshotString, []), location?.id ?? null),
    [expenseSnapshotString, location?.id]
  );

  const truth = computeTruth(sales, cashEntries, bankEntries, business?.currency ?? "USD", inventory, expenses);
  const hasAnything = truth.hasSales || truth.hasCash || truth.hasBank || truth.hasInventory || truth.hasExpenses;

  return (
    <div>
      <PageHeader
        title="Exceptions"
        explanation="Anything that does not line up shows up here in plain words, so you fix it instead of missing it."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          {truth.items.length === 0
            ? "All clear"
            : `${truth.items.length} ${truth.items.length === 1 ? "item needs" : "items need"} review`}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {!hasAnything ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">Nothing needs attention</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Cash differences, unmatched bank deposits, unknown vendors, and
            stock differences will appear here.
          </p>
          <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
            Next step: add sales, cash, and bank data to see the first checks run.
          </p>
        </div>
      ) : truth.items.length === 0 ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-sm font-semibold text-green-900">All clear</h2>
          <p className="mt-1 text-sm leading-6 text-green-800">
            Sales, cash, bank, stock, and vendors all agree.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {truth.items.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl border p-5 ${TONE_STYLES[item.tone]}`}
            >
              <p className={`text-sm font-bold ${TONE_TEXT[item.tone]}`}>{item.title}</p>
              <p className={`mt-1 text-sm leading-6 ${TONE_TEXT[item.tone]}`}>{item.detail}</p>
              <p className="mt-3 text-sm">
                Fix it by correcting the entries, then this item clears itself.
              </p>
              <Link
                href={item.href}
                className="mt-2 inline-block text-sm font-semibold text-zinc-900 underline-offset-4 hover:underline"
              >
                {item.linkLabel}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
