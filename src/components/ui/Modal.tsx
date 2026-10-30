import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidthClass?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-lg",
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative my-auto max-h-[calc(100dvh-2rem)] w-full overflow-y-auto overscroll-contain rounded-lg bg-surface p-4 shadow-lg sm:p-6 ${maxWidthClass}`}
      >
        {title && <h2 className="mb-4 pr-12 text-lg font-semibold text-text">{title}</h2>}
        {children}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md text-text-light hover:bg-background hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
