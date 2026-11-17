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

/**
 * Public URL of the catalog in each language. next.config.ts rewrites these
 * to the internal /[lang]/stays routes, so both languages share one page.
 */
export const staysBasePaths: Record<StaysLocale, string> = { en: "/stays", es: "/estancias" };

export function getStaysPath(locale: StaysLocale, propertyId?: string, unitId?: string) {
  const base = staysBasePaths[locale];
  return propertyId && unitId
    ? `${base}/${encodeURIComponent(propertyId)}/${encodeURIComponent(unitId)}`
    : base;
}

/** The same catalog page in another language, from any public or internal stays path. */
export function switchStaysPath(pathname: string, locale: StaysLocale) {
  const match = pathname.match(/^(?:\/(?:es|en))?\/(?:stays|estancias)(\/[^/]+\/[^/]+)?\/?$/);
  return `${staysBasePaths[locale]}${match?.[1] ?? ""}`;
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
    home: "Inicio",
    destinations: "Destinos",
    favorites: "Favoritos",
    signIn: "Iniciar sesión",
    tagline: "by My Global Hub International Realty",
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
  home: {
    heroTitle: "Estancias a las que querrás volver.",
    heroSubtitle:
      "Villas, casas de playa y apartamentos administrados por My Global Hub, con el precio total visible antes de enviar tu solicitud.",
    heroNote: "No necesitas una cuenta para explorar.",
    adults: "Adultos",
    children: "Niños",
    decrease: "Quitar uno: {label}",
    increase: "Agregar uno: {label}",
    destinationsTitle: "Destinos destacados",
    destinationOne: "1 estancia",
    destinationMany: "{count} estancias",
    staysTitle: "Estancias destacadas",
    favoritesTitle: "Tus favoritos",
    favoritesEmpty: "Aún no guardas estancias. Toca el corazón de una estancia para guardarla aquí.",
    showAll: "Ver todas las estancias",
    allTypes: "Todas",
    saveFavorite: "Guardar en favoritos",
    removeFavorite: "Quitar de favoritos",
    requestBadge: "Solicitud de reserva",
    managed: "Administrada por MGHPM",
    from: "desde",
    howTitle: "Cómo funciona la reserva",
    steps: [
      { title: "Explora con libertad", body: "Mira estancias, fotos y precios sin crear una cuenta." },
      {
        title: "Ve el precio completo",
        body: "Tarifa por noche y limpieza desglosadas antes de enviar tu solicitud.",
      },
      { title: "Envía tu solicitud", body: "Elige fechas y huéspedes y déjanos tus datos de contacto." },
      {
        title: "Te confirmamos",
        body: "Nuestro equipo revisa la disponibilidad y te contacta para cerrar la reserva.",
      },
    ],
    servicesTitle: "Servicios durante tu estancia",
    servicesBody:
      "Servicios opcionales con costo adicional. Pídelos en tu solicitud y nuestro equipo los confirma.",
    services: {
      chef: "Chef privado",
      groceries: "Compra y entrega de supermercado",
      transport: "Transporte",
      cleaning: "Limpieza adicional",
    },
    trustTitle: "Cada estancia se revisa antes de publicarse.",
    trustBody:
      "Las estancias solo aparecen después de que My Global Hub revisa la propiedad, la autorización para alquilarla y sus requisitos.",
    hostTitle: "¿Tienes una propiedad?",
    hostBody:
      "Publícala en MGH STAYS. Nuestro equipo se encarga del calendario, las tarifas, las reservas y los huéspedes.",
    hostCta: "Publica tu propiedad",
    hostSecondary: "Administración integral por MGHPM",
    footerStays: "Estancias",
    footerAccess: "Acceso",
    rights: "© {year} My Global Hub Stays. Todos los derechos reservados.",
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
    home: "Home",
    destinations: "Destinations",
    favorites: "Favorites",
    signIn: "Log in",
    tagline: "by My Global Hub International Realty",
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
  home: {
    heroTitle: "Stays worth coming back to.",
    heroSubtitle:
      "Villas, beach houses and apartments managed by My Global Hub, with the total price shown before you send your request.",
    heroNote: "No account needed to explore.",
    adults: "Adults",
    children: "Children",
    decrease: "Remove one: {label}",
    increase: "Add one: {label}",
    destinationsTitle: "Featured destinations",
    destinationOne: "1 stay",
    destinationMany: "{count} stays",
    staysTitle: "Featured stays",
    favoritesTitle: "Your favorites",
    favoritesEmpty: "You have not saved any stays yet. Tap the heart on a stay to save it here.",
    showAll: "Show all stays",
    allTypes: "All",
    saveFavorite: "Save to favorites",
    removeFavorite: "Remove from favorites",
    requestBadge: "Request to book",
    managed: "Managed by MGHPM",
    from: "from",
    howTitle: "How booking works",
    steps: [
      { title: "Explore freely", body: "Browse stays, photos and prices without creating an account." },
      {
        title: "See the full price",
        body: "Nightly rate and cleaning itemized before you send your request.",
      },
      { title: "Send your request", body: "Pick your dates and guests and leave your contact details." },
      {
        title: "We confirm",
        body: "Our team checks availability and contacts you to finalize the booking.",
      },
    ],
    servicesTitle: "Services during your stay",
    servicesBody:
      "Optional, paid services. Ask for them in your request and our team confirms them.",
    services: {
      chef: "Private chef",
      groceries: "Grocery shopping & delivery",
      transport: "Transportation",
      cleaning: "Additional cleaning",
    },
    trustTitle: "Every stay is reviewed before it is published.",
    trustBody:
      "Stays appear only after My Global Hub reviews the property, the authority to rent it and its requirements.",
    hostTitle: "Own a property?",
    hostBody:
      "List it on MGH STAYS. Our team handles the calendar, rates, reservations and guests.",
    hostCta: "List your property",
    hostSecondary: "Full management by MGHPM",
    footerStays: "Stays",
    footerAccess: "Access",
    rights: "© {year} My Global Hub Stays. All rights reserved.",
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
