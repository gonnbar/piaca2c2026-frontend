import { apiFetch } from "./api";
import type { NutritionistSummary } from "../types";

type Wrapped<T> = { success: true; data: T };

export type IMCEstadisticas = {
  totalPatients: number;
  underweight: number;
  normalWeight: number;
  overweight: number;
  obese: number;
};

export async function getDashboardSummary() {
  const res = await apiFetch<Wrapped<NutritionistSummary>>("/dashboard/summary");
  return res.data;
}

export async function getIMCEstadisticas() {
  const res = await apiFetch<Wrapped<IMCEstadisticas>>("/dashboard/imc-estadisticas");
  return res.data;
}
