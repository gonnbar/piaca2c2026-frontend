import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
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
import { createPatient, type NewPatientInput } from "../services/patients";

export function PatientForm() {
  const navigate = useNavigate();
  const [account, setAccount] = useState({ fullName: "", email: "", password: "" });
  const [profile, setProfile] = useState<PatientProfileValues>(emptyProfile);
  const [conditions, setConditions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // el backend rechaza strings vacíos en los campos opcionales, así que se omiten
      const filled = Object.fromEntries(
        Object.entries({ ...account, ...profile }).filter(([, v]) => v.trim() !== ""),
      );
      await createPatient({ ...filled, conditions } as NewPatientInput);
      navigate("/patients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el paciente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Nuevo paciente</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nombre completo" htmlFor="fullName">
              <Input
                id="fullName"
                value={account.fullName}
                onChange={(e) => setAccount((a) => ({ ...a, fullName: e.target.value }))}
                required
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Email (usuario de acceso)" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={account.email}
                  onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Contraseña inicial" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  value={account.password}
                  onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
                  required
                />
              </FormField>
            </div>

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
                {saving ? "Guardando…" : "Crear paciente"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/patients")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}