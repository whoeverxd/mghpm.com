import Link from "next/link";
import { ImageOff } from "lucide-react";
import {
  formatCount,
  formatMoney,
  formatText,
  getStaysPath,
  type StaysDictionary,
  type StaysLocale,
} from "@/lib/stays/i18n";
import { getPublicStayImageUrl, type PublicListing } from "@/lib/stays/listing";
import type { StayQuote } from "@/lib/stays/quote";
import type { StaySearch } from "@/lib/stays/search";
import { FavoriteButton } from "./favorite-button";
import styles from "./stays.module.css";

export function getListingTitle(listing: PublicListing, dictionary: StaysDictionary) {
  return `${listing.propertyName} — ${dictionary.listing.unit} ${listing.unitLabel}`;
}

export function getListingHref(listing: PublicListing, locale: StaysLocale, search: StaySearch) {
  const query = new URLSearchParams({ guests: String(search.guests), pets: String(search.pets) });
  if (search.checkIn && search.checkOut) {
    query.set("checkIn", search.checkIn);
    query.set("checkOut", search.checkOut);
  }
  return `${getStaysPath(locale, listing.propertyId, listing.unitId)}?${query}`;
}

export function ListingFacts({
  dictionary,
  listing,
  locale,
}: {
  dictionary: StaysDictionary;
  listing: PublicListing;
  locale: StaysLocale;
}) {
  const t = dictionary.listing;
  return (
    <ul className={styles.facts}>
      <li>{formatText(t.bedrooms, { count: listing.bedrooms })}</li>
      <li>{formatText(t.beds, { count: listing.beds })}</li>
      <li>{formatText(t.baths, { count: formatCount(listing.bathrooms, locale) })}</li>
      <li>{formatText(t.guests, { count: listing.maxGuests })}</li>
    </ul>
  );
}

type ListingCardProps = {
  dictionary: StaysDictionary;
  listing: PublicListing;
  locale: StaysLocale;
  quote: StayQuote | null;
  saved: boolean;
  search: StaySearch;
};

export function ListingCard({ dictionary, listing, locale, quote, saved, search }: ListingCardProps) {
  const href = getListingHref(listing, locale, search);
  const home = dictionary.home;
  return (
    <article className={styles.card}>
      <div className={styles.cardMedia}>
        {listing.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className={styles.cardImage}
            loading="lazy"
            src={getPublicStayImageUrl(listing.propertyId, listing.coverImageId, "thumbnail")}
          />
        ) : (
          <div className={styles.cardPlaceholder}>
            <ImageOff aria-hidden="true" size={28} />
            <span>{dictionary.listing.noPhoto}</span>
          </div>
        )}
        <span className={styles.cardBadge}>{home.requestBadge}</span>
        <FavoriteButton
          initialSaved={saved}
          key={String(saved)}
          propertyId={listing.propertyId}
          removeLabel={home.removeFavorite}
          saveLabel={home.saveFavorite}
          unitId={listing.unitId}
        />
      </div>
      <div className={styles.cardBody}>
        <div>
          <h3 className={styles.cardTitle}>
            <Link href={href}>{getListingTitle(listing, dictionary)}</Link>
          </h3>
          <p className={styles.cardArea}>
            {[listing.city, listing.state].filter(Boolean).join(", ")} · {dictionary.types[listing.type]}
          </p>
        </div>
        <ListingFacts dictionary={dictionary} listing={listing} locale={locale} />
        <p className={styles.cardManaged}>{home.managed}</p>
        <div className={styles.cardFooter}>
          <div className={styles.price}>
            <span>{home.from}</span>
            <strong>{formatMoney(listing.nightlyRateMinor, listing.currency, locale)}</strong>
            <span>{dictionary.results.perNight}</span>
            {quote && (
              <span className={styles.priceTotal}>
                {formatText(dictionary.results.total, {
                  amount: formatMoney(quote.totalMinor, quote.currency, locale),
                })}
              </span>
            )}
          </div>
          <Link className={styles.cardButton} href={href}>
            {dictionary.results.view}
          </Link>
        </div>
      </div>
    </article>
  );
}
