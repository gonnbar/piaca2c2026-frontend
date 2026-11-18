import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { ConsultationCard } from "../components/consultations/ConsultationCard";
import { listConsultations } from "../services/consultations";
import type { Consultation } from "../types";

export function MyConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listConsultations()
      .then((list) => {
        if (!cancelled) setConsultations(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar tus consultas");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-sm text-text-light">Cargando…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Mis consultas</h1>

      {error && <p className="text-sm text-error">{error}</p>}

      {consultations.length === 0 && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ClipboardList className="h-8 w-8 text-text-light" aria-hidden="true" />
            <p className="text-sm text-text-light">Todavía no tenés consultas registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <ConsultationCard key={c._id} consultation={c} />
          ))}
        </div>
      )}
    </div>
  );
}