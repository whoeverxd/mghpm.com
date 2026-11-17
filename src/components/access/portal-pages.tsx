import { getOrganizationPerson } from "@/lib/people/records";
import type { Lane } from "@/lib/access/permissions";
import { interpolate } from "@/lib/i18n/locales";
import { getI18n } from "@/lib/i18n/server";
import styles from "./portal-shell.module.css";

export async function PortalHome({ lane, userName }: { lane: Exclude<Lane, "admin">; userName: string | null }) {
  const { t } = await getI18n();
  const firstName = userName?.split(" ")[0];
  return (
    <section className={styles.card}>
      <h1>{firstName ? interpolate(t.portal.greetingName, { name: firstName }) : t.portal.greeting}</h1>
      <p>{t.portal.preparing}</p>
      <ul className={styles.list}>
        {t.portal.upcoming[lane].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/** Read-only view of the person linked to the caller's own membership. */
export async function PortalProfile({
  organizationId,
  personId,
  userEmail,
}: {
  organizationId: string;
  personId: string | null;
  userEmail: string | null;
}) {
  const { t } = await getI18n();
  const person = personId ? await getOrganizationPerson(organizationId, personId) : null;
  return (
    <section className={styles.card}>
      <h1>{t.portal.profile}</h1>
      {person ? (
        <dl className={styles.details}>
          <dt>{t.portal.profileName}</dt>
          <dd>{person.name}</dd>
          <dt>{t.portal.profileEmail}</dt>
          <dd>{person.email}</dd>
          <dt>{t.portal.profilePhone}</dt>
          <dd>{person.phone || "—"}</dd>
        </dl>
      ) : (
        <p>{interpolate(t.portal.profileUnlinked, { email: userEmail ?? "" })}</p>
      )}
    </section>
  );
}
