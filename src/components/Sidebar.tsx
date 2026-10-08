import { NavLink } from "react-router-dom";
import {
  Activity,
  Camera,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Ruler,
  UserRound,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Role = "nutritionist" | "patient";

type SidebarLink = {
  to: string;
  label: string;
  patientLabel?: string; // texto distinto para el paciente
  icon: LucideIcon;
  roles?: Role[]; // sin roles = lo ven todos
};

const links: SidebarLink[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Pacientes", icon: Users, roles: ["nutritionist"] },
  { to: "/measurements", label: "Mediciones", icon: Ruler },
  { to: "/meals", label: "Comidas", icon: Utensils },
  { to: "/workouts", label: "Entrenamientos", icon: Dumbbell },
  { to: "/physical-activity", label: "Actividad física", icon: Activity },
  { to: "/photos", label: "Fotografías", icon: Camera },
  { to: "/consultations", label: "Mis consultas", icon: ClipboardList, roles: ["patient"] },
  { to: "/profile", label: "Mi perfil", icon: UserRound },
];

export function Sidebar() {
  const { user } = useAuth();
  const visible = links.filter((l) => !l.roles || (user && l.roles.includes(user.role)));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
      <nav aria-label="Navegación principal" className="space-y-1 p-4">
        {visible.map(({ to, label, patientLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-primary-soft font-medium text-primary" : "text-text hover:bg-background"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {user?.role === "patient" && patientLabel ? patientLabel : label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
