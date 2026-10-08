export const CONDITIONS = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "Hipertensión" },
  { value: "celiac", label: "Celiaquía" },
  { value: "lactose_intolerance", label: "Intolerancia a la lactosa" },
  { value: "dyslipidemia", label: "Dislipidemia" },
  { value: "kidney_disease", label: "Enfermedad renal" },
] as const;

export function conditionLabel(value: string) {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}