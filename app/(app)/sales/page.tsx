import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function SalesPage() {
  return (
    <div>
      <PageHeader
        title="Sales"
        explanation="What the POS says you sold. This is the starting point we compare cash and bank against."
      />
      <EmptyState
        title="No sales yet"
        body="Sales can be typed in by hand or uploaded from a POS export. Every entry keeps who added it and when."
        nextStep="Enter today's sales total for one location."
      />
    </div>
  );
}



