import type { OrganizationRole } from "@/lib/auth/organization-schema";
import { matchAdminPage } from "./breadcrumbs.ts";
import { can } from "./permissions.ts";
import { createActions } from "./route-permissions.ts";

export type CreateMenuItem = {
  /** The action's page pattern (stable across pages; used for icons and React keys). */
  key: string;
  /** Key of `t.createMenu.items`. */
  name: (typeof createActions)[number]["name"];
  href: string;
};

/**
 * Entries of the "+ Nuevo" menu for a role on the current page. Inside a property
 * (any route with `[propertyId]`), "Nueva unidad" appears and contracts and
 * ownerships are prefilled with that property.
 */
export function buildCreateMenu(pathname: string, role: OrganizationRole | null): CreateMenuItem[] {
  const propertyId = matchAdminPage(pathname)?.params.propertyId ?? null;
  return createActions
    .filter((item) => can(role, item.module, item.action))
    .flatMap((item) => {
      if (item.href.includes("[propertyId]")) {
        return propertyId
          ? [{ key: item.href, name: item.name, href: item.href.replace("[propertyId]", propertyId) }]
          : [];
      }
      const href =
        item.acceptsProperty && propertyId
          ? `${item.href}?propertyId=${encodeURIComponent(propertyId)}`
          : item.href;
      return [{ key: item.href, name: item.name, href }];
    });
}
