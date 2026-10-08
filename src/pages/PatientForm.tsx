import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { createPatient, type NewPatientInput } from "../services/patients";
import { CONDITIONS } from "../utils/conditions";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  dni: "",
  birthDate: "",
  sex: "",
  phone: "",
  otherConditions: "",
  allergies: "",
  foodPreferences: "",
  goals: "",
};

const fieldClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

export function PatientForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [conditions, setConditions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setField(name: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value }));
  }

  function toggleCondition(value: string) {
    setConditions((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // el backend rechaza strings vacíos en los campos opcionales, así que se omiten
      const filled = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== ""));
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
              <Input id="fullName" value={form.fullName} onChange={setField("fullName")} required />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Email (usuario de acceso)" htmlFor="email">
                <Input id="email" type="email" value={form.email} onChange={setField("email")} required />
              </FormField>
              <FormField label="Contraseña inicial" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={setField("password")}
                  required
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="DNI" htmlFor="dni">
                <Input id="dni" inputMode="numeric" value={form.dni} onChange={setField("dni")} />
              </FormField>
              <FormField label="Fecha de nacimiento" htmlFor="birthDate">
                <Input id="birthDate" type="date" value={form.birthDate} onChange={setField("birthDate")} />
              </FormField>
              <FormField label="Sexo" htmlFor="sex">
                <select id="sex" className={fieldClass} value={form.sex} onChange={setField("sex")}>
                  <option value="">Sin especificar</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                  <option value="X">Otro</option>
                </select>
              </FormField>
              <FormField label="Teléfono" htmlFor="phone">
                <Input id="phone" value={form.phone} onChange={setField("phone")} />
              </FormField>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-text">Condiciones de salud</legend>
              <div className="grid gap-2 md:grid-cols-2">
                {CONDITIONS.map((c) => (
                  <label key={c.value} className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={conditions.includes(c.value)}
                      onChange={() => toggleCondition(c.value)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <FormField label="Otras condiciones" htmlFor="otherConditions">
              <Input id="otherConditions" value={form.otherConditions} onChange={setField("otherConditions")} />
            </FormField>
            <FormField label="Alergias" htmlFor="allergies">
              <textarea id="allergies" rows={2} className={fieldClass} value={form.allergies} onChange={setField("allergies")} />
            </FormField>
            <FormField label="Preferencias alimentarias" htmlFor="foodPreferences">
              <textarea id="foodPreferences" rows={2} className={fieldClass} value={form.foodPreferences} onChange={setField("foodPreferences")} />
            </FormField>
            <FormField label="Objetivos" htmlFor="goals">
              <textarea id="goals" rows={2} className={fieldClass} value={form.goals} onChange={setField("goals")} />
            </FormField>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Crear paciente"}
              </Button>
              <Button type="button" onClick={() => navigate("/patients")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}