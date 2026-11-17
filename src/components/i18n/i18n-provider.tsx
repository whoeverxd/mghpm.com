"use client";

import { createContext, useContext, useMemo } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createFormatter } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";

type I18nValue = { locale: Locale; t: Dictionary; format: ReturnType<typeof createFormatter> };

const I18nContext = createContext<{ locale: Locale; texts: Partial<Dictionary> } | null>(null);

/**
 * Client texts of the request's language. Only the namespaces client
 * components need are sent (see `ClientTexts`); nested providers add theirs
 * to the ones above them.
 */
export function I18nProvider({
  locale,
  texts,
  children,
}: {
  locale: Locale;
  texts: Partial<Dictionary>;
  children: React.ReactNode;
}) {
  const parent = useContext(I18nContext);
  const value = useMemo(() => ({ locale, texts: { ...parent?.texts, ...texts } }), [locale, parent, texts]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>.");
  return useMemo(() => {
    // A missing namespace is a wiring bug: fail loudly instead of rendering "undefined".
    const t = new Proxy(value.texts, {
      get(target, key) {
        if (typeof key === "string" && !(key in target)) {
          throw new Error(`i18n namespace "${key}" was not provided to the client (wrap it in <ClientTexts>).`);
        }
        return Reflect.get(target, key);
      },
    }) as Dictionary;
    return { locale: value.locale, t, format: createFormatter(value.locale) };
  }, [value]);
}
