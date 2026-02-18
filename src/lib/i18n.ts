export const locales = ["en", "ro"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/**
 * Maps URL locale codes to Kontent.ai language codenames.
 * Kontent.ai uses "default" for the primary language (English).
 */
export const localeToKontentLanguage: Record<Locale, string> = {
  en: "default",
  ro: "ro",
};

/** Maps locale codes to date formatting locales. */
export const localeToDateLocale: Record<Locale, string> = {
  en: "en-US",
  ro: "ro-RO",
};

/** Language display names for the language switcher. */
export const localeDisplayNames: Record<Locale, string> = {
  en: "EN",
  ro: "RO",
};

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Prefixes internal URLs with the locale. Leaves external URLs,
 * anchors, and mailto links untouched.
 */
export function localizeHref(href: string, locale: string): string {
  if (
    !href ||
    href.startsWith("http") ||
    href.startsWith("#") ||
    href.startsWith("mailto:")
  ) {
    return href;
  }
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}
