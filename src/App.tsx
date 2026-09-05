import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
        <Route path="patients" element={<div className="text-text-light">Pacientes — por implementar</div>} />
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
