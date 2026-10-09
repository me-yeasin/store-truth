import EmptyState from "../../_components/EmptyState";
import PageHeader from "../../_components/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        explanation="Business, account, and preferences. Currency and locale basics live here."
      />
      <EmptyState
        title="Settings are minimal for now"
        body="Business profile, fiscal settings, and user account controls will be added with authentication."
        nextStep="Authentication and business model are the next build steps."
      />
    </div>
  );
}



