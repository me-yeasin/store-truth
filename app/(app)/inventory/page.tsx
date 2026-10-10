"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  addInventory,
  deleteInventory,
  EMPTY_DEMO_SNAPSHOT,
  EMPTY_INVENTORY_SNAPSHOT,
  getDemoSnapshotString,
  getInventorySnapshotString,
  inLocation,
  safeParse,
  subscribeToDemoChanges,
  todayISODate,
  type DemoInventory,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export default function InventoryPage() {
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const inventorySnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getInventorySnapshotString,
    () => EMPTY_INVENTORY_SNAPSHOT
  );
  const { email: sessionEmail, location } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );
  const rows = useMemo(
    () => inLocation(safeParse<DemoInventory[]>(inventorySnapshotString, []), location?.id ?? null),
    [inventorySnapshotString, location?.id]
  );
  const [item, setItem] = useState("");
  const [expected, setExpected] = useState("");
  const [counted, setCounted] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const gaps = rows.filter((r) => r.counted !== r.expected).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!item.trim()) {
      setError("Give the item a name, for example Cola 500ml.");
      return;
    }
    const exp = Number(expected);
    const cnt = Number(counted);
    if (!Number.isFinite(exp) || exp < 0 || !Number.isFinite(cnt) || cnt < 0) {
      setError("Expected and counted must both be zero or more.");
      return;
    }
    addInventory({
      item: item.trim(),
      expected: exp,
      counted: cnt,
      date: date || todayISODate(),
      note: note.trim(),
      ownerEmail: sessionEmail ?? "demo-owner",
    });
    setItem("");
    setExpected("");
    setCounted("");
    setDate("");
    setNote("");
  }

  function handleDelete(id: string) {
    deleteInventory(id);
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        explanation="What you should have versus what you counted. Differences show as shrinkage or adjustments."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {!sessionEmail ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">Sign in to track inventory</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Stock counts are tagged to your demo account so the owner knows who
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
            aria-label="Record stock count form"
            className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2"
          >
            <h2 className="text-sm font-semibold">Record stock count</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Should-have versus actually counted, per item.
            </p>

            <label htmlFor="inv-item" className="mb-1 mt-4 block text-sm font-semibold">
              Item
            </label>
            <input
              id="inv-item"
              type="text"
              required
              placeholder="Cola 500ml"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className={inputClass}
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="inv-expected" className="mb-1 mt-4 block text-sm font-semibold">
                  Should have
                </label>
                <input
                  id="inv-expected"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  required
                  placeholder="100"
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="inv-counted" className="mb-1 mt-4 block text-sm font-semibold">
                  Counted
                </label>
                <input
                  id="inv-counted"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  required
                  placeholder="95"
                  value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <label htmlFor="inv-date" className="mb-1 mt-4 block text-sm font-semibold">
              Date <span className="font-normal text-zinc-500">(empty means today)</span>
            </label>
            <input
              id="inv-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />

            <label htmlFor="inv-note" className="mb-1 mt-4 block text-sm font-semibold">
              Note <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              id="inv-note"
              type="text"
              placeholder="Back shelf not counted"
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
              Save stock count
            </button>
          </form>

          <div className="lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Items tracked
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{rows.length}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {gaps === 0
                    ? "No gaps found."
                    : `${gaps} ${gaps === 1 ? "item needs" : "items need"} review.`}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  What this proves
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Every gap feeds Today and Exceptions automatically, in plain
                  words the owner understands.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">Stock counts</h2>
              {rows.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-600">
                  No items yet. Add 5 real items from one shop on the left.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {rows.map((row) => {
                    const diff = row.counted - row.expected;
                    return (
                      <li
                        key={row.id}
                        className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            {row.item}{" "}
                            <span
                              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                diff === 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {diff === 0
                                ? "Matches"
                                : diff < 0
                                  ? `Short ${Math.abs(diff)}`
                                  : `Over ${diff}`}
                            </span>
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            Should {row.expected} · counted {row.counted} · {row.date}
                            {row.note ? ` · ${row.note}` : ""} · by {row.ownerEmail}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          aria-label={`Delete stock count for ${row.item}`}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                        >
                          Delete
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
