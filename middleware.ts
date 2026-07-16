import { NextRequest, NextResponse } from "next/server";

const publicPaths = new Set(["/login", "/cadastro"]);

export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  if (
    publicPaths.has(nextUrl.pathname) ||
    request.cookies.has("wilderfeast_token")
  ) {
    return NextResponse.next();
  }

  // porque essa merda ta quebrando!!!!!!!!!!!!!!!!!!!

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${nextUrl.pathname}${nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
