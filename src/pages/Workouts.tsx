import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ChartCard } from "../components/ui/ChartCard";
import { useAuth } from "../contexts/AuthContext";
import { canEdit } from "../utils/calculations";
import { EDIT_WINDOW_MS } from "../utils/constants";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
};

type Workout = {
  _id: string;
  patient: string;
  date: string;
  notes?: string;
  perceivedIntensity?: number;
  exercises: Exercise[];
  createdAt: string;
};

type PatientOpt = { _id: string; fullName: string };
type ExerciseRow = { name: string; sets: string; reps: string; weight: string; notes: string };

const EMPTY_ROW: ExerciseRow = { name: "", sets: "", reps: "", weight: "", notes: "" };

export function Workouts() {
  const { user } = useAuth();
  const isNutritionist = user?.role === "nutritionist";
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [intensity, setIntensity] = useState("");
  const [rows, setRows] = useState<ExerciseRow[]>([{ ...EMPTY_ROW }]);
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [chartExercise, setChartExercise] = useState("");
  const needsPatient = isNutritionist && !patientId;

  async function loadPatients() {
    if (!isNutritionist) {
      try {
        const res = await apiFetch<{ success: boolean; data: { _id: string; fullName: string } }>(
          "/patients/me",
        );
        setPatients([{ _id: res.data._id, fullName: res.data.fullName }]);
        setPatientId(res.data._id);
      } catch {
        setPatients([]);
      }
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; data: Array<{ _id: string; fullName: string }> }>(
        "/patients",
      );
      if (Array.isArray(res.data)) {
        setPatients(res.data.map((p) => ({ _id: p._id, fullName: p.fullName })));
        if (res.data.length === 1 && !patientId) setPatientId(res.data[0]._id);
      }
    } catch {
      setPatients([]);
    }
  }

  async function loadWorkouts(pid = patientId, exercise = exerciseFilter) {
    if (isNutritionist && !pid) {
      setWorkouts([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (pid) params.set("patient", pid);
      if (exercise.trim()) params.set("exercise", exercise.trim());
      const qs = params.toString();
      const res = await apiFetch<{ success: boolean; data: Workout[] }>(
        `/workouts${qs ? `?${qs}` : ""}`,
      );
      setWorkouts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setWorkouts([]);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    await Promise.all([loadPatients(), loadWorkouts()]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadWorkouts(patientId, exerciseFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    const t = setTimeout(() => loadWorkouts(patientId, exerciseFilter), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseFilter]);

  // Nombres de ejercicios disponibles para el gráfico
  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    for (const w of workouts) for (const e of w.exercises) if (e.name) set.add(e.name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [workouts]);

  useEffect(() => {
    if (!chartExercise && exerciseNames.length > 0) setChartExercise(exerciseNames[0]);
    if (chartExercise && !exerciseNames.includes(chartExercise)) {
      setChartExercise(exerciseNames[0] ?? "");
    }
  }, [exerciseNames, chartExercise]);

  const chartData = useMemo(() => {
    if (!chartExercise) return [];
    return [...workouts]
      .map((w) => ({
        date: w.date,
        ex: w.exercises.find((e) => e.name === chartExercise),
      }))
      .filter((d) => d.ex)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        label: new Date(d.date).toLocaleDateString("es-AR", { month: "short", day: "numeric" }),
        peso: d.ex!.weight,
        series: d.ex!.sets,
        reps: d.ex!.reps,
      }));
  }, [workouts, chartExercise]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (isNutritionist) {
      setError("Solo el paciente puede registrar entrenamientos");
      return;
    }
    if (!patientId) {
      setError("Seleccioná un paciente");
      return;
    }
    const exercises = rows
      .filter((r) => r.name.trim() && r.sets && r.reps && r.weight !== "")
      .map((r) => ({
        name: r.name.trim(),
        sets: Number(r.sets),
        reps: Number(r.reps),
        weight: Number(r.weight),
        ...(r.notes.trim() ? { notes: r.notes.trim() } : {}),
      }));
    if (exercises.length === 0) {
      setError("Agregá al menos un ejercicio completo (nombre, series, reps y peso)");
      return;
    }
    const payload: Record<string, unknown> = {
      patient: patientId,
      date: new Date(date).toISOString(),
      exercises,
    };
    if (notes.trim()) payload.notes = notes.trim();
    if (intensity) payload.perceivedIntensity = Number(intensity);
    try {
      await apiFetch("/workouts", { method: "POST", body: JSON.stringify(payload) });
      setSuccess("Entrenamiento registrado");
      setRows([{ ...EMPTY_ROW }]);
      setNotes("");
      setIntensity("");
      await loadWorkouts(patientId, exerciseFilter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function handleDelete(id: string, createdAt: string) {
    if (!canEdit(createdAt, EDIT_WINDOW_MS) && user?.role === "patient") {
      setError("El registro ya no puede modificarse (ventana 10 min)");
      return;
    }
    try {
      await apiFetch(`/workouts/${id}`, { method: "DELETE" });
      setWorkouts((prev) => prev.filter((w) => w._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Entrenamientos de fuerza</h1>
        <p className="text-sm text-text-light">Series, reps, carga e intensidad (AGENTS.md)</p>
      </div>

      {isNutritionist && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <label className="text-sm font-medium text-text">Paciente</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="">-- Seleccionar --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {needsPatient ? (
        <Card>
          <CardContent>
            <p className="text-sm text-text-light">
              Seleccioná un paciente para registrar y ver sus entrenamientos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!isNutritionist && (
          <Card>
            <CardHeader>
              <CardTitle>Registrar entrenamiento</CardTitle>
              <p className="text-sm text-text-light">
                Una sesión con uno o más ejercicios. Se registra, no se diseñan rutinas (AGENTS.md).
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text">Fecha y hora</label>
                    <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">Intensidad percibida (1-10)</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      placeholder="Opcional"
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">Observación sesión</label>
                    <Input
                      placeholder="Opcional"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text">Ejercicios ({rows.length})</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}
                    >
                      + Ejercicio
                    </Button>
                  </div>
                  {rows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-2 sm:grid-cols-[1fr_80px_80px_100px_1fr_40px] gap-2 items-center rounded-md border border-border p-2">
                      <Input
                        placeholder="Ejercicio *"
                        value={row.name}
                        onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))}
                        required
                      />
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Series *"
                        value={row.sets}
                        onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, sets: e.target.value } : r)))}
                        required
                      />
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        placeholder="Reps *"
                        value={row.reps}
                        onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, reps: e.target.value } : r)))}
                        required
                      />
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        step="0.5"
                        placeholder="Peso kg *"
                        value={row.weight}
                        onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, weight: e.target.value } : r)))}
                        required
                      />
                      <Input
                        placeholder="Nota (opcional)"
                        value={row.notes}
                        onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r)))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={rows.length === 1}
                        aria-label="Quitar ejercicio"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>

                {error && <p className="text-sm text-error">{error}</p>}
                {success && <p className="text-sm text-primary">{success}</p>}

                <Button type="submit" className="w-full sm:w-auto">
                  Guardar entrenamiento
                </Button>
              </form>
            </CardContent>
          </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sesiones registradas ({workouts.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <label className="text-sm font-medium text-text">Filtrar por ejercicio</label>
                <Input
                  placeholder="Ej: sentadilla..."
                  value={exerciseFilter}
                  onChange={(e) => setExerciseFilter(e.target.value)}
                />
              </div>
              {workouts.length === 0 ? (
                <p className="text-sm text-text-light">Sin entrenamientos para el paciente/filtro.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-text-light">Fecha</th>
                        <th className="px-3 py-2 text-left font-medium text-text-light">Ejercicios</th>
                        <th className="px-3 py-2 text-right font-medium text-text-light">Int.</th>
                        <th className="px-3 py-2 text-right font-medium text-text-light"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {workouts.map((w) => {
                        const editable = canEdit(w.createdAt, EDIT_WINDOW_MS) || user?.role === "nutritionist";
                        return (
                          <tr key={w._id} className="border-t border-border">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(w.date).toLocaleString("es-AR")}
                              {!editable && (
                                <span className="ml-2 text-xs bg-border px-1.5 py-0.5 rounded">bloqueado 10′</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {w.exercises.map((e) => `${e.name} ${e.sets}×${e.reps} ${e.weight}kg`).join(" · ")}
                            </td>
                            <td className="px-3 py-2 text-right">{w.perceivedIntensity ?? "—"}</td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(w._id, w.createdAt)}
                                disabled={!editable}
                                title={editable ? "Eliminar" : "Fuera de ventana 10 min"}
                              >
                                Eliminar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {loading && <p className="text-xs text-text-light">Cargando...</p>}
            </CardContent>
          </Card>

          <ChartCard title="Evolución de carga por ejercicio">
            <div className="max-w-md mb-4">
              <label className="text-sm font-medium text-text">Ejercicio</label>
              <select
                value={chartExercise}
                onChange={(e) => setChartExercise(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="">-- Seleccionar --</option>
                {exerciseNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-64">
              {chartData.length === 0 ? (
                <p className="text-sm text-text-light h-full flex items-center justify-center">
                  Sin datos para el ejercicio seleccionado
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#4CAF50" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="reps" name="Reps" stroke="#8BC34A" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-xs text-text-light mt-2">Carga por ejercicio desde GET /api/workouts. Sin 1RM (MVP).</p>
          </ChartCard>
        </>
      )}
    </div>
  );
}
