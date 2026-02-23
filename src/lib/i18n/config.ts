// Cookie name used by next-intl to persist locale choice
export const LOCALE_COOKIE = "NEXT_LOCALE";

// All supported locales
export const supportedLocales = ["en", "hr"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Fallback locale when nothing matches
export const defaultLocale: SupportedLocale = "en";
