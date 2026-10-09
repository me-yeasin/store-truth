"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  addCash,
  deleteCash,
  EMPTY_CASH_SNAPSHOT,
  EMPTY_DEMO_SNAPSHOT,
  getCashSnapshotString,
  getDemoSnapshotString,
  subscribeToDemoChanges,
  todayISODate,
  type DemoCash,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

const KIND_META: Record<DemoCash["kind"], { label: string; hint: string }> = {
  count: { label: "Drawer count", hint: "What you counted in the drawer." },
  in: { label: "Cash in", hint: "Extra cash put in, e.g. change fund." },
  out: { label: "Cash out", hint: "Cash taken out, e.g. paid supplier." },
};

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}

export default function CashPage() {
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const cashSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getCashSnapshotString,
    () => EMPTY_CASH_SNAPSHOT
  );
  const { email: sessionEmail, business } = useMemo(
    () => JSON.parse(snapshotString) as DemoSnapshot,
    [snapshotString]
  );
  const entries = useMemo(
    () => JSON.parse(cashSnapshotString) as DemoCash[],
    [cashSnapshotString]
  );
  const [kind, setKind] = useState<DemoCash["kind"]>("count");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const counted = entries
    .filter((e) => e.kind === "count")
    .reduce((sum, e) => sum + e.amount, 0);
  const netInOut = entries.reduce(
    (sum, e) => sum + (e.kind === "in" ? e.amount : e.kind === "out" ? -e.amount : 0),
    0
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a cash amount above zero, for example 850.");
      return;
    }
    const entryDate = date || todayISODate();
    addCash({
      kind,
      amount: Math.round(value * 100) / 100,
      date: entryDate,
      note: note.trim(),
      ownerEmail: sessionEmail ?? "demo-owner",
    });
    setAmount("");
    setNote("");
    setDate("");
    setKind("count");
  }

  function handleDelete(id: string) {
    deleteCash(id);
  }

  return (
    <div>
      <PageHeader
        title="Cash"
        explanation="What you actually counted in the drawer. Expected cash versus counted cash gives your variance."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {!sessionEmail ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">Sign in to record cash</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Cash entries are tagged to your demo account so the owner knows who
            counted what.
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
            aria-label="Record cash form"
            className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2"
          >
            <h2 className="text-sm font-semibold">Record cash</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {KIND_META[kind].hint}
            </p>

            <span id="cash-kind-label" className="mb-1 mt-4 block text-sm font-semibold">
              Type
            </span>
            <div role="group" aria-labelledby="cash-kind-label" className="grid grid-cols-3 gap-2">
              {(Object.keys(KIND_META) as DemoCash["kind"][]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:text-sm ${
                    kind === k
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>

            <label htmlFor="cash-amount" className="mb-1 mt-4 block text-sm font-semibold">
              Amount
            </label>
            <input
              id="cash-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="850.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="cash-date" className="mb-1 mt-4 block text-sm font-semibold">
              Date <span className="font-normal text-zinc-500">(empty means today)</span>
            </label>
            <input
              id="cash-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="cash-note" className="mb-1 mt-4 block text-sm font-semibold">
              Note <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              id="cash-note"
              type="text"
              placeholder="Night close, register 1"
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
              Save cash entry
            </button>
          </form>

          <div className="lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total counted
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(counted, business?.currency ?? "USD")}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Drawer counts across {entries.filter((e) => e.kind === "count").length} entries.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Net in / out
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(netInOut, business?.currency ?? "USD")}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Cash in minus cash out. Compared against sales next.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">Cash entries</h2>
              {entries.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-600">
                  No cash entries yet. Record tonight&apos;s drawer count on the left.
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
                          {formatMoney(entry.amount, business?.currency ?? "USD")}{" "}
                          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                            {KIND_META[entry.kind].label}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {entry.date}
                          {entry.note ? ` · ${entry.note}` : ""} · by {entry.ownerEmail}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        aria-label={`Delete cash entry of ${entry.amount} on ${entry.date}`}
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
