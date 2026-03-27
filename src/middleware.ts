import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isAuthRoute = path.startsWith("/login") || 
                      path.startsWith("/signup") || 
                      path.startsWith("/forgot-password");
  
  const sessionCookie = request.cookies.get("chemsage.supabase.session");
  let isAuthenticated = false;
  
  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      if (session?.access_token) {
        isAuthenticated = true;
      }
    } catch {
      // Invalid cookie format
    }
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isAuthRoute) {
    const redirectUrl = new URL("/login", request.url);
    if (path !== "/") {
      redirectUrl.searchParams.set("next", path);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - images/assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
