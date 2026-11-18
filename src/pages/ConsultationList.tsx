import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { ConsultationCard } from "../components/consultations/ConsultationCard";
import { deleteConsultation, listConsultations } from "../services/consultations";
import { getPatient } from "../services/patients";
import type { Consultation } from "../types";

export function ConsultationList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState("");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getPatient(id), listConsultations(id)])
      .then(([patient, list]) => {
        if (cancelled) return;
        setPatientName(patient.fullName);
        setConsultations(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar las consultas");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete(consultationId: string) {
    setError("");
    setDeletingId(consultationId);
    try {
      await deleteConsultation(consultationId);
      setConsultations((list) => list.filter((c) => c._id !== consultationId));
      setConfirmingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la consulta");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-sm text-text-light">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {patientName || "Paciente"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text">Consultas{patientName && ` de ${patientName}`}</h1>
        <Button onClick={() => navigate(`/patients/${id}/consultations/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva consulta
        </Button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {consultations.length === 0 && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ClipboardList className="h-8 w-8 text-text-light" aria-hidden="true" />
            <p className="text-sm text-text-light">Este paciente todavía no tiene consultas registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <ConsultationCard
              key={c._id}
              consultation={c}
              showPrivateNotes
              actions={
                confirmingId === c._id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-text">¿Eliminar esta consulta y su medición?</span>
                    <Button variant="danger" size="sm" disabled={deletingId === c._id} onClick={() => handleDelete(c._id)}>
                      {deletingId === c._id ? "Eliminando…" : "Sí, eliminar"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={deletingId === c._id}
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/patients/${id}/consultations/${c._id}/edit`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingId(c._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}