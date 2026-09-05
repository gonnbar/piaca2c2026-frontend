import type { ReactNode } from "react";

type Props = {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
};

export function FormField({ label, error, children, htmlFor }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
