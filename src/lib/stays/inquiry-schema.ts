import { z } from "zod";
import { staysLocales } from "./i18n.ts";
import { STAY_DATE_PATTERN } from "./quote.ts";

export const stayInquiryStatuses = ["new", "contacted", "closed"] as const;
export type StayInquiryStatus = (typeof stayInquiryStatuses)[number];

const recordId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

/** Public request body. The quote is never taken from the client. */
export const stayInquiryInputSchema = z.object({
  propertyId: recordId,
  unitId: recordId,
  checkIn: z.string().regex(STAY_DATE_PATTERN),
  checkOut: z.string().regex(STAY_DATE_PATTERN),
  guests: z.number().int().min(1).max(30),
  pets: z.number().int().min(0).max(5),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[0-9+()\-.\s]+$/),
  message: z.string().trim().max(1000),
  consent: z.literal(true),
  locale: z.enum(staysLocales),
});

export type StayInquiryInput = z.infer<typeof stayInquiryInputSchema>;

export const stayInquiryStatusInputSchema = z.object({
  status: z.enum(stayInquiryStatuses),
});
