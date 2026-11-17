import { Building2 } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import styles from "./property-access-denied.module.css";

/** In-shell denial for an admin page; `message` explains what the role cannot do. */
export async function PropertyAccessDenied({ message }: { message?: string }) {
  const { t } = await getI18n();
  return (
    <section className={styles.state} data-access-denied="" role="status">
      <Building2 aria-hidden="true" size={23} />
      <h1>{t.accessDenied.title}</h1>
      <p>{message ?? t.accessDenied.defaultMessage}</p>
    </section>
  );
}
