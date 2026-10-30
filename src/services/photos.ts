import { apiFetch, apiFetchBlob } from "./api";
import type { Photo, PhotoView } from "../types";

type PhotoResponse = { success: boolean; data: Photo };
type PhotoListResponse = { success: boolean; data: Photo[] };

export async function listPhotos(patientId?: string): Promise<Photo[]> {
  const query = patientId ? `?patient=${encodeURIComponent(patientId)}` : "";
  const res = await apiFetch<PhotoListResponse>(`/photos${query}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function uploadPhoto(input: {
  file: File;
  view: PhotoView;
  date: string;
  notes?: string;
  patientId?: string;
}): Promise<Photo> {
  const form = new FormData();
  form.append("image", input.file);
  form.append("view", input.view);
  form.append("date", input.date);
  if (input.notes) form.append("notes", input.notes);
  if (input.patientId) form.append("patient", input.patientId);
  const res = await apiFetch<PhotoResponse>("/photos", { method: "POST", body: form });
  return res.data;
}

export async function replacePhoto(input: {
  id: string;
  file: File;
  notes?: string;
}): Promise<Photo> {
  const form = new FormData();
  form.append("image", input.file);
  if (input.notes !== undefined) form.append("notes", input.notes);
  const res = await apiFetch<PhotoResponse>(`/photos/${input.id}`, {
    method: "PUT",
    body: form,
  });
  return res.data;
}

export async function deletePhoto(id: string): Promise<void> {
  await apiFetch<{ success: boolean; message: string }>(`/photos/${id}`, {
    method: "DELETE",
  });
}

export async function fetchPhotoBlob(id: string): Promise<Blob> {
  return apiFetchBlob(`/photos/${id}/file`);
}
