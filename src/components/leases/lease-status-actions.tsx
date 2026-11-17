"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import type { LeaseStatus } from "@/lib/leases/schema";
import formStyles from "@/components/properties/property-form.module.css";
import styles from "@/components/properties/unit-archive-button.module.css";
import leaseStyles from "./leases.module.css";

type LeaseStatusActionsProps = {
  leaseId: string;
  leaseCode: string;
  status: LeaseStatus;
  /** Whether the end date has passed in the organization's time zone. */
  ended: boolean;
  today: string;
};

type Panel = "terminate" | "cancel" | null;

export function LeaseStatusActions({
  leaseId,
  leaseCode,
  status,
  ended,
  today,
}: LeaseStatusActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);

  async function send(body: Record<string, string>) {
    setError(null);
    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(`/api/leases/${encodeURIComponent(leaseId)}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const responseBody: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(responseBody);
        throw new Error(
          parsedBody.success ? parsedBody.data.error : "No se pudo actualizar el contrato.",
        );
      }

      setPanel(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el contrato.");
    } finally {
      setBusy(false);
    }
  }

  function activate() {
    const confirmed = window.confirm(
      `¿Activar el contrato ${leaseCode}? La unidad pasará a ocupada y el inquilino quedará activo en ella.`,
    );
    if (confirmed) void send({ action: "activate" });
  }

  function expire() {
    const confirmed = window.confirm(
      `¿Marcar ${leaseCode} como vencido? La unidad quedará disponible.`,
    );
    if (confirmed) void send({ action: "expire" });
  }

  function submitPanel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason) {
      setError("Indica el motivo.");
      return;
    }
    if (panel === "terminate") {
      void send({
        action: "terminate",
        reason,
        effectiveDate: String(formData.get("effectiveDate") ?? ""),
      });
    } else {
      void send({ action: "cancel", reason });
    }
  }

  if (status !== "draft" && status !== "pending" && status !== "active") return null;

  return (
    <section className={styles.wrapper} aria-label="Acciones del contrato">
      <div>
        <h2>
          {status === "active"
            ? "Cerrar contrato"
            : status === "pending"
              ? "Activar contrato"
              : "Completar borrador"}
        </h2>
        <p>
          {status === "active"
            ? "Terminar o vencer el contrato libera la unidad y marca al inquilino como mudado. Queda registrado en la auditoría."
            : status === "pending"
              ? "Activa el contrato cuando esté firmado. La unidad pasará a ocupada; mientras esté activo no podrá marcarse disponible a mano."
              : "Edita el borrador y usa “Crear contrato” para dejarlo pendiente de activación."}
        </p>
        {panel && (
          <form className={`${formStyles.fields} ${leaseStyles.panelForm}`} onSubmit={submitPanel}>
            {panel === "terminate" && (
              <label className={formStyles.field}>
                <span>Fecha efectiva *</span>
                <input
                  defaultValue={today}
                  max={today}
                  name="effectiveDate"
                  required
                  type="date"
                />
              </label>
            )}
            <label className={`${formStyles.field} ${formStyles.wideField}`}>
              <span>Motivo *</span>
              <input maxLength={500} name="reason" required />
            </label>
            <div className={`${formStyles.actions} ${formStyles.wideField}`}>
              <button className={formStyles.cancel} onClick={() => setPanel(null)} type="button">
                Volver
              </button>
              <button className={styles.archive} disabled={busy} type="submit">
                {busy
                  ? "Procesando…"
                  : panel === "terminate"
                    ? "Confirmar terminación"
                    : "Confirmar cancelación"}
              </button>
            </div>
          </form>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      {!panel && (
        <div className={leaseStyles.actionRow}>
          {(status === "draft" || status === "pending") && (
            <Link
              className={`${styles.restore} ${leaseStyles.linkButton}`}
              href={`/admin/leases/${encodeURIComponent(leaseId)}/edit`}
            >
              {status === "draft" ? "Continuar borrador" : "Editar"}
            </Link>
          )}
          {status === "pending" && (
            <button className={styles.restore} disabled={busy} onClick={activate} type="button">
              {busy ? "Procesando…" : "Activar contrato"}
            </button>
          )}
          {status === "active" && ended && (
            <button className={styles.restore} disabled={busy} onClick={expire} type="button">
              Marcar como vencido
            </button>
          )}
          {status === "active" && (
            <button className={styles.archive} onClick={() => setPanel("terminate")} type="button">
              Terminar
            </button>
          )}
          {(status === "draft" || status === "pending") && (
            <button className={styles.archive} onClick={() => setPanel("cancel")} type="button">
              Cancelar contrato
            </button>
          )}
        </div>
      )}
    </section>
  );
}
