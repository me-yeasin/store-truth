"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  addBank,
  deleteBank,
  EMPTY_BANK_SNAPSHOT,
  EMPTY_DEMO_SNAPSHOT,
  getBankSnapshotString,
  getDemoSnapshotString,
  safeParse,
  subscribeToDemoChanges,
  todayISODate,
  type DemoBank,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

const KIND_META: Record<DemoBank["kind"], { label: string; hint: string }> = {
  deposit: { label: "Deposit", hint: "Money from sales arriving in the bank." },
  withdrawal: { label: "Withdrawal", hint: "Money taken out of the bank." },
  transfer: { label: "Transfer", hint: "Money moved between accounts." },
};

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}

export default function BankPage() {
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const bankSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getBankSnapshotString,
    () => EMPTY_BANK_SNAPSHOT
  );
  const { email: sessionEmail, business } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );
  const entries = useMemo(
    () => safeParse<DemoBank[]>(bankSnapshotString, []),
    [bankSnapshotString]
  );
  const [kind, setKind] = useState<DemoBank["kind"]>("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deposits = entries
    .filter((e) => e.kind === "deposit")
    .reduce((sum, e) => sum + e.amount, 0);
  const net = entries.reduce(
    (sum, e) =>
      sum + (e.kind === "deposit" ? e.amount : e.kind === "withdrawal" ? -e.amount : 0),
    0
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a bank amount above zero, for example 700.");
      return;
    }
    const entryDate = date || todayISODate();
    addBank({
      kind,
      amount: Math.round(value * 100) / 100,
      date: entryDate,
      note: note.trim(),
      ownerEmail: sessionEmail ?? "demo-owner",
    });
    setAmount("");
    setNote("");
    setDate("");
    setKind("deposit");
  }

  function handleDelete(id: string) {
    deleteBank(id);
  }

  return (
    <div>
      <PageHeader
        title="Bank"
        explanation="What arrived in the bank. Deposits are matched to sales so unmatched money is visible."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {!sessionEmail ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">Sign in to record bank</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Bank entries are tagged to your demo account so the owner knows who
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
            aria-label="Record bank form"
            className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2"
          >
            <h2 className="text-sm font-semibold">Record bank</h2>
            <p className="mt-1 text-sm text-zinc-600">{KIND_META[kind].hint}</p>

            <span id="bank-kind-label" className="mb-1 mt-4 block text-sm font-semibold">
              Type
            </span>
            <div role="group" aria-labelledby="bank-kind-label" className="grid grid-cols-3 gap-2">
              {(Object.keys(KIND_META) as DemoBank["kind"][]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-semibold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:text-sm ${
                    kind === k
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>

            <label htmlFor="bank-amount" className="mb-1 mt-4 block text-sm font-semibold">
              Amount
            </label>
            <input
              id="bank-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="700.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="bank-date" className="mb-1 mt-4 block text-sm font-semibold">
              Date <span className="font-normal text-zinc-500">(empty means today)</span>
            </label>
            <input
              id="bank-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="bank-note" className="mb-1 mt-4 block text-sm font-semibold">
              Note <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              id="bank-note"
              type="text"
              placeholder="Weekend takings deposit"
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
              Save bank entry
            </button>
          </form>

          <div className="lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total deposits
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(deposits, business?.currency ?? "USD")}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Across {entries.filter((e) => e.kind === "deposit").length} deposits.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Net movement
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(net, business?.currency ?? "USD")}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Deposits minus withdrawals. Matched to sales next.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">Bank entries</h2>
              {entries.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-600">
                  No bank entries yet. Record this week&apos;s deposits on the left.
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
                          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold capitalize text-zinc-700">
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
                        aria-label={`Delete bank entry of ${entry.amount} on ${entry.date}`}
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
