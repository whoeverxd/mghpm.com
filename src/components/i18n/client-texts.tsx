import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "./i18n-provider";

/** Sent by the root layout to every page: language switch, sign-out, workspace pickers. */
export const baseNamespaces = ["localeSwitch", "lanes", "auth", "workspaces"] as const satisfies readonly (keyof Dictionary)[];

/** Added by the /admin layout: shell, menu, breadcrumbs, "+ Nuevo" and search. */
export const adminNamespaces = ["shell", "breadcrumbs", "nav", "routes", "createMenu", "search"] as const satisfies readonly (keyof Dictionary)[];

/**
 * Sends the given dictionary namespaces to the client components below it.
 * Server components read texts with `getI18n()` and need no wrapper.
 */
export async function ClientTexts({
  namespaces,
  children,
}: {
  namespaces: readonly (keyof Dictionary)[];
  children: React.ReactNode;
}) {
  const { locale, t } = await getI18n();
  const texts: Partial<Dictionary> = Object.fromEntries(namespaces.map((namespace) => [namespace, t[namespace]]));
  return (
    <I18nProvider locale={locale} texts={texts}>
      {children}
    </I18nProvider>
  );
}
