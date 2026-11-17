import {
  formatMoney,
  formatText,
  type StaysDictionary,
  type StaysLocale,
} from "@/lib/stays/i18n";
import type { PublicListing } from "@/lib/stays/listing";
import type { QuoteResult } from "@/lib/stays/quote";
import type { StaySearch } from "@/lib/stays/search";
import styles from "./stays.module.css";

type QuotePanelProps = {
  action: string;
  dictionary: StaysDictionary;
  listing: PublicListing;
  locale: StaysLocale;
  result: QuoteResult | null;
  search: StaySearch;
  today: string;
};

/** GET form back to the same page; the server computes the quote. */
export function QuotePanel({ action, dictionary, listing, locale, result, search, today }: QuotePanelProps) {
  const t = dictionary.detail;
  return (
    <div className={styles.panel}>
      <h2>{t.quoteTitle}</h2>
      <p className={styles.price}>
        <strong>{formatMoney(listing.nightlyRateMinor, listing.currency, locale)}</strong>
        <span>{dictionary.results.perNight}</span>
      </p>
      <form action={action} className={styles.searchForm} method="get">
        <label className={styles.field}>
          <span>{dictionary.search.checkIn}</span>
          <input defaultValue={search.checkIn} min={today} name="checkIn" required type="date" />
        </label>
        <label className={styles.field}>
          <span>{dictionary.search.checkOut}</span>
          <input defaultValue={search.checkOut} min={today} name="checkOut" required type="date" />
        </label>
        <label className={styles.field}>
          <span>{dictionary.search.guests}</span>
          <input
            defaultValue={search.guests}
            max={listing.maxGuests}
            min={1}
            name="guests"
            type="number"
          />
        </label>
        <label className={styles.field}>
          <span>{dictionary.search.pets}</span>
          <select defaultValue={String(search.pets)} name="pets">
            <option value="0">{dictionary.search.noPets}</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
        <button className={styles.primaryButton} type="submit">
          {t.quoteSubmit}
        </button>
      </form>

      {result === null && <p>{t.chooseDates}</p>}
      {result && !result.ok && (
        <p className={styles.error} role="alert">
          {formatText(dictionary.issues[result.issue], {
            max: listing.maxGuests,
            count: result.issue === "max_nights" ? listing.maxNights : listing.minNights,
          })}
        </p>
      )}
      {result?.ok && (
        <dl className={styles.breakdown}>
          <div>
            <dt>
              {formatText(t.nightsLine, {
                rate: formatMoney(result.quote.nightlyRateMinor, result.quote.currency, locale),
                nights: result.quote.nights,
              })}
            </dt>
            <dd>{formatMoney(result.quote.subtotalMinor, result.quote.currency, locale)}</dd>
          </div>
          {result.quote.cleaningFeeMinor > 0 && (
            <div>
              <dt>{t.cleaning}</dt>
              <dd>{formatMoney(result.quote.cleaningFeeMinor, result.quote.currency, locale)}</dd>
            </div>
          )}
          <div className={styles.breakdownTotal}>
            <dt>{t.total}</dt>
            <dd>{formatMoney(result.quote.totalMinor, result.quote.currency, locale)}</dd>
          </div>
        </dl>
      )}
      <p className={styles.notice}>{dictionary.results.priceNote}</p>
    </div>
  );
}
