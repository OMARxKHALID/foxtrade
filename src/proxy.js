import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export const proxy = (request) => {
  if (!process.env.MONGODB_URI) return process.env.NODE_ENV === "production" ? new NextResponse("Service unavailable", { status: 503 }) : NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
};

export const config = {
  matcher: ["/admin/:path*", "/assets/:path*", "/dashboard", "/account", "/account/verification", "/account/security", "/account/share", "/support/tickets/:path*"],
};