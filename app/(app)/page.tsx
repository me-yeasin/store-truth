"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import PageHeader from "../_components/PageHeader";
import {
  EMPTY_BANK_SNAPSHOT,
  EMPTY_CASH_SNAPSHOT,
  EMPTY_DEMO_SNAPSHOT,
  EMPTY_SALES_SNAPSHOT,
  getBankSnapshotString,
  getCashSnapshotString,
  getDemoSnapshotString,
  getSalesSnapshotString,
  safeParse,
  subscribeToDemoChanges,
  type DemoBank,
  type DemoCash,
  type DemoSale,
  type DemoSnapshot,
} from "../_lib/demo-store";

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
    () => safeParse<DemoSale[]>(salesSnapshotString, []),
    [salesSnapshotString]
  );
  const cashEntries = useMemo(
    () => safeParse<DemoCash[]>(cashSnapshotString, []),
    [cashSnapshotString]
  );
  const bankEntries = useMemo(
    () => safeParse<DemoBank[]>(bankSnapshotString, []),
    [bankSnapshotString]
  );

  const currency = business?.currency ?? "USD";
  const salesTotal = sales.reduce((sum, s) => sum + s.amount, 0);
  const cashSales = sales
    .filter((s) => s.method === "cash")
    .reduce((sum, s) => sum + s.amount, 0);
  const counted = cashEntries
    .filter((e) => e.kind === "count")
    .reduce((sum, e) => sum + e.amount, 0);
  const cashIn = cashEntries
    .filter((e) => e.kind === "in")
    .reduce((sum, e) => sum + e.amount, 0);
  const cashOut = cashEntries
    .filter((e) => e.kind === "out")
    .reduce((sum, e) => sum + e.amount, 0);
  const expectedCash = cashSales + cashIn - cashOut;
  const cashVariance = counted - expectedCash;
  const deposits = bankEntries
    .filter((e) => e.kind === "deposit")
    .reduce((sum, e) => sum + e.amount, 0);
  const bankGap = deposits - salesTotal;

  const hasSales = sales.length > 0;
  const hasCash = cashEntries.length > 0;
  const hasBank = bankEntries.length > 0;
  const hasAnything = hasSales || hasCash || hasBank;

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

  const truths: string[] = [];
  if (hasCash && Math.abs(cashVariance) >= 0.005) {
    truths.push(
      cashVariance < 0
        ? `Cash is short ${formatMoney(cashVariance, currency)}: counted ${formatMoney(counted, currency)}, expected ${formatMoney(expectedCash, currency)}.`
        : `Cash is over ${formatMoney(cashVariance, currency)}: counted ${formatMoney(counted, currency)}, expected ${formatMoney(expectedCash, currency)}.`
    );
  }
  if (hasBank && hasSales && Math.abs(bankGap) >= 0.005) {
    truths.push(
      `Bank deposits differ from sales by ${formatMoney(bankGap, currency)}: deposits ${formatMoney(deposits, currency)}, sales ${formatMoney(salesTotal, currency)}.`
    );
  }
  if (hasBank && !hasSales) {
    truths.push("Bank entries exist but there are no sales to match them against yet.");
  }
  if (hasSales && !hasCash && !hasBank) {
    truths.push("Sales are recorded. Add a cash count and bank deposits to check the truth.");
  }

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
              ? `${sales.length} ${sales.length === 1 ? "sale" : "sales"} recorded`
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
          ) : truths.length === 0 ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Everything lines up. Sales, cash, and bank agree.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {truths.map((truth) => (
                <li key={truth} className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  {truth}
                </li>
              ))}
            </ul>
          )}
          {truths.length > 0 ? (
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
