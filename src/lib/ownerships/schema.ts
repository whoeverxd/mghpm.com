import { z } from "zod";
import { recordIdSchema } from "@/lib/properties/schema";
import { isValidPct, ownershipChecks, ownershipStatuses, type OwnershipCheck } from "./rules";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida.");
const titleFieldSchema = z.string().trim().max(120);

const pctInputSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,2})?$/, "Ingresa un porcentaje con hasta dos decimales.")
  .transform(Number)
  .refine(isValidPct, "El porcentaje debe estar entre 0.01 y 100.");

const ownershipFieldsSchema = z.object({
  pct: pctInputSchema,
  startDate: dateSchema,
  titleOwner: titleFieldSchema,
  titleNumber: titleFieldSchema,
  registryNumber: titleFieldSchema,
  cadastralNumber: titleFieldSchema,
  registryAddress: z.string().trim().max(200),
});

export const ownershipInputSchema = ownershipFieldsSchema.extend({
  personId: recordIdSchema,
  propertyId: recordIdSchema,
});

export const ownershipChecksSchema = z.object(
  Object.fromEntries(ownershipChecks.map((check) => [check, z.boolean()])) as Record<
    OwnershipCheck,
    z.ZodBoolean
  >,
);

export const ownershipUpdateSchema = ownershipFieldsSchema.extend({
  checks: ownershipChecksSchema,
});

export const ownershipStatusInputSchema = z
  .object({
    to: z.enum(ownershipStatuses),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (value.to === "rejected" && (value.reason?.length ?? 0) < 3) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Indica el motivo del rechazo (mínimo 3 caracteres).",
      });
    }
  });

export const ownershipEndInputSchema = z.object({ endDate: dateSchema.optional() });

/** Parsed input: `pct` is already a number here. */
export type OwnershipInput = z.infer<typeof ownershipInputSchema>;
export type OwnershipUpdateInput = z.infer<typeof ownershipUpdateSchema>;
export type OwnershipStatusInput = z.infer<typeof ownershipStatusInputSchema>;

export const ownershipDocumentSchema = z.object({
  personId: z.string().min(1),
  propertyId: z.string().min(1),
  pct: z.number(),
  startDate: z.string(),
  titleOwner: z.string(),
  titleNumber: z.string(),
  registryNumber: z.string(),
  cadastralNumber: z.string(),
  registryAddress: z.string(),
  status: z.enum(ownershipStatuses),
  checks: ownershipChecksSchema,
  reviewerUid: z.string().nullable().optional(),
  reviewedAt: z.unknown().optional(),
  rejectionReason: z.string().nullable().optional(),
  active: z.boolean(),
  endedAt: z.unknown().optional(),
  organizationId: z.string(),
  createdBy: z.string(),
  updatedBy: z.string().optional(),
});

export type OwnershipDocument = z.infer<typeof ownershipDocumentSchema>;
