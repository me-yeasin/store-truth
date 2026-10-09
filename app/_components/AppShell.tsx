"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  EMPTY_DEMO_SNAPSHOT,
  getDemoSnapshotString,
  setSession,
  subscribeToDemoChanges,
  type DemoSnapshot,
} from "../_lib/demo-store";

type NavItem = {
  href: string;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Truth",
    items: [
      { href: "/", label: "Today" },
      { href: "/locations", label: "Locations" },
      { href: "/exceptions", label: "Exceptions" },
    ],
  },
  {
    title: "Data",
    items: [
      { href: "/sales", label: "Sales" },
      { href: "/cash", label: "Cash" },
      { href: "/bank", label: "Bank" },
      { href: "/inventory", label: "Inventory" },
      { href: "/vendors", label: "Vendors" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/imports", label: "Imports" },
      { href: "/reports", label: "Reports" },
      { href: "/audit", label: "Audit" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Today" },
  { href: "/locations", label: "Locations" },
  { href: "/exceptions", label: "Exceptions" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-6 overflow-y-auto">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {section.title}
          </p>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // useSyncExternalStore keeps server HTML and first client paint identical
  // (both use EMPTY_DEMO_SNAPSHOT), then swaps in browser data after hydration.
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const { email, business, location } = useMemo(
    () => JSON.parse(snapshotString) as DemoSnapshot,
    [snapshotString]
  );

  function handleSignOut() {
    setSession(null);
    router.push("/login");
  }

  const contextLabel = business
    ? `${business.name} · ${location?.name ?? "All locations"}`
    : "Demo Business · All locations";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 md:hidden"
          >
            Menu
          </button>

          <Link href="/" className="text-sm font-bold tracking-tight">
            Store Truth
          </Link>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600">
            Demo shell
          </span>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <span className="hidden rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 sm:block">
              {contextLabel}
            </span>
            <Link
              href="/exceptions"
              aria-label="Open exceptions, 0 open"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Alerts · 0
            </Link>
            {email ? (
              <button
                type="button"
                onClick={handleSignOut}
                aria-label={`Sign out ${email}`}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden">
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </div>
        ) : null}
      </header>

      <div className="flex w-full flex-1 gap-6 px-4 pb-24 pt-6 md:px-6 md:pb-10">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-20 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="mb-4 rounded-xl bg-zinc-50 p-3">
              <p className="text-xs font-medium text-zinc-500">Business</p>
              <p className="text-sm font-semibold">{business?.name ?? "Demo Business"}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {email
                  ? `Signed in as ${email}. Demo data lives in this browser only.`
                  : "No real data yet. This shell is ready for real numbers."}
              </p>
              {!business ? (
                <Link
                  href="/setup"
                  className="mt-2 inline-block text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
                >
                  Set up business →
                </Link>
              ) : null}
            </div>
            <SidebarNav />
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white md:hidden"
      >
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block px-1 py-3 text-center text-xs font-semibold ${
                    active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
