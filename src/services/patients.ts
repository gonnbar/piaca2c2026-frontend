import { apiFetch } from "./api";
import type { Patient } from "../types";

type Wrapped<T> = { success: true; data: T };

export type NewPatientInput = {
  fullName: string;
  email: string;
  password: string;
  dni?: string;
  birthDate?: string;
  sex?: "M" | "F" | "X";
  phone?: string;
  conditions: string[];
  otherConditions?: string;
  allergies?: string;
  foodPreferences?: string;
  goals?: string;
};

export async function listPatients(q?: string) {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  const res = await apiFetch<Wrapped<Patient[]>>(`/patients${qs}`);
  return res.data;
}

export async function createPatient(input: NewPatientInput) {
  const res = await apiFetch<Wrapped<{ _id: string }>>("/patients", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}