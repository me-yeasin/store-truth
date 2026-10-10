// Pure truth computation: no browser access, no React.
// Home and Exceptions both read from here so the numbers always agree.

import type { DemoBank, DemoCash, DemoExpense, DemoInventory, DemoSale } from "./demo-store";

export type TruthTone = "good" | "warn" | "bad";

export type TruthItem = {
  id: string;
  tone: Exclude<TruthTone, "good"> | "info";
  title: string;
  detail: string;
  href: string;
  linkLabel: string;
};

export type TruthResult = {
  currency: string;
  salesTotal: number;
  salesCount: number;
  counted: number;
  expectedCash: number;
  cashVariance: number;
  deposits: number;
  bankGap: number;
  stockGaps: number;
  pendingReviews: number;
  hasSales: boolean;
  hasCash: boolean;
  hasBank: boolean;
  hasInventory: boolean;
  hasExpenses: boolean;
  items: TruthItem[];
};

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function computeTruth(
  sales: DemoSale[],
  cashEntries: DemoCash[],
  bankEntries: DemoBank[],
  currency: string,
  inventory: DemoInventory[] = [],
  expenses: DemoExpense[] = []
): TruthResult {
  const salesTotal = round2(sales.reduce((sum, s) => sum + s.amount, 0));
  const cashSales = round2(
    sales.filter((s) => s.method === "cash").reduce((sum, s) => sum + s.amount, 0)
  );
  const counted = round2(
    cashEntries.filter((e) => e.kind === "count").reduce((sum, e) => sum + e.amount, 0)
  );
  const cashIn = round2(
    cashEntries.filter((e) => e.kind === "in").reduce((sum, e) => sum + e.amount, 0)
  );
  const cashOut = round2(
    cashEntries.filter((e) => e.kind === "out").reduce((sum, e) => sum + e.amount, 0)
  );
  const expectedCash = round2(cashSales + cashIn - cashOut);
  const cashVariance = round2(counted - expectedCash);
  const deposits = round2(
    bankEntries.filter((e) => e.kind === "deposit").reduce((sum, e) => sum + e.amount, 0)
  );
  const bankGap = round2(deposits - salesTotal);

  const hasSales = sales.length > 0;
  const hasCash = cashEntries.length > 0;
  const hasBank = bankEntries.length > 0;
  const hasInventory = inventory.length > 0;
  const hasExpenses = expenses.length > 0;
  const items: TruthItem[] = [];

  if (hasCash && Math.abs(cashVariance) >= 0.005) {
    items.push({
      id: "cash-variance",
      tone: cashVariance < 0 ? "bad" : "warn",
      title:
        cashVariance < 0
          ? `Cash is short ${currency} ${Math.abs(cashVariance).toFixed(2)}`
          : `Cash is over ${currency} ${Math.abs(cashVariance).toFixed(2)}`,
      detail: `Counted ${currency} ${counted.toFixed(2)}, expected ${currency} ${expectedCash.toFixed(2)} from cash sales plus in/out. Check the drawer count or missing cash sales.`,
      href: "/cash",
      linkLabel: "Review cash →",
    });
  }

  if (hasBank && hasSales && Math.abs(bankGap) >= 0.005) {
    items.push({
      id: "bank-gap",
      tone: "warn",
      title: `Bank differs from sales by ${currency} ${Math.abs(bankGap).toFixed(2)}`,
      detail: `Deposits ${currency} ${deposits.toFixed(2)} against sales ${currency} ${salesTotal.toFixed(2)}. A deposit may be missing, duplicated, or belong to another day.`,
      href: "/bank",
      linkLabel: "Review bank →",
    });
  }

  if (hasBank && !hasSales) {
    items.push({
      id: "bank-no-sales",
      tone: "info",
      title: "Bank entries have nothing to match against",
      detail: "Record sales so deposits can be compared to what the POS says.",
      href: "/sales",
      linkLabel: "Add sales →",
    });
  }

  if (hasSales && !hasCash && !hasBank) {
    items.push({
      id: "sales-alone",
      tone: "info",
      title: "Sales recorded, nothing to check them against",
      detail: "Add a cash count and bank deposits to see the first real comparison.",
      href: "/cash",
      linkLabel: "Count cash →",
    });
  }

  const stockGaps = inventory.filter(
    (row) => Math.abs(round2(row.counted - row.expected)) >= 0.005
  );
  for (const row of stockGaps) {
    const diff = round2(row.counted - row.expected);
    items.push({
      id: `stock-${row.id}`,
      tone: "warn",
      title:
        diff < 0
          ? `Stock short ${Math.abs(diff)} × ${row.item}`
          : `Stock over ${diff} × ${row.item}`,
      detail: `Should have ${row.expected}, counted ${row.counted} on ${row.date}. Shrinkage, miscount, or unrecorded sale.`,
      href: "/inventory",
      linkLabel: "Review inventory →",
    });
  }

  const pending = expenses.filter((e) => e.status === "pending");
  for (const expense of pending) {
    items.push({
      id: `expense-${expense.id}`,
      tone: "info",
      title: `Expense needs review: ${expense.vendor} ${currency} ${expense.amount.toFixed(2)}`,
      detail: `Recorded ${expense.date}${expense.note ? ` · ${expense.note}` : ""}. Confirm this vendor and amount, then mark it reviewed.`,
      href: "/vendors",
      linkLabel: "Review vendors →",
    });
  }

  return {
    currency,
    salesTotal,
    salesCount: sales.length,
    counted,
    expectedCash,
    cashVariance,
    deposits,
    bankGap,
    stockGaps: stockGaps.length,
    pendingReviews: pending.length,
    hasSales,
    hasCash,
    hasBank,
    hasInventory,
    hasExpenses,
    items,
  };
}
