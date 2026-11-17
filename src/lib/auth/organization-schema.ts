import { z } from "zod";

export const organizationRoleSchema = z.enum([
  "org_owner",
  "admin",
  "manager",
  "operations",
  "owner",
  "tenant",
  "applicant",
  "vendor",
  "guest",
]);

export type OrganizationRole = z.infer<typeof organizationRoleSchema>;
