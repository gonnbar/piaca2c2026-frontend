import { API_URL } from "../utils/constants";

type ApiError = { success: false; message: string };

function authHeaders(options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function handleUnauthorized(status: number, path: string) {
  // Token vencido o usuario dado de baja: cerrar la sesión (excepto en el login,
  // donde un 401 solo significa "credenciales inválidas")
  if (status === 401 && path !== "/auth/login") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/login");
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders(options),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    handleUnauthorized(res.status, path);
    throw new Error((data as ApiError).message ?? "Error en la petición");
  }
  return data as T;
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    handleUnauthorized(res.status, path);
    throw new Error("No se pudo cargar la imagen");
  }
  return res.blob();
}
