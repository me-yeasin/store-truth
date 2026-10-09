import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function LocationsPage() {
  return (
    <div>
      <PageHeader
        title="Locations"
        explanation="Each shop gets its own truth. Numbers are never merged across locations."
      />
      <EmptyState
        title="No locations yet"
        body="Add your first shop. Later, staff in each shop will enter their own numbers and you will see each shop separately."
        nextStep="Create a business, then add location 1."
      />
    </div>
  );
}



