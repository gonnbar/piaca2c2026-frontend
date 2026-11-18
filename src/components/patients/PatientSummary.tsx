import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Info } from "../ui/Info";
import { conditionLabel } from "../../utils/conditions";
import { formatDate } from "../../utils/format";
import type { Patient } from "../../types";

const SEX_LABEL = { F: "Femenino", M: "Masculino", X: "Otro" } as const;

export function PatientSummary({ patient }: { patient: Patient }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Nombre completo" value={patient.fullName} />
            <Info label="DNI" value={patient.dni} />
            <Info label="Fecha de nacimiento" value={formatDate(patient.birthDate)} />
            <Info label="Sexo" value={patient.sex ? SEX_LABEL[patient.sex] : undefined} />
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
                  <li key={c} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
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
          <p className="text-xs text-text-light">
            Para modificar estos datos, consultá con tu nutricionista.
          </p>
        </CardContent>
      </Card>
    </>
  );
}