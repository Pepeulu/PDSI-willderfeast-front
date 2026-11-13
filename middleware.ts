/** @file Encaminha visitantes sem cookie de sessão à página de login. */

import { NextRequest, NextResponse } from "next/server";

/** Páginas que podem ser abertas antes do login. */
const publicPaths = new Set(["/login", "/cadastro"]);

/** Libera páginas públicas e preserva o destino original ao redirecionar para o login. */
export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  if (
    publicPaths.has(nextUrl.pathname) ||
    request.cookies.has("wilderfeast_token")
  ) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${nextUrl.pathname}${nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

/** Aplica o redirecionamento às páginas e deixa a API e os recursos estáticos seguirem diretamente. */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
