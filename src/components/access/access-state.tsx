import Link from "next/link";
import { Lock, ShieldOff, UserX } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { getI18n } from "@/lib/i18n/server";
import styles from "./access-state.module.css";

type AccessStateKind = "forbidden" | "account_blocked" | "no_access";

const icons: Record<AccessStateKind, typeof Lock> = {
  forbidden: Lock,
  account_blocked: UserX,
  no_access: ShieldOff,
};

/** Shared full-page state for denied access; never renders internal navigation. */
export async function AccessState({ kind }: { kind: AccessStateKind }) {
  const { t } = await getI18n();
  const { title, body } = t.accessState[kind];
  const Icon = icons[kind];
  return (
    <main className={styles.page} data-access-denied="">
      <section className={styles.card} role="alert">
        <span className={styles.icon}>
          <Icon aria-hidden="true" size={24} />
        </span>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/espacios">
            {t.accessState.goToWorkspace}
          </Link>
          <Link className={styles.secondary} href="/acceder">
            {t.accessState.changeAccess}
          </Link>
          {/* A blocked or access-less account can otherwise never leave this screen. */}
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
