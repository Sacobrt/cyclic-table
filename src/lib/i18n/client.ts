"use client";

import { LOCALE_COOKIE } from "./config";

/**
 * Set the user locale preference on the client.
 * Writes a cookie and does a hard reload so the server re-renders with the new locale.
 */
export function setLocale(locale: string): void {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
    window.location.reload();
}

/** Read the current locale from the cookie (client-side). */
export function getLocaleClient(): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
    return match ? match[1] : null;
}
