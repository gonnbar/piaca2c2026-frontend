import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatDate } from "../../utils/format";
import { SKINFOLDS } from "../../utils/skinfolds";
import type { Consultation } from "../../types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-primary-soft px-3 py-2">
      <p className="text-xs text-text-light">{label}</p>
      <p className="text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

type Props = {
  consultation: Consultation;
  showPrivateNotes?: boolean;
  actions?: ReactNode;
};

export function ConsultationCard({ consultation, showPrivateNotes = false, actions }: Props) {
  const m = consultation.measurement;
  const skinfolds = m ? SKINFOLDS.filter((s) => m[s.key] !== undefined) : [];
  const hasStats =
    !!m &&
    (m.weight !== undefined ||
      m.height !== undefined ||
      m.imc !== undefined ||
      m.bodyFatPercentage !== undefined ||
      m.musclePercentage !== undefined);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{formatDate(consultation.date)}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-text-light">Observaciones</p>
          <p className="mt-0.5 whitespace-pre-line text-sm text-text">{consultation.observations}</p>
        </div>

        {showPrivateNotes && consultation.privateNotes && (
          <div className="rounded-md border border-border bg-background p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-text-light">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Notas privadas (el paciente no las ve)
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-text">{consultation.privateNotes}</p>
          </div>
        )}

        {m && (hasStats || skinfolds.length > 0) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-light">Medición</p>
            {hasStats && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {m.weight !== undefined && <Stat label="Peso" value={`${m.weight} kg`} />}
                {m.height !== undefined && <Stat label="Altura" value={`${m.height} cm`} />}
                {m.imc !== undefined && <Stat label="IMC" value={String(m.imc)} />}
                {m.bodyFatPercentage !== undefined && <Stat label="% grasa" value={`${m.bodyFatPercentage} %`} />}
                {m.musclePercentage !== undefined && <Stat label="% músculo" value={`${m.musclePercentage} %`} />}
              </div>
            )}
            {skinfolds.length > 0 && (
              <p className="text-xs text-text-light">
                Pliegues (mm): {skinfolds.map((s) => `${s.label} ${m[s.key]}`).join(" · ")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}