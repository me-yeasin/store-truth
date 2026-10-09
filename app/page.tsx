import Link from "next/link";
import EmptyState from "./_components/EmptyState";
import PageHeader from "./_components/PageHeader";

const CARDS = [
  {
    label: "POS sales",
    value: "—",
    note: "What the POS says you sold today.",
    state: "No data yet",
  },
  {
    label: "Cash counted",
    value: "—",
    note: "What was actually in the drawer.",
    state: "No data yet",
  },
  {
    label: "Bank received",
    value: "—",
    note: "What arrived in the bank for today.",
    state: "No data yet",
  },
];

const QUICK_ACTIONS = [
  { href: "/sales", label: "Add sale" },
  { href: "/cash", label: "Count cash" },
  { href: "/bank", label: "Add bank" },
  { href: "/vendors", label: "Add expense" },
];

export default function Home() {
  return (
    <div>
      <PageHeader
        title="Today's truth"
        explanation="One page per day per location. When POS, cash, and bank agree, you are fine. When they don't, you see it here."
      >
        <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
          Today · All locations
        </span>
        <Link
          href="/locations"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Choose location
        </Link>
      </PageHeader>

      <section aria-label="Sales, cash, and bank summary" className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{card.value}</p>
            <p className="mt-1 text-sm text-zinc-600">{card.note}</p>
            <p className="mt-3 inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
              {card.state}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <EmptyState
          title="No mismatches to show"
          body="When you add sales, cash counts, and bank deposits, this list will show what matches and what needs attention."
          nextStep="Add your first business and location, then enter today's numbers."
        />

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-950">Quick actions</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Enter numbers by hand for now. CSV import comes next.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <li key={action.href + action.label}>
                <Link
                  href={action.href}
                  className="block rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
