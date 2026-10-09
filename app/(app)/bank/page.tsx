import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function BankPage() {
  return (
    <div>
      <PageHeader
        title="Bank"
        explanation="What arrived in the bank. Deposits are matched to sales so unmatched money is visible."
      />
      <EmptyState
        title="No bank movements yet"
        body="Record deposits, withdrawals, and transfers. Matching to sales happens in the truth view."
        nextStep="Enter this week's deposits for one location."
      />
    </div>
  );
}



