"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getLaneHomePath, type Lane } from "@/lib/access/permissions";
import styles from "./organization-picker.module.css";

type PickerWorkspace = { organizationId: string; organizationName: string; lane: Lane };

const workspaceKey = (workspace: PickerWorkspace) => `${workspace.organizationId}|${workspace.lane}`;

export function OrganizationPicker({ workspaces }: { workspaces: PickerWorkspace[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [organizationId, setOrganizationId] = useState(workspaces[0] ? workspaceKey(workspaces[0]) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectOrganization() {
    setBusy(true);
    setError(null);
    try {
      const selected = workspaces.find((workspace) => workspaceKey(workspace) === organizationId);
      if (!selected) throw new Error(t.workspaces.switchError);
      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/organizations/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ organizationId: selected.organizationId, lane: selected.lane }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsed = z.object({ error: z.string() }).safeParse(body);
        throw new Error(parsed.success ? parsed.data.error : t.workspaces.switchError);
      }
      router.replace(getLaneHomePath(selected.lane));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.workspaces.switchError);
      setBusy(false);
    }
  }

  return (
    <div className={styles.picker}>
      <label htmlFor="organization-picker">{t.workspaces.organization}</label>
      <select
        id="organization-picker"
        onChange={(event) => setOrganizationId(event.target.value)}
        value={organizationId}
      >
        {workspaces.map((workspace) => (
          <option key={workspaceKey(workspace)} value={workspaceKey(workspace)}>
            {workspace.organizationName} · {t.lanes[workspace.lane]}
          </option>
        ))}
      </select>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy || !organizationId} onClick={selectOrganization} type="button">
        {busy ? t.workspaces.switching : t.workspaces.continue}
      </button>
    </div>
  );
}
