"use client";

import { useState, type FormEvent } from "react";
import { formatText, type StaysDictionary, type StaysLocale } from "@/lib/stays/i18n";
import styles from "./stays.module.css";

type InquiryFormProps = {
  labels: StaysDictionary["inquiry"];
  locale: StaysLocale;
  request: {
    propertyId: string;
    unitId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    pets: number;
  };
};

export function InquiryForm({ labels, locale, request }: InquiryFormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    setBusy(true);
    try {
      const response = await fetch("/api/public/stays/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          name: String(formData.get("name") ?? "").trim(),
          email,
          phone: String(formData.get("phone") ?? "").trim(),
          message: String(formData.get("message") ?? "").trim(),
          consent: formData.get("consent") === "on",
          website: String(formData.get("website") ?? ""),
          locale,
        }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
            ? body.error
            : labels.genericError;
        throw new Error(message);
      }
      setSentTo(email);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : labels.genericError);
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className={styles.success} role="status">
        <strong>{labels.successTitle}</strong>
        <p>{formatText(labels.successBody, { email: sentTo })}</p>
      </div>
    );
  }

  return (
    <form className={styles.searchForm} onSubmit={submit}>
      <h2>{labels.title}</h2>
      <p>{labels.intro}</p>
      <label className={styles.field}>
        <span>{labels.name}</span>
        <input autoComplete="name" maxLength={120} minLength={2} name="name" required />
      </label>
      <label className={styles.field}>
        <span>{labels.email}</span>
        <input autoComplete="email" maxLength={200} name="email" required type="email" />
      </label>
      <label className={styles.field}>
        <span>{labels.phone}</span>
        <input autoComplete="tel" maxLength={30} minLength={7} name="phone" required type="tel" />
      </label>
      <label className={styles.field}>
        <span>{labels.message}</span>
        <textarea maxLength={1000} name="message" rows={4} />
      </label>
      <div aria-hidden="true" className={styles.honeypot}>
        <label>
          Website
          <input autoComplete="off" name="website" tabIndex={-1} />
        </label>
      </div>
      <label className={styles.checkboxes}>
        <input name="consent" required type="checkbox" /> {labels.consent}
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.primaryButton} disabled={busy} type="submit">
        {busy ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
