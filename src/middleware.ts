import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n";

/**
 * Middleware that:
 * 1. Redirects requests without a locale prefix to /{defaultLocale}/...
 * 2. Fixes SameSite cookie attributes for draft mode in Kontent.ai's
 *    Web Spotlight iframe.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes — they don't need locale prefixing
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();

    // Still fix SameSite cookies for draft mode API routes
    if (pathname.startsWith("/api/draft")) {
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) {
        response.headers.delete("Set-Cookie");

        for (const cookie of cookies) {
          const updated = cookie
            .replace(/SameSite=Lax/i, "SameSite=None; Secure")
            .replace(/SameSite=lax/i, "SameSite=None; Secure");

          response.headers.append("Set-Cookie", updated);
        }
      }
    }

    return response;
  }

  // Check if the pathname already starts with a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale prefix, redirect to the default locale
  if (!pathnameHasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Fix SameSite cookies for draft mode API routes
  if (pathname.includes("/api/draft")) {
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) {
      response.headers.delete("Set-Cookie");

      for (const cookie of cookies) {
        const updated = cookie
          .replace(/SameSite=Lax/i, "SameSite=None; Secure")
          .replace(/SameSite=lax/i, "SameSite=None; Secure");

        response.headers.append("Set-Cookie", updated);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)" ],
};
