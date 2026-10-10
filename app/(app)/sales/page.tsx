"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  addSale,
  deleteSale,
  EMPTY_DEMO_SNAPSHOT,
  EMPTY_SALES_SNAPSHOT,
  getDemoSnapshotString,
  getSalesSnapshotString,
  inLocation,
  safeParse,
  subscribeToDemoChanges,
  todayISODate,
  type DemoSale,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}

export default function SalesPage() {
  // Snapshots stay at the empty server value through hydration, then pick up
  // browser data — no server/client text mismatch.
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
  const { email: sessionEmail, business, location } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );
  const sales = useMemo(
    () => inLocation(safeParse<DemoSale[]>(salesSnapshotString, []), location?.id ?? null),
    [salesSnapshotString, location?.id]
  );
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState<"cash" | "card">("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const total = sales.reduce((sum, s) => sum + s.amount, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a sale amount above zero, for example 250.");
      return;
    }
    if (!date) {
      setError("Pick the date this sale belongs to, or leave it empty for today.");
    }
    const saleDate = date || todayISODate();
    addSale({
      amount: Math.round(value * 100) / 100,
      date: saleDate,
      method,
      note: note.trim(),
      ownerEmail: sessionEmail ?? "demo-owner",
    });
    setAmount("");
    setNote("");
    setDate("");
    setMethod("cash");
  }

  function handleDelete(id: string) {
    deleteSale(id);
  }

  return (
    <div>
      <PageHeader
        title="Sales"
        explanation="What the POS says you sold. This is the starting point we compare cash and bank against."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {!sessionEmail ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">Sign in to add sales</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Sales are tagged to your demo account so the owner knows who entered
            what.
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
            aria-label="Add sale form"
            className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2"
          >
            <h2 className="text-sm font-semibold">Add sale</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Type what the POS shows{location ? ` for ${location.name}` : ""}.
            </p>

            <label htmlFor="sale-amount" className="mb-1 mt-4 block text-sm font-semibold">
              Amount
            </label>
            <input
              id="sale-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="250.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="sale-date" className="mb-1 mt-4 block text-sm font-semibold">
              Date <span className="font-normal text-zinc-500">(empty means today)</span>
            </label>
            <input
              id="sale-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />

            <span id="sale-method-label" className="mb-1 mt-4 block text-sm font-semibold">
              Taken as
            </span>
            <div role="group" aria-labelledby="sale-method-label" className="grid grid-cols-2 gap-2">
              {(["cash", "card"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={method === m}
                  onClick={() => setMethod(m)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                    method === m
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <label htmlFor="sale-note" className="mb-1 mt-4 block text-sm font-semibold">
              Note <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              id="sale-note"
              type="text"
              placeholder="Lunch rush, register 1"
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
              Save sale
            </button>
          </form>

          <div className="lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total recorded
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(total, business?.currency ?? "USD")}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Across {sales.length} {sales.length === 1 ? "sale" : "sales"}.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  What this proves
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Every sale is timestamped and tagged to you. Cash and bank get
                  compared against this total next.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">Sales list</h2>
              {sales.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-600">
                  No sales yet. Add your first sale on the left.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {sales.map((sale) => (
                    <li
                      key={sale.id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {formatMoney(sale.amount, business?.currency ?? "USD")}{" "}
                          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold capitalize text-zinc-700">
                            {sale.method}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {sale.date}
                          {sale.note ? ` · ${sale.note}` : ""} · by {sale.ownerEmail}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(sale.id)}
                        aria-label={`Delete sale of ${sale.amount} on ${sale.date}`}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                      >
                        Delete
                      </button>
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
