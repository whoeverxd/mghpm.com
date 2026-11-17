"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import type { OrganizationRole } from "@/lib/auth/organization-schema";
import { canManageRole, roleLabels, staffRoles, type StaffRole } from "@/lib/members/roles";
import { memberCreateInputSchema } from "@/lib/members/schema";
import type { PersonAccountOption } from "@/lib/people/list";
import styles from "@/components/properties/property-form.module.css";
import {
  MemberPortalFields,
  findIncompletePortal,
  toPortalInput,
  type PortalSelection,
} from "./member-portal-fields";
import { sendAccessEmail } from "./send-access-email";

type MemberCreateFormProps = {
  actorRole: OrganizationRole;
  personOptions: PersonAccountOption[];
  initialPersonId: string;
};

type Result = { email: string; emailSent: boolean; accountCreated: boolean };

const createdSchema = z.object({ email: z.string(), accountCreated: z.boolean() });

export function MemberCreateForm({
  actorRole,
  personOptions,
  initialPersonId,
}: MemberCreateFormProps) {
  const router = useRouter();
  const initialPerson = personOptions.find((person) => person.id === initialPersonId);
  const roles = staffRoles.filter((role) => canManageRole(actorRole, role));
  const [staffRole, setStaffRole] = useState<StaffRole | "">(initialPerson ? "" : (roles[0] ?? ""));
  const [portals, setPortals] = useState<PortalSelection>(() => ({
    owner: {
      enabled: Boolean(initialPerson?.relationshipTypes.includes("owner")),
      personId: initialPerson?.relationshipTypes.includes("owner") ? initialPerson.id : "",
    },
    tenant: {
      enabled: Boolean(initialPerson?.relationshipTypes.includes("tenant")),
      personId: initialPerson?.relationshipTypes.includes("tenant") ? initialPerson.id : "",
    },
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const portalInput = toPortalInput(portals);
  const linkedPerson = personOptions.find(
    (option) => option.id === (portalInput.owner || portalInput.tenant),
  );

  async function deliverEmail(email: string) {
    try {
      await sendAccessEmail(email);
      return true;
    } catch (cause) {
      console.error("Unable to send the access email.", cause);
      return false;
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const incomplete = findIncompletePortal(portals);
    if (incomplete) {
      setError("Selecciona la ficha de Personas para cada portal marcado.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const parsedForm = memberCreateInputSchema.safeParse({
      staffRole,
      portals: portalInput,
      email: linkedPerson ? linkedPerson.email : formData.get("email"),
      displayName: linkedPerson ? linkedPerson.name : formData.get("displayName"),
    });
    if (!parsedForm.success) {
      setError(parsedForm.error.issues[0]?.message ?? "Revisa los datos ingresados.");
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify(parsedForm.data),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(parsedBody.success ? parsedBody.data.error : "No se pudo crear el acceso.");
      }

      const created = createdSchema.parse(body);
      const emailSent = await deliverEmail(created.email);
      setResult({ email: created.email, emailSent, accountCreated: created.accountCreated });
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el acceso.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!result) return;
    setBusy(true);
    const emailSent = await deliverEmail(result.email);
    setResult({ ...result, emailSent });
    setBusy(false);
  }

  if (result) {
    return (
      <section className={styles.section} role="status">
        <div className={styles.sectionHeading}>
          <h2>Acceso creado para {result.email}</h2>
          <p>
            {result.accountCreated
              ? "Se creó la cuenta."
              : "La cuenta ya existía en la plataforma y se añadió a esta organización."}{" "}
            {result.emailSent
              ? "Enviamos el correo para definir la contraseña. Si no llega, revisa spam o reenvíalo."
              : "No se pudo enviar el correo para definir la contraseña. Reenvíalo."}
          </p>
        </div>
        <div className={styles.actions} style={{ padding: "16px 22px" }}>
          <button className={styles.cancel} disabled={busy} onClick={resend} type="button">
            {busy ? "Enviando…" : "Reenviar correo"}
          </button>
          <Link className={styles.submit} href="/admin/users">
            Volver a usuarios
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <section aria-labelledby="member-info-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2 id="member-info-heading">Cuenta de acceso</h2>
          <p>
            La persona recibirá un correo de Firebase para definir su contraseña e
            iniciar sesión. Los campos con * son obligatorios.
          </p>
        </div>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Rol interno</span>
            <select
              name="staffRole"
              onChange={(event) => setStaffRole(event.target.value as StaffRole | "")}
              value={staffRole}
            >
              <option value="">Sin rol interno</option>
              {roles.map((option) => (
                <option key={option} value={option}>
                  {roleLabels[option]}
                </option>
              ))}
            </select>
          </label>

          {linkedPerson ? (
            <p className={styles.note}>
              La cuenta usa el nombre y el correo de la ficha de {linkedPerson.name}.
            </p>
          ) : (
            <>
              <label className={styles.field}>
                <span>Nombre *</span>
                <input autoComplete="off" maxLength={120} name="displayName" required />
              </label>
              <label className={styles.field}>
                <span>Correo electrónico *</span>
                <input autoComplete="off" maxLength={254} name="email" required type="email" />
              </label>
            </>
          )}
        </div>
      </section>

      <MemberPortalFields options={personOptions} onChange={setPortals} selection={portals} />

      <p className={styles.note}>
        Si la persona no aparece, regístrala primero en <Link href="/admin/people/new">Personas</Link>{" "}
        o revisa que no tenga ya una cuenta.
      </p>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <Link className={styles.cancel} href="/admin/users">
          Cancelar
        </Link>
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? "Creando…" : "Crear acceso y enviar correo"}
        </button>
      </div>
    </form>
  );
}
