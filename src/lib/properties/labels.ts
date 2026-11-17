import type { StayVisibilityIssue } from "@/lib/stays/publishable";
import type {
  PropertyOccupancy,
  PropertyStatus,
  PropertyType,
} from "./search-index";
import type { PropertyAmenity, PropertyRentalCategory } from "./schema";
import type { UnitStatus } from "./unit-schema";

export const propertyTypeLabels: Record<PropertyType, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  industrial: "Industrial",
  mixed: "Mixto",
  land: "Terreno",
  apartment_condo: "Apartamento / Condo",
};

export const propertyStatusLabels: Record<PropertyStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
  draft: "Borrador",
};

export const propertyOccupancyLabels: Record<PropertyOccupancy, string> = {
  vacant: "Disponible",
  occupied: "Ocupada",
  maintenance: "Mantenimiento",
};

export const propertyCountryLabels = {
  DO: "República Dominicana",
  US: "Estados Unidos",
} as const;

export const unitStatusLabels: Record<UnitStatus, string> = {
  available: "Disponible",
  occupied: "Ocupada",
  maintenance: "Mantenimiento",
};

export const propertyRentalCategoryLabels: Record<PropertyRentalCategory, string> = {
  long_term: "Largo plazo",
  short_term: "Corto plazo",
  both: "Ambos",
};

export const propertyAmenityLabels: Record<PropertyAmenity, string> = {
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
};

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
