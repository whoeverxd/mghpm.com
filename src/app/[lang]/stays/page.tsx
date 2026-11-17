import type { Metadata } from "next";
import { Car, ChefHat, ImageOff, ShieldCheck, ShoppingCart, Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingTitle, ListingCard } from "@/components/stays/listing-card";
import { StaySearchForm } from "@/components/stays/search-form";
import styles from "@/components/stays/stays.module.css";
import { listPublicListings } from "@/lib/stays/catalog";
import { parseStayFavorites, STAY_FAVORITES_COOKIE, stayKey } from "@/lib/stays/favorites";
import {
  formatStayDate,
  formatText,
  getStaysDictionary,
  getStaysPath,
  hasStaysLocale,
  type StaysLocale,
} from "@/lib/stays/i18n";
import { getPublicStayImageUrl, type PublicListing } from "@/lib/stays/listing";
import { getTodayDate } from "@/lib/stays/quote";
import { parseStaySearch, searchStays, type StaySearch } from "@/lib/stays/search";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/stays">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasStaysLocale(lang)) return {};
  const dictionary = getStaysDictionary(lang);
  return { title: dictionary.meta.title, description: dictionary.meta.description };
}

/** Catalog URL for the current search with some fields replaced (chips, destinations). */
function staysHref(locale: StaysLocale, search: StaySearch, overrides: Partial<StaySearch>) {
  const next = { ...search, ...overrides };
  const query = new URLSearchParams();
  if (next.area) query.set("area", next.area);
  if (next.checkIn) query.set("checkIn", next.checkIn);
  if (next.checkOut) query.set("checkOut", next.checkOut);
  if (next.guests !== 1) query.set("guests", String(next.guests));
  if (next.pets > 0) query.set("pets", String(next.pets));
  if (next.maxPrice !== null) query.set("maxPrice", String(next.maxPrice));
  if (next.type) query.set("type", next.type);
  if (next.bedrooms > 0) query.set("bedrooms", String(next.bedrooms));
  if (next.baths > 0) query.set("baths", String(next.baths));
  next.amenities.forEach((amenity) => query.append("amenities", amenity));
  if (next.sort !== "recommended") query.set("sort", next.sort);
  if (next.saved) query.set("saved", "1");
  const text = query.toString();
  return `${getStaysPath(locale)}${text ? `?${text}` : ""}#estancias`;
}

type Destination = { city: string; region: string; count: number; cover: PublicListing | null };

function getDestinations(listings: PublicListing[], locale: StaysLocale): Destination[] {
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });
  const byCity = new Map<string, Destination>();
  for (const listing of listings) {
    if (!listing.city) continue;
    const entry = byCity.get(listing.city) ?? {
      city: listing.city,
      region: [listing.state, listing.country ? regionNames.of(listing.country) : ""]
        .filter(Boolean)
        .join(", "),
      count: 0,
      cover: null,
    };
    entry.count += 1;
    if (!entry.cover && listing.coverImageId) entry.cover = listing;
    byCity.set(listing.city, entry);
  }
  return [...byCity.values()].sort((left, right) => right.count - left.count);
}

const serviceIcons = { chef: ChefHat, groceries: ShoppingCart, transport: Car, cleaning: Sparkles };

