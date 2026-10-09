export default function PageHeader({
  title,
  explanation,
  children,
}: {
  title: string;
  explanation: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">{explanation}</p>
      {children ? <div className="mt-4 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
