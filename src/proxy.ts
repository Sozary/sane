import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    publicRoutes.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/notifications/check-macros")
  ) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth).*)",
  ],
};
