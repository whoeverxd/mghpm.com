"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { useI18n } from "@/components/i18n/i18n-provider";
import styles from "./organization-form.module.css";

const formSchema = z.object({
  name: z.string().trim().min(2, "nameTooShort").max(120),
  baseCurrency: z.enum(["USD", "DOP"]),
  defaultTimeZone: z.enum([
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Santo_Domingo",
  ]),
});

export function CreateOrganizationForm() {
  const router = useRouter();
  const { t } = useI18n();
  const form = t.onboarding.form;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsedForm = formSchema.safeParse({
      name: formData.get("name"),
      baseCurrency: formData.get("baseCurrency"),
      defaultTimeZone: formData.get("defaultTimeZone"),
    });
    if (!parsedForm.success) {
      setError(parsedForm.error.issues[0]?.message === "nameTooShort" ? form.nameTooShort : form.review);
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(parsedForm.data),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(parsedBody.success ? parsedBody.data.error : form.error);
      }

      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : form.error);
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label htmlFor="organization-name">{form.name}</label>
      <input
        autoComplete="organization"
        id="organization-name"
        maxLength={120}
        name="name"
        placeholder={form.namePlaceholder}
        required
      />

      <label htmlFor="base-currency">{form.currency}</label>
      <select id="base-currency" name="baseCurrency" defaultValue="USD">
        <option value="USD">{form.currencies.USD}</option>
        <option value="DOP">{form.currencies.DOP}</option>
      </select>
      <p className={styles.hint}>{form.currencyHint}</p>

      <label htmlFor="default-time-zone">{form.timeZone}</label>
      <select id="default-time-zone" name="defaultTimeZone" defaultValue="America/Santo_Domingo">
        {formSchema.shape.defaultTimeZone.options.map((zone) => (
          <option key={zone} value={zone}>
            {form.timeZones[zone]}
          </option>
        ))}
      </select>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <button className={styles.submit} disabled={busy} type="submit">
        {busy ? form.creating : form.create}
      </button>
    </form>
  );
}
