import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { PatientList } from "./pages/PatientList";
import { PatientForm } from "./pages/PatientForm";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Además de estar logueado, exige un rol concreto; si no coincide, vuelve al inicio
function RoleRoute({ role, children }: { role: "nutritionist" | "patient"; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="patients"
          element={
            <RoleRoute role="nutritionist">
              <PatientList />
            </RoleRoute>
          }
        />
        <Route
          path="patients/new"
          element={
            <RoleRoute role="nutritionist">
              <PatientForm />
            </RoleRoute>
          }
        />
        <Route
          path="patients/:id"
          element={
            <RoleRoute role="nutritionist">
              <div className="text-text-light">Detalle de paciente — por implementar</div>
            </RoleRoute>
          }
        />
        <Route path="measurements" element={<div className="text-text-light">Mediciones — por implementar</div>} />
        <Route path="meals" element={<div className="text-text-light">Comidas — por implementar</div>} />
        <Route path="workouts" element={<div className="text-text-light">Entrenamientos — por implementar</div>} />
        <Route path="physical-activity" element={<div className="text-text-light">Actividad física — por implementar</div>} />
        <Route path="photos" element={<div className="text-text-light">Fotografías — por implementar</div>} />
        <Route path="consultations" element={<div className="text-text-light">Consultas — por implementar</div>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}