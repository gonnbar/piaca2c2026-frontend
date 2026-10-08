import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { PatientSummary } from "../patients/PatientSummary";
import { getOwnPatient, updatePatient } from "../../services/patients";
import type { Patient } from "../../types";

export function MyPatientData() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOwnPatient()
      .then((p) => {
        if (cancelled) return;
        setPatient(p);
        setPhone(p.phone ?? "");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar tus datos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setPhoneError("");
    setPhoneSaved(false);

    const value = phone.trim();
    if (!value) return setPhoneError("Ingresá un teléfono");

    setSavingPhone(true);
    try {
      const updated = await updatePatient(patient._id, { phone: value });
      setPatient({ ...patient, ...updated, user: patient.user });
      setPhone(value);
      setPhoneSaved(true);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Error al guardar el teléfono");
    } finally {
      setSavingPhone(false);
    }
  }

  if (loading) return <p className="text-sm text-text-light">Cargando tus datos…</p>;
  if (!patient) return <p className="text-sm text-error">{error || "No se encontraron tus datos"}</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Datos de contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePhone} className="space-y-4">
            <FormField label="Teléfono" htmlFor="phone" error={phoneError}>
              <Input
                id="phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneSaved(false);
                }}
              />
            </FormField>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={savingPhone}>
                <Save className="mr-2 h-4 w-4" />
                {savingPhone ? "Guardando…" : "Guardar teléfono"}
              </Button>
              {phoneSaved && (
                <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-primary-dark">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Teléfono actualizado
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <PatientSummary patient={patient} />
    </>
  );
}