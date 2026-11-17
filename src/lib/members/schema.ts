import { z } from "zod";
import { organizationRoleSchema } from "@/lib/auth/organization-schema";
import { recordIdSchema } from "@/lib/properties/schema";
import { portalLanes, staffRoles as storedStaffRoles } from "@/lib/access/membership";
import { staffRoles } from "./roles";

const staffRoleInputSchema = z.union([z.literal(""), z.enum(staffRoles)], {
  error: "Selecciona un rol válido.",
});
const portalPersonSchema = z.union([z.literal(""), recordIdSchema]);
const portalsInputSchema = z.object({ owner: portalPersonSchema, tenant: portalPersonSchema });

const hasAccess = (value: { staffRole: string; portals: { owner: string; tenant: string } }) =>
  value.staffRole !== "" || value.portals.owner !== "" || value.portals.tenant !== "";
const hasAccessIssue = {
  message: "Asigna un rol interno o al menos un portal.",
  path: ["staffRole"],
};

export const memberCreateInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Ingresa el correo electrónico.")
      .max(254)
      .pipe(z.email("Ingresa un correo electrónico válido.")),
    displayName: z.string().trim().min(1, "Ingresa el nombre.").max(120),
    staffRole: staffRoleInputSchema,
    portals: portalsInputSchema,
  })
  .refine(hasAccess, hasAccessIssue);

export type MemberCreateInput = z.infer<typeof memberCreateInputSchema>;

export const memberUpdateInputSchema = z
  .object({
    staffRole: staffRoleInputSchema,
    portals: portalsInputSchema,
    // Accepts every stored status so the current one can be echoed back; the service rejects
    // transitions out of statuses this screen does not manage.
    status: z.enum(["invited", "pending_verification", "active", "suspended", "disabled", "archived"]),
  })
  .refine(hasAccess, hasAccessIssue);

export type MemberUpdateInput = z.infer<typeof memberUpdateInputSchema>;

export const memberDocumentSchema = z.object({
  userUid: z.string().min(1),
  organizationId: z.string().min(1),
  // Legacy single role, replaced by staffRole + portals.
  role: organizationRoleSchema.optional(),
  staffRole: z.union([z.enum(storedStaffRoles), z.null()]).optional(),
  portals: z.array(z.enum(portalLanes)).optional(),
  portalPersonIds: z.partialRecord(z.enum(portalLanes), z.string()).optional(),
  status: z.enum(["invited", "pending_verification", "active", "suspended", "disabled", "archived"]),
  personId: z.string().nullable().optional(),
});

export type MemberDocument = z.infer<typeof memberDocumentSchema>;
