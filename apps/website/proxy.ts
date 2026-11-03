import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const protectedPath = request.nextUrl.pathname.startsWith("/account");
  if (!protectedPath) return NextResponse.next();
  const cookie = request.cookies.get("wr_access");
  if (!cookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Do not make the page request depend on a cold or temporarily unavailable API.
  // The dashboard client validates the session and can show an actionable error.
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"]
};
