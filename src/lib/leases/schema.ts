import { z } from "zod";
import { recordIdSchema } from "@/lib/properties/schema";
import { unitCurrencies } from "@/lib/properties/unit-schema";
import { isIsoDate } from "./terms";

export const leaseStatuses = [
  "draft",
  "pending",
  "active",
  "expired",
  "terminated",
  "cancelled",
] as const;
export const leaseSources = ["admin", "migration", "renewal"] as const;
export const leasePartyRoles = [
  "co_tenant",
  "spouse",
  "guarantor",
  "authorized_occupant",
  "minor_occupant",
] as const;
export const leaseRenewalTypes = ["manual", "fixed", "automatic", "month_to_month"] as const;
export const leaseNoticeDays = [30, 60, 90] as const;
export const leaseGraceDays = [0, 3, 5, 10] as const;
export const leaseLateFeeRules = ["percent_5", "flat", "none"] as const;
export const leaseUtilities = ["electricity", "water", "internet", "gas", "hoa"] as const;
export const leaseUtilityParties = [
  "tenant",
  "owner",
  "manager",
  "included",
  "shared",
  "na",
] as const;

export type LeaseStatus = (typeof leaseStatuses)[number];
export type LeaseSource = (typeof leaseSources)[number];
export type LeasePartyRole = (typeof leasePartyRoles)[number];
export type LeaseUtility = (typeof leaseUtilities)[number];
export type LeaseUtilityParty = (typeof leaseUtilityParties)[number];

export const MAX_LEASE_PARTIES = 8;

const optionalDate = z
  .string()
  .trim()
  .refine((value) => !value || isIsoDate(value), "Ingresa una fecha válida.");

const money = z
  .string()
  .trim()
  .regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Ingresa los montos con hasta dos decimales.");

function requiredRecordId(message: string) {
  return z.string().min(1, message).pipe(recordIdSchema);
}

const partySchema = z.object({
  role: z.enum(leasePartyRoles),
  name: z.string().trim().min(1, "Ingresa el nombre legal de cada parte adicional.").max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Ingresa un correo válido para las partes adicionales.",
    ),
});

const utilitySchema = z.object({
  party: z.enum(leaseUtilityParties),
  notes: z.string().trim().max(200),
});

/**
 * Lease form payload. Property, unit and primary tenant are always required;
 * a draft may leave term and rent incomplete, while `intent: "pending"`
 * (Create Lease) requires the full contractual core.
 */
export const leaseInputSchema = z
  .object({
    intent: z.enum(["draft", "pending"]),
    source: z.enum(leaseSources),
    renewOfLeaseId: z.union([z.literal(""), recordIdSchema]),
    propertyId: requiredRecordId("Selecciona la propiedad."),
    unitId: requiredRecordId("Selecciona la unidad."),
    tenantId: requiredRecordId("Selecciona el inquilino principal."),
    parties: z.array(partySchema).max(MAX_LEASE_PARTIES, "Admite hasta 8 partes adicionales."),
    startDate: optionalDate,
    endDate: optionalDate,
    possessionDate: optionalDate,
    moveInDate: optionalDate,
    renewalType: z.enum(leaseRenewalTypes),
    noticeDays: z.literal(leaseNoticeDays, "Selecciona el preaviso."),
    currency: z.enum(unitCurrencies),
    rent: money,
    dueDay: z.coerce
      .number()
      .int()
      .min(1, "El día de pago va del 1 al 28.")
      .max(28, "El día de pago va del 1 al 28."),
    graceDays: z.literal(leaseGraceDays, "Selecciona el período de gracia."),
    lateFeeRule: z.enum(leaseLateFeeRules),
    lateFeeFlat: money,
    firstRentDueDate: optionalDate,
    prorateFirstPeriod: z.boolean(),
    securityDeposit: money,
    additionalDeposit: money,
    petDeposit: money,
    advanceRent: money,
    otherChargeLabel: z.string().trim().max(80),
    otherCharge: money,
    collectFirstMonthRent: z.boolean(),
    utilities: z.object(
      Object.fromEntries(leaseUtilities.map((utility) => [utility, utilitySchema])) as Record<
        LeaseUtility,
        typeof utilitySchema
      >,
    ),
  })
  .superRefine((value, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: "custom", path: [path], message });

    if (value.source === "renewal" && !value.renewOfLeaseId) {
      issue("renewOfLeaseId", "Selecciona el contrato que se renueva.");
    }
    if (value.otherCharge && Number(value.otherCharge) > 0 && !value.otherChargeLabel) {
      issue("otherChargeLabel", "Describe el otro cargo inicial.");
    }
    if (value.startDate && value.endDate && value.endDate <= value.startDate) {
      issue("endDate", "La fecha de fin debe ser posterior a la de inicio.");
    }
    if (value.intent === "draft") return;

    if (!value.startDate) issue("startDate", "Ingresa la fecha de inicio.");
    if (!value.endDate) issue("endDate", "Ingresa la fecha de fin.");
    if (!value.rent || Number(value.rent) <= 0) {
      issue("rent", "Ingresa una renta mensual mayor que cero.");
    }
    if (value.lateFeeRule === "flat" && (!value.lateFeeFlat || Number(value.lateFeeFlat) <= 0)) {
      issue("lateFeeFlat", "Ingresa el monto fijo del recargo.");
    }
    if (value.firstRentDueDate && value.startDate && value.firstRentDueDate < value.startDate) {
      issue("firstRentDueDate", "El primer pago no puede ser anterior al inicio del contrato.");
    }
  });

