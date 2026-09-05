export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const EDIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

export const ROLES = {
  NUTRITIONIST: "nutritionist",
  PATIENT: "patient",
} as const;

export const COLORS = {
  primary: "#4CAF50",
  primaryDark: "#388E3C",
  primaryLight: "#8BC34A",
  background: "#F5F7FA",
  surface: "#FFFFFF",
  text: "#263238",
  textLight: "#616161",
  border: "#E0E0E0",
  error: "#E53935",
} as const;
