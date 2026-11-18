import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { CONDITIONS } from "../../utils/conditions";

export type PatientProfileValues = {
  dni: string;
  birthDate: string;
  sex: string;
  phone: string;
  otherConditions: string;
  allergies: string;
  foodPreferences: string;
  goals: string;
};

export const emptyProfile: PatientProfileValues = {
  dni: "",
  birthDate: "",
  sex: "",
  phone: "",
  otherConditions: "",
  allergies: "",
  foodPreferences: "",
  goals: "",
};

export function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

type Props = {
  values: PatientProfileValues;
  conditions: string[];
  onChange: (name: keyof PatientProfileValues, value: string) => void;
  onToggleCondition: (value: string) => void;
};

export function PatientFields({ values, conditions, onChange, onToggleCondition }: Props) {
  const set =
    (name: keyof PatientProfileValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange(name, e.target.value);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="DNI" htmlFor="dni">
          <Input id="dni" inputMode="numeric" value={values.dni} onChange={set("dni")} />
        </FormField>
        <FormField label="Fecha de nacimiento" htmlFor="birthDate">
          <Input id="birthDate" type="date" value={values.birthDate} onChange={set("birthDate")} />
        </FormField>
        <FormField label="Sexo" htmlFor="sex">
          <Select id="sex" value={values.sex} onChange={set("sex")}>
            <option value="">Sin especificar</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="X">Otro</option>
          </Select>
        </FormField>
        <FormField label="Teléfono" htmlFor="phone">
          <Input id="phone" value={values.phone} onChange={set("phone")} />
        </FormField>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-text">Condiciones de salud</legend>
        <div className="grid gap-2 md:grid-cols-2">
          {CONDITIONS.map((c) => (
            <label key={c.value} className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={conditions.includes(c.value)}
                onChange={() => onToggleCondition(c.value)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label="Otras condiciones" htmlFor="otherConditions">
        <Input id="otherConditions" value={values.otherConditions} onChange={set("otherConditions")} />
      </FormField>
      <FormField label="Alergias" htmlFor="allergies">
        <Textarea id="allergies" rows={2} value={values.allergies} onChange={set("allergies")} />
      </FormField>
      <FormField label="Preferencias alimentarias" htmlFor="foodPreferences">
        <Textarea id="foodPreferences" rows={2} value={values.foodPreferences} onChange={set("foodPreferences")} />
      </FormField>
      <FormField label="Objetivos" htmlFor="goals">
        <Textarea id="goals" rows={2} value={values.goals} onChange={set("goals")} />
      </FormField>
    </>
  );
}