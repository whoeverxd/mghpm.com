import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";
import { MemberCreateForm } from "@/components/members/member-create-form";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { listPersonAccountOptions } from "@/lib/people/list";
import styles from "../../properties/form-page.module.css";

export const metadata: Metadata = {
  title: "Nuevo acceso",
};

type NewMemberPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewMemberPage({ searchParams }: NewMemberPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const { organizationId, role } = access.activeOrganization;
  const allowed = can(role, "members", "manage");
  const personOptions = allowed ? await listPersonAccountOptions(organizationId) : [];
  const requestedPersonId = (await searchParams).personId;

  return (
    <AdminShell
      activeOrganizationId={organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
    >
      {!allowed ? (
        <PropertyAccessDenied message="Tu rol no tiene permiso para administrar usuarios." />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>USUARIOS Y ACCESOS</p>
            <h1>Nuevo acceso</h1>
            <p>Crea la cuenta de un miembro del personal, un propietario o un inquilino.</p>
          </div>
          <MemberCreateForm
            actorRole={role}
            initialPersonId={typeof requestedPersonId === "string" ? requestedPersonId : ""}
            personOptions={personOptions}
          />
        </section>
      )}
    </AdminShell>
  );
}
