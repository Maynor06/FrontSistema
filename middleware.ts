import { NextResponse } from "next/server";

/** Rutas que requieren autenticación */
const PROTECTED_PATHS = ["/dashboard"];
/** Si está autenticado y entra a "/" lo redirige al dashboard */
const AUTH_REDIRECT = "/dashboard";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // Sin token intentando acceder a ruta protegida → login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Con token intentando ir al login → dashboard
  if (pathname === "/" && token) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_REDIRECT;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
