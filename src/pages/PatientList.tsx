import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { listPatients } from "../services/patients";
import { conditionLabel } from "../utils/conditions";
import type { Patient } from "../types";

export function PatientList() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listPatients(q);
        if (!cancelled) setPatients(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar pacientes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300); // espera 300 ms tras dejar de tipear para no pedir en cada letra
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text">Pacientes</h1>
        <Button onClick={() => navigate("/patients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
        <Input
          type="search"
          className="pl-9"
          placeholder="Buscar por nombre o DNI"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Card>
        <CardContent>
          {loading ? (
            <p className="text-sm text-text-light">Cargando…</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-text-light">
              {q ? "No hay pacientes que coincidan con la búsqueda." : "Todavía no tenés pacientes cargados."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-text-light">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">DNI</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 font-medium">Condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr
                      key={p._id}
                      className="cursor-pointer border-t border-border hover:bg-background"
                      onClick={() => navigate(`/patients/${p._id}`)}
                    >
                      <td className="py-3 pr-4 font-medium text-text">{p.fullName}</td>
                      <td className="py-3 pr-4 text-text-light">{p.dni ?? "—"}</td>
                      <td className="py-3 pr-4 text-text-light">{p.user?.email}</td>
                      <td className="py-3 text-text-light">
                        {p.conditions.length ? p.conditions.map(conditionLabel).join(", ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}