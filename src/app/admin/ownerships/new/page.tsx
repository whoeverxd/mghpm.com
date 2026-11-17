import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { OwnershipForm } from "@/components/ownerships/ownership-form";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import {
  getPersonSummaries,
  getPropertySummaries,
  listOwnerCandidates,
  listOwnershipTotals,
} from "@/lib/ownerships/lookups";
import { availablePct } from "@/lib/ownerships/rules";
import { listPropertyOptions } from "@/lib/properties/list";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "../../properties/form-page.module.css";

export const metadata: Metadata = {
  title: "Nueva titularidad",
};

type NewOwnershipPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;
  if (!recordIdSchema.safeParse(candidate).success) notFound();
  return candidate;
}

export default async function NewOwnershipPage({ searchParams }: NewOwnershipPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;
  const organizationId = access.activeOrganization.organizationId;

  const shellProps = {
    activeOrganizationId: organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };

  if (!can(access.activeOrganization.role, "ownerships", "create")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para crear titularidades." />
      </AdminShell>
    );
  }

  const search = await searchParams;
  const personId = readId(search.personId);
  const propertyId = readId(search.propertyId);

  const [people, properties, propertyOptions, personOptions, totals] = await Promise.all([
    personId ? getPersonSummaries(organizationId, [personId]) : Promise.resolve(null),
    propertyId ? getPropertySummaries(organizationId, [propertyId]) : Promise.resolve(null),
    propertyId ? Promise.resolve([]) : listPropertyOptions(organizationId),
    personId ? Promise.resolve([]) : listOwnerCandidates(organizationId),
    listOwnershipTotals(organizationId),
  ]);

  const person = personId ? people?.get(personId) : undefined;
  const property = propertyId ? properties?.get(propertyId) : undefined;
  if ((personId && (!person || person.archived)) || (propertyId && (!property || property.archived))) {
    notFound();
  }

  const availableByProperty: Record<string, number> = Object.fromEntries(
    Object.entries(totals).map(([id, total]) => [id, availablePct([total])]),
  );
  if (propertyId && property && availableByProperty[propertyId] === undefined) {
    availableByProperty[propertyId] = 100;
  }

  const cancelHref = personId
    ? `/admin/people/${encodeURIComponent(personId)}/propietario`
    : propertyId
      ? `/admin/properties/${encodeURIComponent(propertyId)}?tab=owners`
      : "/admin/people";

  return (
    <AdminShell {...shellProps}>
      <section className={styles.content}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>TITULARIDADES</p>
          <h1>Nueva titularidad</h1>
          <p>Vincula a una persona o entidad con una propiedad y define su porcentaje.</p>
        </div>
        <OwnershipForm
          availableByProperty={availableByProperty}
          cancelHref={cancelHref}
          fixedPerson={person ? { id: person.id, label: person.name } : undefined}
          fixedProperty={property ? { id: property.id, label: `${property.name} (${property.code})` } : undefined}
          initialValues={{
            pct: "",
            startDate: "",
            titleOwner: "",
            titleNumber: "",
            registryNumber: "",
            cadastralNumber: "",
            registryAddress: "",
          }}
          personOptions={personOptions.map((option) => ({
            id: option.id,
            label: option.kind === "entity" ? `${option.name} (entidad)` : option.name,
          }))}
          propertyOptions={propertyOptions.map((option) => ({
            id: option.id,
            label: `${option.name} (${option.code})`,
          }))}
        />
      </section>
    </AdminShell>
  );
}
