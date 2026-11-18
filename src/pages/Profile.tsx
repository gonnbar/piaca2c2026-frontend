import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Info } from "../components/ui/Info";
import { ChangePasswordForm } from "../components/profile/ChangePasswordForm";
import { MyPatientData } from "../components/profile/MyPatientData";

const ROLE_LABEL = { nutritionist: "Nutricionista", patient: "Paciente" } as const;

export function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-text">Mi perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Mi cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Nombre" value={user.name} />
            <Info label="Email" value={user.email} />
            <Info label="Rol" value={ROLE_LABEL[user.role]} />
          </dl>
        </CardContent>
      </Card>

      {user.role === "patient" && <MyPatientData />}

      <ChangePasswordForm />
    </div>
  );
}