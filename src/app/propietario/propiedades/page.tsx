import type { Metadata } from "next";
import styles from "@/components/access/portal-shell.module.css";
import { requireLane } from "@/lib/access/authorize";
import { getPropertySummaries } from "@/lib/ownerships/lookups";
import { listPersonOwnerships } from "@/lib/ownerships/records";
import { listRepresentedEntities } from "@/lib/people/list";

export const metadata: Metadata = { title: "Mis propiedades" };

export default async function OwnerPropertiesPage() {
  const access = await requireLane("owner");
  if (access.kind !== "allowed" || !access.personId) return null; // the layout already handled the denial

  const entities = await listRepresentedEntities(access.organizationId, access.personId);
  const entityNames = new Map(entities.map((entity) => [entity.id, entity.name]));
  const ownerships = (
    await listPersonOwnerships(access.organizationId, [access.personId, ...entityNames.keys()], {
      activeOnly: true,
    })
  ).filter((ownership) => ownership.active && ownership.status === "verified");
  const properties = await getPropertySummaries(
    access.organizationId,
    ownerships.map((ownership) => ownership.propertyId),
  );

  return (
    <section className={styles.card}>
      <h1>Mis propiedades</h1>
      {ownerships.length === 0 ? (
        <p>Aún no hay propiedades verificadas a tu nombre.</p>
      ) : (
        <dl className={styles.details}>
          {ownerships.map((ownership) => {
            const property = properties.get(ownership.propertyId);
            const holder = entityNames.get(ownership.personId);
            return [
              <dt key={`${ownership.id}-name`}>
                {property?.name ?? "Propiedad no disponible"}
                {holder ? ` · ${holder}` : ""}
              </dt>,
              <dd key={`${ownership.id}-detail`}>
                {[property?.city, `${ownership.pct} %`].filter(Boolean).join(" · ")}
              </dd>,
            ];
          })}
        </dl>
      )}
    </section>
  );
}
