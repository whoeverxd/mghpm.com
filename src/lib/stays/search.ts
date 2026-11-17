import { z } from "zod";
import { propertyTypes } from "../properties/search-index.ts";
import type { PublicListing } from "./listing.ts";
import { countNights, quoteStay, STAY_DATE_PATTERN, type StayQuote } from "./quote.ts";

export const staySortOptions = ["recommended", "price_asc", "price_desc", "bedrooms", "guests"] as const;
export type StaySort = (typeof staySortOptions)[number];

// Every field falls back to its default, so a hand-edited URL never breaks the page.
const staySearchSchema = z.object({
  area: z.string().trim().max(100).catch(""),
  checkIn: z.string().regex(STAY_DATE_PATTERN).catch(""),
  checkOut: z.string().regex(STAY_DATE_PATTERN).catch(""),
  guests: z.coerce.number().int().min(1).max(30).catch(1),
  pets: z.coerce.number().int().min(0).max(5).catch(0),
  maxPrice: z.coerce.number().int().min(1).max(10_000_000).nullable().catch(null),
  type: z.enum(propertyTypes).nullable().catch(null),
  bedrooms: z.coerce.number().int().min(0).max(50).catch(0),
  baths: z.coerce.number().min(0).max(50).catch(0),
  // Drop unknown values one by one so a bad entry does not clear the valid filters.
  amenities: z
    .array(z.string())
    .catch([])
    .transform((list) => list.filter((value) => /^[a-z0-9_]{1,40}$/.test(value)).slice(0, 20)),
  sort: z.enum(staySortOptions).catch("recommended"),
  // "Favorites" view: only the stays saved in the visitor's cookie.
  saved: z.literal("1").transform(() => true).catch(false),
});

export type StaySearch = z.infer<typeof staySearchSchema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseStaySearch(raw: RawSearchParams): StaySearch {
  const first = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return staySearchSchema.parse({
    area: first("area"),
    checkIn: first("checkIn"),
    checkOut: first("checkOut"),
    guests: first("guests"),
    pets: first("pets"),
    maxPrice: first("maxPrice"),
    type: first("type"),
    bedrooms: first("bedrooms"),
    baths: first("baths"),
    amenities: raw.amenities === undefined ? [] : [raw.amenities].flat(),
    sort: first("sort"),
    saved: first("saved"),
  });
}

export type StaySearchResult = {
  areas: string[];
  nights: number | null;
  datesIssue: "invalid_dates" | "past_dates" | null;
  available: { listing: PublicListing; quote: StayQuote | null }[];
  unavailable: { listing: PublicListing; issue: "min_nights" | "max_nights" }[];
};

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

function normalizeArea(value: string) {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

function compareByName(left: PublicListing, right: PublicListing) {
  return (
    collator.compare(left.propertyName, right.propertyName) ||
    collator.compare(left.unitLabel, right.unitLabel)
  );
}

const comparators: Record<StaySort, (left: PublicListing, right: PublicListing) => number> = {
  recommended: compareByName,
  price_asc: (left, right) => left.nightlyRateMinor - right.nightlyRateMinor || compareByName(left, right),
  price_desc: (left, right) => right.nightlyRateMinor - left.nightlyRateMinor || compareByName(left, right),
  bedrooms: (left, right) => right.bedrooms - left.bedrooms || compareByName(left, right),
  guests: (left, right) => right.maxGuests - left.maxGuests || compareByName(left, right),
};

export function searchStays(
  listings: PublicListing[],
  search: StaySearch,
  today: string,
  favorites: ReadonlySet<string> = new Set(),
): StaySearchResult {
  const areas = [...new Set(listings.map((listing) => listing.city).filter(Boolean))].sort(
    collator.compare,
  );
  const area = normalizeArea(search.area);
  const matches = listings.filter(
    (listing) =>
      (!area || normalizeArea(listing.city) === area) &&
      (!search.type || listing.type === search.type) &&
      listing.bedrooms >= search.bedrooms &&
      listing.bathrooms >= search.baths &&
      search.amenities.every((amenity) => (listing.amenities as string[]).includes(amenity)) &&
      (search.maxPrice === null || listing.nightlyRateMinor <= search.maxPrice * 100) &&
      listing.maxGuests >= search.guests &&
      (search.pets === 0 || listing.petsAllowed) &&
      (!search.saved || favorites.has(`${listing.propertyId}/${listing.unitId}`)),
  );

  let nights: number | null = null;
  let datesIssue: StaySearchResult["datesIssue"] = null;
  if (search.checkIn && search.checkOut) {
    nights = countNights(search.checkIn, search.checkOut);
    if (nights === null) datesIssue = "invalid_dates";
    else if (search.checkIn < today) {
      datesIssue = "past_dates";
      nights = null;
    }
  }

  const available: StaySearchResult["available"] = [];
  const unavailable: StaySearchResult["unavailable"] = [];
  for (const listing of matches) {
    if (nights === null) {
      available.push({ listing, quote: null });
      continue;
    }
    const result = quoteStay(listing, search, today);
    if (result.ok) available.push({ listing, quote: result.quote });
    else if (result.issue === "min_nights" || result.issue === "max_nights") {
      unavailable.push({ listing, issue: result.issue });
    }
  }

  const compare = comparators[search.sort];
  available.sort((left, right) => compare(left.listing, right.listing));
  unavailable.sort((left, right) => compareByName(left.listing, right.listing));
  return { areas, nights, datesIssue, available, unavailable };
}
