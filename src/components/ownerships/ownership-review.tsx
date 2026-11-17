"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { ownershipCheckLabels } from "@/lib/ownerships/labels";
import { ownershipChecks, type OwnershipCheck, type OwnershipStatus } from "@/lib/ownerships/rules";
import type { OwnershipFormValues } from "./ownership-form";
import styles from "./ownerships.module.css";

export type ReviewAction = { to: OwnershipStatus; label: string };

type OwnershipReviewProps = {
  ownershipId: string;
  /** Current stored fields, resent unchanged when only the checks change. */
  fields: OwnershipFormValues;
  checks: Record<OwnershipCheck, boolean>;
  canEditChecks: boolean;
  actions: ReviewAction[];
  /** Approve/reject exist but the actor created the record. */
  reviewBlocked: boolean;
  canEnd: boolean;
};

const errorBodySchema = z.object({ error: z.string() });

export function OwnershipReview({
  ownershipId,
  fields,
  checks,
  canEditChecks,
  actions,
  reviewBlocked,
  canEnd,
}: OwnershipReviewProps) {
  const router = useRouter();
  const [values, setValues] = useState(checks);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [ending, setEnding] = useState(false);
  const [endDate, setEndDate] = useState("");
  const encodedId = encodeURIComponent(ownershipId);
  const dirty = ownershipChecks.some((check) => values[check] !== checks[check]);

  async function send(path: string, method: "PATCH" | "POST", payload: unknown, done: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsed = errorBodySchema.safeParse(body);
        throw new Error(parsed.success ? parsed.data.error : "No se pudo completar la acción.");
      }
      setMessage(done);
      setRejecting(false);
      setEnding(false);
      setReason("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  function changeStatus(to: OwnershipStatus) {
    if (to === "rejected" && !rejecting) {
      setRejecting(true);
      return;
    }
    if (to === "rejected" && reason.trim().length < 3) {
      setError("Indica el motivo del rechazo (mínimo 3 caracteres).");
      return;
    }
    void send(
      `/api/ownerships/${encodedId}/status`,
      "POST",
      to === "rejected" ? { to, reason: reason.trim() } : { to },
      "Estado actualizado.",
    );
  }

  return (
    <section aria-labelledby="review-heading" className={styles.panel}>
      <div className={styles.panelHeading}>
        <h2 id="review-heading">Verificación</h2>
        <p>Marca la evidencia revisada. Cambiar la evidencia de una titularidad verificada la devuelve a revisión.</p>
      </div>

      <fieldset className={styles.checks} disabled={!canEditChecks || busy}>
        <legend className={styles.visuallyHidden}>Lista de verificación</legend>
        {ownershipChecks.map((check) => (
          <label key={check}>
            <input
              checked={values[check]}
              onChange={(event) => setValues({ ...values, [check]: event.target.checked })}
              type="checkbox"
            />
            {ownershipCheckLabels[check]}
          </label>
        ))}
      </fieldset>
      {canEditChecks && (
        <div>
          <button
            className={styles.secondary}
            disabled={busy || !dirty}
            onClick={() =>
              void send(
                `/api/ownerships/${encodedId}`,
                "PATCH",
                { ...fields, checks: values },
                "Lista de verificación guardada.",
              )
            }
            type="button"
          >
            Guardar verificación
          </button>
        </div>
      )}

      {(actions.length > 0 || reviewBlocked) && (
        <div className={styles.actionsBlock}>
          <div className={styles.buttons}>
            {actions.map((action) => (
              <button
                className={action.to === "rejected" ? styles.danger : styles.secondary}
                disabled={busy}
                key={action.to}
                onClick={() => changeStatus(action.to)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
          {reviewBlocked && <p className={styles.note}>Otra persona debe revisar esta titularidad.</p>}
          {rejecting && (
            <label className={styles.inlineField}>
              <span>Motivo del rechazo *</span>
              <input
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                value={reason}
              />
            </label>
          )}
        </div>
      )}

      {canEnd && (
        <div className={styles.actionsBlock}>
          {ending ? (
            <>
              <label className={styles.inlineField}>
                <span>Fecha de finalización *</span>
                <input onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
              </label>
              <div className={styles.buttons}>
                <button
                  className={styles.danger}
                  disabled={busy || !endDate}
                  onClick={() => void send(`/api/ownerships/${encodedId}/end`, "POST", { endDate }, "Titularidad finalizada.")}
                  type="button"
                >
                  Confirmar finalización
                </button>
                <button className={styles.secondary} onClick={() => setEnding(false)} type="button">
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className={styles.buttons}>
              <button className={styles.danger} disabled={busy} onClick={() => setEnding(true)} type="button">
                Finalizar titularidad
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.note} role="status">{message}</p>}
    </section>
  );
}
