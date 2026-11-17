import type { PropertyImageVariant } from "@/lib/properties/image-schema";
import type {
  PropertyAmenity,
  PropertyCountry,
  PropertyDocument,
} from "@/lib/properties/schema";
import type { PropertyType } from "@/lib/properties/search-index";
import type { UnitCurrency, UnitDocument } from "@/lib/properties/unit-schema";
import { getStayVisibilityIssue } from "./publishable.ts";

/** Everything the public catalog may show about a unit. Add fields here deliberately. */
export type PublicListing = {
  propertyId: string;
  unitId: string;
  propertyName: string;
  unitLabel: string;
  type: PropertyType;
  city: string;
  state: string;
  country: PropertyCountry | null;
  description: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  minNights: number;
  maxNights: number;
  nightlyRateMinor: number;
  cleaningFeeMinor: number;
  currency: UnitCurrency;
  petsAllowed: boolean;
  amenities: PropertyAmenity[];
  utilities: { electricity: boolean; water: boolean; internet: boolean };
  coverImageId: string | null;
};

/** Returns the public shape of a unit, or null when the unit must stay hidden. */
export function toPublicListing(
  propertyId: string,
  property: PropertyDocument,
  unitId: string,
  unit: UnitDocument,
): PublicListing | null {
  const stay = unit.stay;
  const financial = property.financialReference;
  if (
    getStayVisibilityIssue(property, unit) !== null ||
    !stay ||
    stay.nightlyRateMinor === null ||
    !financial
  ) {
    return null;
  }

  const amenities = property.amenities ?? [];
  return {
    propertyId,
    unitId,
    propertyName: property.name,
    unitLabel: unit.label,
    type: property.type,
    city: property.city,
    state: property.state,
    country: property.country ?? null,
    description: property.description ?? "",
    bedrooms: unit.bedrooms,
    beds: stay.beds,
    bathrooms: unit.bathrooms,
    maxGuests: stay.maxGuests,
    minNights: stay.minNights,
    maxNights: stay.maxNights,
    nightlyRateMinor: stay.nightlyRateMinor,
    cleaningFeeMinor: financial.cleaningFeeMinor ?? 0,
    currency: financial.currency,
    petsAllowed: amenities.includes("pet_friendly"),
    amenities,
    utilities: {
      electricity: property.utilities?.electricityIncluded ?? false,
      water: property.utilities?.waterIncluded ?? false,
      internet: property.utilities?.internetIncluded ?? false,
    },
    coverImageId: property.coverImageId ?? null,
  };
}

export function getPublicStayImageUrl(
  propertyId: string,
  imageId: string,
  variant: PropertyImageVariant,
) {
  return `/api/public/stays/images/${encodeURIComponent(propertyId)}/${encodeURIComponent(imageId)}?variant=${variant}`;
}
