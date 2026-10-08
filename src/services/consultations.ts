import { apiFetch } from "./api";
import type { Consultation } from "../types";
import type { SkinfoldKey } from "../utils/skinfolds";

type Wrapped<T> = { success: true; data: T };

export type MeasurementInput = Partial<Record<"weight" | "height" | SkinfoldKey, number>>;

export type ConsultationInput = {
  date: string;
  observations: string;
  privateNotes?: string;
  measurement?: MeasurementInput;
};

// Nutricionista: requiere patientId. Paciente: sin parámetro, devuelve las suyas.
export async function listConsultations(patientId?: string) {
  const qs = patientId ? `?patient=${encodeURIComponent(patientId)}` : "";
  const res = await apiFetch<Wrapped<Consultation[]>>(`/consultations${qs}`);
  return res.data;
}

export async function getConsultation(id: string) {
  const res = await apiFetch<Wrapped<Consultation>>(`/consultations/${id}`);
  return res.data;
}

export async function createConsultation(patientId: string, input: ConsultationInput) {
  const res = await apiFetch<Wrapped<Consultation>>("/consultations", {
    method: "POST",
    body: JSON.stringify({ patientId, ...input }),
  });
  return res.data;
}

export async function updateConsultation(id: string, input: ConsultationInput) {
  const res = await apiFetch<Wrapped<Consultation>>(`/consultations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteConsultation(id: string) {
  await apiFetch<{ success: true; message: string }>(`/consultations/${id}`, { method: "DELETE" });
}