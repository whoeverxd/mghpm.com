import type { Locale } from "../locales.ts";
import { en } from "./en.ts";
import { es, type Dictionary } from "./es.ts";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
