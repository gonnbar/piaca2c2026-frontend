import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, ClipboardList, Plus, Scale, UserPlus, Users, UserX, Utensils, type LucideIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { getPatientSummary } from "../services/consultations";
import { getDashboardSummary } from "../services/dashboard";
import { formatDate } from "../utils/format";
import type {
  DashboardActivityType,
  DashboardPatient,
  NutritionistSummary,
  PatientDashboardSummary,
} from "../types";

const ACTIVITY_LABELS: Record<DashboardActivityType, string> = {
  consultation: "Consulta",
  measurement: "Medición",
  meal: "Comida",
  workout: "Entrenamiento",
  physicalActivity: "Actividad física",
  photo: "Foto",
};

function activityText(patient: DashboardPatient) {
  if (!patient.lastActivityAt) return "Sin registros";
  const days = patient.daysSinceLastActivity ?? 0;
  const when = days === 0 ? "hoy" : `hace ${days} día${days === 1 ? "" : "s"}`;
  const type = patient.lastActivityType ? ACTIVITY_LABELS[patient.lastActivityType] : "Actividad";
  return `${type} · ${when}`;
}

function useSummary<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    load()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar el resumen");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { data, loading, error };
}

function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <Card className="flex items-center gap-4 p-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-text-light">{label}</p>
        <p className="text-2xl font-bold text-text">{value}</p>
        {hint && <p className="text-xs text-text-light">{hint}</p>}
      </div>
    </Card>
  );
}

function NutritionistDashboard() {
  const navigate = useNavigate();
  const { data, loading, error } = useSummary<NutritionistSummary>(getDashboardSummary);

  if (loading) return <p className="text-sm text-text-light">Cargando…</p>;
  if (!data) return <p className="text-sm text-error">{error || "No se pudo cargar el resumen"}</p>;

  const inactivityPercentage =
    data.patients > 0
      ? Math.round((data.metrics.patientsWithoutRecentActivity / data.patients) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total de pacientes"
          value={String(data.metrics.totalPatients)}
          hint={`${data.patients} activos · ${data.metrics.inactivePatients} inactivos`}
        />
        <StatCard
          icon={CalendarDays}
          label="Consultas del mes"
          value={String(data.metrics.consultationsThisMonth)}
          hint={`Últimos 30 días: ${data.consultationsLast30Days}`}
        />
        <StatCard
          icon={Scale}
          label="Pacientes con medición reciente"
          value={String(data.metrics.patientsWithRecentMeasurements)}
          hint={`${data.metrics.measurementsLast30Days} mediciones · ${data.metrics.measurementsWithBodyFatLast30Days} con % grasa`}
        />
        <StatCard
          icon={Utensils}
          label="Pacientes con alimentación reciente"
          value={String(data.metrics.patientsWithRecentMeals)}
          hint={`${data.metrics.mealsLast7Days} comidas en 7 días`}
        />
        <StatCard
          icon={UserX}
          label="Pacientes sin actividad reciente"
          value={String(data.metrics.patientsWithoutRecentActivity)}
          hint={`${inactivityPercentage}% de los activos`}
        />
        <StatCard
          icon={UserPlus}
          label="Pacientes nuevos del mes"
          value={String(data.metrics.newPatientsThisMonth)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos pacientes actualizados</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPatients.length === 0 ? (
              <p className="text-sm text-text-light">Todavía no hay pacientes activos.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentPatients.map((patient) => (
                  <li key={patient._id}>
                    <Link
                      to={`/patients/${patient._id}`}
                      className="flex flex-col gap-1 py-3 text-sm hover:text-primary sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium text-text">{patient.fullName}</span>
                      <span className="text-xs text-text-light">
                        Actualizado {formatDate(patient.updatedAt)} · {activityText(patient)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pacientes sin actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {data.inactivePatients.length === 0 ? (
              <p className="text-sm text-text-light">Todos los pacientes activos tienen actividad reciente.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.inactivePatients.map((patient) => (
                  <li key={patient._id}>
                    <Link
                      to={`/patients/${patient._id}`}
                      className="flex flex-col gap-1 py-3 text-sm hover:text-primary sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium text-text">{patient.fullName}</span>
                      <span className="text-xs text-text-light">
                        {activityText(patient)} · perfil {formatDate(patient.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Consultas recientes</CardTitle>
          <Button size="sm" onClick={() => navigate("/patients/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo paciente
          </Button>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="text-sm text-text-light">Todavía no hay consultas registradas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((c) => (
                <li key={c._id}>
                  <Link
                    to={`/patients/${c.patientId}/consultations`}
                    className="flex items-center justify-between gap-4 py-3 text-sm hover:text-primary"
                  >
                    <span className="font-medium text-text">{c.patientName || "Paciente"}</span>
                    <span className="text-text-light">{formatDate(c.date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PatientDashboard() {
  const navigate = useNavigate();
  const { data, loading, error } = useSummary<PatientDashboardSummary>(getPatientSummary);

  if (loading) return <p className="text-sm text-text-light">Cargando…</p>;
  if (!data) return <p className="text-sm text-error">{error || "No se pudo cargar el resumen"}</p>;

  const last = data.last;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={ClipboardList} label="Consultas" value={String(data.consultations)} />
        <StatCard icon={CalendarDays} label="Última consulta" value={last ? formatDate(last.date) : "—"} />
        <StatCard
          icon={Scale}
          label="Último peso"
          value={last?.weight != null ? `${last.weight} kg` : "—"}
          hint={last?.imc != null ? `IMC ${last.imc}` : undefined}
        />
      </div>
      <Button variant="secondary" onClick={() => navigate("/consultations")}>
        <ClipboardList className="mr-2 h-4 w-4" />
        Ver mis consultas
      </Button>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Hola, {user.name}</h1>
        <p className="text-sm text-text-light">Este es el resumen de tu actividad.</p>
      </div>
      {user.role === "nutritionist" ? <NutritionistDashboard /> : <PatientDashboard />}
    </div>
  );
}
