"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestCsrfToken } from "@/components/auth/client-security";
import type { StayInquiryStatus } from "@/lib/stays/inquiry-schema";
import styles from "@/app/admin/properties/page.module.css";

const actions: Record<StayInquiryStatus, { status: StayInquiryStatus; label: string }[]> = {
  new: [
    { status: "contacted", label: "Marcar contactada" },
    { status: "closed", label: "Cerrar" },
  ],
  contacted: [{ status: "closed", label: "Cerrar" }],
  closed: [{ status: "new", label: "Reabrir" }],
};

export function InquiryStatusButtons({ inquiryId, status }: { inquiryId: string; status: StayInquiryStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: StayInquiryStatus) {
    setBusy(true);
    setError(null);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(`/api/stay-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar la solicitud.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {actions[status].map((action) => (
        <button disabled={busy} key={action.status} onClick={() => change(action.status)} type="button">
          {action.label}
        </button>
      ))}
      {error && (
        <p className={styles.muted} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
