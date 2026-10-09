import EmptyState from "../_components/EmptyState";
import PageHeader from "../_components/PageHeader";

export default function AuditPage() {
  return (
    <div>
      <PageHeader
        title="Audit"
        explanation="Who created, changed, or approved what, and when. No silent edits."
      />
      <EmptyState
        title="No audit events yet"
        body="Imports, reconciliations, exception actions, and approvals will be logged here."
        nextStep="Actions will start appearing once entry begins."
      />
    </div>
  );
}
