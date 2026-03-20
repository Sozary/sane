import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes and API auth routes
  if (
    publicRoutes.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Not authenticated → redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated → allow
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public files
     * - API auth routes (handled by NextAuth)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth).*)",
  ],
};
