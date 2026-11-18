export function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-light">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-text">{value || "—"}</dd>
    </div>
  );
}