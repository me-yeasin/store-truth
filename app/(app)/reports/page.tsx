import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        explanation="Daily, weekly, and monthly summaries in plain language. Export to CSV when you need it elsewhere."
      />
      <EmptyState
        title="No reports yet"
        body="Daily close, sales vs bank vs cash, cash variance, bank match, inventory, and vendor reports will be generated from real data."
        nextStep="Add data first. Reports are views on top of that data."
      />
    </div>
  );
}



