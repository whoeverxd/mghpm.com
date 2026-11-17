import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { can } from "@/lib/access/permissions";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { listOrganizationMembers, MEMBER_LIST_LIMIT } from "@/lib/members/records";
import {
  canManageRole,
  allMemberStatusLabels,
  portalLabels,
  roleLabels,
} from "@/lib/members/roles";
import styles from "../properties/page.module.css";
import peopleStyles from "../people/people.module.css";

export const metadata: Metadata = {
  title: "Usuarios y accesos",
};

const dateFormat = new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" });

export default async function UsersPage() {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const { organizationId, role: actorRole } = access.activeOrganization;
  const shellProps = {
    activeOrganizationId: organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };

  if (!can(actorRole, "members", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para administrar usuarios." />
      </AdminShell>
    );
  }

  const members = await listOrganizationMembers(organizationId);

  return (
    <AdminShell {...shellProps}>
      <section aria-label="Usuarios y accesos" className={styles.content}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRACIÓN</p>
            <h1>Usuarios y accesos</h1>
            <p>Cuentas con acceso a {access.activeOrganization.organizationName}.</p>
          </div>
          <div className={styles.headingActions}>
            {can(actorRole, "members", "manage") && (
              <Link className={styles.applyButton} href="/admin/users/new">
                Nuevo acceso
              </Link>
            )}
          </div>
        </div>

        <section className={styles.listCard} aria-labelledby="members-title">
          <div className={styles.cardHeading}>
            <div>
              <h2 id="members-title">Miembros</h2>
              <p>
                {members.length} {members.length === 1 ? "cuenta" : "cuentas"}
                {members.length >= MEMBER_LIST_LIMIT && ` (se muestran las primeras ${MEMBER_LIST_LIMIT})`}
              </p>
            </div>
          </div>

          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Rol interno</th>
                  <th scope="col">Portales</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Último acceso</th>
                  <th scope="col">
                    <span className={styles.visuallyHidden}>Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const manageable = member.uid !== user.uid &&
                    (member.staffRole === null || canManageRole(actorRole, member.staffRole));
                  return (
                    <tr key={member.uid}>
                      <td>
                        <div className={peopleStyles.contactCell}>
                          <strong>
                            {member.displayName || member.email || "Cuenta sin correo"}
                            {member.uid === user.uid && " (tú)"}
                          </strong>
                          <small>{member.email}</small>
                        </div>
                      </td>
                      <td>
                        {member.staffRole ? (
                          <span className={styles.statusBadge}>{roleLabels[member.staffRole]}</span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        {member.portals.length ? (
                          member.portals.map((portal) => {
                            const personId = member.portalPersonIds[portal];
                            return (
                              <span className={styles.statusBadge} key={portal}>
                                {personId ? (
                                  <Link
                                    className={styles.propertyLink}
                                    href={`/admin/people/${encodeURIComponent(personId)}/edit`}
                                    title={member.portalPersonNames[portal] ?? "Ficha no disponible"}
                                  >
                                    {portalLabels[portal]}
                                  </Link>
                                ) : (
                                  portalLabels[portal]
                                )}
                              </span>
                            );
                          })
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            member.status === "active" ? styles.status_active : styles.status_inactive
                          }`}
                        >
                          {allMemberStatusLabels[member.status] ?? member.status}
                        </span>
                      </td>
                      <td>
                        {member.lastSignInTime ? (
                          dateFormat.format(new Date(member.lastSignInTime))
                        ) : (
                          <span className={styles.muted}>Nunca ha entrado</span>
                        )}
                      </td>
                      <td>
                        {manageable && (
                          <Link
                            className={styles.propertyLink}
                            href={`/admin/users/${encodeURIComponent(member.uid)}/edit`}
                          >
                            Administrar
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {members.length <= 1 && (
            <div className={styles.emptyState}>
              <span className={styles.stateIcon}>
                <KeyRound aria-hidden="true" size={23} />
              </span>
              <h3>Solo tú tienes acceso por ahora</h3>
              <p>
                Crea accesos para tu personal o, después de registrarlos en Personas,
                para tus propietarios e inquilinos.
              </p>
            </div>
          )}
        </section>

        <p className={styles.scopeNote}>
          Nadie puede cambiar su propio acceso ni el del titular de la cuenta. Solo el
          titular puede crear o modificar administradores.
        </p>
      </section>
    </AdminShell>
  );
}
