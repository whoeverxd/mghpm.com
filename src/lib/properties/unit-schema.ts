import { z } from "zod";

export const unitStatuses = ["available", "occupied", "maintenance"] as const;
export const unitCurrencies = ["USD", "DOP"] as const;

export type UnitStatus = (typeof unitStatuses)[number];
export type UnitCurrency = (typeof unitCurrencies)[number];

export const MAX_UNITS_PER_PROPERTY = 500;

export const MAX_STAY_GUESTS = 30;
export const MAX_STAY_NIGHTS = 365;

const stayCountSchema = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `Ingresa ${label}.` })
    .int(`Revisa ${label}.`)
    .min(min, `Revisa ${label}.`)
    .max(max, `Revisa ${label}.`);

/** Short-stay configuration typed in the unit form (strings from inputs). */
export const unitStayInputSchema = z
  .object({
    published: z.boolean(),
    nightlyRate: z
      .string()
      .trim()
      .regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Ingresa la tarifa con hasta dos decimales."),
    maxGuests: stayCountSchema("la capacidad de huéspedes", 1, MAX_STAY_GUESTS),
    beds: stayCountSchema("la cantidad de camas", 0, MAX_STAY_GUESTS),
    minNights: stayCountSchema("la estancia mínima", 1, MAX_STAY_NIGHTS),
    maxNights: stayCountSchema("la estancia máxima", 1, MAX_STAY_NIGHTS),
  })
  .refine((stay) => stay.minNights <= stay.maxNights, {
    path: ["maxNights"],
    message: "La estancia máxima no puede ser menor que la mínima.",
  })
  .refine((stay) => !stay.published || Number(stay.nightlyRate) > 0, {
    path: ["nightlyRate"],
    message: "Ingresa una tarifa por noche mayor que cero para publicar la unidad.",
  });

export type UnitStayInput = z.infer<typeof unitStayInputSchema>;

export const unitStayDocumentSchema = z.object({
  published: z.boolean(),
  nightlyRateMinor: z.number().int().nonnegative().nullable(),
  maxGuests: z.number().int().min(1),
  beds: z.number().int().nonnegative(),
  minNights: z.number().int().min(1),
  maxNights: z.number().int().min(1),
});

export type UnitStayDocument = z.infer<typeof unitStayDocumentSchema>;

export function toUnitStayDocument(input: UnitStayInput): UnitStayDocument {
  return {
    published: input.published,
    nightlyRateMinor: parseMoneyToMinorUnits(input.nightlyRate),
    maxGuests: input.maxGuests,
    beds: input.beds,
    minNights: input.minNights,
    maxNights: input.maxNights,
  };
}

export const unitInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Ingresa la identificación de la unidad.")
    .max(32, "La identificación admite hasta 32 caracteres."),
  floor: z.string().trim().max(16, "El piso admite hasta 16 caracteres."),
  bedrooms: z.coerce
    .number({ error: "Ingresa la cantidad de habitaciones." })
    .int("Las habitaciones deben ser un número entero.")
    .min(0, "Las habitaciones no pueden ser negativas.")
    .max(50, "Revisa la cantidad de habitaciones."),
  bathrooms: z.coerce
    .number({ error: "Ingresa la cantidad de baños." })
    .min(0, "Los baños no pueden ser negativos.")
    .max(50, "Revisa la cantidad de baños.")
    .multipleOf(0.5, "Los baños se registran en incrementos de 0.5."),
  status: z.enum(unitStatuses),
  marketRent: z
    .string()
    .trim()
    .regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Ingresa la renta con hasta dos decimales."),
  marketRentCurrency: z.enum(unitCurrencies),
  /** Omitted by clients that do not edit short stays; the stored value stays as is. */
  stay: unitStayInputSchema.optional(),
});

export type UnitInput = z.infer<typeof unitInputSchema>;

export const unitArchiveInputSchema = z.object({
  archived: z.boolean(),
});

export const unitDocumentSchema = z.object({
  label: z.string().min(1),
  labelKey: z.string().min(1),
  floor: z.string(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().nonnegative(),
  status: z.enum(unitStatuses),
  marketRentMinor: z.number().int().nonnegative().nullable(),
  marketRentCurrency: z.enum(unitCurrencies).nullable(),
  archived: z.boolean(),
  /** Set while an active lease occupies the unit; leases own its occupancy. */
  activeLeaseId: z.string().nullable().optional(),
  stay: unitStayDocumentSchema.optional(),
});

export type UnitDocument = z.infer<typeof unitDocumentSchema>;

/** Converts a validated decimal string such as "1250.5" to integer minor units. */
export function parseMoneyToMinorUnits(value: string) {
  if (!value) return null;
  const [whole = "0", fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function formatMinorUnitsAsDecimal(minor: number) {
  const whole = Math.floor(minor / 100);
  const fraction = String(minor % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}
