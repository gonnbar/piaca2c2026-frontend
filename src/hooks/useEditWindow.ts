import { canEdit } from "../utils/calculations";
import { EDIT_WINDOW_MS } from "../utils/constants";

/** Hook para reflejar visualmente si un registro aún es editable (10 min) */
export function useEditWindow(createdAt: string | Date) {
  return canEdit(createdAt, EDIT_WINDOW_MS);
}
