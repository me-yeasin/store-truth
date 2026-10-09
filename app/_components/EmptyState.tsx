export default function EmptyState({
  title,
  body,
  nextStep,
}: {
  title: string;
  body: string;
  nextStep: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{body}</p>
      <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
        Next step: {nextStep}
      </p>
    </div>
  );
}
