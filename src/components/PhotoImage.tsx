import { useEffect, useState } from "react";
import { fetchPhotoBlob } from "../services/photos";
import type { Photo } from "../types";

type Props = {
  photo: Photo;
  alt: string;
  className?: string;
};

export function PhotoImage({ photo, alt, className = "" }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    fetchPhotoBlob(photo._id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo._id, photo.updatedAt, photo.filename]);

  if (loading) {
    return (
      <div
        className={`animate-pulse rounded-md bg-border ${className}`}
        aria-label="Cargando imagen"
      />
    );
  }

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-border bg-background text-xs text-text-light ${className}`}
      >
        No se pudo cargar
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
