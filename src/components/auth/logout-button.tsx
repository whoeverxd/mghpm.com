"use client";

import { getFirebaseClient } from "@/lib/firebase/client";
import { requestCsrfToken } from "@/components/auth/client-security";
import { useI18n } from "@/components/i18n/i18n-provider";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    setFailed(false);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
      });
      if (!response.ok) throw new Error(`Session close failed with ${response.status}`);

      const client = getFirebaseClient();
      await signOut(client.auth);
      router.replace("/acceder");
      router.refresh();
    } catch (cause) {
      console.error("Unable to close the MGHPM session.", cause);
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div>
      <button disabled={busy} onClick={logout} type="button">
        {busy ? t.auth.loggingOut : t.auth.logout}
      </button>
      {failed && <p role="alert">{t.auth.logoutError}</p>}
    </div>
  );
}
