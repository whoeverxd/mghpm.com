import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { InquiryForm } from "@/components/stays/inquiry-form";
import { getListingTitle, ListingFacts } from "@/components/stays/listing-card";
import { QuotePanel } from "@/components/stays/quote-panel";
import styles from "@/components/stays/stays.module.css";
import { recordIdSchema } from "@/lib/properties/schema";
import { getPublicListing, listPublicListingImageIds } from "@/lib/stays/catalog";
import { formatText, getStaysDictionary, getStaysPath, hasStaysLocale } from "@/lib/stays/i18n";
import { getPublicStayImageUrl } from "@/lib/stays/listing";
import { getTodayDate, quoteStay } from "@/lib/stays/quote";
import { parseStaySearch } from "@/lib/stays/search";

export const dynamic = "force-dynamic";

// Cached per request so metadata and page share one read; a read failure renders the 404.
const loadListing = cache(async (propertyId: string, unitId: string) => {
  if (!recordIdSchema.safeParse(propertyId).success || !recordIdSchema.safeParse(unitId).success) {
    return null;
  }
  try {
    return await getPublicListing(propertyId, unitId);
  } catch (error) {
    console.error("Unable to load public stay.", error);
    return null;
  }
});

export async function generateMetadata({ params }: PageProps<"/[lang]/stays/[propertyId]/[unitId]">): Promise<Metadata> {
  const { lang, propertyId, unitId } = await params;
  if (!hasStaysLocale(lang)) return {};
  const listing = await loadListing(propertyId, unitId);
  if (!listing) return {};
  return {
    title: getListingTitle(listing, getStaysDictionary(lang)),
    description: listing.description.slice(0, 160),
  };
}

export default async function StayDetailPage({ params, searchParams }: PageProps<"/[lang]/stays/[propertyId]/[unitId]">) {
  const { lang, propertyId, unitId } = await params;
  if (!hasStaysLocale(lang)) notFound();
  const listing = await loadListing(propertyId, unitId);
  if (!listing) notFound();

  const dictionary = getStaysDictionary(lang);
  const t = dictionary.detail;
  const search = parseStaySearch(await searchParams);
  const today = getTodayDate();
  const result = search.checkIn && search.checkOut ? quoteStay(listing, search, today) : null;
  const imageIds = await listPublicListingImageIds(propertyId).catch((error: unknown) => {
    console.error("Unable to load public stay images.", error);
    return [];
  });
  const title = getListingTitle(listing, dictionary);
  const included = [
    listing.utilities.electricity && t.electricity,
    listing.utilities.water && t.water,
    listing.utilities.internet && t.internet,
  ].filter((item): item is string => Boolean(item));
  const backQuery = new URLSearchParams({ guests: String(search.guests), pets: String(search.pets) });
  if (search.checkIn) backQuery.set("checkIn", search.checkIn);
  if (search.checkOut) backQuery.set("checkOut", search.checkOut);

  return (
    <div className={`${styles.container} ${styles.detailPage}`}>
      <p>
        <Link className={styles.textLink} href={`${getStaysPath(lang)}?${backQuery}`}>
          <ArrowLeft aria-hidden="true" size={15} /> {t.back}
        </Link>
      </p>
      <p className={styles.cardArea}>
        {[listing.city, listing.state].filter(Boolean).join(", ")} · {dictionary.types[listing.type]}
      </p>
      <h1 className={styles.cardTitle}>{title}</h1>
      <ListingFacts dictionary={dictionary} listing={listing} locale={lang} />

      {imageIds.length > 0 && (
        <div aria-label={formatText(t.gallery, { name: title })} className={styles.gallery} role="group">
          {imageIds.slice(0, 5).map((imageId, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              key={imageId}
              loading={index === 0 ? "eager" : "lazy"}
              src={getPublicStayImageUrl(propertyId, imageId, index === 0 ? "original" : "thumbnail")}
            />
          ))}
        </div>
      )}

      <div className={styles.detail}>
        <div>
          {listing.description && (
            <section className={styles.detailSection}>
              <h2>{t.about}</h2>
              <p className={styles.description}>{listing.description}</p>
            </section>
          )}
          <section className={styles.detailSection}>
            <p>{formatText(t.stayRange, { min: listing.minNights, max: listing.maxNights })}</p>
          </section>
          <section className={styles.detailSection}>
            <h2>{t.included}</h2>
            {included.length > 0 ? (
              <>
                <ul className={styles.chips}>
                  {included.map((item) => (
                    <li key={item}>
                      <Check aria-hidden="true" size={12} /> {item}
                    </li>
                  ))}
                </ul>
                <p>{t.includedNote}</p>
              </>
            ) : (
              <p>{t.noneIncluded}</p>
            )}
          </section>
          {listing.amenities.length > 0 && (
            <section className={styles.detailSection}>
              <h2>{t.amenities}</h2>
              <ul className={styles.chips}>
                {listing.amenities.map((amenity) => (
                  <li key={amenity}>{dictionary.amenities[amenity]}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <QuotePanel
            action={getStaysPath(lang, propertyId, unitId)}
            dictionary={dictionary}
            listing={listing}
            locale={lang}
            result={result}
            search={search}
            today={today}
          />
          {result?.ok ? (
            <InquiryForm
              labels={dictionary.inquiry}
              locale={lang}
              request={{
                propertyId,
                unitId,
                checkIn: search.checkIn,
                checkOut: search.checkOut,
                guests: search.guests,
                pets: search.pets,
              }}
            />
          ) : (
            <p className={styles.notice}>{dictionary.inquiry.needsQuote}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
