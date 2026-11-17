# Explore Stays — Catálogo público (Subproyecto A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catálogo público bilingüe (`/es/stays`, `/en/stays`) de unidades para estancias cortas, con ficha y cotización, solicitudes de reserva guardadas en Firestore y una bandeja para el staff.

**Architecture:** La lógica de dominio vive en módulos puros de `src/lib/stays/`: visibilidad, forma pública, cotización, búsqueda, i18n y esquema de solicitudes. Se prueban con `node --test`. Un módulo `server-only` lee Firestore con el Admin SDK para la organización `PUBLIC_CATALOG_ORGANIZATION_ID` y pasa los datos por `toPublicListing`, el único punto que decide qué campos son públicos. Las páginas son Server Components con formularios `GET`. Las solicitudes entran por una ruta pública con verificación de origen, honeypot y límite por IP.

**Tech Stack:** Next.js 16.4 (App Router, Turbopack), React 19, TypeScript, zod 4, Firebase Admin (Firestore), CSS Modules, lucide-react, `node:test` (Node 24, type stripping) y los e2e existentes en `scripts/e2e/*.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-07-explore-stays-catalog-design.md`

**Commits:** el usuario hace commit solo cuando lo pide, y casi todo el código previo sigue sin commitear en `main`. Por eso cada tarea termina con un punto de control (typecheck, lint y tests) en lugar de un commit.

---

## Mapa de archivos

**Crear**
- `src/lib/stays/publishable.ts`: reglas de configuración y visibilidad (puro).
- `src/lib/stays/listing.ts`: tipo `PublicListing`, `toPublicListing` y la URL de imágenes públicas (puro).
- `src/lib/stays/quote.ts`: noches y cotización (puro).
- `src/lib/stays/search.ts`: parseo de parámetros, filtros y orden (puro).
- `src/lib/stays/i18n.ts`: diccionarios ES/EN y formato (puro, usable en cliente).
- `src/lib/stays/inquiry-schema.ts`: esquemas zod de solicitudes (puro).
- `src/lib/stays/catalog.ts`: lectura de Firestore para el catálogo (server-only).
- `src/lib/stays/inquiries.ts`: crear, listar y cambiar el estado de solicitudes (server-only).
- `src/lib/stays/*.test.ts`: pruebas unitarias.
- `src/components/stays/stays.module.css`, `stays-header.tsx`, `language-switch.tsx`, `search-form.tsx`, `listing-card.tsx`, `quote-panel.tsx`, `inquiry-form.tsx` e `inquiry-status-buttons.tsx`.
- `src/app/stays/page.tsx`: redirección por idioma.
- `src/app/[lang]/stays/layout.tsx`, `page.tsx`, `not-found.tsx` y `[propertyId]/[unitId]/page.tsx`.
- `src/app/api/public/stays/images/[propertyId]/[imageId]/route.ts`.
- `src/app/api/public/stays/inquiries/route.ts`.
- `src/app/api/stay-inquiries/[inquiryId]/route.ts`.
- `src/app/stay-inquiries/page.tsx`.
- `scripts/e2e/stays.mjs`.

**Modificar**
- `tsconfig.json`, `package.json`, `.env.example` y `README.md`.
- `src/lib/properties/unit-schema.ts`, `units.ts`, `unit-api.ts` y `labels.ts`.
- `src/components/properties/unit-form.tsx`.
- `src/app/properties/[propertyId]/units/new/page.tsx`, `.../[unitId]/edit/page.tsx`, `src/app/properties/[propertyId]/page.tsx` y `detail.module.css`.
- `src/components/layout/admin-shell.tsx`.
- `src/components/landing/landing-page.tsx`.
- `scripts/e2e/images.mjs`, que hoy lee del bucket aunque las imágenes ya se guardan en disco local.

---

### Task 1: Runner de pruebas unitarias

**Files:**
- Modify: `tsconfig.json`
- Modify: `package.json`
- Create: `src/lib/stays/smoke.test.ts` (se borra al final de la tarea)

Node 24 ejecuta `.ts` con *type stripping*. Los módulos puros se importan entre sí con la extensión `.ts`, y los tipos de `@/…` solo se importan con `import type`, que se borra al ejecutar.

- [ ] **Step 1: Permitir imports con extensión `.ts`**

En `tsconfig.json`, dentro de `compilerOptions`, después de `"noEmit": true,`:

```json
    "allowImportingTsExtensions": true,
```

- [ ] **Step 2: Agregar el script**

En `package.json`, dentro de `"scripts"`, después de `"typecheck": "tsc --noEmit",`:

```json
    "test:unit": "node --test \"src/lib/stays/*.test.ts\"",
```

- [ ] **Step 3: Prueba de humo**

`src/lib/stays/smoke.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

test("node runs TypeScript tests", () => {
  const value: number = 1 + 1;
  assert.equal(value, 2);
});
```

Run: `npm run test:unit`
Expected: `# pass 1`, `# fail 0`.

- [ ] **Step 4: Borrar la prueba de humo y verificar**

Borra `src/lib/stays/smoke.test.ts`.
Run: `npm run typecheck`
Expected: sin errores.

---

### Task 2: Campos de estancia en la unidad (esquema)

