import { adminPagePermissions } from "./route-permissions.ts";

export type Crumb = { label: string; href: string | null };

/** Texts from the active dictionary: `t.routes` and `t.breadcrumbs`. */
export type CrumbTexts = { routes: Record<string, string>; root: string; fallback: string };

const segments = (path: string) => path.split("/").filter(Boolean);

/** The manifest pattern of a concrete /admin path; literal segments win over `[param]` ones. */
export function matchAdminPage(pathname: string) {
  const target = segments(pathname);
  let best: { pattern: string; params: Record<string, string> } | null = null;
  let bestLiterals = -1;
  for (const pattern of Object.keys(adminPagePermissions)) {
    const parts = segments(pattern);
    if (parts.length !== target.length) continue;
    const params: Record<string, string> = {};
    let literals = 0;
    const matches = parts.every((part, index) => {
      const dynamic = /^\[(\w+)\]$/.exec(part);
      if (dynamic) {
        params[dynamic[1]!] = target[index]!;
        return true;
      }
      literals += 1;
      return part === target[index];
    });
    if (matches && literals > bestLiterals) {
      best = { pattern, params };
      bestLiterals = literals;
    }
  }
  return best;
}

function resolveLabel(label: string, names: Record<string, string>, fallback: string) {
  const missing = [...label.matchAll(/\{(\w+)\}/g)].some((match) => !names[match[1]!]);
  return missing ? fallback : label.replace(/\{(\w+)\}/g, (_, name: string) => names[name]!);
}

/** "Inicio › … › current" for an /admin path. The last crumb has no href. */
export function buildBreadcrumbs(pathname: string, names: Record<string, string>, texts: CrumbTexts): Crumb[] {
  const match = matchAdminPage(pathname);
  if (!match) return [{ label: texts.root, href: null }];

  const chain: string[] = [];
  for (let pattern: string | null = match.pattern; pattern && chain.length < 10; ) {
    chain.unshift(pattern);
    pattern = adminPagePermissions[pattern]?.parent ?? null;
  }
  const crumbs: Crumb[] = [
    { label: texts.root, href: "/admin" },
    ...chain.map((pattern) => ({
      label: resolveLabel(texts.routes[pattern] ?? texts.fallback, names, texts.fallback),
      href: pattern.replace(/\[(\w+)\]/g, (_, name: string) => match.params[name] ?? ""),
    })),
  ];
  crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1]!, href: null };
  return crumbs;
}
