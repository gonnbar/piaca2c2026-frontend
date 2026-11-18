import type { ReactNode } from "react";

export type RecordField = {
  label: string;
  value: ReactNode;
  full?: boolean;
};

type RecordCardProps = {
  title: ReactNode;
  badges?: ReactNode;
  fields: RecordField[];
  actions?: ReactNode;
};

export function RecordCard({ title, badges, fields, actions }: RecordCardProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{title}</p>
          {badges && <div className="mt-1 flex flex-wrap gap-1">{badges}</div>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {fields.map((field) => (
          <div key={field.label} className={field.full ? "col-span-2" : "min-w-0"}>
            <dt className="text-xs text-text-light">{field.label}</dt>
            <dd className="break-words text-text">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
