import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { genericPersonStatusLabels } from "@/lib/people/labels";
import type { Person } from "@/lib/people/records";
import { RelationshipBadges } from "./relationship-badges";
import styles from "./people-detail.module.css";

export type PersonSection = "overview" | "owner" | "tenant";

type PersonHeaderProps = {
  person: Pick<
    Person,
    "id" | "name" | "kind" | "relationshipTypes" | "relationships" | "status" | "archived"
  >;
  section: PersonSection;
  canEdit: boolean;
};

/** Shared header of the Person page and its Owner 360 / Tenant 360 views. */
export function PersonHeader({ person, section, canEdit }: PersonHeaderProps) {
  const base = `/admin/people/${encodeURIComponent(person.id)}`;
  const tabs: { id: PersonSection; label: string; href: string }[] = [
    { id: "overview", label: "Ficha", href: base },
  ];
  if (person.relationships.owner) tabs.push({ id: "owner", label: "Propietario", href: `${base}/propietario` });
  if (person.relationships.tenant) tabs.push({ id: "tenant", label: "Inquilino", href: `${base}/inquilino` });

  return (
    <div className={styles.header}>
      <Link className={styles.backLink} href="/admin/people">
        <ArrowLeft aria-hidden="true" size={16} />
        Personas
      </Link>
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>{person.name}</h1>
          <div className={styles.badges}>
            <RelationshipBadges kind={person.kind} relationshipTypes={person.relationshipTypes} />
            <span className={styles.badge}>{genericPersonStatusLabels[person.status]}</span>
            {person.archived && <span className={styles.badge}>Archivado</span>}
          </div>
        </div>
        {canEdit && (
          <div className={styles.headerActions}>
            <Link className={styles.primaryButton} href={`${base}/edit`}>
              <Pencil aria-hidden="true" size={16} />
              Editar
            </Link>
          </div>
        )}
      </div>
      {tabs.length > 1 && (
        <nav aria-label="Vistas de la persona" className={styles.tabs}>
          {tabs.map((tab) => (
            <Link
              aria-current={tab.id === section ? "page" : undefined}
              className={styles.tab}
              href={tab.href}
              key={tab.id}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
