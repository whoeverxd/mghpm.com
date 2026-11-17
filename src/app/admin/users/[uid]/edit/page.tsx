import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { MemberAccessForm } from "@/components/members/member-access-form";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { getOrganizationMember } from "@/lib/members/records";
import { can } from "@/lib/access/permissions";
import { canManageRole, portalRoles, roleLabels } from "@/lib/members/roles";
import { listPersonAccountOptions, type PersonAccountOption } from "@/lib/people/list";
import { getOrganizationPerson } from "@/lib/people/records";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "../../../properties/form-page.module.css";

export const metadata: Metadata = {
  title: "Administrar acceso",
};

type EditMemberPageProps = {
  params: Promise<{ uid: string }>;
};

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { uid } = await params;
  if (!recordIdSchema.safeParse(uid).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const { organizationId, role: actorRole } = access.activeOrganization;
  const allowed = can(actorRole, "members", "manage");
  const member = allowed ? await getOrganizationMember(organizationId, uid) : null;
  if (allowed && !member) notFound();
  const manageable =
    member !== null &&
    member.uid !== user.uid &&
    (member.staffRole === null || canManageRole(actorRole, member.staffRole));

  // Unlinked people whose email matches the account, plus the people already linked to it.
  // Linked people are read with their real relationships, so a linked owner who is now
  // also a tenant can be given the tenant portal on the same account.
  const accountEmail = member?.email?.toLowerCase() ?? null;
  const linkedIds = member
    ? [...new Set(portalRoles.flatMap((portal) => member.portalPersonIds[portal] ?? []))]
    : [];
  const linkedOptions: PersonAccountOption[] =
    member && manageable
      ? (
          await Promise.all(
            linkedIds.map((id) => getOrganizationPerson(organizationId, id).catch(() => null)),
          )
        ).flatMap((person) =>
          person && !person.archived
            ? [{ id: person.id, name: person.name, email: person.email, relationshipTypes: person.relationshipTypes }]
            : [],
        )
      : [];
  const personOptions: PersonAccountOption[] =
    member && manageable
      ? [
          ...linkedOptions,
          ...(await listPersonAccountOptions(organizationId)).filter(
            (option) => option.email.toLowerCase() === accountEmail && !linkedIds.includes(option.id),
          ),
        ]
      : [];

  return (
    <AdminShell
      activeOrganizationId={organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
      crumbNames={{ uid: member?.displayName || member?.email || "" }}
    >
      {!member || !manageable ? (
        <PropertyAccessDenied
          message={
            member
              ? "No puedes modificar este acceso con tu rol."
              : "Tu rol no tiene permiso para administrar usuarios."
          }
        />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{(member.staffRole ? roleLabels[member.staffRole] : "Acceso por portal").toUpperCase()}</p>
            <h1>{member.displayName || member.email}</h1>
            <p>{member.email}</p>
          </div>
          <MemberAccessForm
            actorRole={actorRole}
            email={member.email}
            personOptions={personOptions}
            portals={{
              owner: {
                enabled: member.portals.includes("owner"),
                personId: member.portalPersonIds.owner ?? "",
              },
              tenant: {
                enabled: member.portals.includes("tenant"),
                personId: member.portalPersonIds.tenant ?? "",
              },
            }}
            staffRole={member.staffRole}
            status={member.status}
            uid={member.uid}
          />
        </section>
      )}
    </AdminShell>
  );
}
