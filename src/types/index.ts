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

export type DashboardActivityType =
  | "consultation"
  | "measurement"
  | "meal"
  | "workout"
  | "physicalActivity"
  | "photo";

export type DashboardPatient = {
  _id: string;
  fullName: string;
  updatedAt: string;
  lastActivityAt: string | null;
  lastActivityType: DashboardActivityType | null;
  daysSinceLastActivity: number | null;
};

export type NutritionistSummary = {
  patients: number;
  consultations: number;
  consultationsLast30Days: number;
  recent: { _id: string; date: string; patientId: string; patientName: string }[];
  metrics: {
    totalPatients: number;
    inactivePatients: number;
    newPatientsThisMonth: number;
    consultationsThisMonth: number;
    measurementsLast30Days: number;
    patientsWithRecentMeasurements: number;
    measurementsWithBodyFatLast30Days: number;
    mealsLast7Days: number;
    patientsWithRecentMeals: number;
    patientsWithoutRecentActivity: number;
  };
  recentPatients: DashboardPatient[];
  inactivePatients: DashboardPatient[];
};

export type PatientDashboardSummary = {
  consultations: number;
  last: { date: string; weight: number | null; imc: number | null } | null;
};