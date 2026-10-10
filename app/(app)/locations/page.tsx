"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import PageHeader from "../../_components/PageHeader";
import {
  addLocation,
  EMPTY_LOCATIONS_SNAPSHOT,
  EMPTY_SALES_SNAPSHOT,
  getLocationsSnapshotString,
  getSalesSnapshotString,
  safeParse,
  setActiveLocationId,
  subscribeToDemoChanges,
  type DemoSale,
  type LocationsSnapshot,
} from "../../_lib/demo-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export default function LocationsPage() {
  const locationsSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getLocationsSnapshotString,
    () => EMPTY_LOCATIONS_SNAPSHOT
  );
  const salesSnapshotString = useSyncExternalStore(
    subscribeToDemoChanges,
    getSalesSnapshotString,
    () => EMPTY_SALES_SNAPSHOT
  );
  const { locations, activeId } = useMemo(
    () =>
      safeParse<LocationsSnapshot>(locationsSnapshotString, {
        locations: [],
        activeId: null,
      }),
    [locationsSnapshotString]
  );
  const sales = useMemo(
    () => safeParse<DemoSale[]>(salesSnapshotString, []),
    [salesSnapshotString]
  );
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const salesByLocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) {
      if (!s.locationId) continue;
      map.set(s.locationId, (map.get(s.locationId) ?? 0) + 1);
    }
    return map;
  }, [sales]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give the location a name, for example Second Street shop.");
      return;
    }
    const created = addLocation(name.trim());
    setActiveLocationId(created.id);
    setName("");
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        explanation="Each shop gets its own truth. Numbers are never merged across locations — switch below to view each shop."
      >
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          {locations.length === 0
            ? "No locations yet"
            : `${locations.length} ${locations.length === 1 ? "location" : "locations"}`}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
          Demo — stored in this browser only
        </span>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          aria-label="Add location form"
          className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2"
        >
          <h2 className="text-sm font-semibold">Add location</h2>
          <p className="mt-1 text-sm text-zinc-600">
            New entries are tagged to the active location.
          </p>
          <label htmlFor="location-name" className="mb-1 mt-4 block text-sm font-semibold">
            Location name
          </label>
          <input
            id="location-name"
            type="text"
            required
            placeholder="Second Street shop"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Add and switch to it
          </button>
        </form>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-3">
          <h2 className="text-sm font-semibold">Your locations</h2>
          {locations.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600">
              No locations yet. Add your first shop on the left.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {locations.map((loc) => {
                const active = loc.id === activeId;
                const count = salesByLocation.get(loc.id) ?? 0;
                return (
                  <li
                    key={loc.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      active ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {loc.name}{" "}
                        {active ? (
                          <span className="ml-1 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
                            Active
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {count} {count === 1 ? "sale" : "sales"} recorded here.
                      </p>
                    </div>
                    {!active ? (
                      <button
                        type="button"
                        onClick={() => setActiveLocationId(loc.id)}
                        aria-label={`Switch to ${loc.name}`}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                      >
                        Switch
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
