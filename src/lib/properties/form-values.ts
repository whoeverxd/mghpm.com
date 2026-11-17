import type { PropertyDocument, PropertyInput } from "./schema";
import { formatMinorUnitsAsDecimal, parseMoneyToMinorUnits } from "./unit-schema";

export const emptyPropertyFormValues: PropertyInput = {
  name: "",
  code: "",
  type: "residential",
  status: "draft",
  rentalCategory: "long_term",
  managementStartDate: "",
  description: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  location: null,
  currency: "USD",
  startingRent: "",
  securityDeposit: "",
  cleaningFee: "",
  electricityIncluded: false,
  electricityMeterRequired: false,
  waterIncluded: false,
  internetIncluded: false,
  electricityMeterNumber: "",
  initialMeterReading: "",
  electricityRatePerKwh: "",
  amenities: [],
};

function minorToInput(minor: number | null | undefined) {
  return minor === null || minor === undefined ? "" : formatMinorUnitsAsDecimal(minor);
}

function numberToInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function inputToNumber(value: string) {
  return value ? Number(value) : null;
}

export function getPropertyFormValues(property: PropertyDocument): PropertyInput {
  const financial = property.financialReference;
  const utilities = property.utilities;
  return {
    ...emptyPropertyFormValues,
    name: property.name,
    code: property.code,
    type: property.type,
    status: property.status,
    rentalCategory: property.rentalCategory ?? "long_term",
    managementStartDate: property.managementStartDate ?? "",
    description: property.description ?? "",
    address: property.address,
    city: property.city,
    state: property.state,
    postalCode: property.postalCode ?? "",
    country: property.country ?? "",
    location: property.location ?? null,
    currency: financial?.currency ?? "USD",
    startingRent: minorToInput(financial?.startingRentMinor),
    securityDeposit: minorToInput(financial?.securityDepositMinor),
    cleaningFee: minorToInput(financial?.cleaningFeeMinor),
    electricityIncluded: utilities?.electricityIncluded ?? false,
    electricityMeterRequired: utilities?.electricityMeterRequired ?? false,
    waterIncluded: utilities?.waterIncluded ?? false,
    internetIncluded: utilities?.internetIncluded ?? false,
    electricityMeterNumber: utilities?.electricityMeterNumber ?? "",
    initialMeterReading: numberToInput(utilities?.initialMeterReading),
    electricityRatePerKwh: numberToInput(utilities?.electricityRatePerKwh),
    amenities: property.amenities ?? [],
  };
}

/** Maps validated wizard input to the stored property fields (excluding indexes and counters). */
export function getPropertyDocumentFields(input: PropertyInput) {
  return {
    name: input.name,
    code: input.code,
    type: input.type,
    status: input.status,
    rentalCategory: input.rentalCategory,
    managementStartDate: input.managementStartDate || null,
    description: input.description,
    address: input.address,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country || null,
    location: input.location,
    financialReference: {
      currency: input.currency,
      startingRentMinor: parseMoneyToMinorUnits(input.startingRent),
      securityDepositMinor: parseMoneyToMinorUnits(input.securityDeposit),
      cleaningFeeMinor: parseMoneyToMinorUnits(input.cleaningFee),
    },
    utilities: {
      electricityIncluded: input.electricityIncluded,
      electricityMeterRequired: input.electricityMeterRequired,
      waterIncluded: input.waterIncluded,
      internetIncluded: input.internetIncluded,
      electricityMeterNumber: input.electricityMeterRequired ? input.electricityMeterNumber : "",
      initialMeterReading: input.electricityMeterRequired
        ? inputToNumber(input.initialMeterReading)
        : null,
      electricityRatePerKwh: inputToNumber(input.electricityRatePerKwh),
    },
    amenities: input.amenities,
  } satisfies Omit<
    PropertyDocument,
    | "unitCount"
    | "occupiedUnitCount"
    | "occupancyStatus"
    | "archived"
    | "searchName"
    | "filterKeys"
    | "searchKeys"
  >;
}
