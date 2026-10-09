import EmptyState from "../_components/EmptyState";
import PageHeader from "../_components/PageHeader";

export default function InventoryPage() {
  return (
    <div>
      <PageHeader
        title="Inventory"
        explanation="What you should have versus what you counted. Differences show as shrinkage or adjustments."
      />
      <EmptyState
        title="No items yet"
        body="Track items, stock on hand, movements, and adjustments at item level where possible."
        nextStep="Add 5 real items from one shop and enter opening stock."
      />
    </div>
  );
}
