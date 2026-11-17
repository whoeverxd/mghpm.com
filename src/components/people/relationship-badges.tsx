import { personKindLabels, relationshipLabels } from "@/lib/people/labels";
import type { PersonKind, RelationshipType } from "@/lib/people/relationships";
import styles from "./people-detail.module.css";

const relationshipClass: Partial<Record<RelationshipType, string>> = {
  owner: styles.badgeOwner,
  tenant: styles.badgeTenant,
};

/** Active relationships as badges, plus an "Entidad" badge for entities. */
export function RelationshipBadges({
  kind,
  relationshipTypes,
}: {
  kind: PersonKind;
  relationshipTypes: RelationshipType[];
}) {
  return (
    <>
      {relationshipTypes.map((type) => (
        <span className={`${styles.badge} ${relationshipClass[type] ?? ""}`} key={type}>
          {relationshipLabels[type]}
        </span>
      ))}
      {kind === "entity" && (
        <span className={`${styles.badge} ${styles.badgeEntity}`}>{personKindLabels.entity}</span>
      )}
    </>
  );
}
