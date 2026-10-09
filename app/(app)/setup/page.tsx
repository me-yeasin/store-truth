"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "../../_components/PageHeader";
import { getBusiness, setBusiness } from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export default function SetupBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState(() => getBusiness()?.name ?? "");
  const [currency, setCurrency] = useState(() => getBusiness()?.currency ?? "USD");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusiness({ name: name.trim(), currency });
    router.push("/setup/location");
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title="Set up your business"
        explanation="Step 1 of 2. Give your business a name. Locations come next, and their numbers always stay separate."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      <form
        onSubmit={handleSubmit}
        aria-label="Business setup form"
        className="rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <label htmlFor="business-name" className="mb-1 block text-sm font-semibold">
          Business name
        </label>
        <input
          id="business-name"
          type="text"
          required
          placeholder="Corner Shop"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />

        <label htmlFor="currency" className="mb-1 mt-4 block text-sm font-semibold">
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
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
          Continue to location
        </button>
      </form>
    </div>
  );
}
