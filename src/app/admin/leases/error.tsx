"use client";

import { useEffect } from "react";
import styles from "../properties/page.module.css";

export default function LeasesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unable to load leases for the active organization.", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={styles.stateCard}>
      <section aria-labelledby="leases-error-title">
        <h1 id="leases-error-title">No se pudieron cargar los contratos</h1>
        <p>
          Ocurrió un error al consultar los contratos de esta organización.
          Inténtalo nuevamente.
        </p>
        <button className={styles.applyButton} onClick={retry} type="button">
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
