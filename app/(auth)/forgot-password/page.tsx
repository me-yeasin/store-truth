import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
      <p className="mt-1 text-sm leading-6 text-zinc-600">
        Enter your account email. If it exists, we will send reset instructions.
      </p>

      <form className="mt-6 flex flex-col gap-4" aria-label="Reset password form">
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
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Send reset link
        </button>
      </form>

      <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">
        UI only — real email sending comes with the authentication step.
      </p>

      <p className="mt-4 text-center text-sm text-zinc-600">
        <Link
          href="/login"
          className="font-semibold text-zinc-950 underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
