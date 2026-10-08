import type { SkinfoldKey } from "../utils/skinfolds";
export type PatientUser = { _id: string; name: string; email: string; role: "nutritionist" | "patient" };

export type Patient = {
  _id: string;
  user: PatientUser;
  nutritionist: string;
  fullName: string;
  dni?: string;
  birthDate?: string;
  sex?: "M" | "F" | "X";
  phone?: string;
  conditions: string[];
  otherConditions?: string;
  allergies?: string;
  foodPreferences?: string;
  goals?: string;
  isActive: boolean;
  createdAt: string;
};

export type Measurement = Partial<Record<SkinfoldKey, number>> & {
  _id: string;
  weight?: number;
  height?: number;
  imc?: number;
  bodyFatPercentage?: number;
  musclePercentage?: number;
};

export type Consultation = {
  _id: string;
  patient: string;
  nutritionist: string;
  date: string;
  observations: string;
  privateNotes?: string; // el backend solo la envía al nutricionista
  measurement: Measurement | null;
  createdAt: string;
};