import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/Button";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <nav className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-primary text-xl">
          PIACA
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-text-light hidden sm:inline">
                {user?.name} · {user?.role}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Salir
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
