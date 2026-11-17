import Link from "next/link";
import { getStaysDictionary, getStaysPath, staysLocales } from "@/lib/stays/i18n";
import styles from "@/components/stays/stays.module.css";

export default function StayNotFound() {
  return (
    <div className={`${styles.container} ${styles.detailPage}`}>
      <div className={styles.empty}>
        {staysLocales.map((locale) => {
          const dictionary = getStaysDictionary(locale);
          return (
            <div key={locale} lang={locale}>
              <h2>{dictionary.notFound.title}</h2>
              <p>{dictionary.notFound.body}</p>
              <p>
                <Link className={styles.textLink} href={getStaysPath(locale)}>
                  {dictionary.notFound.back}
                </Link>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