export type LeaseInput = z.infer<typeof leaseInputSchema>;
export type LeaseFormValues = Omit<LeaseInput, "intent">;

export const leaseStatusActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate") }),
  z.object({
    action: z.literal("terminate"),
    reason: z.string().trim().min(1, "Indica el motivo de la terminación.").max(500),
    effectiveDate: z
      .string()
      .trim()
      .refine(isIsoDate, "Ingresa la fecha efectiva de terminación."),
  }),
  z.object({ action: z.literal("expire") }),
  z.object({
    action: z.literal("cancel"),
    reason: z.string().trim().min(1, "Indica el motivo de la cancelación.").max(500),
  }),
]);

export type LeaseStatusAction = z.infer<typeof leaseStatusActionSchema>;

const storedDate = z.string().nullable();

export const leaseDocumentSchema = z.object({
  code: z.string().min(1),
  status: z.enum(leaseStatuses),
  source: z.enum(leaseSources),
  renewOfLeaseId: z.string().nullable(),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  tenantId: z.string().min(1),
  propertyName: z.string(),
  unitLabel: z.string(),
  tenantName: z.string(),
  parties: z.array(
    z.object({ role: z.enum(leasePartyRoles), name: z.string(), email: z.string() }),
  ),
  startDate: storedDate,
  endDate: storedDate,
  possessionDate: storedDate,
  moveInDate: storedDate,
  renewalType: z.enum(leaseRenewalTypes),
  noticeDays: z.number().int(),
  currency: z.enum(unitCurrencies),
  rentMinor: z.number().int().nonnegative(),
  dueDay: z.number().int(),
  graceDays: z.number().int(),
  lateFeeRule: z.enum(leaseLateFeeRules),
  lateFeeFlatMinor: z.number().int().nonnegative(),
  firstRentDueDate: storedDate,
  prorateFirstPeriod: z.boolean(),
  securityDepositMinor: z.number().int().nonnegative(),
  additionalDepositMinor: z.number().int().nonnegative(),
  petDepositMinor: z.number().int().nonnegative(),
  advanceRentMinor: z.number().int().nonnegative(),
  otherChargeLabel: z.string(),
  otherChargeMinor: z.number().int().nonnegative(),
  collectFirstMonthRent: z.boolean(),
  utilities: z.record(z.enum(leaseUtilities), utilitySchema),
  closedOn: storedDate,
  closeReason: z.string().nullable(),
  filterKeys: z.array(z.string()),
  searchKeys: z.array(z.string()),
});

export type LeaseDocument = z.infer<typeof leaseDocumentSchema>;
