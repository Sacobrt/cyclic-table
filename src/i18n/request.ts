import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, supportedLocales, defaultLocale, SupportedLocale } from "@/lib/i18n/config";

/**
 * Parse the Accept-Language header and return the best matching supported locale,
 * or null if nothing matches.
 * e.g. "hr-HR,hr;q=0.9,en-US;q=0.8,en;q=0.7" → "hr"
 */
function detectFromHeader(acceptLanguage: string | null): SupportedLocale | null {
    if (!acceptLanguage) return null;
    const candidates = acceptLanguage
        .split(",")
        .map((part) => {
            const [tag, q] = part.trim().split(";q=");
            return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1.0 };
        })
        .sort((a, b) => b.q - a.q);

    for (const { tag } of candidates) {
        // Exact match first
        const exact = supportedLocales.find((l) => l === tag) as SupportedLocale | undefined;
        if (exact) return exact;
        // Language-only prefix match (e.g. "hr-HR" → "hr")
        const prefix = tag.split("-")[0];
        const prefixed = supportedLocales.find((l) => l === prefix) as SupportedLocale | undefined;
        if (prefixed) return prefixed;
    }
    return null;
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const headerStore = await headers();

    // 1. Respect saved locale from cookie
    const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value as SupportedLocale | undefined;
    let locale: SupportedLocale =
        fromCookie && (supportedLocales as readonly string[]).includes(fromCookie)
            ? fromCookie
            : // 2. Auto-detect from browser's Accept-Language header
              (detectFromHeader(headerStore.get("accept-language")) ?? defaultLocale);

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
        // Gracefully fall back to the message key when a translation is missing
        onError(error) {
            if (error.code !== "MISSING_MESSAGE") {
                console.error(error);
            }
        },
        getMessageFallback({ namespace, key }) {
            return [namespace, key].filter(Boolean).join(".");
        },
    };
});
