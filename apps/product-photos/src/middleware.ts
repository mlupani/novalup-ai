import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/app") && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (hasSession && ["/", "/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/signup", "/app/:path*"] };
