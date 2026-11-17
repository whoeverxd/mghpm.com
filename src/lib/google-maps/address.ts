import { propertyCountries, type PropertyCountry } from "@/lib/properties/schema";

export type AddressComponentLike = {
  longText: string | null;
  shortText: string | null;
  types: string[];
};

export type ParsedPlaceAddress = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  /** Empty when Google returns a country outside the supported list. */
  country: PropertyCountry | "";
};

function pick(components: AddressComponentLike[], type: string, short = false) {
  const component = components.find((item) => item.types.includes(type));
  return (short ? component?.shortText : component?.longText) ?? "";
}

/**
 * Converts Places address components into the property address fields.
 * US addresses put the number first ("2501 Collins Ave"); Dominican ones after the street
 * ("Calle El Conde 105") and usually include the sector, which is appended to the line.
 */
export function parsePlaceAddress(
  components: AddressComponentLike[],
  fallbackLine: string,
): ParsedPlaceAddress {
  const countryCode = pick(components, "country", true).toUpperCase();
  const country = (propertyCountries as readonly string[]).includes(countryCode)
    ? (countryCode as PropertyCountry)
    : "";
  const streetNumber = pick(components, "street_number");
  const route = pick(components, "route");
  const premise = pick(components, "premise");
  const sector = pick(components, "sublocality_level_1") || pick(components, "neighborhood");

  let street = route
    ? country === "US"
      ? [streetNumber, route].filter(Boolean).join(" ")
      : [route, streetNumber].filter(Boolean).join(" ")
    : premise || fallbackLine;
  const city =
    pick(components, "locality") ||
    pick(components, "postal_town") ||
    pick(components, "administrative_area_level_2") ||
    sector;
  if (country !== "US" && sector && sector !== city && !street.includes(sector)) {
    street = `${street}, ${sector}`;
  }

  return {
    address: street.slice(0, 200),
    city: city.slice(0, 100),
    state: pick(components, "administrative_area_level_1").slice(0, 100),
    postalCode: pick(components, "postal_code").slice(0, 20),
    country,
  };
}
