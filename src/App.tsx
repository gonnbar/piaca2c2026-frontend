import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { PatientList } from "./pages/PatientList";
import { PatientForm } from "./pages/PatientForm";
import { PatientDetail } from "./pages/PatientDetail";
import { ConsultationList } from "./pages/ConsultationList";
import { Profile } from "./pages/Profile";
import { ConsultationForm } from "./pages/ConsultationForm";
import { MyConsultations } from "./pages/MyConsultations";
import { Meals } from "./pages/Meals";
import { Measurements } from "./pages/Measurements";

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

        <Route path="patients" element={<RoleRoute role="nutritionist"><PatientList /></RoleRoute>} />
        <Route path="patients/new" element={<RoleRoute role="nutritionist"><PatientForm /></RoleRoute>} />
        <Route path="patients/:id" element={<RoleRoute role="nutritionist"><PatientDetail /></RoleRoute>} />
        <Route
          path="patients/:id/consultations"
          element={<RoleRoute role="nutritionist"><ConsultationList /></RoleRoute>}
        />
        <Route
          path="patients/:id/consultations/new"
          element={<RoleRoute role="nutritionist"><ConsultationForm /></RoleRoute>}
        />
        <Route
          path="patients/:id/consultations/:consultationId/edit"
          element={<RoleRoute role="nutritionist"><ConsultationForm /></RoleRoute>}
        />

        <Route path="consultations" element={<RoleRoute role="patient"><MyConsultations /></RoleRoute>} />
        <Route path="profile" element={<Profile />} />
        
        <Route path="measurements" element={<div className="text-text-light">Mediciones — por implementar</div>} />
        <Route path="meals" element={<div className="text-text-light">Comidas — por implementar</div>} />
        <Route path="patients" element={<div className="text-text-light">Pacientes — por implementar</div>} />
        <Route path="measurements" element={<Measurements />} />
        <Route path="meals" element={<Meals />} />
        <Route path="workouts" element={<div className="text-text-light">Entrenamientos — por implementar</div>} />
        <Route path="physical-activity" element={<div className="text-text-light">Actividad física — por implementar</div>} />
        <Route path="photos" element={<div className="text-text-light">Fotografías — por implementar</div>} />
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