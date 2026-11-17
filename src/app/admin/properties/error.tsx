"use client";

import { useEffect } from "react";
import styles from "./page.module.css";

export default function PropertiesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unable to load properties for the active organization.", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={styles.stateCard}>
      <section aria-labelledby="properties-error-title">
        <h1 id="properties-error-title">No se pudieron cargar las propiedades</h1>
        <p>
          Ocurrió un error al consultar la cartera de esta organización.
          Inténtalo nuevamente.
        </p>
        <button className={styles.applyButton} onClick={retry} type="button">
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
