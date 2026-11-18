export const SKINFOLDS = [
  { key: "bicipital", label: "Bicipital" },
  { key: "tricipital", label: "Tricipital" },
  { key: "subescapular", label: "Subescapular" },
  { key: "suprailiaco", label: "Suprailíaco" },
  { key: "crural", label: "Crural" },
  { key: "abdominal", label: "Abdominal" },
  { key: "pectoral", label: "Pectoral" },
  { key: "axilar", label: "Axilar" },
  { key: "peroneoGemelar", label: "Peroneo gemelar" },
] as const;

export type SkinfoldKey = (typeof SKINFOLDS)[number]["key"];