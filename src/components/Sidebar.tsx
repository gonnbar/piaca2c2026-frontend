import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/patients", label: "Pacientes" },
  { to: "/measurements", label: "Mediciones" },
  { to: "/meals", label: "Comidas" },
  { to: "/workouts", label: "Entrenamientos" },
  { to: "/physical-activity", label: "Actividad física" },
  { to: "/photos", label: "Fotografías" },
  { to: "/consultations", label: "Consultas" },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-border hidden md:block">
      <nav className="p-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-primary text-white" : "text-text hover:bg-background"}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
