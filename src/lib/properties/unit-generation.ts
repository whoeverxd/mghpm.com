import { z } from "zod";
import { normalizePropertySearch } from "./search-index";
import {
  parseMoneyToMinorUnits,
  unitCurrencies,
  unitInputSchema,
  type UnitCurrency,
} from "./unit-schema";

export const unitNumberingSchemes = ["numeric", "alphanumeric", "by_floor"] as const;
export type UnitNumberingScheme = (typeof unitNumberingSchemes)[number];

export const unitNumberingLabels: Record<UnitNumberingScheme, string> = {
  numeric: "Numérica (101, 102, 103…)",
  alphanumeric: "Alfanumérica (A, B, C…)",
  by_floor: "Por piso (101–104, 201–204…)",
};

/** Units one generation may create; the property total is still capped by MAX_UNITS_PER_PROPERTY. */
export const MAX_GENERATED_UNITS = 200;

const wholeNumber = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `Ingresa ${label}.` })
    .int(`${label[0].toUpperCase()}${label.slice(1)} debe ser un número entero.`)
    .min(min, `El mínimo para ${label} es ${min}.`)
    .max(max, `El máximo para ${label} es ${max}.`);

/**
 * Batch unit creation (Master 20 "Unit Creation Defaults" and the detail's
 * "Generar unidades"). Every field is always sent; the numbering scheme
 * decides which ones shape the labels.
 */
export const unitGenerationSchema = z
  .object({
    numbering: z.enum(unitNumberingSchemes),
    prefix: z
      .string()
      .trim()
      .max(12, "El prefijo admite hasta 12 caracteres.")
      .regex(/^[A-Za-z0-9 ._#-]*$/, "El prefijo admite letras, números, espacios, puntos y guiones."),
    count: wholeNumber("la cantidad de unidades", 1, MAX_GENERATED_UNITS),
    startNumber: wholeNumber("el número inicial", 0, 999_999),
    firstFloor: wholeNumber("el primer piso", 1, 200),
    floorCount: wholeNumber("la cantidad de pisos", 1, 200),
    unitsPerFloor: wholeNumber("las unidades por piso", 1, 99),
    floor: unitInputSchema.shape.floor,
    bedrooms: unitInputSchema.shape.bedrooms,
    bathrooms: unitInputSchema.shape.bathrooms,
    marketRent: unitInputSchema.shape.marketRent,
    marketRentCurrency: z.enum(unitCurrencies),
  })
  .superRefine((input, context) => {
    if (input.numbering !== "by_floor") return;
    const total = input.floorCount * input.unitsPerFloor;
    if (total > MAX_GENERATED_UNITS) {
      context.addIssue({
        code: "custom",
        path: ["unitsPerFloor"],
        message: `Pisos × unidades por piso suma ${total}; el máximo por generación es ${MAX_GENERATED_UNITS}.`,
      });
    }
    if (input.firstFloor + input.floorCount - 1 > 200) {
      context.addIssue({
        code: "custom",
        path: ["floorCount"],
        message: "El último piso no puede pasar de 200.",
      });
    }
  });

export type UnitGenerationInput = z.infer<typeof unitGenerationSchema>;

/** Form state for the generation fields; inputs keep strings until parsed. */
export type UnitGenerationFormValues = {
  numbering: UnitNumberingScheme;
  prefix: string;
  count: string;
  startNumber: string;
  firstFloor: string;
  floorCount: string;
  unitsPerFloor: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  marketRent: string;
  marketRentCurrency: UnitCurrency;
};

export function getDefaultUnitGenerationValues(
  overrides: Partial<UnitGenerationFormValues> = {},
): UnitGenerationFormValues {
  return {
    numbering: "numeric",
    prefix: "",
    count: "1",
    startNumber: "101",
    firstFloor: "1",
    floorCount: "1",
    unitsPerFloor: "4",
    floor: "",
    bedrooms: "1",
    bathrooms: "1",
    marketRent: "",
    marketRentCurrency: "USD",
    ...overrides,
  };
}

/** Spreadsheet-style letters: 0 → A, 25 → Z, 26 → AA. */
function toLetters(index: number) {
  let value = index + 1;
  let letters = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
}

/** Labels and floors in creation order. */
export function generateUnitLabels(
  input: Pick<
    UnitGenerationInput,
    "numbering" | "prefix" | "count" | "startNumber" | "firstFloor" | "floorCount" | "unitsPerFloor" | "floor"
  >,
): { label: string; floor: string }[] {
  if (input.numbering === "by_floor") {
    const units: { label: string; floor: string }[] = [];
    for (let floorIndex = 0; floorIndex < input.floorCount; floorIndex += 1) {
      const floor = input.firstFloor + floorIndex;
      for (let position = 1; position <= input.unitsPerFloor; position += 1) {
        units.push({
          label: `${input.prefix}${floor}${String(position).padStart(2, "0")}`,
          floor: String(floor),
        });
      }
    }
    return units;
  }

  return Array.from({ length: input.count }, (_, index) => ({
    label:
      input.numbering === "alphanumeric"
        ? `${input.prefix}${toLetters(index)}`
        : `${input.prefix}${input.startNumber + index}`,
    floor: input.floor,
  }));
}

/** Stored fields for each generated unit; every unit starts available. */
export function buildGeneratedUnitFields(input: UnitGenerationInput) {
  const marketRentMinor = parseMoneyToMinorUnits(input.marketRent);
  return generateUnitLabels(input).map(({ label, floor }) => ({
    label,
    labelKey: normalizePropertySearch(label),
    floor,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    status: "available" as const,
    marketRentMinor,
    marketRentCurrency: marketRentMinor === null ? null : input.marketRentCurrency,
  }));
}

/** Short human preview such as "101, 102, 103 … 120". */
export function describeGeneratedLabels(labels: string[]) {
  if (labels.length <= 6) return labels.join(", ");
  return `${labels.slice(0, 4).join(", ")} … ${labels.at(-1)}`;
}
