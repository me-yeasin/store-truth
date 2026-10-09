"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { findUser, getBusiness, setSession } from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const user = findUser(email.trim());
    if (!user || user.password !== password) {
      setError("No demo account matches that email and password on this browser.");
      return;
    }
    setSession({ email: user.email });
    router.push(getBusiness() ? "/" : "/setup");
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm leading-6 text-zinc-600">
        Sign in to see what your business actually made today.
      </p>
      <p className="mt-2 inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
        Demo — stored in this browser only
      </p>

      <form className="mt-6 flex flex-col gap-4" aria-label="Sign in form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="owner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-2 rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Sign in
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-zinc-700 underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
        <Link
          href="/signup"
          className="font-semibold text-zinc-950 underline-offset-4 hover:underline"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
