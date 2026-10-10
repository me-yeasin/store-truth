"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  addExpense,
  deleteExpense,
  EMPTY_DEMO_SNAPSHOT,
  EMPTY_EXPENSE_SNAPSHOT,
  getDemoSnapshotString,
  getExpenseSnapshotString,
  inLocation,
  safeParse,
  setExpenseStatus,
  subscribeToDemoChanges,
  todayISODate,
  type DemoExpense,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}

export default function VendorsPage() {
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const expenseSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getExpenseSnapshotString,
    () => EMPTY_EXPENSE_SNAPSHOT
  );
  const { email: sessionEmail, business, location } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );
  const entries = useMemo(
    () => inLocation(safeParse<DemoExpense[]>(expenseSnapshotString, []), location?.id ?? null),
    [expenseSnapshotString, location?.id]
  );
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = entries.filter((e) => e.status === "pending");
  const pendingTotal = pending.reduce((sum, e) => sum + e.amount, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vendor.trim()) {
      setError("Name the vendor or describe the expense, for example Power bill.");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an expense amount above zero.");
      return;
    }
    addExpense({
      vendor: vendor.trim(),
      amount: Math.round(value * 100) / 100,
      date: date || todayISODate(),
      note: note.trim(),
      ownerEmail: sessionEmail ?? "demo-owner",
    });
    setVendor("");
    setAmount("");
    setDate("");
    setNote("");
  }

  return (
    <div>
      <PageHeader
        title="Vendors"
        explanation="Who you paid and why. Unknown or changed vendors are flagged for review."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {!sessionEmail ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">Sign in to track vendors</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Expenses are tagged to your demo account so the owner knows who
            recorded what.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <form
            onSubmit={handleSubmit}
            aria-label="Add expense form"
            className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2"
          >
            <h2 className="text-sm font-semibold">Add expense</h2>
            <p className="mt-1 text-sm text-zinc-600">
              New expenses start as pending until someone reviews them.
            </p>

            <label htmlFor="vendor-name" className="mb-1 mt-4 block text-sm font-semibold">
              Vendor / expense
            </label>
            <input
              id="vendor-name"
              type="text"
              required
              placeholder="Power bill"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="expense-amount" className="mb-1 mt-4 block text-sm font-semibold">
              Amount
            </label>
            <input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="120.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="expense-date" className="mb-1 mt-4 block text-sm font-semibold">
              Date <span className="font-normal text-zinc-500">(empty means today)</span>
            </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="expense-note" className="mb-1 mt-4 block text-sm font-semibold">
              Note <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              id="expense-note"
              type="text"
              placeholder="Changed supplier this month"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
            />

            {error ? (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Save expense
            </button>
          </form>

          <div className="lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Pending review
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(pendingTotal, business?.currency ?? "USD")}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Across {pending.length} {pending.length === 1 ? "expense" : "expenses"}.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  What this proves
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Unknown or changed vendors wait here until reviewed, and each
                  one appears on Today and Exceptions.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">Expenses</h2>
              {entries.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-600">
                  No vendors yet. Add your top 3 vendors on the left.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {entry.vendor} · {formatMoney(entry.amount, business?.currency ?? "USD")}{" "}
                          <span
                            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              entry.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {entry.status === "pending" ? "Pending" : "Reviewed"}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {entry.date}
                          {entry.note ? ` · ${entry.note}` : ""} · by {entry.ownerEmail}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpenseStatus(
                              entry.id,
                              entry.status === "pending" ? "reviewed" : "pending"
                            )
                          }
                          aria-label={`Mark expense ${entry.vendor} as ${entry.status === "pending" ? "reviewed" : "pending"}`}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                        >
                          {entry.status === "pending" ? "Mark reviewed" : "Reopen"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExpense(entry.id)}
                          aria-label={`Delete expense ${entry.vendor}`}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
