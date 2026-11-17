import { getAuditActionLabel, type AuditEntry } from "@/lib/audit/recent";
import styles from "./people-detail.module.css";

const dateFormat = new Intl.DateTimeFormat("es-DO", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Recent audit events of a record; `entries` is null when they could not be loaded. */
export function ActivityList({ entries }: { entries: AuditEntry[] | null }) {
  return (
    <section aria-labelledby="activity-title" className={styles.card}>
      <h2 id="activity-title">Actividad</h2>
      {entries === null ? (
        <p className={styles.empty}>No se pudo cargar la actividad.</p>
      ) : entries.length === 0 ? (
        <p className={styles.empty}>Aún no hay actividad registrada.</p>
      ) : (
        <ul className={styles.activity}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <span>
                {getAuditActionLabel(entry.action)}
                {entry.reason && <small> · {entry.reason}</small>}
              </span>
              <small>{entry.createdAt ? dateFormat.format(entry.createdAt) : "—"}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
