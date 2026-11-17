import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { StaysFooter, StaysMobileTabs } from "@/components/stays/stays-footer";
import { StaysHeader } from "@/components/stays/stays-header";
import styles from "@/components/stays/stays.module.css";
import { parseStayFavorites, STAY_FAVORITES_COOKIE } from "@/lib/stays/favorites";
import { getStaysDictionary, hasStaysLocale } from "@/lib/stays/i18n";

export default async function StaysLayout({ children, params }: LayoutProps<"/[lang]/stays">) {
  const { lang } = await params;
  if (!hasStaysLocale(lang)) notFound();

  const dictionary = getStaysDictionary(lang);
  const favorites = parseStayFavorites((await cookies()).get(STAY_FAVORITES_COOKIE)?.value);

  return (
    <div className={styles.page} lang={lang}>
      <StaysHeader dictionary={dictionary} favoritesCount={favorites.length} locale={lang} />
      <main className={styles.main}>{children}</main>
      <StaysFooter dictionary={dictionary} locale={lang} />
      <StaysMobileTabs dictionary={dictionary} locale={lang} />
    </div>
  );
}