**Files:**
- Modify: `src/lib/properties/unit-schema.ts`
- Test: `src/lib/stays/stay-input.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/stays/stay-input.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { toUnitStayDocument, unitStayInputSchema } from "../properties/unit-schema.ts";

const valid = {
  published: true,
  nightlyRate: "150.50",
  maxGuests: "4",
  beds: "2",
  minNights: "2",
  maxNights: "28",
};

test("a complete stay converts the rate to minor units", () => {
  const parsed = unitStayInputSchema.parse(valid);
  assert.deepEqual(toUnitStayDocument(parsed), {
    published: true,
    nightlyRateMinor: 15050,
    maxGuests: 4,
    beds: 2,
    minNights: 2,
    maxNights: 28,
  });
});

test("publishing requires a nightly rate", () => {
  assert.equal(unitStayInputSchema.safeParse({ ...valid, nightlyRate: "" }).success, false);
});

test("an unpublished stay may omit the rate", () => {
  const parsed = unitStayInputSchema.parse({ ...valid, published: false, nightlyRate: "" });
  assert.equal(toUnitStayDocument(parsed).nightlyRateMinor, null);
});

test("maximum nights cannot be below the minimum", () => {
  assert.equal(
    unitStayInputSchema.safeParse({ ...valid, minNights: "5", maxNights: "3" }).success,
    false,
  );
});

test("guest capacity stays between 1 and 30", () => {
  assert.equal(unitStayInputSchema.safeParse({ ...valid, maxGuests: "0" }).success, false);
  assert.equal(unitStayInputSchema.safeParse({ ...valid, maxGuests: "31" }).success, false);
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL con un error de import (`toUnitStayDocument` o `unitStayInputSchema` no existen).

- [ ] **Step 3: Implementar**

En `src/lib/properties/unit-schema.ts`, después de `export const MAX_UNITS_PER_PROPERTY = 500;`:

```ts
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
  .refine((stay) => !stay.published || stay.nightlyRate !== "", {
    path: ["nightlyRate"],
    message: "Ingresa la tarifa por noche para publicar la unidad.",
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
```

En `unitInputSchema`, después de `marketRentCurrency: z.enum(unitCurrencies),`:

```ts
  /** Omitted by clients that do not edit short stays; the stored value stays as is. */
  stay: unitStayInputSchema.optional(),
```

En `unitDocumentSchema`, después de `activeLeaseId: …`:

```ts
  stay: unitStayDocumentSchema.optional(),
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm run test:unit`
Expected: 5 pass, 0 fail.

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`
Expected: sin errores.

---

### Task 3: Reglas de configuración y visibilidad

**Files:**
- Create: `src/lib/stays/publishable.ts`
- Test: `src/lib/stays/publishable.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/stays/publishable.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { getStayConfigurationIssue, getStayVisibilityIssue } from "./publishable.ts";

const property = {
  status: "active" as const,
  archived: false,
  rentalCategory: "short_term" as const,
  financialReference: {
    currency: "USD" as const,
    startingRentMinor: null,
    securityDepositMinor: null,
    cleaningFeeMinor: 8000,
  },
};
const unit = {
  archived: false,
  status: "available" as const,
  activeLeaseId: null,
  stay: { published: true, nightlyRateMinor: 15000, maxGuests: 4, beds: 2, minNights: 2, maxNights: 28 },
};

test("a complete published unit is visible", () => {
  assert.equal(getStayVisibilityIssue(property, unit), null);
});

test("long-term properties cannot configure stays", () => {
  assert.equal(getStayConfigurationIssue({ ...property, rentalCategory: "long_term" }), "not_short_term");
  assert.equal(getStayConfigurationIssue({ ...property, rentalCategory: "both" }), null);
});

test("properties without a currency cannot configure stays", () => {
  assert.equal(getStayConfigurationIssue({ ...property, financialReference: undefined }), "no_currency");
});

test("each blocking condition is reported", () => {
  assert.equal(getStayVisibilityIssue({ ...property, status: "draft" }, unit), "property_inactive");
  assert.equal(getStayVisibilityIssue({ ...property, archived: true }, unit), "property_archived");
  assert.equal(getStayVisibilityIssue(property, { ...unit, archived: true }), "unit_archived");
  assert.equal(getStayVisibilityIssue(property, { ...unit, activeLeaseId: "lease-1" }), "unit_leased");
  assert.equal(getStayVisibilityIssue(property, { ...unit, status: "maintenance" }), "unit_unavailable");
  assert.equal(getStayVisibilityIssue(property, { ...unit, stay: undefined }), "not_published");
  assert.equal(
    getStayVisibilityIssue(property, { ...unit, stay: { ...unit.stay, published: false } }),
    "not_published",
  );
  assert.equal(
    getStayVisibilityIssue(property, { ...unit, stay: { ...unit.stay, nightlyRateMinor: null } }),
    "no_rate",
  );
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./publishable.ts`.

- [ ] **Step 3: Implementar**

`src/lib/stays/publishable.ts`:

```ts
import type { PropertyDocument } from "@/lib/properties/schema";
import type { UnitDocument } from "@/lib/properties/unit-schema";

export type StayConfigurationIssue = "not_short_term" | "no_currency";
export type StayVisibilityIssue =
  | StayConfigurationIssue
  | "property_inactive"
  | "property_archived"
  | "unit_archived"
  | "unit_leased"
  | "unit_unavailable"
  | "not_published"
  | "no_rate";

type StayProperty = Pick<
  PropertyDocument,
  "status" | "archived" | "rentalCategory" | "financialReference"
>;
type StayUnit = Pick<UnitDocument, "archived" | "status" | "activeLeaseId" | "stay">;

/** Whether the property can carry short-stay listings at all. */
export function getStayConfigurationIssue(
  property: Pick<StayProperty, "rentalCategory" | "financialReference">,
): StayConfigurationIssue | null {
  if (property.rentalCategory !== "short_term" && property.rentalCategory !== "both") {
    return "not_short_term";
  }
  if (!property.financialReference?.currency) return "no_currency";
  return null;
}

/**
 * The single rule for public visibility, shared by the catalog, the public
 * image route and the inquiry API. Returns why a unit is hidden, or null.
 */
export function getStayVisibilityIssue(
  property: StayProperty,
  unit: StayUnit,
): StayVisibilityIssue | null {
  const configurationIssue = getStayConfigurationIssue(property);
  if (configurationIssue) return configurationIssue;
  if (property.status !== "active") return "property_inactive";
  if (property.archived) return "property_archived";
  if (unit.archived) return "unit_archived";
  if (unit.activeLeaseId) return "unit_leased";
  if (unit.status !== "available") return "unit_unavailable";
  if (!unit.stay?.published) return "not_published";
  if (unit.stay.nightlyRateMinor === null) return "no_rate";
  return null;
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm run test:unit`
Expected: todas pasan.

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 4: Forma pública del anuncio

**Files:**
- Create: `src/lib/stays/listing.ts`
- Test: `src/lib/stays/listing.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/stays/listing.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { getPublicStayImageUrl, toPublicListing } from "./listing.ts";

const property = {
  name: "Torre Norte",
  code: "TN-1",
  type: "apartment_condo" as const,
  address: "Av. Anacaona 10",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO" as const,
  unitCount: 1,
  occupiedUnitCount: 0,
  status: "active" as const,
  occupancyStatus: "vacant" as const,
  archived: false,
  searchName: "torre norte",
  filterKeys: [],
  searchKeys: [],
  rentalCategory: "short_term" as const,
  description: "Vista al mar.",
  location: { lat: 18.45, lng: -69.95, placeId: "abc", source: "places" as const },
  financialReference: {
    currency: "USD" as const,
    startingRentMinor: 120000,
    securityDepositMinor: 50000,
    cleaningFeeMinor: 8000,
  },
  utilities: {
    electricityIncluded: true,
    electricityMeterRequired: true,
    waterIncluded: true,
    internetIncluded: false,
    electricityMeterNumber: "M-123",
    initialMeterReading: 100,
    electricityRatePerKwh: 0.2,
  },
  amenities: ["pool" as const, "pet_friendly" as const],
  coverImageId: "img-1",
};
const unit = {
  label: "101",
  labelKey: "101",
  floor: "1",
  bedrooms: 2,
  bathrooms: 1.5,
  status: "available" as const,
  marketRentMinor: 120050,
  marketRentCurrency: "USD" as const,
  archived: false,
  activeLeaseId: null,
  stay: { published: true, nightlyRateMinor: 15000, maxGuests: 4, beds: 3, minNights: 2, maxNights: 28 },
};

test("maps a publishable unit to public fields only", () => {
  const listing = toPublicListing("prop-1", property, "unit-1", unit);
  assert.deepEqual(listing, {
    propertyId: "prop-1",
    unitId: "unit-1",
    propertyName: "Torre Norte",
    unitLabel: "101",
    type: "apartment_condo",
    city: "Santo Domingo",
    state: "Distrito Nacional",
    country: "DO",
    description: "Vista al mar.",
    bedrooms: 2,
    beds: 3,
    bathrooms: 1.5,
    maxGuests: 4,
    minNights: 2,
    maxNights: 28,
    nightlyRateMinor: 15000,
    cleaningFeeMinor: 8000,
    currency: "USD",
    petsAllowed: true,
    amenities: ["pool", "pet_friendly"],
    utilities: { electricity: true, water: true, internet: false },
    coverImageId: "img-1",
  });
  const serialized = JSON.stringify(listing);
  for (const secret of ["Anacaona", "TN-1", "M-123", "120050", "50000", "18.45"]) {
    assert.equal(serialized.includes(secret), false, `leaked ${secret}`);
  }
});

test("returns null for a hidden unit", () => {
  assert.equal(toPublicListing("p", property, "u", { ...unit, archived: true }), null);
});

test("builds the public image URL", () => {
  assert.equal(
    getPublicStayImageUrl("p 1", "i/2", "thumbnail"),
    "/api/public/stays/images/p%201/i%2F2?variant=thumbnail",
  );
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./listing.ts`.

- [ ] **Step 3: Implementar**

`src/lib/stays/listing.ts`:

```ts
import type { PropertyImageVariant } from "@/lib/properties/image-schema";
import type {
  PropertyAmenity,
  PropertyCountry,
  PropertyDocument,
} from "@/lib/properties/schema";
import type { PropertyType } from "@/lib/properties/search-index";
import type { UnitCurrency, UnitDocument } from "@/lib/properties/unit-schema";
import { getStayVisibilityIssue } from "./publishable.ts";

/** Everything the public catalog may show about a unit. Add fields here deliberately. */
export type PublicListing = {
  propertyId: string;
  unitId: string;
  propertyName: string;
  unitLabel: string;
  type: PropertyType;
  city: string;
  state: string;
  country: PropertyCountry | null;
  description: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  minNights: number;
  maxNights: number;
  nightlyRateMinor: number;
  cleaningFeeMinor: number;
  currency: UnitCurrency;
  petsAllowed: boolean;
  amenities: PropertyAmenity[];
  utilities: { electricity: boolean; water: boolean; internet: boolean };
  coverImageId: string | null;
};

/** Returns the public shape of a unit, or null when the unit must stay hidden. */
export function toPublicListing(
  propertyId: string,
  property: PropertyDocument,
  unitId: string,
  unit: UnitDocument,
): PublicListing | null {
  const stay = unit.stay;
  const financial = property.financialReference;
  if (
    getStayVisibilityIssue(property, unit) !== null ||
    !stay ||
    stay.nightlyRateMinor === null ||
    !financial
  ) {
    return null;
  }

  const amenities = property.amenities ?? [];
  return {
    propertyId,
    unitId,
    propertyName: property.name,
    unitLabel: unit.label,
    type: property.type,
    city: property.city,
    state: property.state,
    country: property.country ?? null,
    description: property.description ?? "",
    bedrooms: unit.bedrooms,
    beds: stay.beds,
    bathrooms: unit.bathrooms,
    maxGuests: stay.maxGuests,
    minNights: stay.minNights,
    maxNights: stay.maxNights,
    nightlyRateMinor: stay.nightlyRateMinor,
    cleaningFeeMinor: financial.cleaningFeeMinor ?? 0,
    currency: financial.currency,
    petsAllowed: amenities.includes("pet_friendly"),
    amenities,
    utilities: {
      electricity: property.utilities?.electricityIncluded ?? false,
      water: property.utilities?.waterIncluded ?? false,
      internet: property.utilities?.internetIncluded ?? false,
    },
    coverImageId: property.coverImageId ?? null,
  };
}

export function getPublicStayImageUrl(
  propertyId: string,
  imageId: string,
  variant: PropertyImageVariant,
) {
  return `/api/public/stays/images/${encodeURIComponent(propertyId)}/${encodeURIComponent(imageId)}?variant=${variant}`;
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm run test:unit`
Expected: todas pasan.

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 5: Cotización

**Files:**
- Create: `src/lib/stays/quote.ts`
- Test: `src/lib/stays/quote.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/stays/quote.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { countNights, getTodayDate, quoteStay } from "./quote.ts";

const listing = {
  currency: "USD" as const,
  nightlyRateMinor: 15000,
  cleaningFeeMinor: 8000,
  minNights: 2,
  maxNights: 10,
  maxGuests: 4,
  petsAllowed: false,
};
const today = "2026-11-09";
const request = { checkIn: "2026-12-01", checkOut: "2026-12-04", guests: 2, pets: 0 };

test("counts nights between valid dates", () => {
  assert.equal(countNights("2026-12-01", "2026-12-04"), 3);
  assert.equal(countNights("2026-12-04", "2026-12-01"), null);
  assert.equal(countNights("2026-02-30", "2026-03-02"), null);
  assert.equal(countNights("2026-01-01", "2027-01-02"), null);
});

test("quotes nights × rate + cleaning", () => {
  assert.deepEqual(quoteStay(listing, request, today), {
    ok: true,
    quote: {
      currency: "USD",
      nightlyRateMinor: 15000,
      nights: 3,
      subtotalMinor: 45000,
      cleaningFeeMinor: 8000,
      totalMinor: 53000,
    },
  });
});

test("reports why a stay cannot be quoted", () => {
  const issue = (overrides: Partial<typeof request>) => {
    const result = quoteStay(listing, { ...request, ...overrides }, today);
    return result.ok ? null : result.issue;
  };
  assert.equal(issue({ checkOut: "2026-11-30" }), "invalid_dates");
  assert.equal(issue({ checkIn: "2026-11-01", checkOut: "2026-11-05" }), "past_dates");
  assert.equal(issue({ guests: 5 }), "too_many_guests");
  assert.equal(issue({ pets: 1 }), "pets_not_allowed");
  assert.equal(issue({ checkOut: "2026-12-02" }), "min_nights");
  assert.equal(issue({ checkOut: "2026-12-20" }), "max_nights");
});

test("today is the UTC calendar date", () => {
  assert.equal(getTodayDate(new Date("2026-11-09T23:30:00Z")), "2026-11-09");
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./quote.ts`.

- [ ] **Step 3: Implementar**

`src/lib/stays/quote.ts`:

```ts
import type { UnitCurrency } from "@/lib/properties/unit-schema";
import type { PublicListing } from "./listing.ts";

export const STAY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const MAX_QUOTE_NIGHTS = 365;

export type StayRequest = { checkIn: string; checkOut: string; guests: number; pets: number };
export type QuoteIssue =
  | "invalid_dates"
  | "past_dates"
  | "too_many_guests"
  | "pets_not_allowed"
  | "min_nights"
  | "max_nights";
export type StayQuote = {
  currency: UnitCurrency;
  nightlyRateMinor: number;
  nights: number;
  subtotalMinor: number;
  cleaningFeeMinor: number;
  totalMinor: number;
};
export type QuoteResult = { ok: true; quote: StayQuote } | { ok: false; issue: QuoteIssue };

type QuoteListing = Pick<
  PublicListing,
  "currency" | "nightlyRateMinor" | "cleaningFeeMinor" | "minNights" | "maxNights" | "maxGuests" | "petsAllowed"
>;

function parseStayDate(value: string) {
  if (!STAY_DATE_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return time;
}

export function getTodayDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Nights between two YYYY-MM-DD dates, or null when the range is invalid. */
export function countNights(checkIn: string, checkOut: string) {
  const start = parseStayDate(checkIn);
  const end = parseStayDate(checkOut);
  if (start === null || end === null || end <= start) return null;
  const nights = Math.round((end - start) / DAY_MS);
  return nights > MAX_QUOTE_NIGHTS ? null : nights;
}

/** Server-side quote: nights × nightly rate + cleaning fee. Taxes are confirmed at booking. */
export function quoteStay(listing: QuoteListing, request: StayRequest, today: string): QuoteResult {
  const nights = countNights(request.checkIn, request.checkOut);
  if (nights === null) return { ok: false, issue: "invalid_dates" };
  if (request.checkIn < today) return { ok: false, issue: "past_dates" };
  if (request.guests > listing.maxGuests) return { ok: false, issue: "too_many_guests" };
  if (request.pets > 0 && !listing.petsAllowed) return { ok: false, issue: "pets_not_allowed" };
  if (nights < listing.minNights) return { ok: false, issue: "min_nights" };
  if (nights > listing.maxNights) return { ok: false, issue: "max_nights" };

  const subtotalMinor = nights * listing.nightlyRateMinor;
  return {
    ok: true,
    quote: {
      currency: listing.currency,
      nightlyRateMinor: listing.nightlyRateMinor,
      nights,
      subtotalMinor,
      cleaningFeeMinor: listing.cleaningFeeMinor,
      totalMinor: subtotalMinor + listing.cleaningFeeMinor,
    },
  };
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm run test:unit`
Expected: todas pasan.

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 6: Búsqueda, filtros y orden

**Files:**
- Create: `src/lib/stays/search.ts`
- Test: `src/lib/stays/search.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/stays/search.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PublicListing } from "./listing.ts";
import { parseStaySearch, searchStays } from "./search.ts";

function listing(overrides: Partial<PublicListing>): PublicListing {
  return {
    propertyId: "p1",
    unitId: "u1",
    propertyName: "Torre Norte",
    unitLabel: "101",
    type: "apartment_condo",
    city: "Santo Domingo",
    state: "DN",
    country: "DO",
    description: "",
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    maxGuests: 4,
    minNights: 2,
    maxNights: 30,
    nightlyRateMinor: 15000,
    cleaningFeeMinor: 5000,
    currency: "USD",
    petsAllowed: false,
    amenities: ["pool"],
    utilities: { electricity: true, water: true, internet: true },
    coverImageId: null,
    ...overrides,
  };
}

const a = listing({ unitId: "a", unitLabel: "101", nightlyRateMinor: 20000 });
const b = listing({ unitId: "b", unitLabel: "102", nightlyRateMinor: 10000, maxGuests: 2, minNights: 5 });
const c = listing({
  unitId: "c",
  propertyName: "Casa Playa",
  city: "Punta Cana",
  type: "residential",
  bedrooms: 4,
  petsAllowed: true,
  amenities: ["pool", "pet_friendly"],
});
const all = [a, b, c];
const today = "2026-11-09";
const ids = (items: { listing: PublicListing }[]) => items.map((item) => item.listing.unitId);

test("invalid parameters fall back to defaults", () => {
  const search = parseStaySearch({
    guests: "abc",
    maxPrice: "",
    type: "castle",
    sort: "random",
    amenities: "pool",
    checkIn: "mañana",
  });
  assert.equal(search.guests, 1);
  assert.equal(search.maxPrice, null);
  assert.equal(search.type, null);
  assert.equal(search.sort, "recommended");
  assert.deepEqual(search.amenities, ["pool"]);
  assert.equal(search.checkIn, "");
});

test("lists areas and sorts by name by default", () => {
  const result = searchStays(all, parseStaySearch({}), today);
  assert.deepEqual(result.areas, ["Punta Cana", "Santo Domingo"]);
  assert.deepEqual(ids(result.available), ["c", "a", "b"]);
  assert.equal(result.available[0].quote, null);
});

test("filters exclude non-matching units", () => {
  const run = (raw: Record<string, string | string[]>) => ids(searchStays(all, parseStaySearch(raw), today).available);
  assert.deepEqual(run({ area: "punta cana" }), ["c"]);
  assert.deepEqual(run({ guests: "3" }), ["c", "a"]);
  assert.deepEqual(run({ pets: "1" }), ["c"]);
  assert.deepEqual(run({ maxPrice: "120" }), ["b"]);
  assert.deepEqual(run({ type: "residential" }), ["c"]);
  assert.deepEqual(run({ bedrooms: "3" }), ["c"]);
  assert.deepEqual(run({ amenities: ["pool", "pet_friendly"] }), ["c"]);
});

test("dates quote available units and move short stays to unavailable", () => {
  const result = searchStays(all, parseStaySearch({ checkIn: "2026-12-01", checkOut: "2026-12-04" }), today);
  assert.equal(result.nights, 3);
  assert.deepEqual(ids(result.available), ["c", "a"]);
  assert.equal(result.available[1].quote?.totalMinor, 65000);
  assert.deepEqual(result.unavailable.map((item) => [item.listing.unitId, item.issue]), [["b", "min_nights"]]);
});

test("invalid or past dates are reported and ignored", () => {
  const invalid = searchStays(all, parseStaySearch({ checkIn: "2026-12-04", checkOut: "2026-12-01" }), today);
  assert.equal(invalid.datesIssue, "invalid_dates");
  assert.equal(invalid.available.length, 3);
  const past = searchStays(all, parseStaySearch({ checkIn: "2026-10-01", checkOut: "2026-10-04" }), today);
  assert.equal(past.datesIssue, "past_dates");
});

test("sorts by price", () => {
  const run = (sort: string) => ids(searchStays(all, parseStaySearch({ sort }), today).available);
  assert.deepEqual(run("price_asc"), ["b", "c", "a"]);
  assert.deepEqual(run("price_desc"), ["a", "c", "b"]);
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./search.ts`.

- [ ] **Step 3: Implementar**

`src/lib/stays/search.ts`:

```ts
import { z } from "zod";
import { propertyTypes } from "../properties/search-index.ts";
import type { PublicListing } from "./listing.ts";
import { countNights, quoteStay, STAY_DATE_PATTERN, type StayQuote } from "./quote.ts";

export const staySortOptions = ["recommended", "price_asc", "price_desc", "bedrooms", "guests"] as const;
export type StaySort = (typeof staySortOptions)[number];

// Every field falls back to its default, so a hand-edited URL never breaks the page.
const staySearchSchema = z.object({
  area: z.string().trim().max(100).catch(""),
  checkIn: z.string().regex(STAY_DATE_PATTERN).catch(""),
  checkOut: z.string().regex(STAY_DATE_PATTERN).catch(""),
  guests: z.coerce.number().int().min(1).max(30).catch(1),
  pets: z.coerce.number().int().min(0).max(5).catch(0),
  maxPrice: z.coerce.number().int().min(1).max(10_000_000).nullable().catch(null),
  type: z.enum(propertyTypes).nullable().catch(null),
  bedrooms: z.coerce.number().int().min(0).max(50).catch(0),
  baths: z.coerce.number().min(0).max(50).catch(0),
  amenities: z.array(z.string().regex(/^[a-z0-9_]{1,40}$/)).max(20).catch([]),
  sort: z.enum(staySortOptions).catch("recommended"),
});

export type StaySearch = z.infer<typeof staySearchSchema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseStaySearch(raw: RawSearchParams): StaySearch {
  const first = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return staySearchSchema.parse({
    area: first("area"),
    checkIn: first("checkIn"),
    checkOut: first("checkOut"),
    guests: first("guests"),
    pets: first("pets"),
    maxPrice: first("maxPrice"),
    type: first("type"),
    bedrooms: first("bedrooms"),
    baths: first("baths"),
    amenities: raw.amenities === undefined ? [] : [raw.amenities].flat(),
    sort: first("sort"),
  });
}

export type StaySearchResult = {
  areas: string[];
  nights: number | null;
  datesIssue: "invalid_dates" | "past_dates" | null;
  available: { listing: PublicListing; quote: StayQuote | null }[];
  unavailable: { listing: PublicListing; issue: "min_nights" | "max_nights" }[];
};

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

function normalizeArea(value: string) {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

function compareByName(left: PublicListing, right: PublicListing) {
  return (
    collator.compare(left.propertyName, right.propertyName) ||
    collator.compare(left.unitLabel, right.unitLabel)
  );
}

const comparators: Record<StaySort, (left: PublicListing, right: PublicListing) => number> = {
  recommended: compareByName,
  price_asc: (left, right) => left.nightlyRateMinor - right.nightlyRateMinor || compareByName(left, right),
  price_desc: (left, right) => right.nightlyRateMinor - left.nightlyRateMinor || compareByName(left, right),
  bedrooms: (left, right) => right.bedrooms - left.bedrooms || compareByName(left, right),
  guests: (left, right) => right.maxGuests - left.maxGuests || compareByName(left, right),
};

export function searchStays(
  listings: PublicListing[],
  search: StaySearch,
  today: string,
): StaySearchResult {
  const areas = [...new Set(listings.map((listing) => listing.city).filter(Boolean))].sort(
    collator.compare,
  );
  const area = normalizeArea(search.area);
  const matches = listings.filter(
    (listing) =>
      (!area || normalizeArea(listing.city) === area) &&
      (!search.type || listing.type === search.type) &&
      listing.bedrooms >= search.bedrooms &&
      listing.bathrooms >= search.baths &&
      search.amenities.every((amenity) => (listing.amenities as string[]).includes(amenity)) &&
      (search.maxPrice === null || listing.nightlyRateMinor <= search.maxPrice * 100) &&
      listing.maxGuests >= search.guests &&
      (search.pets === 0 || listing.petsAllowed),
  );

  let nights: number | null = null;
  let datesIssue: StaySearchResult["datesIssue"] = null;
  if (search.checkIn && search.checkOut) {
    nights = countNights(search.checkIn, search.checkOut);
    if (nights === null) datesIssue = "invalid_dates";
    else if (search.checkIn < today) {
      datesIssue = "past_dates";
      nights = null;
    }
  }

  const available: StaySearchResult["available"] = [];
  const unavailable: StaySearchResult["unavailable"] = [];
  for (const listing of matches) {
    if (nights === null) {
      available.push({ listing, quote: null });
      continue;
    }
    const result = quoteStay(listing, search, today);
    if (result.ok) available.push({ listing, quote: result.quote });
    else if (result.issue === "min_nights" || result.issue === "max_nights") {
      unavailable.push({ listing, issue: result.issue });
    }
  }

  const compare = comparators[search.sort];
  available.sort((left, right) => compare(left.listing, right.listing));
  unavailable.sort((left, right) => compareByName(left.listing, right.listing));
  return { areas, nights, datesIssue, available, unavailable };
}
```

`quoteStay(listing, search, today)` recibe `search` como `StayRequest`; es compatible porque `StaySearch` tiene `checkIn`, `checkOut`, `guests` y `pets`.

- [ ] **Step 4: Verificar que pasa**

Run: `npm run test:unit`
Expected: todas pasan.

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 7: Diccionarios ES/EN y formato

**Files:**
- Create: `src/lib/stays/i18n.ts`
- Test: `src/lib/stays/i18n.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/stays/i18n.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatMoney,
  formatText,
  getStaysDictionary,
  hasStaysLocale,
  pickStaysLocale,
} from "./i18n.ts";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, `${prefix}.${key}`)).sort();
}

test("both dictionaries have the same keys", () => {
  assert.deepEqual(keyPaths(getStaysDictionary("es")), keyPaths(getStaysDictionary("en")));
});

test("locale helpers", () => {
  assert.equal(hasStaysLocale("es"), true);
  assert.equal(hasStaysLocale("fr"), false);
  assert.equal(pickStaysLocale("es-DO,es;q=0.9"), "es");
  assert.equal(pickStaysLocale("en-US,es;q=0.5"), "en");
  assert.equal(pickStaysLocale(null), "en");
});

test("formatting", () => {
  assert.equal(formatText("Hasta {count} huéspedes", { count: 4 }), "Hasta 4 huéspedes");
  assert.equal(formatMoney(15000, "USD", "en"), "$150");
  assert.equal(formatMoney(15050, "USD", "en"), "$150.50");
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./i18n.ts`.

- [ ] **Step 3: Implementar**

`src/lib/stays/i18n.ts`:

```ts
import type { PropertyAmenity } from "@/lib/properties/schema";
import type { PropertyType } from "@/lib/properties/search-index";
import type { UnitCurrency } from "@/lib/properties/unit-schema";

export const staysLocales = ["es", "en"] as const;
export type StaysLocale = (typeof staysLocales)[number];

export function hasStaysLocale(value: string): value is StaysLocale {
  return (staysLocales as readonly string[]).includes(value);
}

/** Spanish for browsers that prefer Spanish first; English otherwise. */
export function pickStaysLocale(acceptLanguage: string | null): StaysLocale {
  return acceptLanguage?.trim().toLowerCase().startsWith("es") ? "es" : "en";
}

const es = {
  meta: {
    title: "Explorar estadías",
    description: "Apartamentos y casas para estancias cortas administrados por My Global Hub.",
  },
  nav: {
    label: "Navegación de estadías",
    explore: "Explorar estadías",
    staff: "Portal del staff",
    language: "Idioma",
  },
  search: {
    area: "Destino / zona",
    allAreas: "Todas las zonas",
    checkIn: "Llegada",
    checkOut: "Salida",
    guests: "Huéspedes",
    pets: "Mascotas",
    noPets: "Ninguna",
    filters: "Filtros",
    maxPrice: "Precio máximo por noche",
    anyPrice: "Cualquier precio",
    type: "Tipo de propiedad",
    anyType: "Cualquier tipo",
    bedrooms: "Habitaciones (mín.)",
    baths: "Baños (mín.)",
    any: "Cualquiera",
    amenities: "Amenidades",
    sort: "Ordenar por",
    submit: "Buscar",
    clear: "Limpiar filtros",
  },
  sort: {
    recommended: "Recomendado",
    price_asc: "Precio: menor a mayor",
    price_desc: "Precio: mayor a menor",
    bedrooms: "Habitaciones",
    guests: "Capacidad",
  },
  results: {
    countOne: "1 estadía disponible",
    countMany: "{count} estadías disponibles",
    summaryDates: "{range} · {nights} noches · {guests} huéspedes",
    summaryNoDates: "Elige fechas para ver el total de tu estadía.",
    priceNote:
      "Los totales incluyen la tarifa por noche y la limpieza. Impuestos y cargos aplicables se confirman al reservar.",
    perNight: "/ noche",
    total: "{amount} total",
    emptyTitle: "No hay estadías para esta búsqueda",
    emptyHint: "Prueba con otras fechas, menos filtros u otra zona.",
    catalogEmpty: "Todavía no hay estadías publicadas.",
    unavailableTitle: "No disponible para tus fechas",
    view: "Ver estadía",
  },
  issues: {
    invalid_dates: "Las fechas no son válidas. Revisa la llegada y la salida.",
    past_dates: "La llegada no puede ser una fecha pasada.",
    too_many_guests: "Esta estadía admite hasta {max} huéspedes.",
    pets_not_allowed: "Esta estadía no admite mascotas.",
    min_nights: "Estancia mínima de {count} noches.",
    max_nights: "Estancia máxima de {count} noches.",
  },
  listing: {
    unit: "Unidad",
    bedrooms: "{count} hab.",
    beds: "{count} camas",
    baths: "{count} baños",
    guests: "Hasta {count} huéspedes",
    pets: "Admite mascotas",
    noPhoto: "Sin foto",
  },
  types: {
    residential: "Residencial",
    commercial: "Comercial",
    industrial: "Industrial",
    mixed: "Mixto",
    land: "Terreno",
    apartment_condo: "Apartamento / condominio",
  } satisfies Record<PropertyType, string>,
  amenities: {
    pool: "Piscina",
    parking: "Parqueo",
    bbq_area: "Área de BBQ",
    garden: "Jardín",
    gym: "Gimnasio",
    elevator: "Ascensor",
    security_24: "Seguridad 24/7",
    rooftop: "Terraza / rooftop",
    playground: "Área infantil",
    storage: "Depósito",
    pet_friendly: "Admite mascotas",
  } satisfies Record<PropertyAmenity, string>,
  detail: {
    back: "Volver a resultados",
    gallery: "Fotos de {name}",
    about: "Sobre la propiedad",
    stayRange: "Estancia de {min} a {max} noches",
    included: "Servicios incluidos",
    includedNote: "Lo que no aparece aquí no está incluido.",
    electricity: "Electricidad",
    water: "Agua",
    internet: "Internet / Wi-Fi",
    noneIncluded: "Esta estadía no incluye servicios.",
    amenities: "Amenidades",
    quoteTitle: "Cotiza tu estadía",
    quoteSubmit: "Ver total",
    nightsLine: "{rate} × {nights} noches",
    cleaning: "Limpieza",
    total: "Total",
    chooseDates: "Elige fechas para ver el total.",
  },
  inquiry: {
    title: "Solicitar reserva",
    intro: "Envía tu solicitud y te contactaremos para confirmar la disponibilidad.",
    needsQuote: "Elige fechas válidas arriba para enviar tu solicitud.",
    name: "Nombre completo",
    email: "Correo electrónico",
    phone: "Teléfono",
    message: "Mensaje (opcional)",
    consent: "Acepto que My Global Hub me contacte sobre esta solicitud.",
    submit: "Enviar solicitud",
    sending: "Enviando…",
    successTitle: "Recibimos tu solicitud",
    successBody: "Te contactaremos pronto en {email}.",
    genericError: "No se pudo enviar la solicitud. Inténtalo más tarde.",
  },
  errors: {
    invalid: "Revisa los datos del formulario.",
    forbidden: "No se pudo enviar la solicitud desde esta página.",
    notFound: "Esta estadía ya no está disponible.",
    rateLimited: "Enviaste varias solicitudes. Inténtalo de nuevo en una hora.",
    generic: "No se pudo enviar la solicitud. Inténtalo más tarde.",
  },
  notFound: {
    title: "Esta estadía no está disponible",
    body: "Puede que ya no esté publicada.",
    back: "Explorar estadías",
  },
};

export type StaysDictionary = typeof es;

const en: StaysDictionary = {
  meta: {
    title: "Explore stays",
    description: "Short-stay apartments and homes managed by My Global Hub.",
  },
  nav: {
    label: "Stays navigation",
    explore: "Explore stays",
    staff: "Staff portal",
    language: "Language",
  },
  search: {
    area: "Destination / area",
    allAreas: "All areas",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    pets: "Pets",
    noPets: "None",
    filters: "Filters",
    maxPrice: "Max price per night",
    anyPrice: "Any price",
    type: "Property type",
    anyType: "Any type",
    bedrooms: "Bedrooms (min.)",
    baths: "Bathrooms (min.)",
    any: "Any",
    amenities: "Amenities",
    sort: "Sort by",
    submit: "Search",
    clear: "Clear filters",
  },
  sort: {
    recommended: "Recommended",
    price_asc: "Price: low to high",
    price_desc: "Price: high to low",
    bedrooms: "Bedrooms",
    guests: "Guest capacity",
  },
  results: {
    countOne: "1 stay available",
    countMany: "{count} stays available",
    summaryDates: "{range} · {nights} nights · {guests} guests",
    summaryNoDates: "Choose dates to see the total for your stay.",
    priceNote:
      "Totals include the nightly rate and cleaning. Applicable taxes and fees are confirmed when booking.",
    perNight: "/ night",
    total: "{amount} total",
    emptyTitle: "No stays match this search",
    emptyHint: "Try other dates, fewer filters or another area.",
    catalogEmpty: "There are no published stays yet.",
    unavailableTitle: "Not available for your dates",
    view: "View stay",
  },
  issues: {
    invalid_dates: "The dates are not valid. Check your check-in and check-out.",
    past_dates: "Check-in cannot be in the past.",
    too_many_guests: "This stay sleeps up to {max} guests.",
    pets_not_allowed: "This stay does not allow pets.",
    min_nights: "Minimum stay of {count} nights.",
    max_nights: "Maximum stay of {count} nights.",
  },
  listing: {
    unit: "Unit",
    bedrooms: "{count} bd",
    beds: "{count} beds",
    baths: "{count} ba",
    guests: "Sleeps {count}",
    pets: "Pets allowed",
    noPhoto: "No photo",
  },
  types: {
    residential: "Residential",
    commercial: "Commercial",
    industrial: "Industrial",
    mixed: "Mixed use",
    land: "Land",
    apartment_condo: "Apartment / condo",
  },
  amenities: {
    pool: "Pool",
    parking: "Parking",
    bbq_area: "BBQ area",
    garden: "Garden",
    gym: "Gym",
    elevator: "Elevator",
    security_24: "24/7 security",
    rooftop: "Rooftop",
    playground: "Playground",
    storage: "Storage",
    pet_friendly: "Pets allowed",
  },
  detail: {
    back: "Back to results",
    gallery: "Photos of {name}",
    about: "About this property",
    stayRange: "Stays of {min} to {max} nights",
    included: "What's included",
    includedNote: "Anything not listed is not provided.",
    electricity: "Electricity",
    water: "Water",
    internet: "Internet / Wi-Fi",
    noneIncluded: "This stay does not include utilities.",
    amenities: "Amenities",
    quoteTitle: "Price your stay",
    quoteSubmit: "See total",
    nightsLine: "{rate} × {nights} nights",
    cleaning: "Cleaning",
    total: "Total",
    chooseDates: "Choose dates to see the total.",
  },
  inquiry: {
    title: "Request to book",
    intro: "Send your request and we will contact you to confirm availability.",
    needsQuote: "Choose valid dates above to send your request.",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    message: "Message (optional)",
    consent: "I agree that My Global Hub may contact me about this request.",
    submit: "Send request",
    sending: "Sending…",
    successTitle: "We received your request",
    successBody: "We will contact you soon at {email}.",
    genericError: "We could not send your request. Please try again later.",
  },
  errors: {
    invalid: "Please check the form.",
    forbidden: "The request could not be sent from this page.",
    notFound: "This stay is no longer available.",
    rateLimited: "You sent several requests. Please try again in an hour.",
    generic: "We could not send your request. Please try again later.",
  },
  notFound: {
    title: "This stay is not available",
    body: "It may no longer be published.",
    back: "Explore stays",
  },
};

export function getStaysDictionary(locale: StaysLocale): StaysDictionary {
  return locale === "es" ? es : en;
}

export function formatText(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

function intlLocale(locale: StaysLocale) {
  return locale === "es" ? "es-DO" : "en-US";
}

/** Whole amounts without decimals ($150); otherwise two decimals ($150.50). */
export function formatMoney(minor: number, currency: UnitCurrency, locale: StaysLocale) {
  const digits = minor % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minor / 100);
}

export function formatStayDate(date: string, locale: StaysLocale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatCount(value: number, locale: StaysLocale) {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm run test:unit`
Expected: todas pasan. Si `formatMoney(…, "en")` devuelve `US$150` en vez de `$150`, el ICU de Node difiere: ajusta la expectativa de la prueba al valor real y deja el código igual.

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 8: Guardar la estancia y validar la publicación (servidor)

**Files:**
- Modify: `src/lib/properties/units.ts`
- Modify: `src/lib/properties/unit-api.ts`

- [ ] **Step 1: Error y tipo de mutación**

En `src/lib/properties/units.ts`:

1. Agrega a los imports:

```ts
import { getStayConfigurationIssue, type StayConfigurationIssue } from "@/lib/stays/publishable";
import { propertyDocumentSchema, type PropertyDocument } from "./schema";
```

   Esto reemplaza el import actual `import { propertyDocumentSchema } from "./schema";`. En el import de `./unit-schema` agrega `toUnitStayDocument`.

2. Después de `UnitLeaseLockedError`:

```ts
export class UnitStayNotConfigurableError extends Error {
  readonly reason: StayConfigurationIssue;

  constructor(reason: StayConfigurationIssue) {
    super("The property cannot publish short stays.");
    this.name = "UnitStayNotConfigurableError";
    this.reason = reason;
  }
}
```

3. Cambia `UnitMutation`:

```ts
type UnitMutation = {
  units: PropertyUnit[];
  property: PropertyDocument;
  transaction: Transaction;
};
```

4. En `mutatePropertyUnits`, reemplaza `const result = mutate({ units: propertyUnits.units, transaction });` por:

```ts
    const result = mutate({
      units: propertyUnits.units,
      property: propertyUnits.property,
      transaction,
    });
```

- [ ] **Step 2: Guardar `stay` y validar al publicar**

Reemplaza `toUnitFields` por:

```ts
function toUnitFields(input: UnitInput) {
  const marketRentMinor = parseMoneyToMinorUnits(input.marketRent);
  return {
    label: input.label,
    labelKey: normalizePropertySearch(input.label),
    floor: input.floor,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    status: input.status,
    marketRentMinor,
    marketRentCurrency: marketRentMinor === null ? null : input.marketRentCurrency,
    // Firestore rejects undefined; an omitted stay keeps the stored one.
    ...(input.stay ? { stay: toUnitStayDocument(input.stay) } : {}),
  };
}

/** Publishing needs a short-term property with a currency; saving a draft stay does not. */
function assertStayPublishable(property: PropertyDocument, fields: ReturnType<typeof toUnitFields>) {
  if (!fields.stay?.published) return;
  const issue = getStayConfigurationIssue(property);
  if (issue) throw new UnitStayNotConfigurableError(issue);
}
```

En `createPropertyUnit`, cambia la firma del callback a `({ units, property, transaction }) => {` y, justo después de `const fields = toUnitFields(input);`, agrega:

```ts
    assertStayPublishable(property, fields);
```

En `updatePropertyUnit` haz lo mismo: callback `({ units, property, transaction }) => {` y `assertStayPublishable(property, fields);` después de `const fields = toUnitFields(input);`.

`setPropertyUnitArchived` usa `({ units, transaction })`, que sigue compilando porque desestructurar menos campos es válido.

- [ ] **Step 3: Respuesta 409**

En `src/lib/properties/unit-api.ts`, agrega `UnitStayNotConfigurableError` al import de `./units`. Antes de `console.error(logMessage, error);` agrega:

```ts
  if (error instanceof UnitStayNotConfigurableError) {
    return NextResponse.json(
      {
        error:
          error.reason === "not_short_term"
            ? "Para publicar en el catálogo, la propiedad debe ser de corto plazo o de ambos tipos."
            : "Para publicar en el catálogo, configura la moneda de la propiedad en su ficha.",
      },
      { status: 409 },
    );
  }
```

- [ ] **Step 4: Punto de control**

Run: `npm run typecheck && npm run lint && npm run test:unit`
Expected: sin errores.

---

### Task 9: Sección "Estancias cortas" en el formulario de unidad

**Files:**
- Modify: `src/components/properties/unit-form.tsx`
- Modify: `src/app/properties/[propertyId]/units/new/page.tsx`
- Modify: `src/app/properties/[propertyId]/units/[unitId]/edit/page.tsx`

- [ ] **Step 1: Tipos y props del formulario**

En `unit-form.tsx`, después de `export type UnitFormValues = {…};`:

```ts
export type UnitStayFormValues = {
  published: boolean;
  nightlyRate: string;
  maxGuests: string;
  beds: string;
  minNights: string;
  maxNights: string;
};

export const defaultUnitStayFormValues: UnitStayFormValues = {
  published: false,
  nightlyRate: "",
  maxGuests: "2",
  beds: "1",
  minNights: "1",
  maxNights: "30",
};
```

En `UnitFormProps` agrega:

```ts
  /** Present when the property accepts short stays; shows the "Estancias cortas" section. */
  stay?: { currency: UnitCurrency; initialValues: UnitStayFormValues };
```

Y agrega `stay,` a la desestructuración de props del componente.

- [ ] **Step 2: Enviar `stay`**

En `submit`, reemplaza el objeto pasado a `unitInputSchema.safeParse({…})` por:

```ts
    const parsedForm = unitInputSchema.safeParse({
      label: formData.get("label"),
      floor: formData.get("floor") ?? "",
      bedrooms: formData.get("bedrooms"),
      bathrooms: formData.get("bathrooms"),
      status: formData.get("status"),
      marketRent: formData.get("marketRent") ?? "",
      marketRentCurrency: formData.get("marketRentCurrency"),
      stay: stay
        ? {
            published: formData.get("stayPublished") === "on",
            nightlyRate: formData.get("nightlyRate") ?? "",
            maxGuests: formData.get("maxGuests"),
            beds: formData.get("beds"),
            minNights: formData.get("minNights"),
            maxNights: formData.get("maxNights"),
          }
        : undefined,
    });
```

- [ ] **Step 3: Sección del formulario**

En el JSX, entre la sección `unit-rent-heading` y `<p className={styles.note}>`, agrega:

```tsx
      {stay && (
        <section aria-labelledby="unit-stay-heading" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2 id="unit-stay-heading">Estancias cortas</h2>
            <p>
              Configura la unidad para el catálogo público. Solo aparece si la unidad está
              disponible, sin contrato activo y la propiedad está activa.
            </p>
          </div>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Tarifa por noche ({stay.currency})</span>
              <input
                autoComplete="off"
                defaultValue={stay.initialValues.nightlyRate}
                inputMode="decimal"
                maxLength={12}
                name="nightlyRate"
                pattern="\d{1,9}(\.\d{1,2})?"
                placeholder="0.00"
              />
            </label>
            <label className={styles.field}>
              <span>Huéspedes máximos *</span>
              <input
                defaultValue={stay.initialValues.maxGuests}
                inputMode="numeric"
                max={30}
                min={1}
                name="maxGuests"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Camas *</span>
              <input
                defaultValue={stay.initialValues.beds}
                inputMode="numeric"
                max={30}
                min={0}
                name="beds"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Estancia mínima (noches) *</span>
              <input
                defaultValue={stay.initialValues.minNights}
                inputMode="numeric"
                max={365}
                min={1}
                name="minNights"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Estancia máxima (noches) *</span>
              <input
                defaultValue={stay.initialValues.maxNights}
                inputMode="numeric"
                max={365}
                min={1}
                name="maxNights"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Catálogo público</span>
              <span>
                <input
                  defaultChecked={stay.initialValues.published}
                  name="stayPublished"
                  type="checkbox"
                />{" "}
                Publicar en el catálogo
              </span>
            </label>
          </div>
        </section>
      )}
```

- [ ] **Step 4: Pasar `stay` desde las páginas**

En `src/app/properties/[propertyId]/units/new/page.tsx`:

```ts
import { defaultUnitStayFormValues, UnitForm } from "@/components/properties/unit-form";
import { getStayConfigurationIssue } from "@/lib/stays/publishable";
```

Esto reemplaza el import de `UnitForm`. En el JSX, agrega a `<UnitForm …>`:

```tsx
            stay={
              getStayConfigurationIssue(property) === null && property.financialReference
                ? {
                    currency: property.financialReference.currency,
                    initialValues: defaultUnitStayFormValues,
                  }
                : undefined
            }
```

En `src/app/properties/[propertyId]/units/[unitId]/edit/page.tsx`, con los mismos imports, agrega a `<UnitForm …>`:

```tsx
            stay={
              getStayConfigurationIssue(property) === null && property.financialReference
                ? {
                    currency: property.financialReference.currency,
                    initialValues: unit.stay
                      ? {
                          published: unit.stay.published,
                          nightlyRate:
                            unit.stay.nightlyRateMinor === null
                              ? ""
                              : formatMinorUnitsAsDecimal(unit.stay.nightlyRateMinor),
                          maxGuests: String(unit.stay.maxGuests),
                          beds: String(unit.stay.beds),
                          minNights: String(unit.stay.minNights),
                          maxNights: String(unit.stay.maxNights),
                        }
                      : defaultUnitStayFormValues,
                  }
                : undefined
            }
```

`formatMinorUnitsAsDecimal` ya está importado en esa página.

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`
Expected: sin errores.

---

### Task 10: Etiqueta "Publicada" en el detalle de la propiedad

**Files:**
- Modify: `src/lib/properties/labels.ts`
- Modify: `src/app/properties/[propertyId]/page.tsx`
- Modify: `src/app/properties/[propertyId]/detail.module.css`

- [ ] **Step 1: Textos del motivo**

Al final de `src/lib/properties/labels.ts`:

```ts
export const stayVisibilityIssueLabels: Record<StayVisibilityIssue, string> = {
  not_short_term: "La propiedad no es de corto plazo.",
  no_currency: "La propiedad no tiene moneda configurada.",
  property_inactive: "La propiedad no está activa.",
  property_archived: "La propiedad está archivada.",
  unit_archived: "La unidad está archivada.",
  unit_leased: "La unidad tiene un contrato activo.",
  unit_unavailable: "La unidad no está disponible.",
  not_published: "La unidad no está publicada.",
  no_rate: "Falta la tarifa por noche.",
};
```

Agrega al inicio del archivo: `import type { StayVisibilityIssue } from "@/lib/stays/publishable";`.

- [ ] **Step 2: Etiqueta en la tabla**

En `src/app/properties/[propertyId]/page.tsx`, agrega `stayVisibilityIssueLabels` al import de `@/lib/properties/labels` y agrega:

```ts
import { getStayVisibilityIssue } from "@/lib/stays/publishable";
```

En `pageUnits.map((unit) => {`, después de `const rent = formatUnitRent(unit);`:

```ts
                      const stayIssue = unit.stay?.published
                        ? getStayVisibilityIssue(property, unit)
                        : undefined;
```

Dentro de la celda del estado, después del `<span>` del estado:

```tsx
                            {stayIssue !== undefined && (
                              <span
                                className={`${listStyles.statusBadge} ${
                                  stayIssue ? styles.stayHidden : styles.stayPublished
                                }`}
                                title={stayIssue ? stayVisibilityIssueLabels[stayIssue] : undefined}
                              >
                                {stayIssue ? "Publicada · oculta" : "Publicada"}
                              </span>
                            )}
```

- [ ] **Step 3: Estilos**

Al final de `detail.module.css`:

```css
.stayPublished,
.stayHidden {
  margin-left: 6px;
}

.stayPublished {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.stayHidden {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
```

- [ ] **Step 4: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 11: Lectura del catálogo (server-only)

**Files:**
- Create: `src/lib/stays/catalog.ts`
- Modify: `.env.example`

- [ ] **Step 1: Implementar**

`src/lib/stays/catalog.ts`:

```ts
import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { listPropertyImages } from "@/lib/properties/images";
import { propertyDocumentSchema } from "@/lib/properties/schema";
import { MAX_UNITS_PER_PROPERTY, unitDocumentSchema } from "@/lib/properties/unit-schema";
import { toPublicListing, type PublicListing } from "./listing";

/** Organization whose inventory the public catalog shows; null disables the catalog. */
export function getCatalogOrganizationId() {
  const organizationId = process.env.PUBLIC_CATALOG_ORGANIZATION_ID?.trim();
  if (!organizationId || !/^[A-Za-z0-9_-]{1,128}$/.test(organizationId)) {
    console.error("PUBLIC_CATALOG_ORGANIZATION_ID is not configured; the stays catalog is empty.");
    return null;
  }
  return organizationId;
}

function getPropertiesCollection(organizationId: string) {
  return getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties");
}

/** Invalid records are skipped and logged so one bad document cannot break the catalog. */
async function readPropertyListings(organizationId: string, propertyId: string, data: unknown) {
  const property = propertyDocumentSchema.safeParse(data);
  if (!property.success) {
    console.error("Skipping invalid property in the stays catalog.", {
      propertyId,
      issues: property.error.issues,
    });
    return [];
  }

  const units = await getPropertiesCollection(organizationId)
    .doc(propertyId)
    .collection("units")
    .where("stay.published", "==", true)
    .limit(MAX_UNITS_PER_PROPERTY)
    .get();

  return units.docs.flatMap((document) => {
    const unit = unitDocumentSchema.safeParse(document.data());
    if (!unit.success) {
      console.error("Skipping invalid unit in the stays catalog.", {
        propertyId,
        unitId: document.id,
        issues: unit.error.issues,
      });
      return [];
    }
    const listing = toPublicListing(propertyId, property.data, document.id, unit.data);
    return listing ? [listing] : [];
  });
}

export async function listPublicListings(): Promise<PublicListing[]> {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return [];

  const properties = await getPropertiesCollection(organizationId)
    .where("status", "==", "active")
    .get();
  const groups = await Promise.all(
    properties.docs.map((document) =>
      readPropertyListings(organizationId, document.id, document.data()),
    ),
  );
  return groups.flat();
}

export async function getPublicListing(propertyId: string, unitId: string) {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return null;

  const propertyReference = getPropertiesCollection(organizationId).doc(propertyId);
  const [propertySnapshot, unitSnapshot] = await Promise.all([
    propertyReference.get(),
    propertyReference.collection("units").doc(unitId).get(),
  ]);
  if (!propertySnapshot.exists || !unitSnapshot.exists) return null;

  const property = propertyDocumentSchema.safeParse(propertySnapshot.data());
  const unit = unitDocumentSchema.safeParse(unitSnapshot.data());
  if (!property.success || !unit.success) return null;
  return toPublicListing(propertyId, property.data, unitId, unit.data);
}

/** Images of a property are public only while it has at least one visible unit. */
export async function propertyHasPublicListing(propertyId: string) {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return false;

  const snapshot = await getPropertiesCollection(organizationId).doc(propertyId).get();
  if (!snapshot.exists) return false;
  return (await readPropertyListings(organizationId, propertyId, snapshot.data())).length > 0;
}

export async function listPublicListingImageIds(propertyId: string) {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return [];
  return (await listPropertyImages(organizationId, propertyId)).map((image) => image.id);
}
```

- [ ] **Step 2: Variable de entorno**

En `.env.example`, después de `FIREBASE_BOOTSTRAP_ADMIN_UID=`:

```
# Organization whose published short-stay units appear in the public catalog (/es/stays, /en/stays).
PUBLIC_CATALOG_ORGANIZATION_ID=
```

- [ ] **Step 3: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 12: Ruta pública de imágenes

**Files:**
- Create: `src/app/api/public/stays/images/[propertyId]/[imageId]/route.ts`

- [ ] **Step 1: Implementar**

```ts
import { NextResponse } from "next/server";
import { propertyImageVariants, type PropertyImageVariant } from "@/lib/properties/image-schema";
import { PropertyImageNotFoundError, readPropertyImageFile } from "@/lib/properties/images";
import { recordIdSchema } from "@/lib/properties/schema";
import { getCatalogOrganizationId, propertyHasPublicListing } from "@/lib/stays/catalog";

export const dynamic = "force-dynamic";

type PublicImageRouteContext = {
  params: Promise<{ propertyId: string; imageId: string }>;
};

const notFound = () => NextResponse.json({ error: "Not found." }, { status: 404 });

/** Serves gallery images of properties that have at least one visible stay. */
export async function GET(request: Request, { params }: PublicImageRouteContext) {
  const { propertyId, imageId } = await params;
  const variant = new URL(request.url).searchParams.get("variant") ?? "thumbnail";
  if (
    !recordIdSchema.safeParse(propertyId).success ||
    !recordIdSchema.safeParse(imageId).success ||
    !propertyImageVariants.includes(variant as PropertyImageVariant)
  ) {
    return notFound();
  }

  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return notFound();

  try {
    if (!(await propertyHasPublicListing(propertyId))) return notFound();
    const file = await readPropertyImageFile(
      organizationId,
      propertyId,
      imageId,
      variant as PropertyImageVariant,
    );
    return new Response(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.buffer.length),
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof PropertyImageNotFoundError) return notFound();
    console.error("Unable to read public stay image.", error);
    return NextResponse.json({ error: "Unavailable." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 13: Estilos, cabecera pública y selector de idioma

**Files:**
- Create: `src/components/stays/stays.module.css`
- Create: `src/components/stays/language-switch.tsx`
- Create: `src/components/stays/stays-header.tsx`

- [ ] **Step 1: Estilos**

`src/components/stays/stays.module.css`. Usa los tokens de `globals.css`, el diseño se basa en `Master 29 - Explore Stays` y funciona desde 360 px:

```css
.page {
  min-height: 100vh;
  background: var(--color-canvas);
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.headerInner,
.main {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 16px;
}

.headerInner {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-title);
}

.brand span {
  display: grid;
  line-height: 1.1;
}

.brand small {
  color: #b7892f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.headerNav {
  display: none;
}

.headerNav a {
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.headerActions {
  display: flex;
  margin-left: auto;
  align-items: center;
  gap: 12px;
}

.staffLink {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 7px 12px;
  color: var(--color-title);
  font-weight: 600;
}

.languageSwitch {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.languageSwitch a {
  padding: 6px 10px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 700;
}

.languageSwitch a[aria-current="true"] {
  background: var(--color-primary);
  color: #fff;
}

.main {
  padding-top: 20px;
  padding-bottom: 48px;
}

.searchForm {
  display: grid;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.searchRow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.field > span {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--color-surface);
  color: var(--color-title);
  font: inherit;
}

.filters {
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

.filters summary {
  cursor: pointer;
  color: var(--color-title);
  font-weight: 600;
}

.filtersBody {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 12px;
}

.checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.checkboxes label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.formActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.primaryButton {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  padding: 0 20px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.primaryButton:hover {
  background: var(--color-primary-hover);
}

.primaryButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.textLink {
  color: var(--color-primary);
  font-weight: 600;
}

.resultsHeader {
  margin: 24px 0 12px;
}

.resultsHeader h1 {
  margin: 0;
  color: var(--color-title);
  font-size: 26px;
}

.resultsHeader p {
  margin: 4px 0 0;
  color: var(--color-muted);
}

.notice,
.warning {
  margin: 12px 0;
  border-radius: 10px;
  padding: 10px 14px;
}

.notice {
  border: 1px solid #bfe3df;
  background: var(--color-primary-soft);
  color: var(--color-title);
}

.warning {
  border: 1px solid #f5d38b;
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.cards {
  display: grid;
  gap: 16px;
}

.card {
  display: grid;
  grid-template-columns: 1fr;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.cardImage {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--color-primary-soft);
}

.cardPlaceholder {
  display: grid;
  aspect-ratio: 4 / 3;
  place-items: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.cardBody {
  display: grid;
  gap: 8px;
  padding: 16px;
}

.cardArea {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.cardTitle {
  margin: 0;
  color: var(--color-title);
  font-size: 19px;
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  color: var(--color-title);
  font-weight: 600;
  list-style: none;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chips li {
  border-radius: 999px;
  padding: 4px 10px;
  background: var(--color-canvas);
  color: var(--color-text);
  font-size: 12px;
}

.price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
}

.price strong {
  color: var(--color-title);
  font-size: 20px;
}

.price span {
  color: var(--color-muted);
}

.empty {
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  padding: 32px 16px;
  background: var(--color-surface);
  text-align: center;
}

.empty h2 {
  margin: 0 0 6px;
  color: var(--color-title);
}

.unavailable {
  margin-top: 28px;
}

.unavailable h2 {
  color: var(--color-title);
  font-size: 18px;
}

.unavailable ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.unavailable li {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 10px 14px;
  background: var(--color-surface);
}

.detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 16px 0 24px;
}

.gallery img {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  object-fit: cover;
}

.gallery img:first-child {
  grid-column: 1 / -1;
}

.detailSection {
  border-top: 1px solid var(--color-border);
  padding: 20px 0;
}

.detailSection h2 {
  margin: 0 0 10px;
  color: var(--color-title);
  font-size: 18px;
}

.description {
  white-space: pre-line;
}

.panel {
  display: grid;
  gap: 14px;
  align-self: start;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.panel h2 {
  margin: 0;
  color: var(--color-title);
  font-size: 18px;
}

.breakdown {
  display: grid;
  gap: 6px;
  margin: 0;
}

.breakdown div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.breakdown dt,
.breakdown dd {
  margin: 0;
}

.breakdownTotal {
  border-top: 1px solid var(--color-border);
  padding-top: 8px;
  color: var(--color-title);
  font-weight: 700;
}

.error {
  margin: 0;
  color: var(--color-danger);
}

.success {
  border-radius: 10px;
  padding: 14px;
  background: var(--color-success-soft);
  color: var(--color-success);
}

.honeypot {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

@media (min-width: 720px) {
  .headerNav {
    display: block;
  }

  .searchRow {
    grid-template-columns: 2fr repeat(4, 1fr);
    align-items: end;
  }

  .filtersBody {
    grid-template-columns: repeat(2, 1fr);
  }

  .card {
    grid-template-columns: 280px 1fr;
  }

  .cardImage,
  .cardPlaceholder {
    height: 100%;
  }

  .gallery {
    grid-template-columns: 2fr 1fr 1fr;
  }

  .gallery img:first-child {
    grid-column: auto;
    grid-row: span 2;
  }
}

@media (min-width: 1000px) {
  .detail {
    grid-template-columns: 1fr 360px;
  }
}
```

- [ ] **Step 2: Selector de idioma (cliente)**

`src/components/stays/language-switch.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { staysLocales, type StaysLocale } from "@/lib/stays/i18n";
import styles from "./stays.module.css";

/** Swaps the /es or /en prefix and keeps the current search. */
export function LanguageSwitch({ current, label }: { current: StaysLocale; label: string }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();

  return (
    <div aria-label={label} className={styles.languageSwitch} role="group">
      {staysLocales.map((locale) => (
        <Link
          aria-current={locale === current ? "true" : undefined}
          href={`${pathname.replace(/^\/(es|en)(?=\/|$)/, `/${locale}`)}${query ? `?${query}` : ""}`}
          key={locale}
          lang={locale}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Cabecera**

`src/components/stays/stays-header.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { StaysDictionary, StaysLocale } from "@/lib/stays/i18n";
import { LanguageSwitch } from "./language-switch";
import styles from "./stays.module.css";

export function StaysHeader({
  dictionary,
  locale,
}: {
  dictionary: StaysDictionary;
  locale: StaysLocale;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={`/${locale}/stays`}>
          <Image alt="" height={36} src="/logo-mark.png" width={36} />
          <span>
            <strong>MGHPM</strong>
            <small>STAYS</small>
          </span>
        </Link>
        <nav aria-label={dictionary.nav.label} className={styles.headerNav}>
          <Link aria-current="page" href={`/${locale}/stays`}>
            {dictionary.nav.explore}
          </Link>
        </nav>
        <div className={styles.headerActions}>
          <Suspense>
            <LanguageSwitch current={locale} label={dictionary.nav.language} />
          </Suspense>
          <Link className={styles.staffLink} href="/login">
            {dictionary.nav.staff}
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 14: Rutas públicas, búsqueda y tarjetas

**Files:**
- Create: `src/app/stays/page.tsx`
- Create: `src/app/[lang]/stays/layout.tsx`
- Create: `src/app/[lang]/stays/not-found.tsx`
- Create: `src/components/stays/search-form.tsx`
- Create: `src/components/stays/listing-card.tsx`
- Create: `src/app/[lang]/stays/page.tsx`

- [ ] **Step 1: Redirección por idioma**

`src/app/stays/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pickStaysLocale } from "@/lib/stays/i18n";

type StaysRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StaysRedirectPage({ searchParams }: StaysRedirectPageProps) {
  const locale = pickStaysLocale((await headers()).get("accept-language"));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of [value].flat()) if (item !== undefined) query.append(key, item);
  }
  const search = query.toString();
  redirect(`/${locale}/stays${search ? `?${search}` : ""}`);
}
```

- [ ] **Step 2: Layout público**

`src/app/[lang]/stays/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { StaysHeader } from "@/components/stays/stays-header";
import styles from "@/components/stays/stays.module.css";
import { getStaysDictionary, hasStaysLocale } from "@/lib/stays/i18n";

type StaysLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function StaysLayout({ children, params }: StaysLayoutProps) {
  const { lang } = await params;
  if (!hasStaysLocale(lang)) notFound();

  return (
    <div className={styles.page} lang={lang}>
      <StaysHeader dictionary={getStaysDictionary(lang)} locale={lang} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: 404 bilingüe**

`src/app/[lang]/stays/not-found.tsx`. `not-found` no recibe `params`, así que muestra los dos idiomas:

```tsx
import Link from "next/link";
import { getStaysDictionary, staysLocales } from "@/lib/stays/i18n";
import styles from "@/components/stays/stays.module.css";

export default function StayNotFound() {
  return (
    <div className={styles.empty}>
      {staysLocales.map((locale) => {
        const dictionary = getStaysDictionary(locale);
        return (
          <div key={locale} lang={locale}>
            <h2>{dictionary.notFound.title}</h2>
            <p>{dictionary.notFound.body}</p>
            <p>
              <Link className={styles.textLink} href={`/${locale}/stays`}>
                {dictionary.notFound.back}
              </Link>
            </p>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Formulario de búsqueda**

`src/components/stays/search-form.tsx`:

```tsx
import Link from "next/link";
import { propertyAmenities } from "@/lib/properties/schema";
import { propertyTypes } from "@/lib/properties/search-index";
import type { StaysDictionary, StaysLocale } from "@/lib/stays/i18n";
import { staySortOptions, type StaySearch } from "@/lib/stays/search";
import styles from "./stays.module.css";

const priceOptions = [100, 200, 300, 500, 700];
const countOptions = [1, 2, 3, 4];

type StaySearchFormProps = {
  areas: string[];
  dictionary: StaysDictionary;
  locale: StaysLocale;
  search: StaySearch;
  today: string;
};

/** Plain GET form: works without JavaScript and keeps the search in the URL. */
export function StaySearchForm({ areas, dictionary, locale, search, today }: StaySearchFormProps) {
  const t = dictionary.search;
  return (
    <form action={`/${locale}/stays`} className={styles.searchForm} method="get">
      <div className={styles.searchRow}>
        <label className={styles.field}>
          <span>{t.area}</span>
          <select defaultValue={search.area} name="area">
            <option value="">{t.allAreas}</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>{t.checkIn}</span>
          <input defaultValue={search.checkIn} min={today} name="checkIn" type="date" />
        </label>
        <label className={styles.field}>
          <span>{t.checkOut}</span>
          <input defaultValue={search.checkOut} min={today} name="checkOut" type="date" />
        </label>
        <label className={styles.field}>
          <span>{t.guests}</span>
          <input defaultValue={search.guests} max={30} min={1} name="guests" type="number" />
        </label>
        <label className={styles.field}>
          <span>{t.pets}</span>
          <select defaultValue={String(search.pets)} name="pets">
            <option value="0">{t.noPets}</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
      </div>

      <details className={styles.filters}>
        <summary>{t.filters}</summary>
        <div className={styles.filtersBody}>
          <label className={styles.field}>
            <span>{t.maxPrice}</span>
            <select defaultValue={search.maxPrice ?? ""} name="maxPrice">
              <option value="">{t.anyPrice}</option>
              {priceOptions.map((price) => (
                <option key={price} value={price}>
                  {price}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t.type}</span>
            <select defaultValue={search.type ?? ""} name="type">
              <option value="">{t.anyType}</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {dictionary.types[type]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t.bedrooms}</span>
            <select defaultValue={String(search.bedrooms)} name="bedrooms">
              <option value="0">{t.any}</option>
              {countOptions.map((count) => (
                <option key={count} value={count}>
                  {count}+
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t.baths}</span>
            <select defaultValue={String(search.baths)} name="baths">
              <option value="0">{t.any}</option>
              {countOptions.map((count) => (
                <option key={count} value={count}>
                  {count}+
                </option>
              ))}
            </select>
          </label>
          <fieldset className={styles.field}>
            <span>{t.amenities}</span>
            <div className={styles.checkboxes}>
              {propertyAmenities.map((amenity) => (
                <label key={amenity}>
                  <input
                    defaultChecked={search.amenities.includes(amenity)}
                    name="amenities"
                    type="checkbox"
                    value={amenity}
                  />
                  {dictionary.amenities[amenity]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles.field}>
            <span>{t.sort}</span>
            <select defaultValue={search.sort} name="sort">
              {staySortOptions.map((sort) => (
                <option key={sort} value={sort}>
                  {dictionary.sort[sort]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} type="submit">
          {t.submit}
        </button>
        <Link className={styles.textLink} href={`/${locale}/stays`}>
          {t.clear}
        </Link>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Tarjeta**

`src/components/stays/listing-card.tsx`:

```tsx
import Link from "next/link";
import { ImageOff } from "lucide-react";
import {
  formatCount,
  formatMoney,
  formatText,
  type StaysDictionary,
  type StaysLocale,
} from "@/lib/stays/i18n";
import { getPublicStayImageUrl, type PublicListing } from "@/lib/stays/listing";
import type { StayQuote } from "@/lib/stays/quote";
import type { StaySearch } from "@/lib/stays/search";
import styles from "./stays.module.css";

export function getListingTitle(listing: PublicListing, dictionary: StaysDictionary) {
  return `${listing.propertyName} — ${dictionary.listing.unit} ${listing.unitLabel}`;
}

export function getListingHref(listing: PublicListing, locale: StaysLocale, search: StaySearch) {
  const query = new URLSearchParams({ guests: String(search.guests), pets: String(search.pets) });
  if (search.checkIn && search.checkOut) {
    query.set("checkIn", search.checkIn);
    query.set("checkOut", search.checkOut);
  }
  return `/${locale}/stays/${encodeURIComponent(listing.propertyId)}/${encodeURIComponent(listing.unitId)}?${query}`;
}

export function ListingFacts({
  dictionary,
  listing,
  locale,
}: {
  dictionary: StaysDictionary;
  listing: PublicListing;
  locale: StaysLocale;
}) {
  const t = dictionary.listing;
  return (
    <ul className={styles.facts}>
      <li>{formatText(t.bedrooms, { count: listing.bedrooms })}</li>
      <li>{formatText(t.beds, { count: listing.beds })}</li>
      <li>{formatText(t.baths, { count: formatCount(listing.bathrooms, locale) })}</li>
      <li>{formatText(t.guests, { count: listing.maxGuests })}</li>
    </ul>
  );
}

type ListingCardProps = {
  dictionary: StaysDictionary;
  listing: PublicListing;
  locale: StaysLocale;
  quote: StayQuote | null;
  search: StaySearch;
};

export function ListingCard({ dictionary, listing, locale, quote, search }: ListingCardProps) {
  const title = getListingTitle(listing, dictionary);
  return (
    <article className={styles.card}>
      {listing.coverImageId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className={styles.cardImage}
          loading="lazy"
          src={getPublicStayImageUrl(listing.propertyId, listing.coverImageId, "thumbnail")}
        />
      ) : (
        <div className={styles.cardPlaceholder}>
          <ImageOff aria-hidden="true" size={28} />
          <span>{dictionary.listing.noPhoto}</span>
        </div>
      )}
      <div className={styles.cardBody}>
        <p className={styles.cardArea}>
          {[listing.city, listing.state].filter(Boolean).join(", ")} · {dictionary.types[listing.type]}
        </p>
        <h2 className={styles.cardTitle}>
          <Link href={getListingHref(listing, locale, search)}>{title}</Link>
        </h2>
        <ListingFacts dictionary={dictionary} listing={listing} locale={locale} />
        {listing.amenities.length > 0 && (
          <ul className={styles.chips}>
            {listing.amenities.slice(0, 4).map((amenity) => (
              <li key={amenity}>{dictionary.amenities[amenity]}</li>
            ))}
          </ul>
        )}
        <div className={styles.price}>
          <strong>{formatMoney(listing.nightlyRateMinor, listing.currency, locale)}</strong>
          <span>{dictionary.results.perNight}</span>
          {quote && (
            <span>
              {formatText(dictionary.results.total, {
                amount: formatMoney(quote.totalMinor, quote.currency, locale),
              })}
            </span>
          )}
        </div>
        <p>
          <Link className={styles.textLink} href={getListingHref(listing, locale, search)}>
            {dictionary.results.view}
          </Link>
        </p>
      </div>
    </article>
  );
}
```

- [ ] **Step 6: Página de búsqueda**

`src/app/[lang]/stays/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingTitle, ListingCard } from "@/components/stays/listing-card";
import { StaySearchForm } from "@/components/stays/search-form";
import styles from "@/components/stays/stays.module.css";
import { listPublicListings } from "@/lib/stays/catalog";
import {
  formatStayDate,
  formatText,
  getStaysDictionary,
  hasStaysLocale,
} from "@/lib/stays/i18n";
import type { PublicListing } from "@/lib/stays/listing";
import { getTodayDate } from "@/lib/stays/quote";
import { parseStaySearch, searchStays } from "@/lib/stays/search";

export const dynamic = "force-dynamic";

type StaysPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: StaysPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasStaysLocale(lang)) return {};
  const dictionary = getStaysDictionary(lang);
  return { title: dictionary.meta.title, description: dictionary.meta.description };
}

export default async function StaysPage({ params, searchParams }: StaysPageProps) {
  const { lang } = await params;
  if (!hasStaysLocale(lang)) notFound();

  const dictionary = getStaysDictionary(lang);
  const search = parseStaySearch(await searchParams);
  const today = getTodayDate();
  let listings: PublicListing[] = [];
  try {
    listings = await listPublicListings();
  } catch (error) {
    console.error("Unable to load the public stays catalog.", error);
  }
  const result = searchStays(listings, search, today);
  const t = dictionary.results;
  const count = result.available.length;

  return (
    <>
      <StaySearchForm
        areas={result.areas}
        dictionary={dictionary}
        locale={lang}
        search={search}
        today={today}
      />

      <div className={styles.resultsHeader}>
        <h1>{count === 1 ? t.countOne : formatText(t.countMany, { count })}</h1>
        <p>
          {result.nights !== null
            ? formatText(t.summaryDates, {
                range: `${formatStayDate(search.checkIn, lang)} – ${formatStayDate(search.checkOut, lang)}`,
                nights: result.nights,
                guests: search.guests,
              })
            : t.summaryNoDates}
        </p>
      </div>

      {result.datesIssue && (
        <p className={styles.warning} role="alert">
          {dictionary.issues[result.datesIssue]}
        </p>
      )}
      <p className={styles.notice}>{t.priceNote}</p>

      {count > 0 ? (
        <div className={styles.cards}>
          {result.available.map(({ listing, quote }) => (
            <ListingCard
              dictionary={dictionary}
              key={`${listing.propertyId}/${listing.unitId}`}
              listing={listing}
              locale={lang}
              quote={quote}
              search={search}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <h2>{listings.length === 0 ? t.catalogEmpty : t.emptyTitle}</h2>
          {listings.length > 0 && <p>{t.emptyHint}</p>}
        </div>
      )}

      {result.unavailable.length > 0 && (
        <section className={styles.unavailable}>
          <h2>{t.unavailableTitle}</h2>
          <ul>
            {result.unavailable.map(({ listing, issue }) => (
              <li key={`${listing.propertyId}/${listing.unitId}`}>
                <strong>{getListingTitle(listing, dictionary)}</strong> ·{" "}
                {formatText(dictionary.issues[issue], {
                  count: issue === "min_nights" ? listing.minNights : listing.maxNights,
                })}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 7: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 15: Ficha y cotización

**Files:**
- Create: `src/components/stays/quote-panel.tsx`
- Create: `src/app/[lang]/stays/[propertyId]/[unitId]/page.tsx`

- [ ] **Step 1: Panel de cotización**

`src/components/stays/quote-panel.tsx`:

```tsx
import {
  formatMoney,
  formatText,
  type StaysDictionary,
  type StaysLocale,
} from "@/lib/stays/i18n";
import type { PublicListing } from "@/lib/stays/listing";
import type { QuoteResult } from "@/lib/stays/quote";
import type { StaySearch } from "@/lib/stays/search";
import styles from "./stays.module.css";

type QuotePanelProps = {
  action: string;
  dictionary: StaysDictionary;
  listing: PublicListing;
  locale: StaysLocale;
  result: QuoteResult | null;
  search: StaySearch;
  today: string;
};

/** GET form back to the same page; the server computes the quote. */
export function QuotePanel({ action, dictionary, listing, locale, result, search, today }: QuotePanelProps) {
  const t = dictionary.detail;
  return (
    <div className={styles.panel}>
      <h2>{t.quoteTitle}</h2>
      <p className={styles.price}>
        <strong>{formatMoney(listing.nightlyRateMinor, listing.currency, locale)}</strong>
        <span>{dictionary.results.perNight}</span>
      </p>
      <form action={action} className={styles.searchForm} method="get">
        <label className={styles.field}>
          <span>{dictionary.search.checkIn}</span>
          <input defaultValue={search.checkIn} min={today} name="checkIn" required type="date" />
        </label>
        <label className={styles.field}>
          <span>{dictionary.search.checkOut}</span>
          <input defaultValue={search.checkOut} min={today} name="checkOut" required type="date" />
        </label>
        <label className={styles.field}>
          <span>{dictionary.search.guests}</span>
          <input
            defaultValue={search.guests}
            max={listing.maxGuests}
            min={1}
            name="guests"
            type="number"
          />
        </label>
        <label className={styles.field}>
          <span>{dictionary.search.pets}</span>
          <select defaultValue={String(search.pets)} name="pets">
            <option value="0">{dictionary.search.noPets}</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
        <button className={styles.primaryButton} type="submit">
          {t.quoteSubmit}
        </button>
      </form>

      {result === null && <p>{t.chooseDates}</p>}
      {result && !result.ok && (
        <p className={styles.error} role="alert">
          {formatText(dictionary.issues[result.issue], {
            max: listing.maxGuests,
            count: result.issue === "max_nights" ? listing.maxNights : listing.minNights,
          })}
        </p>
      )}
      {result?.ok && (
        <dl className={styles.breakdown}>
          <div>
            <dt>
              {formatText(t.nightsLine, {
                rate: formatMoney(result.quote.nightlyRateMinor, result.quote.currency, locale),
                nights: result.quote.nights,
              })}
            </dt>
            <dd>{formatMoney(result.quote.subtotalMinor, result.quote.currency, locale)}</dd>
          </div>
          {result.quote.cleaningFeeMinor > 0 && (
            <div>
              <dt>{t.cleaning}</dt>
              <dd>{formatMoney(result.quote.cleaningFeeMinor, result.quote.currency, locale)}</dd>
            </div>
          )}
          <div className={styles.breakdownTotal}>
            <dt>{t.total}</dt>
            <dd>{formatMoney(result.quote.totalMinor, result.quote.currency, locale)}</dd>
          </div>
        </dl>
      )}
      <p className={styles.notice}>{dictionary.results.priceNote}</p>
    </div>
  );
}
```

- [ ] **Step 2: Página de la ficha**

`src/app/[lang]/stays/[propertyId]/[unitId]/page.tsx`. El formulario de solicitud se conecta en la Task 17; por ahora la página se crea sin él:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getListingTitle, ListingFacts } from "@/components/stays/listing-card";
import { QuotePanel } from "@/components/stays/quote-panel";
import styles from "@/components/stays/stays.module.css";
import { recordIdSchema } from "@/lib/properties/schema";
import { getPublicListing, listPublicListingImageIds } from "@/lib/stays/catalog";
import { formatText, getStaysDictionary, hasStaysLocale } from "@/lib/stays/i18n";
import { getPublicStayImageUrl } from "@/lib/stays/listing";
import { getTodayDate, quoteStay } from "@/lib/stays/quote";
import { parseStaySearch } from "@/lib/stays/search";

export const dynamic = "force-dynamic";

type StayDetailPageProps = {
  params: Promise<{ lang: string; propertyId: string; unitId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadListing(propertyId: string, unitId: string) {
  if (!recordIdSchema.safeParse(propertyId).success || !recordIdSchema.safeParse(unitId).success) {
    return null;
  }
  return getPublicListing(propertyId, unitId);
}

export async function generateMetadata({ params }: StayDetailPageProps): Promise<Metadata> {
  const { lang, propertyId, unitId } = await params;
  if (!hasStaysLocale(lang)) return {};
  const listing = await loadListing(propertyId, unitId);
  if (!listing) return {};
  return {
    title: getListingTitle(listing, getStaysDictionary(lang)),
    description: listing.description.slice(0, 160),
  };
}

export default async function StayDetailPage({ params, searchParams }: StayDetailPageProps) {
  const { lang, propertyId, unitId } = await params;
  if (!hasStaysLocale(lang)) notFound();
  const listing = await loadListing(propertyId, unitId);
  if (!listing) notFound();

  const dictionary = getStaysDictionary(lang);
  const t = dictionary.detail;
  const search = parseStaySearch(await searchParams);
  const today = getTodayDate();
  const result = search.checkIn && search.checkOut ? quoteStay(listing, search, today) : null;
  const imageIds = await listPublicListingImageIds(propertyId);
  const title = getListingTitle(listing, dictionary);
  const included = [
    listing.utilities.electricity && t.electricity,
    listing.utilities.water && t.water,
    listing.utilities.internet && t.internet,
  ].filter((item): item is string => Boolean(item));
  const backQuery = new URLSearchParams({ guests: String(search.guests), pets: String(search.pets) });
  if (search.checkIn) backQuery.set("checkIn", search.checkIn);
  if (search.checkOut) backQuery.set("checkOut", search.checkOut);

  return (
    <>
      <p>
        <Link className={styles.textLink} href={`/${lang}/stays?${backQuery}`}>
          <ArrowLeft aria-hidden="true" size={15} /> {t.back}
        </Link>
      </p>
      <p className={styles.cardArea}>
        {[listing.city, listing.state].filter(Boolean).join(", ")} · {dictionary.types[listing.type]}
      </p>
      <h1 className={styles.cardTitle}>{title}</h1>
      <ListingFacts dictionary={dictionary} listing={listing} locale={lang} />

      {imageIds.length > 0 && (
        <div aria-label={formatText(t.gallery, { name: title })} className={styles.gallery} role="group">
          {imageIds.slice(0, 5).map((imageId, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              key={imageId}
              loading={index === 0 ? "eager" : "lazy"}
              src={getPublicStayImageUrl(propertyId, imageId, index === 0 ? "original" : "thumbnail")}
            />
          ))}
        </div>
      )}

      <div className={styles.detail}>
        <div>
          {listing.description && (
            <section className={styles.detailSection}>
              <h2>{t.about}</h2>
              <p className={styles.description}>{listing.description}</p>
            </section>
          )}
          <section className={styles.detailSection}>
            <p>{formatText(t.stayRange, { min: listing.minNights, max: listing.maxNights })}</p>
          </section>
          <section className={styles.detailSection}>
            <h2>{t.included}</h2>
            {included.length > 0 ? (
              <>
                <ul className={styles.chips}>
                  {included.map((item) => (
                    <li key={item}>
                      <Check aria-hidden="true" size={12} /> {item}
                    </li>
                  ))}
                </ul>
                <p>{t.includedNote}</p>
              </>
            ) : (
              <p>{t.noneIncluded}</p>
            )}
          </section>
          {listing.amenities.length > 0 && (
            <section className={styles.detailSection}>
              <h2>{t.amenities}</h2>
              <ul className={styles.chips}>
                {listing.amenities.map((amenity) => (
                  <li key={amenity}>{dictionary.amenities[amenity]}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <QuotePanel
            action={`/${lang}/stays/${encodeURIComponent(propertyId)}/${encodeURIComponent(unitId)}`}
            dictionary={dictionary}
            listing={listing}
            locale={lang}
            result={result}
            search={search}
            today={today}
          />
        </aside>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 16: Esquema y servicio de solicitudes

**Files:**
- Create: `src/lib/stays/inquiry-schema.ts`
- Create: `src/lib/stays/inquiries.ts`
- Test: `src/lib/stays/inquiry-schema.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/stays/inquiry-schema.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { stayInquiryInputSchema } from "./inquiry-schema.ts";

const valid = {
  propertyId: "prop-1",
  unitId: "unit-1",
  checkIn: "2026-12-01",
  checkOut: "2026-12-04",
  guests: 2,
  pets: 0,
  name: "Ana Pérez",
  email: "ana@example.com",
  phone: "+1 (809) 555-0101",
  message: "",
  consent: true,
  locale: "es",
};

test("accepts a complete inquiry", () => {
  assert.equal(stayInquiryInputSchema.safeParse(valid).success, true);
});

test("rejects missing consent, bad email, bad phone and long messages", () => {
  for (const override of [
    { consent: false },
    { email: "not-an-email" },
    { phone: "call me" },
    { message: "x".repeat(1001) },
    { locale: "fr" },
    { guests: 0 },
  ]) {
    assert.equal(stayInquiryInputSchema.safeParse({ ...valid, ...override }).success, false, JSON.stringify(override));
  }
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./inquiry-schema.ts`.

- [ ] **Step 3: Esquema**

`src/lib/stays/inquiry-schema.ts`:

```ts
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
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm run test:unit`
Expected: todas pasan.

- [ ] **Step 5: Servicio (server-only)**

`src/lib/stays/inquiries.ts`:

```ts
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
    transaction.create(auditReference, {
      organizationId,
      action: "stay_inquiry.status_changed",
      actorUid: userUid,
      targetId: inquiryId,
      status,
      createdAt: timestamp,
    });
  });
}
```

- [ ] **Step 6: Punto de control**

Run: `npm run typecheck && npm run lint && npm run test:unit`

---

### Task 17: API pública de solicitudes y formulario

**Files:**
- Create: `src/app/api/public/stays/inquiries/route.ts`
- Create: `src/components/stays/inquiry-form.tsx`
- Modify: `src/app/[lang]/stays/[propertyId]/[unitId]/page.tsx`

- [ ] **Step 1: Ruta pública**

`src/app/api/public/stays/inquiries/route.ts`:

```ts
import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { getCatalogOrganizationId, getPublicListing } from "@/lib/stays/catalog";
import { formatText, getStaysDictionary, hasStaysLocale } from "@/lib/stays/i18n";
import {
  createStayInquiry,
  hashClientAddress,
  StayInquiryRateLimitError,
} from "@/lib/stays/inquiries";
import { stayInquiryInputSchema } from "@/lib/stays/inquiry-schema";
import { getTodayDate, quoteStay } from "@/lib/stays/quote";

export const dynamic = "force-dynamic";

/** Public stay inquiry: origin check, honeypot, validation, server-side quote, hourly limit. */
export async function POST(request: Request) {
  let body: unknown = null;
  if (request.headers.get("content-type")?.includes("application/json")) {
    body = await request.json().catch(() => null);
  }
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const locale = typeof record.locale === "string" && hasStaysLocale(record.locale) ? record.locale : "en";
  const dictionary = getStaysDictionary(locale);
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

  if (!isSameOriginRequest(request)) return fail(dictionary.errors.forbidden, 403);
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
```

- [ ] **Step 2: Formulario (cliente)**

`src/components/stays/inquiry-form.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { formatText, type StaysDictionary, type StaysLocale } from "@/lib/stays/i18n";
import styles from "./stays.module.css";

type InquiryFormProps = {
  labels: StaysDictionary["inquiry"];
  locale: StaysLocale;
  request: {
    propertyId: string;
    unitId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    pets: number;
  };
};

export function InquiryForm({ labels, locale, request }: InquiryFormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    setBusy(true);
    try {
      const response = await fetch("/api/public/stays/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          name: String(formData.get("name") ?? "").trim(),
          email,
          phone: String(formData.get("phone") ?? "").trim(),
          message: String(formData.get("message") ?? "").trim(),
          consent: formData.get("consent") === "on",
          website: String(formData.get("website") ?? ""),
          locale,
        }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
            ? body.error
            : labels.genericError;
        throw new Error(message);
      }
      setSentTo(email);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : labels.genericError);
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className={styles.success} role="status">
        <strong>{labels.successTitle}</strong>
        <p>{formatText(labels.successBody, { email: sentTo })}</p>
      </div>
    );
  }

  return (
    <form className={styles.searchForm} onSubmit={submit}>
      <h2>{labels.title}</h2>
      <p>{labels.intro}</p>
      <label className={styles.field}>
        <span>{labels.name}</span>
        <input autoComplete="name" maxLength={120} minLength={2} name="name" required />
      </label>
      <label className={styles.field}>
        <span>{labels.email}</span>
        <input autoComplete="email" maxLength={200} name="email" required type="email" />
      </label>
      <label className={styles.field}>
        <span>{labels.phone}</span>
        <input autoComplete="tel" maxLength={30} minLength={7} name="phone" required type="tel" />
      </label>
      <label className={styles.field}>
        <span>{labels.message}</span>
        <textarea maxLength={1000} name="message" rows={4} />
      </label>
      <div aria-hidden="true" className={styles.honeypot}>
        <label>
          Website
          <input autoComplete="off" name="website" tabIndex={-1} />
        </label>
      </div>
      <label className={styles.checkboxes}>
        <input name="consent" required type="checkbox" /> {labels.consent}
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.primaryButton} disabled={busy} type="submit">
        {busy ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Conectar el formulario en la ficha**

En `src/app/[lang]/stays/[propertyId]/[unitId]/page.tsx`, agrega `import { InquiryForm } from "@/components/stays/inquiry-form";`. Dentro de `<aside>`, después de `<QuotePanel … />`:

```tsx
          {result?.ok ? (
            <InquiryForm
              labels={dictionary.inquiry}
              locale={lang}
              request={{
                propertyId,
                unitId,
                checkIn: search.checkIn,
                checkOut: search.checkOut,
                guests: search.guests,
                pets: search.pets,
              }}
            />
          ) : (
            <p className={styles.notice}>{dictionary.inquiry.needsQuote}</p>
          )}
```

- [ ] **Step 4: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 18: Bandeja de solicitudes del staff

**Files:**
- Create: `src/app/api/stay-inquiries/[inquiryId]/route.ts`
- Create: `src/components/stays/inquiry-status-buttons.tsx`
- Create: `src/app/stay-inquiries/page.tsx`
- Modify: `src/components/layout/admin-shell.tsx`

- [ ] **Step 1: Ruta de estado**

`src/app/api/stay-inquiries/[inquiryId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getPropertyWriteAccess } from "@/lib/properties/access";
import { recordIdSchema } from "@/lib/properties/schema";
import { setStayInquiryStatus, StayInquiryNotFoundError } from "@/lib/stays/inquiries";
import { stayInquiryStatusInputSchema } from "@/lib/stays/inquiry-schema";

export const dynamic = "force-dynamic";

type InquiryRouteContext = {
  params: Promise<{ inquiryId: string }>;
};

export async function PATCH(request: Request, { params }: InquiryRouteContext) {
  const { inquiryId } = await params;
  if (!recordIdSchema.safeParse(inquiryId).success) {
    return NextResponse.json({ error: "La solicitud seleccionada no es válida." }, { status: 400 });
  }

  const body = await readJsonRequestBody(request, stayInquiryStatusInputSchema);
  if ("response" in body) return body.response;

  const access = await getPropertyWriteAccess();
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  try {
    await setStayInquiryStatus(access.organizationId, inquiryId, body.data.status, access.userUid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StayInquiryNotFoundError) {
      return NextResponse.json({ error: "No se encontró la solicitud." }, { status: 404 });
    }
    console.error("Unable to update stay inquiry.", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud. Inténtalo más tarde." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Botones de estado (cliente)**

`src/components/stays/inquiry-status-buttons.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestCsrfToken } from "@/components/auth/client-security";
import type { StayInquiryStatus } from "@/lib/stays/inquiry-schema";
import styles from "@/app/properties/page.module.css";

const actions: Record<StayInquiryStatus, { status: StayInquiryStatus; label: string }[]> = {
  new: [
    { status: "contacted", label: "Marcar contactada" },
    { status: "closed", label: "Cerrar" },
  ],
  contacted: [{ status: "closed", label: "Cerrar" }],
  closed: [{ status: "new", label: "Reabrir" }],
};

export function InquiryStatusButtons({ inquiryId, status }: { inquiryId: string; status: StayInquiryStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: StayInquiryStatus) {
    setBusy(true);
    setError(null);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(`/api/stay-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar la solicitud.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {actions[status].map((action) => (
        <button disabled={busy} key={action.status} onClick={() => change(action.status)} type="button">
          {action.label}
        </button>
      ))}
      {error && (
        <p className={styles.muted} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Página de la bandeja**

`src/app/stay-inquiries/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { InquiryStatusButtons } from "@/components/stays/inquiry-status-buttons";
import { getOrganizationAccess } from "@/lib/auth/organization";
import { getSessionUser } from "@/lib/auth/session";
import { propertyManagementRoles } from "@/lib/properties/access";
import { formatMoney, formatStayDate } from "@/lib/stays/i18n";
import { listStayInquiries } from "@/lib/stays/inquiries";
import { stayInquiryStatuses, type StayInquiryStatus } from "@/lib/stays/inquiry-schema";
import listStyles from "../properties/page.module.css";

export const metadata: Metadata = {
  title: "Solicitudes de estadía",
};

const statusLabels: Record<StayInquiryStatus, string> = {
  new: "Nueva",
  contacted: "Contactada",
  closed: "Cerrada",
};

const searchSchema = z.object({
  status: z.enum(stayInquiryStatuses).optional().catch(undefined),
});

type StayInquiriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StayInquiriesPage({ searchParams }: StayInquiriesPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const access = await getOrganizationAccess(user.uid);
  if (access.memberships.length === 0) redirect("/onboarding");
  if (!access.activeOrganization) redirect("/organizations/select");

  const shellProps = {
    activeOrganizationId: access.activeOrganization.organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };
  if (!propertyManagementRoles.has(access.activeOrganization.role)) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const { status } = searchSchema.parse(await searchParams);
  const inquiries = await listStayInquiries(access.activeOrganization.organizationId);
  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const visible = status ? inquiries.filter((inquiry) => inquiry.status === status) : inquiries;
  const dateFormatter = new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AdminShell {...shellProps}>
      <section className={listStyles.content}>
        <div className={listStyles.heading}>
          <p className={listStyles.eyebrow}>CATÁLOGO PÚBLICO</p>
          <h1>Solicitudes de estadía</h1>
          <p>
            {newCount === 1 ? "1 solicitud nueva" : `${newCount} solicitudes nuevas`}. Llegan desde
            el formulario de cada estadía publicada.
          </p>
        </div>

        <nav aria-label="Filtrar por estado" className={listStyles.filters}>
          <Link aria-current={!status ? "page" : undefined} href="/stay-inquiries">
            Todas
          </Link>
          {stayInquiryStatuses.map((item) => (
            <Link
              aria-current={status === item ? "page" : undefined}
              href={`/stay-inquiries?status=${item}`}
              key={item}
            >
              {statusLabels[item]}
            </Link>
          ))}
        </nav>

        {visible.length > 0 ? (
          <div className={listStyles.tableScroller}>
            <table className={listStyles.table}>
              <thead>
                <tr>
                  <th scope="col">Recibida</th>
                  <th scope="col">Estadía</th>
                  <th scope="col">Fechas</th>
                  <th scope="col">Contacto</th>
                  <th scope="col">Total</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>{inquiry.createdAt ? dateFormatter.format(inquiry.createdAt) : "—"}</td>
                    <td>
                      <Link href={`/properties/${encodeURIComponent(inquiry.propertyId)}?tab=units`}>
                        {inquiry.listingTitle}
                      </Link>
                    </td>
                    <td>
                      {formatStayDate(inquiry.checkIn, "es")} – {formatStayDate(inquiry.checkOut, "es")}
                      <br />
                      <span className={listStyles.muted}>
                        {inquiry.nights} noches · {inquiry.guests} huéspedes
                        {inquiry.pets > 0 ? ` · ${inquiry.pets} mascotas` : ""}
                      </span>
                    </td>
                    <td>
                      <strong>{inquiry.name}</strong>
                      <br />
                      <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                      <br />
                      <a href={`tel:${inquiry.phone.replace(/[^0-9+]/g, "")}`}>{inquiry.phone}</a>
                      {inquiry.message && (
                        <>
                          <br />
                          <span className={listStyles.muted}>{inquiry.message}</span>
                        </>
                      )}
                    </td>
                    <td>{formatMoney(inquiry.quote.totalMinor, inquiry.quote.currency, "es")}</td>
                    <td>
                      <span className={listStyles.statusBadge}>{statusLabels[inquiry.status]}</span>
                      <InquiryStatusButtons inquiryId={inquiry.id} status={inquiry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={listStyles.emptyState}>
            <span className={listStyles.stateIcon}>
              <Inbox aria-hidden="true" size={23} />
            </span>
            <h3>No hay solicitudes</h3>
            <p>Cuando alguien solicite una estadía publicada, aparecerá aquí.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
```

- [ ] **Step 4: Entrada en el menú**

En `src/components/layout/admin-shell.tsx`, agrega `Inbox` al import de `lucide-react` y, en `navigationItems`, después de la línea de `/leases`:

```ts
  { href: "/stay-inquiries", label: "Solicitudes de estadía", icon: Inbox, management: true },
```

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint`

Abre `/stay-inquiries` en el navegador y comprueba que el filtro (`.filters`) se ve bien. Si los estilos de `listStyles.filters` esperan otra estructura, envuelve los enlaces como lo hace `src/app/properties/page.tsx`.

---

### Task 19: Enlace en la landing

**Files:**
- Modify: `src/components/landing/landing-page.tsx`

- [ ] **Step 1: Enlace**

En `<nav className={styles.navigation} …>`, antes de `<a href="#services">Services</a>`:

```tsx
            <Link href="/stays">Explore stays</Link>
```

- [ ] **Step 2: Punto de control**

Run: `npm run typecheck && npm run lint`

---

### Task 20: E2E del catálogo, imágenes en disco y documentación

**Files:**
- Modify: `scripts/e2e/images.mjs`
- Create: `scripts/e2e/stays.mjs`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Arreglar `images.mjs` para el almacenamiento local**

En `scripts/e2e/images.mjs`, reemplaza las líneas 25-33 (desde `process.env.FIREBASE_STORAGE_EMULATOR_HOST` hasta el cierre de `storedFiles`) por:

```js
const { readdir } = await import("node:fs/promises");
const storageRoot = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), "storage");

async function storedFiles(propertyId, imageId) {
  const folder = path.join(storageRoot, "organizations", "org-a", "properties", propertyId, "images", imageId);
  return (await readdir(folder).catch(() => [])).sort();
}
```

Cambia el comentario de la línea 1 a `// E2E check for property images (local server storage) against` y el texto del check de la línea 183 a `"deleted image files removed from storage"`.

- [ ] **Step 2: Escribir `stays.mjs`**

`scripts/e2e/stays.mjs`:

```js
// E2E check for the public stays catalog (Master 29, subproject A) against the
// Firebase emulators. Requires a dev server on port 3100 started with
// PUBLIC_CATALOG_ORGANIZATION_ID=org-a; see README.md. Wipes demo-mghpm data.
import { createRequire } from "node:module";
import path from "node:path";
import {
  api,
  BASE,
  check,
  db,
  finish,
  login,
  propertyWizardDefaults,
  resetEmulators,
  seedOrganization,
  signUp,
} from "./lib.mjs";

const require = createRequire(path.join(process.cwd(), "package.json"));
const sharp = require("sharp");

function isoDate(daysFromToday) {
  return new Date(Date.now() + daysFromToday * 86_400_000).toISOString().slice(0, 10);
}

async function publicPage(url) {
  const response = await fetch(`${BASE}${url}`, { redirect: "manual" });
  return { status: response.status, html: await response.text(), location: response.headers.get("location") };
}

async function inquiry(body, { origin = BASE, ip = "203.0.113.10" } = {}) {
  const response = await fetch(`${BASE}/api/public/stays/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, "X-Forwarded-For": ip },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function uploadImage(session, propertyId) {
  const csrf = (await (await fetch(`${BASE}/api/auth/csrf`)).json()).csrfToken;
  const bytes = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 0, g: 107, b: 104 } } })
    .jpeg()
    .toBuffer();
  const body = new FormData();
  body.append("file", new Blob([bytes], { type: "image/jpeg" }), "sala.jpg");
  const response = await fetch(`${BASE}/api/properties/${propertyId}/images`, {
    method: "POST",
    headers: { Origin: BASE, "X-CSRF-Token": csrf, Cookie: `mghpm_session=${session}; mghpm_csrf=${csrf}` },
    body,
  });
  return (await response.json()).imageId;
}

const property = {
  ...propertyWizardDefaults,
  name: "Torre Mar",
  code: "TM-1",
  type: "apartment_condo",
  status: "active",
  rentalCategory: "short_term",
  description: "Frente al mar.",
  address: "Calle Secreta 77",
  city: "Punta Cana",
  state: "La Altagracia",
  postalCode: "23000",
  country: "DO",
  cleaningFee: "80",
  amenities: ["pool"],
};
const unitBase = {
  label: "101",
  floor: "1",
  bedrooms: 2,
  bathrooms: 1,
  status: "available",
  marketRent: "999",
  marketRentCurrency: "USD",
};
const stay = { published: true, nightlyRate: "150", maxGuests: "4", beds: "2", minNights: "2", maxNights: "28" };

await resetEmulators();
const owner = await signUp("owner@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"]]);
const session = await login(owner.idToken);

console.log("Staff — configure and publish");
let result = await api(session, "POST", "/api/properties", property);
check("create short-term property", result.status === 201, JSON.stringify(result));
const propertyId = result.body?.propertyId;
result = await api(session, "POST", "/api/properties", { ...property, code: "LT-1", name: "Largo Plazo", rentalCategory: "long_term" });
const longTermId = result.body?.propertyId;
result = await api(session, "POST", `/api/properties/${longTermId}/units`, { ...unitBase, stay });
check("publishing on a long-term property returns 409", result.status === 409, JSON.stringify(result));

result = await api(session, "POST", `/api/properties/${propertyId}/units`, { ...unitBase, stay: { ...stay, published: false } });
check("create unpublished unit", result.status === 201, JSON.stringify(result));
const unitId = result.body?.unitId;
const imageId = await uploadImage(session, propertyId);

let page = await publicPage("/en/stays");
check("unpublished unit is not listed", page.status === 200 && !page.html.includes("Torre Mar"));
let image = await fetch(`${BASE}/api/public/stays/images/${propertyId}/${imageId}?variant=thumbnail`);
check("image is private while nothing is published", image.status === 404);

result = await api(session, "PATCH", `/api/properties/${propertyId}/units/${unitId}`, { ...unitBase, stay });
check("publish unit", result.status === 200, JSON.stringify(result));
const stored = (await db.doc(`organizations/org-a/properties/${propertyId}/units/${unitId}`).get()).data();
check("stay stored in minor units", stored?.stay?.nightlyRateMinor === 15000 && stored?.stay?.maxGuests === 4);

console.log("Public — search and detail");
page = await publicPage("/stays");
check("/stays redirects to a locale", page.status === 307 && /\/(en|es)\/stays/.test(page.location ?? ""));
page = await publicPage("/en/stays");
check("published unit is listed", page.html.includes("Torre Mar"));
for (const secret of ["Calle Secreta", "TM-1", "999"]) {
  check(`catalog does not expose ${secret}`, !page.html.includes(secret));
}
check("guest filter excludes unit", !(await publicPage("/en/stays?guests=5")).html.includes("Torre Mar"));
check("pets filter excludes unit", !(await publicPage("/en/stays?pets=1")).html.includes("Torre Mar"));
check("price filter excludes unit", !(await publicPage("/en/stays?maxPrice=100")).html.includes("Torre Mar"));
page = await publicPage(`/en/stays?checkIn=${isoDate(10)}&checkOut=${isoDate(11)}`);
check("one night moves the unit to unavailable", page.html.includes("Not available for your dates"));

const checkIn = isoDate(10);
const checkOut = isoDate(13);
page = await publicPage(`/es/stays/${propertyId}/${unitId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
check("detail renders", page.status === 200 && page.html.includes("Torre Mar"));
check("detail quotes 3 × 150 + 80 = 530", page.html.includes("530"));
check("detail does not expose the address", !page.html.includes("Calle Secreta"));
image = await fetch(`${BASE}/api/public/stays/images/${propertyId}/${imageId}?variant=thumbnail`);
check("image is public once published", image.status === 200);
check("unknown unit is 404", (await publicPage(`/es/stays/${propertyId}/nope`)).status === 404);

console.log("Public — inquiries");
const inquiryBody = {
  propertyId,
  unitId,
  checkIn,
  checkOut,
  guests: 2,
  pets: 0,
  name: "Ana Pérez",
  email: "ana@example.com",
  phone: "+1 809 555 0101",
  message: "Llegamos tarde.",
  consent: true,
  locale: "es",
  totalMinor: 1,
};
result = await inquiry(inquiryBody);
check("valid inquiry returns 201", result.status === 201, JSON.stringify(result));
let saved = await db.collection("organizations/org-a/stayInquiries").get();
const savedInquiry = saved.docs[0]?.data();
check("inquiry stored with server quote", saved.size === 1 && savedInquiry?.quote?.totalMinor === 53000 && savedInquiry?.status === "new");
check("client total is ignored", savedInquiry?.totalMinor === undefined);
const rateDocs = await db.collection("organizations/org-a/inquiryRateLimits").get();
check("rate limit stores a hash, not the IP", rateDocs.docs.every((doc) => !doc.id.includes("203.0.113.10")));

result = await inquiry({ ...inquiryBody, website: "http://spam.example" });
saved = await db.collection("organizations/org-a/stayInquiries").get();
check("honeypot answers 201 and stores nothing", result.status === 201 && saved.size === 1);
check("foreign origin returns 403", (await inquiry(inquiryBody, { origin: "http://evil.example" })).status === 403);
check("invalid body returns 400", (await inquiry({ ...inquiryBody, consent: false })).status === 400);
check("too many guests returns 409", (await inquiry({ ...inquiryBody, guests: 9 }, { ip: "203.0.113.20" })).status === 409);

for (let index = 0; index < 4; index += 1) await inquiry(inquiryBody, { ip: "203.0.113.30" });
result = await inquiry(inquiryBody, { ip: "203.0.113.30" });
check("fifth request from one IP is accepted", result.status === 201);
result = await inquiry(inquiryBody, { ip: "203.0.113.30" });
check("sixth request from one IP returns 429", result.status === 429, JSON.stringify(result));

console.log("Staff — inbox");
const inquiryId = saved.docs[0].id;
result = await api(session, "PATCH", `/api/stay-inquiries/${inquiryId}`, { status: "contacted" });
check("staff marks inquiry contacted", result.status === 200);
const audit = await db.collection("organizations/org-a/auditEvents").where("action", "==", "stay_inquiry.status_changed").get();
check("status change is audited", audit.size === 1);

console.log("Visibility — hide again");
await db.doc(`organizations/org-a/properties/${propertyId}`).update({ archived: true });
check("archived property hides the unit", !(await publicPage("/en/stays")).html.includes("Torre Mar"));
check("archived property detail is 404", (await publicPage(`/en/stays/${propertyId}/${unitId}`)).status === 404);
await db.doc(`organizations/org-a/properties/${propertyId}`).update({ archived: false });
await db.doc(`organizations/org-a/properties/${propertyId}/units/${unitId}`).update({ activeLeaseId: "lease-x" });
check("active lease hides the unit", !(await publicPage("/en/stays")).html.includes("Torre Mar"));

finish();
```

- [ ] **Step 3: Agregar a la suite**

En `package.json`, en `"test:e2e"`, agrega al final `&& node scripts/e2e/stays.mjs`.

- [ ] **Step 4: README**

En `README.md`:
- En la lista de la sección "Prueba end-to-end", agrega `` `scripts/e2e/stays.mjs` (Master 29, catálogo público) `` y cambia `(imágenes en Storage)` por `(imágenes en almacenamiento local)`.
- En el comando del paso 2, quita `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 FIREBASE_STORAGE_BUCKET=demo-mghpm.appspot.com` y agrega `PUBLIC_CATALOG_ORGANIZATION_ID=org-a`.
- Reemplaza la sección "Imágenes de propiedades (Firebase Storage)" por:

```markdown
## Imágenes de propiedades (almacenamiento local)

Las imágenes se guardan en el disco del servidor, fuera de `public/`, bajo `storage/organizations/{orgId}/properties/{propertyId}/images/{imageId}/` (`original.*` y `thumbnail.webp` de 640×480). `LOCAL_STORAGE_DIR` cambia la carpeta. Firestore guarda los metadatos y la propiedad proyecta `imageCount` y `coverImageId`. El staff las lee por `/api/properties/[id]/images` con sesión y rol. El catálogo público las sirve por `/api/public/stays/images/...` solo mientras la propiedad tenga una estadía visible. En producción el servidor necesita un disco persistente.

## Catálogo público de estadías (Master 29)

`/es/stays` y `/en/stays` muestran las unidades publicadas de `PUBLIC_CATALOG_ORGANIZATION_ID`. Una unidad aparece si la propiedad está activa, sin archivar, es de corto plazo o de ambos tipos y tiene moneda, y si la unidad está disponible, sin contrato activo, publicada y con tarifa. Las solicitudes se guardan en `organizations/{orgId}/stayInquiries` y el staff las atiende en `/stay-inquiries`.
```

- [ ] **Step 5: Ejecutar la suite completa**

Sigue el README: emuladores (`npx firebase-tools emulators:start --project demo-mghpm --only auth,firestore`) y servidor en el puerto 3100 con `PUBLIC_CATALOG_ORGANIZATION_ID=org-a`. Luego:

Run: `npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e`
Expected: unitarias `# fail 0`, y cada suite e2e termina con `0 failed`.

Si `"detail quotes … 530"` falla porque el formato muestra `US$530`, la prueba sigue siendo válida porque busca `530`. Si falla por separador de miles, revisa `formatMoney`.

- [ ] **Step 6: Revisión manual**

Con el servidor de desarrollo normal y `PUBLIC_CATALOG_ORGANIZATION_ID` en `.env.local`:
1. Pon una propiedad tuya en "Corto plazo", edita una unidad, llena "Estancias cortas" y marca "Publicar".
2. Abre `/es/stays` en 360 px y en escritorio. Revisa las tarjetas, los filtros y el cambio ES/EN.
3. Abre la ficha, cotiza y envía una solicitud. Comprueba que aparece en `/stay-inquiries`.

---

## Cambios respecto al spec (decididos al escribir el plan)

- **Sin caché del catálogo en A:** se lee en cada visita. Con una sola organización y poco inventario no hace falta, y así lo que publica el staff se ve al instante. Si el inventario crece, se puede agregar `unstable_cache` con una etiqueta y `revalidateTag` al guardar.
- **Publicar exige solo una propiedad de corto plazo con moneda:** que la propiedad esté activa, que la unidad esté disponible y que no tenga contrato no bloquean el guardado. Se pueden preparar unidades antes y la regla de visibilidad las oculta hasta que cumplan. El detalle muestra "Publicada · oculta" con el motivo.
- **Contador de solicitudes nuevas en la bandeja, no en el menú:** el menú lo pinta `AdminShell`, un componente cliente que usan todas las páginas. Ponerle el contador obligaría a cambiar cada página.
- **`maxGuests` es obligatorio** (por defecto 2) en vez de nullable.
- **Landing:** el enlace "Explore stays" va en la navegación, no en el hero.
- **Se corrige `scripts/e2e/images.mjs`,** que leía del bucket de Storage después del cambio a disco local.
