"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import styles from "@/components/properties/unit-archive-button.module.css";

type PersonArchiveButtonProps = {
  personId: string;
  personName: string;
  archived: boolean;
};

export function PersonArchiveButton({
  personId,
  personName,
  archived,
}: PersonArchiveButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleArchived() {
    const confirmed = window.confirm(
      archived
        ? `¿Restaurar a ${personName}? Volverá al directorio activo.`
        : `¿Archivar a ${personName}? Dejará de aparecer en el directorio activo.`,
    );
    if (!confirmed) return;

    setError(null);
    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(`/api/people/${encodeURIComponent(personId)}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ archived: !archived }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          parsedBody.success ? parsedBody.data.error : "No se pudo actualizar el registro.",
        );
      }

      router.refresh();
      setBusy(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el registro.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div>
        <h2>{archived ? "Restaurar registro" : "Archivar registro"}</h2>
        <p>
          {archived
            ? "El registro volverá al directorio activo. Si otro registro activo del mismo tipo usa el mismo correo, no podrá restaurarse."
            : "El registro se conserva en el historial y libera su correo para otro registro. No se elimina de forma permanente."}
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
