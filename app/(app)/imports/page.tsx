import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function ImportsPage() {
  return (
    <div>
      <PageHeader
        title="Imports"
        explanation="Bring in POS, bank, and inventory files. Nothing becomes truth until you review and confirm it."
      />
      <EmptyState
        title="No imports yet"
        body="CSV upload with field mapping, validation, row review, and import history will live here."
        nextStep="Manual entry first. CSV mapping comes right after."
      />
    </div>
  );
}



