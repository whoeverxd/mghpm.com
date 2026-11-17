import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { AccessState } from "@/components/access/access-state";
import { can } from "@/lib/access/permissions";
import { AdminShell } from "@/components/layout/admin-shell";
import { getDashboardSummary } from "@/lib/dashboard/summary";
import { requireAdminPage } from "@/lib/access/admin-page";
import { roleLabels } from "@/lib/members/roles";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Panel principal",
};

export default async function DashboardPage() {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;
  const { role } = access.activeOrganization;
  if (!can(role, "dashboard", "view")) return <AccessState kind="forbidden" />;

  const summary = await getDashboardSummary(access.activeOrganization.organizationId);

  return (
    <AdminShell
      activeOrganizationId={access.activeOrganization.organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
    >
      <section className={styles.content}>
        <div className={styles.welcome}>
          <div>
            <p className={styles.eyebrow}>MGH PROPERTY MANAGEMENT</p>
            <h1>Bienvenido{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
            <p>
              {access.activeOrganization.organizationName} · {roleLabels[role]}
            </p>
          </div>
          <span className={styles.email}>{user.email}</span>
        </div>

        <section aria-label="Resumen de la organización" className={styles.overview}>
          <article className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>PROPIEDADES REGISTRADAS</span>
              <span className={styles.metricIcon}>
                <Building2 aria-hidden="true" size={19} strokeWidth={1.8} />
              </span>
            </div>
            <p className={styles.metricValue}>
              {new Intl.NumberFormat("es-DO").format(summary.propertyCount)}
            </p>
            <p className={styles.metricCaption}>En esta organización</p>
          </article>

          {summary.propertyCount === 0 ? (
            <section className={styles.emptyState} aria-labelledby="empty-title">
              <div className={styles.emptyIcon}>
                <Building2 aria-hidden="true" size={24} strokeWidth={1.7} />
              </div>
              <h2 id="empty-title">Tu espacio de trabajo está listo</h2>
              <p>
                Aún no hay propiedades registradas en {access.activeOrganization.organizationName}.
              </p>
              <span className={styles.notice}>
                El resumen de ingresos, gastos y ocupación estará disponible cuando se implementen
                y revisen los módulos relacionados.
              </span>
            </section>
          ) : (
            <section className={styles.noticePanel} aria-labelledby="metrics-title">
              <h2 id="metrics-title">Más indicadores próximamente</h2>
              <p>
                Los datos financieros y de ocupación se mostrarán cuando sus registros y reglas
                estén implementados.
              </p>
            </section>
          )}
        </section>
      </section>
    </AdminShell>
  );
}
