import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

// nextUrl.clone() keeps the basePath, unlike `new URL("/x", req.url)`.
function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/app") && !hasSession) {
    return redirectTo(req, "/login");
  }
  if (hasSession && ["/", "/login", "/signup"].includes(pathname)) {
    return redirectTo(req, "/app");
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/signup", "/app/:path*"] };
