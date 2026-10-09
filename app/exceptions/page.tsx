import EmptyState from "../_components/EmptyState";
import PageHeader from "../_components/PageHeader";

export default function ExceptionsPage() {
  return (
    <div>
      <PageHeader
        title="Exceptions"
        explanation="Anything that does not line up shows up here in plain words, so you fix it instead of missing it."
      />
      <EmptyState
        title="Nothing needs attention"
        body="Cash differences, unmatched bank deposits, unknown vendors, and stock differences will appear here."
        nextStep="Add sales, cash, and bank data to see the first checks run."
      />
    </div>
  );
}
