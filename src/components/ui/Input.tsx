import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
