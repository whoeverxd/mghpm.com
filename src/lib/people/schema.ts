import { z } from "zod";
import { recordIdSchema } from "@/lib/properties/schema";
import { entityTypes, personKinds, relationshipTypes } from "./relationships";
import { personStatuses } from "./search-index";

const personFields = {
  name: z.string().trim().min(1, "Ingresa el nombre.").max(120),
  email: z
    .string()
    .trim()
    .min(1, "Ingresa el correo electrónico.")
    .max(254)
    .pipe(z.email("Ingresa un correo electrónico válido.")),
  phone: z
    .string()
    .trim()
    .max(30, "El teléfono admite hasta 30 caracteres.")
    .regex(/^[0-9+()\s.-]*$/, "Usa solo números, espacios y + ( ) . -"),
  status: z.enum(personStatuses),
};

const optionalRecordId = z.union([z.literal(""), recordIdSchema]).default("");

export const personInputSchema = z
  .object({
    kind: z.enum(personKinds),
    ...personFields,
    entityType: z.union([z.literal(""), z.enum(entityTypes)]).default(""),
    taxId: z.string().trim().max(30, "El RNC/EIN admite hasta 30 caracteres.").default(""),
    representativeId: optionalRecordId,
    contactName: z.string().trim().max(120).default(""),
    relationships: z.object({ owner: z.boolean(), tenant: z.boolean() }),
    tenantPropertyId: optionalRecordId,
    tenantUnitId: optionalRecordId,
  })
  .superRefine((value, context) => {
    if (!value.relationships.owner && !value.relationships.tenant) {
      context.addIssue({
        code: "custom",
        message: "Selecciona al menos una relación: propietario o inquilino.",
        path: ["relationships"],
      });
    }
    if (value.kind === "entity" && !value.entityType) {
      context.addIssue({
        code: "custom",
        message: "Selecciona el tipo de entidad.",
        path: ["entityType"],
      });
    }
    if (value.kind === "entity" && value.relationships.tenant) {
      context.addIssue({
        code: "custom",
        message: "Un inquilino debe ser una persona individual.",
        path: ["relationships"],
      });
    }
    if (value.tenantUnitId && !value.tenantPropertyId) {
      context.addIssue({
        code: "custom",
        message: "Selecciona la propiedad de la unidad.",
        path: ["tenantUnitId"],
      });
    }
  });

export type PersonInput = z.infer<typeof personInputSchema>;

export const personArchiveInputSchema = z.object({
  archived: z.boolean(),
});

const relationshipTimestamp = z.custom<Date | { toDate(): Date }>(
  (value) =>
    value instanceof Date ||
    (typeof value === "object" && value !== null && "toDate" in value),
);

const relationshipSchema = z.object({
  status: z.enum(["active", "ended"]),
  since: relationshipTimestamp,
  endedAt: relationshipTimestamp.nullable().optional(),
  propertyId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
});

/** Optional fields admit documents that have not been migrated yet. */
export const personDocumentSchema = z.object({
  type: z.enum(["owner", "tenant"]).optional(),
  kind: z.enum(personKinds).optional(),
  entityType: z.enum(entityTypes).nullable().optional(),
  taxId: z.string().nullable().optional(),
  representativeId: z.string().nullable().optional(),
  relationships: z.partialRecord(z.enum(relationshipTypes), relationshipSchema).optional(),
  relationshipTypes: z.array(z.enum(relationshipTypes)).optional(),
  name: z.string().min(1),
  email: z.string().min(1),
  emailKey: z.string().min(1),
  phone: z.string(),
  contactName: z.string(),
  propertyId: z.string().nullable(),
  unitId: z.string().nullable(),
  accountUid: z.string().nullable().optional(),
  // Firestore Timestamp; only used to date relationships of legacy documents.
  createdAt: z
    .custom<{ toDate: () => Date }>(
      (value) => typeof (value as { toDate?: unknown } | null)?.toDate === "function",
    )
    .optional(),
  status: z.enum(personStatuses),
  archived: z.boolean(),
  searchName: z.string().min(1),
  filterKeys: z.array(z.string()),
  searchKeys: z.array(z.string()),
});

export type PersonDocument = z.infer<typeof personDocumentSchema>;
