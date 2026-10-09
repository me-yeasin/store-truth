"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../../_components/PageHeader";
import {
  EMPTY_DEMO_SNAPSHOT,
  getDemoSnapshotString,
  safeParse,
  setLocation,
  subscribeToDemoChanges,
  type DemoSnapshot,
} from "../../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export default function SetupLocationPage() {
  const router = useRouter();
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const { location: savedLocation } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? savedLocation?.name ?? "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLocation({ name: name.trim() });
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title="Add your first location"
        explanation="Step 2 of 2. Each shop gets its own daily truth page, so numbers are never mixed."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      <form
        onSubmit={handleSubmit}
        aria-label="Location setup form"
        className="rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <label htmlFor="location-name" className="mb-1 block text-sm font-semibold">
          Location name
        </label>
        <input
          id="location-name"
          type="text"
          required
          placeholder="Main Street shop"
          value={name}
          onChange={(e) => setNameDraft(e.target.value)}
          className={inputClass}
        />

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Finish and see today&apos;s truth
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-600">
        <Link href="/setup" className="font-medium underline-offset-4 hover:underline">
          Back to business step
        </Link>
      </p>
    </div>
  );
}
