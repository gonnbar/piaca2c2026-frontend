export function formatDate(iso?: string) {
  if (!iso) return "";
  // timeZone UTC: el backend guarda la fecha a medianoche UTC y, sin esto, podría mostrarse el día anterior
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC" });
}