"use client";

import { useMemo, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  EMPTY_AUDIT_SNAPSHOT,
  EMPTY_DEMO_SNAPSHOT,
  getAuditSnapshotString,
  getDemoSnapshotString,
  inLocation,
  safeParse,
  subscribeToDemoChanges,
  type DemoAudit,
  type DemoSnapshot,
} from "../../_lib/demo-store";

const ACTION_STYLES: Record<string, string> = {
  added: "bg-green-100 text-green-800",
  deleted: "bg-red-100 text-red-800",
  imported: "bg-blue-100 text-blue-800",
  reviewed: "bg-green-100 text-green-800",
  reopened: "bg-amber-100 text-amber-800",
  sample: "bg-amber-100 text-amber-800",
  location: "bg-zinc-100 text-zinc-700",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditPage() {
  const snapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getDemoSnapshotString,
    () => EMPTY_DEMO_SNAPSHOT
  );
  const auditSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getAuditSnapshotString,
    () => EMPTY_AUDIT_SNAPSHOT
  );
  const { location } = useMemo(
    () => safeParse<DemoSnapshot>(snapshotString, { email: null, business: null, location: null }),
    [snapshotString]
  );
  const events = useMemo(
    () => inLocation(safeParse<DemoAudit[]>(auditSnapshotString, []), location?.id ?? null),
    [auditSnapshotString, location?.id]
  );

  return (
    <div>
      <PageHeader
        title="Audit"
        explanation="Who created, changed, or approved what, and when. No silent edits."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          {events.length === 0 ? "No events" : `${events.length} ${events.length === 1 ? "event" : "events"}`}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold">No audit events yet</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Adds, deletes, imports, reviews, and sample loads for{" "}
            {location?.name ?? "this view"} will appear here with who did them
            and when.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {event.summary}{" "}
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ACTION_STYLES[event.action] ?? "bg-zinc-100 text-zinc-700"}`}
                  >
                    {event.action}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {event.section} · by {event.ownerEmail} · {formatTime(event.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
