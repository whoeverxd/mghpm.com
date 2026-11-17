"use client";

import { useEffect } from "react";
import styles from "../properties/page.module.css";

export default function PeopleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unable to load people for the active organization.", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={styles.stateCard}>
      <section aria-labelledby="people-error-title">
        <h1 id="people-error-title">No se pudo cargar el directorio</h1>
        <p>
          Ocurrió un error al consultar las personas de esta organización.
          Inténtalo nuevamente.
        </p>
        <button className={styles.applyButton} onClick={retry} type="button">
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
