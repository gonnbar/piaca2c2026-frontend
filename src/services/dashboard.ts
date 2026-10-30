import { apiFetch } from "./api";
import type { NutritionistSummary } from "../types";

type Wrapped<T> = { success: true; data: T };

export async function getDashboardSummary() {
  const res = await apiFetch<Wrapped<NutritionistSummary>>("/dashboard/summary");
  return res.data;
}
