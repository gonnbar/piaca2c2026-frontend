import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Save, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import {
  createConsultation,
  getConsultation,
  updateConsultation,
  type ConsultationInput,
  type MeasurementInput,
} from "../services/consultations";
import { getPatient } from "../services/patients";
import { SKINFOLDS, type SkinfoldKey } from "../utils/skinfolds";

type MeasurementKey = "weight" | "height" | SkinfoldKey;

const MEASUREMENT_KEYS: MeasurementKey[] = ["weight", "height", ...SKINFOLDS.map((s) => s.key)];

const emptyMeasurement = Object.fromEntries(MEASUREMENT_KEYS.map((k) => [k, ""])) as Record<MeasurementKey, string>;

// fecha local en formato YYYY-MM-DD (toISOString usaría UTC y de noche daría el día siguiente)
const today = () => new Date().toLocaleDateString("sv-SE");

export function ConsultationForm() {
  const { id: patientId, consultationId } = useParams<{ id: string; consultationId?: string }>();
  const navigate = useNavigate();
  const isEdit = !!consultationId;

  const [patientName, setPatientName] = useState("");
  const [date, setDate] = useState(today());
  const [observations, setObservations] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [measurement, setMeasurement] = useState<Record<MeasurementKey, string>>(emptyMeasurement);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const patient = await getPatient(patientId);
        if (cancelled) return;
        setPatientName(patient.fullName);

        if (consultationId) {
          const c = await getConsultation(consultationId);
          if (cancelled) return;
          if (c.patient !== patientId) throw new Error("Consulta no encontrada");
          setDate(c.date.slice(0, 10));
          setObservations(c.observations);
          setPrivateNotes(c.privateNotes ?? "");
          const m = c.measurement;
          if (m) {
            setMeasurement(
              Object.fromEntries(
                MEASUREMENT_KEYS.map((k) => [k, m[k] !== undefined ? String(m[k]) : ""]),
              ) as Record<MeasurementKey, string>,
            );
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar los datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, consultationId]);

  function setMeasure(key: MeasurementKey) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setMeasurement((m) => ({ ...m, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setError("");
    setSaving(true);
    try {
      // el backend rechaza strings vacíos en la medición: solo se envían los campos con valor
      const measurementInput: MeasurementInput = {};
      for (const k of MEASUREMENT_KEYS) {
        const raw = measurement[k].trim();
        if (raw !== "") measurementInput[k] = Number(raw);
      }

      const payload: ConsultationInput = { date, observations: observations.trim() };
      const notes = privateNotes.trim();
      if (notes || isEdit) payload.privateNotes = notes; // al editar se permite vaciarlas
      if (Object.keys(measurementInput).length > 0) payload.measurement = measurementInput;

      if (consultationId) {
        await updateConsultation(consultationId, payload);
      } else {
        await createConsultation(patientId, payload);
      }
      navigate(`/patients/${patientId}/consultations`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la consulta");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-text-light">Cargando…</p>;

  const listPath = `/patients/${patientId}/consultations`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{isEdit ? "Editar consulta" : "Nueva consulta"}</h1>
        {patientName && <p className="text-sm text-text-light">{patientName}</p>}
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Fecha" htmlFor="date">
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </FormField>
            <FormField label="Observaciones (las ve el paciente)" htmlFor="observations">
              <Textarea
                id="observations"
                rows={4}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Notas privadas" htmlFor="privateNotes">
              <Textarea
                id="privateNotes"
                rows={3}
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
              />
              <p className="flex items-center gap-1.5 text-xs text-text-light">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Solo las ves vos: el paciente nunca las recibe.
              </p>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medición</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-light">
              Todo es opcional. El IMC se calcula solo cuando cargás peso y altura.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Peso (kg)" htmlFor="weight">
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="1"
                  max="500"
                  value={measurement.weight}
                  onChange={setMeasure("weight")}
                />
              </FormField>
              <FormField label="Altura (cm)" htmlFor="height">
                <Input
                  id="height"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="50"
                  max="250"
                  value={measurement.height}
                  onChange={setMeasure("height")}
                />
              </FormField>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-text">Pliegues cutáneos (mm)</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                {SKINFOLDS.map((s) => (
                  <FormField key={s.key} label={s.label} htmlFor={s.key}>
                    <Input
                      id={s.key}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      max="100"
                      value={measurement[s.key]}
                      onChange={setMeasure(s.key)}
                    />
                  </FormField>
                ))}
              </div>
            </fieldset>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar consulta"}
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => navigate(listPath)}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}