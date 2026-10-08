import { Link } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";

const ROLE_LABEL = { nutritionist: "Nutricionista", patient: "Paciente" } as const;

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-text">{user?.name}</p>
                  <p className="text-xs text-text-light">{user ? ROLE_LABEL[user.role] : ""}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </>
          ) : (
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-dark">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}