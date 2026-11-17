import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { PropertyForm } from "@/components/properties/property-form";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import styles from "../form-page.module.css";

export const metadata: Metadata = {
  title: "Nueva propiedad",
};

export default async function NewPropertyPage() {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  return (
    <AdminShell
      activeOrganizationId={access.activeOrganization.organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
    >
      {!can(access.activeOrganization.role, "properties", "create") ? (
        <PropertyAccessDenied />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>GESTIÓN DE PROPIEDADES</p>
            <h1>Nueva propiedad</h1>
            <p>Registra la información principal en la organización activa.</p>
          </div>
          <PropertyForm />
        </section>
      )}
    </AdminShell>
  );
}
