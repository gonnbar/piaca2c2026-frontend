import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ChartCard } from "../components/ui/ChartCard";
import { useAuth } from "../contexts/AuthContext";
import { canEdit } from "../utils/calculations";
import { EDIT_WINDOW_MS } from "../utils/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Activity = {
  _id: string;
  patient: string;
  date: string;
  type: string;
  duration: number;
  intensity?: "baja" | "media" | "alta";
  notes?: string;
  createdAt: string;
};

type PatientOpt = { _id: string; fullName: string };

export function PhysicalActivity() {
  const { user } = useAuth();
  const isNutritionist = user?.role === "nutritionist";
  const [activities, setActivities] = useState<Activity[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
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

  async function loadActivities(pid = patientId) {
    if (isNutritionist && !pid) {
      setActivities([]);
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; data: Activity[] }>(
        `/physical-activity${pid ? `?patient=${pid}` : ""}`,
      );
      setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setActivities([]);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    await Promise.all([loadPatients(), loadActivities()]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadActivities(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const chartData = useMemo(() => {
    const map = new Map<string, { minutos: number; label: string }>();
    for (const a of [...activities].sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())) {
      const day = new Date(a.date).toISOString().slice(0, 10);
      const cur = map.get(day) ?? { minutos: 0, label: day.slice(5) };
      cur.minutos += a.duration;
      map.set(day, cur);
    }
    return Array.from(map.values());
  }, [activities]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (isNutritionist) {
      setError("Solo el paciente puede registrar actividad física");
      return;
    }
    if (!patientId) {
      setError("Seleccioná un paciente");
      return;
    }
    if (!type.trim() || !duration) {
      setError("Tipo y duración son requeridos");
      return;
    }
    const payload: Record<string, unknown> = {
      patient: patientId,
      date: new Date(date).toISOString(),
      type: type.trim(),
      duration: Number(duration),
    };
    if (intensity) payload.intensity = intensity;
    if (notes.trim()) payload.notes = notes.trim();
    try {
      await apiFetch("/physical-activity", { method: "POST", body: JSON.stringify(payload) });
      setSuccess("Actividad registrada");
      setType("");
      setDuration("");
      setIntensity("");
      setNotes("");
      await loadActivities(patientId);
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
      await apiFetch(`/physical-activity/${id}`, { method: "DELETE" });
      setActivities((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Actividad física</h1>
        <p className="text-sm text-text-light">Tipo, duración, intensidad y fecha (AGENTS.md)</p>
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
              Seleccioná un paciente para registrar y ver su actividad física.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!isNutritionist && (
          <Card>
            <CardHeader>
              <CardTitle>Registrar actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text">Fecha y hora</label>
                    <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">Tipo *</label>
                    <Input
                      placeholder="Ej: caminata, natación..."
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">Duración (min) *</label>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      placeholder="Ej: 45"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">Intensidad</label>
                    <select
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                      className="mt-1 w-full h-10 rounded-md border border-border bg-surface px-3 text-sm"
                    >
                      <option value="">-- Opcional --</option>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-text">Observaciones</label>
                    <Input
                      placeholder="Opcional"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-error">{error}</p>}
                {success && <p className="text-sm text-primary">{success}</p>}

                <Button type="submit" className="w-full sm:w-auto">
                  Guardar actividad
                </Button>
              </form>
            </CardContent>
          </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Actividades registradas ({activities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-text-light">Sin actividades para el paciente.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-text-light">Fecha</th>
                        <th className="px-3 py-2 text-left font-medium text-text-light">Tipo</th>
                        <th className="px-3 py-2 text-right font-medium text-text-light">Min</th>
                        <th className="px-3 py-2 text-left font-medium text-text-light">Intensidad</th>
                        <th className="px-3 py-2 text-right font-medium text-text-light"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((a) => {
                        const editable = canEdit(a.createdAt, EDIT_WINDOW_MS) || user?.role === "nutritionist";
                        return (
                          <tr key={a._id} className="border-t border-border">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(a.date).toLocaleString("es-AR")}
                              {!editable && (
                                <span className="ml-2 text-xs bg-border px-1.5 py-0.5 rounded">bloqueado 10′</span>
                              )}
                            </td>
                            <td className="px-3 py-2">{a.type}</td>
                            <td className="px-3 py-2 text-right">{a.duration}</td>
                            <td className="px-3 py-2">{a.intensity ?? "—"}</td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(a._id, a.createdAt)}
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
              {loading && <p className="text-xs text-text-light mt-2">Cargando...</p>}
            </CardContent>
          </Card>

          <ChartCard title="Evolución de actividad (minutos por día)">
            <div className="h-64">
              {chartData.length === 0 ? (
                <p className="text-sm text-text-light h-full flex items-center justify-center">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="minutos" name="Minutos" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
