import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware that fixes SameSite cookie attributes for draft mode
 * when the site is loaded inside Kontent.ai's Web Spotlight iframe.
 *
 * Next.js sets draft mode cookies with SameSite=Lax by default,
 * which breaks in cross-origin iframe contexts. This middleware
 * rewrites them to SameSite=None; Secure so the cookies persist
 * inside the Kontent.ai iframe.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only modify cookies on the draft mode API routes
  if (!request.nextUrl.pathname.startsWith("/api/draft")) {
    return response;
  }

  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) {
    // Clear original Set-Cookie headers
    response.headers.delete("Set-Cookie");

    for (const cookie of cookies) {
      // Replace SameSite=Lax with SameSite=None; Secure for iframe compatibility
      const updated = cookie
        .replace(/SameSite=Lax/i, "SameSite=None; Secure")
        .replace(/SameSite=lax/i, "SameSite=None; Secure");

      response.headers.append("Set-Cookie", updated);
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/draft/:path*", "/api/disable-draft/:path*"],
};
