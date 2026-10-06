import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";
import { AREA_ACCESS, DASHBOARD_BY_ROLE } from "@/lib/roles";

/** First line of defence. The database (RLS) is the real enforcement layer. */
export async function proxy(request: NextRequest) {
  const { response, user, role } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const area = Object.keys(AREA_ACCESS).find((p) => pathname === p || pathname.startsWith(p + "/"));

  if (area) {
    if (!user || !role) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!AREA_ACCESS[area].includes(role)) {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role], request.url));
    }
  }

  // Signed-in users don't need the auth pages
  if (user && role && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role], request.url));
  }
  return response;
}

// Next.js convention also accepts standard export as default or named middleware/proxy
export const middleware = proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
