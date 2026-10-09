import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function VendorsPage() {
  return (
    <div>
      <PageHeader
        title="Vendors"
        explanation="Who you paid and why. Unknown or changed vendors are flagged for review."
      />
      <EmptyState
        title="No vendors yet"
        body="Record vendors, invoices, and review status. Suspicious entries wait for approval here."
        nextStep="Add your top 3 vendors and one recent invoice."
      />
    </div>
  );
}



