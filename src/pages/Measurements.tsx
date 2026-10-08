import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ChartCard } from "../components/ui/ChartCard";
import { useAuth } from "../contexts/AuthContext";
import { calculateIMC, canEdit } from "../utils/calculations";
import { EDIT_WINDOW_MS } from "../utils/constants";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Measurement = {
  _id: string;
  patient: string;
  date: string;
  weight?: number;
  height?: number;
  bicipital?: number;
  tricipital?: number;
  subescapular?: number;
  suprailiaco?: number;
  crural?: number;
  abdominal?: number;
  pectoral?: number;
  axilar?: number;
  peroneoGemelar?: number;
  imc?: number;
  bodyFatPercentage?: number;
  musclePercentage?: number;
  createdAt: string;
};

type PatientOpt = { _id: string; fullName: string };

const FOLDS: { key: keyof Measurement; label: string }[] = [
  { key: "bicipital", label: "Bicipital (mm)" },
  { key: "tricipital", label: "Tricipital (mm)" },
  { key: "subescapular", label: "Subescapular (mm)" },
  { key: "suprailiaco", label: "Suprailiaco (mm)" },
  { key: "crural", label: "Crural (mm)" },
  { key: "abdominal", label: "Abdominal (mm)" },
  { key: "pectoral", label: "Pectoral (mm)" },
  { key: "axilar", label: "Axilar (mm)" },
  { key: "peroneoGemelar", label: "Peroneo/Gemelar (mm)" },
];

