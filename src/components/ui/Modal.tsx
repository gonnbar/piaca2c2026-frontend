import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
        {title && <h2 className="text-lg font-semibold mb-4 text-text">{title}</h2>}
        {children}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-light hover:text-text"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
