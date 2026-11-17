"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import type { OrganizationRole } from "@/lib/auth/organization-schema";
import type { StaffRole as StoredStaffRole } from "@/lib/access/membership";
import {
  canManageRole,
  allMemberStatusLabels,
  memberStatusLabels,
  memberStatuses,
  roleLabels,
  staffRoles,
} from "@/lib/members/roles";
import type { MemberDocument } from "@/lib/members/schema";
import type { PersonAccountOption } from "@/lib/people/list";
import styles from "@/components/properties/property-form.module.css";
import {
  MemberPortalFields,
  findIncompletePortal,
  toPortalInput,
  type PortalSelection,
} from "./member-portal-fields";
import { sendAccessEmail } from "./send-access-email";

type MemberAccessFormProps = {
  actorRole: OrganizationRole;
  uid: string;
  email: string | null;
  staffRole: StoredStaffRole | null;
  portals: PortalSelection;
  personOptions: PersonAccountOption[];
  status: MemberDocument["status"];
};

export function MemberAccessForm({
  actorRole,
  uid,
  email,
  staffRole: initialStaffRole,
  portals: initialPortals,
  personOptions,
  status,
}: MemberAccessFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [staffRole, setStaffRole] = useState<string>(initialStaffRole ?? "");
  const [portals, setPortals] = useState(initialPortals);
  const roleOptions = staffRoles.filter((option) => canManageRole(actorRole, option));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    if (findIncompletePortal(portals)) {
      setMessage({ kind: "error", text: "Selecciona la ficha de Personas para cada portal marcado." });
      return;
    }
    if (!staffRole && !portals.owner.enabled && !portals.tenant.enabled) {
      setMessage({ kind: "error", text: "Asigna un rol interno o al menos un portal." });
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(`/api/members/${encodeURIComponent(uid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({
          staffRole,
          portals: toPortalInput(portals),
          status: formData.get("status"),
        }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(parsedBody.success ? parsedBody.data.error : "No se pudo guardar el acceso.");
      }

      setMessage({ kind: "success", text: "Cambios guardados." });
      router.refresh();
    } catch (cause) {
      setMessage({
        kind: "error",
        text: cause instanceof Error ? cause.message : "No se pudo guardar el acceso.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email) return;
    setMessage(null);
    setBusy(true);
    try {
      await sendAccessEmail(email);
      setMessage({ kind: "success", text: `Enviamos el correo de acceso a ${email}.` });
    } catch (cause) {
      console.error("Unable to send the access email.", cause);
      setMessage({ kind: "error", text: "No se pudo enviar el correo. Inténtalo más tarde." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <section aria-labelledby="member-access-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2 id="member-access-heading">Rol y estado</h2>
          <p>
            Suspender bloquea el acceso a esta organización de inmediato, sin borrar la
            cuenta ni su historial.
          </p>
        </div>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Rol interno</span>
            <select
              disabled={initialStaffRole === "org_owner"}
              onChange={(event) => setStaffRole(event.target.value)}
              value={staffRole}
            >
              <option value="">Sin rol interno</option>
              {initialStaffRole && !roleOptions.some((option) => option === initialStaffRole) && (
                <option value={initialStaffRole}>{roleLabels[initialStaffRole]}</option>
              )}
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {roleLabels[option]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Estado</span>
            {status === "active" || status === "suspended" ? (
              <select defaultValue={status} name="status">
                {memberStatuses.map((option) => (
                  <option key={option} value={option}>
                    {memberStatusLabels[option]}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <strong>{allMemberStatusLabels[status] ?? status}</strong>
                <input name="status" type="hidden" value={status} />
              </>
            )}
          </label>
        </div>
      </section>

      <MemberPortalFields options={personOptions} onChange={setPortals} selection={portals} />

      {message && (
        <p className={message.kind === "error" ? styles.error : styles.note} role="status">
          {message.text}
        </p>
      )}

      <div className={styles.actions}>
        <Link className={styles.cancel} href="/admin/users">
          Volver
        </Link>
        {email && (
          <button className={styles.cancel} disabled={busy} onClick={resend} type="button">
            Reenviar correo de acceso
          </button>
        )}
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
