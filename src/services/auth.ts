import { apiFetch } from "./api";

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiFetch<{ success: true; message: string }>("/auth/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}