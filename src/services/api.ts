import { API_URL } from "../utils/constants";

type ApiError = { success: false; message: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Token vencido o usuario dado de baja: cerrar la sesión (excepto en el login,
    // donde un 401 solo significa "credenciales inválidas")
    if (res.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/login");
    }
    throw new Error((data as ApiError).message ?? "Error en la petición");
  }
  return data as T;
}