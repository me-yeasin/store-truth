import EmptyState from "../_components/EmptyState";
import PageHeader from "../_components/PageHeader";

export default function CashPage() {
  return (
    <div>
      <PageHeader
        title="Cash"
        explanation="What you actually counted in the drawer. Expected cash versus counted cash gives your variance."
      />
      <EmptyState
        title="No cash counts yet"
        body="Record cash in, cash out, and drawer counts. Notes on cash events stay with the numbers."
        nextStep="Record tonight's drawer count for one location."
      />
    </div>
  );
}
