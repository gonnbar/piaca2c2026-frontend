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