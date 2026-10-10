"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import PageHeader from "../_components/PageHeader";
import {
  clearSampleShop,
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
  getSeedFlagSnapshotString,
  inLocation,
  safeParse,
  seedSampleShop,
  subscribeToDemoChanges,
  type DemoBank,
  type DemoCash,
  type DemoExpense,
  type DemoInventory,
  type DemoSale,
  type DemoSnapshot,
} from "../_lib/demo-store";
import { computeTruth } from "../_lib/truth";

const QUICK_ACTIONS = [
  { href: "/sales", label: "Add sale" },
  { href: "/cash", label: "Count cash" },
  { href: "/bank", label: "Add bank" },
  { href: "/vendors", label: "Add expense" },
];

function formatMoney(amount: number, currency: string) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${Math.abs(amount).toFixed(2)}`;
}

type PillTone = "neutral" | "good" | "warn" | "bad";

const PILL_STYLES: Record<PillTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  good: "bg-green-100 text-green-800",
  warn: "bg-amber-100 text-amber-800",
  bad: "bg-red-100 text-red-800",
};

export default function Home() {
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

  const { email, business, location } = useMemo(
    () =>
      safeParse<DemoSnapshot>(snapshotString, {
        email: null,
        business: null,
        location: null,
      }),
    [snapshotString]
  );
  const seedFlag = useSyncExternalStore(
    subscribeToDemoChanges,
    getSeedFlagSnapshotString,
    () => ""
  );
  const seeded = seedFlag === "seeded";
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
  const {
    currency,
    salesTotal,
    salesCount,
    counted,
    expectedCash,
    cashVariance,
    deposits,
    bankGap,
    hasSales,
    hasCash,
    hasBank,
  } = truth;
  const hasAnything = hasSales || hasCash || hasBank;

  function handleLoadSample() {
    seedSampleShop(email ?? "demo-owner");
  }

  function handleClearSample() {
    clearSampleShop();
  }

  const cashState: { text: string; tone: PillTone } = !hasCash
    ? { text: "No data yet", tone: "neutral" }
    : Math.abs(cashVariance) < 0.005
      ? { text: "Matches expected", tone: "good" }
      : cashVariance < 0
        ? { text: `Short ${formatMoney(cashVariance, currency)}`, tone: "bad" }
        : { text: `Over ${formatMoney(cashVariance, currency)}`, tone: "warn" };

  const bankState: { text: string; tone: PillTone } = !hasBank
    ? { text: "No data yet", tone: "neutral" }
    : !hasSales
      ? { text: `${bankEntries.length} entries, no sales to match`, tone: "neutral" }
      : Math.abs(bankGap) < 0.005
        ? { text: "Matches sales", tone: "good" }
        : { text: `${formatMoney(bankGap, currency)} vs sales`, tone: "warn" };

  return (
    <div>
      <PageHeader
        title="Today's truth"
        explanation="One page per day per location. When POS, cash, and bank agree, you are fine. When they don't, you see it here."
      >
        <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
          Today · {location?.name ?? "All locations"}
        </span>
        <Link
          href="/locations"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Choose location
        </Link>
      </PageHeader>

      {!hasAnything && !seeded ? (
        <div className="mb-6 rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-white">
          <h2 className="text-base font-bold">See how it works in 10 seconds</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-300">
            Load a pretend Sample Shop — cash short, an unmatched deposit, a
            stock gap, and a strange bill. Everything is labeled sample and you
            can wipe it any time.
          </p>
          <button
            type="button"
            onClick={handleLoadSample}
            className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Load sample shop
          </button>
        </div>
      ) : null}

      {seeded ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">
            Sample shop loaded — pretend data for demo purposes.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            It lives in its own Sample Shop location, separate from your real
            numbers.
          </p>
          <button
            type="button"
            onClick={handleClearSample}
            className="mt-3 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            Clear sample data
          </button>
        </div>
      ) : null}

      <section aria-label="Sales, cash, and bank summary" className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            POS sales
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {hasSales ? formatMoney(salesTotal, currency) : "—"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">What the POS says you sold today.</p>
          <p
            className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_STYLES[hasSales ? "good" : "neutral"]}`}
          >
            {hasSales
              ? `${salesCount} ${salesCount === 1 ? "sale" : "sales"} recorded`
              : "No data yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Cash counted
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {hasCash ? formatMoney(counted, currency) : "—"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            What was actually in the drawer.
            {hasCash ? ` Expected ${formatMoney(expectedCash, currency)}.` : ""}
          </p>
          <p
            className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_STYLES[cashState.tone]}`}
          >
            {cashState.text}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Bank received
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {hasBank ? formatMoney(deposits, currency) : "—"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">What arrived in the bank for today.</p>
          <p
            className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_STYLES[bankState.tone]}`}
          >
            {bankState.text}
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-950">What needs attention</h2>
          {!hasAnything ? (
            <>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                When you add sales, cash counts, and bank deposits, this list
                will show what matches and what needs attention.
              </p>
              <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
                Next step: add your first business and location, then enter
                today&apos;s numbers.
              </p>
            </>
          ) : truth.items.length === 0 ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Everything lines up. Sales, cash, and bank agree.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {truth.items.map((item) => (
                <li key={item.id} className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  {item.title}: {item.detail}
                </li>
              ))}
            </ul>
          )}
          {truth.items.length > 0 ? (
            <Link
              href="/exceptions"
              className="mt-4 inline-block text-sm font-semibold text-zinc-900 underline-offset-4 hover:underline"
            >
              Open exceptions →
            </Link>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-950">Quick actions</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Enter numbers by hand for now. CSV import comes next.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <li key={action.href + action.label}>
                <Link
                  href={action.href}
                  className="block rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
