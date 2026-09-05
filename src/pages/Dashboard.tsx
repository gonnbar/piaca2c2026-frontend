import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ChartCard } from "../components/ui/ChartCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockWeight = [
  { date: "01/05", peso: 78 },
  { date: "08/05", peso: 77.2 },
  { date: "15/05", peso: 76.5 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">—</p>
            <p className="text-sm text-text-light">Conectado a API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-light">Frontend operativo. Conecte el backend en VITE_API_URL.</p>
          </CardContent>
        </Card>
      </div>

      <ChartCard title="Evolución de peso (ejemplo)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockWeight}>
              <XAxis dataKey="date" />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip />
              <Line type="monotone" dataKey="peso" stroke="#4CAF50" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-text-light mt-2">
          Datos de ejemplo. En producción consume /api/measurements.
        </p>
      </ChartCard>
    </div>
  );
}
