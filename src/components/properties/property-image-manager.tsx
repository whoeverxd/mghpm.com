"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ImagePlus,
  Star,
  Trash2,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import {
  getPropertyImageUrl,
  MAX_PROPERTY_IMAGE_BYTES,
  MAX_PROPERTY_IMAGES,
  propertyImageContentTypes,
} from "@/lib/properties/image-schema";
import styles from "./property-image-manager.module.css";

export type ManagedPropertyImage = {
  id: string;
  originalName: string;
  width: number;
  height: number;
};

type PropertyImageManagerProps = {
  propertyId: string;
  images: ManagedPropertyImage[];
  coverImageId: string | null;
  /** False hides upload, delete, reorder and cover controls (view-only roles). */
  canEdit?: boolean;
};

const errorBodySchema = z.object({ error: z.string() });

async function readError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  const parsed = errorBodySchema.safeParse(body);
  return parsed.success ? parsed.data.error : fallback;
}

export function PropertyImageManager({
  propertyId,
  images,
  coverImageId,
  canEdit = true,
}: PropertyImageManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const baseUrl = `/api/properties/${encodeURIComponent(propertyId)}/images`;
  const remaining = MAX_PROPERTY_IMAGES - images.length;

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const nextErrors: string[] = [];
    const accepted = files.filter((file) => {
      if (
        !(propertyImageContentTypes as readonly string[]).includes(file.type)
      ) {
        nextErrors.push(`${file.name}: solo se aceptan JPG, PNG o WebP.`);
        return false;
      }
      if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
        nextErrors.push(`${file.name}: supera el máximo de 10 MB.`);
        return false;
      }
      return true;
    });
    if (accepted.length > remaining) {
      nextErrors.push(
        `Solo caben ${remaining} imágenes más; se omitieron ${accepted.length - remaining}.`,
      );
      accepted.splice(remaining);
    }

    setBusy(true);
    setErrors(nextErrors);
    let uploaded = 0;
    for (const [index, file] of accepted.entries()) {
      setProgress(`Subiendo ${index + 1} de ${accepted.length}: ${file.name}`);
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(baseUrl, {
          method: "POST",
          headers: { "X-CSRF-Token": await requestCsrfToken() },
          body,
        });
        if (!response.ok) {
          nextErrors.push(
            `${file.name}: ${await readError(response, "no se pudo subir.")}`,
          );
        } else {
          uploaded += 1;
        }
      } catch {
        nextErrors.push(`${file.name}: no se pudo subir. Revisa tu conexión.`);
      }
    }

    setErrors([...nextErrors]);
    setProgress(null);
    setBusy(false);
    if (uploaded > 0) router.refresh();
  }

  async function mutate(request: () => Promise<Response>, fallback: string) {
    setBusy(true);
    setErrors([]);
    try {
      const response = await request();
      if (!response.ok) setErrors([await readError(response, fallback)]);
      else router.refresh();
    } catch {
      setErrors([fallback]);
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: { coverImageId?: string; order?: string[] }) {
    const csrfToken = await requestCsrfToken();
    return fetch(baseUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(body),
    });
  }

  function move(index: number, offset: -1 | 1) {
    const order = images.map((image) => image.id);
    [order[index], order[index + offset]] = [
      order[index + offset],
      order[index],
    ];
    void mutate(() => patch({ order }), "No se pudo reordenar la galería.");
  }

  function remove(image: ManagedPropertyImage) {
    if (
      !window.confirm(
        `¿Eliminar "${image.originalName || "esta imagen"}"? No se puede deshacer.`,
      )
    ) {
      return;
    }
    void mutate(async () => {
      const csrfToken = await requestCsrfToken();
      return fetch(`${baseUrl}/${encodeURIComponent(image.id)}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
      });
    }, "No se pudo eliminar la imagen.");
  }

  return (
    <div className={styles.manager}>
      <div className={styles.toolbar}>
        <p>
          {images.length} de {MAX_PROPERTY_IMAGES} imágenes · JPG, PNG o WebP de
          hasta 10 MB. La principal se usa como portada.
        </p>
        {canEdit && (
          <>
            <input
              accept={propertyImageContentTypes.join(",")}
              className={styles.fileInput}
              disabled={busy || remaining <= 0}
              multiple
              onChange={(event) => void upload(event)}
              ref={inputRef}
              type="file"
            />
            <button
              className={styles.uploadButton}
              disabled={busy || remaining <= 0}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              <ImagePlus aria-hidden="true" size={16} />
              Subir imágenes
            </button>
          </>
        )}
      </div>

      {progress && (
        <p aria-live="polite" className={styles.progress}>
          {progress}
        </p>
      )}
      {errors.length > 0 && (
        <ul className={styles.errors} role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {images.length === 0 && !canEdit ? (
        <p className={styles.progress}>Aún no hay imágenes.</p>
      ) : images.length === 0 ? (
        <button
          className={styles.empty}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={28} />
          <strong>Aún no hay imágenes</strong>
          <span>Sube fotos de la fachada, áreas comunes y unidades.</span>
        </button>
      ) : (
        <ul className={styles.grid}>
          {images.map((image, index) => {
            const isCover = image.id === coverImageId;
            return (
              <li
                className={styles.item}
                data-cover={isCover || undefined}
                key={image.id}
              >
                <a
                  className={styles.thumbLink}
                  href={getPropertyImageUrl(propertyId, image.id, "original")}
                  rel="noopener"
                  target="_blank"
                >
                  {/* Private images come from an authenticated route; next/image cannot fetch them. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={image.originalName || `Imagen ${index + 1}`}
                    height={480}
                    loading="lazy"
                    src={getPropertyImageUrl(propertyId, image.id, "thumbnail")}
                    width={640}
                  />
                  {isCover && (
                    <span className={styles.coverBadge}>
                      <Star aria-hidden="true" size={12} />
                      Principal
                    </span>
                  )}
                  <span className={styles.openHint}>
                    <ExternalLink aria-hidden="true" size={13} />
                  </span>
                </a>
                <div className={styles.meta}>
                  <span title={image.originalName}>
                    {image.originalName || `Imagen ${index + 1}`}
                  </span>
                  <small>
                    {image.width} × {image.height}
                  </small>
                </div>
                {canEdit && (
                  <div className={styles.actions}>
                    <button
                      aria-label="Mover antes"
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                      title="Mover antes"
                      type="button"
                    >
                      <ArrowLeft aria-hidden="true" size={15} />
                    </button>
                    <button
                      aria-label="Mover después"
                      disabled={busy || index === images.length - 1}
                      onClick={() => move(index, 1)}
                      title="Mover después"
                      type="button"
                    >
                      <ArrowRight aria-hidden="true" size={15} />
                    </button>
                    <button
                      className={styles.textAction}
                      disabled={busy || isCover}
                      onClick={() =>
                        void mutate(
                          () => patch({ coverImageId: image.id }),
                          "No se pudo cambiar la imagen principal.",
                        )
                      }
                      type="button"
                    >
                      {isCover ? "Principal" : "Hacer principal"}
                    </button>
                    <button
                      aria-label="Eliminar imagen"
                      className={styles.danger}
                      disabled={busy}
                      onClick={() => remove(image)}
                      title="Eliminar"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
