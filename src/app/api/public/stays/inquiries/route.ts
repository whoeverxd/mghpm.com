import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { getCatalogOrganizationId, getPublicListing } from "@/lib/stays/catalog";
import { formatText, getStaysDictionary, hasStaysLocale, pickStaysLocale } from "@/lib/stays/i18n";
import {
  createStayInquiry,
  hashClientAddress,
  StayInquiryRateLimitError,
} from "@/lib/stays/inquiries";
import { stayInquiryInputSchema } from "@/lib/stays/inquiry-schema";
import { getTodayDate, quoteStay } from "@/lib/stays/quote";

export const dynamic = "force-dynamic";

const MAX_INQUIRY_BODY_BYTES = 16 * 1024;

/** Public stay inquiry: origin check, honeypot, validation, server-side quote, hourly limit. */
export async function POST(request: Request) {
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
  // Reject foreign origins and oversized bodies before parsing anything.
  const headerDictionary = getStaysDictionary(pickStaysLocale(request.headers.get("accept-language")));
  if (!isSameOriginRequest(request)) return fail(headerDictionary.errors.forbidden, 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_INQUIRY_BODY_BYTES) {
    return fail(headerDictionary.errors.invalid, 413);
  }

  let body: unknown = null;
  if (request.headers.get("content-type")?.includes("application/json")) {
    body = await request.json().catch(() => null);
  }
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const locale = typeof record.locale === "string" && hasStaysLocale(record.locale) ? record.locale : "en";
  const dictionary = getStaysDictionary(locale);

  // Bots fill the hidden field; answer as if it worked and store nothing.
  if (typeof record.website === "string" && record.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = stayInquiryInputSchema.safeParse(body);
  if (!parsed.success) return fail(dictionary.errors.invalid, 400);
  const input = parsed.data;

  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return fail(dictionary.errors.notFound, 404);

  try {
    const listing = await getPublicListing(input.propertyId, input.unitId);
    if (!listing) return fail(dictionary.errors.notFound, 404);

    const result = quoteStay(listing, input, getTodayDate());
    if (!result.ok) {
      return fail(
        formatText(dictionary.issues[result.issue], {
          max: listing.maxGuests,
          count: result.issue === "max_nights" ? listing.maxNights : listing.minNights,
        }),
        409,
      );
    }

    await createStayInquiry(organizationId, input, listing, result.quote, hashClientAddress(request));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof StayInquiryRateLimitError) return fail(dictionary.errors.rateLimited, 429);
    console.error("Unable to save stay inquiry.", error);
    return fail(dictionary.errors.generic, 500);
  }
}
