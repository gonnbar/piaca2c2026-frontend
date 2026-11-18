import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatDate } from "../../utils/format";
import type { Consultation } from "../../types";

export function WeightChart({ consultations }: { consultations: Consultation[] }) {
  const points = consultations
    .filter((c) => c.measurement?.weight != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((c) => ({ date: formatDate(c.date), peso: c.measurement!.weight as number }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de peso</CardTitle>
      </CardHeader>
      <CardContent>
        {points.length < 2 ? (
          <p className="text-sm text-text-light">
            El gráfico aparece cuando hay al menos dos consultas con peso registrado.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12 }} unit=" kg" width={56} />
                <Tooltip formatter={(value) => `${value} kg`} />
                <Line type="monotone" dataKey="peso" name="Peso" stroke="#4CAF50" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}