export default async function StaysPage({ params, searchParams }: PageProps<"/[lang]/stays">) {
  const { lang } = await params;
  if (!hasStaysLocale(lang)) notFound();

  const dictionary = getStaysDictionary(lang);
  const home = dictionary.home;
  const search = parseStaySearch(await searchParams);
  const favorites = new Set(
    parseStayFavorites((await cookies()).get(STAY_FAVORITES_COOKIE)?.value),
  );
  const today = getTodayDate();
  let listings: PublicListing[] = [];
  try {
    listings = await listPublicListings();
  } catch (error) {
    console.error("Unable to load the public stays catalog.", error);
  }
  const result = searchStays(listings, search, today, favorites);
  const destinations = getDestinations(listings, lang);
  const types = [...new Set(listings.map((listing) => listing.type))];
  const t = dictionary.results;
  const count = result.available.length;
  const typeChips = [
    { label: home.allTypes, type: null },
    ...types.map((type) => ({ label: dictionary.types[type], type })),
  ];

  return (
    <>
      <section className={styles.hero}>
        <Image alt="" className={styles.heroImage} fill priority sizes="100vw" src="/landing/villa.jpg" />
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1>{home.heroTitle}</h1>
            <p>{home.heroSubtitle}</p>
          </div>
          <StaySearchForm
            areas={result.areas}
            dictionary={dictionary}
            locale={lang}
            search={search}
            today={today}
          />
          <span className={styles.heroNote}>{home.heroNote}</span>
        </div>
      </section>

      <div className={styles.container}>
        {destinations.length > 0 && (
          <section className={styles.section} id="destinos">
            <h2 className={styles.sectionTitle}>{home.destinationsTitle}</h2>
            <div className={styles.destinations}>
              {destinations.map((destination) => {
                const active = search.area === destination.city;
                return (
                  <Link
                    aria-current={active ? "true" : undefined}
                    className={styles.destination}
                    href={staysHref(lang, search, {
                      area: active ? "" : destination.city,
                      saved: false,
                    })}
                    key={destination.city}
                  >
                    {destination.cover?.coverImageId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        loading="lazy"
                        src={getPublicStayImageUrl(
                          destination.cover.propertyId,
                          destination.cover.coverImageId,
                          "thumbnail",
                        )}
                      />
                    ) : (
                      <div className={styles.destinationPlaceholder}>
                        <ImageOff aria-hidden="true" size={22} />
                      </div>
                    )}
                    <span className={styles.destinationBody}>
                      <strong>{destination.city}</strong>
                      <small>
                        {[
                          destination.region,
                          destination.count === 1
                            ? home.destinationOne
                            : formatText(home.destinationMany, { count: destination.count }),
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </small>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className={styles.section} id="estancias">
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>
                {search.saved ? home.favoritesTitle : home.staysTitle}
              </h2>
              <p className={styles.sectionNote}>
                {count === 1 ? t.countOne : formatText(t.countMany, { count })} ·{" "}
                {result.nights !== null
                  ? formatText(t.summaryDates, {
                      range: `${formatStayDate(search.checkIn, lang)} – ${formatStayDate(search.checkOut, lang)}`,
                      nights: result.nights,
                      guests: search.guests,
                    })
                  : t.summaryNoDates}
              </p>
            </div>
            {types.length > 1 && (
              <div className={styles.typeChips}>
                {typeChips.map((chip) => {
                  const active = !search.saved && search.type === chip.type;
                  return (
                    <Link
                      aria-current={active ? "true" : undefined}
                      className={styles.typeChip}
                      href={staysHref(lang, search, { type: chip.type, saved: false })}
                      key={chip.type ?? "all"}
                    >
                      {chip.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {result.datesIssue && (
            <p className={styles.warning} role="alert">
              {dictionary.issues[result.datesIssue]}
            </p>
          )}
          <p className={styles.notice}>{t.priceNote}</p>

          {count > 0 ? (
            <div className={styles.cards}>
              {result.available.map(({ listing, quote }) => (
                <ListingCard
                  dictionary={dictionary}
                  key={stayKey(listing.propertyId, listing.unitId)}
                  listing={listing}
                  locale={lang}
                  quote={quote}
                  saved={favorites.has(stayKey(listing.propertyId, listing.unitId))}
                  search={search}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <h3>
                {search.saved
                  ? home.favoritesEmpty
                  : listings.length === 0
                    ? t.catalogEmpty
                    : t.emptyTitle}
              </h3>
              {!search.saved && listings.length > 0 && <p>{t.emptyHint}</p>}
              {listings.length > 0 && (
                <Link className={styles.outlineButton} href={`${getStaysPath(lang)}#estancias`}>
                  {home.showAll}
                </Link>
              )}
            </div>
          )}

          {result.unavailable.length > 0 && (
            <div className={styles.unavailable}>
              <h3>{t.unavailableTitle}</h3>
              <ul>
                {result.unavailable.map(({ listing, issue }) => (
                  <li key={stayKey(listing.propertyId, listing.unitId)}>
                    <strong>{getListingTitle(listing, dictionary)}</strong> ·{" "}
                    {formatText(dictionary.issues[issue], {
                      count: issue === "min_nights" ? listing.minNights : listing.maxNights,
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{home.howTitle}</h2>
          <ol className={styles.steps}>
            {home.steps.map((step, index) => (
              <li className={styles.step} key={step.title}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <h2>{home.servicesTitle}</h2>
            <p>{home.servicesBody}</p>
            <ul className={styles.services}>
              {(Object.keys(serviceIcons) as (keyof typeof serviceIcons)[]).map((key) => {
                const Icon = serviceIcons[key];
                return (
                  <li key={key}>
                    <span className={styles.serviceIcon}>
                      <Icon aria-hidden="true" size={16} />
                    </span>
                    {home.services[key]}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={`${styles.infoCard} ${styles.trustCard}`}>
            <span className={styles.trustIcon}>
              <ShieldCheck aria-hidden="true" size={20} />
            </span>
            <h2>{home.trustTitle}</h2>
            <p>{home.trustBody}</p>
          </div>
        </section>

        <section className={styles.hostCta}>
          <div>
            <h2>{home.hostTitle}</h2>
            <p>{home.hostBody}</p>
          </div>
          <div className={styles.hostActions}>
            <Link className={styles.hostPrimary} href="/acceder">
              {home.hostCta}
            </Link>
            <Link className={styles.hostSecondary} href="/">
              {home.hostSecondary}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
