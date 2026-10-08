import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import {
  PatientFields,
  emptyProfile,
  toggleValue,
  type PatientProfileValues,
} from "../components/patients/PatientFields";
import {
  deactivatePatient,
  getPatient,
  updatePatient,
  type UpdatePatientInput,
} from "../services/patients";
import { conditionLabel } from "../utils/conditions";
import { formatDate } from "../utils/format";
import type { Patient } from "../types";

const SEX_LABEL = { F: "Femenino", M: "Masculino", X: "Otro" } as const;

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-light">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-text">{value || "—"}</dd>
    </div>
  );
}

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [profile, setProfile] = useState<PatientProfileValues>(emptyProfile);
  const [conditions, setConditions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getPatient(id)
      .then((p) => {
        if (!cancelled) setPatient(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar el paciente");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function startEditing() {
    if (!patient) return;
    setFullName(patient.fullName);
    setProfile({
      dni: patient.dni ?? "",
      birthDate: patient.birthDate?.slice(0, 10) ?? "",
      sex: patient.sex ?? "",
      phone: patient.phone ?? "",
      otherConditions: patient.otherConditions ?? "",
      allergies: patient.allergies ?? "",
      foodPreferences: patient.foodPreferences ?? "",
      goals: patient.goals ?? "",
    });
    setConditions(patient.conditions);
    setError("");
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setError("");
    setSaving(true);
    try {
      const payload: UpdatePatientInput = {
        fullName: fullName.trim(),
        conditions,
        otherConditions: profile.otherConditions,
        allergies: profile.allergies,
        foodPreferences: profile.foodPreferences,
        goals: profile.goals,
      };
      // el backend rechaza strings vacíos en estos cuatro campos: solo se envían si tienen valor
      if (profile.dni.trim()) payload.dni = profile.dni.trim();
      if (profile.birthDate) payload.birthDate = profile.birthDate;
      if (profile.sex) payload.sex = profile.sex as "M" | "F" | "X";
      if (profile.phone.trim()) payload.phone = profile.phone.trim();

      const updated = await updatePatient(patient._id, payload);
      setPatient({ ...patient, ...updated, user: patient.user }); // conserva el usuario ya cargado (email)
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!patient) return;
    setError("");
    setDeleting(true);
    try {
      await deactivatePatient(patient._id);
      navigate("/patients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al dar de baja al paciente");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => navigate("/patients")}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Pacientes
    </Button>
  );

  if (loading) return <p className="text-sm text-text-light">Cargando…</p>;

  if (!patient) {
    return (
      <div className="space-y-4">
        {backButton}
        <p className="text-sm text-error">{error || "Paciente no encontrado"}</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Editar paciente</h1>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Datos del paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <FormField label="Nombre completo" htmlFor="fullName">
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </FormField>

              <PatientFields
                values={profile}
                conditions={conditions}
                onChange={(name, value) => setProfile((p) => ({ ...p, [name]: value }))}
                onToggleCondition={(value) => setConditions((c) => toggleValue(c, value))}
              />

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
                <Button type="button" variant="secondary" disabled={saving} onClick={() => setEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>{backButton}</div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{patient.fullName}</h1>
          <p className="text-sm text-text-light">{patient.user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/patients/${patient._id}/consultations`)}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Consultas
          </Button>
          <Button onClick={startEditing}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="DNI" value={patient.dni} />
            <Info label="Fecha de nacimiento" value={formatDate(patient.birthDate)} />
            <Info label="Sexo" value={patient.sex ? SEX_LABEL[patient.sex] : undefined} />
            <Info label="Teléfono" value={patient.phone} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historia clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-text-light">Condiciones de salud</p>
            {patient.conditions.length === 0 ? (
              <p className="mt-0.5 text-sm text-text">—</p>
            ) : (
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {patient.conditions.map((c) => (
                  <li
                    key={c}
                    className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {conditionLabel(c)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Otras condiciones" value={patient.otherConditions} />
            <Info label="Alergias" value={patient.allergies} />
            <Info label="Preferencias alimentarias" value={patient.foodPreferences} />
            <Info label="Objetivos" value={patient.goals} />
          </dl>
        </CardContent>
      </Card>

      <Card className="border-error/40">
        <CardHeader>
          <CardTitle>Dar de baja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-text-light">
            El paciente dejará de aparecer en tu lista y no podrá iniciar sesión. Sus datos no se borran.
          </p>
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-text">¿Confirmás la baja de {patient.fullName}?</p>
              <Button variant="danger" size="sm" disabled={deleting} onClick={handleDeactivate}>
                {deleting ? "Procesando…" : "Sí, dar de baja"}
              </Button>
              <Button variant="secondary" size="sm" disabled={deleting} onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Dar de baja al paciente
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}