"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  clearAllDemoData,
  clearSampleShop,
  EMPTY_DEMO_SNAPSHOT,
  getDemoSnapshotString,
  getSeedFlagSnapshotString,
  safeParse,
  setBusiness,
  setSession,
  subscribeToDemoChanges,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export default function SettingsPage() {
  const router = useRouter();
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const seedFlag = useSyncExternalStore(
    subscribeToDemoChanges,
    getSeedFlagSnapshotString,
    () => ""
  );
  const seeded = seedFlag === "seeded";
  const { email, business } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [currencyDraft, setCurrencyDraft] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const name = nameDraft ?? business?.name ?? "";
  const currency = currencyDraft ?? business?.currency ?? "USD";

  function handleBusinessSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusiness({ name: name.trim(), currency });
    setSavedNote("Business saved.");
  }

  function handleSignOut() {
    setSession(null);
    router.push("/login");
  }

  function handleResetAll() {
    if (!window.confirm("Wipe everything in this browser demo, including your account?")) return;
    clearAllDemoData();
    router.push("/signup");
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        explanation="Business, account, and demo data controls. Currency set here shows on every money figure."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={handleBusinessSubmit}
          aria-label="Business settings form"
          className="rounded-2xl border border-zinc-200 bg-white p-6"
        >
          <h2 className="text-sm font-semibold">Business</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Name shows in the header; currency shows on every amount.
          </p>
          <label htmlFor="settings-business" className="mb-1 mt-4 block text-sm font-semibold">
            Business name
          </label>
          <input
            id="settings-business"
            type="text"
            required
            placeholder="Corner Shop"
            value={name}
            onChange={(e) => {
              setNameDraft(e.target.value);
              setSavedNote(null);
            }}
            className={inputClass}
          />
          <label htmlFor="settings-currency" className="mb-1 mt-4 block text-sm font-semibold">
            Currency
          </label>
          <select
            id="settings-currency"
            value={currency}
            onChange={(e) => {
              setCurrencyDraft(e.target.value);
              setSavedNote(null);
            }}
            className={inputClass}
          >
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="BDT">BDT — Taka</option>
          </select>
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Save business
          </button>
          {savedNote ? (
            <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
              {savedNote}
            </p>
          ) : null}
        </form>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold">Account</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {email ? `Signed in as ${email}.` : "Not signed in."}
            </p>
            {email ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Sign out
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-red-800">Reset demo data</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {seeded
                ? "Sample shop is loaded. Clearing removes only sample entries."
                : "Remove sample entries or wipe the whole browser demo."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {seeded ? (
                <button
                  type="button"
                  onClick={() => clearSampleShop()}
                  className="rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-50"
                >
                  Clear sample data
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleResetAll}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
              >
                Wipe everything
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
