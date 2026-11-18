import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { PhotoImage } from "../components/PhotoImage";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../services/api";
import {
  deletePhoto,
  listPhotos,
  replacePhoto,
  uploadPhoto,
} from "../services/photos";
import type { Photo, PhotoView } from "../types";
import { canEdit } from "../utils/calculations";
import { EDIT_WINDOW_MS } from "../utils/constants";

const VIEWS: { key: PhotoView; label: string }[] = [
  { key: "frente", label: "Frente" },
  { key: "perfil", label: "Perfil / costado" },
  { key: "espalda", label: "Espalda" },
];

const VIEW_LABELS: Record<PhotoView, string> = {
  frente: "Frente",
  perfil: "Perfil / costado",
  espalda: "Espalda",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const EMPTY_FILES: Record<PhotoView, File | null> = {
  frente: null,
  perfil: null,
  espalda: null,
};

type PatientOpt = { _id: string; fullName: string };
type DayGroup = { day: string; photos: Partial<Record<PhotoView, Photo>> };

function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext) || (file.type && !file.type.startsWith("image/"))) {
    return "Formato no permitido. Usá JPG, PNG o WebP.";
  }
  if (file.size > MAX_FILE_SIZE) return "La imagen supera los 5 MB.";
  return null;
}

function todayInputValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function formatDay(day: string) {
  return new Date(`${day}T00:00:00.000Z`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error en la petición";
}

function PhotoUploadSlot({
  label,
  file,
  existing,
  disabled,
  onFileChange,
}: {
  label: string;
  file: File | null;
  existing?: Photo;
  disabled: boolean;
  onFileChange: (file: File | null) => boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function applyFile(nextFile: File | null) {
    if (!onFileChange(nextFile)) return;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = nextFile ? URL.createObjectURL(nextFile) : null;
    setPreview(previewRef.current);
  }

  useEffect(() => {
    if (!file && previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text">{label}</p>
        {existing && <Badge>{file ? "Reemplazo" : "Cargada"}</Badge>}
        {!existing && file && <Badge>Nueva</Badge>}
      </div>

      <div className="aspect-[3/4] overflow-hidden rounded-md border border-border bg-background">
        {file && preview ? (
          <img
            src={preview}
            alt={`Vista previa de ${label}`}
            className="h-full w-full object-contain"
          />
        ) : existing ? (
          <PhotoImage
            key={`${existing._id}-${existing.updatedAt}`}
            photo={existing}
            alt={label}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-light">
            Sin foto
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const nextFile = e.target.files?.[0] ?? null;
          e.target.value = "";
          applyFile(nextFile);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {existing ? "Reemplazar" : "Seleccionar"}
        </Button>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFile(null)}
          >
            Quitar
          </Button>
        )}
      </div>

      {disabled && (
        <p className="text-xs text-error">Fuera de la ventana de 10 minutos.</p>
      )}
    </div>
  );
}

export function Photos() {
  const { user } = useAuth();
  const isNutritionist = user?.role === "nutritionist";

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [date, setDate] = useState(todayInputValue);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<Record<PhotoView, File | null>>({
    ...EMPTY_FILES,
  });
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  async function loadPatients(): Promise<string> {
    if (!isNutritionist) {
      try {
        const res = await apiFetch<{
          success: boolean;
          data: { _id: string; fullName: string };
        }>("/patients/me");
        setPatients([{ _id: res.data._id, fullName: res.data.fullName }]);
        setPatientId(res.data._id);
        return res.data._id;
      } catch {
        setPatients([]);
        return "";
      }
    }

    try {
      const res = await apiFetch<{
        success: boolean;
        data: Array<{ _id: string; fullName: string }>;
      }>("/patients");
      if (Array.isArray(res.data)) {
        const options = res.data.map((p) => ({ _id: p._id, fullName: p.fullName }));
        setPatients(options);
        const next = patientId || (options.length === 1 ? options[0]._id : "");
        if (next) setPatientId(next);
        return next;
      }
    } catch {
      setPatients([]);
    }
    return patientId;
  }

  async function loadPhotos(pid = patientId) {
    if (isNutritionist && !pid) {
      setPhotos([]);
      return;
    }
    setLoadingPhotos(true);
    try {
      const data = await listPhotos(isNutritionist ? pid : undefined);
      setPhotos(data);
    } catch (e) {
      setError(getErrorMessage(e));
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    const pid = await loadPatients();
    await loadPhotos(pid);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, DayGroup>();
    for (const photo of photos) {
      const day = photo.date.slice(0, 10);
      const group = map.get(day) ?? { day, photos: {} };
      const current = group.photos[photo.view];
      if (
        !current ||
        new Date(photo.createdAt).getTime() >= new Date(current.createdAt).getTime()
      ) {
        group.photos[photo.view] = photo;
      }
      map.set(day, group);
    }
    return Array.from(map.values()).sort((a, b) => b.day.localeCompare(a.day));
  }, [photos]);

  const existingByView = useMemo(
    () => groups.find((group) => group.day === date)?.photos ?? {},
    [groups, date],
  );

  function handlePatientChange(e: ChangeEvent<HTMLSelectElement>) {
    const pid = e.target.value;
    setPatientId(pid);
    setError("");
    setSuccess("");
    setLightbox(null);
    setFiles({ ...EMPTY_FILES });
    loadPhotos(pid);
  }

  function handleDateChange(e: ChangeEvent<HTMLInputElement>) {
    setDate(e.target.value);
    setFiles({ ...EMPTY_FILES });
    setError("");
    setSuccess("");
  }

  function handleFileChange(view: PhotoView, file: File | null): boolean {
    setError("");
    setSuccess("");
    if (!file) {
      setFiles((prev) => ({ ...prev, [view]: null }));
      return true;
    }
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return false;
    }
    setFiles((prev) => ({ ...prev, [view]: file }));
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isNutritionist) {
      setError("Solo el paciente puede subir fotografías");
      return;
    }
    if (!date) {
      setError("Seleccioná una fecha");
      return;
    }

    const selected = VIEWS.filter(({ key }) => files[key]);
    if (selected.length === 0) {
      setError("Seleccioná al menos una foto");
      return;
    }

    const blocked = selected.filter(({ key }) => {
      const existing = existingByView[key];
      return existing && !canEdit(existing.createdAt, EDIT_WINDOW_MS);
    });
    if (blocked.length > 0) {
      setError(
        `No se puede reemplazar ${blocked
          .map(({ label }) => label.toLowerCase())
          .join(", ")}: pasaron más de 10 minutos.`,
      );
      return;
    }

    setSubmitting(true);
    const isoDate = new Date(`${date}T00:00:00.000Z`).toISOString();
    const results = await Promise.allSettled(
      selected.map(({ key }) => {
        const file = files[key]!;
        const existing = existingByView[key];
        if (existing) {
          return replacePhoto({ id: existing._id, file, notes });
        }
        return uploadPhoto({ file, view: key, date: isoDate, notes });
      }),
    );

    const failedViews = new Set<PhotoView>();
    const messages: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const view = selected[index].key;
        failedViews.add(view);
        messages.push(`${VIEW_LABELS[view]}: ${getErrorMessage(result.reason)}`);
      }
    });

    setFiles((prev) => {
      const next = { ...prev };
      selected.forEach(({ key }) => {
        if (!failedViews.has(key)) next[key] = null;
      });
      return next;
    });

    if (failedViews.size > 0) {
      setError(messages.join(" "));
    } else {
      setSuccess("Fotografías guardadas");
      setNotes("");
    }

    await loadPhotos(patientId);
    setSubmitting(false);
  }

  async function handleDelete(photo: Photo) {
    const editable = isNutritionist || canEdit(photo.createdAt, EDIT_WINDOW_MS);
    if (!editable) {
      setError("La foto ya no puede eliminarse");
      return;
    }
    if (!window.confirm(`¿Eliminar la foto de ${VIEW_LABELS[photo.view].toLowerCase()}?`)) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await deletePhoto(photo._id);
      if (lightbox?._id === photo._id) setLightbox(null);
      setSuccess("Foto eliminada");
      await loadPhotos(patientId);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  if (loading) {
    return <p className="text-sm text-text-light">Cargando fotografías...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Fotografías</h1>
          <p className="text-sm text-text-light">
            Evolución de frente, perfil/costado y espalda.
          </p>
        </div>

        {isNutritionist && (
          <div className="w-full lg:w-72">
            <FormField label="Paciente">
              <Select value={patientId} onChange={handlePatientChange}>
                <option value="">Seleccioná un paciente</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.fullName}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-primary">
          {success}
        </p>
      )}

      {!isNutritionist && (
        <Card>
          <CardHeader>
            <CardTitle>Subir fotografías</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Fecha">
                  <Input
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    required
                  />
                </FormField>
                <FormField label="Nota opcional">
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: inicio de etapa"
                    maxLength={1000}
                  />
                </FormField>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {VIEWS.map(({ key, label }) => {
                  const existing = existingByView[key];
                  const disabled = Boolean(
                    existing && !canEdit(existing.createdAt, EDIT_WINDOW_MS),
                  );
                  return (
                    <PhotoUploadSlot
                      key={key}
                      label={label}
                      file={files[key]}
                      existing={existing}
                      disabled={disabled}
                      onFileChange={(file) => handleFileChange(key, file)}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar fotos"}
                </Button>
                <p className="text-xs text-text-light">
                  Si ya existe una foto de esa vista y fecha, se reemplaza dentro
                  de los 10 minutos.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Historial{!isNutritionist || patientId ? ` (${photos.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isNutritionist && !patientId ? (
            <p className="text-sm text-text-light">
              Seleccioná un paciente para ver sus fotografías.
            </p>
          ) : loadingPhotos ? (
            <p className="text-sm text-text-light">Cargando...</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-text-light">
              Todavía no hay fotografías registradas.
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => {
                const count = Object.keys(group.photos).length;
                return (
                  <div key={group.day} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium text-text">{formatDay(group.day)}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          count === 3
                            ? "bg-primary-light/20 text-primary-dark"
                            : "bg-border text-text-light"
                        }`}
                      >
                        {count}/3
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {VIEWS.map(({ key, label }) => {
                        const photo = group.photos[key];
                        const editable =
                          isNutritionist ||
                          Boolean(photo && canEdit(photo.createdAt, EDIT_WINDOW_MS));
                        return (
                          <div
                            key={key}
                            className="space-y-2 rounded-lg border border-border p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-text">
                                {label}
                              </span>
                              {photo && <Badge>Cargada</Badge>}
                            </div>

                            {photo ? (
                              <button
                                type="button"
                                onClick={() => setLightbox(photo)}
                                className="block aspect-[3/4] w-full overflow-hidden rounded-md border border-border bg-background"
                                title="Ampliar"
                              >
                                <PhotoImage
                                  key={`${photo._id}-${photo.updatedAt}`}
                                  photo={photo}
                                  alt={`${label} del ${formatDay(group.day)}`}
                                  className="h-full w-full object-contain"
                                />
                              </button>
                            ) : (
                              <div className="flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-border bg-background text-xs text-text-light">
                                Falta
                              </div>
                            )}

                            {photo && (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setLightbox(photo)}
                                >
                                  Ampliar
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(photo)}
                                  disabled={!editable}
                                  title={
                                    editable
                                      ? "Eliminar"
                                      : "Fuera de la ventana de 10 minutos"
                                  }
                                >
                                  Eliminar
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={
          lightbox
            ? `${VIEW_LABELS[lightbox.view]} — ${formatDay(lightbox.date.slice(0, 10))}`
            : undefined
        }
        maxWidthClass="max-w-4xl"
      >
        {lightbox && (
          <div className="space-y-3">
            <PhotoImage
              key={`${lightbox._id}-${lightbox.updatedAt}`}
              photo={lightbox}
              alt={VIEW_LABELS[lightbox.view]}
              className="min-h-40 max-h-[60dvh] w-full rounded-md bg-background object-contain sm:max-h-[70vh]"
            />
            {lightbox.notes && (
              <p className="whitespace-pre-wrap text-sm text-text-light">
                {lightbox.notes}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
