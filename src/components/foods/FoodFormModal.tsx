import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormField } from "../ui/FormField";
import { calculateFoodCalories } from "../../utils/calculations";

// Las kcal no se envían: el backend las calcula desde P/C/G (4/4/9).
export type FoodFormInput = {
  name: string;
  category: string;
  protein: number;
  carbs: number;
  fat: number;
};

type FoodLike = FoodFormInput & { _id: string };

type Props = {
  initial: FoodLike | null;
  categories: readonly string[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: FoodFormInput) => void | Promise<void>;
};

type FormState = {
  name: string;
  category: string;
  protein: string;
  carbs: string;
  fat: string;
};

function emptyForm(categories: readonly string[]): FormState {
  return {
    name: "",
    category: categories[0] ?? "otros",
    protein: "",
    carbs: "",
    fat: "",
  };
}

function fromFood(food: FoodLike, categories: readonly string[]): FormState {
  return {
    name: food.name,
    category: categories.includes(food.category) ? food.category : (categories[0] ?? "otros"),
    protein: String(food.protein),
    carbs: String(food.carbs),
    fat: String(food.fat),
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function validate(form: FormState): string {
  const name = form.name.trim();
  if (name.length < 2 || name.length > 120) return "El nombre debe tener entre 2 y 120 caracteres";
  const macros = [form.protein, form.carbs, form.fat].map(Number);
  if (macros.some((n) => Number.isNaN(n) || n < 0)) {
    return "Los valores nutricionales deben ser números mayores o iguales a 0";
  }
  if (macros.some((n) => n > 100)) {
    return "Proteínas, carbohidratos y grasas deben estar entre 0 y 100";
  }
  return "";
}

export function FoodFormModal({ initial, categories, saving, error, onClose, onSubmit }: Props) {
  // El componente se monta recién al abrir el modal, así el estado inicial
  // queda derivado de `initial` sin necesidad de sincronizarlo con un effect.
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromFood(initial, categories) : emptyForm(categories),
  );
  const [localError, setLocalError] = useState("");

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = validate(form);
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError("");
    await onSubmit({
      name: form.name.trim(),
      category: form.category,
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
    });
  }

  const shownError = localError || error;
  const calculatedCalories = calculateFoodCalories(
    toNumber(form.protein),
    toNumber(form.carbs),
    toNumber(form.fat),
  );

  return (
    <Modal open onClose={onClose} title={initial ? "Editar alimento" : "Nuevo alimento"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" htmlFor="food-name">
          <Input
            id="food-name"
            value={form.name}
            maxLength={120}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Ej: Pollo pechuga"
            required
          />
        </FormField>

        <FormField label="Categoría" htmlFor="food-category">
          <Select
            id="food-category"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Proteínas (g/100g)" htmlFor="food-protein">
            <Input
              id="food-protein"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.protein}
              onChange={(e) => setField("protein", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Carbohidratos (g/100g)" htmlFor="food-carbs">
            <Input
              id="food-carbs"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.carbs}
              onChange={(e) => setField("carbs", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Grasas (g/100g)" htmlFor="food-fat">
            <Input
              id="food-fat"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.fat}
              onChange={(e) => setField("fat", e.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="rounded-md bg-background px-3 py-2 text-sm text-text">
          Calorías calculadas: <b>{calculatedCalories} kcal/100g</b>
          <span className="block text-xs text-text-light">
            P×4 + C×4 + G×9 (factores de Atwater); no se ingresa manualmente.
          </span>
        </div>

        {shownError && <p className="text-sm text-error">{shownError}</p>}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : initial ? "Guardar cambios" : "Crear alimento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
