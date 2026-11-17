import "server-only";

import { createHash } from "node:crypto";
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { unitCurrencies } from "@/lib/properties/unit-schema";
import { staysLocales } from "./i18n";
import {
  stayInquiryStatuses,
  type StayInquiryInput,
  type StayInquiryStatus,
} from "./inquiry-schema";
import type { PublicListing } from "./listing";
import type { StayQuote } from "./quote";
import { auditEventFields } from "@/lib/audit/area";

export const STAY_INQUIRY_RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const INQUIRY_LIST_LIMIT = 200;

export class StayInquiryRateLimitError extends Error {
  constructor() {
    super("Too many inquiries from this client.");
    this.name = "StayInquiryRateLimitError";
  }
}

export class StayInquiryNotFoundError extends Error {
  constructor() {
    super("The inquiry does not exist.");
    this.name = "StayInquiryNotFoundError";
  }
}

const stayInquiryDocumentSchema = z.object({
  propertyId: z.string(),
  unitId: z.string(),
  listingTitle: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  nights: z.number().int(),
  guests: z.number().int(),
  pets: z.number().int(),
  quote: z.object({
    currency: z.enum(unitCurrencies),
    nightlyRateMinor: z.number().int(),
    nights: z.number().int(),
    cleaningFeeMinor: z.number().int(),
    totalMinor: z.number().int(),
  }),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  message: z.string(),
  locale: z.enum(staysLocales),
  status: z.enum(stayInquiryStatuses),
});

export type StayInquiry = z.infer<typeof stayInquiryDocumentSchema> & {
  id: string;
  createdAt: Date | null;
};

function getOrganizationReference(organizationId: string) {
  return getFirebaseAdminFirestore().collection("organizations").doc(organizationId);
}

/** SHA-256 of the client address; the raw IP is never stored. */
export function hashClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(address).digest("hex");
}

/** Saves the inquiry and counts it against the client's hourly limit in one transaction. */
export async function createStayInquiry(
  organizationId: string,
  input: StayInquiryInput,
  listing: PublicListing,
  quote: StayQuote,
  clientHash: string,
) {
  const db = getFirebaseAdminFirestore();
  const organization = getOrganizationReference(organizationId);
  const limitReference = organization.collection("inquiryRateLimits").doc(clientHash);
  const inquiryReference = organization.collection("stayInquiries").doc();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(limitReference);
    const now = Date.now();
    const stored = snapshot.data();
    const inWindow =
      typeof stored?.windowStart === "number" && now - stored.windowStart < RATE_WINDOW_MS;
    const count = inWindow ? Number(stored?.count ?? 0) : 0;
    if (count >= STAY_INQUIRY_RATE_LIMIT) throw new StayInquiryRateLimitError();

    transaction.set(limitReference, {
      windowStart: inWindow ? stored?.windowStart : now,
      count: count + 1,
    });
    const timestamp = FieldValue.serverTimestamp();
    transaction.create(inquiryReference, {
      propertyId: listing.propertyId,
      unitId: listing.unitId,
      listingTitle: `${listing.propertyName} — ${listing.unitLabel}`,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: quote.nights,
      guests: input.guests,
      pets: input.pets,
      quote: {
        currency: quote.currency,
        nightlyRateMinor: quote.nightlyRateMinor,
        nights: quote.nights,
        cleaningFeeMinor: quote.cleaningFeeMinor,
        totalMinor: quote.totalMinor,
      },
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      locale: input.locale,
      status: "new" satisfies StayInquiryStatus,
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  return inquiryReference.id;
}

/** Latest inquiries, newest first; filtered in memory to avoid a composite index. */
export async function listStayInquiries(organizationId: string) {
  const snapshot = await getOrganizationReference(organizationId)
    .collection("stayInquiries")
    .orderBy("createdAt", "desc")
    .limit(INQUIRY_LIST_LIMIT)
    .get();

  return snapshot.docs.flatMap((document): StayInquiry[] => {
    const parsed = stayInquiryDocumentSchema.safeParse(document.data());
    if (!parsed.success) {
      console.error("Skipping invalid stay inquiry.", { inquiryId: document.id, issues: parsed.error.issues });
      return [];
    }
    const createdAt = document.get("createdAt") as Timestamp | undefined;
    return [{ id: document.id, ...parsed.data, createdAt: createdAt?.toDate() ?? null }];
  });
}

export async function setStayInquiryStatus(
  organizationId: string,
  inquiryId: string,
  status: StayInquiryStatus,
  userUid: string,
) {
  const db = getFirebaseAdminFirestore();
  const organization = getOrganizationReference(organizationId);
  const inquiryReference = organization.collection("stayInquiries").doc(inquiryId);
  const auditReference = organization.collection("auditEvents").doc();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(inquiryReference);
    if (!snapshot.exists) throw new StayInquiryNotFoundError();
    const timestamp = FieldValue.serverTimestamp();
    transaction.update(inquiryReference, { status, updatedAt: timestamp, updatedBy: userUid });
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: "stay_inquiry.status_changed",
      actorUid: userUid,
      targetId: inquiryId,
      status,
      createdAt: timestamp,
    }));
  });
}
