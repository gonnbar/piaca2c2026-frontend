import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ChartCard } from "../components/ui/ChartCard";
import { useAuth } from "../contexts/AuthContext";
import { canEdit, calculateMealTotals } from "../utils/calculations";
import { EDIT_WINDOW_MS } from "../utils/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

// Tipos API
type Food = {
  _id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealItemPopulated = {
  food: Food;
  grams: number;
};

type Meal = {
  _id: string;
  patient: string;
  date: string;
  items: MealItemPopulated[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
};

type PatientOpt = { _id: string; fullName: string };

const COLORS = {
  protein: "#4CAF50",
  carbs: "#8BC34A",
  fat: "#FFC107",
};

export function Meals() {
  const { user } = useAuth();
  const isNutritionist = user?.role === "nutritionist";
  const [foods, setFoods] = useState<Food[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state - flexible, sin categorías fijas (AGENTS.md: Comidas)
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [items, setItems] = useState<{ foodId: string; grams: string }[]>([
    { foodId: "", grams: "" },
  ]);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodCategory, setFoodCategory] = useState("");
  const [foodsOpen, setFoodsOpen] = useState(false);
  const needsPatient = isNutritionist && !patientId;

  const FOOD_CATEGORIES = [
    "carnes",
    "huevos",
    "leche",
    "quesos",
    "yogur",
    "verduras",
    "cereales",
    "frutas",
    "semillas",
    "miel",
    "azucar",
    "aceites",
    "grasas",
    "otros",
  ];

  async function loadFoods(search = foodSearch, category = foodCategory) {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const qs = params.toString();
      const res = await apiFetch<{ success: boolean; data: Food[] }>(
        `/foods${qs ? `?${qs}` : ""}`,
      );
      setFoods(Array.isArray(res.data) ? res.data : []);
      if (!Array.isArray(res.data) || res.data.length === 0) {
        console.warn("foods vacío", res);
      }
    } catch (e) {
      console.error("Error cargando foods", e);
      setError(e instanceof Error ? e.message : "Error cargando alimentos");
      setFoods([]);
    }
  }

  async function loadMeals(pid = patientId) {
    // Nutricionista sin paciente: no traer todo, limpiar para no mezclar.
    if (isNutritionist && !pid) {
      setMeals([]);
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; data: Meal[] }>(`/meals${pid ? `?patient=${pid}` : ""}`);
      setMeals(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error cargando meals", e);
      setMeals([]);
    }
  }

  async function loadPatients() {
    // Paciente: no usa GET /patients (solo nutricionista, 403). Resuelve su
    // propio paciente vía GET /patients/me y fija patientId automáticamente.
    if (!isNutritionist) {
      try {
        const res = await apiFetch<{ success: boolean; data: { _id: string; fullName: string } }>(
          "/patients/me",
        );
        setPatients([{ _id: res.data._id, fullName: res.data.fullName }]);
        setPatientId(res.data._id);
      } catch {
        setPatients([]);
      }
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; data: Array<{ _id: string; fullName: string }> }>(
        `/patients`,
      );
      if (Array.isArray(res.data)) {
        setPatients(res.data.map((p) => ({ _id: p._id, fullName: p.fullName })));
        if (res.data.length === 1 && !patientId) setPatientId(res.data[0]._id);
      }
    } catch (e) {
      console.warn("Error cargando pacientes", e);
      setPatients([]);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    await Promise.all([loadFoods(), loadMeals(), loadPatients()]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMeals(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // recarga foods cuando cambian búsqueda o categoría (debounce simple)
  useEffect(() => {
    const t = setTimeout(() => loadFoods(foodSearch, foodCategory), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodSearch, foodCategory]);

  // preview locales (sin hardcodear, usa utils/calculations.ts)
  const previewTotals = useMemo(() => {
    const valid = items
      .filter((i) => i.foodId && i.grams)
      .map((i) => {
        const f = foods.find((x) => x._id === i.foodId);
        if (!f) return null;
        return { ...f, grams: Number(i.grams) };
      })
      .filter(Boolean) as { calories: number; protein: number; carbs: number; fat: number; grams: number }[];
    if (valid.length === 0) return null;
    return calculateMealTotals(valid);
  }, [items, foods]);

  const filteredFoods = useMemo(() => {
    // El filtrado fuerte lo hace el backend (?search + ?category); acá solo
    // se refleja lo recibido para el <select> del formulario y la tabla.
    return foods;
  }, [foods]);

  // Totales diarios y series para gráficos (consumen API, no hardcodeados)
  const dailyTotals = useMemo(() => {
    const map = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
    for (const m of meals) {
      const day = new Date(m.date).toISOString().slice(0, 10);
      const cur = map.get(day) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
      cur.calories += m.totalCalories;
      cur.protein += m.totalProtein;
      cur.carbs += m.totalCarbs;
      cur.fat += m.totalFat;
      map.set(day, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v, dayLabel: day.slice(5) }));
  }, [meals]);

  const macroDistribution = useMemo(() => {
    const total = dailyTotals.reduce(
      (acc, d) => ({
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fat: acc.fat + d.fat,
      }),
      { protein: 0, carbs: 0, fat: 0 },
    );
    const sum = total.protein + total.carbs + total.fat;
    if (sum === 0) return [];
    return [
      { name: "Proteínas", value: Number(total.protein.toFixed(1)), fill: COLORS.protein },
      { name: "Carbohidratos", value: Number(total.carbs.toFixed(1)), fill: COLORS.carbs },
      { name: "Grasas", value: Number(total.fat.toFixed(1)), fill: COLORS.fat },
    ];
  }, [dailyTotals]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const payloadItems = items
      .filter((i) => i.foodId && i.grams)
      .map((i) => ({ food: i.foodId, grams: Number(i.grams) }));
    if (payloadItems.length === 0) {
      setError("Agregá al menos un alimento con gramos");
      return;
    }
    if (!patientId) {
      setError("Seleccioná un paciente");
      return;
    }
    try {
      await apiFetch("/meals", {
        method: "POST",
        body: JSON.stringify({ patient: patientId, date: new Date(date).toISOString(), items: payloadItems }),
      });
      setSuccess("Comida registrada");
      setItems([{ foodId: "", grams: "" }]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function handleDelete(id: string, createdAt: string) {
    if (!canEdit(createdAt, EDIT_WINDOW_MS) && user?.role === "patient") {
      setError("El registro ya no puede modificarse (ventana 10 min)");
      return;
    }
    try {
      await apiFetch(`/meals/${id}`, { method: "DELETE" });
      setMeals((prev) => prev.filter((m) => m._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Comidas</h1>
        <p className="text-sm text-text-light">
          Cantidad flexible, cálculo automático kcal/macros (AGENTS.md: Comidas)
        </p>
      </div>

      {/* Filtros: solo nutricionista (paciente usa su id de sesión) */}
      {isNutritionist && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <label className="text-sm font-medium text-text">Paciente</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="">-- Seleccionar --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {needsPatient ? (
        <Card>
          <CardContent>
            <p className="text-sm text-text-light">
              Seleccioná un paciente para registrar y ver sus comidas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar comida</CardTitle>
          <p className="text-sm text-text-light">
            Cada comida contiene uno o más alimentos. Registrá cantidad en gramos. El sistema calcula calorías,
            proteínas, carbohidratos y grasas automáticamente.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text">Fecha y hora</label>
                <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-text-light bg-background rounded-md px-3 py-2 w-full">
                  {previewTotals ? (
                    <span>
                      Preview: <b>{previewTotals.calories.toFixed(0)} kcal</b> · P {previewTotals.protein.toFixed(1)}g ·
                      C {previewTotals.carbs.toFixed(1)}g · G {previewTotals.fat.toFixed(1)}g
                    </span>
                  ) : (
                    "Agregá alimentos para ver preview"
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text">Alimentos (flexible, sin categorías fijas)</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setItems((prev) => [...prev, { foodId: "", grams: "" }])}
                >
                  + Alimento
                </Button>
              </div>

              {items.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
                  <select
                    value={row.foodId}
                    onChange={(e) =>
                      setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, foodId: e.target.value } : r)))
                    }
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
                    required
                  >
                    <option value="">
                      {foods.length === 0
                        ? loading
                          ? "Cargando alimentos..."
                          : "Sin alimentos — ejecute seed"
                        : "Seleccionar alimento"}
                    </option>
                    {filteredFoods.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} · {f.category} ({f.calories}kcal/100g)
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    placeholder="gramos"
                    value={row.grams}
                    onChange={(e) =>
                      setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, grams: e.target.value } : r)))
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={items.length === 1}
                    aria-label="Quitar"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-error">{error}</p>}
            {success && <p className="text-sm text-primary">{success}</p>}

            <Button type="submit" className="w-full sm:w-auto">
              Guardar comida
            </Button>
            <p className="text-xs text-text-light">
              Totales se calculan en backend (`Meal.totalCalories/Protein/Carbs/Fat`) a partir de `Food` por 100g.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Listado por comida + totales diarios */}
      <Card>
        <CardHeader>
          <CardTitle>Comidas registradas ({meals.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {meals.length === 0 ? (
            <p className="text-sm text-text-light">Sin comidas para el paciente/filtro seleccionado.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-text-light">Fecha</th>
                    <th className="px-3 py-2 text-left font-medium text-text-light">Alimentos</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light">kcal</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light">P</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light">C</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light">G</th>
                    <th className="px-3 py-2 text-right font-medium text-text-light"></th>
                  </tr>
                </thead>
                <tbody>
                  {meals.map((m) => {
                    const editable = canEdit(m.createdAt, EDIT_WINDOW_MS) || user?.role === "nutritionist";
                    return (
                      <tr key={m._id} className="border-t border-border">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(m.date).toLocaleString("es-AR")}
                          {!editable && (
                            <span className="ml-2 text-xs bg-border px-1.5 py-0.5 rounded">bloqueado 10′</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {m.items.map((it) => `${it.food.name} ${it.grams}g`).join(" · ")}
                        </td>
                        <td className="px-3 py-2 text-right">{m.totalCalories.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right">{m.totalProtein.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">{m.totalCarbs.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">{m.totalFat.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(m._id, m.createdAt)}
                            disabled={!editable}
                            title={editable ? "Eliminar" : "Fuera de ventana 10 min (paciente)"}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {dailyTotals.length > 0 && (
            <div className="rounded-lg bg-background p-3">
              <p className="text-sm font-medium text-text mb-2">Totales diarios</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-light">
                      <th className="text-left font-medium px-2 py-1">Día</th>
                      <th className="text-right font-medium px-2 py-1">kcal</th>
                      <th className="text-right font-medium px-2 py-1">P</th>
                      <th className="text-right font-medium px-2 py-1">C</th>
                      <th className="text-right font-medium px-2 py-1">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTotals.map((d) => (
                      <tr key={d.day} className="border-t border-border">
                        <td className="px-2 py-1">{d.day}</td>
                        <td className="px-2 py-1 text-right">{d.calories.toFixed(0)}</td>
                        <td className="px-2 py-1 text-right">{d.protein.toFixed(1)}</td>
                        <td className="px-2 py-1 text-right">{d.carbs.toFixed(1)}</td>
                        <td className="px-2 py-1 text-right">{d.fat.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos - consumen API, no hardcodeados */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Distribución de macronutrientes (período)">
          <div className="h-64">
            {macroDistribution.length === 0 ? (
              <p className="text-sm text-text-light h-full flex items-center justify-center">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} ${value}g`}
                  >
                    {macroDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-text-light mt-2">Suma de P/C/G del período filtrado.</p>
        </ChartCard>

        <ChartCard title="Evolución de calorías (por día)">
          <div className="h-64">
            {dailyTotals.length === 0 ? (
              <p className="text-sm text-text-light h-full flex items-center justify-center">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTotals}>
                  <XAxis dataKey="dayLabel" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calories" stroke="#4CAF50" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Evolución de macronutrientes (por día)">
          <div className="h-64">
            {dailyTotals.length === 0 ? (
              <p className="text-sm text-text-light h-full flex items-center justify-center">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTotals}>
                  <XAxis dataKey="dayLabel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="protein" name="Proteínas" fill={COLORS.protein} />
                  <Bar dataKey="carbs" name="Carbohidratos" fill={COLORS.carbs} />
                  <Bar dataKey="fat" name="Grasas" fill={COLORS.fat} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

          <p className="text-xs text-text-light">
            Gráficos consumen `GET /api/meals` y `GET /api/foods`. Totales diarios y distribución calculados en frontend
            desde datos API; totales por comida vienen ya calculados de backend (`totalCalories/Protein/Carbs/Fat`).
          </p>
        </>
      )}

      {/* Base de alimentos: sección independiente, siempre visible
          (no requiere paciente: GET /foods es global). Colapsada por defecto
          y con tabla solo a partir de 2 letras para acotar crecimiento. */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>Base de alimentos</CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFoodsOpen((v) => !v)}
            >
              {foodsOpen ? "Ocultar" : "Consultar alimentos"}
            </Button>
          </div>
          {!foodsOpen && (
            <p className="text-sm text-text-light">
              Consultá la tabla de alimentos disponibles para armar la comida.
            </p>
          )}
        </CardHeader>
        {foodsOpen && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text">Buscar alimento</label>
                <Input
                  placeholder="Ej: pollo, arroz... (mín. 2 letras)"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                />
                <p className="text-xs text-text-light mt-1">
                  {loading
                    ? "Cargando..."
                    : `${filteredFoods.length} alimentos${foodCategory ? ` en ${foodCategory}` : ""}${foodSearch ? ` para "${foodSearch}"` : ""} (máx. 200)`}
                  {foods.length === 0 &&
                    !loading &&
                    " — verifique /api/foods y seed en backend"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={foodCategory === "" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setFoodCategory("");
                  setFoodSearch("");
                }}
              >
                Todos
              </Button>
              {FOOD_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={foodCategory === cat ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setFoodCategory((c) => (c === cat ? "" : cat))}
                >
                  {cat}
                </Button>
              ))}
            </div>
            {filteredFoods.length === 0 ? (
              <p className="text-sm text-text-light">Sin alimentos para la búsqueda.</p>
            ) : (
              <div className="overflow-auto max-h-96 rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-background sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-text-light">Alimento</th>
                      <th className="px-3 py-2 text-left font-medium text-text-light">Categoría</th>
                      <th className="px-3 py-2 text-right font-medium text-text-light">kcal/100g</th>
                      <th className="px-3 py-2 text-right font-medium text-text-light">P</th>
                      <th className="px-3 py-2 text-right font-medium text-text-light">C</th>
                      <th className="px-3 py-2 text-right font-medium text-text-light">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFoods.map((f) => (
                      <tr key={f._id} className="border-t border-border">
                        <td className="px-3 py-2">{f.name}</td>
                        <td className="px-3 py-2 text-text-light">{f.category}</td>
                        <td className="px-3 py-2 text-right">{f.calories}</td>
                        <td className="px-3 py-2 text-right">{f.protein}</td>
                        <td className="px-3 py-2 text-right">{f.carbs}</td>
                        <td className="px-3 py-2 text-right">{f.fat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
