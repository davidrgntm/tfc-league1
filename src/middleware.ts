import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // session yaratish endpointi ochiq
  if (pathname.startsWith("/api/tma/session")) return NextResponse.next();

  const isTmaPage = pathname.startsWith("/tma");
  const isTmaApi = pathname.startsWith("/api/tma");

  if (!isTmaPage && !isTmaApi) return NextResponse.next();

  const token = req.cookies.get("tfc_session")?.value;

  // /tma (bootstrap) sahifani ruxsat beramiz — u session yaratadi
  if (pathname === "/tma" || pathname === "/tma/") return NextResponse.next();

  if (!token) {
    if (isTmaApi) return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/tma";
    url.searchParams.set("need", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tma/:path*", "/api/tma/:path*"],
};
