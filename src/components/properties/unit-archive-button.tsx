"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import styles from "./unit-archive-button.module.css";

type UnitArchiveButtonProps = {
  propertyId: string;
  unitId: string;
  unitLabel: string;
  archived: boolean;
};

export function UnitArchiveButton({
  propertyId,
  unitId,
  unitLabel,
  archived,
}: UnitArchiveButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleArchived() {
    const confirmed = window.confirm(
      archived
        ? `¿Restaurar la unidad ${unitLabel}? Volverá a contar en la ocupación.`
        : `¿Archivar la unidad ${unitLabel}? Dejará de contar en la ocupación de la propiedad.`,
    );
    if (!confirmed) return;

    setError(null);
    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(
        `/api/properties/${encodeURIComponent(propertyId)}/units/${encodeURIComponent(unitId)}/archive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({ archived: !archived }),
        },
      );

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          parsedBody.success ? parsedBody.data.error : "No se pudo actualizar la unidad.",
        );
      }

      router.replace(`/admin/properties/${encodeURIComponent(propertyId)}?tab=units`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la unidad.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div>
        <h2>{archived ? "Restaurar unidad" : "Archivar unidad"}</h2>
        <p>
          {archived
            ? "La unidad volverá a la lista activa y a los indicadores de ocupación."
            : "La unidad se conserva en el historial, pero deja de contar en la ocupación. Las unidades ocupadas no pueden archivarse."}
        </p>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <button
        className={archived ? styles.restore : styles.archive}
        disabled={busy}
        onClick={toggleArchived}
        type="button"
      >
        {busy ? "Procesando…" : archived ? "Restaurar" : "Archivar"}
      </button>
    </div>
  );
}
