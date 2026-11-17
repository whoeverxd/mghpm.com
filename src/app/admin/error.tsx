"use client";

import { useEffect } from "react";
import styles from "./page.module.css";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unable to load the organization dashboard.", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} aria-labelledby="dashboard-error-title">
        <h1 id="dashboard-error-title">No se pudo cargar el panel</h1>
        <p>Ocurrió un error al consultar los datos de esta organización.</p>
        <button onClick={retry} type="button">
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
