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
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";
  try {
    const response = await fetch(`${apiBase}/auth/me`, {
      headers: { cookie: `wr_access=${cookie.value}` },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Invalid session");
    const user = await response.json();
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(url);
    redirect.cookies.delete("wr_access");
    return redirect;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"]
};
