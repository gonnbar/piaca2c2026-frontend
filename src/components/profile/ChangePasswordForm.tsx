import { useState } from "react";
import { Check, KeyRound } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { changePassword } from "../../services/auth";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next.length < 6) return setError("La nueva contraseña debe tener al menos 6 caracteres");
    if (next !== confirm) return setError("Las contraseñas nuevas no coinciden");
    if (next === current) return setError("La nueva contraseña debe ser distinta de la actual");

    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Contraseña actual" htmlFor="currentPassword">
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nueva contraseña" htmlFor="newPassword">
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Repetir nueva contraseña" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </FormField>
          </div>

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-primary-dark">
              <Check className="h-4 w-4" aria-hidden="true" />
              Contraseña actualizada
            </p>
          )}

          <Button type="submit" disabled={saving}>
            <KeyRound className="mr-2 h-4 w-4" />
            {saving ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}