import type { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-primary-light/20 px-2.5 py-0.5 text-xs font-semibold text-primary-dark ${className}`}
      {...props}
    />
  );
}