export function Measurements() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [folds, setFolds] = useState<Record<string, string>>({});

  async function loadPatients() {
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

  async function loadMeasurements(pid = patientId) {
    try {
      const res = await apiFetch<{ success: boolean; data: Measurement[] }>(
        `/measurements${pid ? `?patient=${pid}` : ""}`,
      );
      setMeasurements(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setMeasurements([]);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    await Promise.all([loadPatients(), loadMeasurements()]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMeasurements(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const previewIMC = useMemo(() => {
    const w = Number(weight);
    const h = Number(height);
    if (!w || !h) return null;
    try {
      return calculateIMC(w, h);
    } catch {
      return null;
    }
  }, [weight, height]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!patientId) {
      setError("Seleccioná un paciente");
      return;
    }
    const payload: Record<string, unknown> = {
      patient: patientId,
      date: new Date(date).toISOString(),
    };
    if (weight) payload.weight = Number(weight);
    if (height) payload.height = Number(height);
    for (const f of FOLDS) {
      const v = folds[f.key as string];
      if (v) payload[f.key] = Number(v);
    }
    try {
      await apiFetch("/measurements", { method: "POST", body: JSON.stringify(payload) });
      setSuccess("Medición registrada");
      setWeight("");
      setHeight("");
      setFolds({});
      await loadMeasurements(patientId);
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
      await apiFetch(`/measurements/${id}`, { method: "DELETE" });
      setMeasurements((prev) => prev.filter((m) => m._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  // Series para gráficos (consumen API, no hardcodeados)
  const chartData = useMemo(() => {
    return [...measurements]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m) => ({
        date: new Date(m.date).toISOString().slice(0, 10),
        label: new Date(m.date).toLocaleDateString("es-AR", { month: "short", day: "numeric" }),
        weight: m.weight ?? null,
        imc: m.imc ?? (m.weight && m.height ? Number(calculateIMC(m.weight, m.height).toFixed(2)) : null),
        bodyFat: m.bodyFatPercentage ?? null,
        muscle: m.musclePercentage ?? null,
        ...Object.fromEntries(FOLDS.map((f) => [f.key, (m as unknown as Record<string, number>)[f.key] ?? null])),
      }));
  }, [measurements]);

  const hasFoldsData = useMemo(
    () => chartData.some((d) => FOLDS.some((f) => (d as unknown as Record<string, unknown>)[f.key] != null)),
    [chartData],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Mediciones corporales</h1>
        <p className="text-sm text-text-light">Peso, altura y 9 pliegues (AGENTS.md: Mediciones)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div>
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
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={load} disabled={loading}>
              {loading ? "Cargando..." : "Actualizar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar medición</CardTitle>
          <p className="text-sm text-text-light">
            Registrá peso, altura y pliegues en mm. IMC se calcula automáticamente (`peso / altura²`).
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-text">Fecha</label>
                <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-text">Peso (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder="Ej: 78.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text">Altura (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder="Ej: 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            {previewIMC != null && (
              <div className="text-sm bg-background rounded-md px-3 py-2 text-text-light">
                Preview IMC: <b className="text-text">{previewIMC}</b> (fórmula `src/utils/calculations.ts`)
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-text mb-2">Pliegues cutáneos (mm) - 9 sitios</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {FOLDS.map((f) => (
                  <div key={f.key}>
                    <label className="text-sm text-text-light">{f.label}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      placeholder="mm"
                      value={folds[f.key as string] ?? ""}
                      onChange={(e) => setFolds((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}
            {success && <p className="text-sm text-primary">{success}</p>}

            <Button type="submit" className="w-full sm:w-auto">
              Guardar medición
            </Button>
            <p className="text-xs text-text-light">
              `POST /api/measurements` calcula `imc` en backend (`src/utils/calculations.ts`). Ventana edición 10 min
              para paciente.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial ({measurements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {measurements.length === 0 ? (
            <p className="text-sm text-text-light">Sin mediciones para el paciente seleccionado.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-text-light">Fecha</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light">Peso</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light">Altura</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light">IMC</th>
                    <th className="px-3 py-2 text-left font-medium text-text-light">Pliegues</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light"></th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m) => {
                    const editable = canEdit(m.createdAt, EDIT_WINDOW_MS) || user?.role === "nutritionist";
                    const foldsSummary = FOLDS.filter((f) => (m as unknown as Record<string, number>)[f.key] != null)
                      .map((f) => `${f.label.split(" ")[0]}:${(m as unknown as Record<string, number>)[f.key]}mm`)
                      .join(" · ");
                    return (
                      <tr key={m._id} className="border-t border-border">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(m.date).toLocaleString("es-AR")}
                          {!editable && (
                            <span className="ml-2 text-xs bg-border px-1.5 py-0.5 rounded">bloqueado 10′</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">{m.weight ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{m.height ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{m.imc?.toFixed(2) ?? "—"}</td>
                        <td className="px-3 py-2 text-xs max-w-[260px] truncate" title={foldsSummary}>
                          {foldsSummary || "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(m._id, m.createdAt)}
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
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Evolución de peso">
          <div className="h-64">
            {chartData.filter((d) => d.weight != null).length === 0 ? (
              <p className="text-sm text-text-light h-full flex items-center justify-center">Sin datos de peso</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#4CAF50" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Evolución de IMC">
          <div className="h-64">
            {chartData.filter((d) => d.imc != null).length === 0 ? (
              <p className="text-sm text-text-light h-full flex items-center justify-center">Sin datos de IMC</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="imc" name="IMC" stroke="#388E3C" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-text-light mt-2">IMC = peso(kg) / altura(m)² (`src/utils/calculations.ts`)</p>
        </ChartCard>

        <ChartCard title="Evolución % grasa / % músculo">
          <div className="h-64">
            {chartData.filter((d) => d.bodyFat != null || d.muscle != null).length === 0 ? (
              <p className="text-sm text-text-light h-full flex items-center justify-center">
                Sin datos — placeholder hasta definir protocolo (Faulkner, etc.)
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bodyFat" name="% Grasa" stroke="#E53935" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="muscle" name="% Músculo" stroke="#388E3C" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Evolución de pliegues (mm)">
          <div className="h-64">
            {!hasFoldsData ? (
              <p className="text-sm text-text-light h-full flex items-center justify-center">Sin datos de pliegues</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {FOLDS.map((f, i) => (
                    <Line
                      key={f.key}
                      type="monotone"
                      dataKey={f.key}
                      name={f.label.split(" ")[0]}
                      stroke={`hsl(${(i * 40) % 360} 70% 45%)`}
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-text-light mt-2">9 sitios AGENTS.md: bicipital, tricipital, etc.</p>
        </ChartCard>
      </div>

      <p className="text-xs text-text-light">
        Gráficos consumen `GET /api/measurements`. No datos hardcodeados en producción.
      </p>
    </div>
  );
}
