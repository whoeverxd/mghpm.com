import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { InquiryStatusButtons } from "@/components/stays/inquiry-status-buttons";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { formatMoney, formatStayDate } from "@/lib/stays/i18n";
import { listStayInquiries } from "@/lib/stays/inquiries";
import { stayInquiryStatuses, type StayInquiryStatus } from "@/lib/stays/inquiry-schema";
import listStyles from "../properties/page.module.css";

export const metadata: Metadata = {
  title: "Solicitudes de estadía",
};

const statusLabels: Record<StayInquiryStatus, string> = {
  new: "Nueva",
  contacted: "Contactada",
  closed: "Cerrada",
};

const statusClasses = {
  new: "status_draft",
  contacted: "status_maintenance",
  closed: "status_inactive",
} as const satisfies Record<StayInquiryStatus, string>;

const searchSchema = z.object({
  status: z.enum(stayInquiryStatuses).optional().catch(undefined),
});

type StayInquiriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StayInquiriesPage({ searchParams }: StayInquiriesPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const shellProps = {
    activeOrganizationId: access.activeOrganization.organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };
  if (!can(access.activeOrganization.role, "stay_inquiries", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const { status } = searchSchema.parse(await searchParams);
  const inquiries = await listStayInquiries(access.activeOrganization.organizationId);
  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const visible = status ? inquiries.filter((inquiry) => inquiry.status === status) : inquiries;
  const dateFormatter = new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AdminShell {...shellProps}>
      <section className={listStyles.content}>
        <div className={listStyles.heading}>
          <div>
            <p className={listStyles.eyebrow}>CATÁLOGO PÚBLICO</p>
            <h1>Solicitudes de estadía</h1>
            <p>
              {newCount === 1 ? "1 solicitud nueva" : `${newCount} solicitudes nuevas`}. Llegan desde
              el formulario de cada estadía publicada.
            </p>
          </div>
        </div>

        <section aria-label="Solicitudes de estadía" className={listStyles.listCard}>
        <form action="/admin/stay-inquiries" className={listStyles.filters} method="get">
          <label className={listStyles.filterField}>
            <span>Estado</span>
            <select defaultValue={status ?? ""} name="status">
              <option value="">Todas</option>
              {stayInquiryStatuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <div className={listStyles.filterActions}>
            <button className={listStyles.applyButton} type="submit">
              Aplicar
            </button>
            <Link className={listStyles.resetLink} href="/admin/stay-inquiries">
              Limpiar
            </Link>
          </div>
        </form>

        {visible.length > 0 ? (
          <div className={listStyles.tableScroller}>
            <table className={listStyles.table}>
              <thead>
                <tr>
                  <th scope="col">Recibida</th>
                  <th scope="col">Estadía</th>
                  <th scope="col">Fechas</th>
                  <th scope="col">Contacto</th>
                  <th scope="col">Total</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>{inquiry.createdAt ? dateFormatter.format(inquiry.createdAt) : "—"}</td>
                    <td>
                      <Link href={`/admin/properties/${encodeURIComponent(inquiry.propertyId)}?tab=units`}>
                        {inquiry.listingTitle}
                      </Link>
                    </td>
                    <td>
                      {formatStayDate(inquiry.checkIn, "es")} – {formatStayDate(inquiry.checkOut, "es")}
                      <br />
                      <span className={listStyles.muted}>
                        {inquiry.nights} noches · {inquiry.guests} huéspedes
                        {inquiry.pets > 0 ? ` · ${inquiry.pets} mascotas` : ""}
                      </span>
                    </td>
                    <td>
                      <strong>{inquiry.name}</strong>
                      <br />
                      <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                      <br />
                      <a href={`tel:${inquiry.phone.replace(/[^0-9+]/g, "")}`}>{inquiry.phone}</a>
                      {inquiry.message && (
                        <>
                          <br />
                          <span className={listStyles.muted}>{inquiry.message}</span>
                        </>
                      )}
                    </td>
                    <td>{formatMoney(inquiry.quote.totalMinor, inquiry.quote.currency, "es")}</td>
                    <td>
                      <span className={`${listStyles.statusBadge} ${listStyles[statusClasses[inquiry.status]]}`}>{statusLabels[inquiry.status]}</span>
                      <InquiryStatusButtons inquiryId={inquiry.id} status={inquiry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={listStyles.emptyState}>
            <span className={listStyles.stateIcon}>
              <Inbox aria-hidden="true" size={23} />
            </span>
            <h3>No hay solicitudes</h3>
            <p>Cuando alguien solicite una estadía publicada, aparecerá aquí.</p>
          </div>
        )}
        </section>
      </section>
    </AdminShell>
  );
}
