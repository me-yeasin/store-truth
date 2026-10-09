import Link from "next/link";
import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function LocationsPage() {
  return (
    <div>
      <PageHeader
        title="Locations"
        explanation="Each shop gets its own truth. Numbers are never merged across locations."
      >
        <Link
          href="/setup"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Set up business + location
        </Link>
      </PageHeader>
      <EmptyState
        title="No locations yet"
        body="Add your first shop. Later, staff in each shop will enter their own numbers and you will see each shop separately."
        nextStep="Create a business, then add location 1."
      />
    </div>
  );
}



