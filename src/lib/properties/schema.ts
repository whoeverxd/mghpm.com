import { z } from "zod";
import {
  propertyOccupancies,
  propertyStatuses,
  propertyTypes,
} from "./search-index";
import { unitCurrencies } from "./unit-schema";

export const recordIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

export const propertyCountries = ["DO", "US"] as const;
export const propertyRentalCategories = ["long_term", "short_term", "both"] as const;
export const propertyAmenities = [
  "pool",
  "parking",
  "bbq_area",
  "garden",
  "gym",
  "elevator",
  "security_24",
  "rooftop",
  "playground",
  "storage",
  "pet_friendly",
] as const;
export const propertyLocationSources = ["places", "pin"] as const;

export type PropertyCountry = (typeof propertyCountries)[number];
export type PropertyRentalCategory = (typeof propertyRentalCategories)[number];
export type PropertyAmenity = (typeof propertyAmenities)[number];

const propertyCountrySchema = z.enum(propertyCountries);
const moneyInputSchema = z
  .string()
  .trim()
  .regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Ingresa un monto con hasta dos decimales.");

export const propertyLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().max(512),
  source: z.enum(propertyLocationSources),
});

export type PropertyLocation = z.infer<typeof propertyLocationSchema>;

/**
 * Drafts only need identity fields; any other status also requires a complete address.
 */
export const propertyInputSchema = z
  .object({
    name: z.string().trim().min(1, "Ingresa el nombre de la propiedad.").max(120),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, "Ingresa un código interno.")
      .max(32)
      .regex(/^[A-Z0-9][A-Z0-9._-]*$/, "Usa letras, números, puntos, guiones o guiones bajos."),
    type: z.enum(propertyTypes),
    status: z.enum(propertyStatuses),
    rentalCategory: z.enum(propertyRentalCategories),
    managementStartDate: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Ingresa una fecha válida."),
    description: z.string().trim().max(2000, "La descripción admite hasta 2000 caracteres."),
    address: z.string().trim().max(200),
    city: z.string().trim().max(100),
    state: z.string().trim().max(100),
    postalCode: z.string().trim().max(20),
    country: z.union([propertyCountrySchema, z.literal("")]),
    location: propertyLocationSchema.nullable(),
    currency: z.enum(unitCurrencies),
    startingRent: moneyInputSchema,
    securityDeposit: moneyInputSchema,
    cleaningFee: moneyInputSchema,
    electricityIncluded: z.boolean(),
    electricityMeterRequired: z.boolean(),
    waterIncluded: z.boolean(),
    internetIncluded: z.boolean(),
    electricityMeterNumber: z.string().trim().max(40),
    initialMeterReading: z
      .string()
      .trim()
      .regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Ingresa la lectura con hasta dos decimales."),
    electricityRatePerKwh: z
      .string()
      .trim()
      .regex(/^(\d{1,6}(\.\d{1,4})?)?$/, "Ingresa la tarifa con hasta cuatro decimales."),
    amenities: z
      .array(z.enum(propertyAmenities))
      .max(propertyAmenities.length)
      .refine((list) => new Set(list).size === list.length, "Hay amenidades repetidas."),
  })
  .superRefine((input, context) => {
    if (input.status === "draft") return;
    const required: [keyof typeof input, string][] = [
      ["address", "Ingresa la dirección."],
      ["city", "Ingresa la ciudad."],
      ["state", "Ingresa la provincia o estado."],
      ["country", "Selecciona el país."],
    ];
    for (const [field, message] of required) {
      if (!input[field]) context.addIssue({ code: "custom", path: [field], message });
    }
  });

export type PropertyInput = z.infer<typeof propertyInputSchema>;

export const propertyDocumentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(propertyTypes),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string().optional(),
  country: propertyCountrySchema.nullable().optional(),
  unitCount: z.number().int().nonnegative(),
  occupiedUnitCount: z.number().int().nonnegative(),
  status: z.enum(propertyStatuses),
  occupancyStatus: z.enum(propertyOccupancies),
  archived: z.boolean(),
  searchName: z.string().min(1),
  filterKeys: z.array(z.string()),
  searchKeys: z.array(z.string()),
  // Wizard fields; optional so records created before them stay readable.
  rentalCategory: z.enum(propertyRentalCategories).optional(),
  managementStartDate: z.string().nullable().optional(),
  description: z.string().optional(),
  location: propertyLocationSchema.nullable().optional(),
  financialReference: z
    .object({
      currency: z.enum(unitCurrencies),
      startingRentMinor: z.number().int().nonnegative().nullable(),
      securityDepositMinor: z.number().int().nonnegative().nullable(),
      cleaningFeeMinor: z.number().int().nonnegative().nullable(),
    })
    .optional(),
  utilities: z
    .object({
      electricityIncluded: z.boolean(),
      electricityMeterRequired: z.boolean(),
      waterIncluded: z.boolean(),
      internetIncluded: z.boolean(),
      electricityMeterNumber: z.string(),
      initialMeterReading: z.number().nonnegative().nullable(),
      electricityRatePerKwh: z.number().nonnegative().nullable(),
    })
    .optional(),
  amenities: z.array(z.enum(propertyAmenities)).optional(),
  // Image gallery projection, maintained by src/lib/properties/images.ts.
  imageCount: z.number().int().nonnegative().optional(),
  coverImageId: z.string().nullable().optional(),
  // Ownership projection, maintained by src/lib/ownerships/records.ts.
  ownerPersonIds: z.array(z.string()).optional(),
  ownershipTotalPct: z.number().min(0).max(100).optional(),
});

export type PropertyDocument = z.infer<typeof propertyDocumentSchema>;
