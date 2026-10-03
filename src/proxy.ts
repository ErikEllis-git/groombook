import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Optimistic routing only: send signed-out visitors to /login and signed-in
// owners past it. The dashboard page and its Server Actions re-check the
// session themselves (see requireOwner in lib/auth.ts).
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = await verifySessionToken(token);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !signedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && signedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
