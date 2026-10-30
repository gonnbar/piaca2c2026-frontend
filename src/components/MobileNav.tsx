import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { SidebarNav } from "./Sidebar";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function handleDesktopChange() {
      if (desktopQuery.matches) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleDesktopChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleDesktopChange);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navegación principal"
        className="relative flex h-full w-72 max-w-[80vw] flex-col bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-sm font-semibold text-text">Menú</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-light hover:bg-background hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <SidebarNav onNavigate={onClose} />
        </div>
      </aside>
    </div>
  );
}
