"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getLaneHomePath, laneForRole } from "@/lib/access/permissions";
import type { OrganizationMembership } from "@/lib/auth/organization";
import styles from "./organization-switcher.module.css";

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: OrganizationMembership[];
  activeOrganizationId: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState(activeOrganizationId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (organizations.length < 2) {
    const active = organizations.find(
      (organization) => organization.organizationId === activeOrganizationId,
    );
    return <span className={styles.singleOrg}>{active?.organizationName}</span>;
  }

  async function switchOrganization() {
    setBusy(true);
    setError(null);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/organizations/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ organizationId: selectedId }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsed = z.object({ error: z.string() }).safeParse(body);
        throw new Error(parsed.success ? parsed.data.error : t.workspaces.switchError);
      }

      const role = organizations.find((organization) => organization.organizationId === selectedId)?.role;
      router.replace(getLaneHomePath((role && laneForRole(role)) || "admin"));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.workspaces.switchError);
      setBusy(false);
    }
  }

  return (
    <div className={styles.switcher}>
      <label className={styles.visuallyHidden} htmlFor="active-organization">
        {t.workspaces.activeOrganization}
      </label>
      <select
        id="active-organization"
        onChange={(event) => setSelectedId(event.target.value)}
        value={selectedId}
      >
        {organizations.map((organization) => (
          <option key={organization.organizationId} value={organization.organizationId}>
            {organization.organizationName}
          </option>
        ))}
      </select>
      <button
        disabled={busy || selectedId === activeOrganizationId}
        onClick={switchOrganization}
        type="button"
      >
        {busy ? "…" : t.workspaces.change}
      </button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
}
